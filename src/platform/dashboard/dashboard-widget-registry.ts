import type { PermissionGuarded } from "@/platform/access/access-policy";
import type { ModuleCode } from "@/platform/navigation/navigation-registry";

export type DashboardWidget = PermissionGuarded & {
  id: string;
  title: string;
  description: string;
  moduleCode: ModuleCode;
  /** Grid width on large screens. */
  size: "indicator" | "wide";
};

/**
 * Owner cockpit skeleton (functional scope §3.1–§3.3). Widgets have no data yet;
 * their content and data sources are defined in Phase 02. Add a widget by adding an entry.
 */
export const dashboardWidgetRegistry: readonly DashboardWidget[] = [
  {
    id: "active-sites",
    title: "Aktif şantiye",
    description: "Aktif şantiye sayısı",
    moduleCode: "SIT",
    requiredPermission: "sit.site.view",
    size: "indicator",
  },
  {
    id: "production-today",
    title: "Bugün / dün üretim",
    description: "Günlük panel döküm ve montaj",
    moduleCode: "SIT",
    requiredPermission: "sit.daily-site-log.view",
    size: "indicator",
  },
  {
    id: "production-month",
    title: "Bu ay üretim",
    description: "Bu ayki toplam üretim",
    moduleCode: "SIT",
    requiredPermission: "sit.daily-site-log.view",
    size: "indicator",
  },
  {
    id: "monthly-profit-loss",
    title: "Aylık kâr-zarar",
    description: "Şirket geneli aylık kâr-zarar",
    moduleCode: "FIN",
    requiredPermission: "fin.profit-loss.view",
    size: "indicator",
  },
  {
    id: "cash-position",
    title: "Nakit pozisyonu",
    description: "Güncel nakit durumu",
    moduleCode: "FIN",
    requiredPermission: "fin.cash.view",
    size: "indicator",
  },
  {
    id: "open-receivables",
    title: "Açık alacak",
    description: "Toplam açık alacak",
    moduleCode: "FIN",
    requiredPermission: "fin.party-account.view",
    size: "indicator",
  },
  {
    id: "pending-approvals",
    title: "Bekleyen onay",
    description: "Onay bekleyen işlem sayısı",
    moduleCode: "WFL",
    requiredPermission: "wfl.approval.view",
    size: "indicator",
  },
  {
    id: "overdue-tasks",
    title: "Geciken görev",
    description: "Süresi geçmiş görev sayısı",
    moduleCode: "TSK",
    requiredPermission: "tsk.task.view",
    size: "indicator",
  },
  {
    id: "critical-alerts",
    title: "Kritik uyarı",
    description: "Dikkat gerektiren uyarı sayısı",
    moduleCode: "RPT",
    requiredPermission: "rpt.cockpit.view",
    size: "indicator",
  },
  {
    id: "critical-stock",
    title: "Kritik stok",
    description: "Kritik seviyedeki stok kalemi sayısı",
    moduleCode: "INV",
    requiredPermission: "inv.stock.view",
    size: "indicator",
  },
  {
    id: "open-ohs-incidents",
    title: "Açık İSG olayı",
    description: "Kapanmamış İSG olayları",
    moduleCode: "QHS",
    requiredPermission: "qhs.record.view",
    size: "indicator",
  },
  {
    id: "expiring-documents",
    title: "Süresi yaklaşan belge",
    description: "Süresi yaklaşan kalite/uyum belgeleri",
    moduleCode: "CMP",
    requiredPermission: "cmp.contract.view",
    size: "indicator",
  },
  {
    id: "open-quotes",
    title: "Açık teklif",
    description: "Açık teklifler ve kazanma oranı",
    moduleCode: "QTE",
    requiredPermission: "qte.quote.view",
    size: "indicator",
  },
  {
    id: "personnel-changes",
    title: "Personel hareketi",
    description: "Giriş, çıkış ve izin hareketleri",
    moduleCode: "HR",
    requiredPermission: "hr.employee.view",
    size: "indicator",
  },
  {
    id: "open-meeting-decisions",
    title: "Açık toplantı kararı",
    description: "Açık ve geciken toplantı kararları",
    moduleCode: "MTG",
    requiredPermission: "mtg.meeting.view",
    size: "indicator",
  },
  {
    id: "site-overview",
    title: "Şantiyeler",
    description: "Aktif şantiyelerin üretim, ilerleme, onay ve kâr-zarar özeti",
    moduleCode: "SIT",
    requiredPermission: "sit.site.view",
    size: "wide",
  },
  {
    id: "attention",
    title: "Dikkat",
    description: "Gizlenemeyen kritik olaylar; her uyarı kaynağına götürür",
    moduleCode: "RPT",
    requiredPermission: "rpt.cockpit.view",
    size: "wide",
  },
];
