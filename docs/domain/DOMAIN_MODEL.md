# Alan Modeli

Durum: TASLAK — Parti 1 (platform ve ilk dilim) · Son güncelleme: 2026-09-19

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
