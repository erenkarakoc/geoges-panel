import type { Metadata } from "next";
import { cookies } from "next/headers";

import { signInIdentity } from "@/modules/iam";
import { TodayOverview } from "@/modules/rpt/ui/today-overview";
import { appState } from "@/modules/tsk";
import { readMyApprovalCount } from "@/modules/wfl";
import { InstallPrompt } from "@/modules/tsk/ui/install-prompt";
import {
  createPreviewRolePolicy,
  PREVIEW_ROLE_COOKIE,
  resolvePreviewRole,
} from "@/platform/access/preview-roles";
import { isModuleEnabled } from "@/platform/features/features";

export const metadata: Metadata = { title: "Bugün" };

// Entry screen of every role (D-056). The seat comes from the development role switcher
// (D-061); everywhere else it is the owner seat, which sees everything. The panel asks to be put
// on the Home Screen here, because this is the screen everybody opens (TASK-0113, D-264).
const roleSwitchingAllowed = process.env.NODE_ENV === "development";

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

  return (
    <>
      {signedIn && isModuleEnabled("TSK") ? <InstallPrompt state={await appState()} /> : null}
      <TodayOverview
        access={createPreviewRolePolicy(role)}
        seat={role}
        waitingApprovals={waiting}
      />
    </>
  );
}
