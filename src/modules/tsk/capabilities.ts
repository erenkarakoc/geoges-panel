import { z } from "zod";

import { notifyPerson } from "@/modules/tsk/data/tsk-store";
import { defineAction, defineCapabilities } from "@/platform/capabilities/catalog";

/**
 * What TSK offers a flow (REQ-WFL-003, `docs/requirements/REQ-TSK.md` catalog).
 *
 * One action is declared, and only one, because a declaration carries the function that runs it:
 * sending a notification is something the panel can already do under the flow's own authority
 * (`tsk.notify`, granted to the worker alone). `task.open` is in the written catalog and is not
 * here yet — opening a task as the flow rather than as a person needs the system-authority path
 * that comes with the engine (TASK-0117). Declaring it before then would be a promise the code
 * cannot keep.
 */

const notificationInput = z.object({
  userId: z.uuid(),
  /** The notification kind, which decides the icon, the channel and the grouping. */
  type: z.string().min(3).max(60),
  subject: z.string().trim().min(1).max(200),
  linkPath: z.string().startsWith("/").max(300),
  /** What makes two notifications the same one; the database refuses a repeat within ten minutes. */
  sourceKey: z.string().min(1).max(200),
  isCritical: z.boolean().default(false),
});

export const tskCapabilities = defineCapabilities({
  module: "TSK",
  events: [
    {
      code: "task.created",
      name: "Görev oluştu",
      when: "Görev elle veya sistemce açıldığında",
      carries: ["görev", "sorumlu", "kaynak", "son tarih"],
      dataClass: "internal",
    },
    {
      code: "task.completed",
      name: "Görev tamamlandı",
      when: "Görev kapandığında",
      carries: ["görev", "kapatan", "nasıl kapandı"],
      dataClass: "internal",
    },
    {
      code: "task.overdue",
      name: "Görev gecikti",
      when: "Son tarih geçtiğinde",
      carries: ["görev", "sorumlu", "gecikme"],
      dataClass: "internal",
    },
    {
      code: "task.escalated",
      name: "Görev eskale oldu",
      when: "Görev üst seviyeye çıktığında",
      carries: ["görev", "kimden", "kime"],
      dataClass: "internal",
    },
    {
      code: "notification.created",
      name: "Bildirim oluştu",
      when: "Birine bildirim yazıldığında",
      carries: ["alıcı", "tür", "konu", "bağlantı"],
      dataClass: "internal",
    },
    {
      code: "notification.read",
      name: "Bildirim okundu",
      when: "Kişi bildirimini okuduğunda",
      carries: ["alıcı", "bildirim"],
      dataClass: "internal",
    },
  ],
  actions: [
    defineAction({
      code: "notification.send",
      name: "Bildirim gönder",
      input: notificationInput,
      permission: "system",
      onRepeat:
        "Aynı alıcı, tür ve kaynak için on dakika içinde ikinci bildirim yazılmaz; sonuç boş döner.",
      onFailure: "Bildirim yazılmamış sayılır; adım yeniden denenebilir.",
      run: (caller, input) => notifyPerson(caller.db, input),
    }),
  ],
  conditions: [
    { code: "task.status", name: "Görev durumu", type: "choice", dataClass: "internal" },
    { code: "task.priority", name: "Öncelik", type: "choice", dataClass: "internal" },
    { code: "task.overdue_days", name: "Gecikme günü", type: "number", dataClass: "internal" },
  ],
  relations: [],
});
