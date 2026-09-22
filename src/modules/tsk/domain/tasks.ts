import { z } from "zod";

import { istanbulDay } from "@/platform/time/istanbul";

/**
 * TSK's rules that do not need the database (TASK-0108, REQ-TSK, D-263): the order of the task
 * list, the words of each notification type, and what the "Görev ver" form accepts.
 */

export const TASK_PRIORITIES = ["low", "normal", "high", "critical"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];
export type TaskStatus = "open" | "reported_done" | "closed";
export type TaskSource = "manual" | "system" | "workflow";

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "Düşük",
  normal: "Normal",
  high: "Yüksek",
  critical: "Kritik",
};

export const STATUS_LABELS: Record<TaskStatus, string> = {
  open: "Açık",
  reported_done: "Onay bekliyor",
  closed: "Kapandı",
};

export type TaskSummary = {
  id: string;
  title: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueAt: Date | null;
  assigneeUserId: string;
  assigneeName: string;
  givenByUserId: string | null;
  givenByName: string | null;
  sourceType: TaskSource;
  linkPath: string;
  createdAt: Date;
};

/** Where a task stands for the list: late, due today, waiting for the giver, the rest. */
export type TaskGroup = "overdue" | "today" | "awaiting" | "upcoming" | "closed";

export function taskGroup(task: Pick<TaskSummary, "status" | "dueAt">, now: Date): TaskGroup {
  if (task.status === "closed") return "closed";
  if (task.dueAt && task.dueAt.getTime() < now.getTime()) return "overdue";
  if (task.status === "reported_done") return "awaiting";
  if (task.dueAt && istanbulDay(task.dueAt) === istanbulDay(now)) return "today";
  return "upcoming";
}

const GROUP_ORDER: Record<TaskGroup, number> = {
  overdue: 0,
  today: 1,
  awaiting: 2,
  upcoming: 3,
  closed: 4,
};
const PRIORITY_ORDER: Record<TaskPriority, number> = { critical: 0, high: 1, normal: 2, low: 3 };

/**
 * The list order (REQ-TSK-007): late tasks always first, then today's, those waiting for
 * approval and the rest; inside a group higher priority, then the nearer due date, then newest.
 */
export function sortTasks<T extends TaskSummary>(tasks: readonly T[], now: Date): T[] {
  const due = (t: T) => t.dueAt?.getTime() ?? Number.POSITIVE_INFINITY;
  return [...tasks].sort(
    (a, b) =>
      GROUP_ORDER[taskGroup(a, now)] - GROUP_ORDER[taskGroup(b, now)] ||
      PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] ||
      due(a) - due(b) ||
      b.createdAt.getTime() - a.createdAt.getTime(),
  );
}

// ---------------------------------------------------------------------------------------------
// Notification words (REQ-TSK-009, REQ-TSK-011)
// ---------------------------------------------------------------------------------------------

/**
 * Every notification type and its fixed words. The only variable part is the subject — a task's
 * title — and the record is carried as a link, so no field of a record can reach the text, on
 * the panel, the phone or in e-mail alike (REQ-TSK-011).
 */
export const NOTIFICATION_TEMPLATES = {
  "task.assigned": { title: "Size yeni görev verildi", phone: true },
  "task.completed": { title: "Verdiğiniz görev tamamlandı", phone: false },
  "task.done_reported": { title: "Görev tamamlandı, onayınızı bekliyor", phone: false },
  "task.approved": { title: "Göreviniz onaylandı ve kapandı", phone: false },
  "task.reopened": { title: "Göreviniz yeniden açıldı", phone: false },
  "task.overdue": { title: "Görevin son tarihi geçti", phone: false },
  "task.escalated": { title: "Size eskale edilen görev var", phone: false },
  "approval.requested": { title: "Onayınızı bekleyen bir talep var", phone: true },
  "revision.requested": { title: "Bir kayıt için düzeltme istendi", phone: false },
  "system.problem": { title: "Sistem sorunu", phone: true },
  "digest.daily": { title: "Günlük özetiniz", phone: false },
} as const;

export type NotificationType = keyof typeof NOTIFICATION_TEMPLATES;

export function isNotificationType(type: string): type is NotificationType {
  return Object.hasOwn(NOTIFICATION_TEMPLATES, type);
}

/** The bell's filter (SPECIAL_SCREENS SCR-015 "türe göre süzme"). */
export const NOTIFICATION_FILTERS = [
  { value: "all", label: "Tümü" },
  { value: "tasks", label: "Görevler" },
  { value: "approvals", label: "Onay ve düzeltme" },
  { value: "critical", label: "Kritik" },
] as const;

export type NotificationFilter = (typeof NOTIFICATION_FILTERS)[number]["value"];

export function matchesNotificationFilter(
  filter: NotificationFilter,
  item: { type: string; isCritical: boolean },
): boolean {
  if (filter === "all") return true;
  if (filter === "critical") return item.isCritical;
  if (filter === "tasks") return item.type.startsWith("task.");
  return item.type.startsWith("approval.") || item.type.startsWith("revision.");
}

/** The words of a notification: the type's title, and the subject when there is one. */
export function notificationText(
  type: string,
  subject: string | null,
): {
  title: string;
  body: string | null;
} {
  const title = isNotificationType(type) ? NOTIFICATION_TEMPLATES[type].title : "Bildirim";
  const body = subject?.trim() ? subject.trim().slice(0, 200) : null;
  return { title, body };
}

