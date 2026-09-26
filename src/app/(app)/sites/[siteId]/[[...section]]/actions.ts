"use server";

import { revalidatePath } from "next/cache";

import { correctDailyTarget } from "@/modules/prj";
import type { CorrectionValue } from "@/modules/prj/ui/daily-targets";

/** Şantiye detayı (SCR-027): a daily target corrected by the site's manager (REQ-PRJ-011). */
export async function correctDailyTargetAction(
  site: { siteId: string; projectId: string },
  on: string,
  value: CorrectionValue,
) {
  const said = await correctDailyTarget(site, on, value);
  if (!said.error) revalidatePath(`/sites/${site.siteId}`);
  return said;
}
