"use server";

import { revalidatePath } from "next/cache";

import { addCatalogItem, changeCatalogItemStatus, findSimilarCatalogItems } from "@/modules/adm";
import { AccessDeniedError } from "@/modules/iam";

/** One shared list (SCR-190, REQ-ADM-006, TASK-0121). */

export async function similarItemsAction(catalogKey: string, name: string) {
  const found = await findSimilarCatalogItems(catalogKey, name.trim());
  return found.map((item) => ({ name: item.name }));
}

export async function addCatalogItemAction(catalogKey: string, name: string) {
  if (name.trim().length < 2) return { error: "Ad en az iki harf olmalı." };
  try {
    await addCatalogItem({ catalogKey, name: name.trim() });
  } catch (error) {
    if (error instanceof AccessDeniedError) return { error: "Bu listeye ekleme yetkiniz yok." };
    const failure = error as { code?: string };
    if (failure.code === "23505") return { error: "Bu adla bir kalem zaten var." };
    if (failure.code === "42501") return { error: "Bu listeye ekleme yetkiniz yok." };
    throw error;
  }
  revalidatePath(`/admin/master-data/catalogs/${catalogKey}`);
  return { error: null };
}

export async function setCatalogItemStatusAction(
  catalogKey: string,
  itemId: string,
  status: "active" | "passive",
) {
  const said = await changeCatalogItemStatus(itemId, status);
  if (!said.error) revalidatePath(`/admin/master-data/catalogs/${catalogKey}`);
  return { error: said.error };
}
