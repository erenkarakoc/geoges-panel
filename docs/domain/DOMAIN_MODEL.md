# Alan Modeli

Durum: CONFIRMED (sahip, 2026-09-19) — 24 modül, dört partide · Son güncelleme: 2026-09-19

Her modülün **ana kayıtları**, aralarındaki **ilişkiler** ve hiçbir koşulda bozulmaması gereken **değişmez kurallar** (invariant). Kayıt adları sözlüğün kod adlarıdır (`docs/domain/GLOSSARY.md`); her kural onu doğuran gereksinime bağlıdır. Olaylar, aksiyonlar ve koşul alanları her modülün `docs/requirements/REQ-<MODÜL>.md` dosyasındaki yetenek kataloğundadır; burada tekrarlanmaz. Tablolar, sütunlar ve satır görünürlüğü Phase 04'te bu modelden türetilir (TASK-0046).

Ortak kurallar (her modül için geçerli):

- **O-1** Hiçbir kayıt silinmez; yanlış kayıt gerekçeyle iptal edilir (REQ-AUD-002, D-134).
- **O-2** Onaylanmış kayıt içerik olarak kilitlidir; değişiklik yalnızca revizyon talebiyle olur (REQ-AUD-007).
- **O-3** Bir modül başka bir modülün tablosuna yazmaz; olay veya açık arayüz kullanır (ADR-001).
- **O-4** Hesaplanabilen hiçbir değer elle girilmez; bakiyeler ve sonuçlar hareketlerden türetilir (ADR-005, `docs/architecture/PRINCIPLES.md` ilke 3 ve 8).
- **O-5** Tanımlar ve kurallar geçerlilik tarihiyle sürümlüdür; onaylanmış işlem, onaylandığı andaki tanımla hesaplanmış haliyle kalır (REQ-ADM-007).
- **O-6** Her kayıt bir kapsama (şirket, proje, şantiye, fabrika, birim) bağlıdır ve veri sınıfı bellidir; görünürlük bu ikisinden gelir (REQ-IAM-011, REQ-IAM-012).

---

## IAM — Kimlik ve yetki

**Ana kayıtlar**

| Kayıt | Anlamı |
|---|---|
| `User` | Panele giriş yapan hesap; personelden ayrı bir kayıttır |
| `Role` | Yetkilerin bir araya gelmesi; seviyesi ve üst rolü vardır |
| `Permission` | Tek bir izin (modül, işlem, veri sınıfı) |
| `RoleAssignment` | Bir rolün bir kullanıcıya bir kapsamla, başlangıç ve bitişiyle verilmesi |
| `RoleDelegation` | Süreli vekâlet ataması |
| `PersonalException` | Sahibin bir kişiye tanıdığı ek veya eksik erişim |
| `ManagerOverride` | Bir kişi için elle belirlenen amir |

**İlişkiler:** `User` 1—N `RoleAssignment` N—1 `Role`; `Role` N—N `Permission`; `Role` 1—1 üst `Role`; `User` 0—1 `Employee` (HR).

**Değişmez kurallar**

- **IAM-K1** Sahip katmanındaki bir kullanıcının görünürlüğü hiçbir işlemle daraltılamaz (REQ-IAM-023).
- **IAM-K2** Akış tasarlama yetkisi yalnızca tam görünürlüklü role atanabilir; görünürlük daralırsa yetki kalkar (REQ-IAM-017, REQ-WFL-019).
- **IAM-K3** Pasif veya ayrılış tarihi geçmiş kullanıcının hiçbir oturumu geçerli değildir (REQ-IAM-006, REQ-IAM-007).
- **IAM-K4** Süresi biten vekâlet hiçbir insan işlemi olmadan sona erer (REQ-IAM-018).
- **IAM-K5** Her işlem, yapıldığı rolü taşır (REQ-IAM-013).
- **IAM-K6** Görev ayrılığı açık bir adımda, işlemi hazırlayan onu onaylayamaz (REQ-IAM-026).

## AUD — Kayıt geçmişi ve revizyon

**Ana kayıtlar:** `RecordHistory` (bir kaydın alan alan değişikliği: önceki/yeni değer, kişi, zaman, neden) · `AuditLog` (şirket geneli işlem ve giriş olayları) · `RevisionRequest` (kilitli kayıtta değişiklik talebi: alanlar, eski/yeni değer, gerekçe, karar).

**İlişkiler:** her kayıt 1—N `RecordHistory`; `RevisionRequest` N—1 hedef kayıt; onaylanan `RevisionRequest` 1—N düzeltme hareketi (ilgili defterde).

**Değişmez kurallar**

- **AUD-K1** `AuditLog` yalnızca eklenir; hiçbir rol, sahip dahil, değiştiremez veya silemez — veritabanı düzeyinde de (REQ-AUD-005).
- **AUD-K2** Geçmişteki değerler de veri sınıfı iznine göre süzülür (REQ-AUD-004).
- **AUD-K3** Onaylanan revizyon önceki değeri silmez; farkı ayrı hareket olarak yazar ve revizyona bağlar (REQ-AUD-009).
- **AUD-K4** Ret gerekçesiz yapılamaz (REQ-AUD-008).

## DOC — Belgeler

