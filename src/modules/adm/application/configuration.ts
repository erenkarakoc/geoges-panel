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
import { calendarAs } from "@/modules/adm/data/calendar-and-rates";
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

// Calendar and exchange rates (TASK-0106, REQ-ADM-010…015).

type CalendarScope = Pick<RuleScope, "siteId" | "unitId">;

/** A working day of the calendar in force for the place (holidays and weekend excluded). */
export async function isBusinessDay(day: string, scope?: CalendarScope) {
  return calendarAs.isBusinessDay(await identity(), day, scope);
}

/** A deadline: `days` business days after (or before) a day, for the place. */
export async function addBusinessDays(day: string, days: number, scope?: CalendarScope) {
  return calendarAs.addBusinessDays(await identity(), day, days, scope);
}

/**
 * The rate an amount dated `on` uses (D-140). `null`: the amount waits for its rate ("kur
 * bekliyor") and is completed when `exchange_rate.received` arrives.
 */
export async function rateFor(currency: string, on: string) {
  return calendarAs.rateFor(await identity(), currency, on);
}

/** A manual rate for a bulletin day, with its reason (REQ-ADM-014); needs `adm.module.manage`. */
export async function enterManualRate(rate: {
  currency: string;
  bulletinOn: string;
  rate: number;
  reason: string;
}) {
  await assertCan("adm.module.manage");
  return calendarAs.enterManualRate(await identity(), rate);
}
