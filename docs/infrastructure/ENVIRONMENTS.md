# Ortamlar ve İşletim Modeli

Durum: CONFIRMED (sahip, 2026-09-20) · Son güncelleme: 2026-09-22

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

**Kuruldu (TASK-0076, 2026-09-22):** komutlar tablo adı ezberlemez; her tablo katmanını `core.table_layer`'a kendi göçünde kaydeder ve kayıtsız tablo içeren göç geçemez (`docs/database/CONVENTIONS.md` bölüm 11). `db:reset:config` önce yapılandırmayı `exports/` altına dışa aktarır, sonra `SIFIRLA` onayı ister (betikte `--onay=SIFIRLA`). Örnek veri `npm run db:sample` ile `db/samples/`'tan yüklenir. `npm run db:mark-real-data` ortamı gerçek veri ortamı olarak işaretler (`KILITLE` onayıyla, geri alınmaz); o andan sonra iki sıfırlama ve örnek veri yükleme reddedilir.

## 4b. Yapılandırmanın taşınması (D-246)

- `config:export` yapılandırmayı tek bir dosyaya çıkarır: akış tanımları ve sürümleri, kataloglar, tarihli kurallar, özel alan tanımları, roller ve yetki tipleri, kayıt türü tanımları.
- `config:import` bunu başka bir ortama yükler; çakışan anahtarlar raporlanır, sessizce üzerine yazılmaz. Tek bir çakışma bile varsa hiçbir satır yazılmaz; `-- --dry-run` yalnız raporlar. Hedefin son göçü dosyadakiyle aynı olmalıdır.
- Canlıya geçerken ikinci Supabase projesi bu dosyayla kurulur; yerelde kurduğunuz akışlar elle tekrarlanmaz.
- İş verisi bu dosyaya **girmez**; yalnız yapılandırma taşınır.

## 5. Göçler

- Şema değişiklikleri sıralı göç dosyalarıdır; her göç Git'te durur ve tek yönde ilerler (`docs/database/CONVENTIONS.md` bölüm 11).
- Gerçek veri girildikten sonra göç çalıştırmadan önce veritabanının yedeği alınır (bölüm 7, D-255).
- Başlangıç verisi (roller, yetki tipleri, kataloglar, akış şablonları) tekrar çalıştırılabilir dosyalardadır; örnek veri ayrı bir dosyadır ve canlıda hiç çalıştırılmaz.

**Kuruldu (TASK-0101, 2026-09-22):** göçler `db/migrations/` altında düz SQL dosyalarıdır; her birinin yanında geri alma dosyası (`.down.sql`) durur ya da neden olmadığı dosyada yazılıdır. Komutlar: `npm run db:migrate` (bekleyenleri uygular), `-- --status` (yalnız listeler), `-- --rollback-last` (son göçü geri alır); `npm run db:backup` döküm alır; ortam gerçek veri ortamı olarak işaretlendikten sonra (`npm run db:mark-real-data`) son bir saatte alınmış döküm olmadan göç çalışmaz, test döneminde döküm gerekmez (D-255). Uygulama veritabanına yalnız kısıtlı `geoges_app` rolüyle ve doğrulanmış TLS ile bağlanır (`DATABASE_APP_URL`); parolasını `npm run db:app-role` üretir. Döküm için PostgreSQL 17 komut satırı araçları gerekir; bu makinede bugün kurulu değil, gerçek veriden önce kurulur.

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

- **Veritabanı:** test döneminde veri örnek veridir ve elle döküm zorunlu değildir (D-255, sahip 2026-09-22); kayıp olursa göçler ve başlangıç verisi yeniden kurulur. Test projesi Supabase Free Plan'dadır ve otomatik yedeği yoktur. Gerçek veri işaretinden sonra her göçten önce ve haftada bir elle tam döküm alınır; döküm geliştirme makinesinde ve bir harici diskte saklanır.
- **Dosyalar:** R2 kovasının sürümleme özelliği açıktır; silme geri alınabilir.
- **Geri dönüş denemesi:** gerçek veri girmeden önce en az bir kez tam geri dönüş denenir ve süresi yazılır (REQ-NFR-019, REQ-DOC yedek maddesi). Bu, canlıya geçiş kapısının şartıdır.
- RPO ≤ 1 saat ve RTO ≤ 4 saat hedefleri (REQ-NFR-018, REQ-NFR-019) **canlı ortam için** geçerlidir; yerel dönemde ölçülmez, ama tasarım bunları karşılayacak şekilde kurulur.

## 8. Ölçek

İki yıl içinde 50–150 kullanıcı hedefi (REQ-NFR-020) tek sunucu ve tek veritabanıyla karşılanır. Yük artarsa önce outbox işleyicisi ayrı sürece alınır, sonra okuma modelleri için okuma kopyası eklenir; uygulama kodu değişmez (ADR-015, ADR-014).

## Arama indeksi işletimi (D-247, CHG-007)

pg_trgm, btree_gist ve intarray eklentileri göç öncesi kontrol edilir; RUM kullanılmaz. Üç türetilmiş arama tablosu iş kaydının kaynağı değildir. Birlikte güncellenir, aynı normalleştirme sürümüyle yeniden kurulur ve geçişte kaynak/yardımcı sonuçları karşılaştırılır. Yeni indeks doğrulanmadan okuma sürümü değiştirilmez; önceki sürüm geri dönüş için korunur.

500 bin sentetik kayıtta yardımcı tablo ve indeksler yaklaşık 481 MiB ek alan kullandı; kapasite planında asıl veri, indeksler ve geçici yeniden kurma alanı ayrı hesaplanır. Göç yedeği ve geri dönüş kuralları aynen geçerlidir. db:reset:data sonrasında yardımcılar kalan aranabilir kaynaklardan yeniden üretilir; akış tanımları bu yüzden sıfırlanmaz. Yardımcı arama verisi config:export'a girmez.

Bağlantı havuzu sıcak/ilk istek, bağlantı açılışı ve gerçek HTTP süresi ayrı izlenir; uygulama yalnız sınanmış süreyi karşılıyor diye bütün uçtan uca yol hızlı kabul edilmez. İşlem yerel kimliğinin başarıda, hatada ve havuzdaki sonraki kullanıcıya geçişte temizliği Phase 07 sözleşme testidir.
