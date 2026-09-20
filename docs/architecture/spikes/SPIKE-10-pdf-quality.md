# SPIKE-10 — Sunucuda üretilen PDF kalitesi

Durum: GEÇTİ (iki koşulla) · Tarih: 2026-09-20 · İlgili: `DocumentRenderer` portu (`docs/architecture/PORTS_AND_SERVICES.md`), REQ-QTE, REQ-RPT

**Soru.** Teklif belgesi ve resmî günlük rapor, Türkçe karakterlerle ve tablo düzeni bozulmadan, A4'te basılabilir kalitede üretilebiliyor mu?

**Yöntem.** Deneme kodu geçici klasörde (ürüne girmedi). İki belge üretildi: dikey A4 fiyat teklifi (6 kalem, para sütunları, KDV toplamları, şartlar listesi) ve yatay A4 günlük saha raporu (13 sütun, 34 satır). Yol: HTML → PDF, başsız Chrome (`puppeteer-core`, sistemdeki Chrome). Sonuçlar hem bayt düzeyinde (gömülü yazı tipi akışları) hem metin çıkarımıyla (pdf.js) denetlendi.

## Sonuçlar

| Ölçüm | Fiyat teklifi | Günlük rapor |
|---|---|---|
| Üretim süresi | 638 ms | 582 ms |
| Dosya boyutu | 81 KB | 248 KB |
| Sayfa | 1 · 596×842 pt (A4) | 2 · 842×596 pt (yatay A4) |
| Üstbilgi / altbilgi, sayfa numarası | Var | Var |
| Tablo başlığının her sayfada tekrarı | — | Var |
| Türkçe karakterler | ÇĞİÖŞÜ çğıöşü doğru | Şereflikoçhisar, İlerleme, Parçalı bulutlu doğru |
| Metin seçilebilir ve aranabilir | Evet | Evet |
| Gömülü yazı tipi | 4 alt küme | 2 alt küme |

Sayfa ölçüsü, kenar boşlukları, sağa hizalı para sütunları, binlik ayraçlı sayılar ve satır kırılmaları bozulmadı.

## İki koşul

**1. Tam yazı tipi dosyası gömülmeli.** Uygulamanın çalışma zamanında kullandığı `next/font` alt kümeleri bu iş için yetmiyor: denemede 12–29 KB'lik alt küme dosyaları yüklendi (tarayıcı "loaded" dedi) ama PDF'e **Times New Roman** olarak düştü ve metin çıkarımı bozuldu. Tam bir yazı tipi dosyası gömüldüğünde hem görünüm hem metin çıkarımı düzeldi. Belgeler için Geist'in tam dosyası (OFL lisanslı) uygulamayla birlikte taşınmalı; sistem yazı tipine (Segoe UI, Arial) güvenilmemeli — Linux sunucuda bulunmaz.

**2. Sunucuda Chromium gerekiyor.** Bu yol başsız bir tarayıcı ister; sunucu kurulumuna yaklaşık 170 MB'lik bir bileşen ve birkaç sistem kütüphanesi ekler. Bu, sunucu kararının (DEF-008) parçası olmalı. Ölçüm Windows'ta sistemdeki Chrome ile yapıldı; Linux'ta kurulum boyutu doğrulanmadı.

## Karar

`DocumentRenderer` portunun ilk adaptörü **başsız tarayıcıyla HTML → PDF** olarak kalıyor. Gerekçe: tablo, sayfa kırılması, tekrar eden başlık, üstbilgi/altbilgi ve Türkçe tipografi HTML/CSS'te zaten çözülmüş; aynı şablonlar ekranda önizlenebiliyor. Programatik çizim kütüphanesi (pdfkit) denenmedi; tablo düzenini elle kurmayı gerektirdiği için ikinci sıradadır ve yalnız Chromium bağımlılığı kabul edilemez bulunursa değerlendirilir.

## Phase 07/08'e taşınan notlar

1. Belge yazı tipi uygulamayla birlikte paketlenir; şablonlarda sistem yazı tipi adı yazılmaz.
2. PDF üretimi iş kuyruğunda çalışır, istek yolunda değil (`PORTS_AND_SERVICES.md` bölüm 6); tarayıcı örneği yeniden kullanılır, belge başına yeniden başlatılmaz.
3. Üretilen belge arşive kaydın altına yazılır ve sürümlenir (DOC-K4); metin katmanı aranabilir olduğu için arşiv içerik aramasına da girer (REQ-DOC-004).
4. Sunucu kararı alınırken Chromium bağımlılığı ve bellek ihtiyacı hesaba katılır (DEF-008).
