/**
 * Documents against the real database (TASK-0107, REQ-DOC, D-262, SPIKE-09/15).
 *
 * Files go to the in-memory storage adapter; the rows go to the test database. A throw-away
 * module `zzt` stands in for the modules that will own records: its permissions, four test
 * roles and people are written over the admin connection and removed afterwards together with
 * the documents, their history and their events. Audit log rows cannot be removed by design
 * (AUD-K1), so each run leaves its "document.archived" events in the log. `npm run test:db`.
 */
import pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { connectAdmin } from "../../../../scripts/db-admin.mjs";
import { readDatabaseConfig } from "@/platform/db/database-config";
import { kyselyOn } from "@/platform/db/run-as-user";
import type { DeliveredEvent } from "@/platform/jobs/types";
import { createMemoryStorage } from "@/platform/storage/memory";
import type { TextReader } from "@/platform/text-recognition/text-reader";

import { createDocumentService, DocumentError } from "../application/documents";
import { PART_BYTES, type RecordFacts } from "../domain/documents";
import { closeExpiredUploads, textRecognition } from "./doc-jobs";

const id = (n: number) => `0192f0c1-0107-7000-8000-${String(n).padStart(12, "0")}`;
const MANAGER_A = id(1);
const VIEWER_A = id(2);
const VIEWER_B = id(3);
const FINANCE_A = id(4);
const PEOPLE = [MANAGER_A, VIEWER_A, VIEWER_B, FINANCE_A];
const SITE_A = id(101);
const SITE_B = id(102);
const RECORD_A = id(201);
const RECORD_A_PRICE = id(202);
const RECORD_HIDDEN = id(203);
const RECORD_P1 = id(204);
const RECORD_P2 = id(205);
const PROJECT_1 = id(301);
const ROLES = ["T0107_MGR", "T0107_VIEW", "T0107_FIN"];
const P = "zzt";

let admin: pg.Client;
let workerPool: pg.Pool;
const role: Record<string, string> = {};
let signedIn: string | null = null;
const storage = createMemoryStorage();

/** The owning module's resolver: what `zzt` would say about its records. */
const facts: Record<string, RecordFacts> = {
  [RECORD_A]: {
    module: P,
    siteId: SITE_A,
    projectId: null,
    ownerUserId: null,
    dataClass: "internal",
  },
  [RECORD_P1]: {
    module: P,
    siteId: SITE_A,
    projectId: PROJECT_1,
    ownerUserId: null,
    dataClass: "internal",
  },
  [RECORD_P2]: {
    module: P,
    siteId: SITE_A,
    projectId: PROJECT_1,
    ownerUserId: null,
    dataClass: "commercial",
  },
  [RECORD_A_PRICE]: {
    module: P,
    siteId: SITE_A,
    projectId: null,
    ownerUserId: null,
    dataClass: "commercial",
  },
};

const service = createDocumentService({
  storage,
  records: { [`${P}.record`]: async (_identity, recordId) => facts[recordId] ?? null },
  identity: async () => (signedIn ? { userId: signedIn, actingRoleId: null } : null),
});

function as(userId: string) {
  signedIn = userId;
  return service;
}

const failure = (promise: Promise<unknown>) =>
  promise.then(
    () => "no error",
    (e: DocumentError | { hint?: string; code?: string }) =>
      e instanceof DocumentError ? e.status : (e.hint ?? e.code ?? "no code"),
  );

const record = (recordId: string) => ({ schema: P, table: "record", id: recordId });

/** Uploads a whole file in parts as the signed-in person; returns the new version id. */
async function upload(uploadId: string, bytes: Uint8Array) {
  for (let offset = 0; offset < bytes.byteLength; offset += PART_BYTES) {
    const part = bytes.subarray(offset, Math.min(offset + PART_BYTES, bytes.byteLength));
    const result = await service.putPart(uploadId, offset, part);
    expect(result.ok).toBe(true);
  }
  return (await service.complete(uploadId)).versionId;
}

