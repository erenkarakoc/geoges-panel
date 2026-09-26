"use server";

import { revalidatePath } from "next/cache";

import { AccessDeniedError, signInIdentity } from "@/modules/iam";
import {
  askDryRun,
  closeFlow,
  copyFlow,
  resetFlowToTemplate,
  flowVersions,
  lastDryRun,
  parseDefinition,
  publishFlow,
  publishSummary,
  removeFlow,
  reopenFlow,
  restoreFlow,
  writeDraft,
} from "@/modules/wfl";

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

/** What a refusal from the database means in Turkish; anything else is a fault, not an answer. */
function refusal(error: unknown): string | null {
  const hint = (error as { hint?: string }).hint;
  if (hint === "wfl.design_permission") return "Akış tasarlama yetkiniz yok.";
  if (hint === "wfl.dry_run_required") {
    return "Bu tanım deneme çalıştırmasından geçmedi; önce denemeyi çalıştırın.";
  }
  if (hint === "wfl.not_a_draft") return "Yayımlanmış bir sürüm yeniden yayımlanmaz.";
  if (hint === "wfl.no_version") return "Böyle bir akış sürümü yok.";
  if (hint === "wfl.reason") return "Sebep en az üç harf olmalı.";
  if (hint === "wfl.flow_in_use") {
    const user = (error as { detail?: string }).detail;
    return `Bu akış "${user ?? "başka bir akış"}" içinde alt akış olarak kullanılıyor; önce oradan çıkarın.`;
  }
  return null;
}

export type DryRunState = {
  error: string | null;
  /** Whether a run has been asked for and is not answered yet. */
  waiting: boolean;
  passed: boolean | null;
  /** Whether the answer is about the definition as it stands now. */
  current: boolean;
  steps: { stepId: string; type: string; outcome: string; owner?: string | null }[];
  ends: string | null;
  failure: string | null;
  at: number | null;
};

const NOTHING: DryRunState = {
  at: null,
  current: false,
  ends: null,
  error: null,
  failure: null,
  passed: null,
  steps: [],
  waiting: false,
};

type Summary = {
  steps?: { stepId: string; type: string; outcome: string; owner?: string | null }[];
  ends?: string;
  failure?: string | null;
};

function evidenceState(
  evidence: {
    passed: boolean;
    current: boolean;
    summary: unknown;
    createdAt: Date;
  } | null,
): DryRunState {
  if (!evidence) return { ...NOTHING, waiting: true };
  const summary = (evidence.summary ?? {}) as Summary;
  return {
    at: evidence.createdAt.getTime(),
    current: evidence.current,
    ends: summary.ends ?? null,
    error: null,
    failure: summary.failure ?? null,
    passed: evidence.passed,
    steps: summary.steps ?? [],
    waiting: !evidence.current,
  };
}

/**
 * Asks for a dry run (REQ-WFL-025). The worker runs the engine, so this returns what is known now
 * and the screen asks again in a moment — a dry run is the engine's own loop and the engine does
 * not run inside a request (D-284).
 */
export async function runDryRunAction(versionId: string): Promise<DryRunState> {
  const signedIn = await signInIdentity();
  if (!signedIn) return { ...NOTHING, error: "Oturum kapalı." };
  try {
    const asked = await askDryRun(signedIn.identity, versionId);
    if (!asked) return { ...NOTHING, error: "Akış tasarlama yetkiniz yok." };
    return evidenceState(asked.evidence);
  } catch (error) {
    if (error instanceof AccessDeniedError) return { ...NOTHING, error: error.message };
    const said = refusal(error);
    if (said) return { ...NOTHING, error: said };
    throw error;
  }
}

/** What the dry run found, for the screen that is waiting for the worker to answer. */
export async function readDryRunAction(versionId: string): Promise<DryRunState> {
  const signedIn = await signInIdentity();
  if (!signedIn) return { ...NOTHING, error: "Oturum kapalı." };
  return evidenceState(await lastDryRun(signedIn.identity, versionId));
}

export type PublishSummary = {
  error: string | null;
  version: number | null;
  liveVersion: number | null;
  runningOnLive: number;
};

/** What the confirmation window summarises before a publish (REQ-WFL-023, REQ-WFL-024). */
export async function readPublishSummaryAction(versionId: string): Promise<PublishSummary> {
  const signedIn = await signInIdentity();
  if (!signedIn) {
    return { error: "Oturum kapalı.", liveVersion: null, runningOnLive: 0, version: null };
  }
  const summary = await publishSummary(signedIn.identity, versionId);
  if (!summary) {
    return {
      error: "Böyle bir akış sürümü yok.",
      liveVersion: null,
      runningOnLive: 0,
      version: null,
    };
  }
  return { error: null, ...summary };
}

export type PublishResult = { error: string | null; published: boolean };

/** Publishes the draft; the database refuses it without a passed dry run of this definition. */
export async function publishFlowAction(input: {
  key: string;
  versionId: string;
}): Promise<PublishResult> {
  const signedIn = await signInIdentity();
  if (!signedIn) return { error: "Oturum kapalı.", published: false };
  try {
    const published = await publishFlow(signedIn.identity, input.versionId);
    revalidatePath(`/admin/workflows/${input.key}`);
    return { error: null, published };
  } catch (error) {
    if (error instanceof AccessDeniedError) return { error: error.message, published: false };
    const said = refusal(error);
    if (said) return { error: said, published: false };
    throw error;
  }
}

