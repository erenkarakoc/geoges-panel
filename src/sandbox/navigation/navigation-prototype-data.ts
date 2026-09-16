/**
 * Data for the navigation prototype (CHG-004, TASK-0031).
 *
 * Development-only sandbox (D-052): this file mirrors labels from
 * `src/platform/navigation/navigation-registry.ts` on purpose. The sandbox may not import the
 * platform layer (ESLint boundary), and the prototype must stay deletable as one folder.
 *
 * Sources: scope §2.5 (roles and visibility), §3 (cockpit), §4 (approval centre), §9 (site
 * module), §13 (approval cycle), §25 (tasks and notifications), §40.1 (menu grouping),
 * D-051 (Projeler, Talepler & Müşteriler), D-054…D-056 (rail, toolbar, "Bugün").
 */

import {
  ArchiveIcon,
  BarChart3Icon,
  BookOpenIcon,
  BoxesIcon,
  CalendarCheckIcon,
  ClipboardCheckIcon,
  ClipboardListIcon,
  FactoryIcon,
  FileClockIcon,
  FileSearchIcon,
  FileTextIcon,
  FolderKanbanIcon,
  GaugeIcon,
  HandshakeIcon,
  HardHatIcon,
  LandmarkIcon,
  LifeBuoyIcon,
  LightbulbIcon,
  ListChecksIcon,
  type LucideIcon,
  MapPinnedIcon,
  ScaleIcon,
  ShieldCheckIcon,
  ShoppingCartIcon,
  SlidersHorizontalIcon,
  TruckIcon,
  UploadIcon,
  UsersIcon,
  UsersRoundIcon,
} from "lucide-react";

export type ModuleEntry = { id: string; label: string };

export type RailGroup = {
  id: string;
  label: string;
  icon: LucideIcon;
  modules: readonly ModuleEntry[];
};

/** The six groups of §40.1, collapsed to one rail icon each (D-054). */
export const railGroups: readonly RailGroup[] = [
  {
    id: "overview",
    label: "Genel Bakış",
    icon: GaugeIcon,
    modules: [{ id: "cockpit", label: "Cockpit" }],
  },
  {
    id: "site-daily",
    label: "Şantiye & Günlük",
    icon: HardHatIcon,
    modules: [
      { id: "daily-site-logs", label: "Şantiye Kaydı" },
      { id: "approvals", label: "Onay" },
      { id: "projects", label: "Projeler" },
      { id: "sites", label: "Şantiyeler" },
      { id: "tasks", label: "Görevler" },
      { id: "insights", label: "Öneriler" },
      { id: "daily-reports", label: "Günlük Raporlar" },
    ],
  },
  {
    id: "resources-production",
    label: "Kaynak & Üretim",
    icon: BoxesIcon,
    modules: [
      { id: "inventory", label: "Stok" },
      { id: "purchasing", label: "Satın Alma" },
      { id: "equipment", label: "Ekipman" },
      { id: "factory", label: "Fabrika" },
    ],
  },
  {
    id: "commercial",
    label: "Ticari",
    icon: HandshakeIcon,
    modules: [
      { id: "leads-clients", label: "Talepler & Müşteriler" },
      { id: "quotes", label: "Teklif" },
      { id: "finance", label: "Finans" },
      { id: "period-close", label: "Dönem Kapanışı" },
    ],
  },
  {
    id: "corporate",
    label: "Kurumsal",
    icon: UsersRoundIcon,
    modules: [
      { id: "human-resources", label: "İK" },
      { id: "compliance", label: "Uyum" },
      { id: "quality-safety", label: "Kalite & İSG" },
      { id: "performance", label: "Performans" },
      { id: "meetings", label: "Toplantı & Karar" },
      { id: "archive", label: "Arşiv" },
      { id: "support", label: "Destek" },
    ],
  },
  {
    id: "administration",
    label: "Yönetim",
    icon: SlidersHorizontalIcon,
    modules: [
      { id: "master-data", label: "Tanımlar" },
      { id: "users-roles", label: "Kullanıcılar & Roller" },
      { id: "revision-requests", label: "Revizyon Talepleri" },
      { id: "audit-log", label: "Denetim Kayıtları" },
      { id: "data-import", label: "Veri Aktarımı" },
    ],
  },
];

