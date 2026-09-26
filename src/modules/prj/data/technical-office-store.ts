import { sql } from "kysely";

import { runAsUser, type DbIdentity, type DbTransaction } from "@/platform/db";
import type { JobDefinition, SystemDb } from "@/platform/jobs/types";

import type {
  OfficeItemInput,
  OfficeStatus,
  Responsibility,
  SupplyInput,
} from "@/modules/prj/domain/technical-office";

/**
 * Technical office items and the supply matrix in the database (TASK-0123 step 4, migration 0071,
 * D-298). The rules are the database's: the delivery day, the one overdue announcement per due
 * day, a matrix row that is never changed and never dated into the past.
 */

type Tx = DbTransaction<unknown>;

export type OfficeItem = {
  id: string;
  projectId: string;
  typeItemId: string;
  title: string;
  assigneeUserId: string | null;
  dueOn: string | null;
  status: OfficeStatus;
  revisionCount: number;
  deliveredOn: string | null;
  note: string | null;
};

export type SupplyRow = {
  id: string;
  itemId: string;
  responsibility: Responsibility;
  validFrom: string;
  note: string | null;
  createdAt: Date;
};

type OfficeDbRow = {
  id: string;
  project_id: string;
  type_item_id: string;
  title: string;
  assignee_user_id: string | null;
  due_on: string | null;
  status: OfficeStatus;
  revision_count: number;
  delivered_on: string | null;
  note: string | null;
};

const officeItem = (row: OfficeDbRow): OfficeItem => ({
  assigneeUserId: row.assignee_user_id,
  deliveredOn: row.delivered_on,
  dueOn: row.due_on,
  id: row.id,
  note: row.note,
  projectId: row.project_id,
  revisionCount: row.revision_count,
  status: row.status,
  title: row.title,
  typeItemId: row.type_item_id,
});

/** A project's items: the open ones by due day first, delivered and cancelled after. */
export function readOfficeItems(identity: DbIdentity, projectId: string) {
  return runAsUser(identity, async (db: Tx) => {
    const { rows } = await sql<OfficeDbRow>`
      select id, project_id, type_item_id, title, assignee_user_id, due_on::text, status,
             revision_count, delivered_on::text, note
        from prj.technical_office_item
       where project_id = ${projectId}::uuid
       order by status in ('delivered', 'cancelled'), due_on nulls last, created_at`.execute(db);
    return rows.map(officeItem);
  });
}

export function insertOfficeItem(identity: DbIdentity, projectId: string, input: OfficeItemInput) {
  return runAsUser(identity, async (db: Tx) => {
    const { rows } = await sql<{ id: string }>`
      insert into prj.technical_office_item (project_id, type_item_id, title, assignee_user_id,
                                             due_on, note)
      values (${projectId}::uuid, ${input.typeItemId}::uuid, ${input.title},
              ${input.assigneeUserId ?? null}::uuid, ${input.dueOn ?? null}::date,
              ${input.note ?? null})
      returning id`.execute(db);
    return rows[0]?.id ?? null;
  });
}

export function updateOfficeItem(identity: DbIdentity, id: string, input: OfficeItemInput) {
  return runAsUser(identity, async (db: Tx) => {
    const { rows } = await sql<{ id: string }>`
      update prj.technical_office_item
         set type_item_id = ${input.typeItemId}::uuid, title = ${input.title},
             assignee_user_id = ${input.assigneeUserId ?? null}::uuid,
             due_on = ${input.dueOn ?? null}::date, note = ${input.note ?? null},
             updated_at = now(), updated_by_user_id = ${identity.userId}::uuid
       where id = ${id}::uuid
      returning id`.execute(db);
    return rows.length === 1;
  });
}

export function setOfficeItemStatus(identity: DbIdentity, id: string, status: OfficeStatus) {
  return runAsUser(identity, async (db: Tx) => {
    const { rows } = await sql<{ id: string }>`
      update prj.technical_office_item
         set status = ${status}, updated_at = now(), updated_by_user_id = ${identity.userId}::uuid
       where id = ${id}::uuid
      returning id`.execute(db);
    return rows.length === 1;
  });
}

