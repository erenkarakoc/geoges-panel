# REQ-INV — Stok, Malzeme Hareketleri, Kantar ve Maliyet

Durum: CONFIRMED (sahip, 2026-09-18) · 2026-09-18 · Modül: INV (Inventory)

Kaynaklar: Özellik Yapısı §18.1, §18.4–§18.15, §19, §20.1; ADR-005 (değişmez defterler); kararlar D-123, D-142, D-143.

**Sınır.** Malzeme kataloğunun kalemleri ADM'de tanımlanır (REQ-ADM-001); INV onların stok davranışını tutar. Tedarikçiler, siparişler ve satın alma talepleri REQ-PUR'dadır. Fabrikanın işleme kaydı ve birim maliyeti REQ-FAC'tadır. Hurda satışının gelir kaydı ve cari REQ-FIN'dedir. Malzeme çıkış talebinin onay kuralı bir iş akışıdır (REQ-WFL).

Terimler (`docs/domain/GLOSSARY.md`): Material, Location, Stock Movement, Shipment, Truck Load, Weighbridge Ticket, Theoretical Weight, Stock Count, Opening Stock, Process Loss, Scrap, Material Issue Request, Strip Combination, Landed Cost, Weighted Average Cost, Rolling Mill Supplier, Galvanizer, Tie Strip Lug, Flat Bar.

---

## A. Malzeme ve lokasyon

### REQ-INV-001 — Malzemenin stok bilgileri

- Kaynak: §18.1; REQ-ADM-001
- Öncelik: Must · Kademe: T2
- Açıklama: Katalogdaki her malzeme (çelik şerit tipleri, düz lama/lug hammaddesi, lug, civata-somun, lastik takoz, kalıp yağı, EPDM, derz dolgusu, ankraj, diğer sarflar) için birim, kritik stok eşiği, gerekiyorsa boy/ölçü, şerit için genişlik × kalınlık, boy ve delik sayısı ve teorik birim ağırlık (kg/m veya kg/adet) tutulur.
- Kabul kriterleri:
  - [ ] Teorik birim ağırlığı olmayan şerit ve lama malzemesi için kantar karşılaştırması yapılamadığı açıkça belirtilir.
- Durum: CONFIRMED

### REQ-INV-002 — Lokasyon ve süreç durumuna göre stok

- Kaynak: §18.4
- Öncelik: Must · Kademe: T1
- Açıklama: Stok yalnızca şirket toplamı değildir; fabrika/depo, galvanizci, şantiyeler ve sevkiyatta ayrı ayrı görülür. Aynı malzeme süreç durumuna göre de ayrılır: hammadde, işlemde, galvanizde, hazır, sahada.
- Kabul kriterleri:
  - [ ] Bir malzemenin şirket toplamı, lokasyonlardaki miktarların toplamına her zaman eşittir.
- Durum: CONFIRMED

### REQ-INV-003 — Her hareket bir kayıttır; bakiye türetilir

- Kaynak: §18.5; ADR-005
- Öncelik: Must · Kademe: T1
- Açıklama: Satın alma girişi, fabrika girişi, işleme, galvanize çıkış, galvaniz dönüşü, şantiye sevki, şantiyeler arası transfer, saha tüketimi, iade, fire ve hurda birer stok hareketidir. Stok miktarı bu hareketlerden hesaplanır; hiçbir yerde elle üzerine yazılmaz. Hareketler değiştirilmez, düzeltme ters hareketle yapılır.
- Kabul kriterleri:
  - [ ] Stok miktarını doğrudan değiştiren bir ekran veya işlem yoktur.
  - [ ] Her hareket kaynağına (sipariş, günlük kayıt, sevkiyat, sayım…) bağlantı taşır.
- Durum: CONFIRMED

### REQ-INV-004 — Fire aşama aşama görünür

- Kaynak: §18.6
- Öncelik: Must · Kademe: T1
- Açıklama: Bir aşamaya giren ve çıkan miktar farklıysa fark fire olarak gösterilir: fabrikada işleme firesi, galvaniz sürecindeki fark ve sevkiyat farkı ayrı ayrı.
- Kabul kriterleri:
  - [ ] Her fire kaydı hangi aşamada oluştuğunu taşır ve aşamalar ayrı toplanır.
- Durum: CONFIRMED

## B. Sevkiyat ve talepler

### REQ-INV-005 — Malzeme çıkış talebi