/** Icons for the module rows inside a group flyout; keyed by module id. */
export const moduleIcons: Record<string, LucideIcon> = {
  approvals: ClipboardCheckIcon,
  archive: ArchiveIcon,
  "audit-log": ShieldCheckIcon,
  cockpit: GaugeIcon,
  compliance: ScaleIcon,
  "daily-reports": FileTextIcon,
  "daily-site-logs": ClipboardListIcon,
  "data-import": UploadIcon,
  equipment: TruckIcon,
  factory: FactoryIcon,
  finance: LandmarkIcon,
  "human-resources": UsersRoundIcon,
  insights: LightbulbIcon,
  inventory: BoxesIcon,
  "leads-clients": HandshakeIcon,
  "master-data": SlidersHorizontalIcon,
  meetings: BookOpenIcon,
  "period-close": CalendarCheckIcon,
  performance: BarChart3Icon,
  projects: FolderKanbanIcon,
  purchasing: ShoppingCartIcon,
  "quality-safety": HardHatIcon,
  quotes: FileSearchIcon,
  "revision-requests": FileClockIcon,
  sites: MapPinnedIcon,
  support: LifeBuoyIcon,
  tasks: ListChecksIcon,
  "users-roles": UsersIcon,
};

export type TodayCard = {
  id: string;
  title: string;
  value?: string;
  note: string;
  tone: "neutral" | "warning" | "danger" | "success";
};

export type QueueItem = {
  id: string;
  title: string;
  site: string;
  person: string;
  summary: readonly { label: string; value: string; flagged?: boolean }[];
};

export type RoleId = "owner" | "coordinator" | "site-engineer" | "crew-lead";

export type RolePersona = {
  id: RoleId;
  /** Role name as used in the scope and the presentation sandbox. */
  label: string;
  /** One line describing the working day this navigation has to serve. */
  dayLine: string;
  /** Rail groups this role sees, in order. Empty group list = group hidden (§40.1). */
  visibleGroupIds: readonly string[];
  /** Module ids the role may open; a group with none of them is hidden. */
  visibleModuleIds: readonly string[];
  /** Right zone of the toolbar: the one action this role repeats every day (D-055). */
  primaryAction: string;
  /** Left zone of the toolbar: what "where you are" means for this role. */
  contextLabel: string;
  contextOptions: readonly string[];
  approvalCount: number;
  taskCount: number;
  notificationCount: number;
  /** "Bugün" composition (D-056). */
  todayTitle: string;
  todayLead: string;
  todayCards: readonly TodayCard[];
  /** Shown under the cards: what the role is expected to do next. */
  todayNextStep: string;
};

const ownerCards: readonly TodayCard[] = [
  {
    id: "attention-overcast",
    title: "Hedefin üstünde döküm",
    note: "Kavaklı: proje hedefinin 42 panel üstüne çıkıldı, açıklama girilmemiş",
    tone: "danger",
  },
  {
    id: "attention-stale",
    title: "3 gündür kayıt yok",
    note: "Ilgaz şantiyesi son kaydı 13 Eylül",
    tone: "danger",
  },
  {
    id: "attention-cash",
    title: "Geciken tahsilat",
    value: "1.240.000 ₺",
    note: "2 hakedişin vadesi geçti",
    tone: "warning",
  },
  {
    id: "kpi-production",
    title: "Dünkü üretim",
    value: "318 panel",
    note: "Aylık toplam 5.940 panel",
    tone: "neutral",
  },
  {
    id: "kpi-profit",
    title: "Bu ay kâr-zarar",
    value: "+ 2.1 M₺",
    note: "4 aktif şantiye",
    tone: "success",
  },
];

