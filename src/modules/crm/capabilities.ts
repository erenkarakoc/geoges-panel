import { defineCapabilities } from "@/platform/capabilities/catalog";

/**
 * What CRM offers a flow (REQ-WFL-003, `docs/requirements/REQ-CRM.md` catalog). The firm card
 * arrives first (TASK-0122); leads, tenders and the client scorecard add theirs in Phase 13.
 */
export const crmCapabilities = defineCapabilities({
  module: "CRM",
  events: [
    {
      code: "party.created",
      name: "Firma kaydedildi",
      when: "Yeni firma kartı açıldığında",
      carries: ["firma", "roller"],
      dataClass: "internal",
    },
    {
      code: "party.changed",
      name: "Firma kartı değişti",
      when: "Kartın bilgisi, rolleri ya da durumu değiştiğinde",
      carries: ["firma", "roller", "durum"],
      dataClass: "internal",
    },
  ],
  actions: [],
  conditions: [],
  relations: [],
});
