# REQ-STR — Yönetim, Strateji, Bütçe ve Yıllık Planlama

Durum: CONFIRMED (sahip, 2026-09-19) · 2026-09-19 · Modül: STR (Strategy)

Kaynaklar: Özellik Yapısı §35; kararlar D-149, D-202…D-205.

**Sınır.** Gerçekleşen gelir ve gider REQ-FIN'den, kaynak kullanımı ve atıl günler REQ-EQP'den okunur. Proje hızlandırma senaryoları REQ-INT'tedir; STR şirket düzeyindeki senaryoları tutar. Performans hedefleri REQ-PRF-014'tedir. Bütün ekranlar ticari veridir (REQ-IAM-011).

Terimler (`docs/domain/GLOSSARY.md`): Annual Target, Budget, Budget Revision, Budget Variance, Inflation-Adjusted View, Investment Analysis, Payback Period, Company Health Scorecard, Cost Center.

---

## A. Hedefler ve bütçe

### REQ-STR-001 — Yıllık hedefler

- Kaynak: §35.1; REQ-PRF-014
- Öncelik: Must · Kademe: T2
- Katman: Sabit
- Açıklama: Yıllık ciro, kâr, proje sayısı, kapasite, fabrika verimi, teklif/kazanma ve personel/organizasyon hedefleri tutulur. Bu hedefler performans modülündeki "genel şirket hedefi" olarak da kullanılır (REQ-PRF-014; §35.1'den türetilen kural, sahip onayladı).
- Kabul kriterleri:
  - [ ] Her hedefin yıl içindeki gerçekleşmesi aylık olarak izlenebilir.
- Durum: CONFIRMED

### REQ-STR-002 — Bütçe ay, maliyet merkezi ve gider türü ayrıntısında

- Kaynak: §35.2; D-202
- Öncelik: Must · Kademe: T1
- Katman: Sabit + Akış
- Akışla ayarlanan: bütçenin ve revize bütçenin onay adımları
- Açıklama: Yıllık bütçe, gelir ve gider için her ay, her maliyet merkezi (proje, şantiye, fabrika, ekipman, genel) ve gider türü bazında planlanır. Onaylanan bütçe kilitlenir; yıl içindeki değişiklik "revize bütçe" olarak yeni sürümle yapılır ve ilk bütçe silinmez (§35.2'den türetilen kural, sahip onayladı).
- Kabul kriterleri:
  - [ ] Gerçekleşen, hem ilk bütçeyle hem son revize bütçeyle ayrı ayrı karşılaştırılabilir.
- Durum: CONFIRMED

### REQ-STR-003 — Bütçe ile gerçekleşen

- Kaynak: §35.2
- Öncelik: Must · Kademe: T1
- Katman: Sabit + Tanım
- Tanımla ayarlanan: uyarı verilecek sapma eşiği
- Açıklama: Planlanan gelir ve gider, gerçekleşenle bütçenin ayrıntısında karşılaştırılır; sapma tutarı ve yüzdesi gösterilir. Genel giderler projelere dağıtılmaz (D-149); karşılaştırma aynı mantıkla yapılır.
- Kabul kriterleri:
  - [ ] Her sapma, gerçekleşeni oluşturan kayıtlara açılabilir.
- Durum: CONFIRMED

### REQ-STR-004 — Enflasyona göre düzeltilmiş görünüm

- Kaynak: D-203
- Öncelik: Must · Kademe: T2
- Katman: Sabit + Tanım
- Tanımla ayarlanan: aylık TÜFE endeksi (resmî kaynaktan alınamazsa elle girilir)
- Açıklama: Rakamlar nominal TL olarak gösterilir; istenirse TÜFE ile bugünün lirasına çevrilmiş görünüm açılır. Bu görünüm yalnızca gösterimdir; hiçbir kaydı değiştirmez.
- Kabul kriterleri:
  - [ ] Düzeltilmiş görünümde kullanılan endeks ve ay açıkça yazar.
  - [ ] Endeksi eksik ay için düzeltilmiş değer "endeks yok" olarak gösterilir, sessizce hesaplanmaz.
- Durum: CONFIRMED

## B. Yatırım ve senaryolar

### REQ-STR-005 — Yatırım analizi

- Kaynak: §35.3
- Öncelik: Should · Kademe: T2
- Katman: Sabit
- Açıklama: Yeni vinç, kalıp, makine, araç veya üretim ekipmanı alımında maliyet, beklenen kapasite artışı, tasarruf ve geri dönüş analiz edilir. Girdiler panel verisinden gelir: benzer ekipman için ödenen kira, atıl günler, kullanım oranı, darboğaz yüzünden kaybedilen üretim (REQ-INT-007). Kullanıcı girdileri değiştirebilir.
- Kabul kriterleri:
  - [ ] Kullanıcının değiştirdiği her girdi, panelden gelen değerle birlikte görünür.
- Durum: CONFIRMED

### REQ-STR-006 — Basit ve indirgenmiş geri dönüş

- Kaynak: D-204
- Öncelik: Should · Kademe: T2
- Katman: Sabit + Tanım
- Tanımla ayarlanan: indirgeme oranı
- Açıklama: Yatırım analizinde iki sonuç yan yana gösterilir: basit geri dönüş süresi ve paranın zaman değerini hesaba katan indirgenmiş geri dönüş süresi.
- Kabul kriterleri:
  - [ ] İndirgenmiş hesapta kullanılan oran sonuçla birlikte yazar.
- Durum: CONFIRMED

### REQ-STR-007 — Şirket düzeyinde senaryolar

- Kaynak: §35.4; REQ-INT-011
- Öncelik: Should · Kademe: T2
- Katman: Sabit
- Açıklama: "Bir vinç daha alırsak?", "Kalıp sayısını artırırsak?", "Fabrika kapasitesini yükseltirsek?", "Bu projeyi daha erken bitirirsek?" gibi yönetim senaryoları veriye dayalı karşılaştırılır. Proje düzeyindeki hızlandırma hesabı REQ-INT'teki hesabı kullanır.
- Kabul kriterleri:
  - [ ] Senaryo sonuçları kaydedilir ve sonradan gerçekleşenle karşılaştırılabilir.
- Durum: CONFIRMED

## C. Şirket sağlık karnesi

### REQ-STR-008 — Başlık başına renkli sağlık karnesi

- Kaynak: §35.5; D-205
- Öncelik: Must · Kademe: T2
- Katman: Sabit + Tanım
- Tanımla ayarlanan: her başlığın göstergeleri ve renk eşikleri
- Açıklama: Şirketin genel durumu tek bakışta operasyon, finans, satış, insan kaynağı, kalite, İSG, uyum, nakit ve kaynak kullanımı başlıklarında gösterilir. Her başlık yeşil, sarı veya kırmızıdır; rengin hangi göstergelerden ve eşiklerden geldiği açılır. Tek bir toplam şirket puanı yoktur.
- Kabul kriterleri:
  - [ ] Her rengin nedeni, onu belirleyen gösterge değerleri ve eşiklerle birlikte okunur.
  - [ ] Karne yalnızca ticari yetkisi olan kullanıcılara görünür.
- Durum: CONFIRMED

---

## Yetenek kataloğu — STR

Biçim: `docs/requirements/README.md`.

### Olaylar

| Kod | Ad | Ne zaman | Taşıdığı alanlar | Veri sınıfı |
|---|---|---|---|---|
| `budget.approved` | Bütçe onaylandı | Bütçe veya revize bütçe onaylandığında | yıl, sürüm | ticari |
| `budget_variance.exceeded` | Bütçe sapması eşiği aştı | Aylık karşılaştırmada eşik aşılınca | ay, maliyet merkezi, gider türü, sapma | ticari |
| `company_health.turned_red` | Sağlık karnesinde kırmızı | Bir başlık kırmızıya döndüğünde | başlık | ticari |

### Aksiyonlar

Yok.

### Koşul alanları

| Kod | Ad | Tip | Veri sınıfı |
|---|---|---|---|
| `budget_variance.percent` | Bütçe sapma yüzdesi | sayı (%) | ticari |
| `company_health.status` | Başlık rengi | seçim | ticari |
