import { LockIcon, WorkflowIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import {
  closeFlowAction,
  copyFlowAction,
  publishFlowAction,
  readDryRunAction,
  readPublishSummaryAction,
  readVersionsAction,
  runDryRunAction,
  saveFlowDraftAction,
} from "@/app/(app)/admin/workflows/[flowKey]/actions";
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
  AccessDeniedError,
  listPeople,
  listPermissions,
  listRoles,
  signInIdentity,
  todayRoute,
} from "@/modules/iam";
import { listFlows, openFlow } from "@/modules/wfl";
import { FlowDesigner } from "@/modules/wfl/ui/flow-designer";
import type { DesignerVocabulary } from "@/modules/wfl/ui/step-questions";
import { moduleCapabilities } from "@/records/capabilities";
import { isModuleEnabled } from "@/platform/features/features";
import { FeatureOff } from "@/platform/ui/feature-off";

export const metadata: Metadata = { title: "Akış tasarımcısı" };

/** The flow, `null` when this person may not design flows, `undefined` when there is no such flow. */
/** Who is asking, in the words of the module that will be asked — routes hold no database type. */
type Asking = Parameters<typeof listFlows>[0];

async function load(identity: Asking, flowKey: string) {
  try {
    return (await openFlow(identity, flowKey)) ?? undefined;
  } catch (error) {
    if (error instanceof AccessDeniedError) return null;
    throw error;
  }
}

/**
 * What the designer offers to choose from (REQ-WFL-003, D-280). The events, the fields a condition
 * may read and the owner relations come from the modules' own catalogs — the designer holds no list
 * of its own, so an ability nobody declared simply is not on the screen. The roles, the people and
 * the other flows come from the modules that own them, joined here because a route is where modules
 * are joined (ADR-001).
 */
async function vocabularyFor(identity: Asking): Promise<DesignerVocabulary> {
  const [roles, people, permissions, flows] = await Promise.all([
    listRoles(),
    listPeople(),
    listPermissions(),
    listFlows(identity),
  ]);
  const active = <T extends { status?: string }>(items: readonly T[]) =>
    items.filter((item) => item.status !== "deprecated");

  return {
    events: moduleCapabilities.flatMap((catalog) =>
      active(catalog.events).map((event) => ({ code: event.code, name: event.name })),
    ),
    fields: moduleCapabilities.flatMap((catalog) =>
      active(catalog.conditions).map((field) => ({ code: field.code, name: field.name })),
    ),
    flows: flows.map((flow) => ({ key: flow.key, name: flow.name })),
    people: people.map((person) => ({ id: person.id, name: person.displayName })),
    permissions: permissions.map((one) => ({ code: one.code, name: one.name })),
    relations: moduleCapabilities.flatMap((catalog) =>
      active(catalog.relations).map((relation) => ({ code: relation.code, name: relation.name })),
    ),
    roles: roles.map((role) => ({ code: role.code, name: role.name })),
  };
}

/** SCR-196, the designer (TASK-0119, D-283). */
export default async function FlowDesignerPage({
  params,
}: PageProps<"/admin/workflows/[flowKey]">) {
  if (!isModuleEnabled("WFL")) return <FeatureOff />;

  const { flowKey } = await params;
  const signedIn = await signInIdentity();
  const flow = signedIn ? await load(signedIn.identity, flowKey) : null;

  if (flow === null) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <LockIcon />
          </EmptyMedia>
          <EmptyTitle>Bu ekranı görme yetkiniz yok</EmptyTitle>
          <EmptyDescription>
            Akış tasarımcısını yalnız akış tasarlama yetkisi olan roller açar.
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

  if (!signedIn || !flow || !flow.versionId) {
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
      actions={{
        publish: publishFlowAction,
        publishSummary: readPublishSummaryAction,
        readDryRun: readDryRunAction,
        runDryRun: runDryRunAction,
      }}
      dryRun={await readDryRunAction(flow.versionId)}
      flow={{
        key: flow.key,
        name: flow.name,
        version: flow.version ?? 1,
        status: flow.status ?? "draft",
        definition: flow.definition,
        versionId: flow.versionId,
      }}
      menu={{
        close: closeFlowAction,
        copy: copyFlowAction,
        versions: readVersionsAction,
      }}
      save={saveFlowDraftAction}
      vocabulary={await vocabularyFor(signedIn.identity)}
    />
  );
}
