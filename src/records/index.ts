import "server-only";

import { createDocumentService, type RecordResolvers } from "@/modules/doc";
import { signInIdentity } from "@/modules/iam";
import { storageProvider } from "@/platform/storage";

/**
 * Records that can carry documents (TASK-0107, D-262). Each module that owns records registers
 * a resolver under `<schema>.<table>`: it reads the record as the signed-in person and returns
 * its scope, owner and data class, or null when the record does not exist for them. DOC may
 * not import other modules, so this composition root joins them. None exist before the first
 * slice (Phase 09).
 */
export const recordResolvers: RecordResolvers = {};

let service: ReturnType<typeof createDocumentService> | null = null;

/** The document service of this process. */
export function documents() {
  service ??= createDocumentService({
    storage: storageProvider(),
    records: recordResolvers,
    identity: async () => (await signInIdentity())?.identity ?? null,
  });
  return service;
}
