# SPIKE-11 — TCMB kuru

Durum: GEÇTİ (eksik kur zinciri 2026-09-21'de 30 kontrolle sinandi; gerçek kalıcılık Phase 07'ye kalır) · Tarih: 2026-09-21 · İlgili: REQ-ADM-013, REQ-ADM-014, REQ-ADM-015, ADM-K4

**Soru.** TCMB döviz alış kuru her iş günü güvenilir alınıyor mu? Alınamadığında `exchange_rate.missing` çıkıp tutarlar "kur bekliyor" işaretleniyor ve ertesi gün kendiliğinden tamamlanıyor mu?

**Yöntem.** TCMB'nin yayımladığı XML dosyaları doğrudan çağrıldı: güncel dosya ve son 10 günün tarihli dosyaları; ayrıca 15 ardışık istekle güvenilirlik ölçüldü. Deneme kodu geçici klasörde; ürüne girmedi.

## Sonuçlar

| Ölçüm | Sonuç |
|---|---|
| Güncel dosya | HTTP 200, 145 ms, 22 para birimi |
| 15 ardışık istek | 15 başarılı, 0 başarısız · medyan 30 ms · en yavaş 136 ms |
| Son 10 gün | 7 günde dosya var, 3 günde yok (19 ve 13 Eylül cumartesi–pazar, 12 Eylül cumartesi) |
| Kur alınamayan gün | HTTP 404, ~30 ms — hata değil, "o gün yayın yok" demek |
| Alanlar | `ForexBuying` (döviz alış), `ForexSelling`, `BanknoteBuying`, `BanknoteSelling`, `Unit`, `Isim` |
| Örnek | 18.09.2026 · USD alış 48,6116 · EUR alış 55,7981 |

Gereksinimin istediği alan `ForexBuying`'dir (döviz alış, REQ-ADM-013).

## Üç tuzak

**1. "Güncel dosya" her zaman dün değildir.** `today.xml`, TCMB'nin **en son yayımladığı** bülteni verir. Yayın saat 15.30 civarındadır: sabah çağrıldığında dünün, akşam çağrıldığında bugünün bülteni gelir. Kural "önceki iş gününün kuru" olduğuna göre kur, **tarihli dosya adresiyle** istenmeli ve dosyadaki tarih alanı doğrulanmalıdır. Güncel dosyaya körlemesine güvenmek, günün ortasında kurun değişmesi demektir.

**2. Tarih biçimi iki türlü yazılıyor.** Dosyada hem `Tarih="18.09.2026"` (gün.ay.yıl) hem `Date="09/18/2026"` (ay/gün/yıl) var. Yanlış alanı okumak 9 Eylül ile 18 Eylül'ü karıştırır. Panel `Tarih` alanını okuyup kendi tarihiyle karşılaştırmalı.

**3. Birim (`Unit`) hesaba katılmalı.** Bazı para birimleri 100 birim üzerinden yayımlanır (ör. JPY). TL karşılığı `ForexBuying / Unit` ile bulunur.

## Karar

`ExchangeRateProvider` portunun TCMB adaptörü uygulanabilir ve hızlıdır. Kurallar:

- Kur, **tarihli dosya adresinden** istenir; dosyadaki `Tarih` alanı beklenen iş gününe eşit değilse kur yazılmaz.
- 404 bir hata değildir: o gün yayın yok demektir. İş günü takvimi ADM'dedir (`CONFIGURATION.md`); hafta sonu ve resmî tatil zaten kur beklemez.
- İş gününde dosya gelmiyorsa artan aralıklarla yeniden denenir (10 dk, 30 dk, 1 saat). Gün sonunda hâlâ yoksa `exchange_rate.missing` yayımlanır ve dövizli tutarlar "kur bekliyor" olur (ADM-K4).
- Kur geldiğinde bekleyen tutarlar tamamlanır; onaylanmış kayıtlar kendi kurlarını taşıdığı için değişmez (REQ-ADM-015).
- İstek iş kuyruğunda çalışır, kullanıcı isteği yolunda değil (`PORTS_AND_SERVICES.md` bölüm 6).

## Ölçümün sınırları

Bir günlük gözlem; TCMB'nin uzun süreli kesintisi denenmedi. Bu yüzden "gün sonunda hâlâ yoksa" kuralı tasarımın parçası olarak kaldı: panelin davranışı kesintiye değil, kurun yokluğuna bağlıdır.

2026-09-20 öz inceleme düzeltmesi: sağlayıcı yanıtları ve XML gözlemleri, `exchange_rate.missing` olayı, bekleyen tutarlar ve sonraki gün kendiliğinden tamamlama zincirini sınamıyor. Önceki GEÇTİ sonucu geri alındı. TASK-0081 bu üç davranışın otomatik testleriyle tamamlanacak; kabul ölçütü daraltılmadı.

## Eksik kur, bekleyen tutar ve kendiliğinden tamamlama — sınandı · 2026-09-21

Geri alınan üç davranış otomatik kontrollere bağlandı. Betik `tcmb3.mjs` iki bölümden oluşur ve **30 kontrolün tamamı geçti** (`tcmb3-evidence-*.json`).

### A) Canlı TCMB gözlemi — üç tuzak doğrulandı

Gerçek servise dört salt okunur istek yapıldı; kimlik doğrulama veya kişisel veri yoktur.