async function cleanUp() {
  const { rows: docs } = await admin.query("select id from doc.document where record_schema = $1", [
    P,
  ]);
  const docIds = docs.map((r) => r.id);
  if (docIds.length) {
    const { rows: versions } = await admin.query(
      "select id from doc.document_version where document_id = any($1::uuid[])",
      [docIds],
    );
    await admin.query("select aud.purge_record_history_for_reset('doc.document', $1::uuid[])", [
      docIds,
    ]);
    await admin.query(
      "select aud.purge_record_history_for_reset('doc.document_version', $1::uuid[])",
      [versions.map((r) => r.id)],
    );
    await admin.query("begin");
    await admin.query("select set_config('aud.reset_purge', 'on', true)");
    await admin.query(
      `delete from doc.extracted_text where document_version_id in
         (select id from doc.document_version where document_id = any($1::uuid[]));
       delete from doc.upload where document_id = any($1::uuid[]);
       delete from doc.document_version where document_id = any($1::uuid[]);
       delete from doc.document where id = any($1::uuid[]);`.replaceAll(
        "$1",
        `'{${docIds.join(",")}}'`,
      ),
    );
    await admin.query("commit");
    await admin.query(
      `delete from core.outbox_delivery where outbox_id in
         (select id from core.outbox where record_schema = 'doc' and record_id = any($1::uuid[]));
       delete from core.outbox where record_schema = 'doc' and record_id = any($1::uuid[]);`.replaceAll(
        "$1",
        `'{${docIds.join(",")}}'`,
      ),
    );
  }
  const { rows } = await admin.query(
    `select 'iam.role_assignment' as t, id from iam.role_assignment where user_id = any($1)
     union all select 'iam.user', id from iam.user where id = any($1)
     union all select 'iam.role', id from iam.role where code = any($2)
     union all select 'iam.role_permission', rp.id from iam.role_permission rp
                join iam.role r on r.id = rp.role_id where r.code = any($2)
     union all select 'iam.role_data_class', d.id from iam.role_data_class d
                join iam.role r on r.id = d.role_id where r.code = any($2)
     union all select 'iam.permission', id from iam.permission where module = '${P}'`,
    [PEOPLE, ROLES],
  );
  for (const table of new Set(rows.map((r) => r.t as string))) {
    await admin.query("select aud.purge_record_history_for_reset($1, $2::uuid[])", [
      table,
      rows.filter((r) => r.t === table).map((r) => r.id),
    ]);
  }
  await admin.query("delete from iam.role_assignment where user_id = any($1)", [PEOPLE]);
  await admin.query("delete from iam.user where id = any($1)", [PEOPLE]);
  await admin.query(
    `delete from iam.role_permission where role_id in (select id from iam.role where code = any($1))
        or permission_id in (select id from iam.permission where module = '${P}')`,
    [ROLES],
  );
  await admin.query(
    "delete from iam.role_data_class where role_id in (select id from iam.role where code = any($1))",
    [ROLES],
  );
  await admin.query("delete from iam.role where code = any($1)", [ROLES]);
  await admin.query(`delete from iam.permission where module = '${P}'`);
}

