# Ortamlar ve İşletim Modeli

Durum: TASLAK · Son güncelleme: 2026-09-20

Panelin nerede çalıştığı, verinin nerede durduğu ve canlıya geçerken nelerin değişeceği. Görev: TASK-0073. Kararlar: D-245. Gereksinimler: REQ-NFR-017…020.

## 1. Bugünkü model: yerel öncelikli (D-245)

| Ortam | Ne | Nerede |
|---|---|---|
| Geliştirme | Uygulama | Geliştirme makinesinde (`npm run dev`) |
| Kabul | Sahibin kendi bilgisayarında çalıştırdığı aynı uygulama | `docs/infrastructure/LOCAL_SETUP.md` |
| Veritabanı ve kimlik doğrulama | **Tek Supabase projesi** | Supabase Cloud |
| Dosyalar | Cloudflare R2 (tek kova) veya geliştirmede yerel klasör | `StorageProvider` portu (ADR-003) |

**Deneme (staging) ortamı yoktur** ve **sunucu kararı ertelenmiştir** (sahip kararı, D-245). Bu, ilk dilime kadar maliyet doğurmaz.

## 2. Bunun getirdiği üç sonuç

1. **Kabul, sahibin kendi makinesinde yapılır.** Her dilim bitince sahip paneli kendi bilgisayarında açar ve gezer. Kurulum adımları `LOCAL_SETUP.md`'dedir ve her dilimde güncel tutulur.
2. **Pilot, sunucu gelene kadar yapılamaz.** Saha mühendisi ve koordinatörle yapılacak pilot bir adres ister. Dilim 1 bittiğinde sunucu kararı yeniden gündeme gelir (Phase 09 çıkışı).
3. **Test verisi sıfırlanabilir.** Tek proje olduğu için örnek veri, `npm run db:reset` ile temizlenir ve başlangıç verisiyle yeniden kurulur. **Gerçek veri girdiği gün bu komut kilitlenir** ve ikinci bir proje açılır (bölüm 5).

## 3. Sırlar ve erişim

- Anahtarlar `.env.local` dosyasındadır; Git'e hiçbir anahtar girmez (`.gitignore`).
- Anahtar türleri: Supabase URL ve anon anahtarı (istemci), servis anahtarı (yalnız göç ve outbox işleyicisi, ADR-015), R2 kimliği, TCMB ve hava servisi uç noktaları.
- Servis anahtarı hiçbir zaman tarayıcıya gönderilmez; sunucu tarafı kodda kalır.
- Anahtar sızdığında yapılacaklar (iptal et, yenile, denetim kaydını incele) canlıya geçiş listesine yazılıdır.

## 4. Göçler

- Şema değişiklikleri sıralı göç dosyalarıdır; her göç Git'te durur ve tek yönde ilerler (`docs/database/CONVENTIONS.md` bölüm 11).
- Göç çalıştırmadan önce veritabanının yedeği alınır (bölüm 6).
- Başlangıç verisi (roller, yetki tipleri, kataloglar, akış şablonları) tekrar çalıştırılabilir dosyalardadır; örnek veri ayrı bir dosyadır ve canlıda hiç çalıştırılmaz.

## 5. Canlıya geçerken değişecekler (ertelenen kararlar)

Bunlar bugün karara bağlanmadı; Phase 09 sonunda veya Phase 19'da açılacak:

| Konu | Bugün | Canlıya geçerken |
|---|---|---|
| Sunucu | Yok, yerel | Sağlayıcı ve konum seçilir (OQ-010) |
| Ortam sayısı | Tek | Canlı + deneme ayrılır (OQ-011) |
| Supabase | Tek proje | İkinci proje açılır; bugünkü proje geliştirmeye kalır, canlı yeni projede başlar (OQ-012) |
| Alan adı ve e-posta | Yok | `geogespanel.com`, arama motorlarına kapalı; işlem e-postaları için gönderici (OQ-015) |
| İzleme ve hata takibi | Yok | Hata takip aracı kurulur (OQ-014) |
| Yedek | Supabase'in kendi yedeği | Sunucudan ayrı yerde yedek (OQ-013, REQ-NFR-018) |

Bu tablo `ai/DEFERRED.md`'deki DEF-008 ile eşleşir; unutulmaması için Phase 09 çıkış koşuluna bağlandı.

## 6. Yedek ve geri dönüş (bugünkü hâli)

- **Veritabanı:** Supabase'in günlük otomatik yedeği. Ayrıca her göçten önce ve haftada bir elle tam döküm alınır; döküm geliştirme makinesinde ve bir harici diskte saklanır.
- **Dosyalar:** R2 kovasının sürümleme özelliği açıktır; silme geri alınabilir.
- **Geri dönüş denemesi:** gerçek veri girmeden önce en az bir kez tam geri dönüş denenir ve süresi yazılır (REQ-NFR-019, REQ-DOC yedek maddesi). Bu, canlıya geçiş kapısının şartıdır.
- RPO ≤ 1 saat ve RTO ≤ 4 saat hedefleri (REQ-NFR-018, REQ-NFR-019) **canlı ortam için** geçerlidir; yerel dönemde ölçülmez, ama tasarım bunları karşılayacak şekilde kurulur.

## 7. Ölçek

İki yıl içinde 50–150 kullanıcı hedefi (REQ-NFR-020) tek sunucu ve tek veritabanıyla karşılanır. Yük artarsa önce outbox işleyicisi ayrı sürece alınır, sonra okuma modelleri için okuma kopyası eklenir; uygulama kodu değişmez (ADR-015, ADR-014).
