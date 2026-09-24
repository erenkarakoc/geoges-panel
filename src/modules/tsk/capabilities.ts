import { z } from "zod";

import { notifyPerson, openFlowTask } from "@/modules/tsk/data/tsk-store";
import { defineAction, defineCapabilities } from "@/platform/capabilities/catalog";

/**
 * What TSK offers a flow (REQ-WFL-003, `docs/requirements/REQ-TSK.md` catalog).
 *
 * Two actions, and both keep the promise they make. Sending a notification and opening a task both
 * run under the flow's own authority, through functions the worker alone may call (`tsk.notify`
 * and `tsk.open_flow_task`, migrations 0011 and 0049). `task.open` was deliberately absent until
 * the engine had a step to call it from; a declaration carries the function that runs it, so it
 * could not have been declared earlier without promising what the code could not do.
 */

const taskInput = z.object({
  /** The step visit the task belongs to; it is what makes the task the flow's (D-087). */
  stepRunId: z.uuid(),
  title: z.string().trim().min(1).max(200),
  assigneeUserId: z.uuid(),
  priority: z.enum(["low", "normal", "high", "critical"]).default("normal"),
  dueAt: z.coerce.date().nullish(),
  linkPath: z.string().startsWith("/").max(300).nullish(),
  record: z.object({ schema: z.string().min(2), table: z.string().min(2), id: z.uuid() }).nullish(),
  siteId: z.uuid().nullish(),
  projectId: z.uuid().nullish(),
});

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
      code: "task.open",
      name: "Görev aç",
      input: taskInput,
      permission: "system",
      onRepeat: "Aynı adım ziyareti için ikinci görev açılmaz; var olan görev döner.",
      onFailure: "Görev açılmamış sayılır; adım yeniden denenebilir.",
      run: (caller, input) => openFlowTask(caller.db, input),
    }),
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
