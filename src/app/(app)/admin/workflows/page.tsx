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
import { AccessDeniedError, signInIdentity, todayRoute } from "@/modules/iam";
import { listFlows } from "@/modules/wfl";
import { FlowList } from "@/modules/wfl/ui/flow-list";
import { isModuleEnabled } from "@/platform/features/features";
import { FeatureOff } from "@/platform/ui/feature-off";

export const metadata: Metadata = { title: "İş Akışları" };

/** The flows, or `null` when this person may not design them (REQ-WFL-019). */
async function load() {
  const signedIn = await signInIdentity();
  if (!signedIn) return null;
  try {
    return await listFlows(signedIn.identity);
  } catch (error) {
    if (error instanceof AccessDeniedError) return null;
    throw error;
  }
}

/**
 * SCR-195, the minimal list (TASK-0119, D-283): the flows and the way into the designer.
 * Templates and the "new flows" tab arrive with TASK-0120.
 */
export default async function WorkflowsPage() {
  if (!isModuleEnabled("WFL")) return <FeatureOff />;

  const flows = await load();
  if (flows) return <FlowList flows={flows} />;

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
