# SPIKE-10 — Sunucuda üretilen PDF kalitesi

Durum: GEÇTİ (üretim yazı tipi Geist ile, 2026-09-21; güncel sonuç belgenin son bölümündedir — önceki "tam dosya gerekir" koşulu ve "Kusur 2" orada düzeltilmiştir) · Tarih: 2026-09-21 · İlgili: `DocumentRenderer` portu (`docs/architecture/PORTS_AND_SERVICES.md`), REQ-QTE, REQ-RPT

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

## Kök neden bulundu, üretim yazı tipiyle geçti · 2026-09-21 (ikinci tur)

Bu bölüm yukarıdaki iki bölümün sonuçlarını **düzeltir**. Hem ilk rapordaki "tam yazı tipi dosyası gömülmeli" koşulu hem de aynı gün yazılan "Kusur 2" yanlış bir nedene dayanıyordu. İkisi de silinmedi; tarihsel kayıt olarak yukarıda durur ve bu bölümle geçersiz sayılır.

### Yazı tipi: sorun alt küme değil, eksik alt kümeydi

İlk rapor, `next/font` alt kümesinin "sessizce Times New Roman'a düştüğünü" gözleyip **tam dosya gerektiği** sonucuna varmıştı. Gözlem doğru, çıkarım yanlıştı.

`next/font`, Geist için alt küme başına ayrı bir woff2 üretir ve her birine `unicode-range` verir. Uygulamanın kendi ayarı zaten doğrudur: `src/app/layout.tsx` içinde `subsets: ["latin", "latin-ext"]`. Üretilen CSS okunduğunda:

| Dosya | Alt küme | Kapsadığı Türkçe harfler |
|---|---|---|
| `caa3a2e1…` (29.288 bayt, önceden yüklenen) | `latin` | ç ö ü Ç Ö Ü ve **ı** (U+0131) |
| `7178b3e5…` | `latin-ext` | **ğ ş İ Ğ Ş** (U+011E–U+015F) |

Deneydeki `geist.woff2` birinci dosyanın birebir kopyasıdır (aynı boyut). Deney yalnız onu, `unicode-range` olmadan gömmüştü; tarayıcı ikinci dosyanın varlığından habersiz olduğu için ğ/ş/İ'yi yedek yazı tipine düşürdü.

Bu, keskin bir tahminle sınandı ve **tahmin birebir tuttu** (`pdf-font-coverage.mjs`, 6/6):

| Metin | Sonuç |
|---|---|
| Yalnız ASCII | yedek yok — alt küme çalışıyor |
| `ç ö ü Ç Ö Ü` (U+00xx) | yedek yok |
| `ğ ı ş Ğ İ Ş` | Times New Roman'a düştü |
| Tam Arial TTF ile Türkçe | yalnız Arial |

Ardından `next/font`'un kurallarını birebir taklit eden bir deneyle çözüm doğrulandı (`pdf-geist-full.mjs`, 3/3): `ı` tek başına `latin` dosyasında bulundu; yalnız `latin` ile tam Türkçe metin Times'a düştü (hata yeniden üretildi); **`latin` + `latin-ext` birlikte, kendi `unicode-range`'leriyle, tam Türkçe metni hiçbir yedek yazı tipi olmadan** çıkardı.

### İki belge üretim yazı tipiyle yeniden üretildi

Teklif ve günlük rapor, sistem yazı tipi ve tescilli Arial tamamen çıkarılarak, projenin kendi Geist dosyalarıyla yeniden üretildi (`pdf-html-geist.mjs`, `pdf-daily-geist.mjs`). Sonuç:

| Kontrol | Teklif | Günlük rapor |
|---|---|---|
| Üretim süresi | 525 ms | 487 ms |
| Dosya boyutu | 135 KB | 240 KB |
| Gömülen sistem yazı tipi | **yok** | **yok** |
| Üstbilgi / altbilgi yazı tipi | Geist | Geist, "Şereflikoçhisar" dahil |
| Sayfa ölçüsü | 596×842 pt | 842×596 pt, iki sayfa |
| Tekrar eden tablo başlığı | — | var |
| Sayfa kırılması sürekliliği | — | sayfa 1 D-2 / %37,0 / 246 ile biter, sayfa 2 D-3 / %38,0 / 249 ile başlar; 23 + 11 = 34 satır |

Dört sayfa da görüntüye çevrilip incelendi; taşma, kırpılma veya farklı yazı tipinden gelen glif yok. Geist, Arial'dan biraz daha geniş olduğu için sayfa 1'e 25 yerine **23 satır** sığdı ve teklifin giriş paragrafı farklı yerden kırıldı. Bu bir kusur değil; tam tersine düzenin neden **üretim yazı tipiyle** doğrulanması gerektiğinin somut kanıtıdır. Sistem yazı tipiyle yapılan önceki ölçümler bu yüzden temsil edici değildi.

### Metin katmanı: kusur benim çıkarma yöntemimdeydi

