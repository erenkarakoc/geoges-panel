import { LockIcon, WorkflowIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { saveFlowDraftAction } from "@/app/(app)/admin/workflows/[flowKey]/actions";
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
import { openFlow } from "@/modules/wfl";
import { FlowDesigner } from "@/modules/wfl/ui/flow-designer";
import { isModuleEnabled } from "@/platform/features/features";
import { FeatureOff } from "@/platform/ui/feature-off";

export const metadata: Metadata = { title: "Akış tasarımcısı" };

/** The flow, `null` when this person may not design flows, `undefined` when there is no such flow. */
async function load(flowKey: string) {
  const signedIn = await signInIdentity();
  if (!signedIn) return null;
  try {
    return (await openFlow(signedIn.identity, flowKey)) ?? undefined;
  } catch (error) {
    if (error instanceof AccessDeniedError) return null;
    throw error;
  }
}

/** SCR-196, the designer (TASK-0119, D-283). */
export default async function FlowDesignerPage({
  params,
}: PageProps<"/admin/workflows/[flowKey]">) {
  if (!isModuleEnabled("WFL")) return <FeatureOff />;

  const { flowKey } = await params;
  const flow = await load(flowKey);

  if (flow === null) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <LockIcon />
          </EmptyMedia>
          <EmptyTitle>Bu ekranı görme yetkiniz yok</EmptyTitle>
          <EmptyDescription>
            Akış tasarımcısını yalnız akış tasarlama yetkisi olan roller açar (REQ-WFL-019).
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

  if (!flow || !flow.versionId) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <WorkflowIcon />
          </EmptyMedia>
          <EmptyTitle>Böyle bir akış yok</EmptyTitle>
          <EmptyDescription>
            Aradığınız akış silinmiş ya da adresi değişmiş olabilir.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button render={<Link href="/admin/workflows" />} variant="outline">
            Akışlara dön
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <FlowDesigner
      flow={{
        key: flow.key,
        name: flow.name,
        version: flow.version ?? 1,
        status: flow.status ?? "draft",
        definition: flow.definition,
      }}
      save={saveFlowDraftAction}
    />
  );
}
