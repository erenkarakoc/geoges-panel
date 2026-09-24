"use server";

import { revalidatePath } from "next/cache";

import { decideRevisionSchema, RevisionError } from "@/modules/aud";
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
  // The decision's own schema, which existed and was tested but had never been applied to the
  // path a browser uses: the id went straight into the query as a string.
  const input = decideRevisionSchema.safeParse({
    id: formData.get("id"),
    approve: formData.get("approve") === "1",
    reason: String(formData.get("reason") ?? "").trim() || undefined,
  });
  if (!input.success) {
    return { error: "Talep bulunamadı; sayfayı yenileyip deneyin.", done: null };
  }
  const { id, approve } = input.data;
  const reason = input.data.reason ?? null;

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
