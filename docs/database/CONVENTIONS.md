# Veritabanı Sözleşmeleri

Durum: CONFIRMED (sahip, 2026-09-20) · Son güncelleme: 2026-09-20

Phase 04'ün ortak kuralları: adlandırma, anahtarlar, tipler, para ve miktar duyarlığı, zaman, durum, geçmiş, silme, dizin ve göç düzeni. Her modül şeması bu kurallara uyar. Görev: TASK-0065. Kararlar: D-243, D-244. Mimari: `docs/architecture/PORTS_AND_SERVICES.md` (ADR-015), `docs/architecture/PERMISSIONS.md`.

## 1. Adlandırma

- Tablo, sütun ve kısıt adları **İngilizce** ve `snake_case` (ADR-010). Tablo adı tekildir: `daily_site_log`, `progress_payment`.
- Her tablo **sahibi modülün** ön ekini taşıyan şemada durur: `sit.daily_site_log`, `fin.progress_payment`. Şema adı modül kodunun küçük harflisidir.
- Yabancı anahtar sütunu hedefin adıyla biter: `site_id`, `created_by_user_id`.
- Boole sütunları `is_`/`has_` ile başlar: `is_late_entry`, `has_photo`.
- Kısıt adları: `pk_<tablo>`, `fk_<tablo>__<hedef>`, `uq_<tablo>__<sütunlar>`, `ck_<tablo>__<kural>`, `ix_<tablo>__<sütunlar>`.

## 2. Anahtarlar ve ortak sütunlar

- Birincil anahtar `id uuid` (zaman sıralı UUID). Dış dünyaya görünen numaralar (hakediş no, sipariş no) ayrı ve okunabilir sütunlardır.
- Her iş tablosunda: `created_at timestamptz`, `created_by_user_id`, `updated_at`, `updated_by_user_id`, `created_in_role_id` (REQ-IAM-013).
- **Kapsam sütunları** yetkinin temelidir (`PERMISSIONS.md`): kaydın bağlı olduğu `site_id` / `project_id` / `unit` sütunlarından en az biri her iş tablosunda bulunur; şirket geneli kayıtlarda `scope = 'company'`.
- Kayıtlar **silinmez** (REQ-AUD-002): `status` sütununda `cancelled` olur, `cancelled_at`, `cancelled_by_user_id`, `cancel_reason` doldurulur. `DELETE` yetkisi hiçbir uygulama rolünde yoktur.

## 3. Para (D-243)

- Tutarlar `numeric(18,2)`; **kuruş bazında** saklanır.
- **Yuvarlama satırdadır:** her satır kuruşa yuvarlanır, toplam satırların toplamıdır. Böylece ekrandaki satırlarla toplam ve fatura birebir tutar.
- Dövizli her tutar **üç sütunla** saklanır: `amount` (asıl tutar), `currency`, `amount_try` (TL karşılığı) ve kullanılan `exchange_rate numeric(18,6)` ile `exchange_rate_date`. Onaylı kayıt sonradan kur düzeltilse de değişmez (REQ-ADM-015).
- Oran ve yüzdeler `numeric(9,4)`; marj, fire oranı ve KPI ağırlığı buraya girer.
- Hiçbir para sütunu `float` değildir.

## 4. Miktar ve ölçü (D-244)

| Ne | Tip |
|---|---|
| Panel, lug, parça adedi | `integer` |
| m², metre | `numeric(14,2)` |
| Ağırlık (kg, ton) | `numeric(14,3)` |
| Saat | `numeric(6,2)` |
| Yüzde | `numeric(9,4)` |

m² gibi türetilen ölçüler **saklanır ve hesaplandığı kural sürümüyle birlikte tutulur** (REQ-SIT-015); ekranda yeniden hesaplanmaz.

## 5. Zaman

- Bütün zaman damgaları `timestamptz`, UTC saklanır; ekranda `Europe/Istanbul` gösterilir.
- Takvim günü (günlük kayıt tarihi, hakediş dönemi) `date`'tir; saat dilimiyle kaymaz.
- Saat aralıkları (döküm başlangıç–bitiş) `time` sütun çiftidir; gece yarısını aşan vardiya için `end_at` ertesi güne işaretli `boolean` taşır.
- Çalışma takvimi ve tatiller ADM'dedir (`CONFIGURATION.md`); hiçbir modül kendi tatil listesini tutmaz.

