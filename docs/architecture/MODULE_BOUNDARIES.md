# Modül Sınırları ve Sözleşmeler

Durum: TASLAK · Son güncelleme: 2026-09-20

Modüler monolitte (ADR-001) bir modülün nerede bittiğini, dışarıya neyi açtığını ve başka modülle nasıl konuştuğunu belirler. Modül listesi ve bağımlılık grafiği: `docs/architecture/MODULE_MAP.md`. Yetenek katalogları (olay, aksiyon, koşul alanı) her modülün `docs/requirements/REQ-<KOD>.md` dosyasının sonundadır; tek kaynak orasıdır (D-078). Görev: TASK-0057. Kararlar: D-233.

## 1. Değişmez kurallar

1. **Veri sahibi tektir.** Her kayıt bir modüle aittir; o modül dışında hiçbir kod o tabloya yazmaz, doğrudan okumaz.
2. **Üç yüzey.** Bir modül dışarıya yalnız şunları açar: **sorgu** ve **komut** işlevleri (uygulama arayüzü), **olaylar**, ve akış motoruna açılan **yetenekler** (aksiyon, koşul alanı). Bunların dışında kalan her şey modülün içidir.
3. **Modül içi serbesttir.** Kontrollü sınır 25 modülde kalır; modül içindeki parçalar istenildiği gibi bölünür (D-078).
4. **Çağrı yönü grafiğe uyar.** `MODULE_MAP.md`'deki oklar dışında bağımlılık kurulmaz. Döngü yasaktır: iki modül birbirine ihtiyaç duyuyorsa biri olay yayınlar, diğeri dinler.
5. **Defteri yalnız sahibi yazar.** Fatura kesme, ödeme işleme, stok hareketi yazma gibi kesinleştiren komutlar akış motoruna hiç açılmaz (D-080); akış bunun yerine görev açar.
6. **İlan edilen yetenek sözleşmedir.** Silinmez, sessizce değişmez; yalnız eklenir veya "kullanımdan kalktı" işaretlenir (D-078).

## 2. Modülün yapısı

```
src/modules/<kod>/
  index.ts        → modülün tek dış yüzeyi: sorgular, komutlar, tipler
  capabilities.ts → yetenek kataloğu: olaylar, aksiyonlar, koşul alanları
  domain/         → kurallar, hesaplar, değişmezler (modülün içi)
  data/           → tablolara erişim (yalnız bu modül)
  ui/             → ekranlar ve bileşenler
```

- Başka bir modül yalnız `@/modules/<kod>` kökünden içe aktarır; alt klasörlere erişemez.
- Bugün lint kuralı modüller arası içe aktarmayı tamamen yasaklıyor (`eslint.config.mjs`). Phase 07'de "yalnız `index.ts`" biçimine gevşetilir; bu, TASK-0057'den doğan bir uygulama işidir.
- Platform modülleri (IAM, AUD, DOC, WFL, TSK, ADM) `src/platform/` ve `src/modules/` arasında bölünmüştür; Phase 07'de hepsi aynı düzene taşınır.

## 3. İletişim biçimleri

| İhtiyaç | Yol | Örnek |
|---|---|---|
| Başka modülün verisini okumak | O modülün **sorgusu** | FIN, hakediş hazırlarken SIT'in `getApprovedProduction(site, period)` sorgusunu çağırır |
| Başka modülde bir şey olmasını istemek | **Olay yayınlamak**; karşı taraf kendi komutunu çalıştırır | SIT `daily_site_log.approved` yayınlar; INV tüketimi yazar, HR puantajı işler |
| Aynı istek içinde tutarlılık gerekiyorsa | **Komut**, yalnız grafikteki yönde | QTE, kazanılan teklifte PRJ'nin `createDraftProject` komutunu çağırır |
| Akışın bir şey yapması | Katalogdaki **aksiyon** | `purchase_request.create_draft` |
| Akışın bir şey bilmesi | Katalogdaki **koşul alanı** | `client_progress_payment.net_amount` |

**Senkron mu, olayla mı?** Kullanıcı ekranda sonucu hemen görmek zorundaysa senkron komut; görmesi gerekmiyorsa olay. Bir kullanıcı işlemi hiçbir zaman ikiden fazla modülü senkron zincire sokmaz; üçüncüsü olayla devam eder.

## 4. Raporlama ve yönetim ekranları (D-233)

RPT, INT ve STR kendi verisini üretmez; başka modüllerin verisini okur. Bu üç modül **okuma modeli** kullanır: olaylarla beslenen, yalnız okunan türetilmiş tablolar.

- Okuma modeli **kaynak değildir**: her zaman olaylardan yeniden kurulabilir. Çelişki çıkarsa kaynak modülün verisi doğrudur.
- Okuma modeli kullanıcının yetkisini taşır; satır görünürlüğü kaynak kayıttan gelir (`docs/domain/PERMISSION_MATRIX.md`).
- "Bugün" ekranı, sistem gözü, şantiye tanı kartı ve sağlık karnesi bu modelden okur; on beş modüle tek tek sorgu atmaz.
- Rapor rakamı ile kaynak ekranın rakamı ayrışırsa bu bir hatadır: okuma modeli yeniden kurulur, fark denetim kaydına yazılır (REQ-NFR-002: tek resmî kayıt).

## 5. Sözleşme testleri (D-078)

