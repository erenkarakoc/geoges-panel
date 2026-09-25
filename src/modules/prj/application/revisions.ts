import "server-only";

import { listCatalogItems, listPanelTypes, listStripTypes } from "@/modules/adm";
import { AccessDeniedError, can, readEffectivePermissions, signInIdentity } from "@/modules/iam";
import {
  addWall,
  changeWall,
  readRevision,
  readRevisionDiff,
  readRevisionOn,
  readRevisions,
  recallRevision,
  removeTarget,
  removeWall,
  setTarget,
  setWallStatus,
  startRevision,
  submitRevision,
  type TargetKind,
  type WallStatus,
} from "@/modules/prj/data/revision-store";
import { revisionMessage, targetInput, wallInput } from "@/modules/prj/domain/revision";
import { todayIn } from "@/platform/date/day";

/**
 * Revisions, walls and targets (TASK-0123 step 2, SCR-024, D-136, D-292). The technical office
 * edits a draft and sends it; the flow decides. Nothing here approves: that is the flow's record
 * step, through the composition root (REQ-WFL-010).
 */

async function identity() {
  const signedIn = await signInIdentity();
  if (!signedIn) throw new AccessDeniedError("iam.session");
  return signedIn.identity;
}

/** Whether the person may edit this project's revisions and walls. */
export async function mayEditRevisions(projectId: string): Promise<boolean> {
  const snapshot = await readEffectivePermissions();
  return Boolean(
    snapshot && can(snapshot, "prj.module.manage", { id: projectId, type: "project" }),
  );
}

/** Whether the person may mark how far a wall has got: projects or sites, in this project. */
export async function mayMarkWalls(projectId: string): Promise<boolean> {
  const snapshot = await readEffectivePermissions();
  const here = { id: projectId, type: "project" as const };
  return Boolean(
    snapshot &&
    (can(snapshot, "prj.module.manage", here) || can(snapshot, "sit.module.manage", here)),
  );
}

export async function projectRevisions(projectId: string) {
  return readRevisions(await identity(), projectId);
}

/** The revision valid today and what it says, or null when no revision is approved yet. */
export async function currentTargets(projectId: string) {
  const who = await identity();
  const current = await readRevisionOn(who, projectId, todayIn());
  return current ? readRevision(who, current) : null;
}

/** A revision with what it changes against the one it was based on. */
export async function revisionView(revisionId: string) {
  const who = await identity();
  const found = await readRevision(who, revisionId);
  if (!found) return null;
  const diff = await readRevisionDiff(who, found.revision.basedOnRevisionId, revisionId);
  return { ...found, diff };
}

/**
 * The types a target can name in this project: every active company-wide type and the project's
 * own (REQ-ADM-005), with the names of every type a line may already carry.
 */
export async function targetChoices(projectId: string) {
  const [panels, strips, workItems] = await Promise.all([
    listPanelTypes(),
    listStripTypes(),
    listCatalogItems("work_item"),
  ]);
  const usable = <T extends { projectId: string | null; status: string }>(one: T) =>
    one.status === "active" && (one.projectId === null || one.projectId === projectId);
  return {
    panels: panels
      .filter(usable)
      .map((p) => ({ areaM2: p.areaM2, id: p.id, name: `${p.code} · ${p.name}` })),
    strips: strips
      .filter(usable)
      .map((s) => ({ id: s.id, lengths: s.standardLengthsM, name: `${s.code} · ${s.name}` })),
    workItems: workItems
      .filter((item) => item.status === "active")
      .map((item) => ({ id: item.id, name: item.name })),
    names: {
      panel: Object.fromEntries(panels.map((p) => [p.id, `${p.code} · ${p.name}`])),
      panelArea: Object.fromEntries(panels.map((p) => [p.id, p.areaM2])),
      strip: Object.fromEntries(strips.map((s) => [s.id, `${s.code} · ${s.name}`])),
      workItem: Object.fromEntries(workItems.map((item) => [item.id, item.name])),
    },
  };
}

export type RevisionResult = { error: string | null; id?: string | null };

async function attempt(work: () => Promise<string | boolean | null>): Promise<RevisionResult> {
  try {
    const done = await work();
    if (done === false || done === null)
      return { error: "Kayıt bulunamadı ya da bu işlemi yapma yetkiniz yok." };
    return { error: null, id: typeof done === "string" ? done : null };
  } catch (error) {
    if (error instanceof AccessDeniedError) return { error: "Bu projede revizyon yetkiniz yok." };
    const said = revisionMessage(error as { code?: string; constraint?: string; hint?: string });
    if (said) return { error: said };
    throw error;
  }
}

function firstIssue(issues: readonly { message: string }[]): RevisionResult {
  return { error: issues[0]?.message ?? "Bilgiler eksik." };
}

export async function openRevision(projectId: string, reason: string): Promise<RevisionResult> {
  if (reason.trim().length < 3) return { error: "Revizyonun nedenini yazın." };
  return attempt(async () => startRevision(await identity(), projectId, reason.trim()));
}

export async function sendRevision(revisionId: string): Promise<RevisionResult> {
  return attempt(async () => submitRevision(await identity(), revisionId));
}

export async function takeBackRevision(revisionId: string): Promise<RevisionResult> {
  return attempt(async () => recallRevision(await identity(), revisionId));
}

export async function putWall(revisionId: string, input: unknown): Promise<RevisionResult> {
  const parsed = wallInput.safeParse(input);
  if (!parsed.success) return firstIssue(parsed.error.issues);
  return attempt(async () => addWall(await identity(), revisionId, parsed.data));
}

export async function reviseWall(
  revisionId: string,
  wallId: string,
  input: unknown,
): Promise<RevisionResult> {
  const parsed = wallInput.safeParse(input);
  if (!parsed.success) return firstIssue(parsed.error.issues);
  return attempt(async () => changeWall(await identity(), revisionId, wallId, parsed.data));
}

export async function dropWall(revisionId: string, wallId: string): Promise<RevisionResult> {
  return attempt(async () => removeWall(await identity(), revisionId, wallId));
}

export async function putTarget(revisionId: string, input: unknown): Promise<RevisionResult> {
  const parsed = targetInput.safeParse(input);
  if (!parsed.success) return firstIssue(parsed.error.issues);
  return attempt(async () => setTarget(await identity(), revisionId, parsed.data));
}

export async function dropTarget(targetId: string): Promise<RevisionResult> {
  return attempt(async () => removeTarget(await identity(), targetId));
}

export async function markWall(wallId: string, status: WallStatus): Promise<RevisionResult> {
  return attempt(async () => setWallStatus(await identity(), wallId, status));
}

export type { TargetKind, WallStatus };