const coordinatorCards: readonly TodayCard[] = [
  {
    id: "queue",
    title: "Onay kuyruğu",
    value: "12 kayıt",
    note: "En eskisi 2 gündür bekliyor",
    tone: "warning",
  },
  {
    id: "flagged",
    title: "Tutarsızlık işaretli",
    value: "3 kayıt",
    note: "Zayi fotoğrafı eksik, malzeme-üretim uyumsuz",
    tone: "danger",
  },
  {
    id: "missing-log",
    title: "Kaydı gelmeyen şantiye",
    value: "1",
    note: "Ilgaz — saha mühendisi bilgilendirildi",
    tone: "warning",
  },
];

const siteEngineerCards: readonly TodayCard[] = [
  {
    id: "today-log",
    title: "Bugünün kaydı",
    value: "Taslak",
    note: "Döküm ve puantaj girildi; montaj, zayi ve fotoğraf eksik",
    tone: "warning",
  },
  {
    id: "target",
    title: "Günlük hedef",
    value: "24 / 30 panel",
    note: "Hedefin 6 panel gerisinde",
    tone: "neutral",
  },
  {
    id: "stock",
    title: "Kritik stok",
    value: "Kalıp yağı",
    note: "2 günlük kaldı, talep açılmadı",
    tone: "danger",
  },
];

const crewLeadCards: readonly TodayCard[] = [
  {
    id: "today-work",
    title: "Bugünkü işiniz",
    value: "Montaj — 3. kademe",
    note: "Kavaklı, A blok duvarı",
    tone: "neutral",
  },
  {
    id: "confirm",
    title: "Onayınızı bekleyen",
    value: "Dünkü puantaj",
    note: "8 kişi, 9 saat — doğru değilse bildirin",
    tone: "warning",
  },
];

export const rolePersonas: readonly RolePersona[] = [
  {
    id: "owner",
    label: "Sahip",
    dayLine: "Şirketi uzaktan okur; kimse ondan veri gizleyemez (§2.4).",
    visibleGroupIds: railGroups.map((group) => group.id),
    visibleModuleIds: railGroups.flatMap((group) => group.modules.map((module) => module.id)),
    primaryAction: "Görev ver",
    contextLabel: "Tüm şirket",
    contextOptions: ["Tüm şirket", "Kavaklı Şantiyesi", "Ilgaz Şantiyesi", "Fabrika"],
    approvalCount: 2,
    taskCount: 4,
    notificationCount: 6,
    todayTitle: "Bugün",
    todayLead: "Önce dikkat gerektirenler, sonra rakamlar (§3.1–§3.3).",
    todayCards: ownerCards,
    todayNextStep: "Dikkat kartına dokunmak doğrudan kaynağına götürür; menüye uğramazsınız.",
  },
  {
    id: "coordinator",
    label: "Koordinatör",
    dayLine: "Günlük şantiye kaydını onaylar veya düzeltme ister (§13, D-035).",
    visibleGroupIds: ["site-daily", "resources-production", "corporate"],
    visibleModuleIds: [
      "daily-site-logs",
      "approvals",
      "projects",
      "sites",
      "tasks",
      "daily-reports",
      "inventory",
      "equipment",
      "quality-safety",
      "support",
    ],
    primaryAction: "Kuyruğa gir",
    contextLabel: "3 şantiye",
    contextOptions: ["3 şantiye", "Kavaklı Şantiyesi", "Ilgaz Şantiyesi", "Sarıyar Şantiyesi"],
    approvalCount: 12,
    taskCount: 3,
    notificationCount: 4,
    todayTitle: "Bugün",
    todayLead: "Gün, kuyruğu boşaltmakla geçer (§4).",
    todayCards: coordinatorCards,
    todayNextStep: "Kuyruk modu: onayladığınızda sıradaki kayıt kendiliğinden gelir.",
  },
  {
    id: "site-engineer",
    label: "Saha Mühendisi",
    dayLine: "Günün tek ana kaydını girer; ticari veri görmez (§2.5, §9.3).",
    visibleGroupIds: ["site-daily", "resources-production"],
    visibleModuleIds: ["daily-site-logs", "sites", "tasks", "inventory"],
    primaryAction: "Günü kaydet",
    contextLabel: "Kavaklı Şantiyesi",
    contextOptions: ["Kavaklı Şantiyesi"],
    approvalCount: 0,
    taskCount: 2,
    notificationCount: 2,
    todayTitle: "Bugün",
    todayLead: "Tek iş: bugünün kaydını tamamlayıp onaya göndermek (§9.6).",
    todayCards: siteEngineerCards,
    todayNextStep: "Kayıt adım adım doldurulur; taslak kendiliğinden saklanır.",
  },
  {
    id: "crew-lead",
    label: "Taşeron Ekip Başı",
    dayLine: "Yalnız kendi çalışmasıyla ilgili operasyonel bilgi (§2.5).",
    visibleGroupIds: ["site-daily"],
    visibleModuleIds: ["daily-site-logs", "tasks"],
    primaryAction: "Günü kaydet",
    contextLabel: "Kavaklı Şantiyesi",
    contextOptions: ["Kavaklı Şantiyesi"],
    approvalCount: 0,
    taskCount: 1,
    notificationCount: 1,
    todayTitle: "Bugün",
    todayLead: "Tek akış; modül diye bir kavramla karşılaşmaz.",
    todayCards: crewLeadCards,
    todayNextStep: "Ekran boşaldığında gün bitmiştir.",
  },
];

