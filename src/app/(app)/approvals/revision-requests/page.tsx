import type { Metadata } from "next";

import { decideRevisionAction } from "@/app/(app)/approvals/revision-requests/actions";
import { RevisionRequests } from "@/modules/aud/ui/revision-requests";
import { isModuleEnabled } from "@/platform/features/features";
import { FeatureOff } from "@/platform/ui/feature-off";
import { APPROVAL_TABS, ScreenTabs } from "@/platform/ui/nav/screen-tabs";
import { revisions } from "@/records";

export const metadata: Metadata = { title: "Revizyon talepleri" };

/**
 * SCR-192, the approval screen's second tab (D-223): requests waiting for this person, and
 * their own. Everything is read with their own permission, so a request about a record they may
 * not see is not here at all.
 */
export default async function RevisionRequestsPage() {
  if (!isModuleEnabled("AUD")) return <FeatureOff />;

  const service = revisions();
  const [waiting, mine] = await Promise.all([service.list("pending"), service.list("mine")]);
  const requests = [...waiting, ...mine.filter((r) => !waiting.some((w) => w.id === r.id))];

  return (
    <div className="flex flex-col gap-4">
      <ScreenTabs current="/approvals/revision-requests" label="Onay ekranı" tabs={APPROVAL_TABS} />
      <RevisionRequests decide={decideRevisionAction} requests={requests} />
    </div>
  );
}