Aynı gün yazılan "Kusur 2", günlük raporun metin katmanının `Panel t i p i`, `B i t i ş`, `Ek i p` biçiminde parçalandığını ve arşiv aramasının bunları bulamayacağını söylüyordu. **Bu bulgu yanlıştı ve geri alınır.**

Çıkarılan metin parçalarını arada boşlukla birleştiriyordum. Gerçek bir dizinleyici ise parçaları konuma göre birleştirir: aynı satırda ve aralarında görünür boşluk yoksa bitiştirir. İki yöntem dört PDF üzerinde karşılaştırıldı (`pdf-textlayer.mjs`):

| Belge | Boşlukla birleştirme | Konuma göre birleştirme |
|---|---|---|
| Teklif, Segoe UI | 9/9 | 9/9 |
| Teklif, Geist | 3/9 | **9/9** |
| Günlük rapor, Arial | 7/10 | **10/10** |
| Günlük rapor, Geist | 5/10 | **10/10** |

Konuma göre birleştirmede **her sözcük her belgede bulunuyor.** PDF'teki karakterler doğru (ş gerçekten U+015F) ve doğru yerde; bölünme yalnız çıkarma sırasında oluşuyordu. Geist'te bölünme daha sık görülür, çünkü ğ/ş/İ ayrı `latin-ext` dosyasından çizildiği için PDF'te ayrı bir metin koşusu olur (`Biti` + `ş`, `İ` + `lerleme`).

Geriye kalan gerçek gereksinim bir kusur değil, bir tasarım kuralıdır: **arşiv dizinleyicisi PDF metnini konuma göre birleştirmelidir.** Üretim yazı tipiyle bu kural zorunludur; aksi halde ğ, ş veya İ içeren her sözcük aramada kaybolur.

### Bir incelik: Type3

Chrome, Geist'i **Type3** yazı tipi olarak gömüyor (FontFile akışı yok). Geist değişken bir yazı tipi olduğundan tarayıcının PDF motoru onu sabit TrueType olarak gömemiyor. Type3 glifleri vektördür; 2× görüntülerde keskin çıktı ve metin çıkarımı doğru çalıştı. Ancak bazı arşiv biçimi doğrulayıcıları ve eski yazıcılar Type3'e daha kötü davranabilir. Belgelerin ileride PDF/A gibi bir arşiv biçiminde saklanması gerekirse, Geist'in sabit (değişken olmayan) bir örneğiyle ayrıca sınanmalıdır. Bu bir geçme koşulu değil, taşınan bir nottur.

### Sonuç: GEÇTİ

Soru — teklif belgesi ve resmî günlük rapor Türkçe karakterlerle, tablo düzeni bozulmadan, A4'te doğru çıkıyor mu — **üretimde kullanılacak yazı tipiyle** evet olarak cevaplandı. TASK-0080 kapanır.

Aynı gün yazılan "üç çıkış koşulu" şöyle sonuçlandı:

1. Paketlenebilir OFL yazı tipiyle yeniden üretim → **yapıldı ve geçti**; tam TTF veya tescilli Arial gerekmiyor.
2. Metin çıkarımının parçalanmadığının gösterilmesi → **kusur olmadığı gösterildi**; kural konuma göre birleştirmedir.
3. Linux'ta Chromium kurulum boyutu → spike'ın geçme ölçütü değil, barındırma kararının girdisidir. Barındırma D-245 ile ertelendiği için DEF-008 altında kalır; burada doğrulanamaz.

### Phase 07/08'e taşınan notlar (yukarıdaki listeye ek)

5. PDF şablonları, uygulamanın kullandığı aynı Geist `latin` + `latin-ext` dosyalarını, `next/font`'un ürettiği `unicode-range` kurallarıyla yükler. Tek bir alt küme dosyası seçmek Türkçe harfleri bozar.
6. Chrome'un üstbilgi/altbilgi şablonları sayfanın `@font-face` kurallarını miras almaz. Şablonlara aynı yüzler ayrıca verilmelidir; verilmezse "Şereflikoçhisar" gibi başlıklar sistem yazı tipine düşer.
7. Arşiv içerik araması (REQ-DOC-004) PDF metnini konuma göre birleştirir; parçaları boşlukla birleştiren bir dizinleyici Türkçe sözcükleri kaybeder. Bu, dizinleyicinin otomatik testiyle korunmalıdır.
8. Sayfa düzeni ve kırılmaları üretim yazı tipiyle doğrulanır; başka yazı tipiyle alınan ölçüm geçerli sayılmaz.
9. Geist Type3 olarak gömülür; arşiv biçimi gerekirse sabit bir örnekle ayrıca sınanır.

Kanıt ve betikler dış scratchpad'de: `pdf-font-coverage.mjs`, `pdf-geist-full.mjs`, `geist-faces.mjs`, `pdf-html-geist.mjs`, `pdf-daily-geist.mjs`, `pdf-textlayer.mjs`, `pdf-textprobe.mjs`, `nextfont/` (projenin ürettiği woff2 dosyalarının kopyası), `render/*geist*.png` ve zaman damgalı JSON kanıtları.
