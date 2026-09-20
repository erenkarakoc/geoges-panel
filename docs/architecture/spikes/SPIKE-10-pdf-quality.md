# SPIKE-10 — Sunucuda üretilen PDF kalitesi

Durum: İNCELEMEDE (görsel doğrulama yapıldı; yazı tipi kökeni ve metin katmanı açık) · Tarih: 2026-09-21 · İlgili: `DocumentRenderer` portu (`docs/architecture/PORTS_AND_SERVICES.md`), REQ-QTE, REQ-RPT

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

2026-09-20 öz inceleme düzeltmesi: sayfa ölçüsü ve metin çıkarımı doğrulandı; sayfalar görüntüye dönüştürülüp incelenmedi. Kenar boşlukları, sütun hizası ve satır kırılmalarının görsel olarak bozulmadığı henüz kanıtlanmadı. Önceki GEÇTİ sonucu bu nedenle geri alındı; iki PDF bütün sayfalarıyla görsel olarak incelenmeden TASK-0080 kapanmaz.

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

## Görsel doğrulama yapıldı — iki yeni kusur bulundu · 2026-09-21

Eksik olan adım tamamlandı: her iki PDF'in **bütün sayfaları** `pdfjs-dist` ve `@napi-rs/canvas` ile 2× ölçekte görüntüye çevrilip incelendi (`pdf-render.mjs`, çıktılar `render/` altında). Bu, PDF'in kendi sayfa içeriğini inceler; HTML'i yeniden ekrana basmaz.

### Görsel inceleme sonucu: geçti

| Kontrol | Fiyat teklifi (1 sayfa) | Günlük rapor (2 sayfa) |
|---|---|---|
| Sayfa ölçüsü | 596×842 pt, dikey A4 | 842×596 pt, yatay A4, iki sayfa da |
| Üstbilgi | "GEOGES Panel · TKF-2026-0147" | "GEOGES Panel · Günlük saha raporu · Şereflikoçhisar", iki sayfada da |
| Altbilgi / sayfa no | "Sayfa 1 / 1" | "Sayfa 1/2" ve "Sayfa 2/2" |
| Tablo başlığının tekrarı | — | **Var**, sayfa 2'de eksiksiz 13 sütun |
| Sütun hizası | sayısal sütunlar sağa, metin sola | iki sayfada da birebir aynı sütun genişlikleri |
| Kenar boşlukları | dengeli, taşma yok | dengeli, taşma yok |
| Metin kırpılması / üst üste binme | yok | yok |
| Türkçe tipografi | Şereflikoçhisar, İnşaat, Söğütözü, Çığır Yapı A.Ş., ÇĞİÖŞÜ çğıöşü doğru | Şereflikoçhisar, İlerleme, Başlangıç, Kalıp yağı sapması, döküm doğru |
| Özel işaretler | × ve — doğru | m², °C, × doğru |

Sayfa kırılmasında satır kaybı veya tekrarı yok: sayfa 1 D-4 / %39,0 / toplam adet 252 ile biter, sayfa 2 D-5 / %40,0 / 255 ile başlar ve üçer artış düzeni korunur. 25 + 9 = 34 satır, beklenen satır sayısıyla aynıdır.

Teklifin aritmetiği de denetlendi: altı kalemin miktar × birim fiyat çarpımlarının hepsi doğru, toplamları 12.045.354,00 ara toplamı veriyor, %20 KDV 2.409.070,80 ve genel toplam 14.454.424,80 tutarlı. Bu bir iş kuralı doğrulaması değil, şablonun sayıları bozmadığının kontrolüdür.

### Kusur 1 — ölçülen belgeler paketlenemeyecek yazı tipleri kullanıyor

Görsel inceleme sırasında belgelerin hangi yazı tipiyle üretildiği denetlendi ve **raporun kendi koşuluna aykırı** olduğu görüldü:

