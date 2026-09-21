# Phase 07 — Temel Yapım Planı

Durum: ONAYLANDI (sahip, 2026-09-21) · Tarih: 2026-09-21 · Son güncelleme: 2026-09-22 · Faz: Phase 07 · Bağlı: `ai/MASTER_ROADMAP.md`, CHG-009, D-250…D-253

Bu belge Phase 07'nin keşif ve planlama adımıdır (PROJECT_RULES §2, §3, §10). Hâlâ borçlu olunan temel kalemleri, her birinin tasarım kaynağını, doğrulama denemelerinden taşınan kuralları, yapım sırasını ve açılan görevleri listeler. Her T1/T2 görev, kod yazılmadan önce kendi uygulama planını (PROJECT_RULES §10) ayrıca yazar.

## 1. Zaten teslim edilenler

M0 ve CHG-004 ile erken teslim edildi: proje iskeleti, lint ve sınır kuralları, test düzeni (TASK-0023); Supabase ile gerçek giriş, TOTP iki adımlı doğrulama ve oturum koruması (TASK-0024, TASK-0025); uygulama kabuğu, gezinme kaydı, tema ve marka belirteçleri, rol karşılama (TASK-0026, TASK-0032…TASK-0036).

## 2. Soru turu — sonuç

Proje kuralının saydığı kategorilerin (iş gereksinimi, rol, senaryo, akış, UI/UX, veri modeli, yetki, kimlik, güvenlik, kenar durumlar, hata, entegrasyon, performans, ölçek, günlük, denetim, izleme, veri yaşam döngüsü, yedek, göç, test, erişilebilirlik, KVKK) hepsi Phase 01–05'te karara bağlanmış durumda; kaynakları aşağıdaki tabloda. Daha önce cevaplanmış soru ve yönetici ayarı olan konu tekrar sorulmadı. Gerçekten açık kalan üç konu 2026-09-21'de sahibe soruldu:

| Konu | Sahibin kararı | Kayıt |
|---|---|---|
| Self-host Supabase'e geçiş ne zaman kararlaştırılır | En sonda: Phase 19'da, gerçek veri girmeden önce | D-250 |
| Site geneli arama hangi fazda kurulur | Phase 07 temelinde; dilimler yalnız kendi kayıt türlerini ekler | D-251 |
| iPhone'da anlık bildirim yalnız ana ekrana eklenince çalışır | Kabul; rehbere ve ilk girişe "ana ekrana ekle" adımı konur | D-252 |

Teknik bir varsayılan da kapatıldı: paket yöneticisi ve çalışma ortamı npm 11 + Node 24 olarak kesinleşti (D-253, OQ-017).

## 3. Borçlu kalemler, kaynakları ve taşınan kurallar

