"use server";

import { revalidatePath } from "next/cache";

import {
  addOfficeItem,
  addSupplyRow,
  changeOfficeItem,
  countRevision,
  moveOfficeItem,
  type OfficeStatus,
  changeContract,
  changeProject,
  markWall,
  money,
  moveProjectStage,
  openRevision,
  type WallStatus,
} from "@/modules/prj";
import type { ContractFormValue, ProjectFormValue } from "@/modules/prj/ui/project-form";
import { changeSite, changeSiteStatus, openSite } from "@/modules/sit";
import type { SiteFormValue } from "@/modules/sit/ui/project-sites";
import type { OfficeFormValue } from "@/modules/prj/ui/technical-office";
import type { SupplyFormValue } from "@/modules/prj/ui/supply-matrix";

/** Proje detayı (SCR-023, TASK-0123 step 1). Every change refreshes the card and the lists. */
function refreshed<T extends { error: string | null }>(projectId: string, said: T): T {
  if (!said.error) {
    revalidatePath(`/projects/${projectId}`);
    revalidatePath("/projects");
    revalidatePath("/sites");
  }
  return said;
}

export async function changeProjectAction(projectId: string, value: ProjectFormValue) {
  return refreshed(projectId, await changeProject(projectId, value));
}

export async function changeContractAction(projectId: string, value: ContractFormValue) {
  return refreshed(
    projectId,
    await changeContract(projectId, {
      contractValue: money(value.contractValue),
      currency: value.currency,
    }),
  );
}

export async function moveStageAction(projectId: string, stage: string) {
  return refreshed(projectId, await moveProjectStage(projectId, stage));
}

export async function openSiteAction(projectId: string, value: SiteFormValue) {
  return refreshed(projectId, await openSite(projectId, value));
}

export async function changeSiteAction(projectId: string, siteId: string, value: SiteFormValue) {
  return refreshed(projectId, await changeSite(siteId, value));
}

export async function setSiteStatusAction(
  projectId: string,
  siteId: string,
  status: "active" | "passive",
) {
  return refreshed(projectId, await changeSiteStatus(siteId, status));
}

export async function openRevisionAction(projectId: string, reason: string) {
  return refreshed(projectId, await openRevision(projectId, reason));
}

export async function markWallAction(projectId: string, wallId: string, status: WallStatus) {
  return refreshed(projectId, await markWall(wallId, status));
}

// Teknik ofis and Tedarik matrisi (TASK-0123 step 4).
export async function addOfficeItemAction(projectId: string, value: OfficeFormValue) {
  return refreshed(projectId, await addOfficeItem(projectId, value));
}

export async function changeOfficeItemAction(
  projectId: string,
  itemId: string,
  value: OfficeFormValue,
) {
  return refreshed(projectId, await changeOfficeItem(itemId, value));
}

export async function moveOfficeItemAction(
  projectId: string,
  itemId: string,
  status: OfficeStatus,
) {
  return refreshed(projectId, await moveOfficeItem(itemId, status));
}

export async function countRevisionAction(projectId: string, itemId: string) {
  return refreshed(projectId, await countRevision(itemId));
}

export async function addSupplyRowAction(projectId: string, value: SupplyFormValue) {
  return refreshed(projectId, await addSupplyRow(projectId, value));
}
