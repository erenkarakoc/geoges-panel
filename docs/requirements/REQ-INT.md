# REQ-INT — Öneriler, Kaynak Optimizasyonu ve Hızlandırma Senaryoları

Durum: CONFIRMED (sahip, 2026-09-19) · 2026-09-19 · Modül: INT (Intelligence)

Kaynaklar: Özellik Yapısı §8.3, §8.4, §26, §27; kararlar D-149, D-185, D-195…D-198.

**Sınır.** INT kendi verisini üretmez; diğer modüllerin kayıtlarından hesaplar ve **önerir, karar vermez**. Kaynak transferinin kendisi REQ-EQP-006'da ve REQ-INV-006'da, personel görevlendirmesi REQ-HR'da bir insanın işlemiyle yapılır. "Dikkat" uyarıları REQ-RPT-007'dedir; öneri listesi ondan ayrıdır. Proje süreleri ve günlük hedefler REQ-PRJ-010 ve REQ-PRJ-011'dedir; prim kuralları REQ-PRF-015'tedir; güvenlik şartı REQ-QHS-016'dadır.

Terimler (`docs/domain/GLOSSARY.md`): Recommendation, Recommendation Type, Resource Bottleneck, Resource Transfer Suggestion, Acceleration Scenario, Scenario Limit, Idle Resource, Management Target Duration.

---

## A. Öneri listesi

### REQ-INT-001 — Öncelikli öneri listesi

- Kaynak: §26, §26.1
- Öncelik: Must · Kademe: T1
- Katman: Sabit
- Açıklama: Panel "şimdi ne yapmak daha mantıklı?" sorusunu destekler. Öneriler önem derecesine göre sıralanır; her öneride sorun veya fırsat, gerekçe, beklenen etki ve ilgili ekrana geçiş bulunur.
- Kabul kriterleri:
  - [ ] Her öneriden, dayandığı kayıtlara ve ilgili ekrana tek adımda gidilir.
- Durum: CONFIRMED

### REQ-INT-002 — Öneriler tanımlı kurallardan üretilir

- Kaynak: D-195
- Öncelik: Must · Kademe: T1
- Katman: Sabit + Tanım
- Tanımla ayarlanan: her öneri türünün eşikleri (ör. kaç gün atıl kalınca önerileceği)
- Açıklama: Her öneri türü açık bir hesaba dayanır; önerinin gerekçesi ve rakamları her zaman görünür. Öneri üretmek için veri panel dışına çıkmaz; yapay zekâ modeli kullanılmaz (D-195). Yeni öneri türü eklemek geliştirme ister.
- Kabul kriterleri:
  - [ ] Her öneride, hangi kuralın hangi değerlerle tetiklendiği okunur.
  - [ ] Öneri üretimi hiçbir dış hizmete veri göndermez.
- Durum: CONFIRMED

### REQ-INT-003 — Başlangıç öneri türleri

- Kaynak: §26.2
- Öncelik: Must · Kademe: T2
- Katman: Sabit
- Açıklama: Başlangıç türleri: atıl vinç ve başka şantiyede ihtiyaç; kritik seviyeye inen malzeme için sipariş; zarardaki proje ve başlıca nedenleri ("Niye zarardayız?" kartından); N gündür bekleyen hakediş veya alacak; zayıflayan nakit ve hızlandırılabilecek tahsilatlar; uzun süredir onay bekleyen saha kaydı; normalin üzerinde sarf tüketimi; mevcut üretim hızına göre tahmini proje bitiş tarihi.
- Kabul kriterleri:
  - [ ] Her tür, kaynak modülün kataloğundaki olay veya koşul alanına dayanır.
- Durum: CONFIRMED

### REQ-INT-004 — Öneri karar vermez

- Kaynak: §26.2, §27.4
- Öncelik: Must · Kademe: T1
- Katman: Sabit
- Açıklama: Öneri sistemi yönetici adına karar vermez ve hiçbir kaydı değiştirmez; gerekçeli tavsiye üretir. Bir öneriyi uygulamak her zaman bir insanın işlemiyle başlar.
- Kabul kriterleri:
  - [ ] INT'in hiçbir işlemi stok, ekipman, personel, hedef veya para kaydını doğrudan değiştirmez.
- Durum: CONFIRMED

### REQ-INT-005 — Uygulanmayan öneri gerekçeyle kapanır

