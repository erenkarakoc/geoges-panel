# REQ-EQP — Ekipman, Demirbaş, Kalıp ve Araçlar

Durum: CONFIRMED (sahip, 2026-09-18) · 2026-09-18 · Modül: EQP (Equipment & Assets)

Kaynaklar: Özellik Yapısı §20.3, §20.4, §21; kararlar D-155…D-162.

**Sınır.** Gelir ve giderin muhasebesi, cari ve dönem kapanışı REQ-FIN'dedir; EQP amortisman, kira, tamir ve atıl maliyeti üretir, FIN onları yazar (REQ-FIN-013). Dış nakliye ve kiralama gelirinin kaydı REQ-FIN-012'dedir. Satın alma REQ-PUR'dadır. Günlük saha kaydının kendisi REQ-SIT'tedir; EQP ondan hangi ekipmanın çalıştığını okur. Onay mekanizması REQ-WFL'dedir. Kategori listesi merkezi tanımdır (REQ-ADM).

Terimler (`docs/domain/GLOSSARY.md`): Asset, Equipment, Asset Group, Rented Asset, Asset Assignment, Asset Custody Record, Depreciation, Equipment Working Day, Idle Resource, Idle Equipment Expense, Asset Write-Off, Periodic Inspection, Crane, Crane Daily Log, Crane Operator, Mold.

---

## A. Varlık kaydı

### REQ-EQP-001 — Varlık kartı

- Kaynak: §21, §21.1
- Öncelik: Must · Kademe: T1
- Açıklama: Şirkete ait her fiziksel varlık kayıtlıdır. Kartta ad, kategori, marka, model, üretim yılı, seri numarası veya plaka, satın alma tarihi, satın alma bedeli, para birimi, adet/birim, faydalı ömür, durum, lokasyon, zimmetli kişi, garanti, son ve sonraki bakım/periyodik kontrol, fatura, fotoğraf ve diğer belgeler tutulur. Satın alma bedeli ticari veridir.
- Kabul kriterleri:
  - [ ] Aynı seri numarası veya plakayla ikinci kart açılmaz.
  - [ ] Ticari yetkisi olmayan kullanıcı bedel ve amortisman alanlarını görmez.
- Durum: CONFIRMED

### REQ-EQP-002 — Kategoriler

- Kaynak: §21.1
- Öncelik: Must · Kademe: T2
- Açıklama: Kategoriler merkezi tanımdır; başlangıç listesi: mobil vinç, kalıp, pres, kaynak makinesi, testere, tavan vinci, araç, konteyner, laptop, telefon, SIM kart, el aleti, diğer demirbaş. Kategoriye göre periyodik kontrol türleri ve amortisman ömrü önerilir.
- Kabul kriterleri:
  - [ ] Yeni kategori tanımlardan eklenebilir; kullanılan kategori silinmez, pasifleştirilir.
- Durum: CONFIRMED

### REQ-EQP-003 — Düşük değerli eşya grup halinde, adetle

