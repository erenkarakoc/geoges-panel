import { defineCapabilities } from "@/platform/capabilities/catalog";

/**
 * What PRJ offers a flow (REQ-WFL-003, `docs/requirements/REQ-PRJ.md` catalog). The project card
 * arrives first (TASK-0123 step 1); revisions, walls and the technical office add theirs in the
 * following steps.
 */
export const prjCapabilities = defineCapabilities({
  module: "PRJ",
  events: [
    {
      code: "project.created",
      name: "Proje oluştu",
      when: "Proje kaydı açıldığında",
      carries: ["proje", "işveren", "koordinatör"],
      dataClass: "internal",
    },
    {
      code: "project.stage_changed",
      name: "Proje aşaması değişti",
      when: "Aşama geçişinde",
      carries: ["proje", "eski aşama", "yeni aşama"],
      dataClass: "internal",
    },
    {
      code: "project.changed",
      name: "Proje kartı değişti",
      when: "Kartın bilgisi değiştiğinde (aşama dışında)",
      carries: ["proje"],
      dataClass: "internal",
    },
  ],
  actions: [],
  conditions: [],
  relations: [],
});
