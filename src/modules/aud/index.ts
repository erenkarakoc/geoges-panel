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