**Ana kayıtlar:** `Document` (bir kayda bağlı dosya, tür, veri sınıfı) · `DocumentVersion` (yükleme sürümü, imzalı sürüm işareti) · `UnclassifiedDocument` (yalnız aktarımda, DEF-001).

**İlişkiler:** her `Document` N—1 bağlı kayıt (herhangi bir modülden); `Document` 1—N `DocumentVersion`.

**Değişmez kurallar**

- **DOC-K1** Kayda bağlı olmayan belge yoktur (aktarım alanı hariç) (REQ-DOC-001).
- **DOC-K2** Belge, bağlı olduğu kaydın kapsamını ve veri sınıfını taşır; arama, önizleme ve toplu indirme bunu aşamaz (REQ-DOC-003, REQ-DOC-007, REQ-DOC-008).
- **DOC-K3** Sağlık raporu belgesi hiçbir kayda yüklenemez (REQ-DOC-001, D-186).
- **DOC-K4** Yeni sürüm öncekini silmez (REQ-DOC-005).

## WFL — İş akışı ve kurallar

**Ana kayıtlar**

| Kayıt | Anlamı |
|---|---|
| `Workflow` / `WorkflowVersion` | Akış tanımı ve yayımlanmış sürümleri |
| `WorkflowTemplate` | Varsayılan şirket akışı; kullanılan akış onun kopyasıdır |
| `WorkflowInstance` | Bir akışın tek çalışması; başladığı sürüme bağlı |
| `WorkflowStepRun` | Örneğin bir adımdaki çalışması (kim, ne zaman, sonuç) |
| `Approval` | Onay adımı kararı: onayla / reddet / düzeltmeye gönder, gerekçe |
| `DependencyLock` | Bir durum geçişini engelleyen kural |
| `BusinessRule` | Merkezi, tarihli kural değeri |
| `CustomRecordType` / `CustomRecord` | Kayıt türü üreteciyle tanımlanan tür ve kayıtları |

**İlişkiler:** `Workflow` 1—N `WorkflowVersion` 1—N `WorkflowInstance` 1—N `WorkflowStepRun`; `WorkflowInstance` N—1 kaynak kayıt; `Task` (TSK) ve `Notification` N—1 `WorkflowStepRun`.

**Değişmez kurallar**

- **WFL-K1** Yürüyen örnek başladığı sürümle biter; yeni sürüm yalnızca yeni örneklere uygulanır (REQ-WFL-024).
- **WFL-K2** Hiçbir akış adımı defter kaydını kesinleştirmez; kayıt oluştur adımı yalnız taslak ve durum üretir (REQ-WFL-002, REQ-WFL-010).
- **WFL-K3** Deneme çalıştırması yapılmamış sürüm yayımlanamaz (REQ-WFL-025).
- **WFL-K4** Ret ve düzeltmeye gönderme gerekçesiz yapılamaz (REQ-WFL-015).
- **WFL-K5** Akışın ürettiği her görev ve bildirim kaynak akışı, sürümü ve adımı taşır (REQ-WFL-033).
- **WFL-K6** Kilidi yalnız sahip ve genel müdür, gerekçeyle aşar (REQ-WFL-030).
- **WFL-K7** Kullanıcı tanımlı kayıt türü defter hareketi üretemez (REQ-WFL-039).

## TSK — Görev ve bildirim

**Ana kayıtlar:** `Task` (sorumlu, son tarih, öncelik, durum, kaynak, "onayım gereksin") · `Escalation` (kimden kime, ne zaman) · `Notification` (tür, kanal, okundu) · `DailyDigest`.

**İlişkiler:** `Task` N—1 kaynak (kişi veya `WorkflowStepRun`) ve N—1 ilgili kayıt; `Task` 1—N `Escalation`.

**Değişmez kurallar**

- **TSK-K1** Kaynağı olmayan görev yoktur (REQ-TSK-001).
- **TSK-K2** Aynı kaynak ve aynı sorun için ikinci açık sistem görevi oluşmaz; sorun çözülünce görev kendiliğinden kapanır (REQ-TSK-005).
- **TSK-K3** Eskale olan görev ilk sorumlunun listesinden düşmez (REQ-TSK-006).
- **TSK-K4** Bildirim metninde hassas kişisel veri bulunmaz (REQ-TSK-011).

## ADM — Tanımlar

**Ana kayıtlar:** `CatalogItem` (ortak liste kalemleri: gider kategorisi, birim, iş kalemi…) · `PanelType` · `StripType` · `ConsumptionRecipe` · `CustomField` · `WorkingCalendar` · `ExchangeRate` (TCMB veya elle, kaynak ve tarih).

**İlişkiler:** her tanım 1—N geçerlilik sürümü; tanım isteğe bağlı olarak bir projeye özeldir (REQ-ADM-005); `WorkingCalendar` şirket geneli veya birime/şantiyeye özel.

**Değişmez kurallar**

- **ADM-K1** Onaylanmış işlem, onay anındaki tanım ve fiyatla kalır; geriye dönük değişiklik yalnız onaylanmamış işlemlere uygulanır (REQ-ADM-007, REQ-ADM-008).
- **ADM-K2** Panel tipinin m²'si en ve boydan hesaplanır, elle girilmez (REQ-ADM-002).
- **ADM-K3** Birleştirilen katalog kalemlerinin geçmiş kayıtları kaybolmaz, yeni kaleme bağlanır (REQ-ADM-006).
- **ADM-K4** Kur alınamazsa dövizli işlem "kur bekliyor" olur; sessizce eski kurla hesaplanmaz (REQ-ADM-013).
- **ADM-K5** Dövizli her işlem kullandığı kuru ve kaynağını taşır (REQ-ADM-015).

