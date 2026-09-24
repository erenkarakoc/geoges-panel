import { defineCapabilities } from "@/platform/capabilities/catalog";

/**
 * What WFL itself offers a flow (REQ-WFL-003, `docs/requirements/REQ-WFL.md` catalog). Its
 * actions are the palette's own steps and are never catalog actions (REQ-WFL-005), so this is
 * what other flows may listen to.
 *
 * Only what the engine already does is here: publishing a version. The instance and approval
 * events arrive with the execution step of TASK-0117.
 */
export const wflCapabilities = defineCapabilities({
  module: "WFL",
  events: [
    {
      code: "workflow.published",
      name: "Akış yayımlandı",
      when: "Bir akış sürümü canlıya alındığında",
      carries: ["akış", "sürüm", "yayımlayan"],
      dataClass: "internal",
    },
  ],
  actions: [],
  conditions: [],
  relations: [],
});