- Kaynak: D-158
- Öncelik: Must · Kademe: T2
- Açıklama: El aletleri gibi düşük değerli eşyalar tek tek kartla değil, lokasyon başına adetle izlenir (ör. "Şantiye A'da 12 matkap"). Zimmetlenen eşyalar (laptop, telefon, SIM kart) her zaman tek tek kartla izlenir. Grup halindeki eşyanın bedeli, alındığında teslim alan maliyet merkezine gider yazılır ve amortismana girmez (D-158'den türetilen kural, sahip onayladı).
- Kabul kriterleri:
  - [ ] Hangi kategorinin grup halinde, hangisinin tek tek izlendiği tanımlardan ayarlanır.
  - [ ] Grup eşyasının lokasyonlar arası transferi adetle yapılır ve geçmişte kalır.
- Durum: CONFIRMED

### REQ-EQP-004 — Kendi malı ve kiralık

- Kaynak: §21.7; D-161
- Öncelik: Must · Kademe: T1
- Açıklama: Her varlık "kendi malı" veya "kiralık" olarak kaydedilir. Kiralık varlıkta kiralayan firma, kira bedeli, para birimi ve kira süresi tutulur; kira gideri, varlığın bulunduğu şantiyeye bulunduğu günler için yazılır.
- Kabul kriterleri:
  - [ ] Kira süresi biterken sorumlusuna uyarı düşer.
  - [ ] Kiralık varlık amortismana girmez.
- Durum: CONFIRMED

### REQ-EQP-005 — Satın almadan varlık kartına

- Kaynak: §18.16; REQ-PUR-011
- Öncelik: Must · Kademe: T2
- Açıklama: Teslim alınan bir satın alma kalemi demirbaş ise varlık kartı, satın alma bilgileri (tedarikçi, bedel, tarih, fatura) dolu olarak açılır.
- Kabul kriterleri:
  - [ ] Satın almadan açılan kart, satın alma kaydına bağlantı taşır.
- Durum: CONFIRMED

## B. Lokasyon ve zimmet

### REQ-EQP-006 — Lokasyon ve transfer geçmişi

- Kaynak: §21.2
- Öncelik: Must · Kademe: T1
- Açıklama: Bir varlığın hangi tarihlerde fabrikada, hangi şantiyede, bakımda veya başka lokasyonda olduğu görülür. Fabrika → şantiye, şantiye → şantiye ve şantiye → fabrika transferleri tarihle kaydedilir ve geçmişte kalır.
- Kabul kriterleri:
  - [ ] Bir varlık aynı anda iki lokasyonda görünmez.
  - [ ] Bir şantiyenin ekranında o an orada bulunan varlıklar listelenir (REQ-SIT-001).
- Durum: CONFIRMED

### REQ-EQP-007 — Zimmet

- Kaynak: §21.1, §21.8
- Öncelik: Must · Kademe: T2
- Açıklama: Varlık bir kişiye zimmetlenir ve iade alınır; tarih ve durumu kaydedilir. Kişinin kartında üzerindeki zimmetler görünür.
- Kabul kriterleri:
  - [ ] İşten ayrılış tarihi girilen personelin üzerindeki zimmetler sorumlusuna iade görevi olarak düşer.
- Durum: CONFIRMED

### REQ-EQP-008 — Araç devir-teslim tutanağı

- Kaynak: §21.8; D-160
- Öncelik: Must · Kademe: T2
- Açıklama: Araç zimmetlenirken, iade alınırken veya iki kişi arasında devredilirken tarih, km okuması, yakıt seviyesi ve hasar durumunu gösteren fotoğraflarla tutanak düzenlenir. Tutanağı teslim eden ve teslim alan kendi hesabından telefonda onaylar; onaylar zamanıyla saklanır. Panel hesabı olmayan kişi için imzalı kâğıt tutanağın fotoğrafı yüklenir.
- Kabul kriterleri:
  - [ ] İki tarafın onayı (veya kâğıt tutanak fotoğrafı) olmadan devir tamamlanmaz ve zimmet değişmez.
  - [ ] Km okuması bir önceki okumadan küçük girilemez.
- Durum: CONFIRMED

### REQ-EQP-009 — Araç kullanım ve yakıt hesabı

- Kaynak: §21.8
- Öncelik: Must · Kademe: T2
- Açıklama: Km farkı ve yakıt kayıtlarından aracın kullanımı, km başı yakıt ve km başı maliyet hesaplanır.
- Kabul kriterleri:
  - [ ] Km başı yakıt, aracın kendi ortalamasından belirgin saparsa uyarı üretilir; sapma eşiği merkezi kuraldır (REQ-WFL-032).
- Durum: CONFIRMED

## C. Maliyet

### REQ-EQP-010 — Amortisman yalnızca çalıştığı günler şantiyeye

- Kaynak: §21.3; D-155
- Öncelik: Must · Kademe: T1
- Açıklama: Kendi malı varlığın günlük amortisman payı, satın alma bedelinin faydalı ömrüne bölünmesiyle bulunur. Bu pay yalnızca varlığın bir şantiyede çalıştığı günlerde o şantiyenin giderine yazılır. Çalışmadığı her gün (şantiyede boş beklerken, fabrikada, depoda veya bakımda) atıl ekipman giderine yazılır (REQ-EQP-012).
- Kabul kriterleri:
  - [ ] Her günün payı ya bir şantiyeye ya atıl ekipman giderine yazılır; hiçbir gün boşta kalmaz, hiçbir gün iki kez yazılmaz.
  - [ ] Pay, çalışma günü bilgisi içeren kayıt onaylanınca yazılır.
  - [ ] Faydalı ömrü dolan varlık için amortisman yazılmaz.
- Durum: CONFIRMED

### REQ-EQP-011 — Çalışma günü nereden gelir

- Kaynak: D-162; REQ-SIT-003
- Öncelik: Must · Kademe: T1
- Açıklama: Kalıp gibi sayaçsız ekipmanın o gün çalıştığı, saha mühendisinin günlük saha kaydında o gün kullanılan ekipmanları seçmesiyle belirlenir. Vinçte bu bilgi vinç günlük kaydından gelir (REQ-EQP-019).
- Kabul kriterleri:
  - [ ] Günlük kayıtta yalnızca o an o şantiyede bulunan ekipmanlar seçilebilir.
  - [ ] Şantiyede bulunup üst üste belirli gün seçilmeyen ekipman için "şantiyede boş bekliyor" uyarısı düşer; gün sayısı merkezi kuraldır.
- Durum: CONFIRMED

### REQ-EQP-012 — Atıl ekipman gideri

- Kaynak: §21.3; D-156
- Öncelik: Must · Kademe: T1
- Açıklama: Çalışmayan günlerin amortisman payı hiçbir projeye yüklenmez; şirket genelinde ayrı "atıl ekipman gideri" satırında görünür. Hangi varlığın, nerede, kaç gün ve ne kadar bedelle boş beklediği okunur.
- Kabul kriterleri:
  - [ ] Atıl ekipman gideri, varlık ve lokasyon bazında açılabilir.
- Durum: CONFIRMED

### REQ-EQP-013 — Tamir ve arıza maliyeti

- Kaynak: §21.4
- Öncelik: Must · Kademe: T2
- Açıklama: Arıza, tamir, yedek parça, servis, maliyet ve belge/fotoğraf ilgili varlığa, gerekiyorsa ilgili şantiyeye bağlanır. Fabrika günlük kaydındaki makine arızası (REQ-FAC-003) ve vinç arıza bildirimi de varlığa arıza kaydı olarak düşer.
- Kabul kriterleri:
  - [ ] Bir varlığın toplam tamir maliyeti kartında görünür.
- Durum: CONFIRMED

### REQ-EQP-014 — Kullanılamaz hale gelen demirbaş

- Kaynak: §21.4; D-157
- Öncelik: Must · Kademe: T1
- Açıklama: Bir demirbaş kullanılamaz hale gelirse kalan değeri (bedel − yazılmış amortisman), o sırada bulunduğu şantiyenin gideri olur; şantiyede değilse atıl ekipman giderine yazılır. Yetkili kişi gerekçeyle başka maliyet merkezine aktarabilir. Yerine alınan parça ayrı varlık veya gider olarak izlenir.
- Kabul kriterleri:
  - [ ] Zayi kaydı neden ve fotoğraf olmadan kaydedilmez.
  - [ ] Zayi edilen varlık pasifleşir, silinmez.
- Durum: CONFIRMED

## D. Bakım ve kontrol

### REQ-EQP-015 — Periyodik kontrol, muayene, sigorta ve bakım uyarıları

- Kaynak: §21.5, §21.8
- Öncelik: Must · Kademe: T1
- Açıklama: Vinç fenni/periyodik kontrolleri, araç muayenesi, sigorta, makine bakımı ve diğer zorunlu kontroller için tarih veya km'ye göre yaklaşan ve geçen uyarılar üretilir.
- Kabul kriterleri:
  - [ ] Süresi geçen zorunlu kontrol, "Dikkat" bölümünde (REQ-RPT-007) sebebi çözülene kadar kalır.
  - [ ] Ne kadar önce uyarılacağı kontrol türüne göre ayarlanır.
- Durum: CONFIRMED

## E. Atıl kaynak

### REQ-EQP-016 — Kaç gündür atıl

- Kaynak: §21.6
- Öncelik: Must · Kademe: T2
- Açıklama: Her varlık için kaç gündür çalışmadığı görünür. Bu bilgi kaynak planlamasına (REQ-INT) beslenir.
- Kabul kriterleri:
  - [ ] Atıl gün sayısı REQ-EQP-010'daki çalışma günlerinden hesaplanır.
- Durum: CONFIRMED

### REQ-EQP-017 — Atıl kapasite fırsat uyarısı

- Kaynak: §20.4
- Öncelik: Should · Kademe: T2
- Açıklama: Uzun süre boş duran vinç, araç, kalıp veya makine için "kiralama/dış iş fırsatı olabilir" uyarısı verilir. Gün eşiği merkezi kuraldır.
- Kabul kriterleri:
  - [ ] Uyarıdan doğrudan yan gelir kaydına (REQ-FIN-012) geçilebilir.
- Durum: CONFIRMED

## F. Vinç

### REQ-EQP-018 — Vinç operatör ekranı

- Kaynak: §21.7
- Öncelik: Must · Kademe: T2
- Açıklama: Vinç operatörü telefonundan kendisine atanmış vinçleri ve günlük görevlerini görür; günlük kaydını ve arıza bildirimini girer.
- Kabul kriterleri:
  - [ ] Operatör yalnızca kendisine atanmış vinçleri görür.
- Durum: CONFIRMED

### REQ-EQP-019 — Vinç günlük kaydı

- Kaynak: §21.7
- Öncelik: Must · Kademe: T1
- Açıklama: Her vinç için günlük kayıtta şantiye ve operatör, çalışma saati (başlangıç/bitiş veya saat sayacı), yakıt miktarı ve tutarı ile yakıt fişi fotoğrafı, fotoğraflı arıza/bekleme bildirimi ve yapılan işler bulunur. Kayıt iş akışında tanımlı onaydan geçer; maliyet ve çalışma günü onaydan sonra işlenir.
- Kabul kriterleri:
  - [ ] Yakıt tutarı fiş fotoğrafı olmadan gönderilemez.
  - [ ] Saat sayacı bir önceki okumadan küçük girilemez.
- Durum: CONFIRMED

### REQ-EQP-020 — Vinç yakıt ve kullanım göstergeleri

- Kaynak: §21.7
- Öncelik: Must · Kademe: T2
- Açıklama: Çalışma saati ve yakıttan saat başı yakıt tüketimi ve kullanım oranı hesaplanır; olağan dışı yakıt tüketiminde uyarı üretilir. Eşik merkezi kuraldır.
- Kabul kriterleri:
  - [ ] Uyarı, sapmanın olduğu günü ve kaydı gösterir.
- Durum: CONFIRMED

## G. Servis aracı

### REQ-EQP-021 — Servis aracının net etkisi

- Kaynak: §20.3; D-159
- Öncelik: Should · Kademe: T2
- Açıklama: Servis/nakliye aracı için yakıt, amortisman, bakım ve dış nakliye geliri birlikte gösterilir; aracın şirkete net etkisi görülür. Kendi işlerimizde sağladığı nakliye tasarrufu hesaplanmaz (D-159).
- Kabul kriterleri:
  - [ ] Net etki aylık ve kümülatif görünür, her kalem kaynağına açılır.
- Durum: CONFIRMED

---

## Yetenek kataloğu — EQP

Biçim: `docs/requirements/README.md`.

### Olaylar

| Kod | Ad | Ne zaman | Taşıdığı alanlar | Veri sınıfı |
|---|---|---|---|---|
| `asset.transferred` | Varlık yer değiştirdi | Transfer kaydedildiğinde | varlık, nereden, nereye | iç |
| `asset.assigned` | Varlık zimmetlendi | Zimmet veya devir tamamlandığında | varlık, kişi | iç |
| `asset.breakdown_reported` | Arıza bildirildi | Arıza kaydı açıldığında | varlık, lokasyon, bildiren | iç |
| `asset.written_off` | Varlık zayi edildi | Zayi kaydı onaylandığında | varlık, lokasyon, kalan değer | ticari |
| `asset.inspection_due` | Periyodik kontrol yaklaşıyor | Uyarı süresine girildiğinde | varlık, kontrol türü, tarih | iç |
| `asset.inspection_overdue` | Periyodik kontrol geçti | Tarih geçtiğinde | varlık, kontrol türü, gecikme | iç |
| `asset.idle_threshold_reached` | Varlık uzun süredir atıl | Atıl gün eşiği aşıldığında | varlık, lokasyon, atıl gün | iç |
| `rented_asset.rental_ending` | Kira süresi bitiyor | Uyarı süresine girildiğinde | varlık, kiralayan, bitiş | iç |
| `crane_daily_log.approved` | Vinç kaydı onaylandı | Onaylandığında | vinç, şantiye, saat, yakıt | iç |
| `crane_daily_log.fuel_anomaly` | Olağan dışı vinç yakıtı | Sapma eşiği aşıldığında | vinç, gün, saat başı yakıt | iç |

### Aksiyonlar

Yok. Transfer, zimmet ve zayi kaydını bir insan yapar.

### Koşul alanları

| Kod | Ad | Tip | Veri sınıfı |
|---|---|---|---|
| `asset.category` | Varlık kategorisi | seçim | iç |
| `asset.idle_days` | Atıl gün sayısı | sayı | iç |
| `asset.days_to_inspection` | Kontrole kalan gün | sayı | iç |
| `asset.remaining_value` | Kalan değer | tutar | ticari |
| `crane_daily_log.fuel_per_hour` | Saat başı yakıt | sayı | iç |
