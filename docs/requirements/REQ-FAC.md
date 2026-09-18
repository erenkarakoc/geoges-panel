# REQ-FAC — Fabrika, Üretim Zincirleri ve Birim Maliyet

Durum: CONFIRMED (sahip, 2026-09-18) · 2026-09-18 · Modül: FAC (Factory)

Kaynaklar: Özellik Yapısı §17; kararlar D-145, D-146.

**Sınır.** Fabrikadaki stok hareketleri ve fire REQ-INV'dedir; FAC onları günlük kayıtla üretir. Fabrika personelinin puantajı ve bordrosu REQ-HR'dadır. Makine bakımı ve arızası REQ-EQP'dedir. Dış işler ve yan gelirler (§20.2) REQ-FIN'dedir. Onay mekanizması REQ-WFL'dedir.

Terimler (`docs/domain/GLOSSARY.md`): Factory Daily Log, Steel Strip, Tie Strip Lug, Flat Bar, Galvanizer, Process Loss, Overhead Allocation, Technical Improvement Work.

---

## A. Fabrika görünümü

### REQ-FAC-001 — Fabrika bir üretim ve maliyet merkezidir

- Kaynak: §17
- Öncelik: Must · Kademe: T2
- Katman: Sabit
- Açıklama: Fabrika panel döküm yeri değildir; çelik şerit, lug, kalıp/ekipman işleri ve diğer metal imalatların üretim ve maliyet merkezidir.
- Kabul kriterleri:
  - [ ] Fabrika kaydında panel dökümü girişi yoktur.
- Durum: CONFIRMED

### REQ-FAC-002 — Fabrika ana görünümü

- Kaynak: §17.1
- Öncelik: Must · Kademe: T2
- Katman: Sabit
- Açıklama: Fabrika ekranında bugün işlenen/delinen çelik şerit, tip ve boy dağılımı, üretilen lug, fire oranı, birim işleme maliyeti, adam-gün veya saat verimi, hammadde, işlemde, galvanizde ve sevke hazır miktarlar, günlük/aylık fabrika gideri, makine durumları, bekleyen bakım, dış iş ve yan gelirler görünür. Maliyet ve gider ticari veridir.
- Kabul kriterleri:
  - [ ] Ticari yetkisi olmayan kullanıcı birim maliyet ve gider alanlarını görmez.
- Durum: CONFIRMED

## B. Fabrika günlük kaydı

### REQ-FAC-003 — Fabrika günlük kaydının içeriği

- Kaynak: §17.2
- Öncelik: Must · Kademe: T2
- Katman: Sabit
- Açıklama: Fabrika sorumlusu günlük olarak şunları girer: hangi şerit tipinden kaç adet/metre işlendiği, başlangıç/bitiş saatleri, lug üretim miktarı, haddeci mal girişi, galvanize çıkış, galvaniz dönüşü, şantiyeye sevk, fire, fabrika personel puantajı, makine arızası/bakımı, fabrika harcaması, yapılan tamir/tadilat/kalıp işi. Her iş için harcanan işçilik saati girilir (REQ-FAC-009 bunu kullanır).
- Kabul kriterleri:
  - [ ] İşçilik saati girilmemiş üretim satırı eksik sayılır.
- Durum: CONFIRMED

### REQ-FAC-004 — Fabrika kaydı onaya gider

- Kaynak: §17.2; D-146; REQ-SIT-008, REQ-SIT-009, REQ-SIT-012
- Öncelik: Must · Kademe: T1
- Katman: Sabit + Akış
- Akışla ayarlanan: fabrika kaydının onaylayıcısı; onay adımının varlığı sabittir
- Açıklama: Fabrika günlük kaydı, şantiye günlük kaydıyla aynı kurallarla onaya gider: tek eylemle gönderme, karar öncesi geri çekme, düzeltmeye geri gönderme ve gerekçe, geç giriş işareti, onaylı kaydın kilitlenmesi.
- Kabul kriterleri:
  - [ ] Fabrika kaydı için onay adımı kapatılamaz.
- Durum: CONFIRMED

### REQ-FAC-005 — Onaylanmadan hiçbir modüle yansımaz

- Kaynak: D-146
- Öncelik: Must · Kademe: T1
- Katman: Sabit
- Açıklama: Stok hareketleri, fire ve maliyet, fabrika kaydı onaylandığında işlenir; onay öncesi hiçbir modüle yansımaz.
- Kabul kriterleri:
  - [ ] Onay bekleyen fabrika kaydının hareketleri stok bakiyesinde görünmez.
- Durum: CONFIRMED

## C. Üretim zincirleri

