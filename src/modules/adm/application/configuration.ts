import "server-only";

import { cache } from "react";

import {
  insertCatalogItem,
  mergeItems,
  readCustomFields,
  readFinalItem,
  readRuleAs,
  readSimilarItems,
} from "@/modules/adm/data/adm-store";
import type { CustomFieldTable, RuleScope } from "@/modules/adm/domain/configuration";
import { AccessDeniedError, assertCan, signInIdentity } from "@/modules/iam";

/**
 * The configuration service (TASK-0105, CONFIGURATION section 6). Every module reads its
 * thresholds, catalogs and custom fields here; no module writes a threshold into its code.
 */

async function identity() {
  const signedIn = await signInIdentity();
  if (!signedIn) throw new AccessDeniedError("iam.session");
  return signedIn.identity;
}

/**
 * The rule valid on `on` (the event's date, YYYY-MM-DD) for a place. Cached for the request: a
 * new validity row is seen by the next request. Inside a transaction (a calculation that
 * writes), use `readRule` from the module surface with that transaction instead.
 */
export const getRule = cache(async (key: string, on: string, scope: RuleScope = {}) =>
  readRuleAs(await identity(), key, on, scope),
);

export async function findSimilarCatalogItems(
  catalogKey: string,
  name: string,
  projectId: string | null = null,
) {
  return readSimilarItems(await identity(), catalogKey, name, projectId);
}

export async function addCatalogItem(item: {
  catalogKey: string;
  name: string;
  code?: string | null;
  projectId?: string | null;
}) {
  return insertCatalogItem(await identity(), item);
}

/** Merges two items (REQ-ADM-006); needs `adm.module.manage`. */
export async function mergeCatalogItems(fromId: string, intoId: string, reason: string) {
  await assertCan("adm.module.manage");
  return mergeItems(await identity(), fromId, intoId, reason);
}

/** The item a stored item id stands for today (follows merges), for display. */
export async function currentCatalogItem(itemId: string) {
  return readFinalItem(await identity(), itemId);
}

export const customFieldDefinitions = cache(async (table: CustomFieldTable) =>
  readCustomFields(await identity(), table),
);