## PRJ — Proje

**Ana kayıtlar:** `Project` (işveren, kurum, sözleşme bilgisi, üç süre, aşama) · `ProjectRevision` (hedefleri taşıyan onaylı sürüm) · `Wall` (duvar; panel tipi × hedef adet, şerit hedefleri) · `SupplyResponsibility` (tedarik matrisi satırı) · `TechnicalOfficeItem` · `DailyTarget`.

**İlişkiler:** `Project` 1—N `Site` (SIT) ; `Project` 1—N `ProjectRevision` 1—N `Wall` hedefi; `Wall` N—1 `Site`; `Project` N—1 `Party` (işveren).

**Değişmez kurallar**

- **PRJ-K1** Bir şantiye yalnız bir projeye bağlıdır; maliyet ve hakediş tek projeye yazılır (REQ-PRJ-001).
- **PRJ-K2** Proje hedefi duvarların toplamıdır, elle ayrıca girilmez (REQ-PRJ-007).
- **PRJ-K3** Onaylı hedef doğrudan değişmez; yalnız yeni revizyonla. Fazla döküm her zaman o gün geçerli revizyona göre değerlendirilir (REQ-PRJ-009).
- **PRJ-K4** Bir duvar yalnız kendi projesinin şantiyelerinden birine bağlanır (REQ-PRJ-006).
- **PRJ-K5** Sözleşme süresi, teorik süre ve yönetim hedef süresi ayrı ayrı girilir; biri diğerinden türetilmez (REQ-PRJ-010).

## SIT — Şantiye ve günlük kayıt

**Ana kayıtlar**

| Kayıt | Anlamı |
|---|---|
| `Site` | Şantiye; iş modeli (taşeron / öz kaynak), giriş sorumlusu, sorumlu koordinatör |
| `DailySiteLog` | Şantiyenin bir günlük ana kaydı; durum (taslak, gönderildi, onaylandı, düzeltmede), geç giriş işareti |
| `CastingSession` / `CastingEntry` | Döküm seansı ve panel tipi başına adet |
| `InstallationEntry` / `StripInstallationEntry` | Panel ve şerit montajı (duvar, adet, metre, saatler) |
| `HandoverTime` | Teslim-tesellüm saatleri (dolgu, beton, demir) |
| `TimesheetEntry` / `ActivityTimeEntry` | Bordro puantajı ve performans için faaliyet süresi |
| `SubcontractorWorker` | Taşeron işçisi, adıyla (hassas alan yok) |
| `DamagedUnit` | Zayi panel: tip, adet, neden, fotoğraf |
| `ConsumptionEntry` | Önerilen ve girilen tüketim |
| `SiteExpense` | Saha harcaması ve belgesi |
| `EquipmentUseEntry` | O gün kullanılan ekipman |

**İlişkiler:** `Site` 1—N `DailySiteLog`; `DailySiteLog` 1—N her giriş satırı; giriş satırları N—1 `Wall`, `PanelType`, `StripType`, `Employee`, `Asset` gibi ana kayıtlara bağlanır.

**Değişmez kurallar**

- **SIT-K1** Bir şantiyenin bir günü için tek ana günlük kayıt vardır (REQ-SIT-002).
- **SIT-K2** Döküm m²'si ve şerit metresi elle girilmez; adet ve tanımdan hesaplanır (REQ-SIT-014, REQ-SIT-022).
- **SIT-K3** Açıklamasız fazla döküm, fotoğrafsız zayi veya eksik zorunlu alanla kayıt onaya gönderilemez (REQ-SIT-013, REQ-SIT-018, REQ-SIT-020).
- **SIT-K4** Gönderilmiş kayıt, geri çekilmeden veya geri gönderilmeden değişmez; karar verilmiş kayıt geri çekilemez (REQ-SIT-008, REQ-SIT-009).
- **SIT-K5** "Geç girildi" işareti kaldırılamaz (REQ-SIT-012).
- **SIT-K6** Onaylanmamış kayıt hiçbir modüle yansımaz; onaylanan veri olayla dağılır ve olay iki kez gelirse iki kez işlenmez (REQ-SIT-032).
- **SIT-K7** Stok tüketimi girilen miktarla olur; önerilen ve girilen yan yana saklanır (REQ-SIT-029).
- **SIT-K8** Günlük kayıtta yalnız o an şantiyede bulunan ekipman seçilebilir (REQ-EQP-011).

## RPT — "Bugün", göstergeler ve raporlar

**Ana kayıtlar:** `AttentionItem` (tür, kaynak kayıt, açık/kapalı, "gördüm" işaretleri) · `IndicatorSelection` (rol varsayılanı ve kişi düzeni) · `SavedReportView` (kayıtlı rapor görünümü) · `OfficialDailyReport` (onaylı kayıttan üretilen PDF, sürümü, işverene gönderim kaydı).

