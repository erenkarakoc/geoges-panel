/**
 * Content of the development-only presentation (D-052). Everything here is copied from project
 * records, so update it when they change:
 * - modules, dependencies, events: docs/architecture/MODULE_MAP.md
 * - flows: functional scope §45
 * - roles and visibility: functional scope §2 (facts only; the rest is decided in Phase 01)
 * - approval cycle: functional scope §9, §13 and decisions D-035…D-040
 */

export type GroupId = "platform" | "operations" | "commercial" | "corporate" | "analysis";

export type DataClassId = "operational" | "commercial" | "sensitive";

export type ModuleInfo = {
  code: string;
  name: string;
  summary: string;
  group: GroupId;
  /**
   * Which classes of data the module carries. This is the one field on this page that the records
   * do not state outright; it is read off each module's purpose so the roles panel can work out
   * who may see it from the visibility rules that *are* recorded (§2.4, §2.5). Marked as a
   * proposal in the UI and settled in Phase 01 with the permission matrix.
   */
  data: readonly DataClassId[];
  deferred?: boolean;
};

export type ModuleGroup = { id: GroupId; name: string; note: string };

export const moduleGroups: readonly ModuleGroup[] = [
  { id: "platform", name: "Platform", note: "Tüm iş modüllerinin üzerine kurulduğu ortak katman" },
  { id: "operations", name: "Operasyon", note: "Proje, şantiye, stok ve üretim" },
  { id: "commercial", name: "Ticari & Finans", note: "Talepten tahsilata" },
  { id: "corporate", name: "Kurumsal", note: "İnsan, uyum, kalite ve iç işleyiş" },
  { id: "analysis", name: "Analiz & Yönetim", note: "Rapor, performans ve karar desteği" },
];

export const modules: readonly ModuleInfo[] = [
  {
    code: "IAM",
    name: "Kimlik & Yetki",
    summary: "Kullanıcı, dinamik rol, vekâlet, 2FA",
    group: "platform",
    data: ["operational"],
  },
  {
    code: "AUD",
    name: "Denetim & Geçmiş",
    summary: "Değişiklik geçmişi, revizyon talepleri",
    group: "platform",
    data: ["operational"],
  },
  {
    code: "DOC",
    name: "Belgeler & Arşiv",
    summary: "Kayda bağlı belgeler, tek pencere arşiv",
    group: "platform",
    data: ["operational"],
  },
  {
    code: "WFL",
    name: "İş Akışı & Onay",
    summary: "Görsel akış motoru, onay merkezi, kurallar",
    group: "platform",
    data: ["operational"],
  },
  {
    code: "TSK",
    name: "Görevler & Bildirim",
    summary: "Görev, bildirim, eskalasyon",
    group: "platform",
    data: ["operational"],
  },
  {
    code: "ADM",
    name: "Tanımlar & Ayarlar",
    summary: "Kataloglar, takvim, döviz kuru",
    group: "platform",
    data: ["operational"],
  },
  {
    code: "PRJ",
    name: "Projeler",
    summary: "Proje kartı, duvarlar, iş programı",
    group: "operations",
    data: ["operational", "commercial"],
  },
  {
    code: "SIT",
    name: "Şantiye",
    summary: "Günlük kayıt, döküm, montaj, zayi",
    group: "operations",
    data: ["operational"],
  },
  {
    code: "INV",
    name: "Stok",
    summary: "Lokasyonlu stok defteri, kantar, sayım",
    group: "operations",
    data: ["operational"],
  },
  {
    code: "PUR",
    name: "Satın Alma",
    summary: "Tedarikçi, sipariş, satın alma talebi",
    group: "operations",
    data: ["operational", "commercial"],
  },
  {
    code: "FAC",
    name: "Fabrika",
    summary: "Şerit ve lug üretimi, birim maliyet",
    group: "operations",
    data: ["operational"],
  },
  {
    code: "EQP",
    name: "Ekipman & Araç",
    summary: "Demirbaş, vinç, bakım, zimmet",
    group: "operations",
    data: ["operational"],
  },
  {
    code: "CRM",
    name: "Talepler & Müşteriler",
    summary: "Talep günlüğü, işveren karnesi, ihale",
    group: "commercial",
    data: ["commercial"],
  },
  {
    code: "QTE",
    name: "Teklif & Satış",
    summary: "Teklif, marj, ürün satışı",
    group: "commercial",
    data: ["commercial"],
  },
  {
    code: "FIN",
    name: "Finans",
    summary: "Hakediş, cari, nakit, dönem kapanışı",
    group: "commercial",
    data: ["commercial"],
  },
  {
    code: "HR",
    name: "İnsan Kaynakları",
    summary: "Personel, puantaj, bordro, izin",
    group: "corporate",
    data: ["operational", "sensitive"],
  },
  {
    code: "CMP",
    name: "Sözleşme & Uyum",
    summary: "Yükümlülük, teminat, süreli belge",
    group: "corporate",
    data: ["commercial"],
  },
  {
    code: "QHS",
    name: "Kalite & İSG",
    summary: "Sertifika, DÖF, İSG olayı",
    group: "corporate",
    data: ["operational"],
  },
  {
    code: "MTG",
    name: "Toplantı & Karar",
    summary: "Karar kaydı ve takibi",
    group: "corporate",
    data: ["operational"],
  },
  {
    code: "SUP",
    name: "İç Destek",
    summary: "Destek talepleri, yönlendirme",
    group: "corporate",
    data: ["operational"],
  },
  {
    code: "RPT",
    name: "Rapor & Cockpit",
    summary: "Sahip cockpit'i, şantiye tanı, raporlar",
    group: "analysis",
    data: ["operational", "commercial"],
  },
  {
    code: "PRF",
    name: "Performans",
    summary: "KPI, sıralama, hedef ve prim",
    group: "analysis",
    data: ["operational", "sensitive"],
  },
  {
    code: "INT",
    name: "Öneriler",
    summary: "Öneri, hızlandırma, kaynak optimizasyonu",
    group: "analysis",
    data: ["operational"],
  },
  {
    code: "STR",
    name: "Strateji",
    summary: "Bütçe, yatırım, what-if, sağlık karnesi",
    group: "analysis",
    data: ["commercial"],
  },
  {
    code: "MIG",
    name: "Veri Aktarımı",
    summary: "Excel ve Drive aktarımı (ertelendi)",
    group: "analysis",
    data: ["operational"],
    deferred: true,
  },
];

