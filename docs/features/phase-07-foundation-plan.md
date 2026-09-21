# Phase 07 — Temel Yapım Planı

Durum: ONAYLANDI (sahip, 2026-09-21) · Tarih: 2026-09-21 · Faz: Phase 07 · Bağlı: `ai/MASTER_ROADMAP.md`, CHG-009, D-250…D-253

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
