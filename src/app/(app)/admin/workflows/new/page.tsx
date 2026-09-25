import { LockIcon, SparklesIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/frame";
import { AccessDeniedError, signInIdentity, todayRoute } from "@/modules/iam";
import { readRecentlyPublished } from "@/modules/wfl";
import { isModuleEnabled } from "@/platform/features/features";
import { FeatureOff } from "@/platform/ui/feature-off";
import { ScreenTabs, WORKFLOW_TABS } from "@/platform/ui/nav/screen-tabs";

export const metadata: Metadata = { title: "Yeni akışlar" };

const day = new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short" });

/**
 * SCR-195's "Yeni akışlar" tab (REQ-WFL-023, TASK-0120).
 *
 * A flow published in the last week is watched, and watching means something concrete: how many runs
 * it started and how much work it actually put in front of people — counted from the steps that were
 * really taken, not from what the definition promises.
 */
async function load() {
  const signedIn = await signInIdentity();
  if (!signedIn) return null;
  try {
    return await readRecentlyPublished(signedIn.identity, 7);
  } catch (error) {
    if (error instanceof AccessDeniedError) return null;
    throw error;
  }
}

export default async function NewWorkflowsPage() {
  if (!isModuleEnabled("WFL")) return <FeatureOff />;

  const flows = await load();

  if (!flows) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <LockIcon />
          </EmptyMedia>
          <EmptyTitle>Bu ekranı görme yetkiniz yok</EmptyTitle>
          <EmptyDescription>
            Akışları yalnız akış tasarlama yetkisi olan roller görür.
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
      <ScreenTabs current="/admin/workflows/new" label="İş akışları ekranı" tabs={WORKFLOW_TABS} />

      {flows.length === 0 ? (
        <Empty className="flex-1">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SparklesIcon aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle aria-level={2} role="heading">
              Son bir haftada yayımlanan akış yok
            </EmptyTitle>
            <EmptyDescription>
              Yeni yayımlanan bir akış, ilk yedi gün boyunca burada ne yaptığıyla birlikte görünür.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {flows.map((flow) => (
            <li className="flex" key={`${flow.flowKey}-${flow.version}`}>
              <Frame className="flex-1">
                <FrameHeader>
                  <div className="flex flex-wrap items-center gap-2">
                    <FrameTitle>
                      <Link
                        className="underline-offset-4 hover:underline"
                        href={`/admin/workflows/${flow.flowKey}`}
                      >
                        {flow.flowName ?? flow.flowKey}
                      </Link>
                    </FrameTitle>
                    <Badge variant="info">yeni</Badge>
                  </div>
                  <FrameDescription>
                    {flow.version}. sürüm · {day.format(flow.publishedAt)} yayımlandı
                  </FrameDescription>
                </FrameHeader>
                <FramePanel>
                  <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
                    <Count label="çalışma" value={flow.runs} />
                    <Count label="onay" value={flow.approvals} />
                    <Count label="görev" value={flow.tasks} />
                    <Count label="bildirim" value={flow.notices} />
                  </dl>
                  {flow.runs === 0 ? (
                    <p className="pt-3 text-xs text-muted-foreground">
                      Henüz hiç çalışmadı: tetiği gelmemiş olabilir.
                    </p>
                  ) : null}
                </FramePanel>
              </Frame>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Count({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}