**İlişkiler:** `AttentionItem` N—1 kaynak kayıt; `OfficialDailyReport` N—1 `DailySiteLog`; RPT'nin geri kalanı diğer modüllerden türetilen okuma görünümleridir (`docs/architecture/PRINCIPLES.md` ilke 10).

**Değişmez kurallar**

- **RPT-K1** Dikkat öğesini kimse kapatamaz, silemez, gizleyemez; yalnız sebebi çözülünce kapanır (REQ-RPT-008).
- **RPT-K2** Yetkisi olmayan kullanıcıya gösterge hiç gösterilmez; aynı sayı her yerde aynıdır (REQ-RPT-003).
- **RPT-K3** Resmi günlük rapor yalnız onaylı kayıttan üretilir ve ticari veri içermez (REQ-RPT-020).
- **RPT-K4** Hiçbir akış günlük raporu dış adrese gönderemez (REQ-RPT-021).
- **RPT-K5** Dışa aktarım ekranda görülebilenden fazlasını içermez ve denetime yazılır (REQ-RPT-019).

---

## INV — Stok ve malzeme

**Ana kayıtlar**

| Kayıt | Anlamı |
|---|---|
| `Material` | Katalogdaki malzeme; birim, kritik eşik, ölçüler, teorik birim ağırlık |
| `Location` | Fabrika, depo, galvanizci, şantiye veya "sevkiyatta" |
| `StockMovement` | Tek bir stok hareketi: tür, miktar, lokasyon, süreç durumu, birim maliyet ve yöntemi, kaynak kayıt |
| `MaterialLot` | Birlikte izlenen parti (şerit partisi, galvaniz dönüşü) |
| `Shipment` / `TruckLoad` | Sevkiyat ve tır; boy satırları, kantar fişleri, çıkış/varış |
| `MaterialIssueRequest` | Şantiyenin malzeme çıkış talebi |
| `StockCount` | Fiziki sayım: sistem ve sayılan miktar, fark nedeni |
| `OpeningStock` | Başlangıç bakiyesi ve birim maliyeti |
| `StockReservation` | Satış siparişi için ayrılan miktar |

**İlişkiler:** `StockMovement` N—1 `Material`, N—1 `Location`, N—1 kaynak kayıt (sipariş, günlük kayıt, sevkiyat, sayım, revizyon); `Shipment` 1—N `TruckLoad` 1—N `StockMovement`; `MaterialLot` 1—N `StockMovement`.

**Değişmez kurallar**

- **INV-K1** Stok miktarı yalnız hareketlerden hesaplanır; üzerine yazılmaz; düzeltme ters hareket veya düzeltme hareketidir (REQ-INV-003, REQ-INV-014).
- **INV-K2** Şirket toplamı lokasyonların toplamına her zaman eşittir (REQ-INV-002).
- **INV-K3** Her tüketim hareketi maliyetini ve maliyet yöntemini taşır; maliyet tüketim anında donar (REQ-INV-018, REQ-INV-021).
- **INV-K4** Ağırlıklı ortalama lokasyon başınadır; transfer kaynak lokasyonun ortalamasıyla çıkar, taşıma ücreti hedefe eklenir (REQ-INV-019).
- **INV-K5** Aynı tüketim hem stoktan hem gider olarak iki kez maliyete giremez (REQ-INV-017).
- **INV-K6** Maliyeti bulunamayan tüketim sıfır maliyetle sessizce geçmez (REQ-INV-018).
- **INV-K7** Onaylanmamış sayım stoğu değiştirmez; onaylı açılış stoku doğrudan düzenlenemez (REQ-INV-014, REQ-INV-015).
- **INV-K8** Tolerans dışı kantar farkı açıklama girilmeden kapatılamaz (REQ-INV-011).
- **INV-K9** Satılan hurda, hurdaya ayrılandan fazla olamaz; tartım belgesi olmadan fire hurdaya ayrılamaz (REQ-INV-027).
- **INV-K10** Ayrılmış stok kullanılabilir stok sayılmaz (REQ-QTE-016).

## PUR — Satın alma

**Ana kayıtlar:** `Supplier` (tedarikçi rolündeki `Party`) · `PurchaseOrder` (tedarikçi, kalemler, fiyat, para birimi, termin, durum) · `GoodsReceipt` (tır bazında teslim alım) · `OverDelivery` · `PurchaseRequest` (talep, aciliyet, istenen tarih, maliyet merkezi) · `SupplierQuote`.

**İlişkiler:** `PurchaseOrder` N—1 `Party`; `PurchaseOrder` 1—N `GoodsReceipt` 1—N `StockMovement` (INV); `PurchaseRequest` 1—N `SupplierQuote`; `PurchaseRequest` 0—1 `PurchaseOrder`.

**Değişmez kurallar**

- **PUR-K1** Aynı firma için ikinci kayıt açılmaz; rol eklenir (REQ-PUR-001, D-027).
- **PUR-K2** Teslim alım ve stok girişi aynı işlemdedir; biri olmadan diğeri kalmaz (REQ-PUR-005).
- **PUR-K3** Toleransı aşan fazla teslim onay olmadan kullanılabilir stoğa girmez (REQ-PUR-006).
- **PUR-K4** Onaylanmamış talep için alım kaydı açılamaz (REQ-PUR-007).
- **PUR-K5** Teslim alma, maliyet merkezi seçilmeden tamamlanmaz (REQ-PUR-011).

