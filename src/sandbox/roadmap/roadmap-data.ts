/**
 * The roadmap presentation's content (D-299): what each phase is for, in the client's words, what
 * is done and what comes, and where in the panel a finished part can be tried. Sourced from
 * `ai/MASTER_ROADMAP.md`, `ai/TASKS.md` and the decisions; update it when those move.
 */

export type PhaseStatus = "done" | "partly" | "now" | "next";

export const STATUS_LABELS: Record<PhaseStatus, string> = {
  done: "Tamamlandı",
  next: "Sırada",
  now: "Şu an yapılıyor",
  partly: "Yapıldı, sahip incelemesi bekliyor",
};

export type Illustration =
  | "blueprint"
  | "foundation"
  | "flow"
  | "site"
  | "builder"
  | "stock"
  | "money"
  | "crane"
  | "handshake"
  | "shield"
  | "chart"
  | "assistant"
  | "rocket";

export type TryLink = { href: string; label: string; what: string };

export type Step = { title: string; text: string; done: boolean };

export type Phase = {
  id: string;
  number: string;
  title: string;
  status: PhaseStatus;
  /** One sentence: what this phase means for the people who will use the panel. */
  summary: string;
  illustration: Illustration;
  steps: readonly Step[];
  /** Where to try what is built; opened in a new tab. */
  tryIt?: readonly TryLink[];
  /** A small working sample on this page. */
  demo?: "roles" | "search" | "flow" | "target";
  /** One technical point worth telling the client, in plain words. */
  note?: string;
};