- Her modül `capabilities.ts` dosyasında yeteneklerini ilan eder; bu dosya `docs/requirements/REQ-<KOD>.md`'deki katalogla birebir aynıdır.
- CI'da bir test, ilan ile kodu karşılaştırır: olayın alanları, aksiyonun girdisi ve gerektirdiği yetki, koşul alanının tipi ve veri sınıfı. Ayrışma varsa CI kırılır.
- İkinci test, akış motorunun bilmediği bir aksiyonu veya koşul alanını kullanan akış tanımını reddeder.
- Üçüncü test, bir modülün başka bir modülün tablosuna eriştiğini yakalar (veri katmanı erişimi modül adıyla etiketlenir).

## 6. Modül sınır özeti

"Dışa verdiği" sütunu örnek niteliğindedir; tam liste her modülün yetenek kataloğu ve `index.ts`'idir.

| Modül | Sahibi olduğu veri | Dışa verdiği (örnek) | Dinlediği |
|---|---|---|---|
| IAM | Kullanıcı, rol, yetki tipi, rol ataması, vekâlet, oturum | `getUserScope`, `hasPermission`, `getRoleHolders` | `employee.leaving_date_set` (HR) |
| AUD | Değişiklik geçmişi, denetim kaydı, revizyon talebi | `recordChange`, `getHistory`, `openRevisionRequest` | Tüm modüllerin yazma olayları |
| DOC | Belge, sürüm, belge-kayıt bağı | `attachDocument`, `getDocuments`, `searchDocuments` | — |
| WFL | Akış tanımı ve sürümü, akış örneği, onay, kilit | `startFlow`, `getApprovals`, `isLocked` | Katalogdaki her olay (tetikleyici) |
| TSK | Görev, bildirim, eskalasyon, günlük özet | `openTask`, `completeTask`, `notify` | `meeting_decision.created`, `nonconformity.opened`, … |
| ADM | Katalog, reçete, özel alan tanımı, takvim, kur, eşik | `getCatalog`, `getRate`, `getWorkingDays`, `getRule` | — |
| PRJ | Proje, duvar, hedef, revizyon, tedarik matrisi, teknik ofis işi | `createDraftProject`, `getProjectTargets`, `getWalls` | `quote.won`, `lead.won` |
| SIT | Günlük saha kaydı ve bölümleri, şantiye, bekleme kaydı | `getApprovedProduction`, `getSiteTimesheet`, `getConsumption` | `project.created`, `stock_movement.recorded` |
| INV | Malzeme, stok defteri, sevkiyat, sayım, fire/hurda | `getStock`, `reserveMaterial`, `getUnitCost` | `daily_site_log.approved`, `purchase_order.received` |
| PUR | Tedarikçi, sipariş, satın alma talebi | `getOpenOrders`, `getSupplierScore` | `stock.below_critical` |
| FAC | Fabrika günlük kaydı, üretim partisi, birim maliyet | `getFactoryUnitCost`, `getBatchChain` | `purchase_order.received` |
| EQP | Varlık, transfer, zimmet, bakım, vinç kaydı | `getAssetsAtSite`, `getCustody`, `getIdleAssets` | `employee.leaving_date_set`, `daily_site_log.approved` |
| CRM | Talep, iletişim günlüğü, firma kartı, ihale | `getClientScorecard`, `getLead` | `quote.sent`, `quote.won`, `client_progress_payment.overdue` |
| QTE | Teklif, sürüm, satış siparişi, maliyet geri beslemesi | `getWonQuote`, `getQuoteItems` | `project.stage_changed` |
| FIN | Hakediş, gelir/gider, cari, ödeme, projeksiyon, dönem | `getProjectProfitLoss`, `getCashProjection`, `isPeriodClosed` | `daily_site_log.approved`, `stock_movement.recorded`, `payroll.approved`, `asset.*` |
| HR | Personel, puantaj, bordro, izin, kontrol listesi | `getEmployee`, `getTimesheet`, `getPayrollCost` | `daily_site_log.approved`, `asset.assigned` |
| CMP | Sözleşme, yükümlülük, teminat, süreli belge, gecikme dosyası | `getObligations`, `getContractTerms`, `getPenaltyRisk` | `client_wait.recorded`, `contract.signed`, `project.stage_changed` |
| QHS | Sertifika, kalite kontrolü, uygunsuzluk, İSG olayı, eğitim | `getCertificates`, `getOpenNonconformities` | `daily_site_log.approved`, `stock_movement.recorded` |
| MTG | Toplantı, tutanak, karar | `getOpenDecisions` | `task.completed` |
| SUP | Destek talebi, mesaj, sevk | `getOpenTickets` | — |
| RPT | Okuma modelleri, kayıtlı görünümler, resmî günlük rapor | `getIndicator`, `getReport`, `getAttentionItems` | Tüm modüllerin olayları |
| PRF | KPI kataloğu, aylık puan, prim | `getScore`, `getBonus` | `daily_site_log.approved`, `nonconformity.opened`, `task.overdue` |
| INT | Öneri, transfer önerisi, hızlandırma senaryosu | `getRecommendations`, `getScenarios` | RPT okuma modeli olayları |
| STR | Yıllık hedef, bütçe ve revizyonu, yatırım analizi, sağlık karnesi | `getBudgetVariance`, `getHealthScorecard` | `period_close.closed`, `budget.approved` |

## 7. Sınır ihlali sayılan şeyler

- Başka modülün tablosuna `select` atmak (okuma modeli de dahil: okuma modeli RPT'nindir).
- Başka modülün iç fonksiyonunu `index.ts` dışından çağırmak.
- Katalogda ilan edilmemiş bir aksiyonu akışa açmak.
- Bir modülün olayını dinleyip o modülün verisini kendi tablosunda **kaynak** gibi saklamak (türetilmiş kopya serbesttir, kaynak sayılmaz).
- Grafikte olmayan yönde bağımlılık kurmak.
