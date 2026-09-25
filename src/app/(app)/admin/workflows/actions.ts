"use server";

import { revalidatePath } from "next/cache";

import { AccessDeniedError, signInIdentity } from "@/modules/iam";
import { startFlow } from "@/modules/wfl";

/**
 * Starting a flow (SCR-195, TASK-0119). The name is the only question: the address comes from it
 * and the flow begins as a start and an end, so the designer opens on a whole definition.
 */

export type NewFlowResult = { error: string | null; key: string | null };

export async function createFlowAction(name: string): Promise<NewFlowResult> {
  const signedIn = await signInIdentity();
  if (!signedIn) return { error: "Oturum kapalı.", key: null };
  if (name.trim().length < 3) return { error: "Akışın adı en az üç harf olmalı.", key: null };

  try {
    const key = await startFlow(signedIn.identity, name);
    revalidatePath("/admin/workflows");
    return { error: null, key };
  } catch (error) {
    if (error instanceof AccessDeniedError) return { error: error.message, key: null };
    if ((error as { hint?: string }).hint === "wfl.design_permission") {
      return { error: "Akış tasarlama yetkiniz yok.", key: null };
    }
    throw error;
  }
}
