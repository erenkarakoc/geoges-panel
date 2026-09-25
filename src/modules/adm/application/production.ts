import "server-only";

import {
  insertPanelType,
  insertRecipeLine,
  insertStripType,
  readCatalogItems,
  readCatalogs,
  readPanelTypes,
  readRecipeLines,
  readStripTypes,
  updatePanelType,
  updateStripType,
} from "@/modules/adm/data/production-store";
import { setCatalogItemStatus } from "@/modules/adm/data/adm-store";
import {
  panelTypeInput,
  productionMessage,
  recipeLineInput,
  stripTypeInput,
} from "@/modules/adm/domain/production";
import {
  AccessDeniedError,
  assertCan,
  can,
  readEffectivePermissions,
  signInIdentity,
} from "@/modules/iam";

/**
 * Production definitions for SCR-190 (TASK-0121). Everybody signed in reads them — every daily log
 * is built from them — and only a holder of `adm.module.manage` changes them; the database says the
 * same thing again, so this is the early answer, not the only one.
 */

async function identity() {
  const signedIn = await signInIdentity();
  if (!signedIn) throw new AccessDeniedError("iam.session");
  return signedIn.identity;
}

/** Whether the person asking may change definitions — the screen shows its buttons from this. */
export async function mayManageDefinitions(): Promise<boolean> {
  const snapshot = await readEffectivePermissions();
  return Boolean(snapshot && can(snapshot, "adm.module.manage"));
}

/** Whether the person may open SCR-190 at all. */
export async function mayViewDefinitions(): Promise<boolean> {
  const snapshot = await readEffectivePermissions();
  return Boolean(
    snapshot && (can(snapshot, "adm.module.view") || can(snapshot, "adm.module.manage")),
  );
}

export async function listPanelTypes() {
  return readPanelTypes(await identity());
}

export async function listStripTypes() {
  return readStripTypes(await identity());
}

export async function listRecipeLines() {
  return readRecipeLines(await identity());
}

export async function listCatalogItems(catalogKey: string) {
  return readCatalogItems(await identity(), catalogKey);
}

export async function listCatalogs() {
  return readCatalogs(await identity());
}

/** What happened, in a sentence: a refusal the person can act on, or nothing. */
export type DefinitionResult = { error: string | null; id?: string | null };

function refusal(error: unknown): string | null {
  if (error instanceof AccessDeniedError) return "Tanımları değiştirme yetkiniz yok.";
  const failure = error as { code?: string; hint?: string };
  if (failure.code === "23505") return "Bu kodla ya da bu adla bir tanım zaten var.";
  if (failure.code === "23514") return "Birleştirilmiş bir kalem yeniden etkinleştirilemez.";
  if (failure.code === "42501") return "Tanımları değiştirme yetkiniz yok.";
  return productionMessage(failure.hint);
}

async function attempt(work: () => Promise<string | boolean | null>): Promise<DefinitionResult> {
  try {
    await assertCan("adm.module.manage");
    const done = await work();
    return { error: null, id: typeof done === "string" ? done : null };
  } catch (error) {
    const said = refusal(error);
    if (said) return { error: said };
    throw error;
  }
}

/** The form's own words come first; the database is asked only with a valid definition. */
function firstIssue(issues: readonly { message: string }[]): DefinitionResult {
  return { error: issues[0]?.message ?? "Tanım eksik." };
}

export async function addPanelType(input: unknown): Promise<DefinitionResult> {
  const parsed = panelTypeInput.safeParse(input);
  if (!parsed.success) return firstIssue(parsed.error.issues);
  return attempt(async () => insertPanelType(await identity(), parsed.data));
}

export async function changePanelType(
  id: string,
  change: { name?: string; status?: "active" | "passive" },
): Promise<DefinitionResult> {
  return attempt(async () => updatePanelType(await identity(), id, change));
}

export async function addStripType(input: unknown): Promise<DefinitionResult> {
  const parsed = stripTypeInput.safeParse(input);
  if (!parsed.success) return firstIssue(parsed.error.issues);
  return attempt(async () => insertStripType(await identity(), parsed.data));
}

export async function changeStripType(
  id: string,
  change: { name?: string; standardLengthsM?: number[]; status?: "active" | "passive" },
): Promise<DefinitionResult> {
  return attempt(async () => updateStripType(await identity(), id, change));
}

export async function addRecipeLine(input: unknown): Promise<DefinitionResult> {
  const parsed = recipeLineInput.safeParse(input);
  if (!parsed.success) return firstIssue(parsed.error.issues);
  return attempt(async () => insertRecipeLine(await identity(), parsed.data));
}

/** A catalog item turns passive rather than disappearing: history still points at it. */
export async function changeCatalogItemStatus(
  itemId: string,
  status: "active" | "passive",
): Promise<DefinitionResult> {
  return attempt(async () => setCatalogItemStatus(await identity(), itemId, status));
}
