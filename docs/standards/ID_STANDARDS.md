# ID Standartları

Durum: Kabul edildi · 2026-09-15

ID'ler kalıcıdır: silinen veya iptal edilen kaydın ID'si yeniden kullanılmaz, kayıt `CANCELLED` / `SUPERSEDED` olarak işaretlenir.

| Tür | Biçim | Örnek | Nerede tutulur |
|---|---|---|---|
| Gereksinim | `REQ-<MODUL>-<NNN>` | `REQ-SIT-014` | `docs/requirements/REQ-<MODUL>.md`, indeks `ai/REQUIREMENTS.md` |
| Feature | `FEAT-<MODUL>-<NNN>` | `FEAT-INV-003` | `docs/features/FEAT-<MODUL>-<NNN>-<kebab-ad>.md` |
| Görev | `TASK-<NNNN>` (proje geneli sıralı) | `TASK-0081` | `ai/TASKS.md` |
| Mimari karar | `ADR-<NNN>` | `ADR-006` | `docs/decisions/ADR-<NNN>-<kebab-ad>.md` |
| Kısa karar | `D-<NNN>` | `D-012` | `ai/DECISIONS.md` |
| Değişiklik talebi | `CHG-<NNN>` | `CHG-004` | `ai/DECISIONS.md` |
| Açık soru | `OQ-<NNN>` | `OQ-021` | `ai/OPEN_QUESTIONS.md` |
| Ertelenen | `DEF-<NNN>` | `DEF-002` | `ai/DEFERRED.md` |
| Risk | `RISK-<NNN>` | `RISK-001` | `ai/CURRENT_STATE.md` |
| Spike | `SPIKE-<NNN>` | `SPIKE-003` | `docs/architecture/spikes/` |
| Bilinen hata | `BUG-<NNN>` | `BUG-017` | `ai/CURRENT_STATE.md` / GitHub Issues |

`<MODUL>` kodları `docs/architecture/MODULE_MAP.md` içindeki 3 harfli kodlardır.

## İzlenebilirlik bağı

Her feature spesifikasyonu ve görev, bağlı olduğu ID'leri açıkça yazar:

```text
REQ-SIT-014
FEAT-SIT-002
TASK-0112, TASK-0113
DATABASE: site_daily_logs, casting_entries
APPLICATION: siteDailyLogService
UI: DailyLogCastingTable
TEST: site-daily-log-casting.spec.ts
```

Commit mesajları ilgili ID'yi içerir: `feat(sit): add casting totals (TASK-0112)`.

## Görev kaydı alanları

`ID · Title · Tier (T1/T2/T3) · Status · depends_on · Linked REQ/FEAT · Notes`
