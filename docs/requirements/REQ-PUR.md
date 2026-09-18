# REQ-PUR — Tedarikçiler, Siparişler ve Satın Alma Talepleri

Durum: CONFIRMED (sahip, 2026-09-18) · 2026-09-18 · Modül: PUR (Purchasing)

Kaynaklar: Özellik Yapısı §18.2, §18.3, §18.16; kararlar D-027 (firma ve rolleri), D-144.

**Sınır.** Teslim alınan malın stoğa girişi REQ-INV'dedir. Fatura, ödeme ve tedarikçi carisi REQ-FIN'dedir. Onay eşikleri ve onaylayıcılar iş akışıdır (REQ-WFL). Teslim alınan kalemin demirbaş kaydı REQ-EQP'dedir.

Terimler (`docs/domain/GLOSSARY.md`): Party, Supplier, Rolling Mill Supplier, Galvanizer, Purchase Order, Purchase Request, Supplier Quote, Over-Delivery.

---

## A. Tedarikçiler

### REQ-PUR-001 — Tedarikçi kaydı

- Kaynak: §18.2; D-027
- Öncelik: Must · Kademe: T2
- Katman: Sabit
- Açıklama: Haddeciler, galvanizciler ve diğer malzeme ve hizmet tedarikçileri kaydedilir. Tedarikçi, "tedarikçi" rolü taşıyan bir firmadır; aynı firma işveren veya müşteri de olabilir (D-027).
- Kabul kriterleri:
  - [ ] Aynı firma için ikinci bir kayıt açılmaz; rolü eklenir.
- Durum: CONFIRMED

### REQ-PUR-002 — Sipariş öncesi karşılaştırma

- Kaynak: §18.2
- Öncelik: Must · Kademe: T2
- Katman: Sabit
- Açıklama: Sipariş öncesinde tedarikçilerin fiyat, termin süresi, miktar/tonaj ve teslim koşulları yan yana karşılaştırılır.
- Kabul kriterleri:
  - [ ] Karşılaştırma siparişe bağlanır ve sipariş kaydında hangi tekliflerin değerlendirildiği görünür.
- Durum: CONFIRMED

## B. Siparişler

### REQ-PUR-003 — Sipariş kaydı

- Kaynak: §18.3
- Öncelik: Must · Kademe: T2
- Katman: Sabit
- Açıklama: Siparişte tedarikçi, malzeme, miktar, fiyat/tutar, para birimi, sipariş tarihi, beklenen termin, belge ve durum tutulur. Tutar ticari veridir.
- Kabul kriterleri:
  - [ ] Dövizli siparişte tutar, sipariş günündeki kurla TL karşılığıyla birlikte saklanır (REQ-ADM-013).
- Durum: CONFIRMED

### REQ-PUR-004 — Sipariş durumu ve kısmi teslim

- Kaynak: §18.3, §18.11
- Öncelik: Must · Kademe: T1
- Katman: Sabit
- Açıklama: Sipariş şu durumlardan geçer: Verildi → Üretimde/Yolda → Teslim alındı. Bir sipariş birden fazla tırla kısım kısım gelebilir; sipariş, sipariş miktarı tamamen teslim alınana kadar açık kalır ve teslim alınan/kalan miktar görünür.
- Kabul kriterleri:
  - [ ] Her teslim alım (tır) siparişe bağlıdır ve siparişin kalan miktarını azaltır.
  - [ ] Termini geçen ve tamamlanmayan sipariş gecikmiş olarak işaretlenir.
- Durum: CONFIRMED

### REQ-PUR-005 — Teslim alınınca stok artar

- Kaynak: §18.3; REQ-INV-003
- Öncelik: Must · Kademe: T1
- Katman: Sabit
- Açıklama: Teslim alınan miktar stok hareketi olarak ilgili lokasyona girer.
- Kabul kriterleri:
  - [ ] Teslim alımla stok girişi aynı işlemde olur; biri olmadan diğeri kalmaz.
- Durum: CONFIRMED

### REQ-PUR-006 — Fazla teslim

- Kaynak: D-144
- Öncelik: Must · Kademe: T1
- Katman: Sabit + Akış + Tanım
- Akışla ayarlanan: toleransı aşan kısmın onaylayıcısı
- Tanımla ayarlanan: tolerans, malzeme veya tedarikçi bazında
- Açıklama: Siparişten fazla gelen miktar tanımlı tolerans içindeyse kendiliğinden kabul edilir ve stoğa girer. Toleransı aşan kısım yetkilinin onayıyla kabul edilir ya da iade edilir; onay beklenirken fazla miktar ayrı işaretlenir ve kullanılamaz.
- Kabul kriterleri:
  - [ ] Toleransı aşan miktar, onay verilmeden kullanılabilir stoğa girmez.
  - [ ] Tolerans malzeme veya tedarikçi bazında ayarlanabilir.
