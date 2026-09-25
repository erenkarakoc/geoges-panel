import type { Metadata } from "next";

import { decideApprovalAction } from "@/app/(app)/approvals/actions";
import { listPeople, listPermissions, listRoles, signInIdentity } from "@/modules/iam";
import { readMyApprovals } from "@/modules/wfl";
import {
  ApprovalQueue,
  type QueueApproval,
  type QueueNames,
} from "@/modules/wfl/ui/approval-queue";
import { isModuleEnabled } from "@/platform/features/features";
import { FeatureOff } from "@/platform/ui/feature-off";
import { APPROVAL_TABS, ScreenTabs } from "@/platform/ui/nav/screen-tabs";
import { moduleCapabilities } from "@/records/capabilities";

export const metadata: Metadata = { title: "Onaylar" };

/**
 * The approval centre (SCR-012, REQ-WFL-012, TASK-0120).
 *
 * The queue is whatever the engine has put in front of this person — the database answers who that
 * is, from live assignments — and the names the screen needs to say *why* come from the modules that
 * own them, joined here because a route is where modules are joined (ADR-001).
 */
async function load(): Promise<{ approvals: QueueApproval[]; names: QueueNames } | null> {
  const signedIn = await signInIdentity();
  if (!signedIn) return null;

  const [waiting, roles, permissions, people] = await Promise.all([
    readMyApprovals(signedIn.identity),
    listRoles(),
    listPermissions(),
    listPeople(),
  ]);

  const names: QueueNames = {
    people: Object.fromEntries(people.map((person) => [person.id, person.displayName])),
    permissions: Object.fromEntries(permissions.map((one) => [one.code, one.name])),
    relations: Object.fromEntries(
      moduleCapabilities.flatMap((catalog) =>
        catalog.relations.map((relation) => [relation.code, relation.name] as const),
      ),
    ),
    roles: Object.fromEntries(roles.map((role) => [role.code, role.name])),
  };

  return {
    approvals: waiting.map((one) => ({
      createdAt: one.createdAt.getTime(),
      delegated: one.delegated,
      flowName: one.flowName,
      flowVersion: one.flowVersion,
      id: one.id,
      lastReturnReason: one.lastReturnReason,
      ownerRule: one.ownerRule,
      ownerUserId: one.ownerUserId,
      // A record's own screen arrives with the module that owns the record (Faz 09R); until then the
      // queue says so rather than offering a link that goes nowhere.
      recordLabel: one.record ? "Bu kaydın ekranı henüz yok" : null,
      recordPath: null,
      returnedBefore: one.returnedBefore,
      title: one.title,
    })),
    names,
  };
}

export default async function ApprovalsPage() {
  if (!isModuleEnabled("WFL")) return <FeatureOff />;

  const loaded = await load();

  return (
    <div className="flex flex-col gap-4">
      <ScreenTabs current="/approvals" label="Onay ekranı" tabs={APPROVAL_TABS} />
      <ApprovalQueue
        approvals={loaded?.approvals ?? []}
        decide={decideApprovalAction}
        names={loaded?.names ?? { people: {}, permissions: {}, relations: {}, roles: {} }}
      />
    </div>
  );
}
