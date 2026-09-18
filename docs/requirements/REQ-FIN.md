# REQ-FIN — Hakediş, Gelir-Gider, Cari, Nakit ve Dönem Kapanışı

Durum: CONFIRMED (sahip, 2026-09-18) · 2026-09-18 · Modül: FIN (Finance)

Kaynaklar: Özellik Yapısı §15.1 (maliyet kalemleri), §16, §20.2, §22; kararlar D-027, D-029, D-030, D-033, D-034, D-140, D-141, D-147…D-154.

**Sınır.** Onay mekanizması ve ödeme onay eşikleri iş akışıdır (REQ-WFL). Tedarikçi siparişi ve satın alma REQ-PUR'dadır; stok maliyeti REQ-INV'de, fabrika birim maliyeti REQ-FAC'tadır. Bordro ve puantaj REQ-HR'dadır; ekipman amortismanı, servis aracı ve atıl kapasite (§20.3, §20.4) REQ-EQP'dedir. Teminat mektubunun kendisi ve sözleşme vadesi REQ-CMP'dedir. Kur kuralı REQ-ADM-013'tedir. FIN hesaplar; göstergeler ve "Niye zarardayız?" analizi REQ-RPT'dedir. Onaylı kaydın değiştirilmesi revizyon talebiyle olur (REQ-AUD).

Terimler (`docs/domain/GLOSSARY.md`): Client Progress Payment, Subcontractor Progress Payment, Carried-Over Quantity, Deduction, Retention, Withholding Tax, Client Advance, Collection, Income, Ancillary Income, Expense, General Expense, Cost Center, Party Account, Cash Flow Projection, Payment, Accounting Export, Period Close, Closing Unit.

---

## A. İşveren hakedişi

### REQ-FIN-001 — Hakediş kaydı

- Kaynak: §16.1
- Öncelik: Must · Kademe: T1
- Açıklama: İşveren hakedişinde proje, dönem (ay), onaylı imalat miktarları, birim fiyatlar, brüt tutar, kesintiler, net tutar, para birimi ve hakediş belgesi tutulur. Hakedişi yetkili ticari, muhasebe veya koordinasyon rolü yönetir; günlük saha kaydından ayrı bir süreçtir. Tutarlar ticari veridir.
- Kabul kriterleri:
  - [ ] Dövizli hakedişte tutar, TL karşılığıyla birlikte saklanır (REQ-ADM-013).
  - [ ] Bir proje ve dönem için yalnızca bir işveren hakedişi açık olabilir.
- Durum: CONFIRMED

### REQ-FIN-002 — Onaylı üretim öneri olarak gelir

- Kaynak: §16.1
- Öncelik: Must · Kademe: T1
- Açıklama: Dönemin onaylı saha üretimi, hakedişe miktar önerisi olarak kendiliğinden gelir. Yetkili kişi bir miktarı düzeltebilir; düzeltme gerekçe ister ve öneriyle yan yana görünür.
- Kabul kriterleri:
  - [ ] Gerekçesiz miktar düzeltmesi kaydedilmez.
  - [ ] Onaylanmamış günlük kayıtların üretimi öneriye girmez.
- Durum: CONFIRMED

### REQ-FIN-003 — İşverenin onaylamadığı miktar sonraki aya devreder

- Kaynak: D-147
- Öncelik: Must · Kademe: T1
- Açıklama: İşveren sunulan miktardan azını onaylarsa aradaki fark kaybolmaz; bir sonraki hakedişte yeniden önerilir. Kaç aydır bekleyen devreden miktar olduğu görünür.
- Kabul kriterleri:
  - [ ] Devreden miktar, bir sonraki hakediş önerisinde ayrı satır olarak ve ilk sunulduğu ayla birlikte görünür.
  - [ ] Aynı miktar hiçbir zaman iki hakedişte birden onaylanmış sayılmaz.
- Durum: CONFIRMED

### REQ-FIN-004 — Hakediş durum zinciri

- Kaynak: §16.2
- Öncelik: Must · Kademe: T1
- Açıklama: Hakediş şu durumlardan geçer: Hazırlandı → İşverene sunuldu → İşveren onayladı → Faturalandı → Tahsil edildi.
- Kabul kriterleri:
  - [ ] Her durum geçişi tarihi ve yapanla hakedişin geçmişine yazılır.
  - [ ] Durum atlanamaz; ör. faturalanmamış hakediş "Tahsil edildi" olamaz.
- Durum: CONFIRMED