beforeAll(async () => {
  admin = await connectAdmin();
  workerPool = new pg.Pool(readDatabaseConfig(process.env, undefined, "DATABASE_WORKER_URL"));
  await cleanUp();
  await admin.query(`
    insert into iam.permission (code, module, name, created_from) values
      ('${P}.module.view', '${P}', 'Deneme: görür', 'seed'),
      ('${P}.module.manage', '${P}', 'Deneme: yönetir', 'seed');
    insert into iam.role (code, name, level) values
      ('T0107_MGR', 'Deneme belge yöneten', 10), ('T0107_VIEW', 'Deneme belge gören', 10),
      ('T0107_FIN', 'Deneme finans', 10);
    insert into iam.role_permission (role_id, permission_id)
      select r.id, p.id from iam.role r, iam.permission p
       where (r.code in ('T0107_VIEW', 'T0107_FIN') and p.code = '${P}.module.view')
          or (r.code = 'T0107_MGR' and p.module = '${P}');
    insert into iam.role_data_class (role_id, module, can_see_commercial)
      select id, '${P}', true from iam.role where code in ('T0107_FIN', 'T0107_MGR');
  `);
  const { rows } = await admin.query("select code, id from iam.role where code = any($1)", [ROLES]);
  for (const r of rows) role[r.code] = r.id;
  await admin.query(
    `insert into iam.user (id, email, display_name, auth_provider_id)
     select u.id, 't0107-' || u.n || '@example.test', 'Deneme ' || u.n, u.id
       from unnest($1::uuid[]) with ordinality as u(id, n)`,
    [PEOPLE],
  );
  const assign = (user: string, code: string, site: string) =>
    admin.query(
      `insert into iam.role_assignment (user_id, role_id, scope_type, scope_ids, starts_on)
       values ($1, $2, 'site', $3, iam.today() - 1)`,
      [user, role[code], [site]],
    );
  await assign(MANAGER_A, "T0107_MGR", SITE_A);
  await assign(VIEWER_A, "T0107_VIEW", SITE_A);
  await assign(VIEWER_B, "T0107_VIEW", SITE_B);
  await assign(FINANCE_A, "T0107_FIN", SITE_A);
});

afterAll(async () => {
  await workerPool?.end();
  if (admin) {
    await cleanUp();
    await admin.end();
  }
});

const file = (size: number, type = "application/pdf", name = "Hakediş Ekim.pdf") => ({
  name,
  type,
  size,
});
const bytes = (size: number) => Uint8Array.from({ length: size }, (_, i) => i % 251);

let documentId: string;
let firstVersion: string;

describe("attaching a document (REQ-DOC-001, DOC-K2)", () => {
  it("uploads in parts, resumes after a 409 and completes into version 1", async () => {
    const size = PART_BYTES + 1234;
    const started = await as(MANAGER_A).startDocument({
      record: record(RECORD_A),
      typeCode: "progress_payment",
      title: "Ekim hakedişi",
      file: file(size),
    });
    documentId = started.documentId;
    expect(started).toMatchObject({ receivedBytes: 0, sizeBytes: size, partSize: PART_BYTES });

    const content = bytes(size);
    // A part from the wrong place is refused with the offset to continue from (SPIKE-15).
    expect(await service.putPart(started.uploadId, 100, content.subarray(100, 200))).toEqual({
      ok: false,
      status: 409,
      receivedBytes: 0,
    });
    expect(await service.putPart(started.uploadId, 0, content.subarray(0, PART_BYTES))).toEqual({
      ok: true,
      receivedBytes: PART_BYTES,
    });
    // The connection drops; the client asks where to continue.
    expect((await service.uploadState(started.uploadId)).receivedBytes).toBe(PART_BYTES);
    expect(await failure(service.complete(started.uploadId))).toBe(400);
    await service.putPart(started.uploadId, PART_BYTES, content.subarray(PART_BYTES));
    firstVersion = (await service.complete(started.uploadId)).versionId;
    // Completing again returns the same version.
    expect((await service.complete(started.uploadId)).versionId).toBe(firstVersion);

    const [doc] = await service.listFor(record(RECORD_A));
    expect(doc).toMatchObject({
      id: documentId,
      title: "Ekim hakedişi",
      typeName: "Hakediş",
      latest: {
        versionNo: 1,
        fileName: "Hakediş Ekim.pdf",
        textStatus: "pending",
        sizeBytes: size,
      },
    });
    const stored = storage.objects.get(`documents/${documentId}/${started.uploadId}`);
    expect(stored && Buffer.compare(Buffer.from(stored), Buffer.from(content))).toBe(0);

    const { rows } = await admin.query(
      "select payload from core.outbox where event_code = 'document.uploaded' and record_id = $1",
      [documentId],
    );
    expect(rows.map((r) => r.payload.version_id)).toEqual([firstVersion]);
  });

  it("refuses a record the person cannot see, a missing right and a bad file", async () => {
    const start = (userId: string, recordId: string, f = file(10)) =>
      failure(
        as(userId).startDocument({
          record: record(recordId),
          typeCode: "other",
          title: "Deneme",
          file: f,
        }),
      );
    expect(await start(MANAGER_A, RECORD_HIDDEN)).toBe(404);
    expect(await start(VIEWER_A, RECORD_A)).toBe(403);
    expect(await start(MANAGER_A, RECORD_A, file(10, "application/x-msdownload", "a.exe"))).toBe(
      400,
    );
    expect(await start(MANAGER_A, RECORD_A, file(201 * 1024 * 1024))).toBe(400);
  });

  it("keeps someone else's upload out of reach", async () => {
    const started = await as(MANAGER_A).startDocument({
      record: record(RECORD_A),
      typeCode: "photo",
      title: "Saha fotoğrafı",
      file: file(20, "image/jpeg", "saha.jpg"),
    });
    expect(await failure(as(VIEWER_A).uploadState(started.uploadId))).toBe(404);
    expect(await failure(service.putPart(started.uploadId, 0, bytes(20)))).toBe(404);
    as(MANAGER_A);
    await upload(started.uploadId, bytes(20));
  });
});

