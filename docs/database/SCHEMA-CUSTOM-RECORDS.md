# Şema — Kullanıcı Tanımlı Kayıt Türleri

Durum: CONFIRMED (sahip, 2026-09-20) · Son güncelleme: 2026-09-20

ADR-016 ve D-241'in tablo karşılığı. Kullanıcının tanımladığı her tür aynı tabloları kullanır; yeni tür göç gerektirmez. Ortak kurallar `docs/database/CONVENTIONS.md`'dedir. Görev: TASK-0071. Ekranlar ve oluşturucu Phase 09R'dedir (D-105).

## Tablolar

| Tablo | Ne tutar | Ayırt edici sütunlar |
|---|---|---|
| `cst.record_type` | Tür tanımı | `key`, `name`, `module_group` (menüdeki yeri, D-223), `status`, `in_search`, `in_reports`, `on_today`, `version_no` |
| `cst.field` | Alan tanımı | `record_type_id`, `code`, `label`, `type` (text/number/date/select/boolean), `is_required`, `data_class`, `is_searchable`, `is_filterable`, `options` (jsonb), `retired_at`, `order_no` |
| `cst.relation` | İlişki tanımı | `record_type_id`, `code`, `label`, `target` (project/site/party/employee/asset/material/contract/custom), `target_record_type_id`, `cardinality` |
| `cst.permission_rule` | Türün yetki tanımı | `record_type_id`, `role_id`, `can_read`, `can_write`, `scope_mode` (all/own_scope) |
| `cst.record` | Kayıt | `record_type_id`, `status`, **`scope_type`**, **`scope_ids[]`**, `owner_user_id`, `fields` (jsonb), `type_version_no` |
| `cst.record_link` | İlişki değeri | `record_id`, `relation_id`, `target_schema`, `target_table`, `target_id` |

`fields` JSONB'dir; kapsam, sahip ve durum JSONB'nin dışındadır, çünkü yetki ve listeleme bu sütunlarla çalışır.

## Yetki

- `cst.record` üzerinde **tek** RLS politikası vardır: kullanıcının etkin kapsamı ile satırın `scope_type`/`scope_ids[]` karşılaştırılır, ardından `cst.permission_rule` okunur.
- Alan düzeyi veri sınıfı süzmesi sunucu katmanındadır: hassas veya ticari işaretli alan, izni olmayanın sorgusundan çıkarılır (JSONB'den okunmadan).
- Yeni tür eklemek yeni politika **gerektirmez**; ADR-016'nın en önemli kazancı budur.

## Dizinler

- `cst.record (record_type_id, status)` ve `(record_type_id, scope_type)` temel dizinlerdir.
- `is_searchable` veya `is_filterable` işaretli her alan için ifade dizini kurulur: `((fields ->> 'alan_kodu'))`. Dizinler tür tanımından üretilir; elle yazılmaz.
- Aranabilir alanlar ayrıca `core.search_row`'a yazılır (ADR-017); tür adı arama sonuçlarında grup olur.

## Doğrulama

- Yazma anında `fields`, tür tanımına göre doğrulanır: bilinmeyen alan reddedilir, zorunlu alan boş bırakılamaz, tip uyuşmazlığı hata verir.
- Doğrulama tek bir yerde (veri katmanı) yapılır; ekran ve akış aynı doğrulamayı çağırır.

## Değişiklik ve geçmiş

- Alan silinmez: `retired_at` yazılır, JSONB'deki değerler yerinde kalır, ekranlarda görünmez, geçmişte görünür (D-094).
- Alan tipi değiştirilemez; yeni alan açılır, eskisi emekliye ayrılır.
- Her kayıt, yazıldığı tür sürümünü (`type_version_no`) taşır; böylece eski kayıt hangi tanıma göre girildiği bilinerek okunur.
- Değişiklikler `aud.record_history` kanalına yazılır; kullanıcı tanımlı kayıtlar için de "kim neyi değiştirdi" tutulur.

## Sınırlar (D-241)

50 tür · tür başına 60 alan · 10 aranabilir alan · 10 ilişki türü. Sınırlar mühendislik ayarıdır ve veritabanı kısıtıyla değil, tanım kaydedilirken denetlenir.

## Yapamayacakları

`cst.record`, defter tablolarına (stok, cari, gelir-gider, puantaj) satır üretemez (WFL-K7). Akışlarda yalnız "taslak oluştur" ve "durum değiştir" aksiyonları açılır; kendi olaylarını (`custom_record.created`, `custom_record.status_changed`) yayımlar.

## Phase 06

SPIKE-08 bu şemayı uçtan uca sınar: tanım → giriş → RLS → arama → rapor → alan emekliye ayırma, 50 bin kayıtla.