| Belge | HTML'deki tanım | PDF'e gömülen |
|---|---|---|
| Fiyat teklifi | `font-family: "Segoe UI", Arial, sans-serif`, `@font-face` yok | SegoeUI, SegoeUI-Bold, SegoeUI-Semibold, ArialMT — dördü de Windows sistem yazı tipi |
| Günlük rapor | `@font-face` ile `test-full.ttf` gömülü | ArialMT, iki alt küme |

`test-full.ttf` dosyasının name tablosu okundu: **Arial Regular, Version 7.06, © Monotype Corporation**. Yani "tam yazı tipi dosyası gömüldü" bulgusunun dayandığı dosya, Windows'tan kopyalanmış tescilli Arial'dır ve ürünle birlikte dağıtılamaz.

Raporun önerdiği OFL lisanslı Geist ise yalnız `next/font` alt kümesi (`geist.woff2`, 29 KB) olarak denendi — yani tam olarak **başarısız olan** durum. Projede paketlenebilir tam bir yazı tipi dosyası bulunmuyor; `next/font` yalnız woff2 alt kümeleri üretiyor.

**Sonuç:** "alt küme yetmez, tam dosya çalışır" tanısı geçerlidir, ama üretimde kullanılacak yapılandırma — sistem yazı tipi olmadan, paketlenebilir OFL bir yazı tipiyle, tam belgede — **hiç sınanmadı.** Linux sunucuda Segoe UI ve Arial bulunmayacağı için ölçülen iki belge üretim koşullarını temsil etmiyor.

### Kusur 2 — metin katmanı iddia edilen kadar aranabilir değil

Günlük raporun metin çıkarımında üç başlık hücresi harflerine ayrılıyor:

- `Panel tipi` → `Panel t i p i`
- `Bitiş` → `B i t i ş`
- `Ekip` → `Ek i p`

Sayfa görüntüsünde bu başlıklar doğru görünüyor; kusur yalnız metin katmanındadır. Sonucu şudur: arşivde **`tipi`, `Bitiş` veya `Ekip` aranırsa bu belge bulunmaz.** Bu, raporun "metin katmanı aranabilir olduğu için arşiv içerik aramasına da girer (REQ-DOC-004)" ifadesiyle çelişir.

Fiyat teklifinde aynı kusur görülmedi. Neden yalıtılmadı; büyük olasılıkla 8,5 punto gövde ölçüsünde tarayıcının alt piksel yerleştirmesi, çıkarıcının harf araları eşiğini aşıyor. Kesin neden ve çözüm, üretimde kullanılacak yazı tipiyle ve gerçek arşiv arama uygulamasıyla birlikte doğrulanmalıdır; ölçüm aracı olarak burada pdf.js kullanıldı, başka bir çıkarıcı farklı davranabilir.

### Durum

Görsel doğrulama eksiği kapandı. Buna karşılık iki yeni koşul açıldığı için **TASK-0080 REVIEW olarak kalır**; kapanması için gerekenler:

1. Paketlenebilir OFL bir yazı tipinin tam dosyasıyla, sistem yazı tipine hiç başvurmadan iki belgenin yeniden üretilmesi ve yeniden görsel olarak incelenmesi.
2. Aynı üretimde metin çıkarımının parçalanmadığının, özellikle dar başlık hücrelerinde, gösterilmesi.
3. Linux'ta Chromium kurulum boyutunun doğrulanması — bu DEF-008 kapsamında kalır.

`DocumentRenderer` portunun başsız tarayıcı yönü değişmedi; bulunan iki kusur yön değil uygulama koşullarıdır. Hiçbir gereksinim gevşetilmedi, ürün kodu yazılmadı.

Kanıt ve betikler dış scratchpad'de: `pdf-render.mjs` ve `render/*.png` (dört sayfa görüntüsü), `pdf-render-report.json`, `pdf-textdefect.mjs`, `font-identify.mjs`, mevcut `pdf-check.mjs`.
