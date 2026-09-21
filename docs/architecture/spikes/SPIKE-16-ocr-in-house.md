# SPIKE-16 — Taranmış belgede metin tanıma, panelin kendi altyapısında

Durum: GEÇTİ · Tarih: 2026-09-21 · Görev: TASK-0097 · Bağlı: REQ-DOC-004, D-201

**Soru.** Taranmış belgede metin tanıma panelin kendi altyapısında yapılabiliyor mu? Geçme ölçütü: tipik bir irsaliye ve tartım fişi okunabiliyor; olmuyorsa belge dışarı gönderilmeden önce sahibe sorulacak karar noktası açılır.

**Ölçü.** REQ-DOC-004'e göre metin tanımanın amacı **aranabilirliktir**: taranmış belge, içindeki sözcüklerle bulunabilmeli. Bu yüzden "okunabiliyor", kullanıcının belgeyi arayacağı sözcüklerin (belge no, tarih, firma, şantiye, plaka, malzeme, ağırlık) tanınan metinde bulunması olarak ölçüldü. Eşleştirme aramanın normalleştirmesiyle yapıldı (Türkçe küçük harf ve aksan katlama, D-247); aksanlı tam eşleşme ayrıca raporlandı.

## Yöntem

Deney kodu geçicidir (`spike16.mjs`), ürüne girmedi. Sahibin onayıyla indirilen Tesseract (tesseract.js 7.0.0, Apache-2.0) ile Türkçe ve İngilizce dil modelleri (4.0.0_best_int) yalnız geçici klasöre kuruldu. **Tanıma yerel çalıştı; hiçbir belge makineden dışarı gönderilmedi.**

- **Belgeler sentetiktir** (gerçek kişi veya firma verisi yok): A4 sevk irsaliyesi (kenarlıklı kalem tablosu, Türkçe firma ve şantiye adları, plaka) ve 80 mm'lik termal kantar fişi (eş aralıklı yazı; brüt, dara, net).
- **Üç kalite:** temiz (200 dpi); gerçekçi tarama (150 dpi, 1,5° eğim, gürültü, gri ton, JPEG kalite 0,6); kötü (100 dpi, 3° eğim, yoğun gürültü, termal fiş solması gibi %45 soluklaşma, JPEG kalite 0,4).
- **Tanıma:** iki geçiş (otomatik sayfa bölümleme ve dağınık metin kipi); aramaya iki metnin birleşimi verildi. Ardından genel bir OCR temizliği uygulandı: rakamlar arasındaki noktalamanın çevresindeki boşluk kaldırıldı.

## Sonuçlar — 4/4 kontrol geçti

Bulunan arama terimi sayısı (katlanmış eşleşme). Parantez içinde ham, yani temizlik öncesi değer.

| Kalite | İrsaliye (10 terim) | Kantar fişi (9 terim) | İki geçiş süresi |
|---|---|---|---|
| Temiz | 10/10 | 9/9 | 1,4 sn / 1,4 sn |
| **Gerçekçi tarama** | **10/10** (ham 9/10) | **9/9** | 1,1 sn / 1,0 sn |
| Kötü | 6/10 | 8/9 | 1,1 sn / 0,7 sn |

Aksanlı tam eşleşme, temiz ve gerçekçi taramada da tam puan: ç, ğ, ı, İ, ö, ş, ü doğru tanındı. Tanıma güveni gerçekçi taramada 92–94, kötü taramada 72–78.

| # | Kontrol | Sonuç |
|---|---|---|
| O1 | İrsaliye gerçekçi taramada bütün arama sözcükleriyle bulunur | geçti |
| O2 | Kantar fişi gerçekçi taramada bütün arama sözcükleriyle bulunur | geçti |
| O3 | Temiz görüntüde iki belge de eksiksiz okunur | geçti |
| O4 | Kantar fişinde net ağırlık taramadan ayıklanabilir | `Net: 24.380 kg` |

## Düzenekte yapılan düzeltmeler — açıkça kaydedilir

Deney üç kez, başarısız sonuç görüldükten sonra değiştirildi. Her değişiklik bütün belge ve kalitelere aynı uygulandı; ham sonuçlar kanıt dosyasında duruyor.

