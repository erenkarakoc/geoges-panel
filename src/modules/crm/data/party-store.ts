import { sql } from "kysely";

import { runAsUser, type DbIdentity, type DbTransaction } from "@/platform/db";
import type { SystemDb } from "@/platform/jobs/types";
import type { SearchProjection } from "@/platform/search/search";

import {
  roleWords,
  type ContactInput,
  type PartyInput,
  type PartyRole,
  type PartyStatus,
} from "@/modules/crm/domain/party";

/**
 * Firms in the database (TASK-0122, migration 0062). One card per firm is the database's rule —
 * the tax number is unique there and names are compared there — so this layer asks and reads.
 */

type Tx = DbTransaction<unknown>;

export type Party = {
  id: string;
  name: string;
  taxNo: string | null;
  taxOffice: string | null;
  roles: PartyRole[];
  city: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  note: string | null;
  status: PartyStatus;
  customFields: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
};

export type PartyRow = Pick<Party, "id" | "name" | "taxNo" | "roles" | "city" | "status">;

export type PartyContact = {
  id: string;
  partyId: string;
  name: string;
  title: string | null;
  phone: string | null;
  email: string | null;
  status: PartyStatus;
};

type PartyDbRow = {
  id: string;
  name: string;
  tax_no: string | null;
  tax_office: string | null;
  roles: PartyRole[];
  city: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  note: string | null;
  status: PartyStatus;
  custom_fields: Record<string, unknown> | null;
  created_at: Date;
  updated_at: Date;
};

const party = (row: PartyDbRow): Party => ({
  address: row.address,
  city: row.city,
  createdAt: row.created_at,
  customFields: row.custom_fields ?? {},
  email: row.email,
  id: row.id,
  name: row.name,
  note: row.note,
  phone: row.phone,
  roles: row.roles,
  status: row.status,
  taxNo: row.tax_no,
  taxOffice: row.tax_office,
  updatedAt: row.updated_at,
});

/**
 * Firms for the list: active ones first, by name. `words` narrows by name, tax number or city,
 * Turkish-folded ("sogut" finds "Söğüt"); `role` narrows to one role.
 */
export function readParties(
  identity: DbIdentity,
  filter: { words?: string | null; role?: PartyRole | null; limit?: number } = {},
) {
  return runAsUser(identity, async (db: Tx) => {
    const words = filter.words?.trim() || null;
    const { rows } = await sql<{
      id: string;
      name: string;
      tax_no: string | null;
      roles: PartyRole[];
      city: string | null;
      status: PartyStatus;
    }>`select id, name, tax_no, roles, city, status
         from crm.party
        where (${filter.role ?? null}::text is null or ${filter.role ?? null}::text = any (roles))
          and (${words}::text is null
               or core.fold_tr(name || ' ' || coalesce(tax_no, '') || ' ' || coalesce(city, ''))
                  like '%' || core.fold_tr(${words}::text) || '%')
        order by status, core.fold_tr(name)
        limit ${filter.limit ?? 500}`.execute(db);
    return rows.map((row): PartyRow => ({
      city: row.city,
      id: row.id,
      name: row.name,
      roles: row.roles,
      status: row.status,
      taxNo: row.tax_no,
    }));
  });
}

export function readParty(identity: DbIdentity, id: string) {
  return runAsUser(identity, async (db: Tx) => {
    const { rows } = await sql<PartyDbRow>`
      select id, name, tax_no, tax_office, roles, city, address, phone, email, note, status,
             custom_fields, created_at, updated_at
        from crm.party
       where id = ${id}::uuid`.execute(db);
    return rows[0] ? party(rows[0]) : null;
  });
}

/**
 * Names of firms by id — what other records show (a project's client, a site's subcontractor).
 * Every signed-in person reads a firm's row (0062), so this asks for no card right.
 */
export function readPartyNames(identity: DbIdentity, ids: readonly string[]) {
  return runAsUser(identity, async (db: Tx) => {
    if (ids.length === 0) return new Map<string, string>();
    const { rows } = await sql<{ id: string; name: string }>`
      select id, name from crm.party where id = any (${[...ids]}::uuid[])`.execute(db);
    return new Map(rows.map((row) => [row.id, row.name]));
  });
}

