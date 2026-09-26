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
import { readRunCounts, readRuns, stepTypeLabel } from "@/modules/wfl";
import { RunLog, type RunCard } from "@/modules/wfl/ui/run-log";
import { addDays, formatDayShort, todayIn } from "@/platform/date/day";
import { isModuleEnabled } from "@/platform/features/features";
import type { Column } from "@/platform/ui/chart/chart";
import { FeatureOff } from "@/platform/ui/feature-off";
import { ScreenTabs, WORKFLOW_TABS } from "@/platform/ui/nav/screen-tabs";

export const metadata: Metadata = { title: "Çalışma günlüğü" };

// The last fourteen days, by how their runs stand (D-297).
const DAYS = 14;
const OUTCOMES = [
  { label: "Bitti", statuses: ["done"] },
  { label: "Sürüyor", statuses: ["running"] },
  { label: "Hata ya da durduruldu", statuses: ["failed", "stopped"] },
];

function perDay(rows: readonly { day: string; status: string; n: number }[]): Column[] {
  const today = todayIn();
  return Array.from({ length: DAYS }, (_, index) => {
    const day = addDays(today, index - DAYS + 1);
    return {
      key: day,
      label: formatDayShort(day),
      values: OUTCOMES.map((outcome) =>
        rows
          .filter((row) => row.day === day && outcome.statuses.includes(row.status))
          .reduce((sum, row) => sum + row.n, 0),
      ),
    };
  });
}

/** The runs, or `null` when this person may not see them (D-223). */
async function load(): Promise<{ runs: RunCard[]; days: Column[] } | null> {
  const signedIn = await signInIdentity();
  if (!signedIn) return null;
  try {
    const [runs, people, counts] = await Promise.all([
      readRuns(signedIn.identity, {}),
      listPeople(),
      readRunCounts(signedIn.identity, DAYS),
    ]);
    const named = new Map(people.map((person) => [person.id, person.displayName]));
    const cards = runs.map((run) => ({
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
    return { days: perDay(counts), runs: cards };
  } catch (error) {
    if (error instanceof AccessDeniedError) return null;
    throw error;
  }
}

/** SCR-197 — the working log (TASK-0120). */
export default async function WorkflowRunsPage() {
  if (!isModuleEnabled("WFL")) return <FeatureOff />;

  const loaded = await load();

  if (!loaded) {
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
      <RunLog days={loaded.days} outcomes={OUTCOMES.map((o) => o.label)} runs={loaded.runs} />
    </div>
  );
}