- Kaynak: §18.7; REQ-WFL
- Öncelik: Must · Kademe: T1
- Açıklama: Şantiyeye malzeme çıkışı için önce talep oluşturulur: şantiye talebi → yönetim onayı → sevkiyat → sahaya teslim/alım → stok güncellemesi. Onay kuralını sahipler bir iş akışıyla belirler. Sahipler yalnızca talebi değil, malzemenin gerçekten sevk edildiğini ve sahaya ulaştığını da bildirimden görür.
- Kabul kriterleri:
  - [ ] Talep, sevkiyat ve teslim alım ayrı adımlardır; her biri kendi olayını yayımlar.
  - [ ] Teslim alınmayan sevkiyat "sevkiyatta" lokasyonunda kalır.
- Durum: CONFIRMED

### REQ-INV-006 — Şantiyeler arası doğrudan sevkiyat

- Kaynak: §18.8
- Öncelik: Must · Kademe: T2
- Açıklama: Malzeme ve ekipman fabrikaya dönmeden doğrudan başka şantiyeye sevk edilebilir; kayıtta kaynak ve hedef şantiye görünür.
- Kabul kriterleri:
  - [ ] Doğrudan sevkiyat, iki şantiyenin stoğunu aynı anda ve tek hareket çiftiyle değiştirir.
- Durum: CONFIRMED

### REQ-INV-007 — Kritik stok uyarısı

- Kaynak: §18.9
- Öncelik: Must · Kademe: T2
- Açıklama: Her malzemenin kritik eşiği vardır. Uyarı mevcut stok, projenin kalan ihtiyacı, beklenen tüketim ve kritik seviyeye kalan miktar/zaman üzerinden verilir ("50×4 şerit stoğu kritik seviyeye yaklaşıyor; sipariş/talep oluştur"). Uyarı ilgili sorumluya, koordinatöre ve gerekirse sahiplere çıkar.
- Kabul kriterleri:
  - [ ] Uyarı, kritik seviyeye kaç gün kaldığını beklenen tüketimden hesaplayarak gösterir.
- Durum: CONFIRMED

### REQ-INV-008 — Proje sonu artık malzeme zayi değildir

- Kaynak: §18.10
- Öncelik: Must · Kademe: T2
- Açıklama: Proje sonunda artan kullanılabilir malzeme kendiliğinden zayi sayılmaz. Seçenekler: fabrikaya iade, başka projeye transfer, sonraki proje için stok, uygunsa satış.
- Kabul kriterleri:
  - [ ] Proje kapanırken şantiyede kalan stok için bu dört seçenekten biri seçilmeden kapanış tamamlanmaz.
- Durum: CONFIRMED

## C. Kantar ve tır bazlı sevkiyat

### REQ-INV-009 — Aşamaya göre birim ve teorik ağırlık

- Kaynak: §18.11
- Öncelik: Must · Kademe: T1
- Açıklama: Çelik şerit ve lamada miktar aşamaya göre farklı birimle izlenir: haddeciye sipariş kg/ton; haddeci çıkışı ve galvaniz giriş/çıkışı boy bazında kg; şantiyeye sevk ve sahada kullanım boy bazında adet ve metre. Birimler arası dönüşüm teorik ağırlıkla yapılır: genişlik × kalınlık × boy × çelik yoğunluğu.
- Kabul kriterleri:
  - [ ] Aynı sevkiyat hem kg hem adet/metre olarak okunabilir; dönüşüm tanımlardan hesaplanır.
- Durum: CONFIRMED

### REQ-INV-010 — Tır bazında sevkiyat kaydı

- Kaynak: §18.11
- Öncelik: Must · Kademe: T1
- Açıklama: Her sevkiyat tır bazında kaydedilir: tır/plaka ve kaçıncı tır olduğu, ilgili sipariş, çıkış ve varış noktası (haddeci, galvanizci, fabrika, şantiye), boy bazında adet ve kg (aynı tırda farklı boylar olabilir), kantar fişleri (haddeci çıkış, galvanizci giriş, galvanizci çıkış, şantiye giriş). Haddeci ve galvanizci listeleri tedarikçi tanımlarından gelir.
- Kabul kriterleri:
  - [ ] Bir tırda birden fazla boy satırı olabilir.
  - [ ] Her kantar fişi belge olarak kayda eklenir.
- Durum: CONFIRMED

### REQ-INV-011 — Kantar farkı

