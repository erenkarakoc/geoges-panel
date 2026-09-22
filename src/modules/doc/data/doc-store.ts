import { sql, type Kysely } from "kysely";

import { runAsUser, type DbIdentity } from "@/platform/db";

import type { RecordFacts, RecordRef } from "@/modules/doc/domain/documents";

/**
 * DOC's data layer (TASK-0107). Every read runs as the signed-in person, so row level security
 * decides what exists for them (DOC-K2); a document they may not see is simply not found.
 */

export type { DbIdentity };

type Db = Kysely<unknown>;

export type UploadRow = {
  id: string;
  documentId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  partSize: number;
  receivedBytes: number;
  storageKey: string;
  multipartUploadId: string | null;
  status: "open" | "completed" | "aborted";
};

const toUpload = (r: Record<string, unknown>): UploadRow => ({
  id: r.id as string,
  documentId: r.document_id as string,
  fileName: r.file_name as string,
  mimeType: r.mime_type as string,
  sizeBytes: Number(r.size_bytes),
  partSize: Number(r.part_size),
  receivedBytes: Number(r.received_bytes),
  storageKey: r.storage_key as string,
  multipartUploadId: (r.multipart_upload_id as string | null) ?? null,
  status: r.status as UploadRow["status"],
});

/** A new document with its first upload; the policy refuses it without the manage right. */
export function insertDocumentWithUpload(
  identity: DbIdentity,
  input: {
    record: RecordRef;
    facts: RecordFacts;
    typeCode: string;
    title: string;
    description?: string | null;
    file: { name: string; type: string; size: number };
    partSize: number;
    isSigned: boolean;
  },
) {
  return runAsUser(identity, async (db: Db) => {
    const { rows: docs } = await sql<{ id: string }>`
      insert into doc.document (record_schema, record_table, record_id, site_id, project_id,
                                record_owner_user_id, data_class, doc_type_item_id, title,
                                description)
      select ${input.record.schema}, ${input.record.table}, ${input.record.id}::uuid,
             ${input.facts.siteId}::uuid, ${input.facts.projectId}::uuid,
             ${input.facts.ownerUserId}::uuid, ${input.facts.dataClass}, t.id,
             ${input.title.trim()}, ${input.description ?? null}
        from (select doc.document_type_id(${input.typeCode}) as id) t
       where t.id is not null
      returning id`.execute(db);
    if (!docs.length) throw new Error(`unknown document type ${input.typeCode}`);
    const upload = await insertUpload(db, docs[0].id, input.file, input.partSize, input.isSigned);
    return { documentId: docs[0].id, upload };
  });
}

async function insertUpload(
  db: Db,
  documentId: string,
  file: { name: string; type: string; size: number },
  partSize: number,
  isSigned: boolean,
): Promise<UploadRow> {
  const { rows } = await sql<Record<string, unknown>>`
    insert into doc.upload (document_id, file_name, mime_type, size_bytes, part_size, is_signed)
    values (${documentId}::uuid, ${file.name}, ${file.type}, ${file.size}, ${partSize},
            ${isSigned})
    returning *`.execute(db);
  return toUpload(rows[0]);
}

/** Another version of a visible document the person may change (REQ-DOC-005). */
export function insertVersionUpload(
  identity: DbIdentity,
  documentId: string,
  file: { name: string; type: string; size: number },
  partSize: number,
  isSigned: boolean,
) {
  return runAsUser(identity, async (db: Db) => {
    const { rows } = await sql<{ id: string }>`
      select id from doc.document d
       where d.id = ${documentId}::uuid and d.status = 'active'
         and doc.can_access(d.record_schema, d.site_id, d.project_id, d.record_owner_user_id,
                            d.data_class, true)`.execute(db);
    if (!rows.length) return null;
    return insertUpload(db, documentId, file, partSize, isSigned);
  });
}

