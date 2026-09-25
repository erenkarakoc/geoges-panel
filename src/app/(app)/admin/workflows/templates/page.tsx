import { LockIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { useTemplateAction } from "@/app/(app)/admin/workflows/templates/actions";
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
import { listTemplates } from "@/modules/wfl";
import { TemplateList, type TemplateCard } from "@/modules/wfl/ui/template-list";
import { isModuleEnabled } from "@/platform/features/features";
import { FeatureOff } from "@/platform/ui/feature-off";
import { ScreenTabs, WORKFLOW_TABS } from "@/platform/ui/nav/screen-tabs";

export const metadata: Metadata = { title: "Akış şablonları" };

/** The templates, or `null` when this person may not design flows (REQ-WFL-019). */
async function load(): Promise<TemplateCard[] | null> {
  const signedIn = await signInIdentity();
  if (!signedIn) return null;
  try {
    const templates = await listTemplates(signedIn.identity);
    if (templates.length === 0) return null;
    return templates.map((template) => ({
      key: template.key,
      name: template.name,
      summary: template.summary,
      version: template.version,
      steps: Array.isArray((template.definition as { steps?: unknown[] })?.steps)
        ? ((template.definition as { steps: unknown[] }).steps.length ?? 0)
        : 0,
    }));
  } catch (error) {
    if (error instanceof AccessDeniedError) return null;
    throw error;
  }
}

/** SCR-195's "Şablonlar" tab (TASK-0120, REQ-WFL-027, REQ-WFL-028). */
export default async function WorkflowTemplatesPage() {
  if (!isModuleEnabled("WFL")) return <FeatureOff />;

  const templates = await load();

  if (!templates) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <LockIcon />
          </EmptyMedia>
          <EmptyTitle>Bu ekranı görme yetkiniz yok</EmptyTitle>
          <EmptyDescription>
            Şablonları yalnız akış tasarlama yetkisi olan roller görür.
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
      <ScreenTabs
        current="/admin/workflows/templates"
        label="İş akışları ekranı"
        tabs={WORKFLOW_TABS}
      />
      <TemplateList templates={templates} use={useTemplateAction} />
    </div>
  );
}
