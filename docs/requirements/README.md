# Gereksinimler

Durum: Phase 01'de dolduruluyor · Son güncelleme: 2026-09-18

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

Gereksinim numaraları kayıt denetiminde doğrulanır: bir kayıtta geçen her `REQ-XXX-NNN`, burada `### REQ-XXX-NNN` başlığıyla tanımlı olmalıdır (`npm run records`).

## Yetenek kataloğu şablonu (CHG-006, D-078, TASK-0041)

Her `REQ-<MODUL>.md` dosyası, modülün iş akışı tasarımcısına sunduklarını sonunda bir **Yetenek kataloğu** bölümüyle ilan eder. Tasarımcıdaki her kutu bu kataloglardan gelir; ilan edilen her yetenek Phase 03'te tanımlanacak sözleşme testleriyle koda karşı doğrulanır. Yayımlanmış bir yetenek silinmez, yalnızca eklenir ya da "kullanımdan kalktı" işaretlenir.

```text
## Yetenek kataloğu — <MODUL>

### Olaylar
| Kod | Ad | Ne zaman | Taşıdığı alanlar | Veri sınıfı |

### Aksiyonlar
| Kod | Ad | Girdi | Gereken yetki | İki kez çalışırsa | Yarıda kalırsa |

### Koşul alanları
| Kod | Ad | Tip | Veri sınıfı |
```

- **Olay kodu:** `<entity>.<past_tense_verb>`, küçük harf (NAMING_CONVENTIONS): `daily_site_log.approved`.
- **Aksiyon kodu (öneri, Phase 03'te sözleşme biçimiyle kesinleşir):** `<entity>.<verb>`: `task.open`, `approval.request`.
- **Koşul alanı kodu:** `<entity>.<field>`: `daily_site_log.damaged_unit_count`.
- **Terimler sözlükten gelir** (`docs/domain/GLOSSARY.md`); sözlükte yasaklı alternatif olan bir kelime (ör. `flow`, `waste`) kodda kullanılmaz.
- **Veri sınıfı:** genel · iç · ticari · hassas kişisel. Hassas kişisel alan bildirim metnine konamaz (D-091).
- **Aksiyonlar asla defter kesinleştirmez** (D-080); böyle bir aksiyon katalogda yayımlanamaz.
- "İki kez çalışırsa" ve "yarıda kalırsa" sütunları, aksiyonun tekrarlanan ve kesilen çalıştırmalarda ne yaptığını söyler; motorun güvenilir çalışması buna dayanır.

İlk örnek: `REQ-WFL.md` sonundaki katalog.
