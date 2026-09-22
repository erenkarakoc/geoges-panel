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
