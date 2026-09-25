import type { Metadata } from "next";

import { addRecipeLineAction } from "@/app/(app)/admin/master-data/recipes/actions";
import {
  listCatalogItems,
  listPanelTypes,
  listRecipeLines,
  listStripTypes,
  mayManageDefinitions,
  mayViewDefinitions,
} from "@/modules/adm";
import { BackToDefinitions, DefinitionsDenied } from "@/modules/adm/ui/definitions-frame";
import { RecipeList } from "@/modules/adm/ui/recipe-list";
import { todayRoute } from "@/modules/iam";
import { todayIn } from "@/platform/date/day";
import { isModuleEnabled } from "@/platform/features/features";
import { FeatureOff } from "@/platform/ui/feature-off";

export const metadata: Metadata = { title: "Sarf reçeteleri" };

/** SCR-190 — consumption recipes (TASK-0121, REQ-ADM-004). */
export default async function RecipesPage() {
  if (!isModuleEnabled("ADM")) return <FeatureOff />;
  if (!(await mayViewDefinitions())) return <DefinitionsDenied backTo={todayRoute} />;

  const [lines, panels, strips, materials, canManage] = await Promise.all([
    listRecipeLines(),
    listPanelTypes(),
    listStripTypes(),
    listCatalogItems("consumable"),
    mayManageDefinitions(),
  ]);

  // Only what is in use can be chosen for a new line; history still names passive ones.
  const active = <T extends { status: string }>(items: readonly T[]) =>
    items.filter((item) => item.status === "active");

  return (
    <div className="flex flex-col gap-4">
      <BackToDefinitions />
      <RecipeList
        actions={{ add: addRecipeLineAction }}
        canManage={canManage}
        lines={lines}
        materials={active(materials).map((item) => ({ value: item.id, label: item.name }))}
        panelTypes={active(panels).map((panel) => ({
          value: panel.id,
          label: `${panel.code} · ${panel.name}`,
        }))}
        stripTypes={active(strips).map((strip) => ({
          value: strip.id,
          label: `${strip.code} · ${strip.name}`,
        }))}
        typeNames={[...panels, ...strips].map((type) => ({
          value: type.id,
          label: `${type.code} · ${type.name}${type.status === "passive" ? " (pasif)" : ""}`,
        }))}
        today={todayIn()}
      />
    </div>
  );
}