### REQ-FIN-005 — Kısmi tahsilat

- Kaynak: §16.2
- Öncelik: Must · Kademe: T1
- Açıklama: Bir hakediş birden fazla tahsilatla kapanabilir; kalan açık alacak görünür. Hakediş, net tutarın tamamı tahsil edilince "Tahsil edildi" olur.
- Kabul kriterleri:
  - [ ] Her tahsilat tarih, tutar, para birimi ve dekontla girilir ve işveren carisini azaltır (REQ-FIN-019).
- Durum: CONFIRMED

### REQ-FIN-006 — Kesintiler

- Kaynak: §16.1; D-029, D-150
- Öncelik: Must · Kademe: T1
- Açıklama: Brüt tutardan teminat kesintisi, stopaj, işveren avansı kesintisi ve diğer kesintiler düşülerek net tutar bulunur. "İşveren karşılar ve GEOGES hakedişinden keser" olarak işaretlenmiş kalemler (REQ-PRJ) de kesinti olarak gelir. Oranlar projenin sözleşmesinden alınır.
- Kabul kriterleri:
  - [ ] Teminat kesintisi, iş sonunda iade edilecek alacak olarak ayrı izlenir; toplam kesilen teminat projede görünür.
  - [ ] Her kesinti türü ayrı satırdır; net tutar satırlardan hesaplanır, elle yazılmaz.
- Durum: CONFIRMED

### REQ-FIN-007 — İşveren avansı hakedişlerden kesilerek kapanır

- Kaynak: D-150
- Öncelik: Must · Kademe: T1
- Açıklama: İşverenden iş başında alınan avans kaydedilir ve sözleşmedeki oranla her hakedişten kesilerek kapanır. Kalan avans borcu projede görünür.
- Kabul kriterleri:
  - [ ] Kesilen avans toplamı alınan avansı aşamaz.
  - [ ] Avans kesinti oranı projeye göre ayarlanır.
- Durum: CONFIRMED

### REQ-FIN-008 — İşveren onayı fatura görevi açar

- Kaynak: §16.3
- Öncelik: Must · Kademe: T2
- Açıklama: İşveren hakedişi onayladığında muhasebe birimine fatura görevi düşer. Faturanın kesilmesi için ayrıca yönetim onayı gerekip gerekmediği iş akışında tanımlanır.
- Kabul kriterleri:
  - [ ] Fatura görevi, hakedişe bağlıdır; hakediş "Faturalandı" olunca görev kapanır.
- Durum: CONFIRMED

## B. Taşeron hakedişi

### REQ-FIN-009 — Taşeron hakedişi bizim onayladığımız üretimden

- Kaynak: §16.4; D-030, D-148
- Öncelik: Must · Kademe: T1
- Açıklama: Taşeron hakedişi, işverenin onayını beklemeden, mühendisimizin onayladığı günlük kayıtlardaki üretimden hesaplanır. Ödeme yöntemi taşeron sözleşmesine göredir: birim fiyat (onaylı miktar × birim fiyat), götürü veya gündelik (D-030).
- Kabul kriterleri:
  - [ ] İşveren bir miktarı kısarsa taşeron hakedişi kendiliğinden değişmez; fark projenin sonucunda görünür.
  - [ ] Taşeron hakedişi de kesinti ve onay adımlarından geçer ve taşeron carisine borç olarak yazılır.
- Durum: CONFIRMED

### REQ-FIN-010 — İki hakediş aynı veriden

- Kaynak: §16.4
- Öncelik: Must · Kademe: T1
- Açıklama: İşveren ve taşeron hakedişleri aynı onaylı üretim verisinden hesaplanır; miktarlar ayrı ayrı girilmez.
- Kabul kriterleri:
  - [ ] Bir dönem için işveren ve taşeron hakedişlerinin miktarları yan yana karşılaştırılabilir.
- Durum: CONFIRMED

## C. Gelir ve gider

### REQ-FIN-011 — Gelir kaydı

- Kaynak: §22.2
- Öncelik: Must · Kademe: T1
- Açıklama: Gelir kaynakları hakediş tahsilatları, yan gelirler, hurda, dış nakliye, dış imalat, kiralama ve diğer gelirlerdir. Her gelirde tutar, para birimi, tarih, ilgili proje veya birim, faturalı/nakit bilgisi ve belge tutulur.
- Kabul kriterleri:
  - [ ] Her gelir bir maliyet merkezine (proje, şantiye, fabrika, ekipman, genel) bağlıdır.
