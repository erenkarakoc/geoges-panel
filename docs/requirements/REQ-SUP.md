# REQ-SUP — İç Destek Talepleri

Durum: CONFIRMED (sahip, 2026-09-19) · 2026-09-19 · Modül: SUP (Support)

Kaynaklar:.

**Sınır.** Eskalasyon mekanizması REQ-TSK-006'dadır. Malzeme ve ekipman ihtiyacı için satın alma talebi REQ-PUR'dadır; destek talebi o talebe dönüştürülebilir. Rol hiyerarşisi REQ-IAM-014'tedir.

Terimler (`docs/domain/GLOSSARY.md`): Support Ticket, Role.

---

### REQ-SUP-001 — Destek talebi açılır

- Kaynak: Özellik Yapısı (eşleme: `docs/requirements/README.md`)
- Öncelik: Must · Kademe: T2
- Katman: Sabit + Tanım
- Tanımla ayarlanan: kategoriler (başlangıç: donanım, panel hatası, malzeme/ekipman ihtiyacı, idari talep, diğer)
- Açıklama: Her kullanıcı bir ihtiyaç veya sorun için talep açar: kategori, konu, açıklama, ek/fotoğraf, öncelik, ilgili şantiye veya birim ve muhatap kişi veya rol.
- Kabul kriterleri:
  - [ ] Muhatap seçilmeden talep açılmaz.
- Durum: CONFIRMED

### REQ-SUP-002 — Talebin altında mesajlaşma

- Kaynak: Özellik Yapısı (eşleme: `docs/requirements/README.md`)
- Öncelik: Must · Kademe: T2
- Katman: Sabit
- Açıklama: Talep açan ve muhatap talebin altında mesajlaşır; ek ve fotoğraf eklenebilir.
- Kabul kriterleri:
  - [ ] Her yeni mesaj karşı tarafa bildirim olarak düşer.
- Durum: CONFIRMED

### REQ-SUP-003 — Çözme, gerekçeli ret ve üste sevk

- Kaynak: Özellik Yapısı (eşleme: `docs/requirements/README.md`)
- Öncelik: Must · Kademe: T2
- Katman: Sabit + Akış
- Akışla ayarlanan: kimin kime talep açabileceği ve pozisyona göre sevk zinciri (ör. Formen → Koordinatör → Genel Müdür)
- Açıklama: Muhatap talebi çözer, gerekçeyle reddeder veya yetki gerektiriyorsa hiyerarşide üst pozisyona sevk eder. Malzeme veya ekipman ihtiyacı talebi, satın alma talebine dönüştürülebilir (REQ-PUR-007).
- Kabul kriterleri:
  - [ ] Ret gerekçesiz yapılamaz.
  - [ ] Sevk edilen talebin geçmişinde kimden kime ve ne zaman sevk edildiği görünür.
- Durum: CONFIRMED

### REQ-SUP-004 — Durumlar

- Kaynak: Özellik Yapısı (eşleme: `docs/requirements/README.md`)
- Öncelik: Must · Kademe: T2
- Katman: Sabit + Tanım
- Tanımla ayarlanan: çözülen talebin kendiliğinden kapanma süresi
- Açıklama: Talep şu durumlardan geçer: Açık → İşlemde → Beklemede → Çözüldü veya Reddedildi → Kapatıldı. Çözülen talebi açan kişi kapatır veya yeniden açar; belirli süre içinde işlem yapmazsa talep kendiliğinden kapanır ('den türetilen kural, sahip onayladı).
- Kabul kriterleri:
  - [ ] Her durum geçişi kişi ve zamanla talebin geçmişinde görünür.
- Durum: CONFIRMED

### REQ-SUP-005 — Cevapsız talep eskale olur

- Kaynak: REQ-TSK-006
- Öncelik: Must · Kademe: T2
- Katman: Akış
- Akışla ayarlanan: cevapsız talebin bekleme süreleri ve eskalasyon zinciri (varsayılan akış: cevapsız destek talebi)
- Açıklama: Cevapsız kalan talep görev motorunun eskalasyon kurallarıyla üst seviyeye çıkar.
- Kabul kriterleri:
  - [ ] Eskale olan talep ilk muhatabın listesinden düşmez.
- Durum: CONFIRMED

---

## Yetenek kataloğu — SUP

Biçim: `docs/requirements/README.md`.

### Olaylar

| Kod | Ad | Ne zaman | Taşıdığı alanlar | Veri sınıfı |
|---|---|---|---|---|
| `support_ticket.opened` | Destek talebi açıldı | Talep açıldığında | kategori, öncelik, muhatap | iç |
| `support_ticket.unanswered` | Destek talebi cevapsız | Bekleme süresi geçtiğinde | talep, muhatap, bekleme | iç |
| `support_ticket.resolved` | Destek talebi çözüldü | Çözüldü işaretlendiğinde | talep, çözen | iç |

### Aksiyonlar

Yok.

### Koşul alanları

| Kod | Ad | Tip | Veri sınıfı |
|---|---|---|---|
| `support_ticket.category` | Kategori | seçim | iç |
| `support_ticket.priority` | Öncelik | seçim | iç |
| `support_ticket.waiting_hours` | Cevapsız bekleme | sayı (saat) | iç |