## FAC — Fabrika

**Ana kayıtlar:** `FactoryDailyLog` (günlük üretim, saatler, durum) · `ProductionEntry` (iş türü: şerit işleme, lug, teknik iyileştirme; miktar ve işçilik saati) · `FactoryCostPeriod` (ayın giderleri, saat payları, birim maliyet; geçici/kesin) · `TechnicalImprovementWork`.

**İlişkiler:** `FactoryDailyLog` 1—N `ProductionEntry`; onaylı kayıt 1—N `StockMovement` (INV); `FactoryCostPeriod` 1—N birim maliyet (iş türü başına).

**Değişmez kurallar**

- **FAC-K1** Fabrikada panel dökümü yoktur (REQ-FAC-001).
- **FAC-K2** Fabrika kaydı onaylanmadan hiçbir hareketi stoğa, fireye veya maliyete yansımaz; onay adımı kapatılamaz (REQ-FAC-004, REQ-FAC-005).
- **FAC-K3** İşçilik saati olmayan üretim satırı eksiktir (REQ-FAC-003).
- **FAC-K4** Ay kapanana kadar birim maliyet geçicidir; kapanınca fark ayrı hareketle düzeltilir (REQ-FAC-009).

## FIN — Finans

**Ana kayıtlar**

| Kayıt | Anlamı |
|---|---|
| `ClientProgressPayment` | İşveren hakedişi: proje, dönem, kalemler, brüt, kesintiler, net, durum |
| `ProgressPaymentLine` | Hakediş kalemi: önerilen ve düzeltilen miktar, gerekçe, devreden miktar |
| `Deduction` | Teminat, stopaj, avans ve diğer kesinti satırı |
| `SubcontractorProgressPayment` | Taşeron hakedişi |
| `ClientAdvance` | İşveren avansı ve kalan bakiyesi |
| `Collection` / `Payment` | Tahsilat ve ödeme; dekont |
| `Income` / `Expense` | Gelir ve gider kaydı; maliyet merkezi, kaynak kayıt |
| `PartyAccountEntry` | Cari hareketi: firma, para birimi, tutar, TL karşılığı |
| `CashFlowItem` | Nakit projeksiyonunda planlı kalem |
| `ClosingUnit` / `PeriodClose` | Kapanış birimi ve ay kapanışı; yeniden açma gerekçesi |
| `AccountingExport` | Aylık muhasebe dosyası ve mutabakat farkları |

**İlişkiler:** `ClientProgressPayment` N—1 `Project`, 1—N `ProgressPaymentLine`, 1—N `Deduction`, 1—N `Collection`; `Expense` N—1 `CostCenter` ve N—1 kaynak kayıt; `PartyAccountEntry` N—1 `Party`; `PeriodClose` N—1 `ClosingUnit`.

**Değişmez kurallar**

- **FIN-K1** Bir proje ve dönem için tek açık işveren hakedişi vardır (REQ-FIN-001).
- **FIN-K2** Net tutar kesinti satırlarından hesaplanır, elle yazılmaz (REQ-FIN-006).
- **FIN-K3** Aynı miktar iki hakedişte birden onaylanmış sayılmaz; onaylanmayan miktar devreder (REQ-FIN-003).
- **FIN-K4** Hakediş durumu atlanamaz; faturalanmamış hakediş tahsil edilmiş olamaz (REQ-FIN-004).
- **FIN-K5** Kesilen avans alınan avansı aşamaz (REQ-FIN-007).
- **FIN-K6** Kaynak kaydı onaylanmadan gider yazılmaz; aynı harcama iki kez gider olmaz (REQ-FIN-013, REQ-FIN-016).
- **FIN-K7** Her gelir ve gider bir maliyet merkezine bağlıdır; genel gider projelere dağıtılmaz (REQ-FIN-011, REQ-FIN-014, REQ-FIN-017).
- **FIN-K8** Cari hareketi silinmez; yanlış hareket ters kayıtla düzeltilir; firma başına para birimi bazında tek net bakiye vardır (REQ-FIN-018, REQ-FIN-019).
- **FIN-K9** Onaysız ödeme "ödendi" olamaz; hazırlayan kendi ödemesini onaylayamaz (REQ-FIN-025).
- **FIN-K10** Engelleyici kalemi olan birim dönemini kapatamaz; kapalı döneme doğrudan kayıt girilemez; yeniden açma gerekçe ister (REQ-FIN-028, REQ-FIN-029).

---

## EQP — Ekipman ve araçlar

**Ana kayıtlar:** `Asset` (demirbaş/varlık kartı: kategori, bedel, faydalı ömür, kendi malı/kiralık, durum) · `AssetGroup` (lokasyon başına adetle izlenen düşük değerli eşya) · `RentedAsset` (kiralayan, bedel, süre) · `AssetLocationPeriod` (hangi tarihler arasında nerede) · `AssetAssignment` (zimmet) · `AssetCustodyRecord` (devir-teslim tutanağı, iki taraf onayı) · `EquipmentWorkingDay` · `PeriodicInspection` · `Breakdown` (arıza ve tamir) · `AssetWriteOff` · `CraneDailyLog`.