- Durum: CONFIRMED

## C. Genel satın alma talebi

### REQ-PUR-007 — Katalog dışı alımlar da panelden yürür

- Kaynak: §18.16
- Öncelik: Must · Kademe: T2
- Katman: Sabit + Akış
- Akışla ayarlanan: talebin onay adımları (varsayılan akış: satın alma talebi)
- Açıklama: Malzeme kataloğu dışındaki alımlar (yedek parça, sanayi/tamir hizmeti, el aleti, ekipman, ofis ihtiyacı) şu akışla yürür: talep → fiyat araştırması → teklif karşılaştırma → onay → alım → teslim alma → fatura/ödeme.
- Kabul kriterleri:
  - [ ] Onaylanmamış bir talep için alım kaydı açılamaz.
- Durum: CONFIRMED

### REQ-PUR-008 — Talebin alanları

- Kaynak: §18.16
- Öncelik: Must · Kademe: T2
- Katman: Sabit
- Açıklama: Talepte talep eden, ilgili birim/şantiye/ekipman, ihtiyaç açıklaması, miktar, aciliyet ve istenen tarih bulunur.
- Kabul kriterleri:
  - [ ] Aciliyet ve istenen tarih, talebin onay kuyruğundaki sırasını etkiler.
- Durum: CONFIRMED

### REQ-PUR-009 — Teklifler yan yana

- Kaynak: §18.16
- Öncelik: Must · Kademe: T2
- Katman: Sabit
- Açıklama: Fiyat araştırmasında birden fazla tedarikçi teklifi (fiyat, termin, koşul, belge) yan yana görülür.
- Kabul kriterleri:
  - [ ] Seçilmeyen teklifler de talebin geçmişinde saklanır.
- Durum: CONFIRMED

### REQ-PUR-010 — Onay tutar eşiğine göre

- Kaynak: §18.16; REQ-WFL-001
- Öncelik: Must · Kademe: T2
- Katman: Akış
- Akışla ayarlanan: tutar eşikleri ve onaylayıcılar
- Açıklama: Talebin onayı tutar eşiğine göre ilgili yöneticiye gider; eşikler ve onaylayıcılar iş akışında tanımlıdır.
- Kabul kriterleri:
  - [ ] Eşik değiştiğinde yeni talepler yeni eşikle değerlendirilir; açık talepler başladıkları sürümle sürer (REQ-WFL-024).
- Durum: CONFIRMED

### REQ-PUR-011 — Teslim alınan kalem bağlanır

- Kaynak: §18.16
- Öncelik: Must · Kademe: T2
- Katman: Sabit
- Açıklama: Teslim alınan kalem gerekiyorsa demirbaş kaydına (REQ-EQP) veya ilgili maliyet merkezine (şantiye, fabrika, ekipman, ofis) bağlanır.
- Kabul kriterleri:
  - [ ] Maliyet merkezi seçilmeden teslim alma tamamlanmaz.
- Durum: CONFIRMED

---

## Yetenek kataloğu — PUR

Biçim: `docs/requirements/README.md`.

### Olaylar

| Kod | Ad | Ne zaman | Taşıdığı alanlar | Veri sınıfı |
|---|---|---|---|---|
| `purchase_order.placed` | Sipariş verildi | Sipariş kaydedildiğinde | tedarikçi, malzeme, miktar, termin | iç |
| `purchase_order.received` | Sipariş teslim alındı | Bir teslim alım işlendiğinde | sipariş, gelen, kalan | iç |
| `purchase_order.overdue` | Sipariş gecikti | Termin geçtiğinde | sipariş, gecikme | iç |
| `over_delivery.recorded` | Fazla teslim geldi | Tolerans dışı fazla geldiğinde | sipariş, fazla miktar | iç |
| `purchase_request.submitted` | Satın alma talebi açıldı | Talep gönderildiğinde | talep eden, birim, aciliyet | iç |
| `purchase_request.approved` | Satın alma talebi onaylandı | Onaylandığında | talep, onaylayan | iç |

### Aksiyonlar

| Kod | Ad | Girdi | Gereken yetki | İki kez çalışırsa | Yarıda kalırsa |
|---|---|---|---|---|---|
| `purchase_request.create_draft` | Taslak satın alma talebi aç | birim, kalem, miktar, gerekçe | akışın sistem yetkisi | Aynı kaynak için açık taslak varsa onu döndürür | Taslak açılmamış sayılır |

### Koşul alanları

| Kod | Ad | Tip | Veri sınıfı |
|---|---|---|---|
| `purchase_request.amount` | Talep tutarı | tutar | ticari |
| `purchase_request.urgency` | Aciliyet | seçim | iç |
| `purchase_order.days_late` | Sipariş gecikme günü | sayı | iç |
