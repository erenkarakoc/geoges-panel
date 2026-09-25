"use server";

import { revalidatePath } from "next/cache";

import { addRecipeLine, decimal, type OutputKind, type PerUnit } from "@/modules/adm";

/** "Her tip" on the form; a line for every type of its kind has no type at all. */
const EVERY = "__every__";

/** A new recipe line (SCR-190, TASK-0121); the type goes to the column its kind of output uses. */
export async function addRecipeLineAction(input: {
  outputKind: OutputKind;
  typeId: string;
  perUnit: PerUnit;
  materialItemId: string;
  qtyPerUnit: string;
  validFrom: string;
  reason: string;
}) {
  const typeId = input.typeId === EVERY ? null : input.typeId;
  const said = await addRecipeLine({
    materialItemId: input.materialItemId,
    outputKind: input.outputKind,
    panelTypeId: input.outputKind === "strip_installation" ? null : typeId,
    perUnit: input.perUnit,
    qtyPerUnit: decimal(input.qtyPerUnit),
    reason: input.reason,
    stripTypeId: input.outputKind === "strip_installation" ? typeId : null,
    validFrom: input.validFrom,
  });
  if (!said.error) revalidatePath("/admin/master-data/recipes");
  return { error: said.error };
}