// ---------------------------------------------------------------------------------------------
// The "Görev ver" form (SCR-014)
// ---------------------------------------------------------------------------------------------

export const TASK_RULE_MESSAGES: Record<string, string> = {
  "tsk.outside_scope": "Bu kişi kapsamınız dışında; ona görev veremezsiniz.",
  "tsk.not_found": "Görev bulunamadı.",
  "tsk.not_assignee": "Bu görevi yalnız sorumlusu tamamlayabilir.",
  "tsk.not_giver": "Bu işlemi yalnız görevi veren yapabilir.",
  "tsk.not_reported": "Görev onay beklemiyor.",
};

/** A date field ("YYYY-MM-DD") as the end of that Istanbul day. */
export function dueAtFromDay(day: string): Date {
  return new Date(`${day}T23:59:59+03:00`);
}

export const assignTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Görevin başlığını yazın.")
    .max(200, "Başlık en çok 200 karakter olabilir."),
  description: z.string().trim().max(4000, "Açıklama en çok 4000 karakter olabilir.").optional(),
  assigneeId: z.uuid("Sorumlu kişiyi seçin."),
  priority: z.enum(TASK_PRIORITIES).default("normal"),
  dueOn: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Son tarihi seçin.")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  needsApproval: z.boolean().default(false),
});

export type AssignTaskInput = z.infer<typeof assignTaskSchema>;

// ---------------------------------------------------------------------------------------------
// History lines (REQ-TSK-004: closing and reopening show with person and time)
// ---------------------------------------------------------------------------------------------

export type HistoryFacts = {
  operation: "insert" | "update";
  field: string | null;
  oldValue: unknown;
  newValue: unknown;
  reason: string | null;
};

/** What a history row says in words; null for rows the task screen does not list. */
export function historyLine(entry: HistoryFacts): string | null {
  if (entry.operation === "insert") return "Görevi oluşturdu";
  if (entry.field === "status") {
    if (entry.newValue === "reported_done") return "Tamamladığını bildirdi";
    if (entry.newValue === "closed")
      return entry.reason === "sebebi çözüldü" ? "Sebebi çözüldü, görev kapandı" : "Görevi kapattı";
    if (entry.newValue === "open")
      return entry.oldValue === "reported_done" ? "Görevi geri gönderdi" : "Görevi yeniden açtı";
  }
  if (entry.field === "assignee_user_id") return "Sorumluyu değiştirdi";
  if (entry.field === "due_at") return "Son tarihi değiştirdi";
  if (entry.field === "priority") return "Önceliği değiştirdi";
  return null;
}

// ---------------------------------------------------------------------------------------------
// The daily digest (REQ-TSK-013, D-133)
// ---------------------------------------------------------------------------------------------

export type DigestCounts = {
  overdue?: number;
  due_today?: number;
  open_tasks?: number;
  waiting_my_approval?: number;
  unread?: number;
  company?: { opened?: number; closed?: number; overdue?: number; system_problems?: number };
};

/** Default sending time of the morning summary; the dated rule `tsk.digest-time` overrides it. */
export const DEFAULT_DIGEST_TIME = "07:30";

const count = (value: number | undefined) => value ?? 0;

/**
 * The words of one person's morning summary, built from counts only (REQ-TSK-011). Nothing is
 * sent to somebody with no work: `isEmpty` says so, and the owner's company lines count as work.
 */
export function digestText(counts: DigestCounts): {
  isEmpty: boolean;
  subject: string;
  lines: string[];
} {
  const own =
    count(counts.overdue) +
    count(counts.due_today) +
    count(counts.open_tasks) +
    count(counts.waiting_my_approval) +
    count(counts.unread);
  const company = counts.company;
  const companyTotal = company
    ? count(company.opened) +
      count(company.closed) +
      count(company.overdue) +
      count(company.system_problems)
    : 0;

  const lines: string[] = [];
  if (count(counts.overdue) > 0) lines.push(`${counts.overdue} geciken görev`);
  if (count(counts.due_today) > 0) lines.push(`bugün biten ${counts.due_today} görev`);
  const later = count(counts.open_tasks) - count(counts.overdue) - count(counts.due_today);
  if (later > 0) lines.push(`${later} açık görev`);
  if (count(counts.waiting_my_approval) > 0) {
    lines.push(`onayınızı bekleyen ${counts.waiting_my_approval} görev`);
  }
  if (count(counts.unread) > 0) lines.push(`${counts.unread} okunmamış bildirim`);
  if (company && companyTotal > 0) {
    lines.push(
      `Şirket dün: ${count(company.opened)} görev açıldı, ${count(company.closed)} kapandı, ` +
        `${count(company.overdue)} geciken, ${count(company.system_problems)} sistem sorunu`,
    );
  }

  const headline =
    count(counts.overdue) > 0
      ? `${counts.overdue} geciken işiniz var`
      : count(counts.due_today) > 0
        ? `Bugün ${counts.due_today} işiniz var`
        : lines.length > 0
          ? "Günlük özetiniz"
          : "Bugün işiniz yok";
  return { isEmpty: own === 0 && companyTotal === 0, subject: headline, lines };
}
