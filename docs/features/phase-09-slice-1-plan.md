# Faz 09 — Dilim 1 Planı: Projeler, Şantiyeler, Günlük Saha Kaydı

Durum: ONAYLANDI (D-291, sahip 2026-09-25) · Tarih: 2026-09-25 · Faz: Phase 09 · Bağlı: `ai/MASTER_ROADMAP.md`,
`docs/requirements/REQ-PRJ.md`, `REQ-SIT.md`, `REQ-RPT.md`, `REQ-ADM.md`,
`docs/database/SCHEMA-OPERATIONS.md`, `docs/ui-ux/screens/SCR-021-daily-site-log.md`

Bu belge Faz 09'un keşif ve planlama adımıdır (PROJECT_RULES §2, §3, §10). Dilimin **ne yapacağı**
gereksinimlerde yazılı ve hepsi CONFIRMED (PRJ 11, SIT 35, RPT 23, ADM 15 gereksinim); şeması
(`SCHEMA-OPERATIONS.md`) ve ana ekranı (SCR-021) da onaylı. Burada yazılan şey **hangi sırayla, hangi
parçalarla ve neye karşı kabul edileceği**.

## 1. Soru turu — sonuç (2026-09-25)

| Konu | Sahibin kararı | Kayıt |
|---|---|---|
| Günlük kaydın başka modüllere dayanan bölümleri (puantaj → personel, tüketim → malzeme, ekipman → varlık, proje kartı → işveren firma) | **Tam hâlleriyle kurulur, sırayla.** Her ana kart kendi modülünde, kendi gereksinimindeki bütün alanlarıyla kurulur; günlük kaydın o bölümü, kartı hazır olunca gelir | D-287, OQ-041 |
| Hava bilgisi servisi | Open-Meteo; gelmezse elle girilir | D-288, OQ-042 |
| Resmi günlük raporun e-postayla gönderilmesi | Bu dilimde rapor üretilir ve indirilir, "gönderildi" işareti tutulur; e-postayla gönderme, e-posta sağlayıcısı seçildiğinde (OQ-015) gelir | D-289, OQ-043 |
| Pilot şantiye ve pilot kullanıcılar | **Tamamen örnekle.** Pilot şantiye ve kişiler örnek veridir; D-216'nın "sahip adlandırır" çıkış şartı bu dilim için örnek tanımla karşılanır | D-290, OQ-044 |

