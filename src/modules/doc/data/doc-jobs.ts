import { sql } from "kysely";

import { LOW_CONFIDENCE, tidyRecognisedText } from "@/modules/doc/domain/documents";
import type { EventSubscriber, JobDefinition, SystemDb } from "@/platform/jobs/types";
import type { StorageProvider } from "@/platform/storage/storage";
import type { TextReader } from "@/platform/text-recognition/text-reader";

/**
 * DOC's background work (TASK-0107, D-262), collected by src/jobs/registry.ts with the storage
 * and text reader of the process.
 *
 * Text recognition (SPIKE-16) listens to `document.uploaded`: it reads the stored file, keeps
 * the tidied text of both passes, and flags a scan below the confidence threshold "kalite
 * düşük, yeniden tarayın". A file the reader cannot handle is marked failed rather than retried
 * forever; a storage or database failure is retried by the worker. It is not replayable: it
 * writes results, it does not feed a read model.
 *
 * Expired uploads (SPIKE-15): an upload left open past its expiry is aborted in storage and
 * closed, so half-sent parts do not pile up in the bucket.
 */

export function textRecognition(storage: StorageProvider, reader: TextReader): EventSubscriber {
  return {
    name: "doc.recognise-text",
    events: ["document.uploaded"],
    replayable: false,
    async handle(db, event) {
      const versionId = String(event.payload.version_id ?? "");
      const { rows } = await sql<{ storage_key: string; mime_type: string; status: string }>`
        select v.storage_key, v.mime_type, t.status
          from doc.document_version v join doc.extracted_text t on t.document_version_id = v.id
         where v.id = ${versionId}::uuid
         for update of t`.execute(db);
      const version = rows[0];
      if (!version || version.status !== "pending") return;

      const bytes = await storage.getObject(version.storage_key);
      let result: Awaited<ReturnType<TextReader["read"]>>;
      try {
        result = await reader.read(bytes, version.mime_type);
      } catch (error) {
        await sql`
          update doc.extracted_text
             set status = 'failed', error = ${String((error as Error).message).slice(0, 500)},
                 updated_at = now()
           where document_version_id = ${versionId}::uuid`.execute(db);
        return;
      }
      const lowQuality =
        (result.confidence !== null && result.confidence < LOW_CONFIDENCE) ||
        result.pagesRead < result.pages;
      await sql`
        update doc.extracted_text
           set status = 'ready', method = ${result.method},
               text_content = ${tidyRecognisedText(result.passes)},
               confidence = ${result.confidence === null ? null : Math.round(result.confidence * 100) / 100},
               is_low_quality = ${lowQuality}, error = null, updated_at = now()
         where document_version_id = ${versionId}::uuid`.execute(db);
    },
  };
}

export function expiredUploads(storage: StorageProvider): JobDefinition {
  return {
    type: "doc.expired-uploads",
    recurrence: { everyMinutes: 60 },
    async run(db) {
      await closeExpiredUploads(db, storage);
    },
  };
}

export async function closeExpiredUploads(
  db: SystemDb,
  storage: StorageProvider,
  now = new Date(),
) {
  const { rows } = await sql<{
    id: string;
    storage_key: string;
    multipart_upload_id: string | null;
  }>`
    select id, storage_key, multipart_upload_id from doc.upload
     where status = 'open' and expires_at < ${now}
     order by expires_at
     limit 100
       for update skip locked`.execute(db);
  for (const upload of rows) {
    if (upload.multipart_upload_id) {
      try {
        await storage.abortMultipart(upload.storage_key, upload.multipart_upload_id);
      } catch (error) {
        // Already gone in storage (aborted before, or never created there): nothing to free.
        if ((error as { name?: string }).name !== "NoSuchUpload") throw error;
      }
    }
    await sql`update doc.upload set status = 'aborted', updated_at = now()
               where id = ${upload.id}::uuid`.execute(db);
  }
  return rows.length;
}

export function docJobs(storage: StorageProvider, reader: TextReader) {
  return {
    subscribers: [textRecognition(storage, reader)] as readonly EventSubscriber[],
    jobs: [expiredUploads(storage)] as readonly JobDefinition[],
  };
}