/** Active firms holding a role, by name — for another record's firm picker. */
export function readPartiesWithRole(identity: DbIdentity, role: PartyRole) {
  return runAsUser(identity, async (db: Tx) => {
    const { rows } = await sql<{ id: string; name: string }>`
      select id, name from crm.party
       where status = 'active' and ${role}::text = any (roles)
       order by core.fold_tr(name)`.execute(db);
    return rows;
  });
}

/** The firm already carrying this tax number, if there is one — "open its card instead". */
export function readPartyByTaxNo(identity: DbIdentity, taxNo: string) {
  return runAsUser(identity, async (db: Tx) => {
    const { rows } = await sql<{ id: string; name: string }>`
      select id, name from crm.party where upper(tax_no) = upper(${taxNo})`.execute(db);
    return rows[0] ?? null;
  });
}

/** Firms whose name looks like the given one (REQ-CRM-004), the card itself left out. */
export function readSimilarParties(identity: DbIdentity, name: string, except?: string | null) {
  return runAsUser(identity, async (db: Tx) => {
    const { rows } = await sql<{
      id: string;
      name: string;
      roles: PartyRole[];
      city: string | null;
      status: PartyStatus;
    }>`select id, name, roles, city, status
         from crm.similar_parties(${name}, ${except ?? null}::uuid)`.execute(db);
    return rows;
  });
}

export function insertParty(identity: DbIdentity, input: PartyInput) {
  return runAsUser(identity, async (db: Tx) => {
    const { rows } = await sql<{ id: string }>`
      insert into crm.party (name, tax_no, tax_office, roles, city, address, phone, email, note)
      values (${input.name}, ${input.taxNo ?? null}, ${input.taxOffice ?? null},
              ${input.roles}::text[], ${input.city ?? null}, ${input.address ?? null},
              ${input.phone ?? null}, ${input.email ?? null}, ${input.note ?? null})
      returning id`.execute(db);
    return rows[0].id;
  });
}

/** Rewrites the card's own fields; the history keeps what they were. */
export function updateParty(identity: DbIdentity, id: string, input: PartyInput) {
  return runAsUser(identity, async (db: Tx) => {
    const { rows } = await sql<{ id: string }>`
      update crm.party
         set name = ${input.name}, tax_no = ${input.taxNo ?? null},
             tax_office = ${input.taxOffice ?? null}, roles = ${input.roles}::text[],
             city = ${input.city ?? null}, address = ${input.address ?? null},
             phone = ${input.phone ?? null}, email = ${input.email ?? null},
             note = ${input.note ?? null},
             updated_at = now(), updated_by_user_id = core.current_user_id()
       where id = ${id}::uuid
      returning id`.execute(db);
    return rows.length === 1;
  });
}

/** Adds a role to a firm that already has a card — the answer to "this firm, again" (REQ-PUR-001). */
export function addPartyRole(identity: DbIdentity, id: string, role: PartyRole) {
  return runAsUser(identity, async (db: Tx) => {
    const { rows } = await sql<{ id: string }>`
      update crm.party
         set roles = array(select r from unnest(array['client', 'customer', 'supplier',
                                                      'subcontractor', 'lessor']) as r
                            where r = any (roles) or r = ${role}),
             updated_at = now(), updated_by_user_id = core.current_user_id()
       where id = ${id}::uuid
      returning id`.execute(db);
    return rows.length === 1;
  });
}

export function setPartyStatus(identity: DbIdentity, id: string, status: PartyStatus) {
  return runAsUser(identity, async (db: Tx) => {
    const { rows } = await sql<{ id: string }>`
      update crm.party
         set status = ${status}, updated_at = now(), updated_by_user_id = core.current_user_id()
       where id = ${id}::uuid
      returning id`.execute(db);
    return rows.length === 1;
  });
}

export function setPartyCustomFields(
  identity: DbIdentity,
  id: string,
  values: Record<string, unknown>,
) {
  return runAsUser(identity, async (db: Tx) => {
    const { rows } = await sql<{ id: string }>`
      update crm.party
         set custom_fields = ${JSON.stringify(values)}::jsonb,
             updated_at = now(), updated_by_user_id = core.current_user_id()
       where id = ${id}::uuid
      returning id`.execute(db);
    return rows.length === 1;
  });
}