**"Tam hâli" nereye kadar (D-287'nin okunuşu).** Kartın **kendisi** tamdır: gereksinimindeki bütün
alanlar, veri sınıfları (maaş, SGK, IBAN hassas; satın alma bedeli ticari), tekillik kuralları,
tarihli birim değişikliği ve kartın kendi uyarıları. Kartın **arkasındaki süreçler** kendi
dilimlerinde kalır: bordro, izin ve zimmet süreçleri (Faz 12), stok hareketleri ve bakiyeler (Faz
10), amortisman, transfer ve bakım (Faz 12), cari hesap (Faz 11). Kartın o süreçleri gösteren
sekmeleri bu dilimde yerini alır ve "bu bölüm kendi dilimiyle gelir" der — boş bir sekme değil,
açıklamalı bir sekme. Bu, sahibin kararını yol haritasına çevirme biçimidir; yanlış okunduysa ilk
iş düzeltilir.

**Soru çıkmayan konular**, çünkü kaydı var ve CONFIRMED: günlük kaydın yapısı ve kuralları
(REQ-SIT-002…035), iki görünümlü giriş ekranı (SCR-021, D-220), proje revizyonuyla değişen hedefler
(D-136), günlük hedeflerin hesabı (D-137), şantiyenin tek projeye bağlılığı (D-138), fazla döküm
kuralları (D-121), geç giriş (D-122), sarf önerisi (D-123), teslim-tesellüm kanıtı (D-124), taşeron
işçileri (D-125). Giriş süresi, eşikler ve uyarı alıcıları yönetimin ayarıdır (Tanımlar ve akış);
varsayılan değeri sorulmaz.

**"Niye zarardayız?" kartı** (REQ-RPT-013) bu dilimde kurulur, ama parasal etkenlerin çoğu (malzeme,
işçilik, amortisman, kira) maliyeti üreten dilimlerle gelir. Gereksinimin kendi kuralı burada
uygulanır: hesaplanamayan etken **"hesaplanamadı"** der, sıfır göstermez. Bekleme saati, zayi ve
hedefin altında ilerleme gibi parasal olmayan etkenler ilk günden gerçektir.

## 2. Sıra ve görevler

| Sıra | Görev | Ne | Neden bu sırada |
|---|---|---|---|
| 1 | TASK-0121 | Üretim tanımları: panel tipleri, şerit tipleri, sarf reçeteleri, diğer iş kalemleri, "çalışma yok" nedenleri (REQ-ADM-002…005, REQ-SIT-010) | Döküm, montaj, şerit ve tüketim satırları bunlardan kurulur |
| 2 | TASK-0122 | Firma kartı `crm.party` — işveren, tedarikçi, taşeron, kiralayan rolleriyle (tam kart) | Proje kartı işvereni, taşeron şantiyesi taşeronu ister |
| 3 | TASK-0123 | Projeler, şantiyeler, duvarlar, proje revizyonları ve hedefler, üç süre, günlük hedefler, teknik ofis işleri, tedarik matrisi (REQ-PRJ-001…011) | Günlük kayıt bir şantiyeye ve o günün revizyonuna yazılır |
| 4 | TASK-0124 | Personel kartı `hr.employee` — hassas alanlar, tarihli birim, süreli belgeler (REQ-HR-001…003, tam kart) | Puantaj bölümü personel ister |
| 5 | TASK-0125 | Malzeme kataloğu ve lokasyonlar `inv.material`, `inv.location` (REQ-INV-001…002'nin kart kısmı) | Tüketim bölümü malzeme ister |
| 6 | TASK-0126 | Varlık kartı `eqp.asset` — kategoriler, grup eşyası, kendi malı/kiralık (REQ-EQP-001…004, tam kart) | Ekipman bölümü varlık ister |
| 7 | TASK-0127 | **Günlük saha kaydı** (REQ-SIT-002…035, SCR-021): taslak, bölüm bölüm giriş, onaya gönderme, geri çekme, geç giriş, "çalışma yok", Faz 08'in günlük kayıt onayı akışıyla bağlantı, onaylı kaydın kilidi ve revizyon talebi, `daily_site_log.*` olayları | Dilimin kalbi; 1–6 hazır olunca bütün bölümleriyle gelir |
| 8 | TASK-0128 | Şantiye ekranı ve şantiye detayı (REQ-SIT-001, REQ-RPT-012…014): göstergeler, son günler ve eksik günler, "Niye zarardayız?" | Günlük kaydın onaylı verisini okur |
| 9 | TASK-0129 | Resmi günlük saha raporu (REQ-RPT-020…022): onaydan sonra PDF, arşive, sürümlü; indirme ve "gönderildi" işareti | Onaylı kayıttan üretilir |
| 10 | TASK-0130 | "Bugün"ün şantiye göstergeleri gerçek veriye bağlanır (REQ-RPT-001…009'un bu dilime düşen kısmı); ticari göstergeler kendi dilimine kadar "örnek" etiketiyle | Yönetimin giriş ekranı dilimin çıktısını göstermeli |
| 11 | TASK-0131 | Pilot için örnek veri: örnek projeler, şantiyeler, duvarlar, kişiler, bir haftalık günlük kayıt geçmişi (D-290) | Pilot ve sizin turunuz bunun üstünde yapılır |

Her T1/T2 görev kendi uygulama planını, sıra kendisine geldiğinde alır (PROJECT_RULES §10) — bu
belge sırayı ve sınırları sabitler, ayrıntıyı bugünden varsaymaz.

## 3. Sınırlar

- **Onaylanan günlük verinin dağılması** (REQ-SIT-032) olayla olur: `daily_site_log.approved`
  yayımlanır, tüketici modüller (stok, puantaj, hakediş, kâr-zarar) kendi dilimlerinde abone olur.
  Bu dilimde abonesi olanlar ilerleme (PRJ), şantiye detayı ve "Bugün"dür.
- **Kayıt türleri oluşturucusu** (Faz 09R) bu dilimde değildir; PRJ ve SIT tabloları kodda kurulur.
- **Barındırma kararı** (DEF-008) bu fazın çıkış şartı olarak durur; pilot örnek veriyle ve sizin
  makinenizde yürür, adres gerektiren kısım (telefondan erişim, e-posta) barındırmayla gelir.

## 4. Kabul

Bir şantiyenin bir günü, sabahki taslaktan resmi rapora kadar panelden geçer: bölümler farklı
kişilerce girilir, fazla döküm açıklamasız gönderilemez, fotoğrafsız zayi eksik sayılır, gönderilen
kayıt koordinatörün kuyruğuna Faz 08'in akışıyla düşer, onaylanınca kilitlenir, ilerleme ve şantiye
detayı güncellenir, resmi rapor üretilip indirilir. 375 piksel genişlikte yatay kaydırma olmadan
girilebilir (REQ-SIT-035). Her görev kendi kalite kapısından geçer; dilimin kabulü sizin turunuzdur.

## TASK-0121 — Üretim tanımları (uygulama planı, 2026-09-25)

Kademe T2. Gereksinimler REQ-ADM-002…007, REQ-SIT-010, REQ-SIT-019; şema `SCHEMA-PLATFORM.md` adm bölümü.

**Tablolar (göç 0061).**

- `adm.panel_type` — kod, ad, en ve boy (metre), **m² en × boydan türetilir** (ADM-K2, elle girilmez),
  projeye özel olabilir (REQ-ADM-005), silinmez pasifleşir. Komşu tip önerisi (REQ-SIT-019) "bir alt / bir
  üst, sonra iki alt / iki üst" ister; bunu şemadaki tek `neighbour_type_id` gösteremez, bu yüzden
  ilişki **seri + kademe** olarak tutulur: aynı serideki kademe ±1, ±2 komşudur. Şema belgesi buna göre
  güncellenir.
- `adm.strip_type` — kod, genişlik ve kalınlık (mm), delik sayısı, standart boylar (REQ-ADM-003).
- **Ölçüler değişmez.** Kullanılan bir tipin eni, boyu ya da kesiti değişirse geçmiş dökümlerin m²'si de
  değişirdi (REQ-ADM-007). Kod ve ölçüler oluşturulduktan sonra veritabanında kilitlidir; farklı ölçü
  yeni bir tiptir, eskisi pasifleşir. Ad ve standart boylar düzenlenebilir.
- `adm.consumption_recipe` — bir birim üretim (döküm, montaj, şerit montajı; parça, m² ya da metre
  başına) için hangi sarf malzemeden ne kadar (REQ-ADM-004). Satırlar **tarihlidir ve hiç
  güncellenmez**: değişiklik yeni geçerlilik satırıdır, böylece geçmiş günlerin önerisi değişmez.
  Tek okuma noktası `adm.recipe_lines(...)`: projeye özel satır genelden, tipe özel satır "her tipten"
  önce gelir, o güne geçerli en son satır seçilir.
- "Çalışma yok" nedenleri (REQ-SIT-010) mevcut katalog düzeneğinde yeni bir katalogdur; varsayılan
  nedenler fabrika verisidir. Diğer iş kalemleri mevcut `work_item` kataloğudur.

**Okuma ve yazma.** Tanımları oturum açmış herkes okur; `adm.module.manage` olan değiştirir — mevcut
ADM kuralı.

**Örnek veri.** Panel ve şerit tipleri ile reçeteler şirketin kendi bilgisidir, fabrika verisi değildir;
pilotun örnekleri `db/samples`'a gider (D-290) ve `npm run db:sample` ile yüklenir.

**Ekran (SCR-190).** `/admin/master-data`: tanım gruplarının listesi; her grup liste kalıbında, ekleme
ve düzenleme kısa formla, kullanılan kalem pasifleşir. Menüdeki eski `/master-data` adresi ve
kayıtlarda olmayan `adm.master-data.view` yetkisi SCR-190'ın adresine ve gerçek yetkiye
(`adm.module.view`) düzeltilir. Takvim ve kur ekranları SCR-190'ın parçasıdır ama bu görevin
gereksinimlerinde değildir; kendi görevlerinde gelir.

**Testler.** m²'nin türetildiği, ölçülerin kilitli olduğu, aynı kodun ikinci kez açılamadığı, komşu
kademelerin bulunduğu, reçetenin tarih ve öncelik kuralı, yetkisiz yazmanın reddedildiği veritabanı
testleri.

## TASK-0122 — Firma kartı (uygulama planı, 2026-09-25)

Kademe T2. Gereksinimler REQ-CRM-004, REQ-PUR-001, D-027, D-033, D-237, D-287; şema
`SCHEMA-COMMERCIAL-FINANCE.md` crm bölümü; ekran SCR-083.

**Tablolar (göç 0062, yeni `crm` şeması).**

- `crm.party` — gerçek bir firma için **tek kayıt** (CRM-K1). Alanlar: ticari unvan, vergi numarası,
  vergi dairesi, roller, il, adres, telefon, e-posta, not, durum (kullanımda / pasif) ve özel alanlar
  (`custom_fields`, D-237 firmaya izin verir; mevcut `adm.check_custom_fields` denetler). Şema
  belgesindeki anahtar sütunlara (`name`, `tax_no`, `roles[]`, `city`, `status`) kartın iletişim ve
  fatura bilgileri eklenir; şema belgesi buna göre güncellenir.
- **Roller:** işveren (`client`), ürün müşterisi (`customer`), tedarikçi (`supplier`), taşeron
  (`subcontractor`), kiralayan (`lessor`). En az bir rol zorunludur. Aynı firma yeni bir rolle
  karşılaşınca ikinci kart açılmaz, karta rol eklenir (REQ-PUR-001).
- **İkinci kart açılmaz** iki katmanda: vergi numarası veritabanında tekildir (aynı numarayla ikinci
  kayıt reddedilir ve mevcut kart gösterilir); ad girilirken benzer adlı firmalar önerilir
  (REQ-CRM-004). Benzerlik, Türkçe katlanmış adın "İnşaat, Sanayi, Ticaret, Ltd, Şti, A.Ş." gibi
  her firma adında geçen sözcükler çıkarıldıktan sonra kalan kök sözcüklerinden ve yazım
  yakınlığından (pg_trgm) bulunur; aksi halde her "…İnşaat Ltd. Şti." birbirine benzerdi.
- `crm.party_contact` — firmadaki kişi: ad, görev, telefon, e-posta, durum. Kişi firmadan ayrılınca
  silinmez, pasifleşir. Yalnız iş iletişim bilgisi tutulur; hassas alan yoktur.
- Firma silinmez; pasifleşir. Değişikliklerin hepsi geçmişe yazılır.

**Okuma ve yazma.** Firma adı ve rolleri başka modüllerin kayıtlarında (proje kartının işvereni,
şantiyenin taşeronu, varlığın kiralayanı, siparişin tedarikçisi) görünen referans bilgisidir; bu
yüzden firma satırını oturum açmış herkes okur. Kartı ve kişileri açmak `crm.module.view` /
`crm.module.own` ya da firma kaydeden modüllerin görme yetkisini (`pur.module.view`,
`eqp.module.view`) ister. Firmayı kaydetmek ve değiştirmek `crm.module.manage`, `pur.module.manage`
veya `eqp.module.manage` ister — tedarikçiyi satın alma, kiralayanı ekipman da kaydeder.

**Olaylar ve arama.** `party.created` ve `party.changed` yayımlanır (REQ-CRM yetenek kataloğuna
eklenir). Firma sitenin genel aramasında "Firmalar" grubunda çıkar — aramanın ilk gerçek kaydı; arama
metnine unvan, vergi numarası, il ve roller girer.

**Ekran.** `/leads-clients/parties` firma listesi (ara, role göre süz, yeni firma); `/leads-clients/
parties/[id]` firma kartı (SCR-083): bilgiler, roller, kişiler, özel alanlar. Kartın süreç sekmeleri
kendi dilimleriyle gelir ve bunu söyler: talepler ve görüşmeler, işveren karnesi (Faz 13), cari hesap
(Faz 11). Talepler ekranı (SCR-080) Faz 13'te gelene kadar menüdeki "Talepler & Müşteriler" firma
listesine açılır; menünün kayıtlarda olmayan `crm.lead.view` yetkisi gerçek yetkiye
(`crm.module.view`) düzeltilir.

**Özel alanlar.** Değerleri kaydederken denetlenir ve kartta görünür; özel alan tanımlama ekranı
REQ-ADM-009'un kendi görevindedir, bu görevin kapsamında değildir.

**Örnek veri.** Pilot için örnek firmalar (işveren, tedarikçi, taşeron, kiralayan) `db/samples`'a
gider (D-290).

**Testler.** Vergi numarasının tekil olduğu, rolsüz firmanın reddedildiği, benzer ad önerisinin ortak
sözcüklere takılmadığı, yetkisiz yazmanın reddedildiği, olayların yayımlandığı ve arama projeksiyonunun
kurulduğu veritabanı testleri; alan doğrulaması ve benzerlik anahtarı birim testleri.

## TASK-0123 — Projeler, şantiyeler, duvarlar ve hedefler (uygulama planı, 2026-09-26)

Kademe **T1** — iş kuralları kodlanmadan önce sahibin onayını ister (PROJECT_RULES §10).
Gereksinimler REQ-PRJ-001…011, REQ-SIT-001'in kart kısmı, REQ-ADM-005 (projeye özel tanımlar,
TASK-0121'den taşındı); kararlar D-136, D-137, D-138; şema `SCHEMA-OPERATIONS.md` prj ve `sit.site`.

Görev büyük olduğu için beş adımda kurulur; her adım kendi testiyle ve commit'iyle biter.

### Adım 1 — Proje kartı ve şantiyeler (yeni `prj` şeması; `sit.site`)

- `prj.project`: kod, ad, işveren (`crm.party`, işveren rolü olan firma), kurum/idare, il ve
  lokasyon, sözleşme numarası ve tarihi, **sözleşme bedeli ve para birimi (ticari veri — yetkisiz
  kişiye hiç basılmaz)**, sorumlu koordinatör, aşama, özel alanlar (D-237).
- **Üç süre ayrı ayrı girilir, biri diğerinden türetilmez** (PRJ-K5): sözleşme başlangıcı ve
  sözleşmedeki bitiş, teorik bitiş, yönetim hedef bitişi.
- **Aşamalar** (REQ-PRJ-003) katalogdur; başlangıç listesi gereksinimin on iki aşamasıdır. Kodları,
  Faz 08'de kurulan akış şablonlarının zaten kullandığı adlarla aynıdır (`technical_design`,
  `mobilisation`, `completion` …), böylece şablonlar değişmeden çalışır. Her geçiş tarih ve kişiyle
  projenin geçmişinde durur ve `project.stage_changed` yayımlanır; geçişin onayı ve kilidi akıştadır.
- `sit.site`: bağlı olduğu **tek proje** (PRJ-K1; sonradan başka projeye taşınamaz, veritabanı
  reddeder), ad, iş modeli (kendi ekibimiz / taşeron; taşeronsa taşeron firma `crm.party`), sorumlu
  koordinatör, saha mühendisi (günlük kaydı gönderen kişi), durum. Proje ve şantiye yetkiyle
  kapsanır: koordinatör atandığı projeleri, saha mühendisi atandığı şantiyeyi görür.
- Üst çubuktaki şantiye seçici bugün kodda yazılı üç örnek şantiyeyi gösteriyor; gerçek `sit.site`
  kayıtlarına bağlanır.
- Ekran: proje listesi ve proje kartı (sekmeler: bilgiler, şantiyeler, duvarlar ve hedefler,
  revizyonlar, teknik ofis, tedarik matrisi; sözleşme ve hakediş sekmeleri kendi dilimleriyle gelir).

### Adım 2 — Revizyonlar, duvarlar ve hedefler

- **Hedefler yalnız revizyonla değişir** (D-136, PRJ-K3). Teknik ofis bir **taslak revizyon** açar;
  taslak bir önceki onaylı revizyonun bütün duvar ve hedeflerinin kopyasıyla başlar, teknik ofis
  üzerinde değişiklik yapar ve onaya gönderir. Onaylanan revizyon **onay tarihinden itibaren**
  geçerlidir; eski revizyon silinmez, tarihiyle kalır. Onaylı revizyonun satırları veritabanında
  kilitlidir.
- **Onay akışla yapılır** (REQ-PRJ-009): varsayılan şablon "Proje revizyonu onayı" — onaylayan Genel
  Müdür; yönetim bunu akış tasarımcısından değiştirir. Onaylanınca revizyon geçerli olur ve
  `project_revision.approved` yayımlanır; reddedilirse taslağa döner.
- `prj.wall`: revizyona bağlı duvar — kod/ad, bağlı şantiye (**yalnız kendi projesinin
  şantiyelerinden biri**, PRJ-K4), uzunluk, yükseklik, durum (başlamadı / devam ediyor /
  tamamlandı). `prj.wall_target`: duvar × panel tipi hedef adedi (m² panel tipinden hesaplanır),
  duvar × şerit tipi × boy hedef metrajı, diğer iş kalemi hedefleri.
- **Proje hedefi duvarların toplamıdır** (PRJ-K2): ayrıca girilecek alan yoktur, toplam hesaplanır.
- **Geçmiş bir günün hedefi o gün geçerli olan revizyondan okunur**; günlük kaydın fazla döküm kuralı
  (TASK-0127) bunu tek bir veritabanı işlevinden sorar.
- İki revizyonun farkı panel tipi ve duvar bazında yan yana gösterilir.
- Projeye özel panel ve şerit tipi (REQ-ADM-005): Tanımlar'daki tip bir projeye özel de eklenebilir;
  o projenin duvarlarında seçilir, başka projede görünmez.

### Adım 3 — Günlük hedefler

- Şantiyenin günlük hedefleri (panel döküm adedi ve m², panel montaj adedi ve m², şerit montaj
  metresi, diğer iş kalemleri) **seçilen süreden, kalan işten ve çalışma takviminden hesaplanır**
  (D-137): kalan iş ÷ bitiş tarihine kadar kalan iş günü. **Tatil ve hafta sonuna hedef verilmez**
  (Tanımlar'daki çalışma takvimi).
- Hangi sürenin kullanılacağını şantiye için yetkili seçer; seçilmemişse yönetim hedef bitişi, o da
  yoksa teorik bitiş, o da yoksa sözleşme bitişi kullanılır.
- Yetkili kişi hedefi elle düzeltebilir; **hesaplanan ve düzeltilen değer birlikte** saklanır, kimin
  ve neden düzelttiği görünür.
- "Üretim geride kaldıkça kalan günlerin hedefi yeniden hesaplanır": bu dilimde kalan iş hedefin
  tamamıdır; günlük kayıt (TASK-0127) onaylandıkça gerçekleşen üretim düşülür ve hesap yenilenir.

### Adım 4 — Teknik ofis işleri ve tedarik matrisi

- `prj.technical_office_item`: tür (proje çizimi, revizyon, statik hesap, metraj, kurum onayı,
  hakediş desteği, teknik evrak — katalog), sorumlu, teslim tarihi, durum, **revizyon sayısı**.
  Teslim tarihi geçen iş sorumlusuna **görev olarak düşer**, "Dikkat"te görünür ve
  `technical_office_item.overdue` yayımlanır (her gün çalışan iş). Kurum onayı gereken işler Faz
  08'in "Kurum onayı takibi" şablonunun beklediği listeyi (`prj.authority_approvals`) besler.
  Gecikme için bir akış şablonu da gelir: "Geciken teknik ofis işi" — sorumlusuna görev ve "Dikkat" (REQ-PRJ-005; sahip 2026-09-26).
- **Tedarik matrisi** (REQ-PRJ-004): kalemler katalogdur (beton, demir, dolgu temini, serme ve
  sıkıştırma, yemek, konaklama, kamp/konteyner, nakliye, vinç ve operatör, kalıp/demirbaş, çelik
  şerit, sarf). Her kalem için üç seçenek: **işveren karşılar · GEOGES karşılar · işveren karşılar ve
  GEOGES hakedişinden keser**. Satırlar **tarihlidir, hiç güncellenmez**: değişiklik yeni geçerlilik
  tarihli yeni satırdır, geçmiş dönemlerin maliyeti yeniden yazılmaz. Şema belgesindeki seçenekler
  (`geoges/client/subcontractor`) onaylı gereksinimden farklıydı; gereksinimdeki üç seçenek kurulur
  ve şema belgesi düzeltilir.

### Adım 5 — Akışla bağlantı, arama, örnekler

_Not (2026-09-26): aşağıdaki "kaydın durumunu değiştir" karşılığı revizyon onayı ona bağlı olduğu için Adım 2'de kuruldu._

- Akışın "kaydın durumunu değiştir" adımı (REQ-WFL-010) bugün hiçbir modülde karşılık bulmuyor. Kayıt
  türüne göre sahibi modüle yönlendiren tek bir karşılık kurulur (belge ve revizyon kayıtlarındaki
  düzenle aynı biçimde); ilk kullananları proje aşaması ve proje revizyonudur. Böylece "Kazanılan
  işin başlatılması" ve "Kurum onayı takibi" şablonları gerçekten çalışır.
- Proje ve şantiye genel aramada bulunur ("Projeler ve şantiyeler"); sözleşme bedeli arama metnine
  girmez.
- Olaylar `project.created`, `project.stage_changed`, `project_revision.approved`, `wall.completed`,
  `technical_office_item.overdue`; koşul alanları `project.stage`, `project.days_to_contract_end`,
  `wall.status`, `project.contract_value` (ticari). `project.progress_percent` üretim verisi gelince
  (TASK-0127) açılır.
- Örnek veri (D-290): iki örnek proje, dört şantiye, duvarlar ve bir onaylı revizyon; kapsamlı pilot
  verisi TASK-0131'de.

### Onaya sunulan iş kuralları — ONAYLANDI (D-292, sahip 2026-09-26)

1. Taslak revizyon bir önceki onaylı revizyonun kopyasıyla başlar; onaylanınca **onay tarihinden**
   itibaren geçerli olur (geriye dönük geçerlilik yok — fazla döküm gizlenemesin diye).
2. Revizyonu varsayılan olarak **Genel Müdür** onaylar; akış tasarımcısından değişir.
3. Açılmış bir şantiye başka projeye taşınamaz; yanlış açılan şantiye pasifleştirilir.
4. Günlük hedef = kalan iş ÷ kalan iş günü; tatile hedef yok; süre seçilmemişse yönetim hedefi →
   teorik → sözleşme bitişi sırasıyla kullanılır.
5. Tedarik matrisi üç seçenekli ve tarihli; değişiklik geçmişi yeniden yazmaz.
6. Sözleşme bedeli ticari veridir: ticari yetkisi olmayan kişi alanı hiç görmez (boş kutu da görmez).

### Testler

Veritabanı: şantiyenin ikinci projeye bağlanamadığı, duvarın başka projenin şantiyesine
bağlanamadığı, onaylı revizyonun düzenlenemediği, proje hedefinin duvar toplamı olduğu, geçmiş bir
günün o günkü revizyonla okunduğu, tatile hedef verilmediği, elle düzeltmenin iki değeri de sakladığı,
tedarik matrisinin tarihli okunduğu, sözleşme bedelinin yetkisize gelmediği, olayların yayımlandığı.
Birim: günlük hedef hesabı, süre seçimi, revizyon farkı. Akış: revizyon şablonunun onaylayıp
revizyonu geçerli kıldığı uçtan uca test. Tarayıcı: 375 ve 1280 piksel.
