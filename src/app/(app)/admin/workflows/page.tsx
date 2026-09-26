import { LockIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { createFlowAction } from "@/app/(app)/admin/workflows/actions";
import { AccessDeniedError, signInIdentity, todayRoute } from "@/modules/iam";
import { listFlows, readCopiesBehindTemplate } from "@/modules/wfl";
import { FlowList } from "@/modules/wfl/ui/flow-list";
import { isModuleEnabled } from "@/platform/features/features";
import { FeatureOff } from "@/platform/ui/feature-off";
import { ScreenTabs, WORKFLOW_TABS } from "@/platform/ui/nav/screen-tabs";

export const metadata: Metadata = { title: "İş Akışları" };

/** The flows, or `null` when this person may not design them (REQ-WFL-019). */
async function load() {
  const signedIn = await signInIdentity();
  if (!signedIn) return null;
  try {
    const [flows, behind] = await Promise.all([
      listFlows(signedIn.identity),
      readCopiesBehindTemplate(signedIn.identity),
    ]);
    return { behind: behind.map((one) => one.flowKey), flows };
  } catch (error) {
    if (error instanceof AccessDeniedError) return null;
    throw error;
  }
}

/**
 * SCR-195, the minimal list (TASK-0119, D-283): the flows and the way into the designer.
 * Templates and the "new flows" tab arrive with TASK-0120.
 */
export default async function WorkflowsPage({ searchParams }: PageProps<"/admin/workflows">) {
  if (!isModuleEnabled("WFL")) return <FeatureOff />;

  // `?arsiv=1` shows the flows that were archived after they had run (D-293).
  const archive = (await searchParams).arsiv === "1";
  const loaded = await load();
  if (loaded) {
    const archived = loaded.flows.filter((flow) => flow.archivedAt);
    return (
      <div className="flex flex-col gap-4">
        <ScreenTabs current="/admin/workflows" label="İş akışları ekranı" tabs={WORKFLOW_TABS} />
        <FlowList
          archive={archive}
          archivedCount={archived.length}
          behind={loaded.behind}
          create={createFlowAction}
          flows={archive ? archived : loaded.flows.filter((flow) => !flow.archivedAt)}
        />
      </div>
    );
  }

  // SCREEN_STATES: a screen reached by address without permission (D-221).
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <LockIcon />
        </EmptyMedia>
        <EmptyTitle>Bu ekranı görme yetkiniz yok</EmptyTitle>
        <EmptyDescription>
          Akışları yalnız akış tasarlama yetkisi olan roller görür; bu yetki tam görünürlüklü
          rollere verilir.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button render={<Link href={todayRoute} />} variant="outline">
          Bugün&apos;e dön
        </Button>
      </EmptyContent>
    </Empty>
  );
}
