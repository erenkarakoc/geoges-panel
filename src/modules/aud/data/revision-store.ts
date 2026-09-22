import { sql } from "kysely";

import { runAsUser, type DbIdentity, type DbTransaction } from "@/platform/db";

import type { RevisionChange, RevisionStatus } from "@/modules/aud/domain/revisions";

/**
 * AUD's revision data layer (TASK-0109, D-265). Every read and write runs as the signed-in
 * person: the database decides who may ask, who may decide and who may see. AUD never touches
 * the record itself — that belongs to the module that owns it.
 */

export type { DbIdentity };

type Tx = DbTransaction<unknown>;

export type RevisableRecordType = {
  module: string;
  label: string;
  revisableFields: string[];
  approver: "manager" | "owner";
};

export type RevisionRequest = {
  id: string;
  record: { schema: string; table: string; id: string };
  module: string;
  label: string;
  changes: RevisionChange[];
  reason: string;
  status: RevisionStatus;
  requestedByUserId: string;
  requestedByName: string;
  createdAt: Date;
  decidedByUserId: string | null;
  decidedByName: string | null;
  decidedAt: Date | null;
  decisionReason: string | null;
  appliedAt: Date | null;
  applyNote: string | null;
  canDecide: boolean;
};

export type RevisionView = "pending" | "mine" | "record" | "all";

type Row = {
  id: string;
  record_schema: string;
  record_table: string;
  record_id: string;
  module: string;
  label: string;
  changes: RevisionChange[];
  reason: string;
  status: RevisionStatus;
  requested_by_user_id: string;
  requested_by_name: string;
  created_at: Date;
  decided_by_user_id: string | null;
  decided_by_name: string | null;
  decided_at: Date | null;
  decision_reason: string | null;
  applied_at: Date | null;
  apply_note: string | null;
  can_decide: boolean;
};

const toRequest = (r: Row): RevisionRequest => ({
  id: r.id,
  record: { schema: r.record_schema, table: r.record_table, id: r.record_id },
  module: r.module,
  label: r.label,
  changes: r.changes,
  reason: r.reason,
  status: r.status,
  requestedByUserId: r.requested_by_user_id,
  requestedByName: r.requested_by_name,
  createdAt: new Date(r.created_at),
  decidedByUserId: r.decided_by_user_id,
  decidedByName: r.decided_by_name,
  decidedAt: r.decided_at ? new Date(r.decided_at) : null,
  decisionReason: r.decision_reason,
  appliedAt: r.applied_at ? new Date(r.applied_at) : null,
  applyNote: r.apply_note,
  canDecide: r.can_decide,
});

/** What the register says about a record type, or null when it is not open to requests. */
export function readRevisableType(identity: DbIdentity, schema: string, table: string) {
  return runAsUser(identity, async (db: Tx) => {
    const { rows } = await sql<{
      module: string;
      label: string;
      revisable_fields: string[];
      approver: "manager" | "owner";
    }>`select * from aud.revisable(${schema}, ${table})`.execute(db);
    const row = rows[0];
    return row
      ? ({
          module: row.module,
          label: row.label,
          revisableFields: row.revisable_fields,
          approver: row.approver,
        } satisfies RevisableRecordType)
      : null;
  });
}

export function readRevisions(
  identity: DbIdentity,
  view: RevisionView,
  record?: { schema: string; table: string; id: string },
) {
  return runAsUser(identity, async (db: Tx) => {
    const { rows } = await sql<Row>`
      select * from aud.revision_page(${view}, ${record?.schema ?? null},
                                      ${record?.table ?? null}, ${record?.id ?? null}::uuid,
                                      100)`.execute(db);
    return rows.map(toRequest);
  });
}

export function insertRevision(
  identity: DbIdentity,
  input: {
    record: { schema: string; table: string; id: string };
    changes: readonly RevisionChange[];
    reason: string;
    siteId?: string | null;
    projectId?: string | null;
    ownerUserId?: string | null;
    dataClass?: string;
  },
) {
  return runAsUser(identity, async (db: Tx) => {
    const { rows } = await sql<{ id: string }>`
      select aud.submit_revision(${input.record.schema}, ${input.record.table},
                                 ${input.record.id}::uuid, ${JSON.stringify(input.changes)}::jsonb,
                                 ${input.reason}, ${input.siteId ?? null}::uuid,
                                 ${input.projectId ?? null}::uuid,
                                 ${input.ownerUserId ?? null}::uuid,
                                 ${input.dataClass ?? "internal"}) as id`.execute(db);
    return rows[0].id;
  });
}

export function decideRevision(
  identity: DbIdentity,
  id: string,
  approve: boolean,
  reason: string | null,
) {
  return runAsUser(identity, async (db: Tx) => {
    const { rows } = await sql<{ status: RevisionStatus }>`
      select aud.decide_revision(${id}::uuid, ${approve}, ${reason}) as status`.execute(db);
    return rows[0].status;
  });
}

/** The owning module reports the result of carrying an approved request out. */
export function markApplied(identity: DbIdentity, id: string, note: string | null) {
  return runAsUser(identity, async (db: Tx) => {
    await sql`select aud.mark_revision_applied(${id}::uuid, ${note})`.execute(db);
  });
}

export function markStale(identity: DbIdentity, id: string, note: string) {
  return runAsUser(identity, async (db: Tx) => {
    await sql`select aud.mark_revision_stale(${id}::uuid, ${note})`.execute(db);
  });
}

/** Links the correction the module wrote to the request it came from (REQ-AUD-009). */
export function insertEffect(
  identity: DbIdentity,
  id: string,
  effect: { schema: string; table: string; id?: string | null; note?: string | null },
) {
  return runAsUser(identity, async (db: Tx) => {
    const { rows } = await sql<{ id: string }>`
      select aud.record_revision_effect(${id}::uuid, ${effect.schema}, ${effect.table},
                                        ${effect.id ?? null}::uuid, ${effect.note ?? null})
        as id`.execute(db);
    return rows[0].id;
  });
}

export function readEffects(identity: DbIdentity, id: string) {
  return runAsUser(identity, async (db: Tx) => {
    const { rows } = await sql<{
      effect_schema: string;
      effect_table: string;
      effect_id: string | null;
      note: string | null;
      created_at: Date;
    }>`
      select effect_schema, effect_table, effect_id, note, created_at
        from aud.revision_effect where revision_request_id = ${id}::uuid
       order by created_at`.execute(db);
    return rows.map((r) => ({
      schema: r.effect_schema,
      table: r.effect_table,
      id: r.effect_id,
      note: r.note,
      createdAt: new Date(r.created_at),
    }));
  });
}