1. **Koyu arka plan (düzenek hatası).** İlk koşuda bütün sonuçlar 0 çıktı, temiz görüntüde bile. Görüntü incelendiğinde sayfanın koyu varsayılan arka planla çizildiği, koyu metnin görünmediği anlaşıldı. Arka plan açıkça beyaz yapıldı. Bu bir tanıma sonucu değildi.
2. **Tablo satırları atlanıyordu.** Otomatik bölümleme, kenarlıklı irsaliye tablosunun başlığını ve ilk iki satırını okumadı. Kanıtı: çizgilerin bozulduğu kötü sürümde aynı satırlar okundu. Dağınık metin kipiyle ikinci bir geçiş eklendi. Kötü taramada kazanç belirgin: irsaliye 3/10 → 6/10, kantar fişi 5/9 → 8/9.
3. **Rakamlar arası boşluk.** Gerçekçi taramada tarih `21 .09.2026` olarak okundu: rakamlar doğru, noktadan önce fazladan boşluk var. Dizinleyicinin yapması gereken genel bir temizlik kuralı eklendi; kural yalnız rakamlar arasını etkiler.

Ayar aynı küçük test kümesinde yapıldığı için bu kümeye aşırı uyum riski vardır. Phase 07'de gerçek örnek taramalarla doğrulanmalıdır.

## Karar

**Metin tanıma panelin kendi altyapısında yapılabilir; belge dışarı gönderilmez.** Tipik tarama kalitesinde irsaliye ve kantar fişi, arayacağı her sözcükle bulunabiliyor. Bu nedenle ölçütteki "sahibe sorulacak karar noktası" açılmadı; D-201'deki dış hizmet sorusu gündeme gelmedi.

Kötü taramalarda (100 dpi, soluk) bazı terimler kayboluyor: belge no, plaka, bir firma adı. Bu, dış hizmete gönderme gerekçesi değil, **kalite sinyali**dir. Düşük tanıma güveni olan belge işaretlenmeli ve kullanıcıya yeniden tarama önerilmelidir.

## Sınırlar

1. Belgeler HTML'den üretilen sentetik görüntülerdir. Buruşuk kâğıt, telefonla çekilmiş perspektifli fotoğraf, el yazısı, kaşe/imza üstüne binen yazı, karbon kopya ve nokta vuruşlu yazıcı çıktısı sınanmadı.
2. Bozulmalar yapay olarak uygulandı; gerçek tarayıcı ve telefon kamerası görüntüleri Phase 07'de kullanılmalıdır. Gerçek belge örnekleri kişisel veri içeriyorsa (ör. şoför adı) önce anonimleştirilmelidir.
3. Süre bu bilgisayarda ölçüldü (sayfa başına iki geçiş ~1 sn). Sunucu işlemcisinde ve eşzamanlı yükte ayrıca ölçülmelidir. Tanıma iş kuyruğunda çalışır, istek yolunda değil.
4. Çok sayfalı PDF taramaları ve belge sınıflandırma (hangi belge türü) kapsam dışıdır.

## Phase 07'ye taşınanlar

1. Metin tanıma yerel Tesseract ile, iş kuyruğunda çalışır; tanıma bitene kadar belge aramada "okunuyor" olarak işaretlenir (REQ-DOC-004 kabul ölçütü).
2. İki geçiş (otomatik ve dağınık metin) ve aramaya birleşik metin; rakamlar arası noktalama temizliği.
3. Tanıma güveni düşük belge için kalite işareti ve yeniden tarama önerisi.
4. Aramada aksan katlama (D-247) OCR'ın ş/s, ı/i karışıklıklarına karşı da koruma sağlar.
5. Hassas sınıftaki kaydın belgesinin tanınan içeriği, o sınıfı göremeyen kullanıcının aramasında eşleşme üretmez (REQ-DOC-004); bu, arama satırının RLS'iyle korunur.

Kanıt: dış scratchpad'de `spike16-evidence-*.json` ve üretilen tarama görüntüleri `spike16-*.png|jpg`.