/** The same answer "Yeni akış" gives: the address of the flow to open, or what went wrong. */
type NewFlowResult = { error: string | null; key: string | null };

export type FlowVersionRow = {
  version: number;
  status: string;
  publishedAt: number | null;
};

/** Every version of this flow, for the designer's version history (ADMINISTRATION section 3). */
export async function readVersionsAction(flowKey: string): Promise<FlowVersionRow[]> {
  const signedIn = await signInIdentity();
  if (!signedIn) return [];
  const versions = await flowVersions(signedIn.identity, flowKey);
  return versions.map((version) => ({
    publishedAt: version.publishedAt ? version.publishedAt.getTime() : null,
    status: version.status,
    version: version.version,
  }));
}

/** A copy to work on; the copy is a draft of its own and the original is left alone. */
export async function copyFlowAction(flowKey: string): Promise<NewFlowResult> {
  const signedIn = await signInIdentity();
  if (!signedIn) return { error: "Oturum kapalı.", key: null };
  try {
    const key = await copyFlow(signedIn.identity, flowKey);
    if (!key) return { error: "Böyle bir akış yok.", key: null };
    revalidatePath("/admin/workflows");
    return { error: null, key };
  } catch (error) {
    if (error instanceof AccessDeniedError) return { error: error.message, key: null };
    const said = refusal(error);
    if (said) return { error: said, key: null };
    throw error;
  }
}

/** Closes the flow: nothing new starts, what is running finishes (REQ-WFL-024). */
export async function closeFlowAction(input: {
  key: string;
  reason: string;
}): Promise<{ error: string | null; closed: boolean }> {
  const signedIn = await signInIdentity();
  if (!signedIn) return { closed: false, error: "Oturum kapalı." };
  if (input.reason.trim().length < 3) {
    return { closed: false, error: "Kapatma sebebi en az üç harf olmalı." };
  }
  try {
    const closed = await closeFlow(signedIn.identity, input.key, input.reason.trim());
    revalidatePath(`/admin/workflows/${input.key}`);
    revalidatePath("/admin/workflows");
    return { closed, error: closed ? null : "Böyle bir akış yok." };
  } catch (error) {
    if (error instanceof AccessDeniedError) return { closed: false, error: error.message };
    const said = refusal(error);
    if (said) return { closed: false, error: said };
    throw error;
  }
}

/**
 * Removes the flow (D-293): a flow that never ran is deleted, one that ran is closed and archived
 * with its history. The answer says which, so the screen can say it back.
 */
export async function removeFlowAction(input: {
  key: string;
  reason: string;
}): Promise<{ error: string | null; said: "deleted" | "archived" | null }> {
  const signedIn = await signInIdentity();
  if (!signedIn) return { error: "Oturum kapalı.", said: null };
  if (input.reason.trim().length < 3) return { error: "Sebep en az üç harf olmalı.", said: null };
  try {
    const said = await removeFlow(signedIn.identity, input.key, input.reason.trim());
    revalidatePath("/admin/workflows");
    return { error: said ? null : "Böyle bir akış yok ya da zaten arşivde.", said };
  } catch (error) {
    if (error instanceof AccessDeniedError) return { error: error.message, said: null };
    const said = refusal(error);
    if (said) return { error: said, said: null };
    throw error;
  }
}

/** Brings an archived flow back to the list, still closed (D-293). */
export async function restoreFlowAction(flowKey: string): Promise<{ error: string | null }> {
  return flowSwitch(flowKey, restoreFlow, "Bu akış arşivde değil.");
}

/** Opens a closed flow again; it starts on its trigger from now on. */
export async function reopenFlowAction(flowKey: string): Promise<{ error: string | null }> {
  return flowSwitch(flowKey, reopenFlow, "Bu akış kapalı değil ya da arşivde.");
}

async function flowSwitch(
  flowKey: string,
  run: (identity: Parameters<typeof restoreFlow>[0], key: string) => Promise<boolean>,
  notDone: string,
): Promise<{ error: string | null }> {
  const signedIn = await signInIdentity();
  if (!signedIn) return { error: "Oturum kapalı." };
  try {
    const done = await run(signedIn.identity, flowKey);
    revalidatePath(`/admin/workflows/${flowKey}`);
    revalidatePath("/admin/workflows");
    return { error: done ? null : notDone };
  } catch (error) {
    if (error instanceof AccessDeniedError) return { error: error.message };
    const said = refusal(error);
    if (said) return { error: said };
    throw error;
  }
}

/** Puts a copy back to what its template says, as a new draft (REQ-WFL-027). */
export async function resetToTemplateAction(
  flowKey: string,
): Promise<{ error: string | null; reset: boolean }> {
  const signedIn = await signInIdentity();
  if (!signedIn) return { error: "Oturum kapalı.", reset: false };
  try {
    await resetFlowToTemplate(signedIn.identity, flowKey);
    revalidatePath(`/admin/workflows/${flowKey}`);
    return { error: null, reset: true };
  } catch (error) {
    if (error instanceof AccessDeniedError) return { error: error.message, reset: false };
    const hint = (error as { hint?: string }).hint;
    if (hint === "wfl.no_template_source") {
      return { error: "Bu akış bir şablonun kopyası değil.", reset: false };
    }
    if (hint === "wfl.no_template") return { error: "Şablon bulunamadı.", reset: false };
    const said = refusal(error);
    if (said) return { error: said, reset: false };
    throw error;
  }
}
