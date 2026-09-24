# Veri Kapsama Denetimi

Durum: CONFIRMED (sahip, 2026-09-20) · Son güncelleme: 2026-09-22

Phase 04 çıkış denetimi: verisi olan her gereksinimin bir tablosu var mı, her tablonun kapsam sütunu, RLS politikası ve geçmiş kanalı var mı, adlandırma standartlara uyuyor mu. Görev: TASK-0072. Kabul ölçütü `ai/MASTER_ROADMAP.md` Phase 04'tedir.

## 1. Modül → tablo sayısı

| Şema | Tablo | Gereksinim dosyası |
|---|---|---|
| `iam` | 12 | REQ-IAM (27) |
| `aud` | 5 | REQ-AUD (10) |
| `doc` | 4 | REQ-DOC (10) |
| `wfl` | 7 | REQ-WFL (39) |
| `tsk` | 5 | REQ-TSK (13) |
| `adm` | 12 | REQ-ADM (15) |
| `core` | 10 | Altyapı (ADR-014, ADR-017, D-247, D-259) |
| `prj` | 7 | REQ-PRJ (11) |
| `sit` | 17 | REQ-SIT (35) |
| `inv` | 11 | REQ-INV (27) |
| `pur` | 6 | REQ-PUR (11) |
| `fac` | 7 | REQ-FAC (10) |
| `eqp` | 11 | REQ-EQP (21) |
| `crm` | 6 | REQ-CRM (14) |
| `qte` | 7 | REQ-QTE (18) |
| `fin` | 17 | REQ-FIN (30) |
| `hr` | 16 | REQ-HR (16) |
| `cmp` | 11 | REQ-CMP (17) |
| `qhs` | 11 | REQ-QHS (16) |
| `mtg` | 4 | REQ-MTG (8) |
| `sup` | 3 | REQ-SUP (5) |
| `rpt` | 8 | REQ-RPT (23) |
| `prf` | 7 | REQ-PRF (20) |
| `int` | 5 | REQ-INT (14) |
| `str` | 7 | REQ-STR (8) |
| `cst` | 6 | REQ-WFL-035…039 |
| **Toplam** | **222** | 438 gereksinim |

İlk Phase 04 belgeleri 212 tablo içeriyordu; önceki toplamın 211 yazılması sayım hatasıydı (TASK-0092). CHG-007 / D-247 üç türetilmiş arama tablosu ekledi. REQ-NFR-012 artık bu yardımcılarla birlikte core.search_row üzerinden açıkça izlenir. TASK-0102, işlemde hangi rolün seçildiğini hatırlayan `iam.user_action_role_choice` tablosunu ekledi (REQ-IAM-013, D-256). TASK-0104 olay omurgasına `core.event_subscription` ve `core.read_model`'i ekledi (D-259). TASK-0105 tarihli kuralı `wfl.rule`'dan `adm.rule`'a taşıdı ve kural anahtarı kaydını (`adm.rule_key`) ekledi (D-260). TASK-0106 kur alımının gün başına durumunu tutan `adm.exchange_rate_fetch`'i ekledi (D-261). Tasarım sayısıdır; göç uygulanmış tablo sayısı değildir.

MIG (veri aktarımı) ertelendiği için tablosu yoktur (DEF-001).

## 2. Verisi olmayan gereksinimler

Bunlar davranış, hedef veya işletim kuralıdır; tablo beklemezler. Doğrulamaları testlerde ve Phase 05/06'dadır.

| Gereksinim | Neden tablosu yok |
|---|---|
| REQ-NFR-001, REQ-NFR-002 | Sistem ilkesi (kaydı olmayan iş tamamlanmış sayılmaz; tek resmî kayıt) |
| REQ-NFR-003 | Dış kaynaktan gelen verinin işaretlenmesi — ilgili tabloların `source_*` sütunlarıyla karşılanır |
| REQ-NFR-006…011, REQ-NFR-016 | Arayüz, dil, marka, erişilebilirlik hedefleri |
| REQ-NFR-013…015 | Ekran kalıpları; verisi ilgili modüldedir |
| REQ-NFR-017…020 | Performans, yedek, günlükleme, felaket kurtarma — Phase 05 |
| REQ-SIT-032 | Onaylı verinin dağılması; olay altyapısıyla karşılanır (ADR-014) |
| REQ-WFL-006, REQ-WFL-020 | Motorun yapamayacakları ve sistem yetkisi — kısıt ve kod kuralı |
| REQ-IAM-017, REQ-IAM-023 | Görünürlük ilkesi; `iam.role.has_full_visibility` kısıtıyla zorlanır |