### REQ-FAC-006 — Çelik şerit zinciri

- Kaynak: §17.3
- Öncelik: Must · Kademe: T2
- Katman: Sabit
- Açıklama: Çelik şerit uçtan uca izlenir: haddeci teklifi/siparişi → fabrikaya giriş → delme/işleme → galvanize çıkış → galvaniz dönüşü → şantiyeye sevk → sahada kullanım.
- Kabul kriterleri:
  - [ ] Bir şerit partisinin zincirin hangi adımında olduğu ve her adımdaki miktarı görünür.
- Durum: CONFIRMED

### REQ-FAC-007 — Lug zinciri

- Kaynak: §17.4
- Öncelik: Must · Kademe: T2
- Katman: Sabit
- Açıklama: Lug uçtan uca izlenir: düz lama siparişi → fabrikaya giriş → kesme → delme → bükme → galvanize çıkış → galvaniz dönüşü → fabrika/şantiye sevki → kullanım.
- Kabul kriterleri:
  - [ ] Her adımdaki fire ayrı görünür (REQ-INV-004).
- Durum: CONFIRMED

## D. Maliyet

### REQ-FAC-008 — Fabrika giderleri

- Kaynak: §17.5
- Öncelik: Must · Kademe: T1
- Katman: Sabit
- Açıklama: Fabrika maliyetinde işçilik, SGK, yemek, kira, elektrik, sarf malzeme, makine amortismanı, tamir/bakım ve nakliye dikkate alınır.
- Kabul kriterleri:
  - [ ] Her gider kalemi aya ve fabrika maliyet merkezine bağlıdır.
- Durum: CONFIRMED

### REQ-FAC-009 — Birim maliyet: gider işçilik saatine göre dağıtılır

- Kaynak: §17.5; D-145
- Öncelik: Must · Kademe: T1
- Katman: Sabit
- Açıklama: Ayın fabrika gideri, şerit işlemeye, lug üretimine ve diğer işlere harcanan işçilik saati oranında dağıtılır; her işin payı o ayki üretim miktarına bölünerek birim maliyet (bir metre işlenmiş şerit, bir adet lug) bulunur. Ay kapanana kadar birim maliyet geçicidir ve "geçici" işaretlidir (REQ-INV-022).
- Kabul kriterleri:
  - [ ] Birim maliyet hesabının dökümü (gider, saat payı, üretim miktarı) görüntülenebilir.
  - [ ] Ay kapanınca geçici maliyetle yapılmış tüketimlerin fark düzeltmesi ayrı hareketle yazılır.
- Durum: CONFIRMED

## E. Teknik iyileştirme

### REQ-FAC-010 — Teknik iyileştirme işleri

- Kaynak: §17.6
- Öncelik: Should · Kademe: T2
- Katman: Sabit
- Açıklama: Fabrikada yapılan kalıp tamiri/üretimi, makine-ekipman geliştirme, özel aparat imalatı, maliyet azaltıcı çözüm, yeni ürün/tasarım denemesi, kaynak/kesim/tadilat gibi işler kayıt altına alınır; harcanan saat ve malzeme bu işe yazılır.
- Kabul kriterleri:
  - [ ] Teknik iyileştirme işine harcanan saat, birim maliyet dağıtımında ayrı bir iş olarak yer alır.
- Durum: CONFIRMED

---

## Yetenek kataloğu — FAC

Biçim: `docs/requirements/README.md`.

### Olaylar

| Kod | Ad | Ne zaman | Taşıdığı alanlar | Veri sınıfı |
|---|---|---|---|---|
| `factory_daily_log.submitted` | Fabrika kaydı onaya gönderildi | Gönderildiğinde | tarih, gönderen | iç |
| `factory_daily_log.approved` | Fabrika kaydı onaylandı | Onaylandığında | tarih, üretim, fire, saatler | iç |
| `factory_daily_log.returned` | Fabrika kaydı düzeltmeye döndü | Geri gönderildiğinde | tarih, gerekçe | iç |
| `factory_unit_cost.finalised` | Ayın birim maliyeti kesinleşti | Ay kapanıp dağıtım yapıldığında | ay, iş türü, birim maliyet | ticari |

### Aksiyonlar

Yok.

### Koşul alanları

| Kod | Ad | Tip | Veri sınıfı |
|---|---|---|---|
| `factory_daily_log.process_loss_percent` | Günün fire oranı | sayı (%) | iç |
| `factory_daily_log.is_late_entry` | Geç girildi mi | evet/hayır | iç |
| `factory_unit_cost.strip_per_metre` | İşlenmiş şerit metre maliyeti | tutar | ticari |