## 6. Durum ve katalog

- Durum sütunları `text` + `check` kısıtıdır; değerler kodda sabittir (`draft`, `submitted`, `approved`, `cancelled`…). Durum makinesi kodda tanımlanır, veritabanı yalnız geçersiz değeri engeller.
- **Kullanıcının yönettiği listeler** (gider kategorisi, panel tipi, iş kalemi) `enum` değil **katalog tablosudur**; kalem eklemek göç gerektirmez (REQ-ADM-001).
- Katalog kalemleri silinmez, pasifleşir; birleştirme yönlendirme bırakır (`CONFIGURATION.md` bölüm 2).

## 7. Geçmiş ve denetim

- Her iş tablosunun alan bazlı değişiklik geçmişi AUD'ye yazılır: kayıt, alan, eski değer, yeni değer, kim, ne zaman, neden (REQ-AUD-001…004). Yazma, veri katmanındaki tek bir kanaldan geçer; modüller kendi geçmiş tablosunu kurmaz.
- İzni olmayan kullanıcı, hassas alanın geçmişinde yalnız "değişti" görür (REQ-AUD-004).
- Denetim ve geçmiş satırları silinmez ve güncellenmez (D-231).

## 8. Defter tabloları

- Stok, cari ve gelir-gider **defterdir**: satır eklenir, hiçbir satır güncellenmez veya silinmez. Düzeltme, ters kayıtla yapılır.
- Defter satırı kaynağını taşır: hangi modül, hangi kayıt, hangi olay.
- Bakiye ve stok miktarı türetilir; ayrı bir "güncel bakiye" sütunu kaynak sayılmaz, yalnız hızlandırma amaçlı tutulur ve defterden yeniden kurulabilir.

## 9. Dizinler

- Her yabancı anahtar dizinlidir.
- Liste ekranlarının varsayılan sıralaması ve süzgeçleri (durum + tarih + kapsam) birleşik dizin alır.
- Arama satırı ve üç yardımcı veri kümesinin sorgu/indeks düzeni ADR-017 ve D-247 ile tanımlıdır; yalnız GIN eklemek RLS altında hız garantisi değildir. İç arama numarası istisnası UUID birincil anahtarı değiştirmez (`SCHEMA-PLATFORM.md`).
- Dizin, ekranın gerçek sorgusundan türetilir; "olur da lazım olur" dizini eklenmez.

## 10. Satır düzeyi güvenlik

- **Her tabloda RLS açıktır.** Politikasız tablo yoktur; yeni tablo eklerken politika aynı göçte yazılır.
- Politika kapsam sütunlarını ve kullanıcının etkin yetkisini okur (`PERMISSIONS.md` bölüm 2).
- RLS'i atlayan servis bağlantısı yalnız göçler ve outbox işleyicisi içindir (ADR-015).

## 11. Göç düzeni

- Göçler ileri yönlüdür ve **önce ekle, sonra kaldır** kuralına uyar: yeni sütun eklenir, kod iki biçimi de okur, veri taşınır, eski sütun sonra kaldırılır.
- Her göç geri alınabilir olmalıdır; geri alınamayan adım (veri silen) ayrı göç olur ve gözden geçirilir.
- Üretimde tabloyu kilitleyen işlemler (büyük `ALTER`) ayrı bakım penceresinde çalışır; Phase 05 bunu işletim tarafında tanımlar.
- Başlangıç verisi (roller, yetki tipleri, varsayılan kataloglar, akış şablonları) ayrı ve tekrar çalıştırılabilir dosyalardadır.

## 12. Sınama

- Her tablo için: RLS politikası var mı, kapsam sütunu var mı, geçmiş kanalına bağlı mı — bu üçü otomatik denetlenir (şema testi).
- Sözleşme testleri ayrıca modülün başka şemanın tablosuna erişmediğini denetler (`MODULE_BOUNDARIES.md` bölüm 5).