- Durum: CONFIRMED

### REQ-FIN-012 — Yan gelir ve dış işler

- Kaynak: §20.2
- Öncelik: Must · Kademe: T2
- Açıklama: Hurda satışı, dış nakliye, dış kaynak/imalat, kaynak/kesim, ekipman ve kalıp kiralama, araçla dış hizmet ve diğer dış işler ortak yan gelir alanına girilir: iş türü, müşteri, miktar, birim fiyat, toplam, tarih, faturalı/nakit, ilgili araç/birim/personel ve belge.
- Kabul kriterleri:
  - [ ] Nakit tahsil edilen yan gelir de kayda girilir ve resmi muhasebe mutabakatına dahildir (REQ-FIN-026).
  - [ ] Hurda satışı, stoktaki hurda miktarını azaltır (REQ-INV).
- Durum: CONFIRMED

### REQ-FIN-013 — Sistemden kendiliğinden gelen giderler

- Kaynak: §22.3, §15.1
- Öncelik: Must · Kademe: T1
- Açıklama: Taşeron hakedişi, malzeme tüketimi, ekipman amortismanı, bordro, saha harcaması, fabrika maliyeti ve bakım gibi giderler kaynak modülde onaylandığında finansa kendiliğinden gider olarak yazılır.
- Kabul kriterleri:
  - [ ] Kendiliğinden gelen her gider, kaynak kaydına bağlantı taşır.
  - [ ] Kaynak kaydı onaylanmadan gider yazılmaz.
- Durum: CONFIRMED

### REQ-FIN-014 — Elle girilen giderler

- Kaynak: §22.3
- Öncelik: Must · Kademe: T1
- Açıklama: Ofis gideri, kira, seyahat, yemek, konaklama, avans ve diğer genel giderler elle, belgeyle girilir. Her gider bir maliyet merkezine bağlanır; hiçbir projeye ait olmayan gider "genel" merkeze yazılır.
- Kabul kriterleri:
  - [ ] Maliyet merkezi seçilmeden gider kaydedilmez.
- Durum: CONFIRMED

### REQ-FIN-015 — Saha harcamasının onayı

- Kaynak: §9.4; REQ-SIT (saha harcaması)
- Öncelik: Must · Kademe: T1
- Açıklama: Şantiyede girilen harcama, iş akışında tanımlı onaydan geçince şantiyenin gideri olarak yazılır.
- Kabul kriterleri:
  - [ ] Onay bekleyen harcama gider toplamlarında görünmez; ayrı "onay bekleyen" olarak görünür.
- Durum: CONFIRMED

### REQ-FIN-016 — Aynı gider iki kez sayılmaz

- Kaynak: §22.3; D-152
- Öncelik: Must · Kademe: T1
- Açıklama: Aynı harcama iki yoldan gelebilir (ör. önce şantiye fişi, sonra tedarikçi faturası). İlk giren kayıt gideri yazar; sonra gelen kayıt ona bağlanır ve tekrar gider yazmaz. Tutarlar farklıysa fark ayrı görünür.
- Kabul kriterleri:
  - [ ] Aynı tedarikçi, yakın tarih ve benzer tutarla gelen kayıt, olası tekrar olarak işaretlenir ve bağlama önerilir.
  - [ ] Bağlanan iki kayıt arasındaki tutar farkı, gerekçeyle kapatılana kadar açık kalem olarak görünür.
- Durum: CONFIRMED

## D. Proje kâr-zararı

### REQ-FIN-017 — Proje kâr-zararı doğrudan giderlerle

- Kaynak: §22.4, §15.1; D-149
- Öncelik: Must · Kademe: T1
- Açıklama: Proje kâr-zararı = gelir − (işçilik veya taşeron hakedişi + malzeme + yemek/konaklama + ekipman/amortisman + nakliye + operatör/vinç + saha harcaması + projeye doğrudan yazılmış diğer giderler). "Kim neyi karşılıyor" matrisi (REQ-PRJ) hangi kalemin gider olduğunu belirler. Ofis kirası ve genel müdürlük gibi genel giderler projelere **dağıtılmaz**; yalnızca şirket genelinde görünür (D-149).
- Kabul kriterleri:
  - [ ] Kâr-zarar günlük, aylık ve kümülatif izlenebilir.
  - [ ] Her tutar kaynağına kadar açılabilir (hangi kayıt, hangi gider).
  - [ ] Şirket geneli kâr-zarar = proje sonuçlarının toplamı − genel giderler, ayrı satırlarla gösterilir.
