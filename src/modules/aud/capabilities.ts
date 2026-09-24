import { defineCapabilities } from "@/platform/capabilities/catalog";

/**
 * What AUD offers a flow (REQ-WFL-003, `docs/requirements/REQ-AUD.md` catalog). No action, and the
 * catalog says why: a revision request is opened by a person, never by a flow. A flow may wait for
 * one and read its state.
 *
 * `revision_request.approved` is not here yet: approval is carried out by the owning module's
 * applier, and no module owns a revisable record before the first slice.
 */
export const audCapabilities = defineCapabilities({
  module: "AUD",
  events: [
    {
      code: "revision_request.submitted",
      name: "Revizyon talep edildi",
      when: "Kilitli bir kayıtta değişiklik istendiğinde",
      carries: ["kayıt", "alanlar", "talep eden", "gerekçe"],
      dataClass: "record",
    },
    {
      code: "revision_request.rejected",
      name: "Revizyon reddedildi",
      when: "Talep gerekçesiyle reddedildiğinde",
      carries: ["kayıt", "reddeden", "gerekçe"],
      dataClass: "record",
    },
  ],
  actions: [],
  conditions: [
    {
      code: "revision_request.record_type",
      name: "Revizyonun kayıt türü",
      type: "choice",
      dataClass: "internal",
    },
    {
      code: "revision_request.waiting_days",
      name: "Bekleme günü",
      type: "number",
      dataClass: "internal",
    },
  ],
  relations: [],
});
