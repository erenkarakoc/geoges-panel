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
import { AccessDeniedError, listPeople, signInIdentity, todayRoute } from "@/modules/iam";
import { readRuns, stepTypeLabel } from "@/modules/wfl";
import { RunLog, type RunCard } from "@/modules/wfl/ui/run-log";
import { isModuleEnabled } from "@/platform/features/features";
import { FeatureOff } from "@/platform/ui/feature-off";
import { ScreenTabs, WORKFLOW_TABS } from "@/platform/ui/nav/screen-tabs";

export const metadata: Metadata = { title: "Çalışma günlüğü" };

/** The runs, or `null` when this person may not see them (D-223). */
async function load(): Promise<RunCard[] | null> {
  const signedIn = await signInIdentity();
  if (!signedIn) return null;
  try {
    const [runs, people] = await Promise.all([readRuns(signedIn.identity, {}), listPeople()]);
    const named = new Map(people.map((person) => [person.id, person.displayName]));
    return runs.map((run) => ({
      endedAt: run.endedAt ? run.endedAt.getTime() : null,
      failure: run.failure,
      flowName: run.flowName ?? "Akış",
      id: run.id,
      startedAt: run.startedAt.getTime(),
      status: run.status,
      trigger: run.trigger,
      version: run.version,
      waitingOn: run.openStepType ? stepTypeLabel(run.openStepType) : null,
      waitingWho: run.openOwnerUserId ? (named.get(run.openOwnerUserId) ?? null) : null,
    }));
  } catch (error) {
    if (error instanceof AccessDeniedError) return null;
    throw error;
  }
}

/** SCR-197 — the working log (TASK-0120). */
export default async function WorkflowRunsPage() {
  if (!isModuleEnabled("WFL")) return <FeatureOff />;

  const runs = await load();

  if (!runs) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <LockIcon />
          </EmptyMedia>
          <EmptyTitle>Bu ekranı görme yetkiniz yok</EmptyTitle>
          <EmptyDescription>
            Çalışma günlüğünü yalnız akış tasarlama yetkisi olan roller görür. Bir görevin ya da
            bildirimin neden size geldiğini o görevin kendi üstünde yazar.
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

  return (
    <div className="flex flex-col gap-4">
      <ScreenTabs current="/admin/workflows/runs" label="İş akışları ekranı" tabs={WORKFLOW_TABS} />
      <RunLog runs={runs} />
    </div>
  );
}
