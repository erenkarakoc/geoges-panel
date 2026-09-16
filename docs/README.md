# Dokümantasyon

`/docs` klasörü Türkçe yazılır; tablo, kolon, event, dosya adı gibi teknik tanımlayıcılar İngilizce kalır (ADR-010, ADR-011).

| Klasör | İçerik | Dolduğu aşama |
|---|---|---|
| `architecture/` | Modül haritası, bağımlılık grafiği, mimari tasarımlar, spike raporları | Phase 00, 03, 06 |
| `decisions/` | Mimari karar kayıtları (ADR) | Her aşama |
| `requirements/` | Gereksinim kayıtları (REQ) | Phase 01 |
| `domain/` | Terim sözlüğü, domain modeli, iş kuralları, olay kataloğu | Phase 00, 01 |
| `features/` | Feature spesifikasyonları (FEAT) | Phase 03 ve slice'lar |
| `database/` | Şema, RLS matrisi, migration kuralları | Phase 04 |
| `security/` | Veri sınıflandırma, KVKK, yetki tasarımı | Phase 01, 03 |
| `infrastructure/` | Ortamlar, CI/CD, yedekleme, izleme, runbook'lar | Phase 05 |
| `workflows/` | İş akışı tanımları, onay zincirleri | Phase 01, 08 |
| `ui-ux/` | Tasarım sistemi kuralları, ekran ve akış spesifikasyonları | Phase 00, 02 |
| `standards/` | ID, isimlendirme, kalite kapısı, git kuralları | Phase 00 |
| `sources/` | Geçici kaynak girdiler (fonksiyonel kapsam, mimari ilkeler, protokol); Phase 01 sonunda silinir | Phase 00 → Phase 01 |