- Kaynak: §18.11
- Öncelik: Must · Kademe: T1
- Açıklama: Kantar tartısı teorik ağırlıkla karşılaştırılır; fark tanımlı toleransı aşarsa uyarı oluşur ve açıklama istenir. Çıkış ve varış kantarı arasındaki fark ayrıca sevkiyat farkı olarak gösterilir.
- Kabul kriterleri:
  - [ ] Tolerans dışı farkı olan sevkiyat, açıklama girilmeden teslim alındı olarak kapatılamaz.
- Durum: CONFIRMED

### REQ-INV-012 — Galvaniz ağırlık artışı fire değildir

- Kaynak: §18.11
- Öncelik: Must · Kademe: T2
- Açıklama: Galvaniz dönüşündeki ağırlık artışı çinko kaplamadan kaynaklanır; fire sayılmaz, beklenen kaplama artışıyla karşılaştırılarak ayrı gösterilir.
- Kabul kriterleri:
  - [ ] Galvaniz dönüşü fire hesabına girmez; beklenenden sapması ayrıca raporlanır.
- Durum: CONFIRMED

### REQ-INV-013 — Stok giriş ekranı özet kartları

- Kaynak: §18.11
- Öncelik: Should · Kademe: T2
- Açıklama: Özet kartlar: haddeci için toplam sipariş kg / çıkan kg; galvanizci ve depo için giren / çıkan / kalan kg; şantiyeler için gelen / kullanılan / kalan adet.
- Kabul kriterleri:
  - [ ] Kartlardaki değerler stok hareketlerinden hesaplanır.
- Durum: CONFIRMED

## D. Sayım ve açılış

### REQ-INV-014 — Fiziki stok sayımı

- Kaynak: §18.12
- Öncelik: Must · Kademe: T1
- Açıklama: Fabrika, depo, galvanizci ve şantiyelerde periyodik veya habersiz sayım yapılır. Sayımda lokasyon, tarih, sayan kişi, malzeme bazında sistem miktarı ve sayılan miktar, fark ve fark nedeni, gerekiyorsa fotoğraf tutulur. Sayım sorumlu yöneticinin onayına gider; onaylanan fark stok düzeltme hareketi olarak işlenir. Hedef sıfır farktır; tolerans dışı fark kritik uyarıdır. Sayım geçmişi ve lokasyon bazında fark eğilimi raporlanır.
- Kabul kriterleri:
  - [ ] Onaylanmayan sayım stoğu değiştirmez.
  - [ ] Fark, stoğun üzerine yazılarak değil düzeltme hareketiyle işlenir.
- Durum: CONFIRMED

### REQ-INV-015 — Açılış stoku

- Kaynak: §18.13
- Öncelik: Must · Kademe: T1
- Açıklama: Panel kullanılmaya başlandığında veya yeni lokasyon eklendiğinde mevcut stok birim maliyetiyle "açılış stoku" olarak girilir. Onaydan sonra kilitlenir; yalnızca revizyon talebiyle değişir (REQ-AUD-008).
- Kabul kriterleri:
  - [ ] Onaylı açılış stoku doğrudan düzenlenemez.
- Durum: CONFIRMED

## E. Şerit kombinasyonu

### REQ-INV-016 — Şerit kombinasyon önerisi

- Kaynak: §18.14
- Öncelik: Should · Kademe: T2
- Açıklama: Belirli bir uzunlukta şerit ihtiyacında stoktaki boylardan en uygun kombinasyon önerilir: önce en az fire (toplam boy − ihtiyaç), sonra en az parça sayısı. Stok yetmiyorsa eksik boy ve miktar için talep/sipariş önerisi üretilir. Öneriyi sevki planlayan kişi onaylar veya değiştirir.
- Kabul kriterleri:
  - [ ] Aynı fireyi veren kombinasyonlar arasında daha az parçalı olan önerilir.
  - [ ] Öneri onaylanmadan hiçbir stok hareketi oluşmaz.
- Durum: CONFIRMED

## F. Tüketim maliyeti

### REQ-INV-017 — Tüketim maliyeti kendiliğinden yansır

- Kaynak: §18.15
- Öncelik: Must · Kademe: T1
- Açıklama: Sahada veya fabrikada tüketilen her malzemenin maliyeti ilgili proje, şantiye veya fabrika maliyetine kendiliğinden yansır; ayrıca gider olarak girilmez.
- Kabul kriterleri:
  - [ ] Aynı tüketim hem stoktan hem gider olarak iki kez maliyete giremez.
