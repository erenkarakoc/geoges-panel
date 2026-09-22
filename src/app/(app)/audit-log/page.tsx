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
import { parseAuditLogFilters, readAuditLog } from "@/modules/aud";
import { AuditLogList } from "@/modules/aud/ui/audit-log-list";
import { AccessDeniedError, listPeople, todayRoute } from "@/modules/iam";
import { isModuleEnabled } from "@/platform/features/features";
import { FeatureOff } from "@/platform/ui/feature-off";

export const metadata: Metadata = { title: "Denetim Kayıtları" };

/** The page's data, or `null` when the person may not see the audit log. */
async function load(filters: ReturnType<typeof parseAuditLogFilters>) {
  try {
    const [data, people] = await Promise.all([readAuditLog(filters), listPeople()]);
    return { data, people };
  } catch (error) {
    if (error instanceof AccessDeniedError) return null;
    throw error;
  }
}

// SCR-193 (TASK-0103). Read on every request: the log grows while the owner looks at it.
export default async function AuditLogPage({ searchParams }: PageProps<"/audit-log">) {
  if (!isModuleEnabled("AUD")) return <FeatureOff />;

  const filters = parseAuditLogFilters(await searchParams);
  const loaded = await load(filters);

  if (loaded) {
    return <AuditLogList data={loaded.data} filters={filters} people={loaded.people} />;
  }

  // SCREEN_STATES: a screen reached by address without permission (D-221).
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <LockIcon />
        </EmptyMedia>
        <EmptyTitle>Bu ekranı görme yetkiniz yok</EmptyTitle>
        <EmptyDescription>Denetim kayıtlarını yalnız sahipler görür.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button render={<Link href={todayRoute} />} variant="outline">
          Bugün&apos;e dön
        </Button>
      </EmptyContent>
    </Empty>
  );
}
