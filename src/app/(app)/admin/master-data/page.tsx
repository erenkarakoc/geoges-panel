import type { Metadata } from "next";

import { listCatalogs, mayViewDefinitions } from "@/modules/adm";
import { DefinitionGroups } from "@/modules/adm/ui/definition-groups";
import { DefinitionsDenied } from "@/modules/adm/ui/definitions-frame";
import { todayRoute } from "@/modules/iam";
import { isModuleEnabled } from "@/platform/features/features";
import { FeatureOff } from "@/platform/ui/feature-off";

export const metadata: Metadata = { title: "Tanımlar" };

/**
 * SCR-190 — Tanımlar (TASK-0121, REQ-ADM-001). One place for the definitions the panel is built
 * from. Calendar, rates and the other definition kinds of SCR-190 arrive with their own tasks.
 */
export default async function MasterDataPage() {
  if (!isModuleEnabled("ADM")) return <FeatureOff />;
  if (!(await mayViewDefinitions())) return <DefinitionsDenied backTo={todayRoute} />;

  const catalogs = await listCatalogs();

  return (
    <DefinitionGroups
      groups={[
        {
          description:
            "Günlük saha kaydının döküm, montaj, şerit ve tüketim satırları bunlardan kurulur.",
          links: [
            {
              href: "/admin/master-data/panel-types",
              note: "Kod, en, boy; m² kendiliğinden hesaplanır",
              title: "Panel tipleri",
            },
            {
              href: "/admin/master-data/strip-types",
              note: "Kesit, delik sayısı, standart boylar",
              title: "Çelik şerit tipleri",
            },
            {
              href: "/admin/master-data/recipes",
              note: "Bir birim üretimde hangi sarftan ne kadar",
              title: "Sarf reçeteleri",
            },
          ],
          title: "Üretim",
        },
        {
          description:
            "Kayıtlarda seçilen ortak listeler. Kullanılan kalem silinmez, pasifleşir; benzer adlar eklenmeden önce gösterilir.",
          links: catalogs.map((catalog) => ({
            href: `/admin/master-data/catalogs/${catalog.key}`,
            note: catalog.description ?? "",
            title: catalog.name,
          })),
          title: "Ortak listeler",
        },
      ]}
    />
  );
}
