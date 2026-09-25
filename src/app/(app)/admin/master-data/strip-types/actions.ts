"use server";

import { revalidatePath } from "next/cache";

import { addStripType, changeStripType, decimal } from "@/modules/adm";

/**
 * Strip types (SCR-190, TASK-0121). Lengths are typed separated by semicolons, because a comma is
 * the decimal mark here: "2,5; 6; 12" is three lengths.
 */
function lengthsOf(text: string): number[] | null {
  const parts = text
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean);
  const numbers = parts.map(decimal);
  return numbers.some((value) => !(value > 0)) ? null : numbers;
}

export async function addStripTypeAction(input: {
  code: string;
  name: string;
  widthMm: string;
  thicknessMm: string;
  holeCount: string;
  lengths: string;
}) {
  const lengths = lengthsOf(input.lengths);
  if (!lengths) return { error: "Standart boylar sıfırdan büyük sayılar olmalı." };
  const said = await addStripType({
    code: input.code,
    holeCount: input.holeCount.trim() ? decimal(input.holeCount) : 0,
    name: input.name,
    standardLengthsM: lengths,
    thicknessMm: decimal(input.thicknessMm),
    widthMm: decimal(input.widthMm),
  });
  if (!said.error) revalidatePath("/admin/master-data/strip-types");
  return { error: said.error };
}

export async function changeStripTypeAction(
  id: string,
  change: { name?: string; lengths?: string; status?: "active" | "passive" },
) {
  const lengths = change.lengths === undefined ? undefined : lengthsOf(change.lengths);
  if (lengths === null) return { error: "Standart boylar sıfırdan büyük sayılar olmalı." };
  if (change.name !== undefined && !change.name.trim()) return { error: "Ad boş olamaz." };
  const said = await changeStripType(id, {
    name: change.name?.trim(),
    standardLengthsM: lengths,
    status: change.status,
  });
  if (!said.error) revalidatePath("/admin/master-data/strip-types");
  return { error: said.error };
}
