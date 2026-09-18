import type { PermissionGuarded } from "@/platform/access/access-policy";
import type { ModuleCode } from "@/platform/navigation/navigation-registry";

export type DashboardWidget = PermissionGuarded & {
  id: string;
  title: string;
  description: string;
  moduleCode: ModuleCode;
  /** The six indicators "Bugün" shows without asking; the rest wait behind a fold (D-065). */
  critical?: true;
  /**
   * SAMPLE DATA (D-065). No module produces numbers yet, so the screen shows example values
   * behind an "Örnek veri" badge. Replace with the module's own figure; nothing else changes.
   * The value is the number alone — the unit is set apart, because only digits are mono (§4).
   * Figures that also appear elsewhere on the screen are kept equal to their source: pending
   * approvals to the queue, overdue tasks and alerts to the lists that carry them.
   */
  sampleValue?: string;
  sampleUnit?: string;
};

/**
 * The figures on "Bugün" (functional scope §3.1). Their data sources are defined in Phase 02;
 * add one by adding an entry.
 *
 * §3.2's site summary and §3.3's "Dikkat" list are not here: "Dikkat" is the owner's work block
 * (D-065), and the site summary was taken off this screen by the owner on 2026-09-17 — it
 * belongs with the SIT screens when they exist.
 */
export const dashboardWidgetRegistry: readonly DashboardWidget[] = [
  {
    id: "active-sites",
    sampleValue: "4",
    sampleUnit: "şantiye",
    title: "Aktif şantiye",
    description: "Aktif şantiye sayısı",
    moduleCode: "SIT",
    requiredPermission: "sit.site.view",
  },
  {
    id: "production-today",
    sampleValue: "318 / 296",
    sampleUnit: "panel",
    critical: true,
    title: "Bugün / dün üretim",
    description: "Günlük panel döküm ve montaj",
    moduleCode: "SIT",
    requiredPermission: "sit.daily-site-log.view",
  },
  {
    id: "production-month",
    sampleValue: "5.940",
    sampleUnit: "panel",
    title: "Bu ay üretim",
    description: "Bu ayki toplam üretim",
    moduleCode: "SIT",
    requiredPermission: "sit.daily-site-log.view",
  },
  {
    id: "monthly-profit-loss",
    sampleValue: "+2,14",
    sampleUnit: "milyon ₺",
    critical: true,
    title: "Aylık kâr-zarar",
    description: "Şirket geneli aylık kâr-zarar",
    moduleCode: "FIN",
    requiredPermission: "fin.profit-loss.view",
  },
  {
    id: "cash-position",
    sampleValue: "4,80",
    sampleUnit: "milyon ₺",
    critical: true,
    title: "Nakit pozisyonu",
    description: "Güncel nakit durumu",
    moduleCode: "FIN",
    requiredPermission: "fin.cash.view",
  },
  {
    id: "open-receivables",
    sampleValue: "1,24",
    sampleUnit: "milyon ₺",
    title: "Açık alacak",
    description: "Toplam açık alacak",
    moduleCode: "FIN",
    requiredPermission: "fin.party-account.view",
  },
  {
    id: "pending-approvals",
    sampleValue: "0",
    sampleUnit: "kayıt",
    critical: true,
    title: "Bekleyen onay",
    description: "Onay bekleyen işlem sayısı",
    moduleCode: "WFL",
    requiredPermission: "wfl.approval.view",
  },
  {
    id: "overdue-tasks",
    sampleValue: "0",
    sampleUnit: "görev",
    critical: true,
    title: "Geciken görev",
    description: "Süresi geçmiş görev sayısı",
    moduleCode: "TSK",
    requiredPermission: "tsk.task.view",
  },
  {
    id: "critical-alerts",
    sampleValue: "4",
    sampleUnit: "uyarı",
    critical: true,
    title: "Kritik uyarı",
    description: "Dikkat gerektiren uyarı sayısı",
    moduleCode: "RPT",
    requiredPermission: "rpt.cockpit.view",
  },
  {
    id: "critical-stock",
    sampleValue: "2",
    sampleUnit: "kalem",
    title: "Kritik stok",
    description: "Kritik seviyedeki stok kalemi sayısı",
    moduleCode: "INV",
    requiredPermission: "inv.stock.view",
  },
  {
    id: "open-ohs-incidents",
    sampleValue: "1",
    sampleUnit: "olay",
    title: "Açık İSG olayı",
    description: "Kapanmamış İSG olayları",
    moduleCode: "QHS",
    requiredPermission: "qhs.record.view",
  },
  {
    id: "expiring-documents",
    sampleValue: "3",
    sampleUnit: "belge",
    title: "Süresi yaklaşan belge",
    description: "Süresi yaklaşan kalite/uyum belgeleri",
    moduleCode: "CMP",
    requiredPermission: "cmp.contract.view",
  },
  {
    id: "open-quotes",
    sampleValue: "7",
    sampleUnit: "teklif",
    title: "Açık teklif",
    description: "Açık teklifler ve kazanma oranı",
    moduleCode: "QTE",
    requiredPermission: "qte.quote.view",
  },
  {
    id: "personnel-changes",
    sampleValue: "2 / 1",
    sampleUnit: "giriş / çıkış",
    title: "Personel hareketi",
    description: "Giriş, çıkış ve izin hareketleri",
    moduleCode: "HR",
    requiredPermission: "hr.employee.view",
  },
  {
    id: "open-meeting-decisions",
    sampleValue: "4",
    sampleUnit: "karar",
    title: "Açık toplantı kararı",
    description: "Açık ve geciken toplantı kararları",
    moduleCode: "MTG",
    requiredPermission: "mtg.meeting.view",
  },
];