- Kaynak: D-198
- Öncelik: Must · Kademe: T2
- Katman: Sabit + Tanım
- Tanımla ayarlanan: önerinin yeniden gelmesi için gereken değişim (ör. atıl sürenin iki katına çıkması)
- Açıklama: Yönetici bir öneriyi gerekçeyle "uygulanmadı" olarak kapatır; öneri ve gerekçe kayıtta kalır. Durum belirgin şekilde değişirse öneri yeniden gelir. Aynı sorun "Dikkat" bölümündeyse orada kalmaya devam eder (REQ-RPT-008).
- Kabul kriterleri:
  - [ ] Gerekçesiz kapatma yapılamaz.
  - [ ] Yeniden gelen öneri, önceki kapatmayı ve gerekçesini gösterir.
- Durum: CONFIRMED

### REQ-INT-006 — Öneri yetkiye göre görünür

- Kaynak: §26; REQ-IAM-011, REQ-IAM-012
- Öncelik: Must · Kademe: T1
- Katman: Sabit
- Açıklama: Kullanıcı yalnızca rol kapsamındaki (şantiye, proje, şirket) ve veri sınıfı iznine uyan önerileri görür. Ticari veri içeren öneri (kâr etkisi, maliyet) yalnızca ticari yetkisi olana görünür.
- Kabul kriterleri:
  - [ ] Ticari yetkisi olmayan kullanıcı bir öneriyi görebiliyorsa, önerinin ticari rakamları gizlenir; öneri ticari rakam olmadan anlamsızsa hiç gösterilmez.
- Durum: CONFIRMED

## B. Kaynak optimizasyonu

### REQ-INT-007 — Atıl kaynak ve darboğaz eşleştirmesi

- Kaynak: §27, §27.1
- Öncelik: Must · Kademe: T1
- Katman: Sabit
- Açıklama: Şantiyeler, fabrika, araçlar, ekipman ve personel ortak kaynak havuzu olarak değerlendirilir. Panel aynı anda hangi şantiyede işin yavaş olduğunu, nerede ekipmanın beklediğini veya eksik olduğunu, hangi makine, kalıp veya vincin boş olduğunu ve nerede personel fazlası veya eksiği olduğunu karşılaştırır.
- Kabul kriterleri:
  - [ ] Atıl kaynak ile darboğaz aynı ekranda eşleştirilmiş olarak görünür.
- Durum: CONFIRMED

### REQ-INT-008 — Transfer önerisinin hesabı

- Kaynak: §27.2, §27.4
- Öncelik: Must · Kademe: T1
- Katman: Sabit
- Açıklama: Transfer önerisinde kaynağın mevcut yerde neden atıl kaldığı, hedefteki darboğaz, iki şantiye arası nakliye ve yakıt maliyeti, transferle beklenen üretim artışı ve şirket toplam kârına net etki hesaplanır. Kaynağın bulunduğu şantiyenin yakında o kaynağa yeniden ihtiyaç duyup duymayacağı, o şantiyenin planından değerlendirilir ve öneride gösterilir.
- Kabul kriterleri:
  - [ ] Kaynak şantiyenin yakın planında ihtiyaç varsa öneri bunu ve tarihini açıkça belirtir.
- Durum: CONFIRMED

### REQ-INT-009 — Personel optimizasyonu hesabı

- Kaynak: §27.3
- Öncelik: Should · Kademe: T2
- Katman: Sabit
- Açıklama: Ekip ve personel değişikliklerinin maaş, SGK, yemek, konaklama ve nakliye etkileri hesaplanır. Taşeron şantiyede GEOGES'in karşıladığı SGK, yemek ve konaklama gibi destekler de hesaba girer.
- Kabul kriterleri:
  - [ ] Hesap, kişi bazında maaş göstermez; yalnızca toplam etkiyi gösterir (REQ-HR-002).
- Durum: CONFIRMED

### REQ-INT-010 — Kabul edilen transfer talimat olarak başlar

- Kaynak: §27.4
- Öncelik: Must · Kademe: T1
- Katman: Sabit + Akış
- Akışla ayarlanan: transfer önerisinin onaylayıcısı ve onaydan sonra açılan görevler (varsayılan: koordinatör onaylar, lojistik sorumlusuna transfer görevi)
- Açıklama: Kaynak transferi kendiliğinden yapılmaz. Yönetici veya koordinatör öneriyi onaylayarak talimatı başlatır; transferin kaydı ilgili modülde bir insanın işlemiyle yapılır.
- Kabul kriterleri:
  - [ ] Onaylanan öneri, yapılan transfer kaydına bağlanır; öneri transfer tamamlanınca kapanır.
- Durum: CONFIRMED

## C. Hızlandırma senaryoları

### REQ-INT-011 — Senaryo karşılaştırması