- Durum: CONFIRMED

### REQ-INV-018 — Birim maliyet sırası

- Kaynak: §18.15
- Öncelik: Must · Kademe: T1
- Açıklama: Birim maliyet şu sırayla bulunur: alışların ağırlıklı ortalama maliyeti; yoksa son alış fiyatı; yoksa tanımlı manuel birim maliyet; hiçbiri yoksa "maliyet bulunamadı" uyarısı. Hangi yöntemle bulunduğu kayıtta görünür.
- Kabul kriterleri:
  - [ ] Her tüketim hareketi maliyetini ve yöntemini taşır.
  - [ ] "Maliyet bulunamadı" durumundaki tüketim sıfır maliyetle sessizce geçmez; uyarı ve görev üretir.
- Durum: CONFIRMED

### REQ-INV-019 — Ağırlıklı ortalama lokasyon başına

- Kaynak: D-143
- Öncelik: Must · Kademe: T1
- Açıklama: Ağırlıklı ortalama maliyet her lokasyon için ayrı hesaplanır. Transferde malzeme çıktığı lokasyonun ortalama maliyetiyle çıkar; transferin taşıma ücreti vardığı lokasyonun maliyetine eklenir (D-142 ile tutarlı olarak türetildi; sahip 2026-09-18 teyit etti).
- Kabul kriterleri:
  - [ ] Aynı malzemenin iki lokasyondaki ortalama maliyeti farklı olabilir ve her biri ayrı görünür.
  - [ ] Transfer, kaynak lokasyonun ortalamasını değiştirmez; hedefinkini günceller.
- Durum: CONFIRMED

### REQ-INV-020 — Şeridin maliyetine galvaniz ve nakliye eklenir

- Kaynak: D-142
- Öncelik: Must · Kademe: T1
- Açıklama: Bir metre şeridin maliyeti çelik alış bedeli, galvaniz bedeli ve stoğa gelene kadarki nakliyeden oluşur. Şantiye şeridi kullandığında gerçek maliyeti proje kâr-zararına yansır.
- Kabul kriterleri:
  - [ ] Galvaniz faturası ve nakliye bedeli, ilgili şerit partisinin birim maliyetine dağıtılır; ayrıca gider olarak yazılmaz.
- Durum: CONFIRMED

### REQ-INV-021 — Maliyet tüketim anında donar

- Kaynak: §18.15; REQ-ADM-007
- Öncelik: Must · Kademe: T1
- Açıklama: Maliyet tüketim anında dondurulur; sonradan girilen sipariş veya değişen fiyat geçmiş kâr-zararı değiştirmez.
- Kabul kriterleri:
  - [ ] Geçmiş bir tüketimin maliyeti, sonradan girilen bir alışla değişmez.
- Durum: CONFIRMED

### REQ-INV-022 — Lug maliyeti ve geçici maliyet

- Kaynak: §18.15; REQ-FAC-009
- Öncelik: Must · Kademe: T1
- Açıklama: Lug düz lamadan fabrikada üretildiği için maliyeti düz lama + fabrika işçilik, enerji ve fire payıdır. Fabrika maliyeti tam oluşana kadar düz lama maliyeti geçici olarak kullanılır ve "geçici" diye işaretlenir.
- Kabul kriterleri:
  - [ ] "Geçici" işaretli maliyetler raporlarda ayırt edilir ve fabrika maliyeti kesinleşince işaret kalkar.
- Durum: CONFIRMED

### REQ-INV-023 — İşveren malzemesi maliyete yazılmaz

- Kaynak: §18.15; REQ-PRJ-004
- Öncelik: Must · Kademe: T1
- Açıklama: İşverenin tedarik ettiği malzeme stokta miktar olarak izlenir fakat GEOGES maliyetine yazılmaz.
- Kabul kriterleri:
  - [ ] İşveren malzemesinin tüketimi miktar olarak görünür, maliyeti sıfır ve "işveren" işaretlidir.
- Durum: CONFIRMED

### REQ-INV-024 — Eksi stok

- Kaynak: §18.15
- Öncelik: Must · Kademe: T1
- Açıklama: Stok eksiye düşerse tüketim yine kaydedilir, ancak kritik uyarı oluşur.
- Kabul kriterleri:
  - [ ] Eksi stok "Dikkat" bölümünde görünür ve ilgili sorumluya görev düşer.
- Durum: CONFIRMED

## G. Sarf

