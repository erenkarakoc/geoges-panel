"use server";

import { revalidatePath } from "next/cache";

import { money, openProject } from "@/modules/prj";
import type { ContractFormValue, ProjectFormValue } from "@/modules/prj/ui/project-form";

/** Projeler (SCR-022, TASK-0123): the contract value is read here the way it is typed. */
export async function openProjectAction(
  project: ProjectFormValue,
  contract: ContractFormValue | null,
) {
  const said = await openProject(
    project,
    contract
      ? { contractValue: money(contract.contractValue), currency: contract.currency }
      : undefined,
  );
  if (!said.error) revalidatePath("/projects");
  return said;
}
