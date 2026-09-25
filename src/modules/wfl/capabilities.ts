import { defineCapabilities } from "@/platform/capabilities/catalog";

/**
 * What WFL itself offers a flow (REQ-WFL-003, `docs/requirements/REQ-WFL.md` catalog). Its
 * actions are the palette's own steps and are never catalog actions (REQ-WFL-005), so this is
 * what other flows may listen to.
 *
 * Only what the engine already does is here: publishing a version, and the three an instance
 * announces about its own life. The approval and lock events arrive with the steps that produce
 * them.
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
    {
      code: "workflow.template_reset",
      name: "Akış şablona sıfırlandı",
      when: "Bir kopya, geldiği şablonun bugünkü hâline döndürüldüğünde (yeni taslak olarak)",
      carries: ["akış", "şablon"],
      dataClass: "internal",
    },
    {
      code: "workflow_instance.started",
      name: "Akış başladı",
      when: "Bir akış örneği tetiklendiğinde",
      carries: ["akış", "sürüm", "tetikleyen olay/kayıt"],
      dataClass: "internal",
    },
    {
      code: "workflow_instance.completed",
      name: "Akış tamamlandı",
      when: "Bir örnek bitiş adımına ulaştığında",
      carries: ["akış", "sürüm", "sonuç"],
      dataClass: "internal",
    },
    {
      code: "workflow_instance.failed",
      name: "Akış hata ile durdu",
      when: "Bir adım hata verdiğinde veya koşul süre sınırını aştığında",
      carries: ["akış", "sürüm", "adım", "hata"],
      dataClass: "internal",
    },
    {
      code: "lock.overridden",
      name: "Kilit aşıldı",
      when: "Sahip veya GM bir kilidi aştığında",
      carries: ["kayıt", "kilit", "aşan", "gerekçe"],
      dataClass: "internal",
    },
    {
      code: "approval.decided",
      name: "Onay kararı verildi",
      when: "Onayla / reddet / düzeltmeye geri gönder seçildiğinde",
      carries: ["kayıt", "karar", "karar veren", "gerekçe"],
      dataClass: "record",
    },
  ],
  actions: [],
  conditions: [
    {
      code: "approval.decision",
      name: "Onay kararı",
      type: "choice",
      dataClass: "internal",
    },
    {
      code: "approval.waiting_hours",
      name: "Onayın beklediği süre",
      type: "number",
      dataClass: "internal",
    },
  ],
  relations: [],
});