export function readUpload(identity: DbIdentity, uploadId: string) {
  return runAsUser(identity, async (db: Db) => {
    const { rows } = await sql<Record<string, unknown>>`
      select * from doc.upload where id = ${uploadId}::uuid`.execute(db);
    return rows[0] ? toUpload(rows[0]) : null;
  });
}

export function saveMultipartId(identity: DbIdentity, uploadId: string, multipartId: string) {
  return runAsUser(identity, async (db: Db) => {
    await sql`update doc.upload set multipart_upload_id = ${multipartId}, updated_at = now()
               where id = ${uploadId}::uuid`.execute(db);
  });
}

/**
 * Records a stored part if the upload is still where the part started; returns the new offset,
 * or null when another request moved it meanwhile (the caller answers 409).
 */
export function recordPart(
  identity: DbIdentity,
  uploadId: string,
  offset: number,
  part: { partNumber: number; etag: string; length: number },
) {
  return runAsUser(identity, async (db: Db) => {
    const { rows } = await sql<{ received_bytes: string }>`
      update doc.upload
         set received_bytes = received_bytes + ${part.length},
             parts = parts || jsonb_build_array(jsonb_build_object('partNumber', ${part.partNumber}::int,
                                                                   'etag', ${part.etag}::text)),
             updated_at = now()
       where id = ${uploadId}::uuid and status = 'open' and received_bytes = ${offset}
      returning received_bytes`.execute(db);
    return rows[0] ? Number(rows[0].received_bytes) : null;
  });
}

export function readParts(identity: DbIdentity, uploadId: string) {
  return runAsUser(identity, async (db: Db) => {
    const { rows } = await sql<{ parts: { partNumber: number; etag: string }[] }>`
      select parts from doc.upload where id = ${uploadId}::uuid`.execute(db);
    return rows[0]?.parts ?? [];
  });
}

export function completeUpload(identity: DbIdentity, uploadId: string, sha256: string | null) {
  return runAsUser(identity, async (db: Db) => {
    const { rows } = await sql<{ id: string }>`
      select doc.complete_upload(${uploadId}::uuid, ${sha256}) as id`.execute(db);
    return rows[0].id;
  });
}

export type VersionForDownload = {
  versionId: string;
  documentId: string;
  storageKey: string;
  fileName: string;
  mimeType: string;
};

/** A version the person may see, or null (a hidden document does not exist for them). */
export function readVisibleVersion(identity: DbIdentity, versionId: string) {
  return runAsUser(identity, async (db: Db) => {
    const { rows } = await sql<Record<string, string>>`
      select v.id, v.document_id, v.storage_key, v.file_name, v.mime_type
        from doc.document_version v join doc.document d on d.id = v.document_id
       where v.id = ${versionId}::uuid`.execute(db);
    const r = rows[0];
    return r
      ? ({
          versionId: r.id,
          documentId: r.document_id,
          storageKey: r.storage_key,
          fileName: r.file_name,
          mimeType: r.mime_type,
        } as VersionForDownload)
      : null;
  });
}

export type TextStatus = "pending" | "ready" | "failed" | "skipped";

export type DocumentSummary = {
  id: string;
  title: string;
  typeName: string;
  status: "active" | "archived";
  latest: {
    versionId: string;
    versionNo: number;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    isSigned: boolean;
    textStatus: TextStatus | null;
    lowQuality: boolean;
    uploadedAt: Date;
  } | null;
};