- Durum: CONFIRMED

## E. Cari hesap

### REQ-FIN-018 — Firma başına para birimi bazında tek net cari

- Kaynak: §22.6; D-027, D-033, D-034
- Öncelik: Must · Kademe: T1
- Açıklama: Her firmanın her para birimi için tek net yürüyen bakiyesi vardır; aynı firma hem işveren hem tedarikçiyse alacak ve borç netleşir. Her bakiye güncel TL karşılığıyla gösterilir (D-140).
- Kabul kriterleri:
  - [ ] Kur farkı, bakiyeden ayrı hesaplanır ve gösterilir.
- Durum: CONFIRMED

### REQ-FIN-019 — Cari hareketleri

- Kaynak: §22.6
- Öncelik: Must · Kademe: T1
- Açıklama: İşveren tarafında hakedişler alacağı artırır, tahsilatlar azaltır. Tedarikçi tarafında sipariş ve gider borcu artırır, ödeme azaltır. Taşeron hakedişi taşeron carisine borç yazar.
- Kabul kriterleri:
  - [ ] Cari kartında tarihli hareket dökümü, açıklama, artış/azalış, yürüyen bakiye, para birimi ve TL karşılığı görünür.
  - [ ] Cari hareketi elle silinmez; yanlış hareket ters kayıtla düzeltilir.
- Durum: CONFIRMED

## F. Finans ekranı ve nakit

### REQ-FIN-020 — Finans ana ekranı

- Kaynak: §22, §22.1
- Öncelik: Must · Kademe: T2
- Açıklama: Finans ekranı şu sorulara cevap verir: param nerede, kim bana ne kadar borçlu, ben kime ne kadar borçluyum, hangi proje kâr/zarar ediyor, bu ay ne kadar gelir/gider var, önümüzdeki haftalarda nakit yeterli mi. Öne çıkan göstergeler: nakit pozisyonu, açık hakediş/alacak, bu ay gelir, bu ay gider, şirket geneli kâr-zarar, toplam alacak, toplam borç, yakın nakit açığı.
- Kabul kriterleri:
  - [ ] Her gösterge, dökümüne inilerek açılabilir.
  - [ ] Ekran yalnızca ticari veri yetkisi olan kullanıcılara görünür.
- Durum: CONFIRMED

### REQ-FIN-021 — Haftalık nakit projeksiyonu

- Kaynak: §22.7
- Öncelik: Must · Kademe: T1
- Açıklama: Önümüzdeki haftalar (varsayılan 8 hafta; süre ayarlanabilir) için her hafta giriş, çıkış, net ve kümülatif nakit gösterilir. Girişler: beklenen hakediş tahsilatları, planlı diğer gelirler. Çıkışlar: bordro, açık siparişler, tedarikçi ödemeleri, kira ve sabit giderler, yaklaşan sözleşme/yasal ödemeler, planlı nakit kalemleri.
- Kabul kriterleri:
  - [ ] Planlı nakit kalemi (tek seferlik veya tekrarlayan) elle eklenebilir.
  - [ ] Her haftanın rakamı, onu oluşturan kalemlere açılabilir.
- Durum: CONFIRMED

### REQ-FIN-022 — Beklenen tahsil tarihi sözleşme vadesinden

- Kaynak: D-151
- Öncelik: Must · Kademe: T1
- Açıklama: Bir hakedişin beklenen tahsil tarihi, sözleşmede belirtilen başlangıca (işveren onayı veya fatura tarihi) sözleşmedeki ödeme vadesi eklenerek hesaplanır. Yetkili kişi tarihi gerekçeyle değiştirebilir.
- Kabul kriterleri:
  - [ ] Değiştirilen tarih, hesaplanan tarihle birlikte ve gerekçesiyle görünür.
  - [ ] Beklenen tarihi geçen ve tahsil edilmeyen hakediş gecikmiş olarak işaretlenir.
- Durum: CONFIRMED

### REQ-FIN-023 — Nakit açığı önceden uyarılır

- Kaynak: §22.7
- Öncelik: Must · Kademe: T1
- Açıklama: Kümülatif nakdin eşiğin altına düştüğü hafta önceden uyarılır; yönetim açığı hangi kalemlerin yarattığını görür. Eşik merkezi kuraldır (REQ-WFL-032).
- Kabul kriterleri:
  - [ ] Uyarı, açığın beklendiği haftayı ve en büyük çıkış kalemlerini gösterir.
