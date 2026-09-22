import { sql } from "kysely";

import { runAsUser, type DbIdentity, type DbTransaction } from "@/platform/db";

/**
 * AUD's data layer (TASK-0103). The runtime role cannot read the history or audit tables; it asks
 * the database functions of migration 0004, which check permission and hide values the person
 * may not see. Nothing here filters by permission itself.
 */

export type { DbIdentity };

type Tx = DbTransaction<unknown>;

export type AuditLogEntry = {
  id: string;
  eventType: string;
  actorUserId: string | null;
  actorName: string | null;
  actorRoleName: string | null;
  targetSchema: string | null;
  targetTable: string | null;
  targetId: string | null;
  /** The account the event is about, when it is about one. */
  targetName: string | null;
  payload: Record<string, unknown>;
  occurredAt: Date;
};

export type AuditLogQuery = {
  actorId: string | null;
  eventPrefix: string | null;
  targetTable: string | null;
  from: Date | null;
  to: Date | null;
  offset: number;
  limit: number;
};

/** One page of the audit log and the total of the filtered list. */
export function readAuditLogPage(identity: DbIdentity, q: AuditLogQuery) {
  return runAsUser(identity, async (db: Tx) => {
    const { rows } = await sql<{
      id: string;
      event_type: string;
      actor_user_id: string | null;
      actor_name: string | null;
      actor_role_name: string | null;
      target_schema: string | null;
      target_table: string | null;
      target_id: string | null;
      target_name: string | null;
      payload: Record<string, unknown>;
      occurred_at: Date;
      total: string;
    }>`
      select id, event_type, actor_user_id, actor_name, actor_role_name, target_schema,
             target_table, target_id, target_name, payload, occurred_at, total
        from aud.audit_log_page(${q.actorId}::uuid, ${q.eventPrefix}, ${q.targetTable},
                                ${q.from}::timestamptz, ${q.to}::timestamptz, ${q.offset},
                                ${q.limit})`.execute(db);
    return {
      total: rows.length ? Number(rows[0].total) : 0,
      entries: rows.map((r): AuditLogEntry => ({
        id: r.id,
        eventType: r.event_type,
        actorUserId: r.actor_user_id,
        actorName: r.actor_name,
        actorRoleName: r.actor_role_name,
        targetSchema: r.target_schema,
        targetTable: r.target_table,
        targetId: r.target_id,
        targetName: r.target_name,
        payload: r.payload,
        occurredAt: new Date(r.occurred_at),
      })),
    };
  });
}

/** The total alone, for a page past the end (no rows, so no total on them). */
export function countAuditLog(identity: DbIdentity, q: AuditLogQuery) {
  return readAuditLogPage(identity, { ...q, offset: 0, limit: 1 }).then((p) => p.total);
}

export type HistoryEntry = {
  operation: "insert" | "update";
  field: string | null;
  oldValue: unknown;
  newValue: unknown;
  dataClass: string;
  /** The person may not see this class: only "changed" is shown (REQ-AUD-004). */
  isMasked: boolean;
  reason: string | null;
  changedByUserId: string | null;
  changedByName: string | null;
  changedInRoleId: string | null;
  changedAt: Date;
};

/** The history of one record as the signed-in person may see it (REQ-AUD-001, REQ-AUD-004). */
export function readHistory(identity: DbIdentity, schema: string, table: string, id: string) {
  return runAsUser(identity, async (db: Tx) => {
    const { rows } = await sql<{
      operation: "insert" | "update";
      field: string | null;
      old_value: unknown;
      new_value: unknown;
      data_class: string;
      is_masked: boolean;
      reason: string | null;
      changed_by_user_id: string | null;
      changed_by_name: string | null;
      changed_in_role_id: string | null;
      changed_at: Date;
    }>`select * from aud.history_of(${schema}, ${table}, ${id}::uuid)`.execute(db);
    return rows.map((r): HistoryEntry => ({
      operation: r.operation,
      field: r.field,
      oldValue: r.old_value,
      newValue: r.new_value,
      dataClass: r.data_class,
      isMasked: r.is_masked,
      reason: r.reason,
      changedByUserId: r.changed_by_user_id,
      changedByName: r.changed_by_name,
      changedInRoleId: r.changed_in_role_id,
      changedAt: new Date(r.changed_at),
    }));
  });
}
