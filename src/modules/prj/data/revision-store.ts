import { sql } from "kysely";

import { runAsUser, type DbIdentity, type DbTransaction } from "@/platform/db";
import type { SystemDb } from "@/platform/jobs/types";

/**
 * Revisions, walls and targets in the database (TASK-0123 step 2, migration 0065). The rules are
 * the database's: only a draft is edited, only a flow approves, an approved revision is valid from
 * its approval day and never changes, a wall stands on its own project's site.
 */

type Tx = DbTransaction<unknown>;

export type RevisionStatus = "draft" | "submitted" | "approved";
export type WallStatus = "not_started" | "in_progress" | "completed";
export type TargetKind = "panel" | "strip" | "work_item";

export type Revision = {
  id: string;
  projectId: string;
  revisionNo: number;
  status: RevisionStatus;
  reason: string;
  basedOnRevisionId: string | null;
  validFrom: string | null;
  submittedAt: Date | null;
  approvedAt: Date | null;
  returnedNote: string | null;
  createdAt: Date;
};

export type RevisionWall = {
  revisionWallId: string;
  wallId: string;
  code: string;
  name: string;
  siteId: string;
  status: WallStatus;
  lengthM: number | null;
  heightM: number | null;
};

export type WallTarget = {
  id: string;
  wallId: string;
  kind: TargetKind;
  panelTypeId: string | null;
  stripTypeId: string | null;
  stripLengthM: number | null;
  workItemId: string | null;
  qty: number | null;
  lengthM: number | null;
};

export type DiffLine = {
  wallId: string;
  kind: TargetKind;
  panelTypeId: string | null;
  stripTypeId: string | null;
  stripLengthM: number | null;
  workItemId: string | null;
  before: number | null;
  after: number | null;
};

const num = (value: string | number | null) => (value === null ? null : Number(value));

type RevisionDbRow = {
  id: string;
  project_id: string;
  revision_no: number;
  status: RevisionStatus;
  reason: string;
  based_on_revision_id: string | null;
  valid_from: string | null;
  submitted_at: Date | null;
  approved_at: Date | null;
  returned_note: string | null;
  created_at: Date;
};

const revision = (row: RevisionDbRow): Revision => ({
  approvedAt: row.approved_at,
  basedOnRevisionId: row.based_on_revision_id,
  createdAt: row.created_at,
  id: row.id,
  projectId: row.project_id,
  reason: row.reason,
  returnedNote: row.returned_note,
  revisionNo: Number(row.revision_no),
  status: row.status,
  submittedAt: row.submitted_at,
  validFrom: row.valid_from,
});

const REVISION_COLUMNS = sql`id, project_id, revision_no, status, reason, based_on_revision_id,
  valid_from::text as valid_from, submitted_at, approved_at, returned_note, created_at`;

/** A project's revisions, newest first. */
export function readRevisions(identity: DbIdentity, projectId: string) {
  return runAsUser(identity, async (db: Tx) => {
    const { rows } = await sql<RevisionDbRow>`
      select ${REVISION_COLUMNS} from prj.project_revision
       where project_id = ${projectId}::uuid
       order by revision_no desc`.execute(db);
    return rows.map(revision);
  });
}

/** The approved revision valid on a day, or null when there is none yet. */
export function readRevisionOn(identity: DbIdentity, projectId: string, on: string) {
  return runAsUser(identity, async (db: Tx) => {
    const { rows } = await sql<{ id: string | null }>`
      select prj.revision_on(${projectId}::uuid, ${on}::date) as id`.execute(db);
    return rows[0]?.id ?? null;
  });
}

/** One revision with what it says: its walls and their targets. */
export function readRevision(identity: DbIdentity, id: string) {
  return runAsUser(identity, async (db: Tx) => {
    const { rows } = await sql<RevisionDbRow>`
      select ${REVISION_COLUMNS} from prj.project_revision where id = ${id}::uuid`.execute(db);
    if (!rows[0]) return null;
    const { rows: walls } = await sql<{
      revision_wall_id: string;
      wall_id: string;
      code: string;
      name: string;
      site_id: string;
      status: WallStatus;
      length_m: string | null;
      height_m: string | null;
    }>`select rw.id as revision_wall_id, w.id as wall_id, w.code, w.name, w.site_id, w.status,
              rw.length_m, rw.height_m
         from prj.revision_wall rw join prj.wall w on w.id = rw.wall_id
        where rw.revision_id = ${id}::uuid
        order by upper(w.code)`.execute(db);
    const { rows: targets } = await sql<{
      id: string;
      wall_id: string;
      kind: TargetKind;
      panel_type_id: string | null;
      strip_type_id: string | null;
      strip_length_m: string | null;
      work_item_id: string | null;
      qty: string | null;
      length_m: string | null;
    }>`select id, wall_id, kind, panel_type_id, strip_type_id, strip_length_m, work_item_id,
              qty, length_m
         from prj.wall_target where revision_id = ${id}::uuid
        order by kind, created_at, id`.execute(db);
    return {
      revision: revision(rows[0]),
      targets: targets.map((row): WallTarget => ({
        id: row.id,
        kind: row.kind,
        lengthM: num(row.length_m),
        panelTypeId: row.panel_type_id,
        qty: num(row.qty),
        stripLengthM: num(row.strip_length_m),
        stripTypeId: row.strip_type_id,
        wallId: row.wall_id,
        workItemId: row.work_item_id,
      })),
      walls: walls.map((row): RevisionWall => ({
        code: row.code,
        heightM: num(row.height_m),
        lengthM: num(row.length_m),
        name: row.name,
        revisionWallId: row.revision_wall_id,
        siteId: row.site_id,
        status: row.status,
        wallId: row.wall_id,
      })),
    };
  });
}

