import { sql } from "kysely";

import { runAsUser, type DbIdentity, type DbTransaction } from "@/platform/db";
import type { SystemDb } from "@/platform/jobs/types";
import type { SearchProjection } from "@/platform/search/search";

import type { ContractInput, ProjectInput } from "@/modules/prj/domain/project";

/**
 * Projects in the database (TASK-0123, migration 0064). Who sees which project, and whether the
 * contract value reaches them at all, is row level security's; this layer asks and reads.
 */

type Tx = DbTransaction<unknown>;

export type ProjectRow = {
  id: string;
  code: string;
  name: string;
  clientPartyId: string | null;
  city: string | null;
  stage: string;
  coordinatorUserId: string | null;
};

export type Project = ProjectRow & {
  authority: string | null;
  location: string | null;
  contractNo: string | null;
  contractSignedOn: string | null;
  contractStartOn: string | null;
  contractEndOn: string | null;
  theoreticalEndOn: string | null;
  managementTargetEndOn: string | null;
  customFields: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
};

/** The commercial part: absent (null) for whoever may not see it. */
export type ProjectContract = { contractValue: number | null; currency: string };

export type StageChange = {
  fromStage: string | null;
  toStage: string;
  changedAt: Date;
  changedByUserId: string | null;
};

type ProjectDbRow = {
  id: string;
  code: string;
  name: string;
  client_party_id: string | null;
  authority: string | null;
  city: string | null;
  location: string | null;
  contract_no: string | null;
  contract_signed_on: string | null;
  contract_start_on: string | null;
  contract_end_on: string | null;
  theoretical_end_on: string | null;
  management_target_end_on: string | null;
  coordinator_user_id: string | null;
  stage: string;
  custom_fields: Record<string, unknown> | null;
  created_at: Date;
  updated_at: Date;
};

const project = (row: ProjectDbRow): Project => ({
  authority: row.authority,
  city: row.city,
  clientPartyId: row.client_party_id,
  code: row.code,
  contractEndOn: row.contract_end_on,
  contractNo: row.contract_no,
  contractSignedOn: row.contract_signed_on,
  contractStartOn: row.contract_start_on,
  coordinatorUserId: row.coordinator_user_id,
  createdAt: row.created_at,
  customFields: row.custom_fields ?? {},
  id: row.id,
  location: row.location,
  managementTargetEndOn: row.management_target_end_on,
  name: row.name,
  stage: row.stage,
  theoreticalEndOn: row.theoretical_end_on,
  updatedAt: row.updated_at,
});

/** Projects the person may see, by code; `words` narrows by code, name, city or authority. */
export function readProjects(identity: DbIdentity, filter: { words?: string | null } = {}) {
  return runAsUser(identity, async (db: Tx) => {
    const words = filter.words?.trim() || null;
    const { rows } = await sql<{
      id: string;
      code: string;
      name: string;
      client_party_id: string | null;
      city: string | null;
      stage: string;
      coordinator_user_id: string | null;
    }>`select id, code, name, client_party_id, city, stage, coordinator_user_id
         from prj.project
        where ${words}::text is null
           or core.fold_tr(code || ' ' || name || ' ' || coalesce(city, '') || ' '
                           || coalesce(authority, ''))
              like '%' || core.fold_tr(${words}::text) || '%'
        order by upper(code)
        limit 500`.execute(db);
    return rows.map((row): ProjectRow => ({
      city: row.city,
      clientPartyId: row.client_party_id,
      code: row.code,
      coordinatorUserId: row.coordinator_user_id,
      id: row.id,
      name: row.name,
      stage: row.stage,
    }));
  });
}

export function readProject(identity: DbIdentity, id: string) {
  return runAsUser(identity, async (db: Tx) => {
    const { rows } = await sql<ProjectDbRow>`
      select id, code, name, client_party_id, authority, city, location, contract_no,
             contract_signed_on::text, contract_start_on::text, contract_end_on::text,
             theoretical_end_on::text, management_target_end_on::text, coordinator_user_id,
             stage, custom_fields, created_at, updated_at
        from prj.project where id = ${id}::uuid`.execute(db);
    if (!rows[0]) return null;
    const { rows: contract } = await sql<{ contract_value: string | null; currency: string }>`
      select contract_value, currency from prj.project_contract
       where project_id = ${id}::uuid`.execute(db);
    const { rows: stages } = await sql<{
      from_stage: string | null;
      to_stage: string;
      changed_at: Date;
      changed_by_user_id: string | null;
    }>`select from_stage, to_stage, changed_at, changed_by_user_id
         from prj.project_stage_change where project_id = ${id}::uuid
        order by changed_at, id`.execute(db);
    return {
      contract: contract[0]
        ? {
            contractValue:
              contract[0].contract_value === null ? null : Number(contract[0].contract_value),
            currency: contract[0].currency,
          }
        : null,
      project: project(rows[0]),
      stages: stages.map((row): StageChange => ({
        changedAt: row.changed_at,
        changedByUserId: row.changed_by_user_id,
        fromStage: row.from_stage,
        toStage: row.to_stage,
      })),
    };
  });
}

