# SPIKE-11 — TCMB kuru

Durum: GEÇTİ · Tarih: 2026-09-20 · İlgili: REQ-ADM-013, REQ-ADM-014, REQ-ADM-015, ADM-K4

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