| Kalem | Tasarım kaynağı | Denemelerden taşınan kurallar | Görev |
|---|---|---|---|
| Sınır kuralının MODULE_MAP'ten üretilmesi | MODULE_BOUNDARIES bölüm 2, ADR-001 | SPIKE-17: `dependencies` + `fileInternalPath`; grafik döngüsüzlüğü CI'da; statik SQL şema taraması | TASK-0099 |
| GitHub CI | CI.md, QUALITY_GATES | — | TASK-0100 |
| Veri erişim temeli: göçler, kısıtlı çalışma rolü, işlem yerel kimlik | ADR-015, CONVENTIONS.md | SPIKE-01/12: gerçek kısıtlı giriş rolü, parametre bağlama, işlem yerel kimlik ve hata sonrası temizlik, doğrulanan TLS; havuzda oturum `SET ROLE`'a güvenilmez | TASK-0101 |
| Sıfırlama komutları ve yapılandırma dışa/içe aktarma | D-246 | — | TASK-0076 |
| Dinamik yetki: kapsamlı roller, hiyerarşi, kişiye istisna, çoklu rol ve etkin rol, vekâlet, ayrılışta kapanma, veri sınıfı görünürlüğü, akış tasarımcısından tanımlanan yetki tipleri | PERMISSIONS.md, D-111…D-118, D-230, D-236, D-083, D-098, D-101 | SPIKE-01: dar yetkiler, kendine yetki verme kapalı | TASK-0102 |
| Denetim kaydı ve kayıt geçmişi | REQ-AUD, D-134, D-135 | — | TASK-0103 |
| Outbox, iş kuyruğu, zamanlayıcı ve okuma modeli yeniden kurma altyapısı | ADR-014, EVENT_BACKBONE.md, D-233, D-234 | SPIKE-03: kayıt başına sıra (baş seçimi), tekrar bastırma; SPIKE-14: kaynak kayıt başına satır, yalnız daha yeni olay günceller, gölge sürüm + atomik geçiş, karşılaştırma ve denetim, yalnız `replayable` aboneler | TASK-0104 |
| Kataloglar, tarihli kurallar, tipli özel alanlar | CONFIGURATION.md, D-237 | — | TASK-0105 |
| Kur ve iş günü takvimi | REQ-ADM-013…015, D-139, D-140 | SPIKE-11: tarihli dosya ve `Tarih` doğrulaması, `Unit` bölmesi, yerel saatle iş günü, tek `exchange_rate.missing`, bekleyen tutarların tamamlanması | TASK-0106 |
| Belge ve depolama | ADR-003, REQ-DOC | SPIKE-09: yetki denetimli kısa ömürlü bağlantı, sürdürmede yeni bağlantı; SPIKE-15: tarayıcıda küçültme, parçalı sürdürülebilir yükleme; SPIKE-16: yerel OCR iki geçiş, "okunuyor" işareti; SPIKE-10: PDF'te Geist `latin` + `latin-ext`, üst/altbilgiye ayrıca yazı tipi | TASK-0107 |
| Bildirim ve görev çekirdeği | REQ-TSK, D-130…D-133, ADR-018, D-252 | SPIKE-13: SSE sarmalayıcısı, veri isteğinde yeniden deneme ve `online` yenilemesi, sinyal yalnız tür taşır | TASK-0108 |
| Revizyon talebi çekirdeği | CONFIGURATION.md, REQ-ADM, D-141 | — | TASK-0109 |
| Site geneli arama temeli | REQ-NFR-012, ADR-017, D-247, D-248, `docs/ui-ux/SEARCH.md`, D-251 | SPIKE-12: tam eşleşme aralık yazımı; soğuk ilk istek istisnası; aksan katlama | TASK-0110 |
| Uygulama kabuğunda alt bant yuvası | SCREEN_PATTERNS.md | — | TASK-0028 |
| Kod adlarının sözlükle hizalanması, odak halkası ve Türkçe erişilebilir adlar | GLOSSARY, D-225 | — | TASK-0043, TASK-0054 |
| M1 — sahibin kendi makinesinde yerel kabul | D-245, LOCAL_SETUP.md | — | TASK-0111 |

## 4. Yapım sırası

Sıra bağımlılıktan gelir; her adım bir öncekinin üstüne kurulur.

1. **Zemin:** TASK-0099 (sınır kuralı), TASK-0100 (CI), TASK-0043 ve TASK-0054 (küçük hizalamalar).
2. **Veri erişimi:** TASK-0101, ardından TASK-0076.
3. **Kimlik ve yetki:** TASK-0102. Bundan sonraki her şey yetkiyi kullanır.
4. **Kayıt güvencesi:** TASK-0103 (denetim), TASK-0104 (outbox ve iş kuyruğu).
5. **Yapılandırma:** TASK-0105, TASK-0106.
6. **Hizmetler:** TASK-0107 (belge), TASK-0108 (bildirim ve görev), TASK-0109 (revizyon talebi), TASK-0110 (arama).
7. **Kabuk:** TASK-0028.
8. **Kabul:** TASK-0111 (M1).

## 5. Bu fazın dışında kalanlar

