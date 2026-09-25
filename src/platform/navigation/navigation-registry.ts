import {
  ArchiveIcon,
  BarChart3Icon,
  BookOpenIcon,
  BoxesIcon,
  Building2Icon,
  CalendarCheckIcon,
  ClipboardCheckIcon,
  ClipboardListIcon,
  CoinsIcon,
  FactoryIcon,
  FileClockIcon,
  FileSearchIcon,
  FileTextIcon,
  FolderKanbanIcon,
  HammerIcon,
  HandshakeIcon,
  HardHatIcon,
  LandmarkIcon,
  LifeBuoyIcon,
  LightbulbIcon,
  ListChecksIcon,
  type LucideIcon,
  MapPinnedIcon,
  PackageIcon,
  ScaleIcon,
  Settings2Icon,
  ShieldCheckIcon,
  ShoppingCartIcon,
  SlidersHorizontalIcon,
  TruckIcon,
  UploadIcon,
  WorkflowIcon,
  UsersIcon,
  UsersRoundIcon,
} from "lucide-react";

import {
  type AccessPolicy,
  filterByPermission,
  type PermissionGuarded,
} from "@/platform/access/access-policy";

/** Owner module codes from `docs/architecture/MODULE_MAP.md`. */
export type ModuleCode =
  | "IAM"
  | "AUD"
  | "DOC"
  | "WFL"
  | "TSK"
  | "ADM"
  | "PRJ"
  | "SIT"
  | "INV"
  | "PUR"
  | "FAC"
  | "EQP"
  | "CRM"
  | "QTE"
  | "FIN"
  | "HR"
  | "CMP"
  | "QHS"
  | "MTG"
  | "SUP"
  | "RPT"
  | "PRF"
  | "INT"
  | "STR"
  | "MIG";

export type NavigationItem = PermissionGuarded & {
  id: string;
  label: string;
  href: `/${string}`;
  icon: LucideIcon;
  moduleCode: ModuleCode;
  /** Short Turkish explanation shown on the module's placeholder page. */
  description: string;
  /**
   * The page works inside one site, so the header shows the site selector (D-062). Only pages
   * that declare it get one; the chosen site is remembered across them.
   */
  scope?: "site";
  /** The page's own primary action in the header; without one the role's action is shown. */
  primaryAction?: string;
};

export type NavigationGroup = {
  id: string;
  label: string;
  /** One icon per group: the rail shows the group, not its modules (D-054). */
  icon: LucideIcon;
  items: readonly NavigationItem[];
};

/**
 * Work layer — the top region of the rail (D-054). These are the screens a user comes back to
 * every day, so they sit above the module groups instead of inside them. "Bugün" is every
 * role's entry screen and is composed per role (D-056); the cockpit is the owner's variant of
 * it, which is why it is not a separate menu entry.
 */
export const workNavigation: readonly NavigationItem[] = [
  {
    id: "today",
    label: "Bugün",
    href: "/today",
    icon: CalendarCheckIcon,
    moduleCode: "RPT",
    requiredPermission: "rpt.cockpit.view",
    description: "Rolünüze göre kurulan giriş ekranı: bugün sizden bekleneni gösterir.",
  },
  {
    id: "approvals",
    label: "Onaylar",
    href: "/approvals",
    icon: ClipboardCheckIcon,
    moduleCode: "WFL",
    requiredPermission: "wfl.approval.view",
    description: "Yetkinize göre bekleyen tüm onayların toplandığı onay merkezi.",
  },
  {
    id: "tasks",
    label: "Görevler",
    href: "/tasks",
    icon: ListChecksIcon,
    moduleCode: "TSK",
    requiredPermission: "tsk.task.view",
    description: "Size atanan görevler, bildirimler ve eskalasyonlar.",
  },
];

/**
 * Badge counts for the work layer, keyed by entry id. Empty until WFL and TSK deliver
 * permission-filtered counts; the sample numbers were removed at the owner's request (D-106).
 * A missing key shows no badge.
 */