/** A record's documents the person may see, newest first; archived ones only on request. */
export function readDocumentsOf(identity: DbIdentity, record: RecordRef, withArchived = false) {
  return runAsUser(identity, async (db: Db) => {
    const { rows } = await sql<Record<string, unknown>>`
      select d.id, d.title, doc.document_type_name(d.doc_type_item_id) as type_name, d.status,
             v.id as version_id, v.version_no, v.file_name, v.mime_type, v.size_bytes,
             v.is_signed, v.created_at, t.status as text_status,
             coalesce(t.is_low_quality, false) as low_quality
        from doc.document d
        left join lateral (select * from doc.document_version x where x.document_id = d.id
                            order by x.version_no desc limit 1) v on true
        left join doc.extracted_text t on t.document_version_id = v.id
       where d.record_schema = ${record.schema} and d.record_table = ${record.table}
         and d.record_id = ${record.id}::uuid and (${withArchived} or d.status = 'active')
       order by d.created_at desc`.execute(db);
    return rows.map((r): DocumentSummary => ({
      id: r.id as string,
      title: r.title as string,
      typeName: r.type_name as string,
      status: r.status as DocumentSummary["status"],
      latest: r.version_id
        ? {
            versionId: r.version_id as string,
            versionNo: Number(r.version_no),
            fileName: r.file_name as string,
            mimeType: r.mime_type as string,
            sizeBytes: Number(r.size_bytes),
            isSigned: r.is_signed as boolean,
            textStatus: (r.text_status as TextStatus | null) ?? null,
            lowQuality: r.low_quality as boolean,
            uploadedAt: new Date(r.created_at as string),
          }
        : null,
    }));
  });
}

/** Archives a document with its reason (REQ-DOC-006); the database writes it to the audit log. */
export function archive(identity: DbIdentity, documentId: string, reason: string) {
  return runAsUser(identity, async (db: Db) => {
    const { rows } = await sql<{ done: boolean }>`
      select doc.archive_document(${documentId}::uuid, ${reason}) as done`.execute(db);
    return rows[0].done;
  });
}

/** Marks a version as the signed one (REQ-DOC-005). */
export function markSigned(identity: DbIdentity, versionId: string) {
  return runAsUser(identity, async (db: Db) => {
    const { rows } = await sql<{ id: string }>`
      update doc.document_version set is_signed = true where id = ${versionId}::uuid
      returning id`.execute(db);
    return rows.length > 0;
  });
}

/** What a bulk download covers (REQ-DOC-007): one record's documents, or a project's. */
export type BulkScope = { record: RecordRef } | { projectId: string };

export type BulkItem = {
  documentId: string;
  versionId: string;
  storageKey: string;
  fileName: string;
  sizeBytes: number;
  uploadedAt: Date;
};

/**
 * The newest version of every active document in the scope the person may see, and the audit
 * event naming them, in one transaction: nothing is sent that was not logged first.
 */
export function prepareBulkDownload(identity: DbIdentity, scope: BulkScope) {
  return runAsUser(identity, async (db: Db) => {
    const where =
      "record" in scope
        ? sql`d.record_schema = ${scope.record.schema} and d.record_table = ${scope.record.table}
              and d.record_id = ${scope.record.id}::uuid`
        : sql`d.project_id = ${scope.projectId}::uuid`;
    const { rows } = await sql<Record<string, unknown>>`
      select d.id as document_id, v.id as version_id, v.storage_key, v.file_name, v.size_bytes,
             v.created_at
        from doc.document d
        join lateral (select * from doc.document_version x where x.document_id = d.id
                       order by x.version_no desc limit 1) v on true
       where d.status = 'active' and ${where}
       order by d.created_at, d.id`.execute(db);
    const items = rows.map((r): BulkItem => ({
      documentId: r.document_id as string,
      versionId: r.version_id as string,
      storageKey: r.storage_key as string,
      fileName: r.file_name as string,
      sizeBytes: Number(r.size_bytes),
      uploadedAt: new Date(r.created_at as string),
    }));
    const described =
      "record" in scope
        ? {
            record_schema: scope.record.schema,
            record_table: scope.record.table,
            record_id: scope.record.id,
          }
        : { project_id: scope.projectId };
    await sql`select doc.record_bulk_download(${items.map((i) => i.documentId)}::uuid[],
                                              ${JSON.stringify(described)}::jsonb)`.execute(db);
    return items;
  });
}