- Sunucu, dağıtım hattı, izleme ve uzak yedek; e-posta sağlayıcısı ve alan adı: DEF-008 → Phase 09 çıkışı. Phase 07'de e-posta kanalı yerel bir test posta kutusuna karşı kurulur.
- Self-host Supabase'e geçiş: D-250 → Phase 19, gerçek veriden önce.
- Çevrimdışı giriş: DEF-002 → ilk pilot geri bildiriminden sonra.
- Açık kalan uyum maddesi: R2 kovasının herkese açık `r2.dev` adresi gerçek dosyadan önce kapatılmalıdır (ADR-003); AB yargı bölgeli kova kararı gerçek personel dosyalarından önce verilir (D-249).

## 6. Kabul

Temel özellikler T1 kapısından geçer; M1 yerel kabulü sahibin geri bildirimiyle kaydedilir (D-245); barındırılan dağıtım ve geri dönüş Phase 09 pilotundan önce doğrulanır (DEF-008). Arama temelinin eklenmesiyle Phase 07 tahmini 8–11 iş gününden yaklaşık 10–13 iş gününe çıkar.

## 7. Görev uygulama planları

### TASK-0099 — Sınır kuralının MODULE_MAP'ten üretilmesi (T2)

- **Amaç:** bugünkü "modüller arası içe aktarım tamamen yasak" kuralını, MODULE_BOUNDARIES bölüm 2'nin öngördüğü biçime getirmek: bir modül başka modülü yalnız grafikte izinli bir okla ve yalnız `index.ts` üzerinden kullanır. İzinli oklar elle yazılmaz, `docs/architecture/MODULE_MAP.md`'den üretilir; grafik döngüsüzlüğü ve modüllerin başka modül şemasına SQL ile erişmemesi `npm run check` içinde denetlenir (SPIKE-17).
- **Bağımlılık:** yok.
- **Kural anlamı (MODULE_MAP'ten):** düz oklar doğrudan bağımlılıktır, geçişli değildir; kesikli oklar olaydır, kod bağımlılığı sayılmaz. Her iş modülü altı platform modülünü (IAM, AUD, DOC, WFL, TSK, ADM) kullanabilir. Platform modülleri iş modüllerine bağımlı olamaz.
- **Uygulama katmanı (`src/app`):** rotalar bileşimin köküdür. MODULE_BOUNDARIES kuralı modüller arasını bağlar; rotalar bir modülün `index.ts`'ini ve `ui/` ekranlarını kullanabilir, `application/`, `domain/`, `infrastructure/` gibi iç klasörlerine giremez.
- **Etkilenen dosyalar:** `eslint.config.mjs`; yeni `scripts/module-graph.mjs` (grafik okuma, döngü denetimi, politika üretimi) ve testi; yeni `scripts/check-schema-access.mjs` ve testi; kuralın gerçek yapılandırmayla sınandığı `scripts/boundaries.test.mjs`; `package.json` (`check` ve `check:commit`); yeni `src/modules/iam/index.ts`; IAM'in iç yollarını kullanan rotalar `@/modules/iam` üzerinden geçer.
- **Veritabanı / arayüz:** değişiklik yok. Davranış değişikliği yok; yalnız içe aktarım yolları.
- **Güvenlik:** veri sahipliği kuralını (MODULE_BOUNDARIES bölüm 1) makineyle korur.
- **Testler:** grafik okuyucu (gerçek MODULE_MAP: kenar sayısı, kesikli okların dışarıda kalması, platform grubunun tanınması, döngü yok; yapay döngünün yakalanması); gerçek ESLint yapılandırmasıyla sonda testleri (izinli ok + `index.ts` geçer; iç klasöre erişim, göreli yol, `import type`, dinamik içe aktarım, yeniden dışa aktarma, grafiğe aykırı yön ve platformdan iş modülüne erişim engellenir; rota `ui/` ve `index.ts` kullanabilir, iç klasöre giremez); şema taraması (başka modül şeması yakalanır, SQL olmayan dizge ve yorum sayılmaz); bütün repo temiz.
- **Göç:** yok. **Geri dönüş:** tek commit geri alınır.
- **Kabul:** `npm run check` bütün yeni denetimlerle geçer; sonda testleri kuralın gerçekten engellediğini gösterir; MODULE_MAP biçimi bozulursa kural sessizce gevşemek yerine hata verir.

### TASK-0100 — GitHub CI (T2)

- **Amaç:** yerel pre-commit kapısının aynısını her push ve pull request'te GitHub'da koşmak; kanca atlanarak yapılmış bir commit de `main`'de yeşil kalamaz (D-110, `docs/infrastructure/CI.md` bölüm 2).
- **Bağımlılık:** TASK-0099 (sınır denetimleri kapının parçası).
- **Etkilenen dosyalar:** yeni `.github/workflows/ci.yml`; `docs/infrastructure/CI.md`.
- **Kararlar:** Node 24 ve `npm ci` (D-253); kapı `npm run check:commit`; eylemler değişebilen etiketle değil commit özetiyle sabitlenir (RISK-004); iş yalnız okuma yetkisiyle çalışır; **tam git geçmişi** alınır, çünkü kayıt denetimi "Last updated" damgasını dosyanın son commit tarihiyle karşılaştırır ve silinmiş yolları arar; sığ klonda her dosya bugün değişmiş görünürdü.
- **Bu görevde olmayanlar:** CI.md bölüm 2'deki şema, sözleşme, erişilebilirlik, klavye ve kontrast testleri; bunların sınadığı şeyler (tablolar, yetenek kataloğu, ekranlar) ilgili görevlerle geldikçe eklenir.
- **Veritabanı / arayüz / güvenlik:** değişiklik yok; gizli anahtar kullanılmaz.
- **Test:** ilk push'ta iş yeşil biter (`gh run`); kapının GitHub'da gerçekten koştuğu ve tam geçmişle çalıştığı çıktıdan doğrulanır.
- **Geri dönüş:** iş dosyası silinir. **Kabul:** `main`'e her push'ta CI koşar ve geçer.

### TASK-0101 — Veri erişim temeli: göçler, kısıtlı çalışma rolü, işlem yerel kimlik (T1)

- **Amaç:** ADR-015'in Phase 07 koşullarını ürün koduna taşımak. Uygulama veritabanına yalnız kendi kısıtlı giriş rolüyle, doğrulanmış TLS ile bağlanır; kullanıcı isteğinden gelen her sorgu, kimliğin işlemin ilk ifadesinde yazıldığı bir işlemde çalışır; şema değişikliği sıralı, geri dönüşü yazılı SQL göçleriyle yapılır. Sonraki bütün görevler tablolarını bu temelin üstüne yazar.
- **Bağımlılık:** TASK-0100.
- **Kararlar (D-254):**
  - Sürücü `pg`, tipli sorgu kurucu **Kysely**. Kysely SQL'e yakın kalır, kod üretimi ve kendi şema dili yoktur; göçler ve RLS politikaları düz SQL olarak kalır (CONVENTIONS bölüm 10–11). Drizzle kendi şema dili ve göç aracıyla gelir; RLS politikası, sahiplik ve yetki ifadelerini yine elle yazmak gerekirdi.
  - Göç aracı küçük ve bizde: `db/migrations/NNNN_ad.sql` dosyaları sırayla, her biri tek işlemde uygulanır; uygulanan dosyanın adı ve SHA-256 özeti `core.schema_migration`'a yazılır; uygulanmış bir dosya değişirse araç durur. Eşzamanlı iki çalıştırmayı danışma kilidi (advisory lock) engeller. Her göçün yanında geri alma dosyası (`NNNN_ad.down.sql`) durur ya da dosyada `-- irreversible: <neden>` satırı bulunur; araç ikisinden biri yoksa çalışmaz (CONVENTIONS bölüm 11). `-- --rollback-last` son göçü geri alır; geri alınamayan göçün dönüşü göç öncesi dökümdür.
  - **Doğrulanmış TLS:** Supabase sunucu sertifikası kendi kök sertifikasıyla imzalı (Supabase Root 2021 CA); sistem sertifika deposuyla doğrulanamıyor (ölçüldü). Kök sertifika depoya konur (`db/certs/supabase-root-2021-ca.crt`, gizli değildir) ve her bağlantı `rejectUnauthorized: true` ile bu sertifikaya karşı doğrulanır. Sertifika bağlantı el sıkışmasından okundu; sahibin Supabase panelinden indirdiği sertifikanın parmak iziyle karşılaştırılması kayıt altına alınır. Self-host geçişinde (D-250) yol `DATABASE_CA_CERT_PATH` ile değişir. Doğrulamasız bağlantıya geri düşüş yoktur.
  - **Ayrı giriş rolü:** `geoges_app` — giriş yapabilir; süper kullanıcı değil, RLS'i atlayamaz, rol/veritabanı oluşturamaz, hiçbir role üye değildir; bağlantı sınırı var. Yetkiler her göçte tablo tablo verilir: `SELECT/INSERT/UPDATE`; `DELETE` hiçbir tabloda yok (CONVENTIONS bölüm 2); göç tablosu ve yetki tabloları yazılamaz. Uygulama sunucusu yönetici bağlantısını hiç bilmez: çalışma bağlantısı yalnız `DATABASE_APP_URL`. Parola `npm run db:app-role` ile üretilip `.env.local`'a eklenir (var olan satırlara dokunulmaz, hiçbir yere yazdırılmaz); aynı komut parolayı veritabanında ayarlar.
  - **İşlem yerel kimlik:** `core.current_user_id()` ve `core.current_role_id()` işlem yerel `app.user_id` / `app.role_id` değişkenlerini okur; değişken yoksa `NULL` döner ve RLS hiçbir satır göstermez. Değişkenler parametreyle `set_config(..., true)` ile yazılır; havuzlu oturumda `SET` / `SET ROLE` kullanılmaz (işlem havuzunda oturum durumu başka isteğe geçebilir).
  - **Zaman sıralı UUID:** PostgreSQL 17'de `uuidv7()` yok (ölçüldü); `core.uuid_v7()` SQL işlevi birincil anahtar varsayılanı olur (CONVENTIONS bölüm 2).
  - **Göç öncesi döküm:** `npm run db:backup` `pg_dump` 17 ile `backups/` klasörüne (Git dışı) döküm alır; `db:migrate` son bir saatte alınmış döküm yoksa durur. Tek istisna: veritabanında hiç uygulanmış göç yokken (korunacak ürün verisi yok) ilk göç. Bu makinede PostgreSQL komut satırı araçları kurulu değil ve Docker çalışmıyor; ikinci göçten (TASK-0102) önce araçların kurulması gerekir, sahibe sorulur.
- **CI'da göç sınaması (CI.md bölüm 4):** GitHub'da ayrı bir `database` işi, bu çalıştırma için üretilen sertifikayla TLS açık geçici PostgreSQL 17 başlatır; göçleri uygular, ikinci çalıştırmanın boş geçtiğini doğrular, gerçek veritabanı testlerini koşar, göçleri tek tek geri alır, yeniden uygular ve testleri tekrarlar. Göç dökümü kuralından yalnız CI'nin bu makinedeki geçici veritabanı muaftır.
- **Etkilenen dosyalar:** yeni `db/migrations/0001_core_foundation.sql` ve `0001_core_foundation.down.sql`, `.github/workflows/ci.yml`, `vitest.db.config.mts`, `db/certs/supabase-root-2021-ca.crt`; yeni `scripts/db-migrate.mjs`, `scripts/db-backup.mjs`, `scripts/db-app-role.mjs` ve ortak `scripts/db-admin.mjs`; yeni `src/platform/db/` (bağlantı yapılandırması, havuz, `runAsUser`, kimlik doğrulaması, Kysely bağlama); `package.json` (bağımlılıklar ve komutlar); `.env.example`; `.gitignore` (`backups/`); `vitest.config.mts`; `scripts/check-schema-access.mjs` (ham SQL yalnız `modules/<kod>/data/` ve `src/platform/db/` içinde; `pg` yalnız `src/platform/db/` içinde).
- **Veritabanı (0001):** `core` şeması; `core.schema_migration`; `core.uuid_v7()`, `core.current_user_id()`, `core.current_role_id()`; `geoges_app`'e `core` kullanımı ve işlevleri çalıştırma yetkisi, başka hiçbir şey. `public` şemasında uygulama nesnesi yok; `anon` / `authenticated` (PostgREST) uygulama şemalarına erişemez. Ürün tablosu bu görevde yok.
- **Backend:** `runAsUser(identity, work)` havuzdan bağlantı alır → `BEGIN` → kimlik ve `statement_timeout` işlem yerel yazılır → iş, o bağlantıya bağlı Kysely işlemiyle çalışır → `COMMIT`. Hata olursa `ROLLBACK`; `ROLLBACK` da başarısız olursa bağlantı havuza geri verilmez, yok edilir (yarım işlem başka isteğe geçemez). Kimlik UUID olarak doğrulanır; havuz ve ham istemci dışa verilmez. Modül `server-only` işaretlidir. Kimliği doğrulanmış oturumdan üretmek TASK-0102'nin işi (kullanıcı ve rol tabloları orada); bu görevde yalnız sözleşme kurulur.
- **Frontend:** değişiklik yok.
- **Güvenlik:** ADR-015 koşullarının dördü de burada karşılanır. Sırlar yazdırılmaz; bağlantı hatası iletisi yalnız hata kodu olarak kaydedilir. Deneme yardımcısının kapalı sertifika doğrulaması ve geniş yetkileri ürüne kopyalanmaz. Servis bağlantısı yalnız göç, döküm ve rol komutlarında kullanılır.
- **Testler:** (1) Birim (CI'da): yapılandırma sertifikasız ya da doğrulamasız bağlantıyı reddeder; kimlik doğrulaması; `runAsUser` sahte istemciyle `BEGIN → set_config → iş → COMMIT` sırası, hata halinde `ROLLBACK`, `ROLLBACK` hatasında bağlantının yok edilmesi; göç aracının dosya sırası, özet uyuşmazlığı ve döküm kuralı; SQL ve `pg` konum denetimi. (2) Gerçek veritabanı (`npm run test:db`; yerelde Supabase test projesine, CI'da geçici veritabanına karşı): `geoges_app` havuz üzerinden doğrulanmış TLS ile bağlanır, yanlış sertifikayla bağlanamaz; rol öznitelikleri ve üyelikleri; geçici sınama şemasında RLS'li tabloyla kimliksiz işlemde sıfır satır ve yazma reddi, kimlikle yalnız kendi satırı; kimliğin sonraki işleme sızmadığı (eşzamanlı çok sayıda işlemde); hata veren işlemin geri alındığı; parametre olarak verilen SQL parçasının etkisiz kaldığı; `DELETE`, göç tablosuna yazma, `public` / `core`'da tablo oluşturma, `SET ROLE postgres` ve `auth.users` okumanın reddedildiği. Sınama şeması test sonunda kaldırılır.
- **Göç:** 0001 Supabase test projesine uygulanır (veritabanı ~12 MB; Free Plan sınırı 500 MB). **Geri dönüş:** `0001_core_foundation.down.sql` işlevleri kaldırır, şema yetkisini geri alır ve rolü siler (Supabase yönetici rolü `drop owned` kullanamadığı için yetkiler adıyla geri alınır); `core.schema_migration` araca aittir ve kalır. Kod commit'i geri alınır.
- **Kabul:** göç aracı 0001'i uygular ve ikinci çalıştırmada hiçbir şey yapmaz; uygulama rolü yalnız doğrulanmış TLS ile bağlanır; gerçek veritabanı testlerinin hepsi geçer; `npm run check` geçer; kalan tek sahip adımı (panel sertifikası parmak izi karşılaştırması ve PostgreSQL araçlarının kurulumu) kayıtlıdır.

### TASK-0076 — Sıfırlama komutları ve yapılandırmanın taşınması (T2)

- **Amaç:** D-246'yı kurmak: `db:reset:data` örnek iş verisini siler, yapılandırmayı korur; `db:reset:config` yapılandırmayı da fabrika ayarına döndürür ve onay ister; `config:export` / `config:import` yapılandırmayı dosyayla başka ortama taşır, çakışmayı raporlar, üzerine yazmaz; gerçek veri girildiği gün iki sıfırlama da kilitlenir (ENVIRONMENTS bölüm 4a–4b, LOCAL_SETUP bölüm 7).
- **Bağımlılık:** TASK-0101 (göç aracı, yönetici bağlantısı).
- **Temel fikir — her tablo katmanını söyler:** bugün ürün tablosu yok; tablolar sonraki görevlerle gelecek. Komutlar tablo adı ezberlemez: her tablo kendi göçünde `core.table_layer`'a katmanıyla kaydolur: `seed` (başlangıç verisi), `config` (yapılandırma), `business` (örnek iş verisi) ya da `system` (göç defteri gibi araç tabloları; hiçbir komut dokunmaz). Göç aracı her göçün sonunda, aynı işlem içinde denetler: uygulama şemalarında kaydı olmayan tablo varsa göç geri alınır. Böylece yeni bir tablo sıfırlamanın veya taşımanın dışında kalamaz.
- **Yön kuralı (yabancı anahtarlar):** `seed` yalnız `seed`'e, `config` `seed` ve `config`'e, `system` yalnız `system`'e başvurabilir; `business` her şeye başvurabilir. Aykırı başvuru göçü durdurur. Böylece iş verisi silinince yapılandırma kırılmaz ve dışa aktarılan yapılandırma iş kaydına bağlı kalmaz.
- **`db:reset:data`:** tek işlemde bütün `business` tablolarını boşaltır (`TRUNCATE … RESTART IDENTITY`), ardından başlangıç verisi dosyalarını yeniden çalıştırır. Yapılandırma durur.
- **`db:reset:config`:** önce yapılandırmayı otomatik olarak dışa aktarır (sahibin emeği dosyada kalır), sonra `business`, `config` ve `seed` tablolarını boşaltıp başlangıç verisini yeniden kurar. Onay ister: komut isteminde `SIFIRLA` yazılır; betikle çalıştırmada `--onay=SIFIRLA`.
- **Başlangıç ve örnek verisi:** başlangıç verisi `db/seeds/NNNN_ad.sql`, tekrar çalıştırılabilir (sabit kimlikli ekle-ya-da-güncelle); sabit kimlik şarttır, çünkü başka ortama taşınan yapılandırma bu satırlara kimlikle başvurur. `db:migrate` bekleyen göçlerden sonra başlangıç verisini de çalıştırır. Örnek veri `db/samples/NNNN_ad.sql`, `npm run db:sample` ile yüklenir. Bugün iki klasör de boş; dosyalar modüllerle gelir.
- **Kilit:** `core.environment` tek satırlık tablo; `real_data_started_at` doluysa iki sıfırlama ve örnek veri yükleme reddedilir. `npm run db:mark-real-data` işareti koyar (onay ister, geri alınmaz; canlıya geçiş adımıdır).
- **`config:export`:** `config` tablolarının bütün satırlarını tek JSON dosyasına yazar: biçim sürümü, tarih, veritabanının son uygulanmış göçü, tablo tablo satırlar (üretilmiş sütunlar hariç). Dosya `exports/` altına (Git dışı) ya da verilen yola yazılır. İş verisi ve arama yardımcıları girmez.
- **`config:import`:** hedefin son göçü dosyadakiyle aynı değilse durur (şemalar ayrışmıştır). Satırları birincil anahtarla karşılaştırır: hedefte yoksa eklenir; aynıysa atlanır; farklıysa çakışmadır. **Tek bir çakışma bile varsa hiçbir şey yazılmaz**, çakışmalar tablo ve anahtarla listelenir. Ekleme sırası yabancı anahtar bağımlılığından hesaplanır. `--dry-run` yalnız raporlar.
- **Etkilenen dosyalar:** yeni `db/migrations/0002_table_layers.sql` + `.down.sql`; `db/seeds/`, `db/samples/` (boş, `.gitkeep`); `scripts/db-migrate.mjs` (katman denetimi, göç sonrası başlangıç verisi); yeni `scripts/db-layers.mjs` (kayıt, yön kuralı, kilit, boşaltma, başlangıç verisi), `scripts/db-reset.mjs`, `scripts/db-sample.mjs`, `scripts/db-mark-real-data.mjs`, `scripts/config-transfer.mjs`; testler; `package.json`; `.gitignore` (`exports/`); `vitest.db.config.mts` (betik veritabanı testleri); ENVIRONMENTS, LOCAL_SETUP, CONVENTIONS (katman kaydı kuralı).
- **Veritabanı (0002):** `core.table_layer (schema_name, table_name, layer)` ve `core.environment`; ikisi ve `core.schema_migration` `system` olarak kaydolur. `geoges_app` bu tablolara erişemez; komutlar yönetici bağlantısıyla çalışır.
- **Backend / Frontend:** uygulama kodu değişmez; bunlar komut satırı araçlarıdır. Sahibin çalıştırdığı komutların iletileri Türkçedir.
- **Güvenlik:** komutlar yönetici bağlantısıyla ve doğrulanmış TLS ile çalışır; sır yazdırılmaz. Dışa aktarma dosyası kişisel veri içermemelidir; yapılandırma tablolarına kişisel veri konmaması katman seçiminin parçasıdır.
- **Testler:** birim — yön kuralı, bağımlılık sırası (döngü hatası dahil), çakışma karşılaştırması, onay ve dosya biçimi denetimi. Gerçek veritabanı (geçici sınama şemasında, katmanları kayıtlı tablolarla; sıfırlama ve taşıma işlevleri yalnız o şemaya sınırlanır, böylece test gerçek örnek veriye dokunmaz): kaydı olmayan tabloyla ve yasak yönlü başvuruyla göçün geri alındığı; `reset:data`'nın iş verisini silip yapılandırmayı tuttuğu ve başlangıç verisini geri kurduğu; `reset:config`'in önce dışa aktarıp sonra hepsini sıfırladığı; kilitliyken ikisinin de reddedildiği; dışa aktarılan dosyanın boş bir hedefe aynen yüklendiği, ikinci yüklemenin hepsini atladığı, farklı satırın çakışma olarak raporlanıp hiçbir şey yazılmadığı ve göç sürümü farklı hedefin reddedildiği.
- **Göç ve ön koşul:** 0002 ikinci göçtür; kural gereği öncesinde döküm alınmalı ve bunun için `pg_dump` 17 gerekir (bu makinede yok). Döküm alınamazsa 0002 test projesine uygulanmaz; kod ve testler CI'nin geçici veritabanında doğrulanır, uygulama döküm aracı kurulunca yapılır. **Geri dönüş:** `0002_table_layers.down.sql` iki tabloyu kaldırır.
- **Sonraki görevlere taşınan kurallar:** her yeni tablo katmanıyla kaydolur. Denetim ve kayıt geçmişi tablolarının (TASK-0103) katmanı ve sıfırlamada iş kaydı geçmişinin silinip yapılandırma geçmişinin korunması o görevin planında kararlaştırılır. Sıfırlanan örnek belgelerin R2'deki dosyaları TASK-0107'de temizlenir. Örnek kullanıcıların katmanı TASK-0102'de belirlenir; sahibin hesabı hiçbir sıfırlamada silinmez. `config:import` bir denetim kaydı bırakır (TASK-0103).
- **Kabul:** dört komut ve kilit çalışır; kayıtsız tablo içeren göç geçemez; testler CI'da geçer; `npm run check` geçer.
