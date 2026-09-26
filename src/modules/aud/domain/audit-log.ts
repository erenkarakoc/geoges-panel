import { z } from "zod";

/**
 * The audit log's vocabulary and filters (SCR-193, REQ-AUD-006, TASK-0103). Event codes are
 * written by the database (migration 0004) and the admin tools; the screen shows their Turkish
 * names. A code that has no name yet reads "Diğer işlem" — a raw code is never shown to a person
 * (owner, 2026-09-26); `audit-log.test.ts` fails when a code the database writes has no name.
 */

export const AUDIT_EVENT_LABELS: Readonly<Record<string, string>> = {
  "user.signed_in": "Giriş yaptı",
  "user.signed_out": "Çıkış yaptı",
  "user.created": "Hesap açıldı",
  "user.deactivated": "Hesap pasife alındı",
  "user.reactivated": "Hesap yeniden açıldı",
  "user.leaving_date_set": "Ayrılış tarihi girildi",
  "sign_in.locked": "Giriş kilitlendi",
  "two_factor.enrolled": "İki adımlı doğrulama kuruldu",
  "two_factor.reset": "İki adımlı doğrulama sıfırlandı",
  "role_assignment.created": "Rol atandı",
  "role_assignment.ended": "Rol ataması bitirildi",
  "role_assignment.changed": "Rol ataması değişti",
  "role_delegation.started": "Vekâlet verildi",
  "role_delegation.changed": "Vekâlet süresi değişti",
  "role_permission.granted": "Role yetki verildi",
  "role_permission.revoked": "Rolden yetki alındı",
  "user_exception.created": "Kişisel istisna tanımlandı",
  "user_exception.revoked": "Kişisel istisna kaldırıldı",
  "user_manager.assigned": "Elle amir atandı",
  "user_manager.revoked": "Elle amir kaldırıldı",
  "environment.reset_data": "Örnek iş verisi sıfırlandı",
  "environment.reset_config": "Yapılandırma fabrika ayarına döndü",
  "configuration.exported": "Yapılandırma dışa aktarıldı",
  "configuration.imported": "Yapılandırma içe aktarıldı",
  "document.archived": "Belge arşivlendi",
  "document.bulk_downloaded": "Belgeler toplu indirildi",
  "exchange_rate.entered": "Elle kur girildi",
  "system.dead_letter_retried": "Başarısız iş yeniden denendi",
  "workflow.published": "Akış yayımlandı",
  "workflow.template_used": "Şablondan akış açıldı",
  "workflow.template_reset": "Akış şablona sıfırlandı",
  "approval.decided": "Onay kararı verildi",
  "lock.overridden": "Kilit gerekçeyle aşıldı",
  "revision_request.submitted": "Revizyon talebi gönderildi",
  "revision_request.approved": "Revizyon talebi onaylandı",
  "revision_request.rejected": "Revizyon talebi reddedildi",
  "role_delegation.ended": "Vekâlet sona erdi",
  "system.dead_letter": "Arka plan işi başarısız oldu",
  "system.queue_delayed": "Arka plan işleri gecikti",
  "read_model.rebuilt": "Rapor verisi yeniden kuruldu",
};

/** Event groups offered by the "işlem türü" filter; the value is an event code prefix. */
export const AUDIT_EVENT_GROUPS = [
  { value: "user.", label: "Giriş ve hesaplar" },
  { value: "sign_in.", label: "Giriş kilitleri" },
  { value: "two_factor.", label: "İki adımlı doğrulama" },
  { value: "role_assignment.", label: "Rol atamaları" },
  { value: "role_delegation.", label: "Vekâletler" },
  { value: "role_permission.", label: "Rol yetkileri" },
  { value: "user_exception.", label: "Kişisel istisnalar" },
  { value: "user_manager.", label: "Elle amir atamaları" },
  { value: "environment.", label: "Sıfırlamalar" },
  { value: "configuration.", label: "Yapılandırma aktarımı" },
  { value: "document.", label: "Belgeler" },
  { value: "exchange_rate.", label: "Döviz kurları" },
  { value: "workflow.", label: "İş akışları" },
  { value: "approval.", label: "Onaylar" },
  { value: "lock.", label: "Kilitler" },
  { value: "revision_request.", label: "Revizyon talepleri" },
  { value: "read_model.", label: "Rapor verisi" },
  { value: "system.", label: "Sistem işleri" },
] as const;

