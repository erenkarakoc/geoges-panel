"use server";

import { revalidatePath } from "next/cache";

import { AccessDeniedError, signInIdentity } from "@/modules/iam";
import { copyOfTemplate } from "@/modules/wfl";

/**
 * Using a template (SCR-195, REQ-WFL-027, TASK-0120). The copy is a flow of its own from the moment
 * it is made; the template it came from is remembered so a later template update can announce itself.
 */

export type NewFlowResult = { error: string | null; key: string | null };

export async function useTemplateAction(templateKey: string): Promise<NewFlowResult> {
  const signedIn = await signInIdentity();
  if (!signedIn) return { error: "Oturum kapalı.", key: null };

  try {
    const key = await copyOfTemplate(signedIn.identity, templateKey);
    if (!key) return { error: "Böyle bir şablon yok.", key: null };
    revalidatePath("/admin/workflows");
    return { error: null, key };
  } catch (error) {
    if (error instanceof AccessDeniedError) return { error: error.message, key: null };
    const hint = (error as { hint?: string }).hint;
    if (hint === "wfl.design_permission") {
      return { error: "Akış tasarlama yetkiniz yok.", key: null };
    }
    if (hint === "wfl.no_template") return { error: "Böyle bir şablon yok.", key: null };
    throw error;
  }
}