/** A firm's people, the ones still there first. Empty for whoever may not open firm cards. */
export function readContacts(identity: DbIdentity, partyId: string) {
  return runAsUser(identity, async (db: Tx) => {
    const { rows } = await sql<{
      id: string;
      party_id: string;
      name: string;
      title: string | null;
      phone: string | null;
      email: string | null;
      status: PartyStatus;
    }>`select id, party_id, name, title, phone, email, status
         from crm.party_contact
        where party_id = ${partyId}::uuid
        order by status, core.fold_tr(name)`.execute(db);
    return rows.map((row): PartyContact => ({
      email: row.email,
      id: row.id,
      name: row.name,
      partyId: row.party_id,
      phone: row.phone,
      status: row.status,
      title: row.title,
    }));
  });
}

export function insertContact(identity: DbIdentity, partyId: string, input: ContactInput) {
  return runAsUser(identity, async (db: Tx) => {
    const { rows } = await sql<{ id: string }>`
      insert into crm.party_contact (party_id, name, title, phone, email)
      values (${partyId}::uuid, ${input.name}, ${input.title ?? null}, ${input.phone ?? null},
              ${input.email ?? null})
      returning id`.execute(db);
    return rows[0].id;
  });
}

export function updateContact(
  identity: DbIdentity,
  id: string,
  change: ContactInput & { status?: PartyStatus },
) {
  return runAsUser(identity, async (db: Tx) => {
    const { rows } = await sql<{ id: string }>`
      update crm.party_contact
         set name = ${change.name}, title = ${change.title ?? null},
             phone = ${change.phone ?? null}, email = ${change.email ?? null},
             status = coalesce(${change.status ?? null}, status),
             updated_at = now(), updated_by_user_id = core.current_user_id()
       where id = ${id}::uuid
      returning id`.execute(db);
    return rows.length === 1;
  });
}

export function setContactStatus(identity: DbIdentity, id: string, status: PartyStatus) {
  return runAsUser(identity, async (db: Tx) => {
    const { rows } = await sql<{ id: string }>`
      update crm.party_contact
         set status = ${status}, updated_at = now(), updated_by_user_id = core.current_user_id()
       where id = ${id}::uuid
      returning id`.execute(db);
    return rows.length === 1;
  });
}

// ---------------------------------------------------------------------------------------------
// Search (TASK-0110, D-266): how a firm looks in the site-wide search, read as the system.
// ---------------------------------------------------------------------------------------------

type ProjectedRow = {
  id: string;
  name: string;
  tax_no: string | null;
  roles: PartyRole[];
  city: string | null;
  status: PartyStatus;
};

function projection(row: ProjectedRow): SearchProjection {
  const roles = roleWords(row.roles);
  const second = [roles, row.city, row.status === "passive" ? "pasif" : null]
    .filter(Boolean)
    .join(" · ");
  return {
    dataClass: "internal",
    linkPath: `/leads-clients/parties/${row.id}`,
    recordType: "crm.party",
    secondary: second || null,
    text: [row.name, row.tax_no, row.city, roles].filter(Boolean).join(" "),
    title: row.name,
  };
}

/** The indexer hands over its system connection untyped (`SearchProjector`); it is a SystemDb. */
export async function projectPartyForSearch(
  db: unknown,
  id: string,
): Promise<SearchProjection | null> {
  const { rows } = await sql<ProjectedRow>`
    select id, name, tax_no, roles, city, status from crm.party
     where id = ${id}::uuid`.execute(db as SystemDb);
  return rows[0] ? projection(rows[0]) : null;
}

export async function scanPartiesForSearch(db: SystemDb, afterId: string | null, limit: number) {
  const { rows } = await sql<ProjectedRow>`
    select id, name, tax_no, roles, city, status from crm.party
     where ${afterId}::uuid is null or id > ${afterId}::uuid
     order by id
     limit ${limit}`.execute(db);
  return rows.map((row) => ({ id: row.id, projection: projection(row) }));
}
