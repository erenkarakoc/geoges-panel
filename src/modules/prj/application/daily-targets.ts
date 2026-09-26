import "server-only";

import {
  AccessDeniedError,
  can,
  listPeople,
  readEffectivePermissions,
  signInIdentity,
} from "@/modules/iam";
import { targetChoices } from "@/modules/prj/application/revisions";
import { insertCorrection, readDailyTargets } from "@/modules/prj/data/daily-target-store";
import { correctionInput, dailyTargetMessage } from "@/modules/prj/domain/daily-target";
import { todayIn } from "@/platform/date/day";

/**
 * A site's daily targets (TASK-0123 step 3, REQ-PRJ-011, D-137, D-292 rule 4): what the database
 * works out for a day, the names its lines need, and the correction a site's manager may make.
 */

async function identity() {
  const signedIn = await signInIdentity();
  if (!signedIn) throw new AccessDeniedError("iam.session");
  return signedIn.identity;
}

/** Whoever manages the site — projects or sites, on its project or on the site itself. */
async function mayCorrect(projectId: string, siteId: string) {
  const snapshot = await readEffectivePermissions();
  if (!snapshot) return false;
  const places = [
    { id: projectId, type: "project" as const },
    { id: siteId, type: "site" as const },
  ];
  return places.some(
    (place) =>
      can(snapshot, "prj.module.manage", place) || can(snapshot, "sit.module.manage", place),
  );
}

/** The site's targets of a day; null when the person may not see the site. */
export async function siteDailyTargets(siteId: string, on: string) {
  const found = await readDailyTargets(await identity(), siteId, on);
  if (!found) return null;
  const [choices, people, correctable] = await Promise.all([
    targetChoices(found.frame.projectId),
    found.lines.some((line) => line.correctedByUserId) ? listPeople() : Promise.resolve([]),
    mayCorrect(found.frame.projectId, siteId),
  ]);
  const personName = Object.fromEntries(people.map((one) => [one.id, one.displayName]));
  return {
    ...found,
    lines: found.lines.map((line) => ({
      ...line,
      correctedBy: line.correctedByUserId ? (personName[line.correctedByUserId] ?? null) : null,
    })),
    names: choices.names,
    // A past day keeps the target it had; only today and later are corrected (migration 0068).
    mayCorrect: correctable && on >= todayIn(),
  };
}

export type DailyTargetResult = { error: string | null };

/** Corrects one line of a day, or returns it to its calculation when the value is empty. */
export async function correctDailyTarget(
  site: { siteId: string; projectId: string },
  on: string,
  input: unknown,
): Promise<DailyTargetResult> {
  const parsed = correctionInput.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Bilgiler eksik." };
  try {
    const id = await insertCorrection(await identity(), site, on, parsed.data);
    return id ? { error: null } : { error: "Bu şantiyenin hedeflerini düzeltme yetkiniz yok." };
  } catch (error) {
    if (error instanceof AccessDeniedError)
      return { error: "Bu şantiyenin hedeflerini düzeltme yetkiniz yok." };
    const said = dailyTargetMessage(error as { code?: string; hint?: string });
    if (said) return { error: said };
    throw error;
  }
}