export type WorkCounts = Readonly<Record<string, number>>;

/**
 * No count at all, which is what a screen shows before anybody asks the modules: the real numbers
 * are read per person and handed to the shell, because platform may not read a module's rows.
 */
export const noWorkCounts: WorkCounts = {};

/**
 * Module groups of the functional scope §40.1, unchanged in name and order. The rail shows one
 * icon per group and its modules open from there (D-054), so the list is no longer a column.
 * UI label "Şantiye" replaces "Saha" per D-026.
 * Add a module by adding an item here; its placeholder page is generated automatically.
 */
export const navigationRegistry: readonly NavigationGroup[] = [
  {
    id: "site-daily",
    label: "Şantiye & Günlük",
    icon: HammerIcon,
    items: [
      {
        id: "daily-site-logs",
        label: "Şantiye Kaydı",
        href: "/daily-site-logs",
        icon: ClipboardListIcon,
        moduleCode: "SIT",
        requiredPermission: "sit.daily-site-log.view",
        description:
          "Şantiyenin günlük ana kaydı: döküm, montaj, şerit, puantaj, zayi ve harcamalar.",
        scope: "site",
        primaryAction: "Günü kaydet",
      },
      {
        // Not in scope §40.1; placed here by owner decision D-051 (OQ-025).
        id: "projects",
        label: "Projeler",
        href: "/projects",
        icon: FolderKanbanIcon,
        moduleCode: "PRJ",
        requiredPermission: "prj.project.view",
        description: "Proje kartı, duvarlar, iş programı, tedarik matrisi ve teknik ofis takibi.",
      },
      {
        id: "sites",
        label: "Şantiyeler",
        href: "/sites",
        icon: MapPinnedIcon,
        moduleCode: "SIT",
        requiredPermission: "sit.site.view",
        description: "Şantiye kartları, ilerleme ve şantiye detay ekranları.",
      },
      {
        id: "insights",
        label: "Öneriler",
        href: "/insights",
        icon: LightbulbIcon,
        moduleCode: "INT",
        requiredPermission: "int.insight.view",
        description: "Gecikme, atıl kaynak ve risklere yönelik öncelikli öneriler.",
      },
      {
        id: "daily-reports",
        label: "Günlük Raporlar",
        href: "/daily-reports",
        icon: FileTextIcon,
        moduleCode: "RPT",
        requiredPermission: "rpt.daily-report.view",
        description: "Onaylı günlük kayıtlardan üretilen resmi günlük raporlar.",
        scope: "site",
      },
    ],
  },
  {
    id: "resources-production",
    label: "Kaynak & Üretim",
    icon: PackageIcon,
    items: [
      {
        id: "inventory",
        label: "Stok",
        href: "/inventory",
        icon: BoxesIcon,
        moduleCode: "INV",
        requiredPermission: "inv.stock.view",
        description: "Lokasyon bazlı stok, malzeme hareketleri, kantar ve sayım.",
      },
      {
        id: "purchasing",
        label: "Satın Alma",
        href: "/purchasing",
        icon: ShoppingCartIcon,
        moduleCode: "PUR",
        requiredPermission: "pur.purchase-order.view",
        description: "Tedarikçiler, siparişler ve satın alma talepleri.",
        primaryAction: "Talep oluştur",
      },
      {
        id: "equipment",
        label: "Ekipman",
        href: "/equipment",
        icon: TruckIcon,
        moduleCode: "EQP",
        requiredPermission: "eqp.asset.view",
        description: "Demirbaş, kalıp, araç ve vinç yönetimi.",
      },
      {
        id: "factory",
        label: "Fabrika",
        href: "/factory",
        icon: FactoryIcon,
        moduleCode: "FAC",
        requiredPermission: "fac.factory-log.view",
        description: "Fabrika günlük kaydı, şerit ve lug üretim zinciri, birim maliyet.",
      },
    ],
  },
  {
    id: "commercial",
    label: "Ticari",
    icon: CoinsIcon,
    items: [
      {
        // Not in scope §40.1; placed here by owner decision D-051 (OQ-025).
        id: "leads-clients",
        label: "Talepler & Müşteriler",
        href: "/leads-clients",
        icon: HandshakeIcon,
        moduleCode: "CRM",
        requiredPermission: "crm.lead.view",
        description: "Gelen iş talepleri, işveren kartları ve karneleri, ihale takibi.",
      },
      {
        id: "quotes",
        label: "Teklif",
        href: "/quotes",
        icon: FileSearchIcon,
        moduleCode: "QTE",
        requiredPermission: "qte.quote.view",
        description: "Teklifler, marj hesabı ve teklif belgeleri.",
        primaryAction: "Teklif hazırla",
      },
      {
        id: "finance",
        label: "Finans",
        href: "/finance",
        icon: LandmarkIcon,
        moduleCode: "FIN",
        requiredPermission: "fin.finance.view",
        description: "Hakediş, gelir-gider, cari hesap ve nakit akışı.",
      },
      {
        id: "period-close",
        label: "Dönem Kapanışı",
        href: "/period-close",
        icon: CalendarCheckIcon,
        moduleCode: "FIN",
        requiredPermission: "fin.period-close.view",
        description: "Aylık dönem kapanışı ve kesinleşmiş raporlar.",
      },
    ],
  },
  {
    id: "corporate",
    label: "Kurumsal",
    icon: Building2Icon,
    items: [
      {
        id: "human-resources",
        label: "İK",
        href: "/human-resources",
        icon: UsersRoundIcon,
        moduleCode: "HR",
        requiredPermission: "hr.employee.view",
        description: "Personel kartı, puantaj, bordro ve izinler.",
      },
      {
        id: "compliance",
        label: "Uyum",
        href: "/compliance",
        icon: ScaleIcon,
        moduleCode: "CMP",
        requiredPermission: "cmp.contract.view",
        description: "Sözleşme şartları, yükümlülükler, teminatlar ve süreli belgeler.",
      },
      {
        id: "quality-safety",
        label: "Kalite & İSG",
        href: "/quality-safety",
        icon: HardHatIcon,
        moduleCode: "QHS",
        requiredPermission: "qhs.record.view",
        description: "Sertifikalar, kalite kontrolleri, DÖF ve İSG olayları.",
      },
      {
        id: "performance",
        label: "Performans",
        href: "/performance",
        icon: BarChart3Icon,
        moduleCode: "PRF",
        requiredPermission: "prf.metric.view",
        description: "KPI kataloğu, sıralamalar, hedefler ve prim.",
      },
      {
        id: "meetings",
        label: "Toplantı & Karar",
        href: "/meetings",
        icon: BookOpenIcon,
        moduleCode: "MTG",
        requiredPermission: "mtg.meeting.view",
        description: "Toplantı kayıtları, kararlar ve karar takibi.",
      },
      {
        id: "archive",
        label: "Arşiv",
        href: "/archive",
        icon: ArchiveIcon,
        moduleCode: "DOC",
        requiredPermission: "doc.document.view",
        description: "Kayda bağlı belgelerin tek pencere arşivi.",
      },
      {
        id: "support",
        label: "Destek",
        href: "/support",
        icon: LifeBuoyIcon,
        moduleCode: "SUP",
        requiredPermission: "sup.ticket.view",
        description: "İç destek talepleri ve yönlendirme.",
        primaryAction: "Destek talebi aç",
      },
    ],
  },
  {
    id: "administration",
    label: "Yönetim",
    icon: Settings2Icon,
    items: [
      {
        id: "master-data",
        label: "Tanımlar",
        href: "/master-data",
        icon: SlidersHorizontalIcon,
        moduleCode: "ADM",
        requiredPermission: "adm.master-data.view",
        description: "Merkezi tanımlar, kataloglar, çalışma takvimi ve döviz kurları.",
      },
      {
        id: "workflows",
        label: "İş Akışları",
        // The screen inventory's own address (SCR-195); the designer opens inside it.
        href: "/admin/workflows",
        icon: WorkflowIcon,
        moduleCode: "WFL",
        requiredPermission: "wfl.workflow.design",
        description: "Şirketin süreçleri: akışlar, sürümleri ve tasarımcı.",
      },
      {
        id: "users-roles",
        label: "Kullanıcılar & Roller",
        href: "/users-roles",
        icon: UsersIcon,
        moduleCode: "IAM",
        requiredPermission: "iam.module.manage",
        description: "Kullanıcılar, dinamik roller, vekâlet ve görünürlük ayarları.",
      },
      {
        id: "revision-requests",
        label: "Revizyon Talepleri",
        // The screen is the approval screen's second tab and lives there (SCR-192, D-223). The
        // entry pointed at a slug of its own until 2026-09-24, which no route serves: the menu
        // answered "henüz geliştirilmedi" for a screen that had been built weeks earlier.
        href: "/approvals/revision-requests",
        icon: FileClockIcon,
        moduleCode: "AUD",
        requiredPermission: "aud.revision-request.view",
        description: "Onaylı kayıtlar için değişiklik talepleri.",
      },
      {
        id: "audit-log",
        label: "Denetim Kayıtları",
        href: "/audit-log",
        icon: ShieldCheckIcon,
        moduleCode: "AUD",
        requiredPermission: "aud.audit-log.view",
        description: "Kimin ne zaman hangi kaydı değiştirdiğinin geçmişi.",
      },
      {
        id: "data-import",
        label: "Veri Aktarımı",
        href: "/data-import",
        icon: UploadIcon,
        moduleCode: "MIG",
        requiredPermission: "mig.import.manage",
        description: "Excel, eski panel ve Drive verilerinin aktarımı (ertelendi, DEF-001).",
      },
    ],
  },
];

