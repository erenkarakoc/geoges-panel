import type { Metadata } from "next";

import {
  addPanelTypeAction,
  changePanelTypeAction,
} from "@/app/(app)/admin/master-data/panel-types/actions";
import { listPanelTypes, mayManageDefinitions, mayViewDefinitions } from "@/modules/adm";
import { todayRoute } from "@/modules/iam";
import { BackToDefinitions, DefinitionsDenied } from "@/modules/adm/ui/definitions-frame";
import { PanelTypeList } from "@/modules/adm/ui/panel-type-list";
import { isModuleEnabled } from "@/platform/features/features";
import { FeatureOff } from "@/platform/ui/feature-off";

export const metadata: Metadata = { title: "Panel tipleri" };

/** SCR-190 — panel types (TASK-0121, REQ-ADM-002). */
export default async function PanelTypesPage() {
  if (!isModuleEnabled("ADM")) return <FeatureOff />;
  if (!(await mayViewDefinitions())) return <DefinitionsDenied backTo={todayRoute} />;

  const [panels, canManage] = await Promise.all([listPanelTypes(), mayManageDefinitions()]);

  return (
    <div className="flex flex-col gap-4">
      <BackToDefinitions />
      <PanelTypeList
        actions={{ add: addPanelTypeAction, change: changePanelTypeAction }}
        canManage={canManage}
        panels={panels}
      />
    </div>
  );
}
