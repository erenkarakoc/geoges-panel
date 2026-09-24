/**
 * DOC's public surface (MODULE_BOUNDARIES section 2, TASK-0107). The service is built by the
 * composition root `src/records`, which hands it the storage adapter and the owning modules'
 * record resolvers; routes use that instance. Server-only.
 */
export {
  createDocumentService,
  DocumentError,
  type DocumentService,
  type FileInfo,
  type PartResult,
  type RecordResolver,
  type RecordResolvers,
  type UploadState,
} from "./application/documents";
export {
  ALLOWED_TYPES,
  DOC_RULE_MESSAGES,
  MAX_FILE_BYTES,
  PART_BYTES,
  PREVIEWABLE,
  type RecordFacts,
  type RecordRef,
} from "./domain/documents";
export type { DocumentSummary, TextStatus } from "./data/doc-store";

// Background work, collected by src/jobs/registry.ts (text recognition, expired uploads).
export { docJobs } from "./data/doc-jobs";

// The module's capability catalog, read by the flow engine (TASK-0118).
export { docCapabilities } from "@/modules/doc/capabilities";
