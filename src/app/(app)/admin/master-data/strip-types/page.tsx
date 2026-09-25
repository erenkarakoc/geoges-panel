import type { Metadata } from "next";

import {
  addStripTypeAction,
  changeStripTypeAction,
} from "@/app/(app)/admin/master-data/strip-types/actions";
import { listStripTypes, mayManageDefinitions, mayViewDefinitions } from "@/modules/adm";
import { BackToDefinitions, DefinitionsDenied } from "@/modules/adm/ui/definitions-frame";
import { StripTypeList } from "@/modules/adm/ui/strip-type-list";
import { todayRoute } from "@/modules/iam";
import { isModuleEnabled } from "@/platform/features/features";
import { FeatureOff } from "@/platform/ui/feature-off";

export const metadata: Metadata = { title: "Şerit tipleri" };

/** SCR-190 — steel strip types (TASK-0121, REQ-ADM-003). */
export default async function StripTypesPage() {
  if (!isModuleEnabled("ADM")) return <FeatureOff />;
  if (!(await mayViewDefinitions())) return <DefinitionsDenied backTo={todayRoute} />;

  const [strips, canManage] = await Promise.all([listStripTypes(), mayManageDefinitions()]);

  return (
    <div className="flex flex-col gap-4">
      <BackToDefinitions />
      <StripTypeList
        actions={{ add: addStripTypeAction, change: changeStripTypeAction }}
        canManage={canManage}
        strips={strips}
      />
    </div>
  );
}
