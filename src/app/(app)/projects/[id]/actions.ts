"use server";

import { revalidatePath } from "next/cache";

import { changeContract, changeProject, money, moveProjectStage } from "@/modules/prj";
import type { ContractFormValue, ProjectFormValue } from "@/modules/prj/ui/project-form";
import { changeSite, changeSiteStatus, openSite } from "@/modules/sit";
import type { SiteFormValue } from "@/modules/sit/ui/project-sites";

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
