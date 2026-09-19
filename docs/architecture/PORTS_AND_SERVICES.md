# Portlar, Veri Erişimi ve Ortak Servisler

Durum: TASLAK · Son güncelleme: 2026-09-20

Panelin dış dünyaya ve veritabanına nasıl bağlandığı. Taşınabilirlik kuralı ADR-002 ve ADR-003'ten gelir: iş mantığı standart PostgreSQL ve uygulama katmanında yaşar, sağlayıcıya özgü her şey bir portun arkasındadır. Görev: TASK-0062. Kararlar: D-238, D-239, D-240.

## 1. Portlar

Her port bir arayüz, her sağlayıcı bir adaptördür. Modüller yalnız arayüzü bilir.

| Port | Ne yapar | İlk adaptör | Not |
|---|---|---|---|
| `AuthProvider` | Giriş, oturum, parola, TOTP | Supabase Auth | Roller ve kapsam bizim tablolarımızda (ADR-002) |
| `StorageProvider` | `upload`, `download`, `delete`, `exists`, `getSignedUrl` | Cloudflare R2 | Erişim yetkisi her zaman uygulamada denetlenir (ADR-003) |
| `JobRunner` | Zamanlanmış ve kuyruklu işler | Uygulamayla aynı sunucuda çalışan kuyruk | Outbox işleyicisi ve akış zamanlayıcısı buradan (`EVENT_BACKBONE.md`) |
| `NotificationSender` | Panel içi, telefon bildirimi (web push), e-posta | Web Push + SMTP | Kanal kuralları REQ-TSK-010; metinde hassas veri yok (REQ-TSK-011) |
| `ExchangeRateProvider` | Günlük TCMB alış kuru | TCMB XML | Alınamazsa `exchange_rate.missing` (REQ-ADM-013) |
| `WeatherProvider` | Şantiye günü için hava | Bir hava servisi | Yanıt yoksa alan elle girilir (REQ-SIT-006) |
| `DocumentRenderer` | Teklif belgesi, resmî günlük rapor, bildirim yazısı (PDF) | Sunucuda HTML → PDF | Türkçe karakter ve tablo kalitesi Phase 06 denemesi |
| `TextExtractor` | PDF/Office metni, taranmış belgede metin tanıma | Sunucu içi | Belgeyi dışarı göndermek gerekirse önce sahibe sorulur (REQ-DOC-004) |

Port arayüzleri `src/platform/<port>/` altında durur; adaptör değişimi modülleri etkilemez.

## 2. Veri erişimi (D-238, OQ-020)

**Karar (Phase 06 denemesine kadar geçici): doğrudan PostgreSQL bağlantısı + tipli sorgu kurucu.** Supabase yalnız kimlik doğrulama ve barındırma için kullanılır; veri erişimi PostgREST üzerinden değil, havuzlanmış bir Postgres bağlantısıyla yapılır.

Nedeni:
- **Tek işlem gerekiyor.** Kayıt ve outbox satırı aynı işlemde yazılmak zorunda (`EVENT_BACKBONE.md` bölüm 1). PostgREST'te bu garanti yoktur.
- **Satır düzeyi güvenlik korunur.** Her işlemin başında kullanıcının kimliği ve rolü oturum değişkenine yazılır; RLS politikaları buna göre çalışır. Yani RLS'ten vazgeçmiyoruz, sadece bağlantıyı biz açıyoruz.
- **Karmaşık sorgu.** Hakediş, projeksiyon ve okuma modelleri çok tablolu sorgular ister.

