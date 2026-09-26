# Kalite Kapıları (Definition of Done)

Durum: Kabul edildi (ADR-008) · 2026-09-15

## Risk kademeleri

| Kademe | Kapsam |
|---|---|
| **T1 — Kritik** | Kimlik doğrulama, yetki/RLS, audit, veri modeli ve migration, finansal hesaplar, stok/defter mantığı, iş akışı motoru, hassas kişisel veri, altyapı ve deploy |
| **T2 — Standart** | Olağan ekranlar ve iş mantığı |
| **T3 — Hafif** | Metin, stil, davranışı değiştirmeyen UI düzeltmeleri, dokümantasyon |

Kararsız kalınırsa üst kademe uygulanır.

## Feature / görev Definition of Done

| Kontrol | T1 | T2 | T3 |
|---|---|---|---|
| Requirements (bağlı REQ'ler karşılandı) | ✔ | ✔ | — |
| Business Logic (sahip onaylı iş kuralları) | ✔ + sahip onayı | ✔ | — |
| Architecture (modül sınırları, katmanlar) | ✔ | ✔ | — |
| Data Model | ✔ | ✔ | — |
| Authorization | ✔ | ✔ | — |
| Security | ✔ | ✔ | — |
| Implementation | ✔ | ✔ | ✔ |
| UI/UX (COSS, tasarım kuralları) | ✔ | ✔ | ✔ |
| Responsive Design | ✔ | ✔ | ✔ |
| Accessibility (WCAG 2.2 AA) | ✔ | ✔ | ✔ |
| Loading / Empty / Error / Permission denied states | ✔ | ✔ | — |
| Edge Cases | ✔ | ✔ | — |
| Tests (otomatik) | ✔ | ✔ | — |
| Performance Review | ✔ | gerekirse | — |
| Self-review adımı (aşağıdaki liste) | ✔ belgeli | ✔ | ✔ kısa |
| Documentation | ✔ | ✔ | ✔ |
| State Documentation Updated | ✔ | ✔ | ✔ |
| Naming conventions / Domain terminology / Glossary | ✔ | ✔ | ✔ |
| No Turkish internal names, no ambiguous abbreviations | ✔ | ✔ | ✔ |
| Migration + rollback planı | ✔ | gerekirse | — |

Zorunlu bir kontrol başarısızsa: `STATUS: NOT COMPLETE`.

## Self-review kontrol listesi (ayrı adım olarak yürütülür)

Kodu yazan model, uygulamadan sonra ayrı bir adımda ve sonucu yazılı olarak:

1. Gereksinim ve kabul kriterleri tek tek karşılandı mı?
2. İş mantığı tek yerde mi, başka modülün tablosuna erişim var mı?
3. Yetki: her okuma/yazma yolu RLS ve uygulama katmanında korunuyor mu? Ticari ve hassas veri sızıyor mu?
4. Girdi doğrulama istemci ve sunucuda var mı?
5. Hata, boş, yükleniyor, yetkisiz durumları var mı?
6. Tekrarlanan istek/çift gönderim (idempotency) güvenli mi?
7. Audit gereken işlemler audit'e yazılıyor mu?
8. Testler hem mutlu yolu hem kenar durumları kapsıyor mu, gerçekten çalıştırıldı mı?
9. Performans: gereksiz sorgu/waterfall, N+1 var mı?
10. İsimlendirme ve glossary uyumu.
11. COSS dışında element kullanıldı mı (kullanıldıysa onay kaydı var mı)?
12. Etkilenen diğer modüller ve dokümanlar güncellendi mi?
13. Ekranda grafikle daha çabuk okunacak bir sayı (ilerleme, dağılım, karşılaştırma, günden güne değişim) var mı; varsa grafik eklendi mi (`docs/ui-ux/DESIGN_SYSTEM_RULES.md` §14, D-297)?

## Phase Gate biçimi

```text
PHASE NN – NAME

ENTRY CRITERIA
[ ] ...

EXIT CRITERIA
[ ] ...
```

Tüm zorunlu çıkış kriterleri tamamlanmadan aşama `DONE` olmaz.

## Phase Completion Report biçimi

```text
PHASE COMPLETION REPORT
Requirements             PASS/FAIL
Architecture             PASS/FAIL
Database                 PASS/FAIL
Backend                  PASS/FAIL
Frontend                 PASS/FAIL
UI/UX                    PASS/FAIL
Accessibility            PASS/FAIL
Responsive               PASS/FAIL
Security                 PASS/FAIL
Edge Cases               PASS/FAIL
Tests                    PASS/FAIL
Documentation            PASS/FAIL
Project State Updated    PASS/FAIL

Remaining Issues: ...
STATUS: DONE | NOT COMPLETE
```
