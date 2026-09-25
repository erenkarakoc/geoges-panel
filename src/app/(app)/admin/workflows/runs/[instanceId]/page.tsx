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
import {
  asDraft,
  readRuns,
  readStepVisits,
  readVersions,
  reportStepText,
  stepNames,
  stepTypeLabel,
} from "@/modules/wfl";
import { RunTimeline, type VisitCard } from "@/modules/wfl/ui/run-log";
import { isModuleEnabled } from "@/platform/features/features";
import { FeatureOff } from "@/platform/ui/feature-off";

export const metadata: Metadata = { title: "Çalışma ayrıntısı" };

/**
 * One run, step by step (SCR-197 detail). The step names come from the very version the run started
 * on — a later version may call the same step something else, and what this run saw is what this
 * screen shows.
 */
async function load(instanceId: string) {
  const signedIn = await signInIdentity();
  if (!signedIn) return null;
  try {
    const runs = await readRuns(signedIn.identity, { limit: 200 });
    const run = runs.find((one) => one.id === instanceId);
    if (!run) return undefined;

    const [visits, versions, people] = await Promise.all([
      readStepVisits(signedIn.identity, instanceId),
      readVersions(signedIn.identity, run.flowKey),
      listPeople(),
    ]);
    const named = new Map(people.map((person) => [person.id, person.displayName]));
    const definition = versions.find((one) => one.version === run.version)?.definition;
    const draft = asDraft(definition);
    const names = draft ? stepNames(draft.steps) : new Map<string, string>();

    return {
      run: {
        endedAt: run.endedAt ? run.endedAt.getTime() : null,
        failure: run.failure,
        flowName: run.flowName ?? "Akış",
        id: run.id,
        record: run.record ? "Bu çalışma bir kaydın üzerinde; kaydın ekranı henüz yok." : null,
        startedAt: run.startedAt.getTime(),
        status: run.status,
        trigger: run.trigger,
        version: run.version,
        waitingOn: run.openStepId
          ? (names.get(run.openStepId) ??
            (run.openStepType ? stepTypeLabel(run.openStepType) : null))
          : null,
        waitingWho: run.openOwnerUserId ? (named.get(run.openOwnerUserId) ?? null) : null,
      },
      visits: visits.map((visit): VisitCard => ({
        enteredAt: visit.enteredAt.getTime(),
        leftAt: visit.leftAt ? visit.leftAt.getTime() : null,
        said: reportStepText({
          outcome: visit.outcome ?? "",
          status:
            visit.status === "running" ? "waiting" : visit.status === "failed" ? "failed" : "done",
          stepId: visit.stepId,
          type: visit.stepType,
        }),
        status: visit.status,
        stepLabel: names.get(visit.stepId) ?? stepTypeLabel(visit.stepType),
        stepType: visit.stepType,
        who: visit.ownerUserId ? (named.get(visit.ownerUserId) ?? null) : null,
      })),
    };
  } catch (error) {
    if (error instanceof AccessDeniedError) return null;
    throw error;
  }
}

export default async function WorkflowRunPage({
  params,
}: PageProps<"/admin/workflows/runs/[instanceId]">) {
  if (!isModuleEnabled("WFL")) return <FeatureOff />;

  const { instanceId } = await params;
  const loaded = await load(instanceId);

  if (!loaded) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <LockIcon />
          </EmptyMedia>
          <EmptyTitle>
            {loaded === undefined ? "Böyle bir çalışma yok" : "Bu ekranı görme yetkiniz yok"}
          </EmptyTitle>
          <EmptyDescription>
            {loaded === undefined
              ? "Aradığınız çalışma silinmiş ya da adresi değişmiş olabilir."
              : "Çalışma günlüğünü yalnız akış tasarlama yetkisi olan roller görür."}
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button render={<Link href="/admin/workflows/runs" />} variant="outline">
            Günlüğe dön
          </Button>
          <Button render={<Link href={todayRoute} />} variant="ghost">
            Bugün&apos;e dön
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  return <RunTimeline run={loaded.run} visits={loaded.visits} />;
}