export const phases: readonly Phase[] = [
  {
    id: "design",
    number: "00–06",
    title: "Hazırlık ve tasarım",
    status: "done",
    illustration: "blueprint",
    summary:
      "Kod yazmadan önce ne yapılacağını, nasıl görüneceğini ve nasıl çalışacağını kağıda döktük; riskli noktaları küçük denemelerle sınadık.",
    steps: [
      {
        done: true,
        text: "26 modül, 438 gereksinim; her biri onaylı.",
        title: "İhtiyaçları topladık",
      },
      {
        done: true,
        text: "Bütün ekranlar, durumları ve telefon görünümü.",
        title: "Ekranları tasarladık",
      },
      { done: true, text: "Modüller, olaylar, yetki ve arama mimarisi.", title: "Mimariyi kurduk" },
      {
        done: true,
        text: "215 tablo; her satır yetkiye ve geçmişe bağlı.",
        title: "Veritabanını tasarladık",
      },
      {
        done: true,
        text: "Yerel çalışma, yedekleme ve kurtarma planı.",
        title: "Ortamları planladık",
      },
      { done: true, text: "17 teknik deneme; hepsi geçti.", title: "Riskleri sınadık" },
    ],
    note: "Bütün kararlar yazılı ve numaralı tutuluyor (şu an 299 karar). Bir şeyin neden öyle yapıldığı her zaman bulunabilir.",
  },
  {
    id: "foundation",
    number: "07",
    title: "Temel: giriş, yetki, kayıt, bildirim",
    status: "partly",
    illustration: "foundation",
    summary:
      "Her modülün üstüne oturacağı ortak zemin: kim girer, kim neyi görür, ne değiştiğinde iz kalır, kime haber gider.",
    steps: [
      {
        done: true,
        text: "Parola, telefonla ikinci doğrulama, kurtarma kodları, kilit.",
        title: "Güvenli giriş",
      },
      { done: true, text: "Rol, şantiye/proje kapsamı, vekâlet.", title: "Roller ve yetki" },
      { done: true, text: "Kim, ne zaman, neyi değiştirdi; silinemez.", title: "Denetim kaydı" },
      {
        done: true,
        text: "Görev verme, hatırlatma, telefona bildirim.",
        title: "Görevler ve bildirimler",
      },
      { done: true, text: "Tek kutudan her şeyi bulan Türkçe arama.", title: "Site içi arama" },
      { done: true, text: "Katalog, takvim, döviz kuru, belgeler.", title: "Tanımlar ve belgeler" },
      { done: true, text: "Panel telefona uygulama gibi kurulur.", title: "Telefona kurulum" },
    ],
    tryIt: [
      { href: "/today", label: "Bugün", what: "Rolünüze göre günün işleri ve göstergeler" },
      {
        href: "/tasks/new",
        label: "Görev ver",
        what: "Birine görev verin, zil simgesinde bildirimi görün",
      },
      {
        href: "/users-roles",
        label: "Kullanıcılar",
        what: "İkinci doğrulama durumu, oturumlar, sıfırlama",
      },
      {
        href: "/audit-log",
        label: "Denetim kaydı",
        what: "Son 14 günün kayıtları; kişiye ve türe göre süzün",
      },
    ],
    demo: "roles",
    note: "Yetki ekranda değil veritabanında uygulanır: görmemesi gereken bir satır, ekranda gizlenmez, ona hiç gelmez.",
  },
  {
    id: "workflow",
    number: "08",
    title: "İş akışı motoru ve tasarımcı",
    status: "partly",
    illustration: "flow",
    summary:
      "Onay zincirleri ve otomatik işler kodla değil, kutular ve oklarla çizilir; yönetim kimin onaylayacağını kendisi değiştirir.",
    steps: [
      {
        done: true,
        text: "14 adım türü: onay, koşul, görev, bekleme, bildirim…",
        title: "Akış motoru",
      },
      {
        done: true,
        text: "Kutular ve oklarla çizim; yayımlamadan önce deneme.",
        title: "Görsel tasarımcı",
      },
      {
        done: true,
        text: "Tek kayıt ekranı doldurur, karar verince sıradaki gelir.",
        title: "Onay kuyruğu",
      },
      { done: true, text: "8 iş sürecinin hazır şablonları (29 akış).", title: "Hazır şablonlar" },
      { done: true, text: "Her çalışmanın adım adım günlüğü.", title: "Çalışma günlüğü" },
    ],
    tryIt: [
      {
        href: "/admin/workflows",
        label: "Akışlar",
        what: "Bir akışı açın, adımlara tıklayın, soruları görün",
      },
      {
        href: "/admin/workflows/templates",
        label: "Şablonlar",
        what: "Hazır süreçleri kopyalayıp kendi akışınız yapın",
      },
      {
        href: "/approvals",
        label: "Onaylar",
        what: "Onayınızı bekleyen kayıtlar, neden size geldiği",
      },
      {
        href: "/admin/workflows/runs",
        label: "Çalışma günlüğü",
        what: "Hangi akış ne zaman çalıştı, nerede bekliyor",
      },
    ],
    demo: "flow",
    note: "Bir akış yayımlanmadan önce örnek bir kayıtla denenir; deneme hiçbir şey yazmaz, sadece ne olacağını gösterir.",
  },
  {
    id: "slice1",
    number: "09",
    title: "Projeler, şantiyeler, günlük saha kaydı",
    status: "now",
    illustration: "site",
    summary:
      "İlk gerçek iş dilimi: proje ve şantiyeler, duvar hedefleri, teknik ofis; ardından sahanın her günkü kaydı ve onayı.",
    steps: [
      {
        done: true,
        text: "Panel ve şerit tipleri, sarf reçeteleri, iş kalemleri.",
        title: "Üretim tanımları",
      },
      {
        done: true,
        text: "Her firma tek kart; işveren, tedarikçi, taşeron rolleri.",
        title: "Firma kartı",
      },
      { done: true, text: "Proje, şantiyeler, üç ayrı süre, aşamalar.", title: "Proje ve şantiye" },
      {
        done: true,
        text: "Hedef yalnız onaylı revizyonla değişir.",
        title: "Duvarlar, hedefler, revizyon",
      },
      { done: true, text: "Kalan iş ÷ kalan iş günü; tatile hedef yok.", title: "Günlük hedefler" },
      {
        done: true,
        text: "Geciken iş sorumlusuna görev olur; kim neyi karşılar.",
        title: "Teknik ofis, tedarik matrisi",
      },
      {
        done: false,
        text: "Döküm, montaj, puantaj, zayi, fotoğraf; onaya gider.",
        title: "Günlük saha kaydı",
      },
      {
        done: false,
        text: 'Şantiye detayı, "neden zarardayız", resmi günlük rapor.',
        title: "Kokpit ve rapor",
      },
    ],
    tryIt: [
      {
        href: "/projects",
        label: "Projeler",
        what: "Projeyi açın: duvarlar ve hedefler, revizyonlar, teknik ofis, tedarik matrisi",
      },
      {
        href: "/sites",
        label: "Şantiyeler",
        what: "Bir şantiyeyi açın, “Gün” bölümünde günün hedeflerini görün",
      },
      {
        href: "/leads-clients/parties",
        label: "Firmalar",
        what: "Firma ekleyin; benzer ad uyarısı, aynı vergi no reddi",
      },
      {
        href: "/admin/master-data/panel-types",
        label: "Panel tipleri",
        what: "Tip ekleyin; m² kendiliğinden hesaplanır",
      },
    ],
    demo: "target",
    note: "Geçmiş yeniden yazılmaz: hedefler ve tedarik matrisi tarihli tutulur; bir değişiklik yalnız o günden sonrasını etkiler.",
  },
  {
    id: "builder",
    number: "09R",
    title: "Kendi kayıt türünüzü tanımlayın",
    status: "next",
    illustration: "builder",
    summary:
      "Yeni bir form ya da kayıt türü gerektiğinde yazılımcı beklemeden, alanları seçerek tanımlanır.",
    steps: [
      { done: false, text: "Alanlar, ilişkiler, ekran düzeni.", title: "Kayıt türü oluşturucu" },
      { done: false, text: "Aramada, raporda, akışta kullanılır.", title: "Her yerde kullanılır" },
    ],
  },
  {
    id: "slice2",
    number: "10",
    title: "Stok, kantar, satın alma, fabrika",
    status: "next",
    illustration: "stock",
    summary:
      "Malzemenin kantardan girişinden fabrikada panele dönüşüp şantiyeye çıkışına kadar izi.",
    steps: [
      { done: false, text: "Tartım, sevkiyat, stok hareketi, sayım.", title: "Kantar ve stok" },
      { done: false, text: "Talep, sipariş, tedarikçi.", title: "Satın alma" },
      { done: false, text: "Günlük üretim ve birim maliyet.", title: "Fabrika" },
    ],
  },
  {
    id: "slice3",
    number: "11",
    title: "Hakediş, finans, dönem kapanışı",
    status: "next",
    illustration: "money",
    summary: "İşveren ve taşeron hakedişleri, cari hesaplar, nakit akışı tahmini, döviz.",
    steps: [
      { done: false, text: "İşveren ve taşeron hakedişleri.", title: "Hakedişler" },
      { done: false, text: "Cari, nakit projeksiyonu, dönem kapanışı.", title: "Finans" },
    ],
  },
  {
    id: "slice4",
    number: "12",
    title: "Ekipman, vinç, personel, puantaj",
    status: "next",
    illustration: "crane",
    summary: "Makinelerin yeri ve bakımı, vinç günlüğü; personel dosyası, puantaj, bordro, izin.",
    steps: [
      { done: false, text: "Demirbaş, transfer, bakım, vinç günlüğü.", title: "Ekipman" },
      { done: false, text: "Özlük, puantaj, bordro, izin.", title: "İnsan kaynakları" },
    ],
  },
  {
    id: "slice5",
    number: "13",
    title: "Müşteri, teklif, ürün satışı",
    status: "next",
    illustration: "handshake",
    summary: "Talep ve görüşmeler, ihale, marjlı teklif ve PDF teklif belgesi.",
    steps: [
      { done: false, text: "Talep, görüşme, müşteri karnesi.", title: "Müşteri ilişkileri" },
      { done: false, text: "Teklif, marj, belge şablonu.", title: "Teklif" },
    ],
  },
  {
    id: "slice6",
    number: "14",
    title: "Sözleşme, kalite, İSG, toplantı",
    status: "next",
    illustration: "shield",
    summary: "Sözleşme yükümlülükleri, sertifikalar, iş güvenliği olayları, toplantı kararları.",
    steps: [
      { done: false, text: "Şartlar, yükümlülükler, gecikme kanıtı.", title: "Sözleşme ve uyum" },
      { done: false, text: "Uygunsuzluk, İSG, toplantı ve destek.", title: "Kalite ve İSG" },
    ],
  },
  {
    id: "slice7",
    number: "15",
    title: "Arşiv, rapor, performans, strateji",
    status: "next",
    illustration: "chart",
    summary: "Önceki dilimlerin verisinden raporlar, performans ve prim, bütçe ve yatırım analizi.",
    steps: [
      { done: false, text: "Tek pencereden arşiv, belge içinde arama.", title: "Arşiv" },
      {
        done: false,
        text: "Raporlar, performans, bütçe, sağlık karnesi.",
        title: "Rapor ve strateji",
      },
    ],
  },
  {
    id: "assistant",
    number: "15M",
    title: "Panele kendi cümlenizle sorun",
    status: "next",
    illustration: "assistant",
    summary:
      "Yönetim bir yapay zekâ asistanından panele soru sorar; yalnız kendi yetkisindeki cevabı alır.",
    steps: [{ done: false, text: "Okuma ve yalnız taslak hazırlama.", title: "Güvenli bağlantı" }],
  },
  {
    id: "rollout",
    number: "19",
    title: "Canlıya geçiş",
    status: "next",
    illustration: "rocket",
    summary:
      "Kendi sunucumuza taşıma, güvenlik ve yük incelemesi, yedekten geri dönme tatbikatı, eğitim.",
    steps: [
      { done: false, text: "Yedek, güvenlik, eğitim, geçiş planı.", title: "Hazırlık ve geçiş" },
    ],
  },
];

/** For the role demo: what three seats see on "Bugün" (sample, as the panel's own seats do). */
export const roleCards = [
  { card: "Günün işleri", roles: ["owner", "coordinator", "engineer"] },
  { card: "Onay kuyruğu", roles: ["owner", "coordinator"] },
  { card: "Aylık kâr-zarar", roles: ["owner"] },
  { card: "Sözleşme bedeli", roles: ["owner"] },
  { card: "Günün saha kaydı", roles: ["engineer", "coordinator"] },
  { card: "Kapsamındaki şantiyeler", roles: ["coordinator", "engineer"] },
] as const;

export const ROLE_LABELS = {
  coordinator: "Koordinatör",
  engineer: "Saha mühendisi",
  owner: "Sahip",
} as const;

/** For the search demo: what the palette would find, with Turkish letters written loosely. */
export const searchSamples = [
  "Görevler",
  "Günlük saha kaydı",
  "Kavaklı Şantiyesi",
  "Örnek Karayolları Bölge Müdürlüğü",
  "Şerit tipleri",
  "İş akışları",
  "Onaylar",
  "Çalışma günlüğü",
  "Ilgaz Şantiyesi",
  "Proje revizyonu onayı",
];
