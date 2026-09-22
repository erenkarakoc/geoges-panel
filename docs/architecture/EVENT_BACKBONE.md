# Olay Altyapısı

Durum: CONFIRMED (sahip, 2026-09-20) · Son güncelleme: 2026-09-22

Modüller arası her tepki ve akış motorunun her tetiklenmesi olaylarla yürür (`docs/architecture/MODULE_BOUNDARIES.md` bölüm 3, REQ-WFL-007). Bu belge olayın nasıl yayımlandığını, nasıl teslim edildiğini ve hata olunca ne olduğunu belirler. Görev: TASK-0058. Kararlar: D-234. Olayların listesi modüllerin yetenek kataloglarındadır (D-078).

## 1. Yayımlama: outbox

Bir olay, onu doğuran veri değişikliğiyle **aynı veritabanı işleminde** `outbox` tablosuna yazılır. Ayrı bir süreç outbox'ı okuyup aboneleri çalıştırır.

Neden: "kayıt yazıldı ama olay yayımlanamadı" ve "olay yayımlandı ama kayıt geri alındı" durumlarının ikisi de imkânsız olmalı. Panelde bu, "onaylanmış günlük kayıt stoğa düşmedi" demektir; kabul edilemez (REQ-NFR-001).

Outbox satırı: olay kodu, sürüm, yayımlayan modül, kayıt anahtarı, sıra anahtarı, yük (alanlar), oluşma zamanı, deneme sayısı, durum.

## 2. Teslim garantisi

- **En az bir kez.** Bir abone aynı olayı iki kez görebilir.
- **Aboneler fikir birliğine göre değil, kendi başına ilerler.** Bir abonenin hatası diğerini durdurmaz.
- **Sıra, kayıt bazındadır.** Aynı kaydın olayları yayımlandıkları sırada işlenir (sıra anahtarı: modül + kayıt kimliği). Farklı kayıtların olayları paralel işlenir.
- **Tekrarı zararsız kılmak abonenin görevidir.** Her abone `(olay kimliği, abone)` çiftini işlendi olarak yazar; aynı olayı ikinci kez görürse hiçbir şey yapmaz. Yetenek kataloğundaki aksiyonlarda "iki kez çalışırsa" sütunu zaten bunu tarif eder (D-078).

## 3. Senkron mu, olayla mı

| Durum | Yol |
|---|---|
| Kullanıcı sonucu aynı ekranda görmek zorunda | Senkron komut (aynı işlem) |
| Sonuç başka bir ekranda, birkaç saniye içinde görünse yeter | Olay |
| İki modülün verisi aynı anda tutarlı olmak zorunda (defter) | Senkron, tek işlem, tek modül sahipliğinde |
| Akışın tetiklenmesi | Her zaman olay (REQ-WFL-007) |

Bir kullanıcı işlemi en çok iki modülü senkron zincire sokar; üçüncüsü olayla devam eder.

## 4. Hata, tekrar deneme ve ölü mektup

- Başarısız teslim **artan aralıklarla** yeniden denenir: 1 dk, 5 dk, 15 dk, 1 saat, 6 saat (varsayılan; yönetim ayarı değil, mühendislik ayarı).
- Beş deneme sonunda olay **ölü mektup** listesine düşer: yayımlayan modül, abone, hata, yük ve deneme geçmişiyle.
- Ölü mektup boş değilse sahip katmanına kritik bildirim gider ve sistem sorunu görevi açılır (REQ-TSK-002). Kullanıcıya teknik hata gösterilmez (`docs/ui-ux/SCREEN_STATES.md`).
- Düzeltildikten sonra olay **elle yeniden çalıştırılır**; tekrarı zararsız olduğu için bu güvenlidir.
- Akış örneği hata ile durursa örnek "hata" durumunda kalır, çalışma günlüğünde nedeniyle görünür (REQ-WFL-034) ve kayıt kilitlenmez: insan işi elle yapabilir (REQ-WFL-031).

## 5. Olay sürümleme