/** Returns only permitted items and hides groups left without items (§40.1). */
export function getVisibleNavigation(
  groups: readonly NavigationGroup[],
  access: AccessPolicy,
  isModuleEnabled: (moduleCode: ModuleCode) => boolean = () => true,
): NavigationGroup[] {
  return groups
    .map((group) => ({
      ...group,
      // A module switched off in this environment is not in the menu (CONFIGURATION section 5).
      items: filterByPermission(group.items, access).filter((item) =>
        isModuleEnabled(item.moduleCode),
      ),
    }))
    .filter((group) => group.items.length > 0);
}

/**
 * Keeps only the given item ids. Lets a server component decide visibility and pass plain
 * ids to the client sidebar, because item icons cannot be serialized across that boundary.
 */
export function pickNavigationItems(
  groups: readonly NavigationGroup[],
  itemIds: readonly string[],
): NavigationGroup[] {
  const allowed = new Set(itemIds);
  return groups
    .map((group) => ({ ...group, items: group.items.filter((item) => allowed.has(item.id)) }))
    .filter((group) => group.items.length > 0);
}

/** Work layer first, then the groups in order — every destination the shell knows. */
export function allNavigationItems(
  groups: readonly NavigationGroup[] = navigationRegistry,
): NavigationItem[] {
  return [...workNavigation, ...groups.flatMap((group) => group.items)];
}

/** Searches the work layer as well, because "Onaylar" and "Görevler" left the group list. */
export function findNavigationItemByHref(
  groups: readonly NavigationGroup[],
  href: string,
): NavigationItem | undefined {
  return allNavigationItems(groups).find((item) => item.href === href);
}

/** The group a module belongs to; work-layer items have none. Used for the header path. */
export function findNavigationGroupOfItem(
  groups: readonly NavigationGroup[],
  itemId: string,
): NavigationGroup | undefined {
  return groups.find((group) => group.items.some((item) => item.id === itemId));
}
