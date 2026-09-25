"use server";

import { revalidatePath } from "next/cache";

import {
  dropTarget,
  dropWall,
  putTarget,
  putWall,
  reviseWall,
  sendRevision,
  takeBackRevision,
} from "@/modules/prj";

/** SCR-024 — a revision's walls and targets (TASK-0123 step 2). Every change refreshes the card. */
function refreshed<T extends { error: string | null }>(
  projectId: string,
  revisionId: string,
  said: T,
): T {
  if (!said.error) {
    revalidatePath(`/projects/${projectId}/revisions/${revisionId}`);
    revalidatePath(`/projects/${projectId}`);
  }
  return said;
}

type WallForm = { code: string; name: string; siteId: string; lengthM: string; heightM: string };

export async function addWallAction(projectId: string, revisionId: string, value: WallForm) {
  return refreshed(projectId, revisionId, await putWall(revisionId, value));
}

export async function changeWallAction(
  projectId: string,
  revisionId: string,
  wallId: string,
  value: WallForm,
) {
  return refreshed(projectId, revisionId, await reviseWall(revisionId, wallId, value));
}

export async function removeWallAction(projectId: string, revisionId: string, wallId: string) {
  return refreshed(projectId, revisionId, await dropWall(revisionId, wallId));
}

export async function setTargetAction(
  projectId: string,
  revisionId: string,
  value: Record<string, unknown>,
) {
  return refreshed(projectId, revisionId, await putTarget(revisionId, value));
}

export async function removeTargetAction(projectId: string, revisionId: string, targetId: string) {
  return refreshed(projectId, revisionId, await dropTarget(targetId));
}

export async function submitRevisionAction(projectId: string, revisionId: string) {
  return refreshed(projectId, revisionId, await sendRevision(revisionId));
}

export async function recallRevisionAction(projectId: string, revisionId: string) {
  return refreshed(projectId, revisionId, await takeBackRevision(revisionId));
}
