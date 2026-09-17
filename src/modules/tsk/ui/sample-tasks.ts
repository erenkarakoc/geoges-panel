/**
 * SAMPLE DATA for "Görevler" (§25). Tasks are either assigned by a person or raised by the
 * system (§25.2); both kinds are here so the screen shows what the engine will feel like. The
 * list is as long as the rail badge says (`sampleWorkCounts.tasks`), which a test keeps true.
 */

export type TaskDue = "overdue" | "today" | "later";

export type SampleTask = {
  id: string;
  title: string;
  note: string;
  /** Where it came from: a person, or the rule that raised it (§25.2). */
  source: string;
  due: TaskDue;
  dueLabel: string;
  /** Where the task is done. */
  href: `/${string}`;
};

export const sampleTasks: readonly SampleTask[] = [
  {
    id: "missing-waste-photo",
    title: "Eksik zayi fotoğrafını tamamla",
    note: "15 Eylül kaydındaki 2 panel zayi için fotoğraf yok; koordinatör düzeltme istedi.",
    source: "Düzeltme isteği · Koordinatör",
    due: "overdue",
    dueLabel: "2 gün gecikti",
    href: "/sites/kavakli",
  },
  {
    id: "mould-oil-request",
    title: "Kalıp yağı için satın alma talebi aç",
    note: "Kavaklı'da 2 günlük stok kaldı, talep açılmadı.",
    source: "Sistem · kritik stok",
    due: "today",
    dueLabel: "bugün",
    href: "/purchasing",
  },
  {
    id: "training-expiry",
    title: "İSG eğitimi yenilenecek personeli bildir",
    note: "3 kişinin eğitim süresi bu ay doluyor.",
    source: "Sistem · süresi yaklaşan belge",
    due: "later",
    dueLabel: "24 Eylül",
    href: "/quality-safety",
  },
];