/** "from depends on / reads to" (MODULE_MAP dependency graph; platform links omitted). */
export const dependencies: readonly (readonly [from: string, to: string])[] = [
  ["SIT", "PRJ"],
  ["PUR", "ADM"],
  ["INV", "PRJ"],
  ["INV", "PUR"],
  ["FAC", "INV"],
  ["EQP", "PRJ"],
  ["FIN", "SIT"],
  ["FIN", "INV"],
  ["FIN", "EQP"],
  ["FIN", "PUR"],
  ["FIN", "HR"],
  ["HR", "SIT"],
  ["HR", "EQP"],
  ["QTE", "CRM"],
  ["QTE", "FAC"],
  ["CMP", "PRJ"],
  ["CMP", "SIT"],
  ["CMP", "HR"],
  ["QHS", "INV"],
  ["QHS", "HR"],
  ["MTG", "TSK"],
  ["SUP", "TSK"],
  ["RPT", "SIT"],
  ["RPT", "FIN"],
  ["RPT", "INV"],
  ["RPT", "EQP"],
  ["PRF", "SIT"],
  ["PRF", "FIN"],
  ["PRF", "QTE"],
  ["PRF", "QHS"],
  ["INT", "RPT"],
  ["INT", "PRF"],
  ["STR", "FIN"],
  ["STR", "INT"],
  ["MIG", "INV"],
  ["MIG", "HR"],
  ["MIG", "DOC"],
];

export type DomainEvent = {
  name: string;
  label: string;
  publisher: string;
  reactors: readonly string[];
};

export const domainEvents: readonly DomainEvent[] = [
  {
    name: "daily_site_log.approved",
    label: "Günlük kayıt onaylandı",
    publisher: "SIT",
    reactors: ["INV", "FIN", "HR", "PRF", "RPT"],
  },
  {
    name: "stock_movement.recorded",
    label: "Stok hareketi kaydedildi",
    publisher: "INV",
    reactors: ["FIN", "RPT", "INT"],
  },
  {
    name: "progress_payment.approved_by_client",
    label: "Hakediş işverence onaylandı",
    publisher: "FIN",
    reactors: ["TSK", "WFL"],
  },
  {
    name: "employee.offboarding_started",
    label: "Personel çıkışı başladı",
    publisher: "HR",
    reactors: ["CMP", "EQP"],
  },
  { name: "quote.won", label: "Teklif kazanıldı", publisher: "QTE", reactors: ["PRJ", "CMP"] },
  {
    name: "meeting_decision.created",
    label: "Toplantı kararı alındı",
    publisher: "MTG",
    reactors: ["TSK"],
  },
  {
    name: "certificate.expiring",
    label: "Sertifika süresi yaklaşıyor",
    publisher: "QHS",
    reactors: ["TSK"],
  },
  { name: "period.closed", label: "Dönem kapandı", publisher: "FIN", reactors: ["RPT"] },
];

