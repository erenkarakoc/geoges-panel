import type { Metadata } from "next";
import { cookies } from "next/headers";

import { signInIdentity } from "@/modules/iam";
import { lateOfficeItems } from "@/modules/prj";
import type { TodayWorkRow } from "@/modules/rpt/ui/today-work";
import { TodayOverview } from "@/modules/rpt/ui/today-overview";
import { appState } from "@/modules/tsk";
import { readMyApprovalCount } from "@/modules/wfl";
import { InstallPrompt } from "@/modules/tsk/ui/install-prompt";
import {
  createPreviewRolePolicy,
  PREVIEW_ROLE_COOKIE,
  resolvePreviewRole,
} from "@/platform/access/preview-roles";
import { todayIn } from "@/platform/date/day";
import { isModuleEnabled } from "@/platform/features/features";

export const metadata: Metadata = { title: "Bugün" };

// Entry screen of every role (D-056). The seat comes from the development role switcher
// (D-061); everywhere else it is the owner seat, which sees everything. The panel asks to be put
// on the Home Screen here, because this is the screen everybody opens (TASK-0113, D-264).
const roleSwitchingAllowed = process.env.NODE_ENV === "development";

const daysBetween = (from: string, to: string) =>
  Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);

/**
 * Late technical office items as rows of "Dikkat" (REQ-PRJ-005): one row naming the item when there
 * is one, one row with the count when there are more; each reaches the project it belongs to.
 */
async function lateOfficeRows(): Promise<TodayWorkRow[]> {
  const late = await lateOfficeItems();
  if (late.total === 0) return [];
  const first = late.items[0];
  const days = daysBetween(first.dueOn, todayIn());
  return [
    {
      href: `/projects/${first.projectId}`,
      id: "late-technical-office",
      note:
        late.total === 1
          ? `${first.projectCode ? `${first.projectCode} · ` : ""}${first.title} — ${days} gün gecikti`
          : `${late.total} iş teslim tarihini geçti; en eskisi ${first.title} (${days} gün)`,
      title: late.total === 1 ? "Geciken teknik ofis işi" : "Geciken teknik ofis işleri",
      tone: "danger",
    },
  ];
}

export default async function TodayPage() {
  const cookieStore = await cookies();
  const role = resolvePreviewRole(
    cookieStore.get(PREVIEW_ROLE_COOKIE)?.value,
    roleSwitchingAllowed,
  );
  const signedIn = await signInIdentity();
  // The same question the work layer's badge asks, so the two numbers cannot disagree.
  const waiting =
    signedIn && isModuleEnabled("WFL") ? await readMyApprovalCount(signedIn.identity) : 0;
  const attention = signedIn && isModuleEnabled("PRJ") ? await lateOfficeRows() : [];

  return (
    <>
      {signedIn && isModuleEnabled("TSK") ? <InstallPrompt state={await appState()} /> : null}
      <TodayOverview
        access={createPreviewRolePolicy(role)}
        attention={attention}
        seat={role}
        waitingApprovals={waiting}
      />
    </>
  );
}