### REQ-INV-025 — Sarf ekranı

- Kaynak: §19; REQ-SIT-029
- Öncelik: Must · Kademe: T2
- Açıklama: Sarf reçetesiyle hesaplanan tahmini sarf günlük kayda önerilir; kullanıcı gerçek sapmayı veya ekstra tüketimi girer (D-123). Sarf ekranında malzeme, birim, bugün kullanılan, bugüne kadar kullanılan, stok kalan ve kritik durum görünür.
- Kabul kriterleri:
  - [ ] Sarf ekranındaki "stok kalan", o lokasyonun stok hareketlerinden hesaplanır.
- Durum: CONFIRMED

### REQ-INV-026 — Normalin üzerinde sarfiyat uyarısı

- Kaynak: §19; §3.3
- Öncelik: Must · Kademe: T2
- Açıklama: Normalin üzerinde sarfiyat (ör. kalıp yağı) uyarı olarak işaretlenir ve "Dikkat" bölümüne çıkar. Normal aralık merkezi kuraldır.
- Kabul kriterleri:
  - [ ] Uyarı, reçetedeki beklenen miktar ile gerçekleşen arasındaki farka göre verilir.
- Durum: CONFIRMED

## H. Fire ve hurda

### REQ-INV-027 — Fireden hurda satışına kapanan zincir

- Kaynak: §20.1
- Öncelik: Must · Kademe: T1
- Açıklama: Hurdaya dönüşecek fire tartılır; tartım fişi, ekran görüntüsü veya ilgili belge fire kaydına eklenir. Zincir fire oluştu → tartıldı → hurdaya ayrıldı → satıldı → gelir kaydı oluştu şeklinde kapanır. "Ne kadar fire çıktı, ne kadar hurda satıldı, hangi fiyattan" soruları cevaplanır.
- Kabul kriterleri:
  - [ ] Tartım belgesi olmayan fire hurdaya ayrılamaz.
  - [ ] Satılan hurda miktarı, hurdaya ayrılan miktarı aşamaz.
- Durum: CONFIRMED

---

## Yetenek kataloğu — INV

Biçim: `docs/requirements/README.md`.

### Olaylar

| Kod | Ad | Ne zaman | Taşıdığı alanlar | Veri sınıfı |
|---|---|---|---|---|
| `stock_movement.recorded` | Stok hareketi kaydedildi | Her hareket işlendiğinde | malzeme, lokasyon, miktar, tür, kaynak | iç |
| `stock.below_critical` | Stok kritik seviyenin altında | Miktar eşiğin altına indiğinde | malzeme, lokasyon, miktar, kalan gün | iç |
| `stock.negative` | Stok eksiye düştü | Bakiye sıfırın altına indiğinde | malzeme, lokasyon, miktar | iç |
| `material_issue_request.submitted` | Malzeme çıkış talebi açıldı | Şantiye talep gönderdiğinde | şantiye, malzemeler, talep eden | iç |
| `shipment.dispatched` | Sevkiyat çıktı | Tır yola çıktığında | sevkiyat, çıkış, varış | iç |
| `shipment.received` | Sevkiyat teslim alındı | Varışta teslim alındığında | sevkiyat, teslim alan, fark | iç |
| `weighbridge_difference.exceeded` | Kantar farkı toleransı aştı | Tartı teorik ağırlıktan tolerans dışında saptığında | sevkiyat, fark % | iç |
| `stock_count.approved` | Sayım onaylandı | Sayım onaylandığında | lokasyon, fark | iç |

### Aksiyonlar

| Kod | Ad | Girdi | Gereken yetki | İki kez çalışırsa | Yarıda kalırsa |
|---|---|---|---|---|---|
| `material_issue_request.create_draft` | Taslak çıkış talebi aç | şantiye, malzeme, miktar | akışın sistem yetkisi | Aynı şantiye ve malzeme için açık taslak varsa onu döndürür | Taslak açılmamış sayılır |

### Koşul alanları

| Kod | Ad | Tip | Veri sınıfı |
|---|---|---|---|
| `stock.quantity` | Stok miktarı | sayı | iç |
| `stock.days_to_critical` | Kritik seviyeye kalan gün | sayı | iç |
| `weighbridge.difference_percent` | Kantar farkı | sayı (%) | iç |
| `stock_count.difference_percent` | Sayım farkı | sayı (%) | iç |
| `stock_movement.unit_cost` | Hareketin birim maliyeti | tutar | ticari |
