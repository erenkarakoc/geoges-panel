import { makeZip } from "client-zip";

import {
  archive,
  completeUpload,
  insertDocumentWithUpload,
  insertVersionUpload,
  markSigned,
  prepareBulkDownload,
  readDocumentsOf,
  readParts,
  readUpload,
  readVisibleVersion,
  recordPart,
  saveMultipartId,
  type BulkScope,
  type DbIdentity,
  type UploadRow,
} from "@/modules/doc/data/doc-store";
import {
  checkFile,
  checkPart,
  PART_BYTES,
  PREVIEWABLE,
  zipEntryNames,
  type RecordFacts,
  type RecordRef,
} from "@/modules/doc/domain/documents";
import { DEFAULT_LINK_SECONDS, type StorageProvider } from "@/platform/storage/storage";

/**
 * The document service (TASK-0107, REQ-DOC, D-262). Built once by the composition root
 * (`src/records`) with the storage adapter, the owning modules' record resolvers and the way to
 * learn who is asking; tests build it with the in-memory adapter and fixed people.
 *
 * Every operation starts by reading as the signed-in person (SPIKE-09 rule 1): a document or
 * upload they may not see is "not found", never "forbidden", so its existence does not leak.
 */

/** Reads a record as the person; null when it does not exist for them (DOC-K2). */
export type RecordResolver = (identity: DbIdentity, id: string) => Promise<RecordFacts | null>;
/** Resolvers by `<schema>.<table>`, registered by each module that owns records. */
export type RecordResolvers = Readonly<Record<string, RecordResolver>>;

export type DocumentServiceDeps = {
  storage: StorageProvider;
  records: RecordResolvers;
  /** The signed-in person; null when signed out. */
  identity: () => Promise<DbIdentity | null>;
};

export class DocumentError extends Error {
  constructor(
    readonly status: 400 | 401 | 403 | 404,
    message: string,
  ) {
    super(message);
    this.name = "DocumentError";
  }
}

const notFound = () => new DocumentError(404, "Belge bulunamadı.");

export type FileInfo = { name: string; type: string; size: number };

export type UploadState = {
  uploadId: string;
  partSize: number;
  sizeBytes: number;
  receivedBytes: number;
  status: UploadRow["status"];
};

const stateOf = (u: UploadRow): UploadState => ({
  uploadId: u.id,
  partSize: u.partSize,
  sizeBytes: u.sizeBytes,
  receivedBytes: u.receivedBytes,
  status: u.status,
});

export type PartResult =
  { ok: true; receivedBytes: number } | { ok: false; status: 409; receivedBytes: number };