- Kaynak: §8.3
- Öncelik: Must · Kademe: T1
- Katman: Sabit
- Açıklama: Bir proje için senaryolar yan yana karşılaştırılır: mevcut ekipmanla devam, ikinci vinç ekleme, ek personel, çift döküm düzeni, paralel ekip, belirli bir prim havuzu. Her senaryoda tahmini yeni bitiş tarihi, ek ekipman maliyeti, ek personel maliyeti, prim maliyeti, erken bitişten kurtarılan maaş/SGK/yemek/konaklama, erken boşalan vinç/kalıp/makine değeri, kaynakların yeni işe aktarılma fırsatı ve net kârlılık etkisi hesaplanır. Senaryo girdileri gerçekleşen üretim hızından ve maliyetlerden gelir; kullanıcı değiştirebilir.
- Kabul kriterleri:
  - [ ] Her senaryonun hesap dökümü kalem kalem açılabilir.
  - [ ] Kullanıcının değiştirdiği girdi, hesaplanan değerle birlikte görünür.
- Durum: CONFIRMED

### REQ-INT-012 — En kârlı ve uygulanabilir senaryo önerilir

- Kaynak: §8.3
- Öncelik: Must · Kademe: T1
- Katman: Sabit
- Açıklama: Panel en hızlı senaryoyu değil, "önerilmez" işareti olmayanlar arasında net kârlılık etkisi en yüksek senaryoyu önerir.
- Kabul kriterleri:
  - [ ] "Önerilmez" işaretli senaryo, net etkisi ne olursa olsun önerilen senaryo olamaz.
- Durum: CONFIRMED

### REQ-INT-013 — Tanımlı sınırı aşan senaryo "önerilmez" olur

- Kaynak: §8.4; D-196, D-185
- Öncelik: Must · Kademe: T1
- Katman: Sabit + Tanım
- Tanımla ayarlanan: sınır değerleri (yasal fazla mesai sınırı, kişi başı günlük en fazla çalışma saati, kalıp sayısına göre günlük en fazla döküm ve diğerleri)
- Açıklama: Hızlandırma hiçbir zaman kalite ve iş güvenliği pahasına önerilmez. Tanımlı sınırlardan birini aşan veya açık kritik İSG bulgusu olan şantiyede senaryo kendiliğinden "önerilmez" olur ve hangi sınırı aştığı yazılır.
- Kabul kriterleri:
  - [ ] "Önerilmez" işaretinin nedeni sınırın adı, sınır değeri ve senaryodaki değerle birlikte görünür.
  - [ ] "Önerilmez" senaryo seçilemez (REQ-INT-014).
- Durum: CONFIRMED

### REQ-INT-014 — Seçilen senaryo onayla hedeflere işler

- Kaynak: §8.4; D-197
- Öncelik: Must · Kademe: T1
- Katman: Sabit + Akış
- Akışla ayarlanan: senaryonun onaylayıcısı ve onaydan sonra açılan görevler
- Açıklama: Seçilen senaryo onaydan geçince projenin yönetim hedef süresi olur (REQ-PRJ-010); günlük hedefler yeniden hesaplanır (REQ-PRJ-011); ek vinç veya personel gibi işler görev olarak açılır; senaryodaki prim havuzu prim kuralı olarak tanımlanır (REQ-PRF-015). Hiçbir kaynak kendiliğinden taşınmaz.
- Kabul kriterleri:
  - [ ] Onaylanmamış senaryo hiçbir hedefi değiştirmez.
  - [ ] Hedefin hangi senaryodan geldiği projenin geçmişinde görünür.
- Durum: CONFIRMED

---

## Yetenek kataloğu — INT

Biçim: `docs/requirements/README.md`.

### Olaylar

| Kod | Ad | Ne zaman | Taşıdığı alanlar | Veri sınıfı |
|---|---|---|---|---|
| `recommendation.raised` | Öneri oluştu | Bir kural tetiklendiğinde | tür, önem, kapsam, kaynak kayıt | iç |
| `recommendation.dismissed` | Öneri uygulanmadı | Gerekçeyle kapatıldığında | tür, kapatan, gerekçe | iç |
| `resource_transfer_suggestion.approved` | Transfer önerisi onaylandı | Onaylandığında | kaynak, nereden, nereye | iç |
| `acceleration_scenario.approved` | Hızlandırma senaryosu onaylandı | Onaylandığında | proje, senaryo, yeni hedef tarih | ticari |

### Aksiyonlar

Yok. INT önerir; uygulama bir insanın işlemidir.

### Koşul alanları

| Kod | Ad | Tip | Veri sınıfı |
|---|---|---|---|
| `recommendation.type` | Öneri türü | seçim | iç |
| `recommendation.severity` | Önem derecesi | seçim | iç |
| `acceleration_scenario.net_effect` | Senaryonun net kâr etkisi | tutar | ticari |
