"use server";

import { revalidatePath } from "next/cache";

import { addPanelType, changePanelType, decimal } from "@/modules/adm";

/** Panel types (SCR-190, TASK-0121): the form's text becomes numbers here, the way it is typed. */
export async function addPanelTypeAction(input: {
  code: string;
  name: string;
  widthM: string;
  heightM: string;
  series: string;
  step: string;
}) {
  const said = await addPanelType({
    code: input.code,
    heightM: decimal(input.heightM),
    name: input.name,
    series: input.series.trim() || undefined,
    step: input.step.trim() ? decimal(input.step) : undefined,
    widthM: decimal(input.widthM),
  });
  if (!said.error) revalidatePath("/admin/master-data/panel-types");
  return { error: said.error };
}

export async function changePanelTypeAction(
  id: string,
  change: { name?: string; status?: "active" | "passive" },
) {
  const said = await changePanelType(id, change);
  if (!said.error) revalidatePath("/admin/master-data/panel-types");
  return { error: said.error };
}