export function createDocumentService(deps: DocumentServiceDeps) {
  const { storage, records } = deps;

  async function who() {
    const identity = await deps.identity();
    if (!identity) throw new DocumentError(401, "Oturum bulunamadı.");
    return identity;
  }

  async function withFile(file: FileInfo) {
    const check = checkFile(file);
    if (!check.ok) throw new DocumentError(400, check.reason);
  }

  /** Opens the multipart upload in storage for a new upload row. */
  async function open(identity: DbIdentity, upload: UploadRow): Promise<UploadState> {
    const multipartId = await storage.createMultipart(upload.storageKey, upload.mimeType);
    await saveMultipartId(identity, upload.id, multipartId);
    return stateOf(upload);
  }

  /** Whether a database error is row level security refusing the write. */
  const refused = (error: unknown) => (error as { code?: string }).code === "42501";

  return {
    /** Starts a new document on a record with its first file (REQ-DOC-001). */
    async startDocument(input: {
      record: RecordRef;
      typeCode: string;
      title: string;
      description?: string | null;
      file: FileInfo;
      isSigned?: boolean;
    }): Promise<UploadState & { documentId: string }> {
      const identity = await who();
      await withFile(input.file);
      if (!input.title.trim()) throw new DocumentError(400, "Belgenin adı yok.");
      const resolve = records[`${input.record.schema}.${input.record.table}`];
      const facts = resolve ? await resolve(identity, input.record.id) : null;
      if (!facts) throw new DocumentError(404, "Kayıt bulunamadı.");
      try {
        const { documentId, upload } = await insertDocumentWithUpload(identity, {
          record: input.record,
          facts: { ...facts, module: input.record.schema },
          typeCode: input.typeCode,
          title: input.title,
          description: input.description,
          file: input.file,
          partSize: PART_BYTES,
          isSigned: input.isSigned ?? false,
        });
        return { documentId, ...(await open(identity, upload)) };
      } catch (error) {
        if (refused(error)) throw new DocumentError(403, "Bu kayda belge ekleme yetkiniz yok.");
        if (error instanceof Error && error.message.startsWith("unknown document type")) {
          throw new DocumentError(400, "Belge türü tanımlı değil.");
        }
        throw error;
      }
    },

    /** Starts another version of a document (REQ-DOC-005); the earlier ones stay. */
    async startVersion(documentId: string, file: FileInfo, isSigned = false) {
      const identity = await who();
      await withFile(file);
      const upload = await insertVersionUpload(identity, documentId, file, PART_BYTES, isSigned);
      if (!upload) throw notFound();
      return open(identity, upload);
    },

    /** Where an upload stands; the client asks after a lost connection (SPIKE-15). */
    async uploadState(uploadId: string): Promise<UploadState> {
      const upload = await readUpload(await who(), uploadId);
      if (!upload) throw notFound();
      return stateOf(upload);
    },

    /**
     * Stores the part that starts at `offset`. The server owns the offset: a part from anywhere
     * else is answered with 409 and the offset to continue from.
     */
    async putPart(uploadId: string, offset: number, body: Uint8Array): Promise<PartResult> {
      const identity = await who();
      const upload = await readUpload(identity, uploadId);
      if (!upload || !upload.multipartUploadId) throw notFound();
      if (upload.status !== "open") throw new DocumentError(400, "Yükleme kapanmış.");
      const check = checkPart(upload, offset, body.byteLength);
      if (!check.ok) {
        if (check.status === 409) return check;
        throw new DocumentError(400, check.reason);
      }
      const etag = await storage.uploadPart(
        upload.storageKey,
        upload.multipartUploadId,
        check.partNumber,
        body,
      );
      const received = await recordPart(identity, uploadId, offset, {
        partNumber: check.partNumber,
        etag,
        length: body.byteLength,
      });
      if (received === null) {
        const now = await readUpload(identity, uploadId);
        return { ok: false, status: 409, receivedBytes: now?.receivedBytes ?? 0 };
      }
      return { ok: true, receivedBytes: received };
    },

    /** Joins the parts into the file and adds the version; safe to call again. */
    async complete(uploadId: string, sha256: string | null = null) {
      const identity = await who();
      const upload = await readUpload(identity, uploadId);
      if (!upload || !upload.multipartUploadId) throw notFound();
      if (upload.status === "open") {
        if (upload.receivedBytes !== upload.sizeBytes) {
          throw new DocumentError(400, "Yükleme tamamlanmadı.");
        }
        // A retry after the storage step succeeded finds the object already there.
        const stored = await storage.headObject(upload.storageKey);
        if (!stored) {
          const parts = await readParts(identity, uploadId);
          await storage.completeMultipart(upload.storageKey, upload.multipartUploadId, parts);
        }
        const head = await storage.headObject(upload.storageKey);
        if (head?.size !== upload.sizeBytes) {
          throw new Error(`stored object ${upload.storageKey} has the wrong size`);
        }
      }
      return { versionId: await completeUpload(identity, uploadId, sha256) };
    },

    /**
     * A short-lived link to one version (REQ-DOC-008). `preview` shows it in the browser when
     * the type allows; anything else downloads. The link is never logged (SPIKE-09 rule 5).
     */
    async link(versionId: string, { preview = false }: { preview?: boolean } = {}) {
      const version = await readVisibleVersion(await who(), versionId);
      if (!version) throw notFound();
      const inline = preview && PREVIEWABLE.has(version.mimeType);
      return {
        url: await storage.signedGetUrl(version.storageKey, {
          fileName: version.fileName,
          inline,
          contentType: version.mimeType,
          expiresSeconds: DEFAULT_LINK_SECONDS,
        }),
        inline,
        expiresSeconds: DEFAULT_LINK_SECONDS,
      };
    },

    /** A record's documents the person may see (REQ-DOC-003); archived ones on request. */
    async listFor(record: RecordRef, { withArchived = false } = {}) {
      return readDocumentsOf(await who(), record, withArchived);
    },

    /** Archives a document with a reason (REQ-DOC-006); nothing is deleted. */
    async archive(documentId: string, reason: string) {
      if (!reason.trim()) throw new DocumentError(400, "Arşivleme için gerekçe yazın.");
      if (!(await archive(await who(), documentId, reason))) throw notFound();
    },

    /**
     * All documents of a record or a project the person may see, newest version each, as one
     * ZIP streamed file by file (REQ-DOC-007). The audit event is written before anything is
     * sent.
     */
    async bulkDownload(scope: BulkScope) {
      const items = await prepareBulkDownload(await who(), scope);
      const names = zipEntryNames(items.map((i) => i.fileName));
      async function* entries() {
        for (const [n, item] of items.entries()) {
          yield {
            name: names[n],
            input: await storage.getObjectStream(item.storageKey),
            size: item.sizeBytes,
            lastModified: item.uploadedAt,
          };
        }
      }
      return { count: items.length, zip: makeZip(entries()) };
    },

    /** Marks a version as the signed one (REQ-DOC-005). */
    async markSigned(versionId: string) {
      if (!(await markSigned(await who(), versionId))) throw notFound();
    },
  };
}

export type DocumentService = ReturnType<typeof createDocumentService>;
