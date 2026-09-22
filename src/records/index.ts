import "server-only";

import { createRevisionService, type RevisionAppliers } from "@/modules/aud";
import { createDocumentService, type RecordResolvers } from "@/modules/doc";
import { signInIdentity } from "@/modules/iam";
import { processStorage } from "@/platform/storage";

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
    storage: processStorage,
    records: recordResolvers,
    identity: async () => (await signInIdentity())?.identity ?? null,
  });
  return service;
}

/**
 * Records whose approved rows are locked and changed only through a revision request
 * (TASK-0109, D-265). The module that owns a record registers an applier under
 * `<schema>.<table>`: it writes the approved change and the correction entries that go with it,
 * as the person who approved. A record type with no applier cannot be asked to change, so a
 * request is never approved into nothing. None exist before the first slice (Phase 09).
 */
export const revisionAppliers: RevisionAppliers = {};

let revisionService: ReturnType<typeof createRevisionService> | null = null;

/** The revision service of this process. */
export function revisions() {
  revisionService ??= createRevisionService({
    appliers: revisionAppliers,
    identity: async () => (await signInIdentity())?.identity ?? null,
  });
  return revisionService;
}