describe("who sees a document (REQ-DOC-003, SPIKE-09 rule 1)", () => {
  it("shows it on its own site only and signs no link for anyone else", async () => {
    expect((await as(VIEWER_A).listFor(record(RECORD_A))).length).toBe(2);
    expect(await as(VIEWER_B).listFor(record(RECORD_A))).toEqual([]);
    expect(await failure(as(VIEWER_B).link(firstVersion))).toBe(404);

    const link = await as(VIEWER_A).link(firstVersion, { preview: true });
    expect(link.inline).toBe(true);
    expect(decodeURIComponent(link.url)).toContain("filename*=UTF-8''Hakedi%C5%9F%20Ekim.pdf");
    expect(link.expiresSeconds).toBe(300);
  });

  it("hides a commercial record's documents from those without the commercial class", async () => {
    const started = await as(MANAGER_A).startDocument({
      record: record(RECORD_A_PRICE),
      typeCode: "invoice",
      title: "Fatura",
      file: file(30),
    });
    const version = await upload(started.uploadId, bytes(30));
    expect(await as(VIEWER_A).listFor(record(RECORD_A_PRICE))).toEqual([]);
    expect(await failure(as(VIEWER_A).link(version))).toBe(404);
    expect((await as(FINANCE_A).listFor(record(RECORD_A_PRICE))).length).toBe(1);
  });
});

