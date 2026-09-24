import { defineCapabilities } from "@/platform/capabilities/catalog";

/**
 * What ADM offers a flow (REQ-WFL-003, `docs/requirements/REQ-ADM.md` catalog). No action: a flow
 * does not change the company's configuration, it reads it. Unit prices and their events arrive
 * with the modules that own them.
 */
export const admCapabilities = defineCapabilities({
  module: "ADM",
  events: [
    {
      code: "catalog_item.merged",
      name: "Kalemler birleştirildi",
      when: "Yetkili benzer kalemleri birleştirdiğinde",
      carries: ["liste", "kalan kalem", "birleşenler"],
      dataClass: "internal",
    },
    {
      code: "exchange_rate.received",
      name: "Kur alındı",
      when: "Günlük kur bülteni okunduğunda",
      carries: ["para birimi", "tarih", "kur"],
      dataClass: "internal",
    },
    {
      code: "exchange_rate.missing",
      name: "Kur alınamadı",
      when: "Günlük kur alınamadığında",
      carries: ["para birimi", "tarih"],
      dataClass: "internal",
    },
  ],
  actions: [],
  conditions: [
    {
      code: "catalog_item.list",
      name: "Kalemin ait olduğu liste",
      type: "choice",
      dataClass: "internal",
    },
  ],
  relations: [],
});