**İlişkiler:** `Asset` 1—N `AssetLocationPeriod` N—1 `Location` veya `Site`; `Asset` 1—N `AssetAssignment` N—1 `Employee`; `Asset` 1—N `EquipmentWorkingDay` N—1 `Site` (kaynağı `EquipmentUseEntry` veya `CraneDailyLog`); `Asset` 1—N `PeriodicInspection`, `Breakdown`.

**Değişmez kurallar**

- **EQP-K1** Aynı seri numarası veya plakayla ikinci kart açılmaz (REQ-EQP-001).
- **EQP-K2** Bir varlık aynı anda iki lokasyonda bulunmaz (REQ-EQP-006).
- **EQP-K3** Kendi malı varlığın her günü ya bir şantiyeye (çalıştığı gün) ya atıl ekipman giderine yazılır; hiçbir gün boş kalmaz, hiçbir gün iki kez yazılmaz; kiralık varlık ve grup eşyası amortismana girmez (REQ-EQP-003, REQ-EQP-004, REQ-EQP-010).
- **EQP-K4** İki tarafın onayı (veya kâğıt tutanak fotoğrafı) olmadan devir tamamlanmaz ve zimmet değişmez (REQ-EQP-008).
- **EQP-K5** Km ve saat sayacı bir önceki okumadan küçük girilemez (REQ-EQP-008, REQ-EQP-019).
- **EQP-K6** Zayi edilen varlık pasifleşir, silinmez; kalan değeri bir maliyet merkezine yazılır (REQ-EQP-014).

## HR — Personel ve bordro

**Ana kayıtlar:** `Employee` (personel kartı, kayıtlı birim ve geçerlilik tarihleri) · `Timesheet` (aylık puantaj; kaynağı `TimesheetEntry` veya elle giriş) · `Payroll` ve `PayrollLine` (bordro ve kişi satırı: brüt, SGK, vergi, kesinti, net, durum) · `PayrollParameter` · `SalaryAdvance` · `BankPaymentFile` · `Leave` ve `LeaveBalance` · `OnboardingChecklist` ve `OffboardingChecklist` · `TrainingRecord` · `DailyActivityReport` · sağlık raporunun yalnız varlığı ve tarihleri.

**İlişkiler:** `Employee` 0—1 `User` (IAM); `Employee` 1—N `PayrollLine` N—1 `Payroll`; `PayrollLine` N—1 `PayrollParameter` sürümü; `Employee` 1—N `Leave`, `SalaryAdvance`, `AssetAssignment` (EQP).

**Değişmez kurallar**

- **HR-K1** Hassas alanlar (maaş, SGK, IBAN, prim) yalnız hassas izni olan role görünür; listede, dışa aktarımda ve geçmişte de (REQ-HR-002).
- **HR-K2** Sağlık raporunun kendisi panelde saklanmaz; yalnız varlığı ve tarihleri (REQ-HR-002, D-186).
- **HR-K3** Onaylanmış bordro parametre değişince yeniden hesaplanmaz; onaylanan bordro kilitlidir (REQ-HR-007, REQ-HR-008).
- **HR-K4** Bordroyu hazırlayan kendi bordrosunu onaylayamaz; onaylanmamış bordro için ödeme dosyası üretilemez (REQ-HR-008, REQ-HR-011).
- **HR-K5** Kesilen avans verilen avansı aşamaz (REQ-HR-010).
- **HR-K6** Onaylanmamış günlük kaydın puantajı bordroya girmez (REQ-HR-004).
- **HR-K7** Ayrılan personelin üzerinde zimmet veya avans varsa çıkış listesi kapanmaz (REQ-HR-015).

## CRM — Talepler ve müşteriler

**Ana kayıtlar:** `Party` (firma; rolleri: işveren, müşteri, tedarikçi…) · `Lead` (talep: kaynak, ilgilenecek kişi, dönüş tarihi, aşama, kayıp nedeni) · `ContactLog` · `ClientScorecard` (hesaplanan görünüm) · `ScorecardNote` · `Tender`.

**İlişkiler:** `Lead` N—1 `Party`; `Lead` 1—N `Quote` (QTE); `Lead` 0—1 `Project` (PRJ); `Party` 1—N `ContactLog`, `ScorecardNote`.

**Değişmez kurallar**

- **CRM-K1** Bir gerçek firma için tek `Party` kaydı vardır (REQ-CRM-004, D-027).
- **CRM-K2** "Kaybedildi" kayıp nedeni olmadan işaretlenmez (REQ-CRM-006).
- **CRM-K3** Karne notu değiştirilmez ve silinmez; karnede elle puan yoktur (REQ-CRM-009, REQ-CRM-010).
- **CRM-K4** Bir talepten yalnız bir proje açılır; ürün satışında proje açılmaz (REQ-CRM-014).

## QTE — Teklif ve ürün satışı

**Ana kayıtlar:** `Quote` (durum, tür: uygulama/ürün, hedef marj) · `QuoteVersion` (gönderilmiş, değişmez sürüm ve belgesi) · `QuoteLine` (kalem, miktar, birim fiyat, para birimi, önerilen ve girilen tahmini maliyet) · `QuoteTemplate` · `LessonNote` · `SalesOrder` ve `SalesOrderShipment`.

