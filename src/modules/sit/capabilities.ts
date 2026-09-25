import { defineCapabilities } from "@/platform/capabilities/catalog";

/**
 * What SIT offers a flow (REQ-WFL-003, `docs/requirements/REQ-SIT.md` catalog). The site card
 * arrives first (TASK-0123 step 1); the daily site log adds its events with TASK-0127.
 */
export const sitCapabilities = defineCapabilities({
  module: "SIT",
  events: [
    {
      code: "site.created",
      name: "Şantiye açıldı",
      when: "Projede yeni şantiye açıldığında",
      carries: ["şantiye", "proje"],
      dataClass: "internal",
    },
    {
      code: "site.changed",
      name: "Şantiye kartı değişti",
      when: "Şantiyenin bilgisi ya da durumu değiştiğinde",
      carries: ["şantiye", "proje", "durum"],
      dataClass: "internal",
    },
  ],
  actions: [],
  conditions: [],
  relations: [],
});
