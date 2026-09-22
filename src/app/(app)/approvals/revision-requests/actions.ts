"use server";

import { revalidatePath } from "next/cache";

import { RevisionError } from "@/modules/aud";
import type { RevisionFormState } from "@/modules/aud/ui/revision-requests";
import { revisions } from "@/records";

/**
 * The decision of SCR-192. It lives here, not in AUD, because carrying an approval out needs the
 * appliers of the modules that own the records, and those are joined in the composition root.
 */
export async function decideRevisionAction(
  _previous: RevisionFormState,
  formData: FormData,
): Promise<RevisionFormState> {
  const id = String(formData.get("id") ?? "");
  const approve = formData.get("approve") === "1";
  const reason = String(formData.get("reason") ?? "").trim() || null;

  try {
    const answer = await revisions().decide(id, approve, reason);
    revalidatePath("/approvals/revision-requests");
    if (answer.status === "approved") {
      return { error: null, done: answer.note ?? "Talep onaylandı ve uygulandı." };
    }
    if (answer.status === "stale") {
      return {
        error: answer.note ?? "Kayıt bu arada değişti; talep yeniden açılmalı.",
        done: null,
      };
    }
    return { error: null, done: "Talep reddedildi." };
  } catch (error) {
    if (error instanceof RevisionError) return { error: error.message, done: null };
    throw error;
  }
}
