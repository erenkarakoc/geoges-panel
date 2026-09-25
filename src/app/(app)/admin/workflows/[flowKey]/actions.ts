"use server";

import { revalidatePath } from "next/cache";

import { AccessDeniedError, signInIdentity } from "@/modules/iam";
import { parseDefinition, writeDraft } from "@/modules/wfl";

/**
 * Saving what the designer has on screen (TASK-0119, SCR-196).
 *
 * The definition is parsed with the engine's own schema before it is written, so the screen and
 * the engine can never disagree about what a valid flow is. A draft that does not parse is
 * refused with the schema's own words, which is what the designer shows next to the step.
 */

export type SaveResult = { error: string | null; savedAt: number | null };

export async function saveFlowDraftAction(input: {
  key: string;
  name: string;
  definition: unknown;
}): Promise<SaveResult> {
  const signedIn = await signInIdentity();
  if (!signedIn) return { error: "Oturum kapalı.", savedAt: null };

  const parsed = parseDefinition(input.definition);

  try {
    await writeDraft(signedIn.identity, { key: input.key, name: input.name, definition: parsed });
  } catch (error) {
    if (error instanceof AccessDeniedError) return { error: error.message, savedAt: null };
    const hint = (error as { hint?: string }).hint;
    if (hint === "wfl.design_permission") {
      return { error: "Akış tasarlama yetkiniz yok.", savedAt: null };
    }
    throw error;
  }

  revalidatePath(`/admin/workflows/${input.key}`);
  return { error: null, savedAt: Date.now() };
}