export type BusinessFlow = {
  id: string;
  title: string;
  /** What the flow actually accomplishes, in one sentence — a summary of its own recorded steps. */
  purpose: string;
  section: string;
  modules: readonly string[];
  steps: readonly string[];
};

export const businessFlows: readonly BusinessFlow[] = [
  {
    id: "lead-to-collection",
    title: "Yeni işten tahsilata",
    purpose:
      "Bir müşteri talebini sözleşmeye, üretime, hakedişe ve sonunda tahsil edilmiş paraya çevirir; tahmin edilen kârla gerçekleşeni karşılaştırarak kapanır.",
    section: "§45.1",
    modules: ["CRM", "QTE", "CMP", "PRJ", "SIT", "FIN"],
    steps: [
      "Talep gelir",
      "Satış kaydına düşer",
      "Yaklaşık miktar",
      "Teklif ve marj",
      "Pazarlık",
      "Teklif kazanılır",
      "Sözleşme ve yükümlülükler",
      "Kurum onayları",
      "Proje ve şantiye açılır",
      "Günlük üretim onaylanır",
      "Üretim hakedişe akar",
      "Hakediş onaylanır",
      "Fatura görevi",
      "Fatura kesilir",
      "Tahsilat girilir",
      "Cari bakiye azalır",
      "Kâr-zarar güncellenir",
      "Tahmin ile gerçek karşılaştırılır",
    ],
  },
  {
    id: "steel-strip",
    title: "Çelik şerit: siparişten sahaya",
    purpose:
      "Projenin çelik şerit ihtiyacını siparişten fabrika işlemesine, galvanizden şantiye teslimine kadar izler; her aşamada fireyi hesaplar ve saha stoğunu güncel tutar.",
    section: "§45.2",
    modules: ["PUR", "FAC", "INV", "SIT"],
    steps: [
      "Proje ihtiyacı",
      "Haddeci fiyat/termin karşılaştırma",
      "Sipariş",
      "Fabrikaya giriş",
      "Delme / işleme",
      "Fire hesabı",
      "Galvanize sevk",
      "Galvaniz dönüşü",
      "Fark / fire kontrolü",
      "Şantiyeye sevk",
      "Şantiye teslim alır",
      "Stok artar",
      "Montajda kullanılır",
      "Saha stoğu azalır",
      "Kritik stok uyarısı",
    ],
  },
  {
    id: "daily-production",
    title: "Günlük saha üretimi",
    purpose:
      "Sahadaki tek bir günlük kaydı onaydan geçirip üretim, stok, hakediş, puantaj ve performans kayıtlarına aynı anda yansıtır.",
    section: "§45.3",
    modules: ["SIT", "WFL", "INV", "FIN", "PRF", "RPT"],
    steps: [
      "Günlük kayıt açılır",
      "Döküm, montaj, şerit, saatler",
      "Teslim-tesellüm saatleri",
      "Puantaj ve faaliyet",
      "Zayi: foto + neden",
      "Harcama: belge",
      "Sarf tüketimi önerilir",
      "Koordinatöre gönderilir",
      "Çapraz kontrol",
      "Düzeltme veya onay",
      "Veri tüm modüllere dağılır",
    ],
  },
  {
    id: "offboarding",
    title: "Personel çıkışı",
    purpose:
      "Ayrılan bir çalışanın zimmet, yetki, belge ve bordro işlerini tek sırada toplayıp hiçbiri atlanmadan çıkışını tamamlar.",
    section: "§45.4",
    modules: ["HR", "EQP", "CMP"],
    steps: [
      "Ayrılacak olarak işaretlenir",
      "Çıkış checklist'i",
      "İmzalı evraklar",
      "Zimmet kontrolü",
      "Eksik zimmet uyarısı",
      "Sözleşme / teminat evrakı",
      "Çıkış tamamlanır",
    ],
  },
  {
    id: "client-delay",
    title: "İşveren gecikmesi",
    purpose:
      "İşveren kaynaklı gecikmeyi anı anına kayda geçirip fotoğraf ve tutanakla belgeler; hak talebi gerektiğinde kullanılacak kanıt dosyasını oluşturur.",
    section: "§45.5",
    modules: ["SIT", "RPT", "CMP"],
    steps: [
      "Alan dolguya teslim",
      "Teslim saati",
      "İşveren geciktirir",
      "Geri teslim saati",
      "Gecikme hesaplanır",
      "Şantiye tanı ekranında görünür",
      "Maliyet etkisi",
      "Sözleşme yükümlülüğüne bağlanır",
      "Kanıt dosyası",
    ],
  },
  {
    id: "meeting-decision",
    title: "Toplantı kararından göreve",
    purpose:
      "Toplantıda alınan kararı kayda bağlar, sorumluya görev olarak düşürür ve iş bitene kadar takibini sürdürür.",
    section: "§45.6",
    modules: ["MTG", "TSK"],
    steps: [
      "Toplantı kaydı",
      "Karar yazılır",
      "Sorumlu atanır",
      "Son tarih",
      "Görev otomatik oluşur",
      "Bildirim",
      "Hatırlatma",
      "Gecikirse üst yönetime",
      "Görev ve karar kapanır",
    ],
  },
  {
    id: "certificate-ohs",
    title: "Kritik sertifika / İSG olayı",
    purpose:
      "Süresi dolan belgeyi veya açılan İSG olayını yakalar, sorumluya görev üretir ve kapanışını denetim kaydıyla birlikte tutar.",
    section: "§45.7",
    modules: ["QHS", "TSK", "RPT"],
    steps: [
      "Süre yaklaşır veya olay açılır",
      "Sorumluya görev",
      "Süre ve aksiyon takibi",
      "Cockpit “Dikkat” bölümü",
      "Tamamlanınca kapanır",
    ],
  },
  {
    id: "cash-squeeze",
    title: "Nakit sıkışması",
    purpose:
      "Beklenen tahsilatlarla yaklaşan ödemeleri karşılaştırıp nakit sıkışmasını önceden görür ve sorumluya aksiyon görevi açar.",
    section: "§45.8",
    modules: ["FIN", "INT", "TSK"],
    steps: [
      "Beklenen tahsilatlar",
      "Gelecek ödemeler",
      "8 haftalık nakit çizelgesinde açık",
      "Yönetime uyarı",
      "Hızlandırma önerileri",
      "Sorumluya görev",
    ],
  },
];