/** What changed between two revisions, line by line (REQ-PRJ-009). */
export function readRevisionDiff(identity: DbIdentity, fromId: string | null, toId: string) {
  return runAsUser(identity, async (db: Tx) => {
    const { rows } = await sql<{
      wall_id: string;
      kind: TargetKind;
      panel_type_id: string | null;
      strip_type_id: string | null;
      strip_length_m: string | null;
      work_item_id: string | null;
      before_amount: string | null;
      after_amount: string | null;
    }>`select * from prj.revision_diff(${fromId}::uuid, ${toId}::uuid)`.execute(db);
    return rows.map((row): DiffLine => ({
      after: num(row.after_amount),
      before: num(row.before_amount),
      kind: row.kind,
      panelTypeId: row.panel_type_id,
      stripLengthM: num(row.strip_length_m),
      stripTypeId: row.strip_type_id,
      wallId: row.wall_id,
      workItemId: row.work_item_id,
    }));
  });
}

/** Opens the next draft, carrying the last approved revision's walls and targets. */
export function startRevision(identity: DbIdentity, projectId: string, reason: string) {
  return runAsUser(identity, async (db: Tx) => {
    const { rows } = await sql<{ id: string }>`
      select prj.start_revision(${projectId}::uuid, ${reason}) as id`.execute(db);
    return rows[0].id;
  });
}

/** Sends a draft for approval (the flow listening to `project_revision.submitted` takes it). */
export function submitRevision(identity: DbIdentity, id: string) {
  return runAsUser(identity, async (db: Tx) => {
    const { rows } = await sql<{ id: string }>`
      update prj.project_revision
         set status = 'submitted', updated_at = now(), updated_by_user_id = ${identity.userId}::uuid
       where id = ${id}::uuid and status = 'draft'
      returning id`.execute(db);
    return rows.length === 1;
  });
}

/** Takes a submitted revision back to draft before it is decided. */
export function recallRevision(identity: DbIdentity, id: string) {
  return runAsUser(identity, async (db: Tx) => {
    const { rows } = await sql<{ id: string }>`
      update prj.project_revision
         set status = 'draft', updated_at = now(), updated_by_user_id = ${identity.userId}::uuid
       where id = ${id}::uuid and status = 'submitted'
      returning id`.execute(db);
    return rows.length === 1;
  });
}

/**
 * The flow's decision (REQ-WFL-010, D-082): `approved` makes the revision valid from today,
 * `draft` returns it to the technical office. Runs with system authority.
 */
export async function setRevisionStatusAsSystem(
  db: SystemDb,
  id: string,
  status: "approved" | "draft",
) {
  const { rows } = await sql<{ id: string }>`
    update prj.project_revision
       set status = ${status}, updated_at = now(),
           returned_note = case when ${status} = 'draft'
                                then 'Onay akışında düzeltmeye geri gönderildi.' end
     where id = ${id}::uuid and status = 'submitted'
    returning id`.execute(db);
  return rows.length === 1;
}

/**
 * Adds a wall to a draft: the wall itself when its code is new to the project, and what this
 * revision says about it. A wall dropped from an earlier revision comes back under its own code.
 */
export function addWall(
  identity: DbIdentity,
  revisionId: string,
  wall: {
    code: string;
    name: string;
    siteId: string;
    lengthM: number | null;
    heightM: number | null;
  },
) {
  return runAsUser(identity, async (db: Tx) => {
    const { rows: revisionRows } = await sql<{ project_id: string }>`
      select project_id from prj.project_revision where id = ${revisionId}::uuid`.execute(db);
    const projectId = revisionRows[0]?.project_id;
    if (!projectId) return null;
    const { rows: existing } = await sql<{ id: string }>`
      select id from prj.wall
       where project_id = ${projectId}::uuid and upper(code) = upper(${wall.code})`.execute(db);
    let wallId = existing[0]?.id;
    if (wallId) {
      await sql`update prj.wall
                   set name = ${wall.name}, site_id = ${wall.siteId}::uuid, updated_at = now(),
                       updated_by_user_id = ${identity.userId}::uuid
                 where id = ${wallId}::uuid`.execute(db);
    } else {
      const { rows } = await sql<{ id: string }>`
        insert into prj.wall (project_id, site_id, code, name)
        values (${projectId}::uuid, ${wall.siteId}::uuid, ${wall.code}, ${wall.name})
        returning id`.execute(db);
      wallId = rows[0].id;
    }
    await sql`insert into prj.revision_wall (revision_id, project_id, wall_id, length_m, height_m)
              values (${revisionId}::uuid, ${projectId}::uuid, ${wallId}::uuid, ${wall.lengthM},
                      ${wall.heightM})`.execute(db);
    return wallId;
  });
}

