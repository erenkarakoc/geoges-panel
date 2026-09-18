# İsimlendirme Standartları

Durum: Kabul edildi (ADR-010) · 2026-09-15

## Kesin kural

```text
CODE AND INFRASTRUCTURE  = ENGLISH
DATABASE SCHEMA          = ENGLISH + snake_case
TYPESCRIPT               = ENGLISH + ecosystem conventions
USER INTERFACE           = Türkçe
DOMAIN TERMINOLOGY       = docs/domain/GLOSSARY.md içindeki canonical terimler
```

Türkçe değişken, fonksiyon, sınıf, tablo, kolon, API, event, env değişkeni oluşturulmaz. Terim sözlükte yoksa önce isimlendirme karar süreci işletilir: kavram → anlam analizi → sektör terminolojisi → aday terimler → karar → `GLOSSARY.md`.

## Database (PostgreSQL / Supabase)

- `snake_case`, tablolar çoğul isim: `sites`, `daily_logs`, `stock_movements`.
- Önek/sonek yok: `tbl_users`, `users_table` kullanılmaz.
- Modül öneki yalnızca çakışma varsa ve modül haritasında tanımlıysa kullanılır (Phase 04'te kesinleşir).
- Birincil anahtar `id`; yabancı anahtar `<entity>_id`: `site_id`, `project_id`.
- Zaman: `created_at`, `updated_at`, `deleted_at`; alan özel: `approved_at`, `effective_from`, `effective_to`, `started_at`, `completed_at`.
- Boolean: `is_`, `has_`, `can_`, `should_` önekleri. Gerçek bir durum varsa boolean yerine `status`.
- Durum değerleri İngilizce ve küçük harf: `draft`, `pending_approval`, `approved`, `correction_requested`, `rejected`, `cancelled`.
- Belirsiz kolonlar (`type`, `value`, `data`, `status`, `date`, `name`) yalnızca bağlamda tek anlamlıysa; aksi halde `document_type`, `effective_date`, `display_name`.
- Kısaltma yok (`usr`, `proj`, `qty`); evrensel olanlar serbest: `id`, `url`, `api`, `ip`, `uuid`, `vat`.
- Para: `amount` + `currency_code` + gerekirse `exchange_rate` ve `amount_try`.

## TypeScript / React

- Değişken ve fonksiyon: `camelCase` (`calculateSiteProfit`, `currentUser`).
- Component, class, type, interface, enum: `PascalCase` (`DailyLogCastingTable`, `StockMovement`).
- Sabitler: `UPPER_SNAKE_CASE` (`MAX_UPLOAD_SIZE`).
- Anlamsız isimler yasak: `data`, `temp`, `result2`, `helper`, `utils2`, `misc`, `obj`. Kısa döngü sayaçları hariç.
- Genel `utils/`, `helpers/`, `common/` klasörleri yerine sahiplik: `modules/inventory/domain/`, `modules/site/lib/`.

## Dosya ve klasör

- Dosya ve klasörler `kebab-case`: `daily-log-casting-table.tsx`, `stock-ledger-service.ts`.
- Framework özel dosyaları framework adıyla: `page.tsx`, `layout.tsx`, `route.ts`, `loading.tsx`, `error.tsx`.
- Kural lint ile zorunlu tutulur (Phase 07).

## API ve DTO

- Resource odaklı, İngilizce, kebab-case yollar: `/api/daily-logs`, `/api/stock-movements/:id`.
- CRUD dışı domain eylemleri açıklayıcı alt eylem: `POST /api/daily-logs/:id/submit`, `POST /api/daily-logs/:id/approve`.
- Payload `camelCase`; veritabanı `snake_case`; dönüşüm tek merkezde.

## Event

- `<entity>.<past_tense_verb>` biçimi, küçük harf: `daily_site_log.approved`, `stock_movement.recorded`, `progress_payment.submitted`.
- Aynı olay farklı isimlerle temsil edilmez.

## Ortam değişkenleri ve altyapı

- `UPPER_SNAKE_CASE`, İngilizce: `SUPABASE_URL`, `R2_BUCKET_NAME`, `APP_BASE_URL`.
- Ortam adları: `development`, `staging`, `production`.
- Servis/worker/queue: `kebab-case`: `pdf-rendering`, `exchange-rate-sync`.

## Test

- Dosya: `<kapsam>.spec.ts` / `<kapsam>.test.ts` (Phase 07'de biri seçilir).
- `data-testid` değerleri İngilizce `kebab-case`.

## UI metinleri

- Kullanıcıya görünen metinler Türkçe ve bileşen içinde yazılır (ADR-011).
- Internal değerler UI'da Türkçeye çevrilir: `pending_approval` → "Onay bekliyor".

## İsimlendirme inceleme listesi

İngilizce mi? Sektör standardı mı? Anlamı tek mi? Glossary'de canonical terim var mı? Casing kuralına uyuyor mu? Uygulama detayını gereksizce içeriyor mu? Fazla genel mi? Gereksiz kısaltma var mı? Bir yıl sonra anlamlı olur mu?

## Mevcut isimlerin değiştirilmesi

Doğrudan rename yapılmaz. Önce: mevcut isim · önerilen isim · referanslar · veritabanı etkisi · API etkisi · migration gereği · geriye uyumluluk · risk. Production tablo/kolonları kontrollü migration ve rollback planıyla değiştirilir.