- Olayın yükü **yalnız genişler**: yeni alan eklenir, var olan alan kaldırılmaz veya anlamı değiştirilmez (D-078).
- Zorunlu bir değişiklik gerekiyorsa yeni sürüm kodu yayımlanır (`daily_site_log.approved.v2`); eski sürüm "kullanımdan kalktı" işaretlenir ve aboneler taşınana kadar ikisi birlikte yayımlanır.
- Yürüyen akış örnekleri kendi sürümleriyle devam eder (REQ-WFL-024); olay sürümü de tanımın parçasıdır.

## 6. Yeniden oynatma

- Okuma modelleri (D-233) olaylardan yeniden kurulabilir; bunun için outbox kayıtları **silinmez** (D-231).
- Yeniden oynatma yalnız okuma modellerini besler; defter kayıtlarını, görevleri veya bildirimleri yeniden üretmez. Bu ayrım abone tanımında yazılıdır: `yeniden oynatılabilir` evet/hayır.
- Bildirim ve görev üreten aboneler yeniden oynatmada atlanır; kimse geçmişin bildirimini ikinci kez almaz.

## 7. İşleyici altyapısı

- Outbox'ı okuyan süreç, uygulamayla aynı sunucuda çalışan bir **iş kuyruğu**dur (Phase 05'te barındırma ayrıntısı).
- Zamanlanmış tetikleyiciler (saat, takvim, "bitime X gün kala") aynı kuyruğun zamanlayıcısıyla çalışır (REQ-WFL-007); her çalıştırma kendi tekrarsızlık anahtarını taşır, böylece iki kez tetiklenme kayıt üretmez.
- Eşik tetikleyicileri, eşiği geçiren olayla çalışır; sürekli sorgu ile değil.
- Kuyruk durursa: kullanıcı ekranları çalışmaya devam eder, olaylar outbox'ta birikir ve kuyruk dönünce sırayla işlenir. Gecikme 15 dakikayı aşarsa sahip katmanına bildirim gider.

## 8. Canlı güncelleme (D-232)

- Onay sayacı, bildirim zili ve onay kuyruğu, ilgili olaylar işlendikten sonra kullanıcıya anlık iletilir.
- Diğer ekranlar sayfa yenilendiğinde günceldir.
- Canlı kanal yalnız "bir şey değişti" der; veriyi kullanıcının yetkisiyle ekran çeker. Böylece kanaldan yetkisiz veri sızmaz.

## 9. Sınama (Phase 06 adayları)

- Outbox + kuyruk, tek sunucuda beklenen yükle çalışıyor mu (TASK-0064'e girer).
- Aynı olayın iki kez işlenmesi hiçbir yerde ikinci kayıt üretmiyor mu.
- Okuma modelinin sıfırdan yeniden kurulması ne kadar sürüyor.

## 10. Kurulum (TASK-0104, D-259)

- **İşleyici** uygulama sunucusunun içinde çalışır (`src/instrumentation.ts`); sahip ayrıca bir komut çalıştırmaz. Kendi veritabanı rolüyle bağlanır (`geoges_worker`): RLS'i atlar, silemez, yapı değiştiremez.
- **Yayımlama** yalnız `publishEvent` ile olur; aynı işlemde her abone için bir teslim satırı açılır. Abonelikleri işleyici koddaki kayıt defterinden yazar (`src/jobs/registry.ts`).
- **Teslim** bölüm 2 ve 4'teki gibidir: abone ve kayıt başına sıra, etki ile "teslim edildi" işareti aynı işlemde, 1/5/15/60 dakika aralıkla deneme, beşinci hatada ölü mektup. Ölü mektup o abonenin o kayıttaki sonraki olaylarını bekletir; `npm run jobs:retry -- <kimlik>` ile devam eder.
- **Zamanlanmış işler** tekrarsızlık anahtarıyla bir kez çalışır; tekrarlayan işler "her gün SS:DD (İstanbul)" veya "her N dakika" olarak tanımlanır.
- **Okuma modeli yeniden kurma** (bölüm 6) bir sonraki sürüme yazar, yetişir, kaynakla karşılaştırır, tek güncellemeyle geçer ve farkı denetime yazar; yalnız modelin kendi yeniden oynatması çalışır (`npm run jobs:rebuild -- <model>`).
- **Gecikme ve ölü mektup** şimdilik denetim kaydına yazılır ve `npm run jobs:status` ile görünür; sahip katmanına bildirim ve sistem sorunu görevi TASK-0108'de bağlanır.