export type Visibility = "yes" | "no" | "open";

export const dataClasses = [
  { id: "operational", name: "Operasyonel", example: "üretim, hedef, stok ihtiyacı, görev" },
  { id: "commercial", name: "Ticari", example: "kâr marjı, teklif fiyatı, maliyet" },
  { id: "sensitive", name: "Hassas kişisel", example: "maaş, SGK, IBAN" },
] as const;

export type RoleInfo = {
  name: string;
  source: string;
  note: string;
  visibility: Record<(typeof dataClasses)[number]["id"], Visibility>;
};

export const roles: readonly RoleInfo[] = [
  {
    name: "Sahip",
    source: "§2.4",
    note: "Tüm şirket verisi; hiç kimse görünürlüğünü kısıtlayamaz",
    visibility: { operational: "yes", commercial: "yes", sensitive: "yes" },
  },
  {
    name: "Genel Müdür",
    source: "§2.4",
    note: "Şirketi yönetir; sahipten veri gizleyemez",
    visibility: { operational: "open", commercial: "open", sensitive: "open" },
  },
  {
    name: "Koordinatör",
    source: "§13, D-035",
    note: "Günlük saha kaydını onaylar veya düzeltme ister",
    visibility: { operational: "yes", commercial: "open", sensitive: "open" },
  },
  {
    name: "Saha Mühendisi / Formen",
    source: "§2.5",
    note: "Kendi şantiyesinin üretimi, hedefi, stok ihtiyacı ve görevleri",
    visibility: { operational: "yes", commercial: "no", sensitive: "no" },
  },
  {
    name: "İSG Sorumlusu",
    source: "§2.5",
    note: "Kazadaki çalışanın adını görür; maaş, SGK, IBAN görmez",
    visibility: { operational: "yes", commercial: "open", sensitive: "no" },
  },
  {
    name: "Taşeron Ekip Başı",
    source: "§2.5",
    note: "Yalnız kendi çalışmasıyla ilgili operasyonel bilgi",
    visibility: { operational: "yes", commercial: "no", sensitive: "no" },
  },
];

export const otherRoles = ["Teknik Ofis", "İK", "Muhasebe", "Fabrika", "Vinç Operatörü", "Satış"];

export const roleConcepts = [
  {
    title: "Dinamik roller",
    text: "Roller sabit değil; yeni rol eklenir, seviyesi değiştirilir",
    source: "§2.1",
  },
  {
    title: "Çoklu rol",
    text: "Bir kişi birden fazla role sahip olabilir, işlemi hangi rolle yaptığını seçer",
    source: "§2.2",
  },
  {
    title: "Vekâlet",
    text: "Süreli vekil atanır; süre bitince yetki kendiliğinden kalkar",
    source: "§2.3, D-040",
  },
  {
    title: "Görev ayrılığı",
    text: "Kritik işlemi hazırlayan aynı işlemi tek başına onaylayamaz",
    source: "§2.6",
  },
];

export const dailyLogReflections = [
  "Şantiye ilerlemesi",
  "Stok tüketimi",
  "Hakediş",
  "Taşeron hakedişi",
  "Puantaj",
  "Performans",
  "Kâr-zarar",
  "Cockpit",
];
