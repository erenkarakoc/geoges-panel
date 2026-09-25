import { sql } from "kysely";

import { runAsUser, type DbIdentity, type DbTransaction } from "@/platform/db";
import type { SystemDb } from "@/platform/jobs/types";
import type { SearchProjection } from "@/platform/search/search";

import type { SiteInput, WorkModel } from "@/modules/sit/domain/site";

/**
 * Sites in the database (TASK-0123, migration 0064). A site belongs to one project and never
 * moves; who sees it follows the scope of the person's roles (row level security).
 */

type Tx = DbTransaction<unknown>;

export type Site = {
  id: string;
  projectId: string;
  code: string | null;
  name: string;
  workModel: WorkModel;
  subcontractorPartyId: string | null;
  coordinatorUserId: string | null;
  entryOwnerUserId: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  status: "active" | "passive";
};

type SiteDbRow = {
  id: string;
  project_id: string;
  code: string | null;
  name: string;
  work_model: WorkModel;
  subcontractor_party_id: string | null;
  coordinator_user_id: string | null;
  entry_owner_user_id: string | null;
  city: string | null;
  latitude: string | null;
  longitude: string | null;
  status: "active" | "passive";
};

const site = (row: SiteDbRow): Site => ({
  city: row.city,
  code: row.code,
  coordinatorUserId: row.coordinator_user_id,
  entryOwnerUserId: row.entry_owner_user_id,
  id: row.id,
  latitude: row.latitude === null ? null : Number(row.latitude),
  longitude: row.longitude === null ? null : Number(row.longitude),
  name: row.name,
  projectId: row.project_id,
  status: row.status,
  subcontractorPartyId: row.subcontractor_party_id,
  workModel: row.work_model,
});

/** Sites the person may see; with `projectId`, that project's only. Active ones first. */
export function readSites(identity: DbIdentity, filter: { projectId?: string | null } = {}) {
  return runAsUser(identity, async (db: Tx) => {
    const { rows } = await sql<SiteDbRow>`
      select s.id, s.project_id, s.code, s.name, s.work_model, s.subcontractor_party_id,
             s.coordinator_user_id, s.entry_owner_user_id, s.city, s.latitude, s.longitude,
             s.status
        from sit.site s
       where ${filter.projectId ?? null}::uuid is null or s.project_id = ${filter.projectId ?? null}::uuid
       order by s.status, core.fold_tr(s.name)`.execute(db);
    return rows.map(site);
  });
}

export function readSite(identity: DbIdentity, id: string) {
  return runAsUser(identity, async (db: Tx) => {
    const { rows } = await sql<SiteDbRow>`
      select s.id, s.project_id, s.code, s.name, s.work_model, s.subcontractor_party_id,
             s.coordinator_user_id, s.entry_owner_user_id, s.city, s.latitude, s.longitude,
             s.status
        from sit.site s
       where s.id = ${id}::uuid`.execute(db);
    return rows[0] ? site(rows[0]) : null;
  });
}

export function insertSite(identity: DbIdentity, projectId: string, input: SiteInput) {
  return runAsUser(identity, async (db: Tx) => {
    const { rows } = await sql<{ id: string }>`
      insert into sit.site (project_id, code, name, work_model, subcontractor_party_id,
                            coordinator_user_id, entry_owner_user_id, city, latitude, longitude)
      values (${projectId}::uuid, ${input.code ?? null}, ${input.name}, ${input.workModel},
              ${input.subcontractorPartyId ?? null}::uuid, ${input.coordinatorUserId ?? null}::uuid,
              ${input.entryOwnerUserId ?? null}::uuid, ${input.city ?? null},
              ${input.latitude ?? null}, ${input.longitude ?? null})
      returning id`.execute(db);
    return rows[0].id;
  });
}

/** Rewrites the site's own fields — never its project, which the database would refuse. */
export function updateSite(identity: DbIdentity, id: string, input: SiteInput) {
  return runAsUser(identity, async (db: Tx) => {
    const { rows } = await sql<{ id: string }>`
      update sit.site
         set code = ${input.code ?? null}, name = ${input.name}, work_model = ${input.workModel},
             subcontractor_party_id = ${input.subcontractorPartyId ?? null}::uuid,
             coordinator_user_id = ${input.coordinatorUserId ?? null}::uuid,
             entry_owner_user_id = ${input.entryOwnerUserId ?? null}::uuid,
             city = ${input.city ?? null}, latitude = ${input.latitude ?? null},
             longitude = ${input.longitude ?? null},
             updated_at = now(), updated_by_user_id = ${identity.userId}::uuid
       where id = ${id}::uuid
      returning id`.execute(db);
    return rows.length === 1;
  });
}

export function setSiteStatus(identity: DbIdentity, id: string, status: "active" | "passive") {
  return runAsUser(identity, async (db: Tx) => {
    const { rows } = await sql<{ id: string }>`
      update sit.site
         set status = ${status}, updated_at = now(), updated_by_user_id = ${identity.userId}::uuid
       where id = ${id}::uuid
      returning id`.execute(db);
    return rows.length === 1;
  });
}

// ---------------------------------------------------------------------------------------------
// Search (TASK-0110): a site as it looks in the site-wide search, read as the system.
// ---------------------------------------------------------------------------------------------

type ProjectedRow = {
  id: string;
  project_id: string;
  name: string;
  code: string | null;
  city: string | null;
  status: string;
};

/** Project names for search come from PRJ's own query, handed in by the registration. */
export type ProjectNames = (db: SystemDb, ids: readonly string[]) => Promise<Map<string, string>>;

function projection(row: ProjectedRow, projectName: string | null): SearchProjection {
  return {
    dataClass: "internal",
    linkPath: `/sites/${row.id}`,
    projectId: row.project_id,
    recordType: "sit.site",
    secondary:
      [projectName, row.city, row.status === "passive" ? "pasif" : null]
        .filter(Boolean)
        .join(" · ") || null,
    siteId: row.id,
    text: [row.name, row.code, row.city, projectName].filter(Boolean).join(" "),
    title: row.name,
  };
}

/**
 * How sites look in search. The indexer hands over its system connection untyped
 * (`SearchProjector`); it is a SystemDb.
 */
export function siteSearch(projectNames: ProjectNames) {
  return {
    async project(db: unknown, id: string): Promise<SearchProjection | null> {
      const system = db as SystemDb;
      const { rows } = await sql<ProjectedRow>`
        select id, project_id, name, code, city, status from sit.site
         where id = ${id}::uuid`.execute(system);
      if (!rows[0]) return null;
      const names = await projectNames(system, [rows[0].project_id]);
      return projection(rows[0], names.get(rows[0].project_id) ?? null);
    },
    async scan(db: SystemDb, afterId: string | null, limit: number) {
      const { rows } = await sql<ProjectedRow>`
        select id, project_id, name, code, city, status from sit.site
         where ${afterId}::uuid is null or id > ${afterId}::uuid
         order by id
         limit ${limit}`.execute(db);
      const names = await projectNames(db, [...new Set(rows.map((row) => row.project_id))]);
      return rows.map((row) => ({
        id: row.id,
        projection: projection(row, names.get(row.project_id) ?? null),
      }));
    },
  };
}