describe("versions, deletion and archiving (REQ-DOC-005/006, DOC-K4)", () => {
  it("adds version 2 without touching version 1 and marks the signed one", async () => {
    const started = await as(MANAGER_A).startVersion(
      documentId,
      file(40, "application/pdf", "İmzalı.pdf"),
    );
    const second = await upload(started.uploadId, bytes(40));
    await service.markSigned(second);
    const [doc] = (await service.listFor(record(RECORD_A))).filter((d) => d.id === documentId);
    expect(doc.latest).toMatchObject({ versionNo: 2, isSigned: true, fileName: "İmzalı.pdf" });
    expect(await failure(as(VIEWER_A).startVersion(documentId, file(10)))).toBe(404);
    expect(await failure(as(VIEWER_A).markSigned(firstVersion))).toBe(404);
  });

  it("never deletes a document or a version", async () => {
    expect(await failure(admin.query("delete from doc.document where id = $1", [documentId]))).toBe(
      "doc.no_delete",
    );
    expect(
      await failure(admin.query("delete from doc.document_version where id = $1", [firstVersion])),
    ).toBe("doc.no_delete");
    expect(
      await failure(
        admin.query("update doc.document_version set file_name = 'x.pdf' where id = $1", [
          firstVersion,
        ]),
      ),
    ).toBe("doc.version_fixed");
  });

  it("archives only with a reason, out of the default list, into the audit log", async () => {
    expect(await failure(as(MANAGER_A).archive(documentId, "  "))).toBe(400);
    expect(await failure(as(VIEWER_A).archive(documentId, "yanlış belge"))).toBe(404);
    const before = (await admin.query("select clock_timestamp() as t")).rows[0].t;
    await as(MANAGER_A).archive(documentId, "yanlış kayda eklenmiş");

    const ids = (await service.listFor(record(RECORD_A))).map((d) => d.id);
    expect(ids).not.toContain(documentId);
    const archived = await service.listFor(record(RECORD_A), { withArchived: true });
    expect(archived.find((d) => d.id === documentId)?.status).toBe("archived");

    const { rows } = await admin.query(
      `select actor_user_id from aud.audit_log
        where event_type = 'document.archived' and target_id = $1 and occurred_at >= $2`,
      [documentId, before],
    );
    expect(rows.map((r) => r.actor_user_id)).toEqual([MANAGER_A]);
    const { rows: history } = await admin.query(
      `select reason from aud.record_history
        where record_schema = 'doc' and record_table = 'document' and record_id = $1
          and operation = 'update'`,
      [documentId],
    );
    expect(history.map((r) => r.reason)).toContain("yanlış kayda eklenmiş");
  });
});

