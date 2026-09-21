# SPIKE-15 — Sahadan fotoğraf yükleme, zayıf bağlantı

Durum: GEÇTİ · Tarih: 2026-09-21 · Görev: TASK-0096 · Bağlı: REQ-SIT-020, REQ-NFR-015, ADR-003, DEF-002

**Soru.** Sahadan fotoğraf yükleme zayıf bağlantıda çalışıyor mu? Geçme ölçütü: telefondan çekilen fotoğraf küçültülüp yükleniyor; bağlantı kesilip döndüğünde yükleme kaldığı yerden tamamlanıyor; günlük kayıt bu sırada kaybolmuyor.

**Çerçeve.** İlk sürüm yalnız çevrimiçi çalışır; çevrimdışı giriş ve eşitleme ertelenmiştir (DEF-002). Bu yüzden ölçüt şöyle yorumlandı: kısa bir kopmada yükleme baştan değil kaldığı bayttan sürer; formun taslağı sunucuya kendiliğinden kaydedilir, kopmada tekrar denenir ve sayfa yeniden açıldığında değerler yerindedir (REQ-NFR-015). Tarayıcıda yerel veritabanına kayıt ve sonradan eşitleme bu deneyin kapsamında değildir.

## Yöntem

Deney kodu geçicidir (`spike15.mjs`), ürüne girmedi; veritabanı kullanılmadı.

- **İstemci:** gerçek Chrome (başsız). Zayi kaydı formu (panel tipi, adet, neden) ve fotoğraf. Fotoğraf 4032×3024 sentetik bir "telefon fotoğrafı"dır; tarayıcıda en uzun kenarı 1600 px olacak şekilde küçültülür (JPEG, kalite 0,8).
- **Yükleme:** tarayıcı → uygulama sunucusu → R2. Uygulama sunucusundan geçmesinin iki nedeni var: yetki uygulamada denetlenir (ADR-003) ve elimizdeki R2 anahtarı yalnız nesne yetkilidir, tarayıcıdan doğrudan yükleme için gereken kova CORS ayarını yapamaz. Dosya 64 KB'lık parçalarla gönderilir. Her parça beklenen konumu taşır; kopmadan sonra istemci konumu sunucuya sorar ve oradan devam eder.
- **Zayıf bağlantı:** CDP ile ~256 kbit/sn yükleme ve 300 ms gecikme. Yüklemenin %35'inden sonra 8 sn çevrimdışı; bu sırada kullanıcı formu değiştirir (adet 2 → 3). Ardından sunucu tarafında bir parça isteği yarıda kesilir.

## Sonuçlar — 11/11 kontrol geçti

| # | Kontrol | Sonuç |
|---|---|---|
| P1 | 4032×3024 fotoğraf oran korunarak 1600×1200'e küçültüldü | geçti |
| P2 | Küçültme dosyayı belirgin şekilde küçülttü | 5,86 MB → 238 KB (24,6 kat) |
| U1 | Kopmalardan sonra yükleme tamamlandı | 23,9 sn, istemcide 5 hata |
| U2 | Çevrimdışıyken yükleme hatası kullanıcıya değil kuyruğa düştü | 5 deneme |
| U3 | Yükleme baştan değil, sunucudan alınan konumdan sürdü | 196.608. bayttan |
| U4 | Tekrar gönderilen veri bir parçayı aşmadı | **0 bayt** |
| U5 | R2'deki dosya tarayıcıdaki küçültülmüş fotoğrafla bayt bayt aynı | sha256 eşit |
| D1 | Çevrimdışıyken yapılan değişiklik taslağa kaydedilemedi ve tekrar denendi | 5 deneme |
| D2 | Bağlantı dönünce sunucudaki taslak son değerleri ve fotoğrafı taşıyor | adet 3, fotoğraf bağlı |
| D3 | Sayfa yeniden açıldığında form değerleri ve fotoğraf yerinde | geçti |
| T1 | Deney nesneleri R2'den silindi | temiz |

## Günlükten öğrenilenler

1. **Kaldığı yerden devam gerçekten gerekli ve çalışıyor.** Kopma anında yoldaki parça sunucuya ulaşmış (sunucu 196.608 bayta gelmiş), ama istemci bunu hata olarak görmüştü. Dönüşte istemci konumu sunucuya sordu, o parçayı yeniden göndermedi; toplamda fazladan tek bayt gitmedi. Konumu istemcinin kendi sayacına göre değil sunucuya sorarak belirlemek bu yüzden şarttır.
2. **Sunucu tarafı kopmayı bu deney kendi mantığımızla sınamadı.** Sunucu bir parça isteğini gerçekten kesti; ama Chrome, yeniden kullanılan bir bağlantı sıfırlandığında isteği kendiliğinden bir kez tekrarladı ve istemci hata görmedi. Bu senaryo bizim devam mekanizmamızı değil, tarayıcının ağ katmanını sınamış oldu.
3. **`online` olayı bekleme süresini kısaltmalı.** Bağlantı 14,2. saniyede döndü ve taslak hemen kaydedildi, ama yükleme ancak 21,7. saniyede sürdü. Çevrimdışıyken bekleme süresi 8 saniyeye çıkmıştı ve `online` olayı bu beklemeyi kesmiyordu. Ürün uygulamasında `online` olayı bekleyen yeniden denemeyi hemen başlatmalıdır.

## Sınırlar

1. **Çevrimdışı giriş yok (DEF-002).** Bağlantı yokken sekme kapatılırsa, son başarılı taslak kaydından sonra girilen değerler ve henüz yüklenmemiş fotoğraf kaybolur. Bunu önlemek tarayıcıda yerel kayıt ve eşitleme gerektirir; bu, ertelenmiş çevrimdışı giriş kapsamındadır ve pilot geri bildiriminden sonra ele alınır.
2. Fotoğraf sentetikti; EXIF yönlendirmesi, HEIC biçimi (iPhone) ve gerçek kamera akışı (`capture`) sınanmadı. iOS web yüklemelerinde genellikle JPEG'e dönüştürür, ama bu Phase 07'de gerçek cihazla doğrulanmalıdır.
3. Zayıf bağlantı CDP öykünmesiyle taklit edildi; gerçek mobil ağ, düşük bellekli telefon ve arka plana alınan sekme sınanmadı.
4. Yükleme uygulama sunucusu belleğinde birleştirilip R2'ye tek parça yazıldı. Küçültülmüş fotoğraflar için yeterlidir; büyük dosyalar (ör. video) için R2 çok parçalı yükleme veya doğrudan imzalı yükleme ayrıca tasarlanmalıdır.
5. R2 kovasının herkese açık `r2.dev` adresi açıktı (ADR-003 uyum maddesi); deneyde yalnız sentetik görüntü kullanıldı ve silindi.

## Phase 07'ye taşınanlar

1. Fotoğraf yüklemeden önce tarayıcıda küçültülür (en uzun kenar ~1600 px); sahadaki veri kullanımı yaklaşık 25 kat azalır.
2. Parçalı yükleme: her parça beklenen konumu taşır; uyuşmazlıkta sunucu 409 ve doğru konumu döner; kopmadan sonra konum her zaman sunucuya sorulur.
3. Taslak otomatik kaydı başarısız olursa artan aralıklarla yeniden denenir; `online` olayı hem taslağı hem bekleyen yüklemeyi hemen yeniden başlatır.
4. Fotoğraf taslağa ancak yükleme tamamlanınca bağlanır; fotoğrafı olmayan zayi satırı onaya gönderilemez (REQ-SIT-020).

Kanıt: dış scratchpad'de `spike15-evidence-*.json`.
