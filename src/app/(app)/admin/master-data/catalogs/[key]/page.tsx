import type { Metadata } from "next";

import {
  addCatalogItemAction,
  setCatalogItemStatusAction,
  similarItemsAction,
} from "@/app/(app)/admin/master-data/catalogs/[key]/actions";
import {
  listCatalogItems,
  listCatalogs,
  mayManageDefinitions,
  mayViewDefinitions,
} from "@/modules/adm";
import { CatalogItemList } from "@/modules/adm/ui/catalog-item-list";
import { BackToDefinitions, DefinitionsDenied } from "@/modules/adm/ui/definitions-frame";
import { todayRoute } from "@/modules/iam";
import { isModuleEnabled } from "@/platform/features/features";
import { FeatureOff } from "@/platform/ui/feature-off";

export const metadata: Metadata = { title: "Tanım listesi" };

/** SCR-190 — one shared list (TASK-0121, REQ-ADM-001, REQ-ADM-006). */
export default async function CatalogPage({
  params,
}: PageProps<"/admin/master-data/catalogs/[key]">) {
  if (!isModuleEnabled("ADM")) return <FeatureOff />;
  if (!(await mayViewDefinitions())) return <DefinitionsDenied backTo={todayRoute} />;

  const { key } = await params;
  const [catalogs, items, canManage] = await Promise.all([
    listCatalogs(),
    listCatalogItems(key),
    mayManageDefinitions(),
  ]);
  const catalog = catalogs.find((one) => one.key === key);
  if (!catalog) return <DefinitionsDenied backTo="/admin/master-data" />;

  return (
    <div className="flex flex-col gap-4">
      <BackToDefinitions />
      <CatalogItemList
        actions={{
          add: addCatalogItemAction.bind(null, key),
          setStatus: setCatalogItemStatusAction.bind(null, key),
          similar: similarItemsAction.bind(null, key),
        }}
        canAdd={canManage || catalog.allowsUserAdditions}
        canManage={canManage}
        description={catalog.description}
        items={items}
        title={catalog.name}
      />
    </div>
  );
}