describe("background work (SPIKE-15, SPIKE-16)", () => {
  /** Runs `work` in one worker transaction, as the worker does. */
  async function asWorker<T>(work: (db: ReturnType<typeof kyselyOn>) => Promise<T>) {
    const client = await workerPool.connect();
    try {
      await client.query("begin");
      const result = await work(kyselyOn(client));
      await client.query("commit");
      return result;
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  }

  const reader: TextReader = {
    async read(_bytes, mimeType) {
      if (mimeType !== "application/pdf") throw new Error("unreadable image");
      return {
        passes: ["Net: 12 . 450 kg", "Plaka 34 ABC 12 / 3"],
        confidence: 61.237,
        method: "ocr",
        pages: 1,
        pagesRead: 1,
      };
    },
    async close() {},
  };
  const recognise = textRecognition(storage, reader);
  const uploaded = (versionId: string) =>
    ({ payload: { version_id: versionId } }) as unknown as DeliveredEvent;
  const textOf = async (versionId: string) =>
    (
      await admin.query(
        `select status, method, text_content, confidence::float, is_low_quality, error
           from doc.extracted_text where document_version_id = $1`,
        [versionId],
      )
    ).rows[0];

  it("stores tidied text, flags a poor scan and leaves finished text alone", async () => {
    await asWorker((db) =>
      recognise.handle(db, uploaded(firstVersion), { readModelVersion: async () => 1 }),
    );
    expect(await textOf(firstVersion)).toMatchObject({
      status: "ready",
      method: "ocr",
      text_content: "Net: 12.450 kg\nPlaka 34 ABC 12/3",
      confidence: 61.24,
      is_low_quality: true,
      error: null,
    });
    const failing: TextReader = { ...reader, read: async () => Promise.reject(new Error("x")) };
    await asWorker((db) =>
      textRecognition(storage, failing).handle(db, uploaded(firstVersion), {
        readModelVersion: async () => 1,
      }),
    );
    expect((await textOf(firstVersion)).status).toBe("ready");
  });

  it("marks a file the reader cannot handle as failed instead of retrying it", async () => {
    const { rows } = await admin.query(
      `select v.id from doc.document_version v join doc.document d on d.id = v.document_id
        where d.record_schema = $1 and v.mime_type = 'image/jpeg'`,
      [P],
    );
    await asWorker((db) =>
      recognise.handle(db, uploaded(rows[0].id), { readModelVersion: async () => 1 }),
    );
    expect(await textOf(rows[0].id)).toMatchObject({ status: "failed", error: "unreadable image" });
  });

  it("aborts uploads left open past their expiry", async () => {
    as(MANAGER_A);
    const { rows: docs } = await admin.query(
      "select id from doc.document where record_schema = $1 and status = 'active' limit 1",
      [P],
    );
    const started = await service.startVersion(docs[0].id, file(10));
    await admin.query(
      "update doc.upload set expires_at = now() - interval '1 minute' where id = $1",
      [started.uploadId],
    );
    expect(await asWorker((db) => closeExpiredUploads(db, storage))).toBeGreaterThanOrEqual(1);
    expect((await service.uploadState(started.uploadId)).status).toBe("aborted");
    expect(await failure(service.putPart(started.uploadId, 0, bytes(10)))).toBe(400);
  });
});

/** Names and contents of a ZIP's entries, read from its central directory (stored entries). */
async function unzip(stream: ReadableStream<Uint8Array>) {
  const zip = Buffer.from(await new Response(stream).arrayBuffer());
  const end = zip.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  const count = zip.readUInt16LE(end + 10);
  let at = zip.readUInt32LE(end + 16);
  const entries: Record<string, Buffer> = {};
  for (let i = 0; i < count; i += 1) {
    expect(zip.readUInt32LE(at)).toBe(0x02014b50);
    const size = zip.readUInt32LE(at + 20);
    const nameLength = zip.readUInt16LE(at + 28);
    const skip = nameLength + zip.readUInt16LE(at + 30) + zip.readUInt16LE(at + 32);
    const local = zip.readUInt32LE(at + 42);
    const name = zip.subarray(at + 46, at + 46 + nameLength).toString("utf8");
    const data = local + 30 + zip.readUInt16LE(local + 26) + zip.readUInt16LE(local + 28);
    entries[name] = zip.subarray(data, data + size);
    at += 46 + skip;
  }
  return entries;
}

describe("bulk download (REQ-DOC-007)", () => {
  it("zips only what the person may see, names repeats apart and audits it first", async () => {
    as(MANAGER_A);
    for (const [recordId, content] of [
      [RECORD_P1, 11],
      [RECORD_P1, 12],
      [RECORD_P2, 13],
    ] as const) {
      const started = await service.startDocument({
        record: record(recordId),
        typeCode: "delivery_note",
        title: "İrsaliye",
        file: file(content, "application/pdf", "İrsaliye.pdf"),
      });
      await upload(started.uploadId, bytes(content));
    }
    const before = (await admin.query("select clock_timestamp() as t")).rows[0].t;

    const viewer = await as(VIEWER_A).bulkDownload({ projectId: PROJECT_1 });
    expect(viewer.count).toBe(2);
    const files = await unzip(viewer.zip);
    expect(Object.keys(files)).toEqual(["İrsaliye.pdf", "İrsaliye (2).pdf"]);
    expect(Buffer.compare(files["İrsaliye (2).pdf"], Buffer.from(bytes(12)))).toBe(0);

    const finance = await as(FINANCE_A).bulkDownload({ projectId: PROJECT_1 });
    expect(finance.count).toBe(3);
    expect(Object.keys(await unzip(finance.zip)).length).toBe(3);
    expect((await as(VIEWER_B).bulkDownload({ projectId: PROJECT_1 })).count).toBe(0);
    expect((await as(VIEWER_A).bulkDownload({ record: record(RECORD_P2) })).count).toBe(0);

    const { rows } = await admin.query(
      `select actor_user_id, payload from aud.audit_log
        where event_type = 'document.bulk_downloaded' and occurred_at >= $1
        order by occurred_at`,
      [before],
    );
    expect(rows.map((r) => [r.actor_user_id, r.payload.count])).toEqual([
      [VIEWER_A, 2],
      [FINANCE_A, 3],
      [VIEWER_B, 0],
      [VIEWER_A, 0],
    ]);
    expect(rows[0].payload.scope).toEqual({ project_id: PROJECT_1 });
  });
});