/** It came back to be done again: one more revision, and it is open work once more. */
export function countOfficeRevision(identity: DbIdentity, id: string) {
  return runAsUser(identity, async (db: Tx) => {
    const { rows } = await sql<{ id: string }>`
      update prj.technical_office_item
         set revision_count = revision_count + 1,
             status = case when status = 'delivered' then 'in_progress' else status end,
             updated_at = now(), updated_by_user_id = ${identity.userId}::uuid
       where id = ${id}::uuid and status <> 'cancelled'
      returning id`.execute(db);
    return rows.length === 1;
  });
}

/** Every row of a project's matrix, newest first within an item. */
export function readSupplyRows(identity: DbIdentity, projectId: string) {
  return runAsUser(identity, async (db: Tx) => {
    const { rows } = await sql<{
      id: string;
      item_id: string;
      responsibility: Responsibility;
      valid_from: string;
      note: string | null;
      created_at: Date;
    }>`
      select id, item_id, responsibility, valid_from::text, note, created_at
        from prj.supply_responsibility
       where project_id = ${projectId}::uuid
       order by item_id, valid_from desc`.execute(db);
    return rows.map((row): SupplyRow => ({
      createdAt: row.created_at,
      id: row.id,
      itemId: row.item_id,
      note: row.note,
      responsibility: row.responsibility,
      validFrom: row.valid_from,
    }));
  });
}

export function insertSupplyRow(identity: DbIdentity, projectId: string, input: SupplyInput) {
  return runAsUser(identity, async (db: Tx) => {
    const { rows } = await sql<{ id: string }>`
      insert into prj.supply_responsibility (project_id, item_id, responsibility, valid_from, note)
      values (${projectId}::uuid, ${input.itemId}::uuid, ${input.responsibility},
              ${input.validFrom}::date, ${input.note ?? null})
      returning id`.execute(db);
    return rows[0]?.id ?? null;
  });
}

/**
 * Late items the person may see — every one for whoever sees the project, their own for the person
 * responsible — oldest due day first, for "Dikkat" on "Bugün" (REQ-PRJ-005).
 */
export function readLateOfficeItems(identity: DbIdentity, today: string, limit = 20) {
  return runAsUser(identity, async (db: Tx) => {
    const { rows } = await sql<{
      id: string;
      title: string;
      project_id: string;
      project_code: string | null;
      due_on: string;
      total: string;
    }>`
      select t.id, t.title, t.project_id, p.code as project_code, t.due_on::text,
             count(*) over () as total
        from prj.technical_office_item t
        left join prj.project p on p.id = t.project_id
       where t.status in ('open', 'in_progress') and t.due_on < ${today}::date
       order by t.due_on, t.id
       limit ${limit}`.execute(db);
    return {
      items: rows.map((row) => ({
        dueOn: row.due_on,
        id: row.id,
        projectCode: row.project_code,
        projectId: row.project_id,
        title: row.title,
      })),
      total: rows.length ? Number(rows[0].total) : 0,
    };
  });
}

// ---------------------------------------------------------------------------------------------
// For the flow and the worker, read as the system.
// ---------------------------------------------------------------------------------------------

/** The item's responsible person, for the relation `technical_office_item.assignee`. */
export async function readOfficeAssigneeAsSystem(db: SystemDb, itemId: string) {
  const { rows } = await sql<{ assignee_user_id: string | null }>`
    select assignee_user_id from prj.technical_office_item where id = ${itemId}::uuid`.execute(db);
  return rows[0]?.assignee_user_id ?? null;
}

/** The list `prj.authority_approvals`: a project's open items of the authority-approval kind. */
export async function readAuthorityApprovalsAsSystem(db: SystemDb, projectId: string) {
  const { rows } = await sql<{
    id: string;
    title: string;
    assignee_user_id: string | null;
    due_on: string | null;
  }>`select id, title, assignee_user_id, due_on::text
       from prj.authority_approvals(${projectId}::uuid)`.execute(db);
  return rows.map((row) => ({
    id: row.id,
    item: { assignee_user_id: row.assignee_user_id, due_on: row.due_on, title: row.title },
    label: row.title,
  }));
}

/** Once a day, and again if a run was missed: every late item is announced once per due day. */
export function technicalOfficeOverdueJob(): JobDefinition {
  return {
    type: "prj.technical-office-overdue",
    recurrence: { dailyAt: "06:30" },
    async run(db) {
      await sql`select prj.announce_overdue_technical_items()`.execute(db);
    },
  };
}