**İlişkiler:** `Quote` N—1 `Lead`; `Quote` 1—N `QuoteVersion` 1—N `QuoteLine`; kazanılan `QuoteVersion` 0—1 `Project` veya 0—1 `SalesOrder`; `SalesOrder` 1—N `StockReservation` (INV) ve `SalesOrderShipment`.

**Değişmez kurallar**

- **QTE-K1** Gönderilmiş sürüm değiştirilemez; değişiklik yeni sürümdür (REQ-QTE-003).
- **QTE-K2** Bir talebin teklifi kazanılınca diğer açık teklifleri iptal olur (REQ-QTE-002).
- **QTE-K3** Tahmini maliyet ve marj teklif belgesinde hiçbir zaman yer almaz (REQ-QTE-012).
- **QTE-K4** Projenin veya satış siparişinin kalemleri kazanılan sürümden gelir ve ona bağlıdır (REQ-QTE-009, REQ-QTE-014).
- **QTE-K5** Tedarikçiden doğrudan sevkte stok hareketi oluşmaz (REQ-QTE-015).

## CMP — Sözleşme ve uyum

**Ana kayıtlar:** `Contract` (tür: işveren, taşeron, tedarikçi çerçeve) · `ContractAmendment` (tarihli yeni sürüm) · `Obligation` (sorumlu taraf, son tarih, durum, ceza riski) · `ExtensionOfTime` · `ClientDelayFile` · `NoticeLetter` · `Guarantee` (mektup, kesinti, nakit) · `GuaranteeCommission` · `DisputeFile` · süreli resmi belge.

**İlişkiler:** `Contract` N—1 `Party`, N—0..1 `Project`; `Contract` 1—N `ContractAmendment`, `Obligation`; `ExtensionOfTime` N—1 `Contract`; `NoticeLetter` N—1 `Obligation`.

**Değişmez kurallar**

- **CMP-K1** Her hesap işlem tarihinde geçerli sözleşme sürümünü kullanır; önceki sürüm silinmez (REQ-CMP-005).
- **CMP-K2** Geçerli taşeron sözleşmesi olmayan ekip için taşeron hakedişi hazırlanamaz (REQ-CMP-003).
- **CMP-K3** Sözleşme bitiş tarihi yalnız işverenin süre uzatımı kararı girilince değişir (REQ-CMP-011).
- **CMP-K4** Hakediş, nakit projeksiyonu ve ceza hesabı şartları sözleşmeden okur; aynı şart ikinci yerde girilmez (REQ-CMP-002).

## QHS — Kalite ve İSG

**Ana kayıtlar:** `TestCertificate` · `MaterialLot` (INV ile ortak) · `QualityCheck` · `Nonconformity` (tür, etki seviyesi, kök neden, tekrar mı) · `CorrectiveAction` (DÖF aksiyonu) · `OhsIncident` (kaza veya ramak kala; sağlık bilgisi yok) · `TrainingRecord` · `OhsChecklist` · `RiskAssessment` · `PpeIssue`.

**İlişkiler:** `TestCertificate` N—1 `MaterialLot`; `Nonconformity` 1—N `CorrectiveAction` 1—1 `Task` (TSK); `Nonconformity` 0—1 önceki `Nonconformity` (tekrar); `PpeIssue` N—1 `Employee` ve 1—1 `StockMovement` (INV).

**Değişmez kurallar**

- **QHS-K1** Kök neden ve en az bir aksiyon olmadan, açık aksiyonu varken uygunsuzluk kapanmaz (REQ-QHS-005, REQ-QHS-006).
- **QHS-K2** İSG olayında sağlık bilgisi için alan veya belge türü yoktur (REQ-QHS-009).
- **QHS-K3** Ramak kala hiçbir performans veya prim hesabında olumsuz sayılmaz (REQ-QHS-011).
- **QHS-K4** Ciddi kaza veya açık kritik İSG bulgusu olan dönemde şantiyenin hız ve prim hedefi başarılı sayılmaz (REQ-QHS-016).
- **QHS-K5** "Kaldı" sonucu partiyi bloke etmez, ama kararı girilene kadar parti işaretli görünür (REQ-QHS-003).

---

## MTG — Toplantı ve karar

**Ana kayıtlar:** `Meeting` (tarih, başlık, katılımcılar, gündem, isteğe bağlı proje veya şantiye) · `MeetingMinutes` (kaydedilince kesinleşen notlar) · `MeetingDecision` (karar, sorumlu, son tarih, durum).

**İlişkiler:** `Meeting` 1—1 `MeetingMinutes`; `Meeting` 1—N `MeetingDecision` 1—1 `Task` (TSK); `Meeting` N—0..1 `Project` veya `Site`.

**Değişmez kurallar**

- **MTG-K1** Tutanak kaydedilince kilitlenir; değişiklik yalnız revizyon talebiyle olur (REQ-MTG-003).
- **MTG-K2** Sorumlusu ve son tarihi olmayan karar kaydedilmez (REQ-MTG-004).
- **MTG-K3** Karar ile bağlı görevinin durumu hiçbir zaman ayrışmaz (REQ-MTG-007).
- **MTG-K4** Bir kapsama bağlı toplantıyı o kapsamı görebilen görür; bağlı olmayanı yalnız katılımcılar (REQ-MTG-002).

