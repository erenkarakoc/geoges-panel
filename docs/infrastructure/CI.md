# Sürekli Entegrasyon ve Kalite Kapısı

Durum: CONFIRMED (sahip, 2026-09-20) · Son güncelleme: 2026-09-22

Her commit'te ve her push'ta neyin otomatik denetlendiği. Yerel kapı bugün çalışıyor; GitHub tarafı Phase 07'de kurulur. Görev: TASK-0074. İlgili: `docs/standards/QUALITY_GATES.md`, ADR-008.

## 1. Yerel kapı (bugün çalışıyor)

`npm run check:commit` her commit'ten önce koşar (pre-commit kancası):

1. `records` — kayıt tutarlılığı (görevler, kararlar, atıflar, tarih damgaları)
2. `boundaries` — hiçbir modül başka modülün şemasına SQL ile erişmiyor (TASK-0099); SQL cümleleri yalnız veri katmanında (TASK-0101)
3. `typecheck` — TypeScript
4. `lint` — ESLint + modül sınırları; izinli bağımlılıklar MODULE_MAP'ten üretilir, grafikte döngü varsa durur (ADR-001, TASK-0099); `pg`, `kysely` ve `@/platform/db` yalnız modül veri katmanından (TASK-0101)
5. `test` — birim testleri; sınır kuralının gerçek yapılandırmayla sonda testleri dahil
6. `format:check` — Prettier

Başarısızsa commit olmaz. Commit sonrası kanca `origin/main`'e push eder.

Gerçek veritabanı testleri (`npm run test:db`) `.env.local` ister; yerelde elle çalıştırılır, CI'da ise aşağıdaki geçici veritabanına karşı koşar.

## 2. GitHub tarafı (Phase 07)

**Kuruldu (TASK-0100, 2026-09-21):** `.github/workflows/ci.yml`, `main`'e her push'ta ve her pull request'te yerel kapının aynısını (`npm ci`, ardından `npm run check:commit`) Node 24 ile koşar. Tam git geçmişiyle çalışır, çünkü kayıt denetimi tarih damgalarını son commit tarihiyle karşılaştırır. Eylemler commit özetiyle sabitlenmiştir (RISK-004).

Aşağıdaki ek adımlar, sınadıkları şey (tablolar, yetenek kataloğu, ekranlar) ilgili görevle geldiğinde eklenir:

| Adım | Ne yapar | Kırılırsa |
|---|---|---|
| Kurulum | `npm ci` (kilit dosyasıyla birebir) | Bağımlılık sürümü ayrışmış |
| Şema testi | Her tabloda kapsam sütunu, RLS politikası ve geçmiş kanalı var mı (`docs/database/COVERAGE.md` bölüm 3) | Eksik politika |
| Sözleşme testi | Yetenek kataloğu ile kod ayrışmış mı (D-078) | İlan ile kod uyuşmuyor |
| Erişilebilirlik taraması | Her ekran, iki temada, iki genişlikte (D-225) | WCAG ihlali |
| Klavye yolu testi | Ekran baştan sona klavyeyle kullanılabiliyor mu (REQ-NFR-016) | Ulaşılamayan öğe |
| Kontrast testi | Tema renk çiftleri eşiği tutuyor mu | Token değişikliği eşiği bozmuş |
| Derleme | `next build` | Üretim derlemesi kırık |
| Bağımlılık denetimi | Bilinen güvenlik açığı taraması | Açık bulundu |

Kırmızı bir adım `main`'e girişi engeller.

## 3. Test türleri ve ne zaman zorunlu oldukları

Kademe kuralı ADR-008'den gelir:

| Kademe | Örnek | Zorunlu testler |
|---|---|---|
| T1 (kritik) | Yetki, para, defter, akış motoru | Birim + entegrasyon + uçtan uca; sınır durumları yazılı |
| T2 | Modül ekranları, raporlar | Birim + en az bir uçtan uca akış |
| T3 | Yardımcı ekranlar, kozmetik | Birim yeterli |

Her T1 işinde "bu nasıl yanlış gidebilir" listesi test olarak yazılır (`docs/standards/QUALITY_GATES.md`).

## 4. Göç ve veri

- Göç dosyası içeren bir değişiklik, CI'da boş bir veritabanına uygulanıp geri alınarak sınanır. **Kuruldu (TASK-0101, 2026-09-22):** `database` işi, bu çalıştırma için üretilmiş sertifikayla TLS açık geçici bir PostgreSQL 17 başlatır; bütün göçleri uygular, ikinci çalıştırmanın hiçbir şey yapmadığını doğrular, veritabanı testlerini koşar, göçleri tek tek geri alır, yeniden uygular ve testleri tekrarlar. Supabase'e özgü `anon`, `authenticated` rolleri ve `auth.users` tablosu için yer tutucular kurulur.
- Başlangıç verisi her CI çalışmasında yeniden kurulur; örnek veri yalnız yerelde.
- Gerçek veri hiçbir zaman CI'ya girmez.

## 5. Sürüm ve dağıtım

Sunucu kararı ertelendiği için otomatik dağıtım yoktur (D-245). Sunucu kurulduğunda bu belgeye şu adımlar eklenir: derleme → göç → dağıtım → sağlık kontrolü → başarısızsa geri alma. Dağıtım, kapı yeşil olmadan çalışmaz.

Göç aracı, 0020 öncesinde eksik PostgreSQL arama eklentilerini (`pg_trgm`, `intarray`, `btree_gist`) `extensions` şemasına kurar. Başka şemada bulunan eklentiyi kendiliğinden taşımaz. Böylece temiz CI ve kendi sunucumuza kurulum, test projesinde önceden bulunan eklentilere dayanmaz. 0020 geri dönüşü rol izinlerini de kaldırır; sağlayıcının eklentilerini silmez. 2026-09-23: CI 35804892677 bu eksikliği yakaladı; düzeltme TASK-0110 kapsamında.
