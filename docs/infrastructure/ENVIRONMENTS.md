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
3. **Test verisi sıfırlanabilir, yapılandırma korunur (D-246).** İki ayrı komut vardır (bölüm 4a). **Gerçek veri girdiği gün ikisi de kilitlenir** ve ikinci bir proje açılır (bölüm 6).

## 3. Sırlar ve erişim

- Anahtarlar `.env.local` dosyasındadır; Git'e hiçbir anahtar girmez (`.gitignore`).
- Anahtar türleri: Supabase URL ve anon anahtarı (istemci), servis anahtarı (yalnız göç ve outbox işleyicisi, ADR-015), R2 kimliği, TCMB ve hava servisi uç noktaları.
- Servis anahtarı hiçbir zaman tarayıcıya gönderilmez; sunucu tarafı kodda kalır.
- Anahtar sızdığında yapılacaklar (iptal et, yenile, denetim kaydını incele) canlıya geçiş listesine yazılıdır.

## 4a. Üç veri katmanı ve iki sıfırlama komutu (D-246)

| Katman | Ne | `db:reset:data` | `db:reset:config` |
|---|---|---|---|
| Başlangıç verisi | Roller, yetki tipleri, temel kataloglar, akış **şablonları** | Yeniden kurulur | Yeniden kurulur |
| Yapılandırma | Şablondan kopyalanmış ve değiştirilmiş akışlar, eklenen katalog kalemleri, eşikler ve tarihli kurallar, özel alanlar, tanımlanan roller ve yetki tipleri, kayıt türü tanımları | **Korunur** | Fabrika ayarına döner |
| Örnek iş verisi | Şantiye, proje, günlük kayıtlar, stok hareketleri, hakedişler, görevler, bildirimler, akış örnekleri, okuma modelleri | Silinir | Silinir |

- `db:reset:data` — günlük kullanım: örnek veriyi temizler, kurduğunuz akışlar ve tanımlar durur.
- `db:reset:config` — nadiren: yapılandırmayı da fabrika ayarına döndürür. Onay sorar.
- Akış **örnekleri** iş verisidir ve iki komutta da silinir; akış **tanımları** yapılandırmadır.

## 4b. Yapılandırmanın taşınması (D-246)

- `config:export` yapılandırmayı tek bir dosyaya çıkarır: akış tanımları ve sürümleri, kataloglar, tarihli kurallar, özel alan tanımları, roller ve yetki tipleri, kayıt türü tanımları.
- `config:import` bunu başka bir ortama yükler; çakışan anahtarlar raporlanır, sessizce üzerine yazılmaz.
- Canlıya geçerken ikinci Supabase projesi bu dosyayla kurulur; yerelde kurduğunuz akışlar elle tekrarlanmaz.
- İş verisi bu dosyaya **girmez**; yalnız yapılandırma taşınır.

## 5. Göçler

- Şema değişiklikleri sıralı göç dosyalarıdır; her göç Git'te durur ve tek yönde ilerler (`docs/database/CONVENTIONS.md` bölüm 11).
- Göç çalıştırmadan önce veritabanının yedeği alınır (bölüm 7).
- Başlangıç verisi (roller, yetki tipleri, kataloglar, akış şablonları) tekrar çalıştırılabilir dosyalardadır; örnek veri ayrı bir dosyadır ve canlıda hiç çalıştırılmaz.

## 6. Canlıya geçerken değişecekler (ertelenen kararlar)

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

## 7. Yedek ve geri dönüş (bugünkü hâli)

- **Veritabanı:** Supabase'in günlük otomatik yedeği. Ayrıca her göçten önce ve haftada bir elle tam döküm alınır; döküm geliştirme makinesinde ve bir harici diskte saklanır.
- **Dosyalar:** R2 kovasının sürümleme özelliği açıktır; silme geri alınabilir.
- **Geri dönüş denemesi:** gerçek veri girmeden önce en az bir kez tam geri dönüş denenir ve süresi yazılır (REQ-NFR-019, REQ-DOC yedek maddesi). Bu, canlıya geçiş kapısının şartıdır.
- RPO ≤ 1 saat ve RTO ≤ 4 saat hedefleri (REQ-NFR-018, REQ-NFR-019) **canlı ortam için** geçerlidir; yerel dönemde ölçülmez, ama tasarım bunları karşılayacak şekilde kurulur.

## 8. Ölçek

İki yıl içinde 50–150 kullanıcı hedefi (REQ-NFR-020) tek sunucu ve tek veritabanıyla karşılanır. Yük artarsa önce outbox işleyicisi ayrı sürece alınır, sonra okuma modelleri için okuma kopyası eklenir; uygulama kodu değişmez (ADR-015, ADR-014).