## 3. Tablo başına zorunlu üçlü

Kural 2026-09-24'te ölçülüp yeniden yazıldı (D-277, OQ-037). Önceki metin "her tabloda kapsam
sütunu" diyordu ve o gün duran elli tablonun yirmiden fazlasını yanlış tarif ediyordu: döviz kuru
şirket geneli, belge sürümü ve çıkarılmış metin kapsamı taşıyan belgenin altında, bildirim bir yere
değil bir kişiye ait. Kural artık kayıt defterinin (`core.table_layer`) diliyle söyleniyor ve
**kapsamın nereden geldiği beyan ediliyor**; test beyanı denetler, sütun adından tahmin etmez.
(Tahminin neden yetmediği: `adm.rule_key.unit` sütunu değerin birimidir — "gün", "TL" — kapsam
değil.)

1. **Kapsam kaynağı (`scope_source`).** Tabloyu kuran göç dört değerden birini yazar:
   - `own` — kaydın kökü; `scope_type`/`site_id`/`project_id`/`unit`'ten en az birini taşır.
   - `parent` — kapsamı ait olduğu satırdan alır (belge sürümü, revizyon etkisi, teslimat).
   - `person` — satır bir kişiye aittir (bildirim, oturum, kurtarma kodu).
   - `company` — daha dar bir kapsam yoktur (döviz kuru, katalog, rol, yetki).
2. **RLS politikası.** Uygulama rolünün herhangi bir yetkisi olan her tabloda satır güvenliği açık
   ve en az bir politika vardır. Hiç yetki verilmemiş tabloda denetlenen şey **yetkinin yokluğudur**;
   bu politikadan güçlüdür ve `iam.login_attempt` ile `iam.recovery_code`'un neden politikasız
   olduğunun cevabıdır (D-272).
3. **Geçmiş kanalı.** `business` ve `config` katmanında kendi kapsamını taşıyan (`own`) her tablo
   `tracked`'dır, yani `aud.record_history`'ye bağlıdır. Geri kalan tablolar geçmiş türünü kayıt
   defterinde ayrıca beyan eder (`tracked` / `append_only` / `none`) ve göç koşucusu beyanı
   tetikleyicilerle karşılaştırır.

Muafiyet artık elle tutulan bir liste değil, katmanın kendisidir: `system` katmanı (defterler,
denetim kaydı, kuyruk, arama yardımcıları, göç kaydı) üçlünün geçmiş maddesinin dışındadır.

Denetimin yeri: kayıt beyanını ve `own` iddiasını göç koşucusu her göçte denetler
(`scripts/db-layers.mjs`); üçlünün tamamı `npm run test:db` içindeki
`scripts/schema-coverage.dbtest.mjs` ile gerçek veritabanına karşı ölçülür ve CI'ın `database` işinde
koşar. Testin kendi sınırı yazılıdır: yanlış beyan edilmiş bir tabloyu ancak `own` dediği halde
kapsam taşımıyorsa yakalar; ötesi göç incelemesinin işidir.

## 4. Adlandırma denetimi

- Tablo ve sütun adları İngilizce, `snake_case`, tekil tablo adı (ADR-010, `docs/standards/`).
- Sözlükteki terimlerle eşleşme: `docs/domain/GLOSSARY.md`'deki kayıt adları tablo adlarının kaynağıdır (`DailySiteLog` → `sit.daily_site_log`).
- `dashboard` ve `widget` sözcükleri şemada geçmez (TASK-0043 ile aynı kural).
- Para sütunları `amount`/`amount_try`/`exchange_rate` üçlüsüyle adlandırılır (D-243).

## 5. Açık bırakılanlar

| Konu | Nerede kapanır |
|---|---|
| Dizinlerin tam listesi | Phase 07, ekranların gerçek sorgularıyla birlikte |
| Okuma modellerinin yenileme sıklığı | Phase 06 ölçümünden sonra (SPIKE-14) |
| Bordro parametrelerinin tam alan listesi | Dilim 4 (HR) öncesinde, güncel mevzuatla |
| Arşiv metin çıkarma sütunlarının boyutu | SPIKE-16 sonucuna göre |
