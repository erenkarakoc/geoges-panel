# Kaynak Girdiler (geçici)

Durum: Geçici · 2026-09-16

Bu klasör, projenin başlangıçta verilen kapsam ve protokol dosyalarını tutar. `/ai` ve `/docs` bu dosyalardan türetilmiştir.

| Dosya | Eski adı (kök dizin) | İçerik |
|---|---|---|
| `functional-scope.md` | `Geoges Panel Özellik Yapısı.md` | Fonksiyonel kapsam, 46 bölüm. Birincil gereksinim kaynağı. Dokümanlarda "Özellik Yapısı §N" diye anılır. |
| `architecture-principles.md` | `Geoges Panel Mimari.md` | Mimari ilkeler. Dokümanlarda "Mimari §N" diye anılır. |
| `ai-development-protocol.md` | `AI_Destekli_Proje_Gelistirme_Ana_Promptu.md` | Mühendislik protokolü; `ai/PROJECT_RULES.md` içine revize edilerek aktarıldı. |

## Silinme koşulu (TASK-0027)

Bu klasör Phase 01 çıkışında silinir. Silmeden önce:

1. `ai/REQUIREMENTS.md` kapsama tablosunda her bölümün REQ kayıtlarına tamamen aktarıldığı doğrulanır.
2. Mimari ilkelerin ADR'lara ve `docs/architecture/` altına aktarıldığı doğrulanır.
3. Sahip onayı alınır.

Silindikten sonra da Git geçmişinden erişilebilir kalır.

## Silme engeli (CHG-005, D-075)

Bu klasör **TASK-0039 tamamlanmadan silinemez.** Kayıtların gövdesi buraya bölüm numarasıyla atıf yapıyor (§9.4, §40.2, §45 gibi). Numaralar REQ kimliklerine taşınmadan silme yapılırsa yüzlerce kararın dayanağı kaybolur. TASK-0027 bu yüzden `BLOCKED` durumundadır.