/** Record types offered by the "kayıt türü" filter (`schema.table`). */
export const AUDIT_TARGET_TABLES = [
  { value: "iam.user", label: "Kullanıcı" },
  { value: "iam.login_attempt", label: "Giriş denemesi" },
  { value: "iam.role_assignment", label: "Rol ataması" },
  { value: "iam.role_permission", label: "Rol yetkisi" },
  { value: "iam.user_exception", label: "Kişisel istisna" },
  { value: "iam.user_manager", label: "Elle amir" },
  { value: "doc.document", label: "Belge" },
  { value: "adm.exchange_rate", label: "Döviz kuru" },
  { value: "wfl.flow_version", label: "Akış sürümü" },
  { value: "wfl.approval", label: "Onay" },
  { value: "wfl.record_lock", label: "Kayıt kilidi" },
  { value: "aud.revision_request", label: "Revizyon talebi" },
  { value: "core.outbox_delivery", label: "Arka plan işi" },
  { value: "core.scheduled_job", label: "Zamanlanmış iş" },
  { value: "core.read_model", label: "Rapor verisi" },
  { value: "core.dead_letter", label: "Başarısız iş" },
] as const;

export const AUDIT_PAGE_SIZE = 50;

export function auditEventLabel(code: string): string {
  return AUDIT_EVENT_LABELS[code] ?? "Diğer işlem";
}

/**
 * Who did it: the account's name; "Sistem" for the admin tools (no account); "Kaldırılmış hesap"
 * for a sample or test account that a reset has since removed (real accounts are never removed).
 */
export function auditActorLabel(actorUserId: string | null, actorName: string | null): string {
  if (actorName) return actorName;
  return actorUserId ? "Kaldırılmış hesap" : "Sistem";
}

export function auditTargetLabel(schema: string | null, table: string | null): string | null {
  if (!schema || !table) return null;
  const key = `${schema}.${table}`;
  return AUDIT_TARGET_TABLES.find((t) => t.value === key)?.label ?? "Diğer kayıt";
}

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const groupValues = AUDIT_EVENT_GROUPS.map((g) => g.value) as [string, ...string[]];
const tableValues = AUDIT_TARGET_TABLES.map((t) => t.value) as [string, ...string[]];

const optional = <T extends z.ZodType>(schema: T) =>
  z.preprocess((v) => (v === "" || v === undefined ? undefined : v), schema.optional());

const filterSchema = z.object({
  kisi: optional(z.guid()),
  islem: optional(z.enum(groupValues)),
  kayit: optional(z.enum(tableValues)),
  baslangic: optional(z.string().regex(DAY)),
  bitis: optional(z.string().regex(DAY)),
  sayfa: optional(z.coerce.number().int().min(1).max(100_000)),
});

export type AuditLogFilters = {
  actorId: string | null;
  eventPrefix: string | null;
  targetTable: string | null;
  /** Calendar days in Europe/Istanbul, inclusive. */
  fromDay: string | null;
  toDay: string | null;
  page: number;
};

/**
 * Reads the filters from the query string (Turkish parameter names, as in the address bar). An
 * invalid value is dropped, not an error: a hand-edited link still opens the list.
 */
export function parseAuditLogFilters(
  params: Record<string, string | string[] | undefined>,
): AuditLogFilters {
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const read = <K extends keyof typeof filterSchema.shape>(key: K) => {
    const parsed = filterSchema.shape[key].safeParse(first(params[key]));
    return parsed.success ? parsed.data : undefined;
  };
  return {
    actorId: (read("kisi") as string | undefined) ?? null,
    eventPrefix: (read("islem") as string | undefined) ?? null,
    targetTable: (read("kayit") as string | undefined) ?? null,
    fromDay: (read("baslangic") as string | undefined) ?? null,
    toDay: (read("bitis") as string | undefined) ?? null,
    page: (read("sayfa") as number | undefined) ?? 1,
  };
}

/**
 * The time range as instants. Turkey keeps UTC+3 all year (no daylight saving since 2016), so a
 * calendar day starts at 00:00+03:00; the end day is inclusive.
 */
export function auditLogRange(filters: AuditLogFilters): { from: Date | null; to: Date | null } {
  const from = filters.fromDay ? new Date(`${filters.fromDay}T00:00:00+03:00`) : null;
  const to = filters.toDay
    ? new Date(new Date(`${filters.toDay}T00:00:00+03:00`).getTime() + 86_400_000)
    : null;
  return { from, to };
}

/** Query string for a filter state; empty values and the first page are left out. */
export function auditLogQuery(filters: AuditLogFilters, page = filters.page): string {
  const q = new URLSearchParams();
  if (filters.actorId) q.set("kisi", filters.actorId);
  if (filters.eventPrefix) q.set("islem", filters.eventPrefix);
  if (filters.targetTable) q.set("kayit", filters.targetTable);
  if (filters.fromDay) q.set("baslangic", filters.fromDay);
  if (filters.toDay) q.set("bitis", filters.toDay);
  if (page > 1) q.set("sayfa", String(page));
  const text = q.toString();
  return text ? `?${text}` : "";
}
