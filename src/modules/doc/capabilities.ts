import { defineCapabilities } from "@/platform/capabilities/catalog";

/**
 * What DOC offers a flow (REQ-WFL-003, `docs/requirements/REQ-DOC.md` catalog). No action: a flow
 * does not upload or archive a document, because both need a person's own permission over the
 * record the document hangs on. A flow waits for an upload and branches on the type.
 */
export const docCapabilities = defineCapabilities({
  module: "DOC",
  events: [
    {
      code: "document.uploaded",
      name: "Belge yüklendi",
      when: "Belge bir kayda eklendiğinde",
      carries: ["belge türü", "bağlı kayıt"],
      dataClass: "record",
    },
  ],
  actions: [],
  conditions: [
    { code: "document.type", name: "Belge türü", type: "choice", dataClass: "internal" },
  ],
  relations: [],
});