- Durum: CONFIRMED

## G. Fatura ve ödeme

### REQ-FIN-024 — Muhasebe evrakı takibi

- Kaynak: §22.8
- Öncelik: Must · Kademe: T2
- Açıklama: Muhasebe birimi fatura, irsaliye, ödeme listesi, cari, avans, dekont, ödeme durumu ve diğer muhasebe evrakını panelden takip eder. Gelen fatura ilgili siparişe, teslim alıma veya gidere bağlanır.
- Kabul kriterleri:
  - [ ] Faturası gelmemiş teslim alımlar ve bağlanmamış faturalar listelenebilir.
- Durum: CONFIRMED

### REQ-FIN-025 — Ödeme onaysız tamamlanmaz

- Kaynak: §22.8
- Öncelik: Must · Kademe: T1
- Açıklama: Bir ödeme, yönetimin iş akışında tanımladığı onay verilmeden "ödendi" olamaz. Ödeme dekontla kapanır ve ilgili cariyi azaltır.
- Kabul kriterleri:
  - [ ] Onaysız ödeme için "ödendi" işlemi yoktur.
  - [ ] Ödemeyi hazırlayan kişi kendi ödemesini onaylayamaz (REQ-IAM, görev ayrılığı).
- Durum: CONFIRMED

## H. Resmi muhasebe

### REQ-FIN-026 — Muhasebeciye dışa aktarma ve mutabakat

- Kaynak: §22.9; D-153
- Öncelik: Must · Kademe: T2
- Açıklama: Panel resmi muhasebe programını taklit etmez; e-fatura, defter ve beyan muhasebeci/YMM tarafındadır. Panel her ay, muhasebecinin programının içeri alabildiği biçimde (ör. Excel) gelir, gider, fatura ve tahsilat/ödeme dosyası üretir. İki taraf karşılaştırıldıktan sonra sonuç panelde işaretlenir.
- Kabul kriterleri:
  - [ ] Dışa aktarılan her kayıt, hangi dosyayla ve ne zaman aktarıldığını taşır.
  - [ ] Mutabakatta bulunan fark gerekçesiyle kaydedilir ve kapanana kadar açık kalem olarak görünür.
- Durum: CONFIRMED

## I. Dönem kapanışı

### REQ-FIN-027 — Her şantiye kendi dönemini kapatır

