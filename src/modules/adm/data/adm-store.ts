import { sql, type Kysely } from "kysely";

import { runAsUser, type DbIdentity, type DbTransaction } from "@/platform/db";

import type {
  CustomFieldDefinition,
  CustomFieldTable,
  RuleResult,
  RuleScope,
} from "@/modules/adm/domain/configuration";

/**
 * ADM's data layer (TASK-0105). The rules live in the database functions of migration 0007; this
 * layer only asks them.
 */

export type { DbIdentity };

type Tx = DbTransaction<unknown>;

/**
 * The rule valid on a date for a place, inside any transaction — a request's or a worker
 * handler's — so a calculation reads the rule in the same transaction it writes its result in.
 */
export async function readRule<DB>(
  db: Kysely<DB>,
  key: string,
  on: string,
  scope: RuleScope = {},
): Promise<RuleResult> {
  const { rows } = await sql<{
    rule_id: string;
    value: unknown;
    valid_from: string;
    scope_type: "company" | "unit" | "project" | "site";
  }>`select rule_id, value, valid_from::text as valid_from, scope_type
       from adm.rule_value(${key}, ${on}::date, ${scope.siteId ?? null}::uuid,
                           ${scope.projectId ?? null}::uuid, ${scope.unitId ?? null}::uuid)`.execute(
    db,
  );
  const row = rows[0];
  return row
    ? {
        found: true,
        ruleId: row.rule_id,
        value: row.value,
        validFrom: row.valid_from,
        scopeType: row.scope_type,
      }
    : { found: false, key, on };
}

export function readRuleAs(identity: DbIdentity, key: string, on: string, scope?: RuleScope) {
  return runAsUser(identity, (db: Tx) => readRule(db, key, on, scope));
}

export type CatalogItem = { id: string; name: string; projectId: string | null };

/** Items that look like a new name, before it is added (REQ-ADM-006). */
export function readSimilarItems(
  identity: DbIdentity,
  catalogKey: string,
  name: string,
  projectId: string | null = null,
) {
  return runAsUser(identity, async (db: Tx) => {
    const { rows } = await sql<{ id: string; name: string; project_id: string | null }>`
      select id, name, project_id
        from adm.similar_catalog_items(${catalogKey}, ${name}, ${projectId}::uuid)`.execute(db);
    return rows.map((r): CatalogItem => ({ id: r.id, name: r.name, projectId: r.project_id }));
  });
}

/** Adds an item; the policy decides whether this person may add to this catalog. */
export function insertCatalogItem(
  identity: DbIdentity,
  item: { catalogKey: string; name: string; code?: string | null; projectId?: string | null },
) {
  return runAsUser(identity, async (db: Tx) => {
    const { rows } = await sql<{ id: string }>`
      insert into adm.catalog_item (catalog_id, code, name, project_id)
      select c.id, ${item.code ?? null}, ${item.name.trim()}, ${item.projectId ?? null}::uuid
        from adm.catalog c where c.key = ${item.catalogKey}
      returning id`.execute(db);
    if (!rows.length) throw new Error(`no catalog ${item.catalogKey}`);
    return rows[0].id;
  });
}

export function mergeItems(identity: DbIdentity, fromId: string, intoId: string, reason: string) {
  return runAsUser(identity, async (db: Tx) => {
    await sql`select adm.merge_catalog_items(${fromId}::uuid, ${intoId}::uuid, ${reason})`.execute(
      db,
    );
  });
}

/** The item a record's (possibly merged) item stands for today, with its name. */
export function readFinalItem(identity: DbIdentity, itemId: string) {
  return runAsUser(identity, async (db: Tx) => {
    const { rows } = await sql<{ id: string; name: string }>`
      select i.id, i.name from adm.catalog_item i
       where i.id = adm.catalog_item_final(${itemId}::uuid)`.execute(db);
    return rows[0] ?? null;
  });
}

export function readCustomFields(identity: DbIdentity, table: CustomFieldTable) {
  return runAsUser(identity, async (db: Tx) => {
    const { rows } = await sql<{
      id: string;
      code: string;
      label: string;
      field_type: CustomFieldDefinition["type"];
      options: CustomFieldDefinition["options"];
      is_required: boolean;
      is_searchable: boolean;
      data_class: CustomFieldDefinition["dataClass"];
      order_no: number;
      retired_at: Date | null;
    }>`select id, code, label, field_type, options, is_required, is_searchable, data_class,
              order_no, retired_at
         from adm.custom_field where record_table = ${table}
        order by order_no, label`.execute(db);
    return rows.map((r): CustomFieldDefinition => ({
      id: r.id,
      recordTable: table,
      code: r.code,
      label: r.label,
      type: r.field_type,
      options: r.options,
      isRequired: r.is_required,
      isSearchable: r.is_searchable,
      dataClass: r.data_class,
      orderNo: r.order_no,
      retired: r.retired_at !== null,
    }));
  });
}

/**
 * Turns a catalog item passive or back (SCR-190). An item is never deleted — history still points at
 * it — and a merged item stays passive, which the table's own check says.
 */
export function setCatalogItemStatus(
  identity: DbIdentity,
  itemId: string,
  status: "active" | "passive",
) {
  return runAsUser(identity, async (db: Tx) => {
    const { rows } = await sql<{ id: string }>`
      update adm.catalog_item set status = ${status}
       where id = ${itemId}::uuid
      returning id`.execute(db);
    return rows.length === 1;
  });
}