/** Approval queue used to demonstrate queue mode (OQ-027, item 1). */
const detailedQueue: readonly QueueItem[] = [
  {
    id: "log-kavakli-15",
    title: "15 Eylül günlük şantiye kaydı",
    site: "Kavaklı Şantiyesi",
    person: "M. Yılmaz — Saha Mühendisi",
    summary: [
      { label: "Döküm", value: "28 panel" },
      { label: "Montaj", value: "24 panel" },
      { label: "Zayi", value: "2 panel — fotoğraf yok", flagged: true },
      { label: "Puantaj", value: "9 kişi / 9 saat" },
    ],
  },
  {
    id: "log-ilgaz-15",
    title: "15 Eylül günlük şantiye kaydı",
    site: "Ilgaz Şantiyesi",
    person: "H. Demir — Saha Mühendisi",
    summary: [
      { label: "Döküm", value: "0 panel — işveren dolgusu bekleniyor" },
      { label: "Bekleme", value: "6 saat 20 dk", flagged: true },
      { label: "Puantaj", value: "6 kişi / 8 saat" },
    ],
  },
  {
    id: "expense-kavakli",
    title: "Saha harcaması onayı",
    site: "Kavaklı Şantiyesi",
    person: "M. Yılmaz — Saha Mühendisi",
    summary: [
      { label: "Tutar", value: "14.850 ₺" },
      { label: "Konu", value: "Kalıp yağı ve sarf" },
      { label: "Belge", value: "Fiş fotoğrafı eklendi" },
    ],
  },
];

/**
 * Filler entries so the queue is as long as the badge says. A role's badge count slices this
 * list, which keeps the counter, the badge and the empty state telling the same story.
 */
const fillerQueue: readonly QueueItem[] = [
  "Sarıyar Şantiyesi",
  "Ilgaz Şantiyesi",
  "Kavaklı Şantiyesi",
].flatMap((site, siteIndex) =>
  ["14 Eylül", "13 Eylül", "12 Eylül"].map((date, dateIndex) => ({
    id: `filler-${siteIndex}-${dateIndex}`,
    title: `${date} günlük şantiye kaydı`,
    site,
    person: "Örnek veri — saha mühendisi",
    summary: [
      { label: "Döküm", value: `${18 + dateIndex * 4} panel` },
      { label: "Montaj", value: `${16 + dateIndex * 3} panel` },
      { label: "Puantaj", value: "8 kişi / 9 saat" },
    ],
  })),
);

export const approvalQueue: readonly QueueItem[] = [...detailedQueue, ...fillerQueue];

/** Tabs of an open site — the conditional context row (D-055). */
export const siteContextTabs = [
  "Gün",
  "Döküm",
  "Montaj",
  "Şerit",
  "Puantaj",
  "Stok",
  "Belgeler",
] as const;

export const siteDates = ["13 Eyl", "14 Eyl", "15 Eyl", "16 Eyl"] as const;
