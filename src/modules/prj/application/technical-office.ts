import "server-only";

import { listCatalogItems } from "@/modules/adm";
import { AccessDeniedError, signInIdentity } from "@/modules/iam";
import { mayEditRevisions } from "@/modules/prj/application/revisions";
import {
  countOfficeRevision,
  insertOfficeItem,
  insertSupplyRow,
  readOfficeItems,
  readSupplyRows,
  setOfficeItemStatus,
  updateOfficeItem,
} from "@/modules/prj/data/technical-office-store";
import {
  OFFICE_STATUSES,
  officeItemInput,
  officeMessage,
  supplyInput,
  type OfficeStatus,
} from "@/modules/prj/domain/technical-office";

/**
 * The technical office tab and the supply matrix tab of the project card (TASK-0123 step 4,
 * REQ-PRJ-004, REQ-PRJ-005, D-298). Whoever manages the project manages both; the person an item
 * falls to may move their own item on.
 */

async function identity() {
  const signedIn = await signInIdentity();
  if (!signedIn) throw new AccessDeniedError("iam.session");
  return signedIn.identity;
}

/** Everything the two tabs show: the items, the matrix rows, and the names of their kinds. */
export async function projectOffice(projectId: string) {
  const who = await identity();
  const [items, supply, types, supplyItems, canManage] = await Promise.all([
    readOfficeItems(who, projectId),
    readSupplyRows(who, projectId),
    listCatalogItems("technical_office_type"),
    listCatalogItems("supply_item"),
    mayEditRevisions(projectId),
  ]);
  return {
    canManage,
    items,
    me: who.userId,
    supply,
    supplyItems: supplyItems.map((one) => ({ id: one.id, name: one.name, status: one.status })),
    types: types.map((one) => ({ id: one.id, name: one.name, status: one.status })),
  };
}

export type OfficeResult = { error: string | null; id?: string | null };

async function attempt(work: () => Promise<string | boolean | null>): Promise<OfficeResult> {
  try {
    const done = await work();
    if (done === false || done === null)
      return { error: "Kayıt bulunamadı ya da bu işlemi yapma yetkiniz yok." };
    return { error: null, id: typeof done === "string" ? done : null };
  } catch (error) {
    if (error instanceof AccessDeniedError)
      return { error: "Bu projede bu işlemi yapma yetkiniz yok." };
    const said = officeMessage(error as { code?: string; constraint?: string; hint?: string });
    if (said) return { error: said };
    throw error;
  }
}

export async function addOfficeItem(projectId: string, input: unknown): Promise<OfficeResult> {
  const parsed = officeItemInput.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Bilgiler eksik." };
  return attempt(async () => insertOfficeItem(await identity(), projectId, parsed.data));
}

export async function changeOfficeItem(id: string, input: unknown): Promise<OfficeResult> {
  const parsed = officeItemInput.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Bilgiler eksik." };
  return attempt(async () => updateOfficeItem(await identity(), id, parsed.data));
}

export async function moveOfficeItem(id: string, status: OfficeStatus): Promise<OfficeResult> {
  if (!OFFICE_STATUSES.includes(status)) return { error: "Durum geçersiz." };
  return attempt(async () => setOfficeItemStatus(await identity(), id, status));
}

export async function countRevision(id: string): Promise<OfficeResult> {
  return attempt(async () => countOfficeRevision(await identity(), id));
}

export async function addSupplyRow(projectId: string, input: unknown): Promise<OfficeResult> {
  const parsed = supplyInput.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Bilgiler eksik." };
  return attempt(async () => insertSupplyRow(await identity(), projectId, parsed.data));
}
