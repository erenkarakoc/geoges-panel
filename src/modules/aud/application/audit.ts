import "server-only";

import {
  countAuditLog,
  readAuditLogPage,
  readHistory,
  type AuditLogEntry,
  type HistoryEntry,
} from "@/modules/aud/data/aud-store";
import {
  AUDIT_PAGE_SIZE,
  auditLogRange,
  type AuditLogFilters,
} from "@/modules/aud/domain/audit-log";
import { AccessDeniedError, assertCan, signInIdentity } from "@/modules/iam";

/**
 * The audit service (TASK-0103). Permission is asked of IAM before anything is read (PERMISSIONS
 * section 3); the database functions check it again and filter what comes back.
 */

async function identity() {
  const signedIn = await signInIdentity();
  if (!signedIn) throw new AccessDeniedError("iam.session");
  return signedIn.identity;
}

export type AuditLogPage = {
  entries: AuditLogEntry[];
  total: number;
  page: number;
  lastPage: number;
};

/** One page of the company-wide audit log (SCR-193); owner layer only (REQ-AUD-006). */
export async function readAuditLog(filters: AuditLogFilters): Promise<AuditLogPage> {
  await assertCan("aud.audit-log.view");
  const who = await identity();
  const { from, to } = auditLogRange(filters);
  const query = {
    actorId: filters.actorId,
    eventPrefix: filters.eventPrefix,
    targetTable: filters.targetTable,
    from,
    to,
    offset: (filters.page - 1) * AUDIT_PAGE_SIZE,
    limit: AUDIT_PAGE_SIZE,
  };
  const result = await readAuditLogPage(who, query);
  const total = result.entries.length ? result.total : await countAuditLog(who, query);
  return {
    entries: result.entries,
    total,
    page: filters.page,
    lastPage: Math.max(1, Math.ceil(total / AUDIT_PAGE_SIZE)),
  };
}

/**
 * The history of one record for its detail screen (REQ-AUD-001…004). Rows the person may not see
 * are left out and values of classes they may not see come back masked, by the database.
 */
export async function readRecordHistory(
  schema: string,
  table: string,
  id: string,
): Promise<HistoryEntry[]> {
  return readHistory(await identity(), schema, table, id);
}