/** Changes a wall in a draft: its name and site (the wall's), its size (this revision's). */
export function changeWall(
  identity: DbIdentity,
  revisionId: string,
  wallId: string,
  wall: { name: string; siteId: string; lengthM: number | null; heightM: number | null },
) {
  return runAsUser(identity, async (db: Tx) => {
    const { rows } = await sql<{ id: string }>`
      update prj.revision_wall
         set length_m = ${wall.lengthM}, height_m = ${wall.heightM}, updated_at = now(),
             updated_by_user_id = ${identity.userId}::uuid
       where revision_id = ${revisionId}::uuid and wall_id = ${wallId}::uuid
      returning id`.execute(db);
    if (rows.length !== 1) return false;
    await sql`update prj.wall
                 set name = ${wall.name}, site_id = ${wall.siteId}::uuid, updated_at = now(),
                     updated_by_user_id = ${identity.userId}::uuid
               where id = ${wallId}::uuid`.execute(db);
    return true;
  });
}

/** Takes a wall out of a draft, with its targets; the wall and its history stay. */
export function removeWall(identity: DbIdentity, revisionId: string, wallId: string) {
  return runAsUser(identity, async (db: Tx) => {
    const { rows } = await sql<{ id: string }>`
      delete from prj.revision_wall
       where revision_id = ${revisionId}::uuid and wall_id = ${wallId}::uuid
      returning id`.execute(db);
    return rows.length === 1;
  });
}

/** Writes one target line of a draft; the same line again replaces its amount. */
export function setTarget(
  identity: DbIdentity,
  revisionId: string,
  target: {
    wallId: string;
    kind: TargetKind;
    panelTypeId?: string | null;
    stripTypeId?: string | null;
    stripLengthM?: number | null;
    workItemId?: string | null;
    qty?: number | null;
    lengthM?: number | null;
  },
) {
  return runAsUser(identity, async (db: Tx) => {
    const { rows } = await sql<{ id: string }>`
      insert into prj.wall_target (revision_id, wall_id, kind, panel_type_id, strip_type_id,
                                   strip_length_m, work_item_id, qty, length_m)
      values (${revisionId}::uuid, ${target.wallId}::uuid, ${target.kind},
              ${target.panelTypeId ?? null}::uuid, ${target.stripTypeId ?? null}::uuid,
              ${target.stripLengthM ?? null}, ${target.workItemId ?? null}::uuid,
              ${target.qty ?? null}, ${target.lengthM ?? null})
      on conflict (revision_id, wall_id, kind, coalesce(panel_type_id, strip_type_id, work_item_id),
                   coalesce(strip_length_m, 0))
      do update set qty = excluded.qty, length_m = excluded.length_m, updated_at = now(),
                    updated_by_user_id = ${identity.userId}::uuid
      returning id`.execute(db);
    return rows[0].id;
  });
}

export function removeTarget(identity: DbIdentity, targetId: string) {
  return runAsUser(identity, async (db: Tx) => {
    const { rows } = await sql<{ id: string }>`
      delete from prj.wall_target where id = ${targetId}::uuid returning id`.execute(db);
    return rows.length === 1;
  });
}

/** How far a wall has got (REQ-PRJ-006); "completed" publishes `wall.completed`. */
export function setWallStatus(identity: DbIdentity, wallId: string, status: WallStatus) {
  return runAsUser(identity, async (db: Tx) => {
    const { rows } = await sql<{ id: string }>`
      update prj.wall
         set status = ${status}, updated_at = now(), updated_by_user_id = ${identity.userId}::uuid
       where id = ${wallId}::uuid
      returning id`.execute(db);
    return rows.length === 1;
  });
}

/**
 * Panel targets of a project on a day, by panel type — the revision valid that day (D-136). For
 * the daily site log's over-casting rule (TASK-0127), inside its own transaction.
 */
export async function readPanelTargets(
  db: Tx | SystemDb,
  projectId: string,
  on: string,
  siteId?: string | null,
) {
  const { rows } = await sql<{ panel_type_id: string; qty: string; area_m2: string }>`
    select panel_type_id, qty, area_m2
      from prj.panel_targets(${projectId}::uuid, ${on}::date, ${siteId ?? null}::uuid)`.execute(db);
  return rows.map((row) => ({
    areaM2: Number(row.area_m2),
    panelTypeId: row.panel_type_id,
    qty: Number(row.qty),
  }));
}
