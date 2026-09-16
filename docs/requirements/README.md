# Gereksinimler

Durum: Phase 01'de doldurulacak · 2026-09-15

## Kaynaklar

- `docs/sources/functional-scope.md` (fonksiyonel kapsam, birincil kaynak; "Özellik Yapısı §N")
- `docs/sources/architecture-principles.md` (mimari ilkeler; "Mimari §N")
- Phase 00 ve Phase 01 kararları (`ai/DECISIONS.md`)

Bu dosyalar ayrıştırılıp REQ kayıtlarına dönüştükten sonra `docs/sources/` klasörü silinir (TASK-0027). Kaldırmadan önce `ai/REQUIREMENTS.md` kapsama tablosunda her bölümün tamamlandığı doğrulanır.

## Dosya düzeni

Modül başına bir dosya: `REQ-<MODUL>.md` (ör. `REQ-SIT.md`). Modül kodları: `docs/architecture/MODULE_MAP.md`.

## REQ kayıt şablonu

```text
### REQ-SIT-001 — <kısa başlık>

- Kaynak: Özellik Yapısı §9.3
- Modül: SIT
- Öncelik: Must / Should / Could
- Kademe: T1 / T2 / T3
- Açıklama: ...
- İş kuralları: ...
- Kabul kriterleri:
  - [ ] ...
- Bağlı: FEAT-..., TASK-...
- Durum: DRAFT / CONFIRMED / DEFERRED (DEF-...) / SUPERSEDED
```

Her gereksinim tek bir doğrulanabilir davranış anlatır. Kararsız noktalar gereksinime gömülmez, `ai/OPEN_QUESTIONS.md`'ye yazılır.