export function insertProject(
  identity: DbIdentity,
  input: ProjectInput,
  contract: ContractInput | null,
) {
  return runAsUser(identity, async (db: Tx) => {
    const { rows } = await sql<{ id: string }>`
      insert into prj.project (code, name, client_party_id, authority, city, location,
                               contract_no, contract_signed_on, contract_start_on,
                               contract_end_on, theoretical_end_on, management_target_end_on,
                               coordinator_user_id)
      values (${input.code}, ${input.name}, ${input.clientPartyId ?? null}::uuid,
              ${input.authority ?? null}, ${input.city ?? null}, ${input.location ?? null},
              ${input.contractNo ?? null}, ${input.contractSignedOn ?? null}::date,
              ${input.contractStartOn ?? null}::date, ${input.contractEndOn ?? null}::date,
              ${input.theoreticalEndOn ?? null}::date,
              ${input.managementTargetEndOn ?? null}::date,
              ${input.coordinatorUserId ?? null}::uuid)
      returning id`.execute(db);
    const id = rows[0].id;
    if (contract) {
      await sql`insert into prj.project_contract (project_id, contract_value, currency)
                values (${id}::uuid, ${contract.contractValue}, ${contract.currency})`.execute(db);
    }
    return id;
  });
}

/** Rewrites the card's own fields; the history keeps what they were. */
export function updateProject(identity: DbIdentity, id: string, input: ProjectInput) {
  return runAsUser(identity, async (db: Tx) => {
    const { rows } = await sql<{ id: string }>`
      update prj.project
         set code = ${input.code}, name = ${input.name},
             client_party_id = ${input.clientPartyId ?? null}::uuid,
             authority = ${input.authority ?? null}, city = ${input.city ?? null},
             location = ${input.location ?? null}, contract_no = ${input.contractNo ?? null},
             contract_signed_on = ${input.contractSignedOn ?? null}::date,
             contract_start_on = ${input.contractStartOn ?? null}::date,
             contract_end_on = ${input.contractEndOn ?? null}::date,
             theoretical_end_on = ${input.theoreticalEndOn ?? null}::date,
             management_target_end_on = ${input.managementTargetEndOn ?? null}::date,
             coordinator_user_id = ${input.coordinatorUserId ?? null}::uuid,
             updated_at = now(), updated_by_user_id = ${identity.userId}::uuid
       where id = ${id}::uuid
      returning id`.execute(db);
    return rows.length === 1;
  });
}

/** Writes the contract value; refused by the database without the commercial right. */
export function saveContract(identity: DbIdentity, projectId: string, contract: ContractInput) {
  return runAsUser(identity, async (db: Tx) => {
    const { rows } = await sql<{ id: string }>`
      insert into prj.project_contract (project_id, contract_value, currency)
      values (${projectId}::uuid, ${contract.contractValue}, ${contract.currency})
      on conflict (project_id) do update
        set contract_value = excluded.contract_value, currency = excluded.currency,
            updated_at = now(), updated_by_user_id = ${identity.userId}::uuid
      returning id`.execute(db);
    return rows.length === 1;
  });
}

export function setProjectStage(identity: DbIdentity, id: string, stage: string) {
  return runAsUser(identity, async (db: Tx) => {
    const { rows } = await sql<{ id: string }>`
      update prj.project
         set stage = ${stage}, updated_at = now(), updated_by_user_id = ${identity.userId}::uuid
       where id = ${id}::uuid
      returning id`.execute(db);
    return rows.length === 1;
  });
}

/** The flow engine moves a stage with system authority (D-082, REQ-WFL-010). */
export async function setProjectStageAsSystem(db: SystemDb, id: string, stage: string) {
  const { rows } = await sql<{ id: string }>`
    update prj.project set stage = ${stage}, updated_at = now()
     where id = ${id}::uuid
    returning id`.execute(db);
  return rows.length === 1;
}

/** Project names by id, read as the system — for other modules' search lines (sites). */
export async function readProjectNamesAsSystem(db: SystemDb, ids: readonly string[]) {
  if (ids.length === 0) return new Map<string, string>();
  const { rows } = await sql<{ id: string; name: string }>`
    select id, name from prj.project where id = any (${[...ids]}::uuid[])`.execute(db);
  return new Map(rows.map((row) => [row.id, row.name]));
}

/** Project names by id, as far as the person may see them (a site's card, the site list). */
export function readProjectNames(identity: DbIdentity, ids: readonly string[]) {
  return runAsUser(identity, async (db: Tx) => {
    if (ids.length === 0) return new Map<string, string>();
    const { rows } = await sql<{ id: string; name: string }>`
      select id, name from prj.project where id = any (${[...ids]}::uuid[])`.execute(db);
    return new Map(rows.map((row) => [row.id, row.name]));
  });
}

// ---------------------------------------------------------------------------------------------
// Search (TASK-0110): a project as it looks in the site-wide search, read as the system. The
// contract value never enters the search text.
// ---------------------------------------------------------------------------------------------

type ProjectedRow = {
  id: string;
  code: string;
  name: string;
  city: string | null;
  authority: string | null;
};

function projection(row: ProjectedRow): SearchProjection {
  return {
    dataClass: "internal",
    linkPath: `/projects/${row.id}`,
    projectId: row.id,
    recordType: "prj.project",
    secondary: [row.code, row.city].filter(Boolean).join(" · ") || null,
    text: [row.code, row.name, row.city, row.authority].filter(Boolean).join(" "),
    title: row.name,
  };
}

/** The indexer hands over its system connection untyped (`SearchProjector`); it is a SystemDb. */
export async function projectProjectForSearch(
  db: unknown,
  id: string,
): Promise<SearchProjection | null> {
  const { rows } = await sql<ProjectedRow>`
    select id, code, name, city, authority from prj.project
     where id = ${id}::uuid`.execute(db as SystemDb);
  return rows[0] ? projection(rows[0]) : null;
}

export async function scanProjectsForSearch(db: SystemDb, afterId: string | null, limit: number) {
  const { rows } = await sql<ProjectedRow>`
    select id, code, name, city, authority from prj.project
     where ${afterId}::uuid is null or id > ${afterId}::uuid
     order by id
     limit ${limit}`.execute(db);
  return rows.map((row) => ({ id: row.id, projection: projection(row) }));
}
