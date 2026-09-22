/**
 * AUD's public surface (MODULE_BOUNDARIES section 2, TASK-0103). Code outside the module imports
 * only from here, apart from the `ui/` screens that routes render. Server-only.
 */
export { readAuditLog, readRecordHistory, type AuditLogPage } from "./application/audit";
export type { AuditLogEntry, HistoryEntry } from "./data/aud-store";
export {
  AUDIT_EVENT_GROUPS,
  AUDIT_TARGET_TABLES,
  auditEventLabel,
  auditLogQuery,
  auditTargetLabel,
  parseAuditLogFilters,
  type AuditLogFilters,
} from "./domain/audit-log";

// Revision requests (TASK-0109, D-265). The service is built by the composition root
// `src/records`, which hands it the appliers of the modules that own the records.
export {
  createRevisionService,
  currentIdentity,
  RevisionError,
  type RevisionApplier,
  type RevisionAppliers,
  type RevisionEffect,
  type RevisionOutcome,
  type RevisionService,
} from "./application/revisions";
export type { RevisionRequest, RevisionView } from "./data/revision-store";
export {
  buildChanges,
  decideRevisionSchema,
  REVISION_RULE_MESSAGES,
  REVISION_STATUS_LABELS,
  showValue,
  stillCurrent,
  submitRevisionSchema,
  type RevisionChange,
  type RevisionStatus,
} from "./domain/revisions";
