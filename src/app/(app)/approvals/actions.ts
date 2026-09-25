"use server";

import { revalidatePath } from "next/cache";

import { AccessDeniedError, signInIdentity } from "@/modules/iam";
import { decideApproval } from "@/modules/wfl";

/**
 * The decision (SCR-012, REQ-WFL-014, REQ-WFL-015, TASK-0120).
 *
 * The database decides whether this approval is this person's and whether a reason is owed; this
 * turns its refusals into sentences and tells the screen what happened. What runs next is the
 * engine's business: deciding publishes an event and the engine takes the next step on its own.
 */

export type DecisionResult = { error: string | null; decided: boolean };

export async function decideApprovalAction(input: {
  approvalId: string;
  decision: "approve" | "reject" | "return";
  reason?: string;
}): Promise<DecisionResult> {
  const signedIn = await signInIdentity();
  if (!signedIn) return { decided: false, error: "Oturum kapalı." };

  try {
    const decided = await decideApproval(
      signedIn.identity,
      input.approvalId,
      input.decision,
      input.reason,
    );
    revalidatePath("/approvals");
    revalidatePath("/today");
    return {
      decided,
      error: decided ? null : "Bu kayıt başka biri tarafından karara bağlandı.",
    };
  } catch (error) {
    if (error instanceof AccessDeniedError) return { decided: false, error: error.message };
    const hint = (error as { hint?: string }).hint;
    if (hint === "wfl.not_your_approval") {
      return { decided: false, error: "Bu onay artık sizde değil." };
    }
    if (hint === "wfl.reason_required") {
      return { decided: false, error: "Ret ve düzeltme isteği gerekçe ister." };
    }
    if (hint === "wfl.no_approval") return { decided: false, error: "Bu onay bulunamadı." };
    throw error;
  }
}
