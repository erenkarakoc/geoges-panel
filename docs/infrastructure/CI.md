# Sürekli Entegrasyon ve Kalite Kapısı

Durum: TASLAK · Son güncelleme: 2026-09-20

Her commit'te ve her push'ta neyin otomatik denetlendiği. Yerel kapı bugün çalışıyor; GitHub tarafı Phase 07'de kurulur. Görev: TASK-0074. İlgili: `docs/standards/QUALITY_GATES.md`, ADR-008.

## 1. Yerel kapı (bugün çalışıyor)

`npm run check:commit` her commit'ten önce koşar (pre-commit kancası):

1. `records` — kayıt tutarlılığı (görevler, kararlar, atıflar, tarih damgaları)
2. `typecheck` — TypeScript
3. `lint` — ESLint + modül sınırları (ADR-001)
4. `test` — birim testleri
5. `format:check` — Prettier

Başarısızsa commit olmaz. Commit sonrası kanca `origin/main`'e push eder.

## 2. GitHub tarafı (Phase 07)

Push ve pull request'te aynı adımlar sunucuda tekrar koşar, üstüne:

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

- Göç dosyası içeren bir değişiklik, CI'da boş bir veritabanına uygulanıp geri alınarak sınanır.
- Başlangıç verisi her CI çalışmasında yeniden kurulur; örnek veri yalnız yerelde.
- Gerçek veri hiçbir zaman CI'ya girmez.

## 5. Sürüm ve dağıtım

Sunucu kararı ertelendiği için otomatik dağıtım yoktur (D-245). Sunucu kurulduğunda bu belgeye şu adımlar eklenir: derleme → göç → dağıtım → sağlık kontrolü → başarısızsa geri alma. Dağıtım, kapı yeşil olmadan çalışmaz.