## SUP — Destek talebi

**Ana kayıtlar:** `SupportTicket` (kategori, konu, öncelik, muhatap, durum) · `SupportMessage` (talebin altındaki mesaj ve ekleri) · `TicketReferral` (üst pozisyona sevk).

**İlişkiler:** `SupportTicket` 1—N `SupportMessage`, `TicketReferral`; `SupportTicket` 0—1 `PurchaseRequest` (PUR).

**Değişmez kurallar**

- **SUP-K1** Muhatap seçilmeden talep açılmaz; ret gerekçesiz yapılamaz (REQ-SUP-001, REQ-SUP-003).
- **SUP-K2** Eskale olan talep ilk muhatabın listesinden düşmez (REQ-SUP-005).

## PRF — Performans ve prim

**Ana kayıtlar:** `KeyPerformanceIndicator` (kod, pozisyon, ağırlık, hedef, puanlama tipi, veri kaynağı) · `PerformanceTarget` (şirket, rol veya kişi düzeyi) · `KpiResult` (bir kişinin bir aydaki KPI değeri; hesaplanan veya amir puanı ve gerekçesi) · `PerformanceScore` (aylık 0–100 puan ve bant; kesinleşti mi) · `BonusRule` · `Bonus` (aylık prim; hesap dökümü, onay, ödeme) · `DevelopmentPlan`.

**İlişkiler:** `KeyPerformanceIndicator` N—1 pozisyon (rol); `PerformanceScore` N—1 `Employee`, 1—N `KpiResult`; `Bonus` N—1 `PerformanceScore` ve N—1 `BonusRule`; `KpiResult` N—1 kaynak kayıtlar (günlük kayıt, uygunsuzluk, görev…).

**Değişmez kurallar**

- **PRF-K1** Hesaplanabilen KPI elle yazılamaz; kimse kendi KPI puanını giremez (REQ-PRF-002, REQ-PRF-003).
- **PRF-K2** Bir pozisyonun KPI ağırlıkları toplamı %100'dür ve her skora en az bir kalite veya güvenlik boyutu girer (REQ-PRF-004, REQ-PRF-008).
- **PRF-K3** Koordinatörün KPI'ları arasında kâr, marj veya maliyet tabanlı KPI yoktur (REQ-PRF-006).
- **PRF-K4** Katalog değişikliği kapanmış ayların puanını ve primini değiştirmez (REQ-PRF-010).
- **PRF-K5** Onaylanmamış prim ödenmez; ödenen her prim muhasebe aktarımına girer; prim tutarı hassas veridir (REQ-PRF-016, REQ-PRF-017, REQ-PRF-018).
- **PRF-K6** Taşeron ekip başı için puan ve prim hesaplanmaz (REQ-PRF-020).

## INT — Öneriler ve senaryolar

**Ana kayıtlar:** `Recommendation` (tür, önem, gerekçe ve rakamlar, kaynak kayıtlar, durum, kapatma gerekçesi) · `RecommendationType` · `ResourceTransferSuggestion` · `AccelerationScenario` (girdiler, hesap dökümü, "önerilmez" nedeni, onay) · `ScenarioLimit`.

**İlişkiler:** `Recommendation` N—1 `RecommendationType`, N—N kaynak kayıtlar; onaylanan `ResourceTransferSuggestion` 1—1 transfer kaydı (EQP veya INV); onaylanan `AccelerationScenario` 1—1 `Project` yönetim hedef süresi.

**Değişmez kurallar**

- **INT-K1** INT hiçbir stok, ekipman, personel, hedef veya para kaydını doğrudan değiştirmez; öneri üretimi dışarıya veri göndermez (REQ-INT-002, REQ-INT-004).
- **INT-K2** Uygulanmayan öneri gerekçesiz kapatılamaz (REQ-INT-005).
- **INT-K3** "Önerilmez" işaretli senaryo önerilen senaryo olamaz ve seçilemez (REQ-INT-012, REQ-INT-013).
- **INT-K4** Onaylanmamış senaryo hiçbir hedefi değiştirmez (REQ-INT-014).

## STR — Strateji ve bütçe

**Ana kayıtlar:** `AnnualTarget` · `Budget` ve `BudgetRevision` (ay × maliyet merkezi × gider türü satırları) · `BudgetVariance` (hesaplanan görünüm) · `InvestmentAnalysis` · `CompanyHealthScorecard` (başlık başına renk ve nedenleri; hesaplanan görünüm).

**İlişkiler:** `Budget` 1—N `BudgetRevision`; `AnnualTarget` 1—N `PerformanceTarget` (PRF, şirket düzeyi); `InvestmentAnalysis` N—N `Asset` (EQP) verisi.

**Değişmez kurallar**

- **STR-K1** Onaylanan bütçe kilitlidir; değişiklik yeni revizyondur ve ilk bütçe silinmez (REQ-STR-002).
- **STR-K2** Enflasyona göre düzeltilmiş görünüm hiçbir kaydı değiştirmez; endeksi eksik ay sessizce hesaplanmaz (REQ-STR-004).
- **STR-K3** Sağlık karnesinde tek toplam şirket puanı yoktur; her renk göstergelerine açılır (REQ-STR-008).