Kurallar:
- Servis anahtarıyla (RLS'i atlayan bağlantı) yalnız iki şey çalışır: göçler ve outbox işleyicisi. İkisi de kullanıcı isteği yolunda değildir.
- Kullanıcı isteğinden gelen her sorgu, kullanıcının kimliğiyle açılmış işlemde çalışır.
- Ham SQL yalnız veri katmanında (`modules/<kod>/data/`) bulunur; modül dışında SQL yazılmaz.
- Phase 06 denemesi bunu doğrular: çok rollü ve kapsamlı kullanıcıda RLS doğru ve yeterince hızlı mı (TASK-0064).

## 3. Arama (D-239)

**Karar: ilk sürümde ayrı bir arama motoru kurulmaz; arama PostgreSQL'in kendi tam metin araması ve benzerlik eklentisiyle yapılır.**

- Her aranabilir kayıt türü için bir **arama satırı** tutulur: kayıt kimliği, tür, başlık, ikincil bilgi, arama vektörü, kapsam sütunları. Satır, kaydın olaylarıyla güncellenir.
- Türkçe harf duyarsızlığı ve yazım yakınlığı için benzerlik eklentisi (`pg_trgm`) kullanılır; "sogut" → "Söğüt" bu yüzden çalışır.
- **Yetki süzmesi arama satırında da RLS ile** yapılır; yetkisiz kayıt sonuç sayısına bile girmez (REQ-NFR-012).
- Ticari ve hassas alanlar arama vektörüne **hiç konmaz**; o veriyle arama yapılamaz (REQ-IAM-011).
- Belge içeriği arama satırına girmez; arşivin kendi içerik araması ayrıdır (D-227). Metni çıkarılmamış belge "okunuyor" olarak işaretlenir (REQ-DOC-004).
- Hacim büyüdüğünde ayrı arama motoruna geçiş, bu tasarımı bozmadan bir adaptör değişimidir.

## 4. Canlı güncelleme (D-240, D-232)

- Tarayıcı, sunucuya tek yönlü bir olay akışı (SSE) ile bağlanır. Kanal yalnız **"şu değişti"** sinyali taşır: onay sayacı, bildirim sayacı, onay kuyruğunda yeni kayıt.
- Sinyalde veri yoktur; ekran veriyi kullanıcının kendi yetkisiyle çeker. Böylece kanaldan yetkisiz veri sızamaz.
- Sinyaller outbox işleyicisinden çıkar; yani kullanıcı, olay gerçekten işlendikten sonra haberdar olur.
- Bağlantı koparsa ekran sessizce yeniden bağlanır; bağlantı yokken sayaçlar sayfa yenilemesiyle güncellenir.
- Supabase Realtime kullanılmaz: veritabanı değişikliklerini doğrudan yayımlamak, yetki süzmesini kanala taşır ve taşınabilirliği bozar (ADR-002).

## 5. Dosya erişimi

- Dosyalar R2'de, kayıt bağlamıyla birlikte saklanır. İndirme isteği her zaman uygulamadan geçer: uygulama yetkiyi denetler, sonra kısa ömürlü imzalı bağlantı üretir (ADR-003).
- İmzalı bağlantı kişiye ve kayda özeldir, paylaşılırsa süresi dolar.
- Fotoğraflar yüklenirken küçültülür; asıl dosya saklanır, ekranlarda küçük sürüm kullanılır (sahada veri kullanımı).

## 6. Dışa giden istekler

- Dış servis çağrıları (kur, hava, e-posta, bildirim) **istek yolunda değil**, iş kuyruğunda çalışır; dışarısı yavaşsa kullanıcı beklemez.
- Her dış çağrının zaman aşımı ve yeniden deneme sayısı vardır; başarısızlık sessiz değildir, ilgili alan "alınamadı" olarak işaretlenir.
- Panel dışarıya veri göndermez: akışlar dış sisteme veri gönderemez (REQ-WFL-006), belge metni çıkarma dışarı gönderilecekse önce sahibe sorulur (REQ-DOC-004).

## 7. Phase 06'ya giden sorular

- RLS'li doğrudan bağlantı, çok rollü kullanıcıda doğru ve hızlı mı (D-238)?
- PostgreSQL tam metin araması, Türkçe ve yazım yakınlığıyla yeterli mi (D-239)?
- Sunucuda üretilen PDF, Türkçe karakter ve tablo düzeniyle basılabilir kalitede mi?
- TCMB kuru her iş günü güvenilir alınabiliyor mu, alınamadığında akış doğru davranıyor mu?
