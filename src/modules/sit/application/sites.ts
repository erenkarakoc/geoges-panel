import "server-only";

import { AccessDeniedError, can, readEffectivePermissions, signInIdentity } from "@/modules/iam";
import { projectNames } from "@/modules/prj";
import {
  insertSite,
  readSite,
  readSites,
  setSiteStatus,
  updateSite,
} from "@/modules/sit/data/site-store";
import { siteInput, siteMessage } from "@/modules/sit/domain/site";

/**
 * Sites (TASK-0123 step 1, REQ-SIT-001, D-138). A site is opened inside a project by whoever
 * manages projects or sites there, and it never moves to another project (D-292 rule 3). Who sees
 * which site follows the scope of the person's roles; the database decides (migration 0064).
 */

async function identity() {
  const signedIn = await signInIdentity();
  if (!signedIn) throw new AccessDeniedError("iam.session");
  return signedIn.identity;
}

/** Whether the person may open or change sites of a project. */
export async function mayManageSites(projectId: string): Promise<boolean> {
  const snapshot = await readEffectivePermissions();
  const here = { id: projectId, type: "project" as const };
  return Boolean(
    snapshot &&
    (can(snapshot, "prj.module.manage", here) || can(snapshot, "sit.module.manage", here)),
  );
}

/** Sites the person may see, each with its project's name; with `projectId`, that project's. */
export async function listSites(filter: { projectId?: string | null } = {}) {
  const sites = await readSites(await identity(), filter);
  const names = await projectNames([...new Set(sites.map((one) => one.projectId))]);
  return sites.map((one) => ({ ...one, projectName: names.get(one.projectId) ?? "" }));
}

export async function siteCard(id: string) {
  const found = await readSite(await identity(), id);
  if (!found) return null;
  const names = await projectNames([found.projectId]);
  return { ...found, projectName: names.get(found.projectId) ?? "" };
}

export type SiteResult = { error: string | null; id?: string | null };

async function attempt(work: () => Promise<string | boolean>): Promise<SiteResult> {
  try {
    const done = await work();
    if (done === false) return { error: "Şantiye bulunamadı ya da değiştirme yetkiniz yok." };
    return { error: null, id: typeof done === "string" ? done : null };
  } catch (error) {
    if (error instanceof AccessDeniedError)
      return { error: "Bu projede şantiye açma ya da değiştirme yetkiniz yok." };
    const said = siteMessage(error as { code?: string; constraint?: string; hint?: string });
    if (said) return { error: said };
    throw error;
  }
}

function firstIssue(issues: readonly { message: string }[]): SiteResult {
  return { error: issues[0]?.message ?? "Şantiye bilgileri eksik." };
}

export async function openSite(projectId: string, input: unknown): Promise<SiteResult> {
  const parsed = siteInput.safeParse(input);
  if (!parsed.success) return firstIssue(parsed.error.issues);
  if (!(await mayManageSites(projectId))) return { error: "Bu projede şantiye açma yetkiniz yok." };
  return attempt(async () => insertSite(await identity(), projectId, parsed.data));
}

export async function changeSite(id: string, input: unknown): Promise<SiteResult> {
  const parsed = siteInput.safeParse(input);
  if (!parsed.success) return firstIssue(parsed.error.issues);
  return attempt(async () => updateSite(await identity(), id, parsed.data));
}

/** A wrongly opened site turns passive; it never moves or disappears (D-292 rule 3). */
export async function changeSiteStatus(
  id: string,
  status: "active" | "passive",
): Promise<SiteResult> {
  return attempt(async () => setSiteStatus(await identity(), id, status));
}
