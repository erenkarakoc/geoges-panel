# Faz 09 — Dilim 1 Planı: Projeler, Şantiyeler, Günlük Saha Kaydı

Durum: ONAY BEKLİYOR (D-291 PROPOSED) · Tarih: 2026-09-25 · Faz: Phase 09 · Bağlı: `ai/MASTER_ROADMAP.md`,
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
