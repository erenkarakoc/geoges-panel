import {
  readAuthorityApprovalsAsSystem,
  readOfficeAssigneeAsSystem,
} from "@/modules/prj/data/technical-office-store";
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
    {
      code: "project_revision.submitted",
      name: "Proje revizyonu onaya gönderildi",
      when: "Teknik ofis taslak revizyonu onaya gönderdiğinde",
      carries: ["proje", "revizyon", "neden"],
      dataClass: "internal",
    },
    {
      code: "project_revision.approved",
      name: "Proje revizyonu onaylandı",
      when: "Yeni hedefler geçerli olduğunda",
      carries: ["proje", "revizyon", "fark"],
      dataClass: "internal",
    },
    {
      code: "wall.completed",
      name: "Duvar tamamlandı",
      when: 'Duvar durumu "tamamlandı" olduğunda',
      carries: ["proje", "duvar"],
      dataClass: "internal",
    },
    {
      code: "technical_office_item.overdue",
      name: "Teknik ofis işi gecikti",
      when: "Teslim tarihi geçtiğinde",
      carries: ["proje", "iş", "sorumlu"],
      dataClass: "internal",
    },
  ],
  actions: [],
  // The stage travels in the payload of `project.created` and `project.stage_changed`, which is
  // what a condition reads. Progress, days left and the contract value are not in any payload
  // yet, so they are declared when an event carries them.
  conditions: [
    { code: "project.stage", name: "Proje aşaması", type: "choice", dataClass: "internal" },
    {
      code: "technical_office_item.assignee_user_id",
      name: "Teknik ofis işinin sorumlusu",
      type: "person",
      dataClass: "internal",
    },
  ],
  relations: [
    {
      code: "technical_office_item.assignee",
      name: "Teknik ofis işinin sorumlusu",
      // The flow's record is the item itself (its overdue event names it).
      resolve: (caller, _argument, record) =>
        record && record.schema === "prj" && record.table === "technical_office_item"
          ? readOfficeAssigneeAsSystem(caller.db, record.id)
          : Promise.resolve(null),
    },
  ],
  lists: [
    {
      code: "prj.authority_approvals",
      name: "Projenin kurum onayı gereken teknik ofis işleri",
      read: (caller, record) =>
        record && record.schema === "prj" && record.table === "project"
          ? readAuthorityApprovalsAsSystem(caller.db, record.id)
          : Promise.resolve([]),
    },
  ],
});