| Kontrol | Sonuç |
|---|---|
| L1 · Tarihli dosyanın `Tarih` alanı istenen iş gününe eşit | 18.09.2026 istendi, 18.09.2026 geldi |
| L2 · `Tarih` (gg.aa.yyyy) ve `Date` (aa/gg/yyyy) birlikte var, biçimleri farklı | `Tarih="18.09.2026"`, `Date="09/18/2026"` |
| L2b · `Date` gün/ay ters okunursa başka bir güne işaret eder | karıştırma riski gerçek |
| L3 · En az bir para birimi `Unit` ≠ 1 ile yayımlanıyor | JPY `Unit=100`, alış 30,7666 |
| L3b · TL karşılığı `ForexBuying / Unit` | 0,307666 |
| L4 · `ForexBuying` alanı mevcut | USD 48,6116 |
| L5 · Hafta sonu tarihli dosya 404 döner | 20.09.2026 pazar → 404 |
| L6 · **Tuzak 1 canlı yakalandı** | Yerel saat 02:30 pazartesi 21.09'da `today.xml` **18.09.2026** bültenini verdi, 21.09 tarihli dosya ise 404 |

L6 tuzağın neden gerçek olduğunu tek başına gösteriyor: güncel dosyaya güvenen bir uygulama, pazartesi sabahı cuma kurunu pazartesinin kuru sanardı. Kural bu nedenle "tarihli dosyayı iste, `Tarih` alanını doğrula" olarak kalır.

### B) Durum makinesi — eksik kur zinciri

Enjekte edilen sahte sağlayıcı, takvim ve saat ile 22 kontrol:

| Senaryo | Doğrulanan |
|---|---|
| S1 | Kur ilk denemede gelirse tek istek yapılır, olay yayımlanmaz |
| S2 | Hafta sonunda istek de olay da yoktur |
| S3 | İş günü boyunca 404: dört deneme, aralıklar 10/30/60 dk (0., 10., 40., 100. dakika), hepsi gün sonundan önce |
| S3b | Gün sonunda **tam olarak bir** `exchange_rate.missing` yayımlanır |
| S3c | Kuru olmayan tutarlar "kur bekliyor" olur |
| S3d | Onaylanmış kayıt kendi kurunu korur (REQ-ADM-015) |
| S3e | Tekrar denemede ikinci bir `missing` olayı yayımlanmaz |
| S4b | Kur geldiğinde bekleyen tutarlar kendiliğinden tamamlanır |
| S4c | USD çevrimi doğru: 1.000 × 48,6116 = 48.611,60 |
| S4d | JPY çevriminde `Unit` hesaba katılır: 10.000 × 0,329 = 3.290 |
| S4e | Onaylanmış kayıt tamamlamadan etkilenmez |
| S4f | İkinci tamamlama çalıştırması hiçbir şeyi yeniden çevirmez |
| S5 | Yanlış günün bülteni gelirse kur **yazılmaz** ve bu da eksik kur sayılır (Tuzak 1) |
| S6 | `Tarih` doğru günü verir; `Date` ters okunursa başka gün çıkar (Tuzak 2) |
| S7 | İkinci denemede gelen kur 10. dakikada yazılır, `missing` yayımlanmaz |
| S8 | Kur zaten varsa iş tekrar çalıştığında yeni istek yapılmaz |

### İki düzeltme, açıkça kaydedilir

**1. Testin kendi tarih hatası.** İlk sürüm tarihleri `toISOString()` ile üretiyordu, yani UTC. Yerel saat 02:30 GMT+3 olduğu için betik "bugün" olarak bir önceki günü aldı ve son iş gününü 18.09 yerine 17.09 hesapladı. Kontrol yine de geçmişti, çünkü hem istek hem beklenti aynı kaymayı taşıyordu — yani yeşil bir kontrol yanlış günü doğruluyordu. TCMB iş günü takvimi Türkiye yerel saatine göre işler; betik yerel tarih üretimine çevrildi. Bu, spike'ın konusu olan tarih hatası sınıfının canlı bir örneğidir ve ürün adaptörü için de geçerlidir: **iş günü hesabı asla UTC üzerinden yapılmamalıdır.**

**2. Yeniden deneme aralığı belirsizliği.** Rapordaki "artan aralıklarla yeniden denenir (10 dk, 30 dk, 1 saat)" iki türlü okunabilir: denemeler 0/10/30/60. dakikada ya da aralıklar 10/30/60 dakika olacak şekilde 0/10/40/100. dakikada. Aralık okuması uygulandı. Fark iş sonucunu değiştirmez — her iki okumada da son deneme gün sonundan çok önce biter ve `exchange_rate.missing` aynı gün yayımlanır. Bu bir işletim parametresidir; iş kuyruğu kurulurken yönetici ayarı olarak kesinleştirilir. Kritik belirsizlik sayılmadığı için `OPEN_QUESTIONS` kaydı açılmadı.

### Sınırlar

B bölümü **bellekte** çalışır. Gerçek kalıcılık, gerçek iş kuyruğu, gerçek olay veriyolu ve eşzamanlı çalıştırma sınanmadı; bunlar Phase 07 adaptör testlerine aittir ve orada `ExchangeRateProvider` portu için tekrar doğrulanmalıdır. Kontroller, belgelenen kuralların kendi içinde tutarlı olduğunu ve tuzakların gerçek olduğunu gösterir; uygulamanın doğruluğunu göstermez. TCMB'nin uzun süreli kesintisi hâlâ denenmedi; panelin davranışı kesintiye değil kurun yokluğuna bağlı olduğu için bu tasarımın parçası olarak kalır.

Kanıt ve betikler dış scratchpad'de: `tcmb3.mjs`, `tcmb3-evidence-*.json`; önceki gözlemler `tcmb.mjs` ve `tcmb2.mjs`.