- Kaynak: §22.10; D-154
- Öncelik: Must · Kademe: T1
- Açıklama: Dönem kapanışı kapanış birimi bazındadır: her şantiye kendi ayını hazır olunca kapatır. Fabrika ve genel (ofis) de kendi kapanış birimidir (D-154'ten türetilen kural, sahip onayladı). Şirket geneli ay, son birim de kapanınca kesinleşir.
- Kabul kriterleri:
  - [ ] Hangi birimin hangi ayı kapattığı ve hangilerinin beklediği tek listede görünür.
- Durum: CONFIRMED

### REQ-FIN-028 — Kapanış kontrol listesi

- Kaynak: §22.10; REQ-AUD-010
- Öncelik: Must · Kademe: T1
- Açıklama: Kapanıştan önce o birimin o aya ait açık işleri listelenir: onay bekleyen saha ve fabrika günlük kayıtları, onay bekleyen stok sayımları, sonuçlanmamış revizyon talepleri, hazırlanmamış hakediş veya bordro, eksik belge. Engelleyici kalem varsa dönem kapatılamaz ve neyin eksik olduğu gösterilir.
- Kabul kriterleri:
  - [ ] Engelleyici kalemi olan birimde "kapat" işlemi çalışmaz ve kalemler bağlantılarıyla listelenir.
  - [ ] Hangi kalem türlerinin engelleyici, hangilerinin uyarı olduğu merkezi olarak ayarlanır.
- Durum: CONFIRMED

### REQ-FIN-029 — Kapanan dönem kesinleşir ve kilitlenir

- Kaynak: §22.10; D-141
- Öncelik: Must · Kademe: T1
- Açıklama: Kapanan birimin o ayki raporları "kesinleşmiş" işaretlenir. Kapalı döneme ait değişiklik yalnızca revizyon talebiyle (REQ-AUD) veya yetkili kişinin gerekçeyle dönemi yeniden açmasıyla yapılır. Kapanışla birlikte geçici birim maliyetler kesinleşir (REQ-FAC-009, REQ-INV-022).
- Kabul kriterleri:
  - [ ] Kapalı döneme tarihli yeni kayıt doğrudan girilemez.
  - [ ] Yeniden açma gerekçesiz yapılamaz, sahiplere bildirilir ve denetim kaydına yazılır.
- Durum: CONFIRMED

### REQ-FIN-030 — Geciken kapanış için uyarı ve görev

- Kaynak: §22.10
- Öncelik: Must · Kademe: T2
- Açıklama: Ayın belirli gününe kadar (varsayılan ayın 10'u; ayarlanabilir) kapatılmayan birim için sorumlusuna uyarı ve görev oluşur.
- Kabul kriterleri:
  - [ ] Görev, birim kapanınca kendiliğinden kapanır.
- Durum: CONFIRMED

---

## Yetenek kataloğu — FIN

Biçim: `docs/requirements/README.md`.

### Olaylar

| Kod | Ad | Ne zaman | Taşıdığı alanlar | Veri sınıfı |
|---|---|---|---|---|
| `client_progress_payment.prepared` | Hakediş hazırlandı | Hakediş hazırlandığında | proje, dönem, brüt, net | ticari |
| `client_progress_payment.submitted` | Hakediş işverene sunuldu | Sunulduğunda | proje, dönem, net | ticari |
| `client_progress_payment.client_approved` | İşveren hakedişi onayladı | Onay girildiğinde | proje, dönem, onaylanan net, devreden miktar | ticari |
| `client_progress_payment.invoiced` | Hakediş faturalandı | Faturalandığında | proje, dönem, fatura | ticari |
| `collection.recorded` | Tahsilat girildi | Tahsilat kaydedildiğinde | firma, tutar, kalan alacak | ticari |
| `client_progress_payment.overdue` | Tahsilat gecikti | Beklenen tarih geçtiğinde | proje, dönem, gecikme günü, kalan | ticari |
| `subcontractor_progress_payment.prepared` | Taşeron hakedişi hazırlandı | Hazırlandığında | şantiye, taşeron, dönem, tutar | ticari |
| `payment.approved` | Ödeme onaylandı | Ödeme onaylandığında | firma, tutar | ticari |
| `payment.completed` | Ödeme yapıldı | Dekontla kapandığında | firma, tutar | ticari |
| `expense.possible_duplicate` | Olası tekrar gider | Tekrar şüphesi bulunduğunda | iki kayıt, fark | ticari |
| `cash_projection.shortfall_expected` | Nakit açığı bekleniyor | Kümülatif nakit eşiğin altına düştüğünde | hafta, beklenen açık | ticari |
| `period_close.closed` | Dönem kapandı | Bir birim ayı kapattığında | birim, ay | iç |
| `period_close.reopened` | Dönem yeniden açıldı | Yeniden açıldığında | birim, ay, açan, gerekçe | iç |
| `period_close.overdue` | Dönem kapanışı gecikti | Ayarlanan gün geçtiğinde | birim, ay | iç |

### Aksiyonlar

| Kod | Ad | Girdi | Gereken yetki | İki kez çalışırsa | Yarıda kalırsa |
|---|---|---|---|---|---|
| `client_progress_payment.create_draft` | Taslak hakediş hazırla | proje, dönem | akışın sistem yetkisi | Aynı proje ve dönem için açık hakediş varsa onu döndürür | Taslak açılmamış sayılır |
| `subcontractor_progress_payment.create_draft` | Taslak taşeron hakedişi hazırla | şantiye, taşeron, dönem | akışın sistem yetkisi | Aynı şantiye, taşeron ve dönem için açık hakediş varsa onu döndürür | Taslak açılmamış sayılır |

Akış ödeme yapamaz, tahsilat giremez ve dönem kapatamaz; bunları bir insan yapar.

### Koşul alanları

| Kod | Ad | Tip | Veri sınıfı |
|---|---|---|---|
| `client_progress_payment.net_amount` | Hakediş net tutarı | tutar | ticari |
| `client_progress_payment.days_outstanding` | Tahsil edilmeyen gün | sayı | ticari |
| `client_progress_payment.carried_over_months` | Devreden miktarın bekleme ayı | sayı | ticari |
| `payment.amount` | Ödeme tutarı | tutar | ticari |
| `party_account.balance_try` | Cari bakiye (TL karşılığı) | tutar | ticari |
| `cash_projection.lowest_cumulative` | Projeksiyondaki en düşük kümülatif nakit | tutar | ticari |
| `period_close.days_open` | Kapanmamış dönemin gün sayısı | sayı | iç |
