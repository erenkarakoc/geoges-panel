# GEOGES PANEL — EKSİKSİZ FONKSİYONEL ÖZELLİK VE PANEL YAPISI

> Bu belge, konuşmada şekillenen GEOGES Panel'in **yalnızca kullanıcıya görünen ve şirket işleyişini yöneten özelliklerini** içerir. Teknik mimari, yazılım teknolojileri, veri tabanı yapısı, kodlama yöntemi, sunucu, API ve benzeri teknik konular kapsam dışındadır.

---

# 1. Panelin temel çalışma anlayışı

GEOGES Panel, şirket içinde yapılan işlerin sözlü, dağınık, kişiye bağlı veya yalnızca WhatsApp/Excel üzerinden takip edilmesi yerine bütün süreçlerin tek merkezde kayıtlı, ölçülebilir, onaylı ve geriye dönük açıklanabilir şekilde yürütülmesini sağlamalıdır.

Panelin ana ilkesi şudur: **sistemde kaydı olmayan iş tamamlanmış sayılmaz.** Bir görev yapıldıysa kaydı, gerekiyorsa belgesi, fotoğrafı, saati, miktarı, sorumlusu ve onayı bulunmalıdır. Böylece “yaptım”, “söylemiştim”, “bana denmedi”, “ben bilmiyordum”, “o böyle söyledi” gibi sonradan doğrulanamayan açıklamalar yerine somut kayıt esas alınır.

Panel şirketin yalnızca saha takibi için değil; satıştan teklife, sözleşmeden projeye, saha üretiminden fabrikaya, stoktan ekipmana, personelden bordroya, hakedişten tahsilata, kalite ve İSG'den toplantı kararlarına kadar şirketin kurumsal hafızasını oluşturmalıdır.

Amaç, şirket sahibinin ofiste, sahada, fabrikada, evde veya seyahatte olmasından bağımsız olarak şirketin güncel durumunu aynı yerden görebilmesidir. Şirket sahibinin sürekli personele telefon açıp “hakediş ne oldu?”, “bu malzeme geldi mi?”, “neden iş gecikti?”, “niye bu şantiye zararda?”, “bu görevi kim yapacaktı?” diye sormasına gerek kalmamalıdır. Cevapların panelde bulunması hedeflenir.

Panel yalnızca geçmişi kaydeden bir sistem olmamalı; gecikmeleri, eksikleri, riskleri, atıl kaynakları, kârlılık sorunlarını ve yaklaşan yükümlülükleri fark edip ilgili kişileri harekete geçiren bir yönetim sistemi olmalıdır.

Panel şirketin **tek resmi kayıt ve arşiv sistemidir**. Drive, Excel veya WhatsApp gibi araçlar paralel kayıt yeri olarak kullanılmaz; bugün Drive'da tutulan evrak arşivi de panele taşınır. Şirketin bütün kayıtları panel üzerinde toplanır; iş verisi Excel, WhatsApp veya Drive gibi sistem dışı araçlarda tutulmaz. Panelin teknik altyapısında bulut servisleri ve dış veri kaynakları (örneğin TCMB kurları, hava durumu servisleri) kullanılabilir. Dış veri kaynaklarına erişilemediğinde panel son alınan değeri kullanır veya elle girişe izin verir; çalışmaya devam eder.

---

# 2. Kullanıcı, rol, hiyerarşi ve görünürlük sistemi

Her çalışan kendisine tanımlanan kullanıcı hesabıyla sisteme girer ve yalnızca göreviyle ilgili alanları görür. Şirket sahibi ise şirketin tümüne erişen en üst yönetim görünümüne sahip olur.

## 2.1. Dinamik rol yapısı

Panelde roller sabit bir organizasyon şemasına kilitlenmemelidir. Şirket büyüdükçe veya organizasyon değiştikçe yeni roller tanımlanabilmelidir. Örneğin ileride Genel Koordinatör, Genel Müdür Yardımcısı, Satış Sorumlusu, İSG Sorumlusu veya farklı bir yönetim pozisyonu eklenebilmelidir.

Her rol için:

- rol adı,
- organizasyon hiyerarşisindeki seviyesi,
- üst ve alt ilişkisi,
- görebileceği modüller,
- görebileceği bilgi türleri,
- veri girebileceği alanlar,
- onaylayabileceği işlemler,
- kendisine düşecek görev türleri,
- kritik konularda kime bağlı olduğu

tanımlanabilmelidir.

Rollerin sıralaması sonradan değiştirilebilmelidir. Bir rol üst veya alt seviyeye taşınabilmeli, organizasyon yapısı değiştiğinde panel buna uyarlanabilmelidir.

Rolün varsayılan yetkilerine ek olarak Sahip, gerektiğinde belirli bir kişi için tek tek modül veya ekran erişimini açıp kapatabilmelidir. Bu kişisel istisnalar kayıt altında tutulur ve toplu olarak listelenebilir.

## 2.2. Bir kişiye birden fazla rol verme

Bir çalışan aynı anda birden fazla görev üstlenebiliyorsa birden fazla rol atanabilmelidir. Örneğin bir kişi hem Şantiyeler Koordinatörü hem İş Geliştirme/Satış Destek rolünde olabilir.

Birden fazla rolü olan kullanıcı gerektiğinde hangi rol kapsamında işlem yaptığını seçebilmelidir. Tek rolü olan kullanıcıya gereksiz rol seçme alanı gösterilmemelidir.

## 2.3. Vekâleten ve süreli rol

Bir kişiye belirli süreyle vekâleten görev verilebilmelidir. Başlangıç ve bitiş tarihi girilir; bu süre boyunca ilgili yetkileri kullanır. Süre sona erdiğinde geçici görev kendiliğinden sona erer.

Böylece yıllık izin, hastalık, işten ayrılma, geçici görevlendirme veya yeni personel gelene kadar vekâlet gibi durumlar sistemden yönetilebilir.

## 2.4. Sahip katmanı

Şirket sahibinin görünürlüğü Genel Müdür veya başka bir yönetici tarafından sınırlandırılamaz. Genel Müdür şirketi yönetebilir fakat şirket sahibinden veri gizleyemez.

Sahip rolü:

- tüm şirket verisini görebilir,
- tüm kritik uyarıları görür,
- Genel Müdür dahil herkesin işlem geçmişini denetleyebilir,
- gerekli gördüğü görünürlükleri açıp kapatabilir,
- istisnai işlemlere özel izin verebilir,
- onay zincirlerini değiştirebilir,
- kimin hangi rol ve yetkiye sahip olduğunu yönetebilir.

Bu yapı, şirket bir gün profesyonel bir Genel Müdüre devredilse bile şirket sahibinin şirketi uzaktan ve eksiksiz denetleyebilmesini sağlamalıdır.

## 2.5. Ticari ve hassas bilgilerin ayrılması

Her kullanıcının her şeyi görmesi gerekmemelidir.

Örneğin saha mühendisi veya formen:

- kendi şantiyesinin üretimini,
- hedefini,
- stok ihtiyacını,
- görevlerini,
- operasyonel performansını

görebilir; ancak şirketin kâr marjını, teklif fiyatlarını, personel maaşlarını veya ticari maliyet detaylarını görmemelidir.

Benzer şekilde bir İSG sorumlusu bir kazadaki çalışanın adını görebilmeli fakat o çalışanın maaşını, SGK numarasını veya IBAN'ını görememelidir.

Taşeron veya götürü çalışan ekip başı yalnızca kendi çalışmasıyla ilgili operasyonel bilgileri görmeli; maaş, SGK ve şirketin ticari verilerini görmemelidir.

## 2.6. Görev ayrılığı

Panel, kritik işlerde aynı kişinin hazırladığı işlemi yine kendisinin onaylamasını engelleyebilecek kurallara sahip olmalıdır. Örneğin ödeme hazırlayan kişinin aynı ödemeyi tek başına onaylamaması sağlanabilmelidir.

## 2.7. Rol atandığında otomatik yönlendirme

Bir kişiye yeni rol atandığında şirket sahibinin veya yöneticinin ayrıca telefon açıp ne yapacağını anlatması gerekmemelidir.

Panel kullanıcıya:

- yeni rolünün ne olduğunu,
- temel sorumluluklarını,
- ilk yapması gereken işleri,
- hangi ekranları kullanacağını,
- zorunlu görevlerini

göstermelidir.

Kullanıcı “Ben bunu nasıl yapacağım?” diye sormadan sistem tarafından adım adım yönlendirilmelidir.

## 2.8. Hesap güvenliği ve erişimin kapatılması

- Sahip, Genel Müdür ve ticari/hassas veriye erişen roller için iki adımlı giriş zorunlu tutulabilmelidir.
- Kullanıcı kendi parolasını değiştirebilmeli; yetkili yönetici parola sıfırlama başlatabilmelidir.
- Personel işten ayrıldığında veya hesabı pasife alındığında erişimi anında kapanmalı, açık oturumları sonlandırılmalıdır.
- Ardışık hatalı giriş denemelerinde hesap geçici olarak kilitlenmelidir.
- Kimin ne zaman giriş yaptığı ve hangi kayıtları değiştirdiği denetim kayıtları ekranında görülebilmelidir.

---

# 3. Sahip / Genel Yönetim Cockpit'i

Şirket sahibi giriş yaptığında ilk ekran şirketin tamamını tek bakışta okuyabildiği bir yönetim cockpit'i olmalıdır.

Ana mantık: **önce özet, sonra tıklayıp derine inme.**

## 3.1. Üst yönetim göstergeleri

Açılış ekranında en kritik göstergeler yer almalıdır. Bunlar zamanla özelleştirilebilir; konuşmada öne çıkan göstergeler şunlardır:

- aktif şantiye sayısı,
- bugün/dün yapılan üretim,
- bu ayki toplam üretim,
- şirket geneli aylık kâr-zarar,
- nakit pozisyonu,
- toplam açık alacak,
- bekleyen onay sayısı,
- geciken görev sayısı,
- dikkat gerektiren kritik uyarı sayısı,
- kritik stok sayısı,
- açık İSG olayı,
- süresi yaklaşan kalite/uyum belgesi,
- açık teklifler ve kazanma oranı,
- personel hareketleri,
- açık/geciken toplantı kararları.

## 3.2. Şantiye kartları / şantiye tablosu

Her aktif şantiye için ana ekranda kısa bir özet bulunmalıdır:

- proje ve şantiye adı,
- günlük üretim,
- toplam ilerleme yüzdesi,
- hedefe göre durum,
- son veri giriş zamanı,
- son kaydın onay durumu,
- gerekiyorsa çift döküm bilgisi,
- kümülatif kâr-zarar,
- gecikme veya bekleme sinyali,
- zayi/fire sinyali,
- kritik stok veya ekipman ihtiyacı.

Şantiye satırına veya kartına tıklanınca ayrıntılı şantiye ekranına girilir.

## 3.3. “Dikkat” bölümü

Kritik olaylar yöneticiler tarafından aşağıda bırakılmamalı veya gizlenememelidir. Cockpit'te ayrı bir “Dikkat” bölümü bulunur.

Bu bölüme örneğin şu durumlar çıkar:

- proje hedefinden fazla panel dökülmesi,
- fazla üretimin gizlenmeye çalışılması,
- zayi oranının yükselmesi,
- fotoğrafsız veya açıklamasız zayi giriş girişimi,
- geciken saha onayı,
- uzun süre veri girilmeyen şantiye,
- işveren dolgusunun gecikmesi,
- olağan dışı sarfiyat veya kalıp yağı tüketimi,
- kritik stok,
- uzun süre atıl kalan vinç/makine/araç,
- bakım veya periyodik kontrolü geciken ekipman,
- geciken hakediş veya tahsilat,
- negatif/tehlikeli nakit pozisyonu,
- yaklaşan sözleşme cezası,
- süresi dolan sertifika veya eğitim,
- açık ciddi İSG olayı,
- geciken toplantı kararı,
- kapanmayan kritik görev.

Her uyarı tıklanarak kaynağına gidilebilmelidir.

## 3.4. “Şirketi sistem gözünden gör” ekranı

Şirket sahibi ayrıca şirketi kişisel duygu ve ilişkilerden bağımsız, tamamen veriye göre okuyabileceği bir değerlendirme ekranına sahip olmalıdır.

Zaman aralığı seçilebilir:

- bugün,
- bu hafta,
- son 15 gün,
- bu ay.

Ekran şu soruların cevaplarını verir:

- şirket şu an iyi mi kötü mü gidiyor,
- hangi proje hedefin gerisinde,
- hangi şantiye verimsiz,
- nerede bekleme var,
- hangi gider olağan dışı yükseldi,
- hangi stok kritik,
- hangi kaynak atıl,
- hangi alacak gecikti,
- hangi yükümlülük yaklaşmakta,
- hangi görev yapılmamış,
- yönetimin bugün neye müdahale etmesi gerekiyor.

---

# 4. Onay Merkezi ve yönetici müdahalesi

Panelde tek bir “Onay Merkezi” bulunmalıdır. Kullanıcının yetkisine göre bekleyen onayları burada toplu olarak görebilmesi hedeflenir.

Onay konuları arasında:

- günlük saha kayıtları,
- fabrika günlük kayıtları,
- malzeme çıkış/sevkiyat talepleri,
- kritik veya yüksek tutarlı harcamalar,
- hakediş adımları,
- fatura kesme onayı,
- ödeme onayı,
- bordro onayı,
- prim onayı,
- yan gelir/dış iş kayıtları,
- özel manuel düzeltme izinleri,
- revizyon talepleri,
- stok sayımları,
- satın alma talepleri

yer alabilir.

Her onayda:

- işlemin özeti,
- ilgili proje/birim,
- sorumlu kişi,
- miktar/tutar,
- varsa belge/fotoğraf,
- kontrol edilmesi gereken tutarsızlıklar,
- “Onayla”, “Düzeltme iste” ve gerektiğinde “Reddet” eylemleri

görülmelidir.

Düzeltme istenirse eksik veya hatalı konu açık şekilde yazılır; kayıt ilgili kişiye geri döner ve kullanıcı neyi düzeltmesi gerektiğini görür.

---

# 5. Talep, iletişim, müşteri ve satış takibi

Şirket merkezine gelen hiçbir potansiyel iş, teklif talebi veya müşteri iletişimi kişilerin hafızasında kalmamalıdır.

## 5.1. Talep ve iletişim günlüğü

Şirkete ulaşan temaslar kayıt altına alınmalıdır:

- şirket bilgi e-postasına gelen talepler,
- telefonla gelen talepler,
- WhatsApp üzerinden gelen iş talepleri,
- personelin kendisinin bulduğu yeni işler,
- kurum/ana firma görüşmeleri,
- mevcut müşteri takip görüşmeleri.

E-posta ile gelen teklif talebi doğrudan yeni bir talep/fırsat olarak açılabilir. Telefon veya WhatsApp görüşmesi için hızlı bir kayıt ekranı olmalıdır.

Telefon görüşmesinin sesini kaydetmek zorunlu değildir; esas olan:

- kim aradı,
- hangi firma,
- ne istedi,
- kim ilgilenecek,
- ne zamana kadar dönüş yapılacak,
- dönüş yapıldı mı,
- sonuç ne oldu

bilgisinin kaybolmamasıdır.

## 5.2. Cevapsız talep takibi

Bir talep belirli sürede cevaplanmazsa sistem ilgili kişiye hatırlatma yapmalı; gecikmeye devam ederse üst yönetime taşımalıdır.

Şirket sahibi cockpit'te örneğin “2 gündür cevaplanmamış teklif talebi” görebilmeli ve tıklayarak kime atanmış olduğunu, neden ilerlemediğini görebilmelidir.

## 5.3. İşveren / müşteri kartı

Her işveren için kurumsal bir kart oluşturulmalıdır. Zaman içinde bu kart bir işveren karnesine dönüşmelidir.

Takip edilebilecek bilgiler:

- geçmiş ve devam eden projeler,
- verilen teklifler,
- kazanılan/kaybedilen işler,
- ödeme ve tahsilat geçmişi,
- ortalama ödeme hızı,
- hakediş onay gecikmeleri,
- saha teslim/dolgu/beton/demir gecikmeleri,
- sözleşme kaynaklı problemler,
- geçmiş işlerin gerçek kârlılığı,
- uyuşmazlık veya kesinti geçmişi.

Bu karne ileride yeni fiyat verirken “bu işveren geç ödüyor”, “bu işveren sahayı sık bekletiyor” gibi ticari riskleri fiyat ve şartlara yansıtmayı desteklemelidir.

## 5.4. İhale takibi

İhale ve yeni iş fırsatları için son tarih takibi yapılabilmelidir. Kaçırılan ihale veya zamanında hazırlanmayan teklif, ilgili satış/teknik ofis performansına yansıyabilmelidir.

---

# 6. Teklif ve maliyet geri besleme modülü

Teklif modülü yalnızca fiyat yazılan bir belge olmamalı; teklif aşamasında tahmini kârlılığı göstermeli ve iş bittikten sonra tahminin ne kadar doğru olduğunu geri beslemelidir.

## 6.1. Teklif kartı

Teklifte şu bilgiler tutulabilmelidir:

- potansiyel işveren,
- iş/proje başlığı,
- iş kapsamı,
- panel işleri,
- çelik şerit,
- lug,
- harpuşta,
- gabion,
- geosentetik,
- oto/yaya korkuluk veya diğer kalemler,
- miktar ve birimler,
- birim fiyatlar,
- farklı para birimleri,
- teklif toplamı,
- teklif geçerlilik tarihi,
- özel ticari şartlar,
- işverenin talep ettiği sertifikalar,
- teklif dokümanı,
- teklif durumu.

Durumlar örneğin:

**Hazırlanıyor → Gönderildi → Görüşme/Pazarlık → Kazanıldı / Kaybedildi / İptal**

şeklinde izlenebilir.

## 6.2. Yaklaşık proje verisinden fiyat oluşturma

Teklif öncesinde boykesit, enkesit ve plan incelenerek çıkarılan yaklaşık proje miktarları kaydedilebilmelidir. Teklif oluşturulurken şehir, kurum, bölge, piyasa koşulları, işveren dinamiği ve proje şartları dikkate alınarak birim fiyatlar girilebilir.

## 6.3. “Bu fiyata işi alırsam ne kazanırım?” hesabı

Her teklif kaleminde tahmini maliyet ile satış fiyatı karşılaştırılmalı; teklifin:

- tahmini toplam maliyeti,
- tahmini kârı,
- tahmini kâr marjı

gösterilmelidir.

Tahmini maliyete ilgili olduğu ölçüde:

- malzeme,
- fabrika işleme maliyeti,
- saha işçiliği,
- taşeron işçilik,
- ekipman,
- yemek/konaklama,
- nakliye,
- genel gider payı

dahil edilebilir.

## 6.4. Hedef marja göre fiyat önerisi

Yetkili kullanıcı örneğin “Bu işte en az %25 marj istiyorum” diyebilmeli; panel tahmini maliyetten hareketle önerilen satış fiyatını gösterebilmelidir.

## 6.5. Çoklu para birimi

Aynı teklif içerisinde farklı para birimleri bulunabilmelidir. Örneğin panel TL/m², çelik şerit USD/metre olabilir.

Karşılaştırma yapılırken TL karşılığı gösterilebilir; ancak teklifin kendi para birimi bilgisi korunur.

Kur için varsayılan değer önceki iş gününün TCMB kurundan alınabilir; yetkili kullanıcı gerekli özel durumda manuel kur girebilir.

## 6.6. Tekliften projeye geçiş

Teklif kazanıldığında aynı iş tekrar sıfırdan girilmemeli; kazanılan teklif mevcut bir projeye bağlanabilmeli veya yeni projenin başlangıç bilgisini oluşturabilmelidir.

## 6.7. Maliyet geri beslemesi

İş ilerledikçe ve özellikle iş tamamlandığında teklif aşamasındaki tahmini maliyet ile gerçekleşen maliyet karşılaştırılmalıdır.

Panel şu bilgileri gösterebilir:

- tahmini maliyet,
- gerçekleşen maliyet,
- sapma tutarı,
- sapma yüzdesi,
- teklif ne kadar isabetliydi,
- maliyet neden aşıldı,
- gelecek teklifler için “ders/not”.

Bu sayede teklif fiyatlandırması zamanla şirketin gerçek verisine dayanır.

## 6.8. Teklif belgesi üretimi

Teklif kaydından kurumsal görünümlü teklif belgesi (PDF) panel içinde üretilebilmelidir; teklif ayrıca Word'de yeniden yazılmamalıdır.

Şablonlar iki gruptur:

- **Uygulama teklifleri:** Toprakarme duvar, Gabion duvar, Otokorkuluk sistemi, Çelik ağ şev koruması,
- **Ürün teklifleri:** Geonet (drenaj ağı), Geogrid, Çelik şerit, Geomembran (HDPE), Geocell.

Belgede:

- kapak ve logo,
- muhatap firma ve kişi,
- proje adı,
- teklif tarihi ve numarası,
- iş tanımı ve kapsam maddeleri,
- kalem tablosu (tanım, birim, miktar, birim fiyat, para birimi),
- ticari şartlar (yemek/konaklama kimde, ödeme, geçerlilik vb.),
- imzalayan kişi

bulunur.

Sabit metinler şablondan, değişken bilgiler teklif kaydından gelir. Yeni şablon veya ürün grubu eklenebilmeli, şablon metinleri yetkili kullanıcı tarafından güncellenebilmelidir. Üretilen belge teklif kaydına otomatik eklenir; gönderilen her sürüm saklanır.

## 6.9. Ürün satışı işleri

Şirket yalnız şantiyeli uygulama işi değil, şantiyesi olmayan malzeme satışı da yapar (geogrid, geomembran, çelik şerit vb.).

Kazanılan ürün teklifi proje/şantiye açılmadan satış siparişine dönüşebilmelidir:

**Teklif → Satış siparişi → Tedarik/üretim → Müşteriye sevk → Fatura → Tahsilat**

Satış siparişinde müşteri, kalemler, fiyat, para birimi, teslim şekli ve tarihi, sevk irsaliyesi ve teslim/kantar belgeleri tutulur. Stoktan veya doğrudan tedarikçiden müşteriye sevk desteklenir. Maliyet ve kâr sipariş bazında, teklif geri beslemesiyle aynı mantıkla izlenir.

---

# 7. Proje kartı ve proje yaşam döngüsü

Bir proje tek bir şantiyeden oluşabileceği gibi birden fazla şantiyeye de bölünebilir. Panel bunu doğal şekilde desteklemelidir.

## 7.1. Proje kartı

Her proje için aşağıdaki bilgiler tutulabilir:

- proje adı,
- işveren/ana firma,
- kurum/idare,
- şehir ve lokasyon,
- sözleşme bilgileri,
- sözleşme bedeli ve para birimi,
- başlangıç ve hedef bitiş tarihi,
- sözleşmedeki son bitiş tarihi,
- toplam hedef metraj,
- panel tipleri ve hedef adetleri,
- şerit tipleri ve hedef metrajları,
- diğer iş kalemleri,
- duvarlar ve duvar bazlı hedefler,
- projenin sorumlu koordinatörü,
- şantiye veya şantiyeleri,
- iş modeli,
- teknik ofis durumu,
- kurum onay durumu,
- hakediş durumu,
- sözleşme yükümlülükleri,
- proje dokümanları.

## 7.2. Proje aşamaları

Proje genel olarak şu akışta izlenebilir:

1. Talep / fırsat,
2. Ön inceleme ve yaklaşık miktar,
3. Teklif,
4. Görüşme / pazarlık,
5. Sözleşme,
6. Teknik proje / statik hesap / kurum onayı,
7. Mobilizasyon ve saha kurulumu,
8. Uygulama / üretim,
9. Aylık hakedişler ve ara teslimler,
10. Tamamlama,
11. Kesin kabul / kapanış,
12. Teminat ve kapanış yükümlülüklerinin tamamlanması.

## 7.3. Proje tedarik/sorumluluk matrisi

Her projenin sözleşme şartları farklı olabileceği için “kim neyi karşılıyor?” bilgisi proje bazında tutulmalıdır.

Örneğin:

- beton işverende mi GEOGES'te mi,
- demir işverende mi GEOGES'te mi,
- dolgu temini/serme/sıkıştırma kimde,
- yemek kimde,
- konaklama kimde,
- işveren karşılayıp GEOGES hakedişinden mi kesiyor,
- kamp/konteyner maliyeti kimde,
- nakliye kimde,
- vinç ve operatör kimde,
- kalıp/demirbaş kimde,
- çelik şerit ve sarf kimde.

Bu matris maliyet ve kâr-zarar hesabının temel girdilerinden biridir.

## 7.4. Teknik ofis takibi

Proje altında teknik ofisin sorumlulukları izlenebilmelidir:

- proje çizimi,
- revizyonlar,
- statik hesap,
- metraj,
- kurum onay süreci,
- hakediş hazırlık desteği,
- teknik evraklar,
- teslim tarihleri,
- geciken teknik işler.

Teknik ofisin yaptığı işlerin teslim süresi ve hata/revizyon sayısı performans değerlendirmesinde kullanılabilir.

## 7.5. Proje yapısı: duvarlar

Bir proje birden fazla duvardan oluşur (örneğin “Kötekli Duvar 1 Sağ”). Duvarlar proje altında tanımlanır ve ilgili şantiyeye bağlanır.

Her duvar için:

- duvar adı/kodu,
- panel tipi başına hedef adet (duvar × panel tipi matrisi),
- şerit tipi ve boyuna göre hedef metraj,
- varsa diğer iş kalemlerinin hedefleri,
- durum (başlamadı / devam ediyor / tamamlandı)

tutulur.

Proje toplam hedefleri duvar hedeflerinin toplamından oluşur. Panel dökümü duvardan bağımsız, panel tipine göre izlenir; montaj ve şerit kayıtları ise ilgili duvara bağlanır. İlerleme proje, şantiye ve duvar bazında ayrı ayrı görülür. Böylece “hangi duvar ne durumda, hangi duvarda şerit eksik kaldı?” sorusu cevaplanır ve günlük rapordaki duvar bazlı özetler bu yapıdan üretilir.

---

# 8. İş programı, günlük hedefler ve hızlandırma senaryoları

Her proje yalnızca “bitmiş yüzde” ile değil; süre, hedef ve kaynak ilişkisiyle yönetilmelidir.

## 8.1. Üç farklı süre

Panelde birbirinden ayrı görülebilmelidir:

- **Sözleşme süresi / sözleşme bitiş tarihi:** İşverene karşı resmi süre.
- **Normal teorik süre:** Mevcut ekip ve kaynaklarla teknik olarak beklenen süre.
- **Yönetim hedef süresi:** Şirket yönetiminin daha hızlı tamamlamak için koyduğu iç hedef.

## 8.2. Günlük üretim hedefleri

Seçilen hedef süreye göre şantiyeye günlük üretim hedefleri verilebilmelidir:

- günlük panel döküm adedi/m²,
- günlük panel montaj adedi/m²,
- günlük şerit montaj metresi,
- diğer iş kalemlerinin günlük hedefleri.

Gerçekleşen üretim hedefle karşılaştırılır.

## 8.3. Hızlandırma / süre-maliyet analizi

Panel farklı senaryoları karşılaştırabilmelidir. Örneğin:

- mevcut ekipmanla devam,
- ikinci vinç ekleme,
- ek personel ekleme,
- çift döküm düzenine geçme,
- paralel ekip kurma,
- belirli bir prim havuzu koyma.

Her senaryoda şu etkiler hesaplanabilmelidir:

- tahmini yeni bitiş tarihi,
- ek ekipman maliyeti,
- ek personel maliyeti,
- prim maliyeti,
- daha erken bitişten kurtarılan maaş/SGK/yemek/konaklama,
- daha erken boşalan vinç/kalıp/makine değeri,
- kaynakların yeni işe aktarılma fırsatı,
- net kârlılık etkisi.

Panel **en hızlı senaryoyu değil, en kârlı ve uygulanabilir senaryoyu** önermelidir.

## 8.4. Kalite ve İSG sınırı

Hızlandırma hiçbir zaman kalite ve iş güvenliği pahasına önerilmemelidir. Güvenli veya gerçekçi olmayan aşırı hız senaryoları “önerilmez” olarak işaretlenmelidir.

Seçilen senaryo günlük hedeflere, görev sistemine ve prim sistemine bağlanmalıdır.

---

# 9. Şantiye / saha modülü

Şantiye modülü panelin en yoğun kullanılan operasyon ekranlarından biridir.

## 9.1. Şantiye genel ekranı

Şantiye için görülebilecek ana bilgiler:

- bağlı olduğu proje,
- sorumlu koordinatör,
- saha mühendisi,
- ekip/iş modeli,
- güncel ilerleme,
- hedefe kalan miktar,
- günlük üretim,
- son kayıt zamanı,
- stok durumu,
- ekipman durumu,
- bekleyen onay,
- işveren beklemesi,
- zayi/fire,
- ticari yetkisi olan kullanıcı için gelir/gider/kâr-zarar.

## 9.2. Günlük saha kaydının sorumlusu

Varsayılan giriş zinciri konuşmada şu şekilde netleştirilmiştir:

**Saha mühendisi → Koordinatör → Teknik Ofis → İK**

Ancak bu sıra yönetim tarafından değiştirilebilir. Gerekirse belirli bir şantiye veya dönemde başka bir role veri giriş görevi atanabilir.

Formen/ekip başına da ihtiyaç halinde sınırlı veri giriş yetkisi verilebilir; ancak varsayılan iş akışı yönetim tarafından belirlenir.

## 9.3. Günlük tek ana kayıt

Her şantiye için her gün bir ana günlük kayıt bulunur. Aynı gün içerisindeki birden fazla döküm, montaj veya faaliyet bu ana kayıt içerisinde ayrı satırlar/oturumlar olarak tutulabilir.

Bu günlük kaydın tek yerde girilmesiyle aynı veri farklı modülleri besler:

- iş ilerlemesi,
- hakediş,
- stok tüketimi,
- puantaj,
- performans,
- kâr-zarar,
- bekleme analizi,
- işveren gecikme kanıtı.

## 9.4. Günlük kaydın ana bölümleri

Günlük kayıt aşağıdaki bölümleri içerir:

- şantiye,
- tarih,
- hava,
- döküm,
- montaj,
- çelik şerit montajı,
- harpuşta veya diğer proje iş kalemleri,
- işveren teslim-tesellüm,
- puantaj / ekip,
- faaliyet saatleri,
- tüketilen malzemeler,
- zayi,
- saha harcamaları,
- notlar,
- fotoğraflar.

## 9.5. Akıllı başlangıç bilgileri

Günlük kayıt açıldığında kullanıcıya mümkün olduğunca az manuel iş bırakılmalıdır:

- yetkili olduğu şantiye,
- bugünün tarihi,
- hava bilgisi

hazır gelebilir ve gerektiğinde düzenlenebilir.

## 9.6. Otomatik taslak kaydı

Kullanıcının telefonu kapanırsa veya ekrandan çıkarsa yaptığı girişler kaybolmamalıdır. Form sürekli taslak olarak kaydedilmelidir.

Kullanıcı tamamladığında “Koordinatör onayına gönder” benzeri tek bir ana eylemle kaydı onaya yollar. Gönderilen kayıt onay süreci tamamlanana veya düzeltme istenene kadar kontrolsüz biçimde değiştirilmemelidir.

---

# 10. Panel döküm takibi

**Panel dökümü her zaman sahada yapılır. Fabrika panel döküm yeri değildir.** Fabrika çelik şerit, lug ve diğer metal/ekipman işlemlerini yürütür; panel döküm üretimi saha modülünde takip edilir.

## 10.1. Panel tipleri

Panel tipleri merkezi tanımlardan gelir. Kullanıcı sahada m² değerini elle yazmaz.

Her panel tipi için:

- adı/kodu,
- en,
- boy,
- bir panelin m²'si,
- gerektiğinde kademe/komşu panel ilişkisi

tanımlanabilir.

## 10.2. Proje hedefleri

Her projede panel tipi bazında hedef adet tanımlanır. Örneğin C4, C5, C6, C7, C8 gibi tiplerin proje ihtiyacı ayrı ayrı tutulur. Hedefler duvar bazında tanımlandığında proje hedefi duvarların toplamıdır (bkz. 7.5).

## 10.3. Günlük döküm tablosu

Döküm ekranı klasik uzun form yerine hızlı tablo mantığında çalışmalıdır. Her panel tipi bir satırdır.

Önerilen bilgiler:

- Panel tipi,
- Boyut,
- m²/adet,
- Proje hedef adedi,
- Proje hedef m²,
- Bugüne kadar dökülen,
- Kalan,
- İlerleme %,
- Bugün dökülen adet.

“Bugün” alanı kullanıcının en çok dokunduğu, vurgulu giriş alanıdır.

Altta gün toplamı:

- toplam adet,
- toplam m²

olarak anlık gösterilir.

## 10.4. Çift döküm

Hava sıcaklığı veya ısıtma kullanımı sayesinde aynı gün ikinci döküm yapılabiliyorsa günlük kayda birden fazla döküm seansı eklenebilmelidir.

Her döküm için:

- panel tipi,
- adet,
- başlangıç saati,
- bitiş saati,
- ısıtma kullanıldı mı

kaydı tutulabilir.

Çift döküm ayrıca performans ve kapasite analizinde görünür olmalıdır. Amaç personeli kontrolsüz hızlandırmak değil; uygun şartlarda kalıp kapasitesinin daha verimli kullanılmasını teşvik etmektir.

## 10.5. Kurum onayı öncesi döküm

Bazı projelerde kurum onayı beklenmeden işverenin talebiyle standart panel tipleri dökülebilir. Bu üretimler “onay öncesi üretim” olarak kayıt altına alınmalıdır.

Onaylı proje geldiğinde sistem onay öncesi dökülen panel adetlerini gerçek proje ihtiyacıyla karşılaştırmalıdır.

## 10.6. Fazla döküm uyarısı

Onaylı proje miktarından fazla panel dökülürse bu durum gizlenemeyen bir uyarı olmalıdır.

Uyarı:

- ilgili saha mühendisine,
- koordinatöre,
- şirket sahibine

yansıtılmalıdır.

Koordinatörün uyarıyı kapatarak sahibinden gizleyememesi gerekir.

## 10.7. Fazla panelin değerlendirilmesi

Bir panel tipinde fazla üretim oluştuğunda, teknik uygunluk ve kalan proje ihtiyacı elveriyorsa panelin komşu tiplerde kullanılabilmesi için öneri üretilebilir.

Örnek yaklaşım:

1. önce bir alt / bir üst panel tipi,
2. uygun değilse iki alt / iki üst tip

kontrol edilir.

Bu yalnızca öneri olmalı; teknik uygunluk yetkili teknik personel tarafından onaylanmalıdır.

## 10.8. Zayi panel

Zayi panel kaydı için:

- panel tipi,
- adet,
- neden,
- fotoğraf

zorunlu tutulmalıdır.

Fotoğrafsız zayi tamamlanmış sayılmamalıdır. Böylece proje sonunda işveren “neden fazla panel döktünüz?” veya “bu paneller neden kullanılamadı?” dediğinde geçmiş kayıt hazır olur.

---

# 11. Montaj, çelik şerit ve işveren teslim-tesellüm takibi

## 11.1. Panel montajı

Panel montajı için:

- duvar,
- panel tipi,
- adet,
- m²,
- başlangıç saati,
- bitiş saati

tutulur.

Saatlerden otomatik olarak:

- panel/saat,
- m²/saat

gibi hız göstergeleri çıkarılabilir.

Bu veri farklı formen, ekip veya taşeronların gerçek hızını karşılaştırmak için kullanılabilir.

## 11.2. Çelik şerit montajı

Şeritler tipine göre tanımlanır; örneğin 40×4, 50×4, 50×5 gibi. Şerit tipi tanımında genişlik, kalınlık, delik sayısı ve standart boylar bulunur.

Takipte:

- duvar,
- şerit tipi,
- şerit boyu,
- adet,
- toplam metre,
- başlangıç/bitiş saati

kullanılır.

Toplam metre boy × adet üzerinden otomatik hesaplanır.

## 11.3. Harpuşta ve diğer imalatlar

Harpuşta döküm ve montajı adet veya metre olarak izlenebilir. Aynı yapı başka proje kalemlerine de uygulanabilir.

## 11.4. İşveren teslim-tesellüm saatleri

Toprakarme montajındaki tekrar eden döngü saat saat kayıt altına alınmalıdır.

Örneğin:

1. GEOGES panel montajını tamamlar.
2. Alan dolgu için işverene teslim edilir.
3. İşveren dolgu serme/sıkıştırmayı lug seviyesine getirir.
4. Alan GEOGES'e geri teslim edilir.
5. Çelik şerit serilir ve luglara bağlanır.
6. Alan tekrar dolgu için işverene teslim edilir.

Panelde özellikle şu zamanlar tutulmalıdır:

- montaj başlangıç/bitiş,
- dolguya teslim saati,
- dolgudan geri alınma saati,
- şerit başlangıç/bitiş,
- beton talep/teslim saatleri,
- demir teslim saatleri.

Böylece “biz mi yavaştık, işveren mi bekletti?” sorusu veriye göre cevaplanır.

## 11.5. İşveren kaynaklı bekleme analizi

Teslim-tesellüm zamanlarından işveren kaynaklı bekleme süresi çıkarılmalı; şantiye kâr-zararına etkisi tahmini olarak gösterilebilmelidir.

Örneğin dolgu 14 saat gecikmişse:

- kaç ekip/kişi bekledi,
- ekipman boşta kaldı mı,
- bu beklemenin tahmini maliyeti ne,
- proje süresine etkisi ne

görülebilir.

---

# 12. Puantaj ve faaliyet süresi ayrımı

Panelde iki farklı zaman kavramı birbirinden ayrılmalıdır.

## 12.1. Bordro puantajı

Bu kayıt çalışanın maaş ve SGK hesapları için kullanılır:

- hangi gün çalıştı,
- kaç saat/gün çalıştı,
- izin/devamsızlık durumu.

Öz kaynak personel için geçerlidir.

## 12.2. Faaliyet saatleri

Bu kayıt performans ölçümü içindir ve taşeron dahil tüm şantiyelerde kullanılır:

- döküm kaçta başladı/bitti,
- montaj kaçta başladı/bitti,
- şerit ne kadar sürdü,
- işveren dolgu ne kadar sürdü.

Taşeronun bordrosu GEOGES'e ait olmasa bile faaliyet süresi kayıt altına alınır; böylece işçilik verimliliği kıyaslanabilir.

---

# 13. Saha kaydı onay ve düzeltme akışı

Günlük saha kaydı tamamlandığında koordinatör onayına gider.

Koordinatör onay ekranında en az şu kontrolleri görmelidir:

- üretim miktarları,
- başlangıç/bitiş saatleri,
- işveren teslim-tesellüm saatleri,
- panel hedefi ile günlük/kümülatif üretim farkı,
- fazla döküm,
- zayi ve zorunlu fotoğraflar,
- malzeme tüketiminin üretimle uyumu,
- puantaj/ekip bilgisi,
- saha harcamaları,
- eksik zorunlu alanlar.

Koordinatör:

- onaylayabilir,
- açıklama yazarak düzeltme isteyebilir.

Düzeltme istenen kayıt ilgili kişiye bildirim olarak döner. Kimin ne zaman gönderdiği, neden geri çevrildiği, hangi düzeltmenin yapıldığı ve yeniden ne zaman gönderildiği görülebilmelidir.

Onaylanan günlük veri sonrasında:

- şantiye ilerlemesine,
- stok tüketimine,
- hakediş hesabına,
- taşeron hakedişine,
- puantaja,
- performans değerlendirmesine,
- kâr-zarara,
- yönetim cockpit'ine

yansır.

---

# 14. Şantiye detay ekranı ve “Niye zarardayız?” analizi

Her şantiyenin bir ayrıntı ekranı olmalıdır.

## 14.1. Üst göstergeler

- toplam ilerleme %,
- günlük/kümülatif döküm,
- günlük/kümülatif montaj,
- kalan iş,
- hedefe göre durum,
- ticari yetkili kullanıcı için gelir,
- gider,
- kâr-zarar.

## 14.2. “Niye zarardayız?” tanı kartı

Bir şantiye zarar ediyorsa yalnızca kırmızı eksi rakam göstermek yeterli değildir. Panel olası nedenleri ayırmalıdır.

Örneğin:

- işveren dolgu beklemesi,
- yüksek zayi,
- hedefin altında ilerleme,
- yüksek saha harcaması,
- taşeron işçilik maliyeti,
- malzeme maliyeti,
- yemek/konaklama,
- kamp/kira,
- nakliye,
- vinç/operatör,
- ekipman amortismanı,
- fazla personel,
- atıl kapasite.

Mümkün olduğunda bu etkenlerin parasal etkisi gösterilmelidir.

## 14.3. Son günlük kayıtlar

Şantiye detayında son günlerin listesi görülebilir:

- tarih,
- döküm,
- montaj,
- durum,
- onay/düzeltme,
- günlük gider/kâr-zarar,
- eksik kayıt varsa uyarı.

Belirli süre boyunca kayıt girilmeyen günler kolayca fark edilmelidir.

---

# 15. Taşeron ve öz kaynak iş modeli

Her şantiye aynı işçilik modelinde çalışmak zorunda değildir.

## 15.1. Taşeron / götürü işçilik

Ekip başına örneğin m² üzerinden birim fiyatla yalnızca işçilik verilebilir.

Bu durumda gelir normal proje geliridir; gider hesabında:

- taşeron hakedişi = onaylı üretim × taşeron birim fiyat,
- GEOGES'e ait malzeme,
- yemek,
- konaklama,
- SGK şirketçe karşılanıyorsa SGK,
- kalıp,
- demirbaş,
- vinç,
- operatör,
- nakliye,
- saha harcamaları,
- amortisman,
- genel gider payı

dahil edilir.

Yani taşeron şantiyede kâr-zarar yalnızca “işverenden aldığım para - taşerona ödediğim işçilik” değildir; GEOGES'in üstlendiği tüm destek maliyetleri hesaba katılır.

## 15.2. Öz kaynak ekip

Şantiye kendi bordrolu personeliyle yürütülüyorsa işçilik gideri puantaj ve bordrodan gelir.

## 15.3. Aynı panelde karşılaştırma

Taşeron ve öz kaynak şantiyelerin:

- birim üretim maliyeti,
- hız,
- kalite,
- zayi,
- toplam kârlılık

verileri karşılaştırılabilir olmalıdır.

---

# 16. Hakediş modülü

Hakediş günlük saha girişinden ayrı bir süreçtir. Günlük saha kaydını saha personeli, aylık hakedişi ise yetkili ticari/muhasebe/koordinasyon rolü yönetir.

## 16.1. İşveren hakedişi

Hakediş için:

- proje,
- dönem/ay,
- onaylı yapılan imalat miktarları,
- birim fiyatlar,
- brüt tutar,
- teminat/stopaj ve diğer kesintiler,
- net tutar,
- para birimi,
- hakediş belgesi

tutulabilir.

Onaylı saha üretimi hakedişe otomatik öneri olarak gelmelidir; yetkili kişinin gerekçeli düzeltme yapabilmesi mümkün olabilir.

## 16.2. Hakediş durum zinciri

Durumlar:

**Hazırlandı → İşverene sunuldu → İşveren onayladı → Faturalandı → Tahsil edildi**

şeklinde takip edilmelidir.

Kısmi tahsilat desteklenmeli; kalan açık alacak görünmelidir.

## 16.3. Hakediş onayından fatura görevine geçiş

İşveren hakedişi onayladığında sistem ilgili muhasebe birimine fatura sürecini başlatması için görev oluşturmalıdır. Şirket sahibinin belirlediği onay kuralına göre fatura kesme işlemi ayrıca yönetim onayına gelebilir.

## 16.4. Taşeron hakedişi

Aynı onaylı üretim verisi taşeron ekip başının hakedişini de oluşturmalıdır.

Örneğin:

**onaylı m² × taşeron işçilik birim fiyatı**

üzerinden hakediş hesaplanabilir.

Böylece işveren hakedişiyle taşeron hakedişi farklı Excel'lerde tekrar hesaplanmaz.

---

# 17. Fabrika ve üretim modülü

Fabrika, panel döküm merkezi değil; çelik şerit, lug, kalıp/ekipman işleri ve diğer metal imalatların üretim/maliyet merkezidir.

## 17.1. Fabrika ana görünümü

Fabrika ekranında örneğin:

- bugün işlenen/delinen çelik şerit,
- tip ve boy dağılımı,
- üretilen lug miktarı,
- fire oranı,
- birim işleme maliyeti,
- adam-gün veya saat verimi,
- hammadde miktarı,
- işlemdeki miktar,
- galvanizdeki miktar,
- sevke hazır miktar,
- günlük/aylık fabrika gideri,
- makine durumları,
- bekleyen bakım,
- dış iş ve yan gelirler

görülebilir.

## 17.2. Fabrika günlük kaydı

Fabrika sorumlusu günlük olarak:

- hangi şerit tipinden kaç adet/metre işlendi,
- başlangıç/bitiş saatleri,
- lug üretim miktarı,
- haddeci mal girişi,
- galvanize çıkış,
- galvaniz dönüşü,
- şantiyeye sevk,
- fire,
- fabrika personel puantajı,
- makine arızası/bakımı,
- fabrika harcaması,
- yapılan tamir/tadilat/kalıp işi

girebilmelidir.

Günlük fabrika kaydı sorumlu yönetici onayına gönderilebilir.

## 17.3. Çelik şerit üretim zinciri

Çelik şerit için süreç:

**Haddeci teklifi/siparişi → Fabrikaya giriş → Delme/işleme → Galvanize çıkış → Galvaniz dönüşü → Şantiyeye sevk → Sahada kullanım**

olarak uçtan uca izlenmelidir.

## 17.4. Lug üretim zinciri

Lug için:

**Düz lama siparişi → Fabrikaya giriş → Kesme → Delme → Bükme → Galvanize çıkış → Galvaniz dönüşü → Fabrika/şantiye sevki → Kullanım**

izlenmelidir.

## 17.5. Fabrika giderleri ve birim maliyet

Fabrikanın maliyetlerinde:

- işçilik,
- SGK,
- yemek,
- kira,
- elektrik,
- sarf malzeme,
- makine amortismanı,
- tamir/bakım,
- nakliye

gibi giderler dikkate alınabilir.

Amaç “fabrika ne kadar kâr etti?” sorusundan önce “1 metre işlenmiş şerit veya 1 adet lug bize gerçekte kaça mal oluyor?” sorusunu cevaplamaktır.

## 17.6. Teknik iyileştirme işleri

Fabrika içinde yapılan:

- kalıp tamiri/üretimi,
- makine-ekipman geliştirme,
- özel aparat imalatı,
- maliyet azaltıcı çözüm,
- yeni ürün/tasarım denemesi,
- kaynak/kesim/tadilat

gibi işler de görev veya üretim kaydı olarak takip edilebilir.

---

# 18. Stok, malzeme, satın alma ve sevkiyat modülü

Panel, malzemenin nerede olduğunu yalnızca toplam stok olarak değil; satın almadan kullanıma kadar hareket zinciriyle göstermelidir.

## 18.1. Malzeme kataloğu

Katalogda örneğin:

- çelik şerit tipleri,
- düz lama/lug hammaddeleri,
- lug,
- civata-somun,
- lastik takoz,
- kalıp yağı,
- EPDM,
- derz dolgusu,
- ankraj,
- diğer sarf malzemeler

tanımlanabilir.

Her kalem için:

- birim,
- kritik stok eşiği,
- gerekiyorsa boy/ölçü,
- şerit için genişlik × kalınlık, boy ve delik sayısı,
- teorik birim ağırlık (kg/m veya kg/adet)

tutulabilir.

## 18.2. Tedarikçi yönetimi

Haddeciler, galvanizciler ve diğer malzeme tedarikçileri kaydedilebilir.

Sipariş öncesinde:

- fiyat,
- termin süresi,
- miktar/tonaj,
- teslim koşulları

gibi bilgiler karşılaştırılabilir.

## 18.3. Sipariş yönetimi

Sipariş kaydında:

- tedarikçi,
- malzeme,
- miktar,
- fiyat/tutar,
- para birimi,
- sipariş tarihi,
- beklenen termin,
- belge,
- durum

tutulabilir.

Durum örneği:

**Verildi → Üretimde/Yolda → Teslim alındı**

Teslim alındığında stok artar.

## 18.4. Lokasyon bazlı stok

Stok yalnızca “şirket toplamı” değildir. Şu lokasyonlarda ayrı ayrı görülebilir:

- fabrika/depo,
- galvanizci,
- şantiye,
- başka şantiye,
- sevkiyatta.

Aynı malzeme ayrıca süreç durumuna göre:

- hammadde,
- işlemde,
- galvanizde,
- hazır,
- sahada

olarak ayrılabilir.

## 18.5. Malzeme hareketleri

Her hareket kayda dönüşmelidir:

- satın alma girişi,
- fabrika girişi,
- işleme,
- galvanize çıkış,
- galvaniz dönüşü,
- şantiye sevki,
- şantiyeler arası transfer,
- saha tüketimi,
- iade,
- fire,
- hurda.

## 18.6. Fire hesabı

Bir aşamaya giren ve çıkan miktar farklıysa sistem farkı fire olarak gösterebilmelidir.

Örneğin:

- fabrikada işleme firesi,
- galvaniz sürecindeki fark,
- sevkiyat farkı

ayrı ayrı görülebilir.

## 18.7. Malzeme çıkış talebi ve yönetim onayı

Şantiyeye malzeme çıkışı gerekiyorsa önce talep oluşturulabilir. Şirket sahibinin belirlediği kurala göre malzeme çıkışı yönetim onayı olmadan yapılamaz.

Akış örneği:

**Şantiye talebi → Yönetim onayı → Sevkiyat → Sahaya teslim/alım → Stok güncellemesi**

Şirket sahibi yalnızca ilk talebi değil, malzemenin gerçekten sevk edildiğini ve sahaya ulaştığını da bildirimden görebilmelidir.

## 18.8. Şantiyeler arası doğrudan sevkiyat

Bir şantiye sona yaklaşıyorsa ekipman ve malzeme önce fabrikaya dönmek zorunda olmamalıdır. Nakliye avantajlıysa doğrudan başka şantiyeye sevk edilebilir.

Bu hareket kayıtta kaynak şantiye ve hedef şantiye olarak görünür.

## 18.9. Kritik stok

Her malzeme için kritik eşik belirlenebilir.

Panel:

- mevcut stok,
- proje için kalan ihtiyaç,
- beklenen tüketim,
- kritik seviyeye kalan miktar/zaman

üzerinden uyarı verebilir.

Örnek: “50×4 şerit stoğu kritik seviyeye yaklaşıyor; sipariş/talep oluştur.”

Uyarı ilgili sorumlu, koordinatör ve şirkete göre Sahip ekranına yükselir.

## 18.10. Proje sonu artık malzeme

Proje sonunda artan kullanılabilir malzeme otomatik olarak zayi sayılmamalıdır.

Seçenekler:

- fabrikaya iade,
- başka projeye transfer,
- sonraki proje için stok,
- uygun ise satış.

## 18.11. Ağırlık, kantar ve tır bazlı sevkiyat

Çelik şerit ve lama süreçlerinde miktar aşamaya göre farklı birimle izlenir:

- haddeciye sipariş: kg/ton,
- haddeci çıkışı ve galvaniz giriş/çıkışı: boy bazında kg,
- şantiyeye sevk ve sahada kullanım: boy bazında adet ve metre.

Panel birimler arasındaki dönüşümü tanımlardan (genişlik × kalınlık × boy × çelik yoğunluğu) **teorik ağırlık** olarak hesaplar.

Her sevkiyat tır bazında kaydedilir:

- tır/plaka ve kaçıncı tır olduğu,
- ilgili sipariş,
- çıkış ve varış noktası (haddeci, galvanizci, fabrika, şantiye),
- boy bazında adet ve kg (aynı tırda farklı boylar olabilir),
- kantar fişleri (haddeci çıkış, galvanizci giriş, galvanizci çıkış, şantiye giriş).

Kantar tartısı teorik ağırlıkla karşılaştırılır; fark tanımlı toleransı aşarsa uyarı oluşur ve açıklama istenir. Çıkış ve varış kantarı arasındaki fark ayrıca sevkiyat farkı olarak gösterilir.

Galvaniz dönüşündeki ağırlık artışı çinko kaplamadan kaynaklanır; fire sayılmaz, beklenen kaplama artışıyla karşılaştırılarak ayrı gösterilir.

Stok giriş ekranında özet kartlar bulunur:

- haddeci: toplam sipariş kg / çıkan kg,
- galvanizci/depo: giren kg / çıkan kg / kalan kg,
- şantiyeler: gelen adet / kullanılan / kalan.

Haddeci ve galvanizci listeleri (örneğin Çaprazoğlu, Serhat Haddecilik; Konkap Ankara, Konkap Konya) tedarikçi tanımlarından gelir.

## 18.12. Fiziki stok sayımı

Fabrika, depo, galvanizci ve şantiyelerde periyodik veya habersiz sayım yapılabilmelidir.

Sayımda:

- lokasyon, tarih, sayımı yapan,
- malzeme bazında sistem miktarı ve sayılan miktar,
- fark ve fark nedeni,
- gerekiyorsa fotoğraf

tutulur.

Sayım sorumlu yöneticinin onayına gider. Onaylanan fark stok düzeltme hareketi olarak işlenir; stok elle üzerine yazılmaz. Hedef sıfır farktır; tolerans dışı fark kritik uyarı oluşturur. Sayım geçmişi ve lokasyon bazında fark eğilimi raporlanır.

## 18.13. Açılış stoku

Panel kullanılmaya başlandığında veya yeni bir lokasyon eklendiğinde mevcut stok “açılış stoku” olarak birim maliyetiyle girilir. Açılış kaydı onaydan sonra kilitlenir ve yalnız revizyon talebiyle (bkz. 37.1) değiştirilebilir.

## 18.14. Şerit kombinasyon önerisi

Belirli bir uzunlukta şerit ihtiyacı olduğunda panel, stoktaki boylardan ihtiyacı karşılayan en uygun kombinasyonu önerir:

1. önce en az fire (toplam boy − ihtiyaç),
2. sonra en az parça sayısı.

Stok yetmiyorsa eksik boy ve miktar için talep/sipariş önerisi üretir. Bu yalnızca öneridir; sevki planlayan kişi onaylar veya değiştirir.

## 18.15. Stok tüketim maliyeti

Sahada veya fabrikada tüketilen her malzemenin maliyeti ilgili proje/şantiye/fabrika maliyetine otomatik yansır; ayrıca gider olarak tekrar girilmez.

Birim maliyet sırası:

1. alışların ağırlıklı ortalama maliyeti,
2. yoksa son alış fiyatı,
3. yoksa tanımlı manuel birim maliyet,
4. hiçbiri yoksa “maliyet bulunamadı” uyarısı.

Maliyetin hangi yöntemle bulunduğu kayıtta görünür. Maliyet tüketim anında dondurulur; sonradan girilen sipariş veya değişen fiyat geçmiş kâr-zararı değiştirmez.

Lug fabrikada düz lamadan üretildiği için maliyeti düz lama + fabrika işçilik, enerji ve fire payından oluşur. Fabrika maliyeti tam oluşana kadar düz lama maliyeti geçici olarak kullanılır ve “geçici” diye işaretlenir.

İşverenin tedarik ettiği malzeme (bkz. 7.3) stokta miktar olarak izlenir, fakat GEOGES maliyetine yazılmaz.

Stok eksiye düşerse tüketim kaydedilir ancak kritik uyarı oluşur.

## 18.16. Genel satın alma talebi

Malzeme kataloğu dışındaki alımlar da (yedek parça, sanayi/tamir hizmeti, el aleti, ekipman, ofis ihtiyacı) panel üzerinden yürür:

**Talep → Fiyat araştırması → Teklif karşılaştırma → Onay → Alım → Teslim alma → Fatura/ödeme**

Talepte talep eden, ilgili birim/şantiye/ekipman, ihtiyaç açıklaması, miktar, aciliyet ve istenen tarih bulunur. Fiyat araştırmasında birden fazla tedarikçi teklifi (fiyat, termin, koşul, belge) yan yana görülür. Onay tutar eşiğine göre ilgili yöneticiye gider. Teslim alınan kalem gerekiyorsa demirbaş kaydına veya ilgili maliyet merkezine bağlanır.

---

# 19. Sarf malzeme reçeteleri

Tekrarlayan sarflar her gün saha personeline tek tek düşündürülmemelidir.

Panelde panel/montaj/iş kalemi başına standart sarf reçeteleri tanımlanabilir.

Örneğin belirli bir montaj için:

- kaç civata-somun,
- kaç lastik takoz,
- ne kadar EPDM,
- ne kadar kalıp yağı veya diğer sarf

bekleniyorsa bir kez tanımlanır.

Saha günlük üretimi girince sistem tahmini sarfı otomatik hesaplar. Kullanıcı yalnızca gerçek sapmayı veya ekstra tüketimi girer.

Sarf ekranında:

- malzeme,
- birim,
- bugün kullanılan,
- bugüne kadar kullanılan,
- stok kalan,
- kritik durum

görülebilir.

Normalin üzerinde sarfiyat oluşursa panel bunu uyarı olarak işaretleyebilir.

---

# 20. Fire, hurda ve yan gelir takibi

Şirket yalnızca ana sözleşmelerden değil; atıl kapasite, hurda, dış nakliye, dış imalat ve kiralamalardan da gelir üretebilir. Panel bunların da kaybolmamasını sağlamalıdır.

## 20.1. Fire ve tartım belgesi

Hurdaya dönüşecek fire tartılır. Tartım fişi, ekran görüntüsü veya ilgili belge fire kaydına eklenir.

Kayıt zinciri:

**Fire oluştu → Tartıldı → Hurdaya ayrıldı → Satıldı → Gelir kaydı oluştu**

şeklinde kapanmalıdır.

Böylece “ne kadar fire çıktı, ne kadar hurda satıldı, hangi fiyattan satıldı?” soruları cevaplanır.

## 20.2. Yan gelir / dış iş türleri

Panelde ortak bir yan gelir alanı bulunabilir:

- hurda satışı,
- dış nakliye,
- dış kaynak/imalat işi,
- kaynak/kesim işi,
- ekipman kiralama,
- kalıp kiralama,
- araçla dış hizmet,
- diğer dış işler.

Kayıtta:

- iş türü,
- müşteri,
- yapılan miktar,
- birim fiyat,
- toplam,
- tarih,
- faturalı/nakit bilgisi,
- ilgili araç/birim/personel,
- belge

tutulabilir.

Nakit olarak tahsil edilen gelir de kaybolmaması için açıkça kayda girilir ve resmi muhasebe ile mutabakata dahil edilir.

## 20.3. Servis aracını mini kâr merkezi olarak izleme

Şirketin servis/nakliye aracı için:

- yakıt,
- amortisman,
- bakım,
- dış nakliye geliri,
- kendi işlerinde sağladığı nakliye tasarrufu

birlikte değerlendirilebilir.

Amaç aracın şirkete net etkisini görebilmektir.

## 20.4. Atıl kapasiteyi gelire çevirme

Uzun süre boş duran:

- vinç,
- araç,
- kalıp,
- makine

varsa sistem “kiralama/dış iş fırsatı olabilir” şeklinde uyarı verebilir.

---

# 21. Ekipman, demirbaş, kalıp ve araç yönetimi

Şirkete ait fiziksel varlıkların tamamı kayıt altında olmalıdır.

## 21.1. Envanter kartı

Bir varlık kartında mümkün olduğunca eksiksiz şu bilgiler tutulabilir:

- varlık adı,
- kategori,
- marka,
- model,
- üretim/yıl,
- seri numarası veya plaka,
- satın alma tarihi,
- satın alma bedeli,
- para birimi,
- adet/birim,
- faydalı ömür,
- mevcut durum,
- mevcut lokasyon,
- zimmetli kişi,
- garanti bilgisi,
- son bakım,
- sonraki bakım/periyodik kontrol,
- fatura,
- fotoğraf,
- diğer belgeler.

Kategori örnekleri:

- mobil vinç,
- kalıp,
- pres,
- kaynak makinesi,
- testere,
- tavan vinci,
- araç,
- konteyner,
- laptop,
- telefon,
- SIM kart,
- el aleti,
- diğer demirbaş.

## 21.2. Lokasyon ve transfer geçmişi

Bir ekipmanın hangi tarihlerde:

- fabrikada,
- hangi şantiyede,
- bakımda,
- başka lokasyonda

bulunduğu görülebilmelidir.

Fabrika → şantiye, şantiye → şantiye veya şantiye → fabrika transferleri geçmişte kalır.

## 21.3. Günlük amortisman

Bir ekipman şantiyeye gönderildiği tarihten itibaren günlük kullanım/yıpranma payı ilgili şantiyenin giderine dağıtılabilmelidir.

Böylece örneğin şirketin satın aldığı vinç veya kalıp “bedava kaynak” olarak görülmez; yatırım maliyeti projelerin gerçek kârlılığına yansır.

Fabrikada veya depoda atıl bekleyen ekipmanın maliyeti de görünür olmalıdır.

## 21.4. Tamir ve zayi

Ekipman arızası olduğunda:

- arıza,
- tamir,
- yedek parça,
- servis,
- maliyet,
- belge/fotoğraf

ilgili varlığa ve gerekiyorsa ilgili şantiyeye bağlanır.

Bir demirbaş kullanılamaz hale gelirse kalan değeri zayi/kayıp olarak ilgili maliyete yansıtılabilir; alınan yeni parça ayrı yeni varlık veya gider olarak takip edilir.

## 21.5. Bakım ve periyodik kontroller

Sistem yaklaşan/geçen:

- vinç fenni/periyodik kontrolleri,
- araç muayenesi,
- sigorta,
- makine bakımı,
- diğer zorunlu kontroller

için uyarı üretmelidir.

## 21.6. Atıl kaynak takibi

Her ekipman için “kaç gündür atıl?” bilgisi görülebilir. Bu veri kaynak optimizasyonuna beslenir.

## 21.7. Vinç günlük kaydı ve operatör ekranı

Her vinç için günlük kayıt:

- şantiye ve operatör,
- çalışma saati (başlangıç/bitiş veya saat sayacı),
- yakıt miktarı, tutarı ve yakıt fişi fotoğrafı,
- arıza/bekleme bildirimi (fotoğraflı),
- yapılan işler.

Vinç operatörü kendi ekranında atanmış vinçlerini ve günlük görevlerini görür; kaydını ve arıza bildirimini telefondan girer.

Vinçler kendi malı ve kiralık olarak ayrılır. Kiralık vinçte kiralayan firma, kira bedeli ve kira süresi tutulur; kira gideri ilgili şantiyeye yazılır.

Çalışma saati ve yakıt verisinden saat başı yakıt tüketimi, kullanım oranı ve olağan dışı yakıt tüketimi uyarısı çıkar.

## 21.8. Araç zimmeti ve devir-teslim

Araç kişiye zimmetlenirken, iade alınırken veya iki kişi arasında devredilirken:

- tarih,
- km okuması,
- yakıt seviyesi,
- aracın fotoğrafları (hasar durumu),
- imzalı devir-teslim tutanağı

kaydedilir.

Km farkı ve yakıt kayıtlarından kullanım, km başı yakıt ve maliyet hesaplanır. Muayene, sigorta ve bakım tarihi veya km'si yaklaşınca uyarı üretilir.

---

# 22. Finans ve yönetim muhasebesi

Panelin finans tarafı yönetimin şu sorularına cevap vermelidir:

- Param nerede?
- Kim bana ne kadar borçlu?
- Ben kime ne kadar borçluyum?
- Hangi proje gerçekten kâr ediyor?
- Hangi proje zarar ediyor?
- Bu ay ne kadar gelir/gider var?
- Önümüzdeki haftalarda nakit yeterli mi?

## 22.1. Finans ana ekranı

Öne çıkan kartlar:

- nakit pozisyonu,
- toplam açık hakediş/alacak,
- bu ay gelir,
- bu ay gider,
- şirket geneli kâr-zarar,
- toplam alacak,
- toplam borç,
- yakın nakit açığı.

## 22.2. Gelirler

Gelir kaynakları:

- hakediş tahsilatları,
- yan gelirler,
- hurda,
- dış nakliye,
- dış imalat,
- kiralama,
- diğer gelirler.

Her gelirde:

- tutar,
- para birimi,
- tarih,
- ilgili proje/birim,
- faturalı/nakit,
- belge

tutulabilir.

## 22.3. Giderler

Giderler iki şekilde gelir:

### Sistemden otomatik gelen giderler

- taşeron hakedişi,
- malzeme,
- ekipman amortismanı,
- bordro,
- saha harcaması,
- fabrika maliyeti,
- bakım vb.

### Manuel/genel giderler

- ofis gideri,
- kira,
- seyahat,
- yemek,
- konaklama,
- avans,
- diğer genel gider.

Aynı giderin iki kez sayılması engellenmelidir.

## 22.4. Proje kâr-zarar

Gerçek proje kâr-zararı mümkün olduğunca tüm giderleri kapsamalıdır:

**Gelir - (işçilik + malzeme + yemek/konaklama + ekipman/amortisman + nakliye + operatör/vinç + saha harcaması + proje payına düşen diğer giderler)**

Hem günlük/aylık hem kümülatif izlenebilir.

## 22.5. Çoklu para ve kur takibi

TL, USD, EUR veya gerekli diğer para birimleri kullanılabilir.

Günlük TL karşılığı için varsayılan olarak bir önceki iş gününün TCMB kuru kullanılabilir. Gerekli özel durumda yetkili kullanıcı manuel kur girebilir.

Geçmiş kayıtlardaki fiyat ve kur, daha sonra tanım değişse bile geçmiş hesabı bozmayacak şekilde korunmalıdır.

## 22.6. Cari hesap

Her işveren ve tedarikçi için yürüyen cari bakiye görünmelidir.

### İşveren carisi

- hakedişler alacağı artırır,
- tahsilatlar alacağı azaltır.

### Tedarikçi carisi

- sipariş/gider borcu artırır,
- ödeme borcu azaltır.

Cari kartında:

- tarihli hareket dökümü,
- işlem açıklaması,
- artış/azalış,
- yürüyen bakiye,
- para birimi ve TL karşılığı

görülebilir.

## 22.7. Nakit akışı projeksiyonu

Panel yalnızca bugünkü parayı değil önümüzdeki haftaları da göstermelidir.

Örneğin 8 haftalık görünümde girişler:

- beklenen hakediş tahsilatları,
- planlı diğer gelirler.

Çıkışlar:

- bordro/maaş,
- açık siparişler,
- tedarikçi ödemeleri,
- kira ve sabit giderler,
- yaklaşan sözleşme/yasal ödemeler,
- planlı nakit kalemleri.

Her hafta için:

- giriş,
- çıkış,
- net,
- kümülatif nakit

gösterilir.

Nakit açığı beklenen haftalar önceden uyarılır; yönetim hangi kalemlerin açığı yarattığını görebilir.

## 22.8. Fatura, irsaliye, ödeme, avans ve dekont takibi

Muhasebe biriminin günlük operasyonunda:

- fatura,
- irsaliye,
- ödeme listeleri,
- cari,
- avans,
- dekont,
- ödeme durumu,
- muhasebe evrakı

takip edilebilir.

Ödemeler yönetimin tanımladığı onay olmadan tamamlanmamalıdır.

## 22.9. Resmi muhasebe ile mutabakat

Panel yönetim finansını eksiksiz tutmalıdır; resmi e-fatura, defter, KDV/beyan gibi mevzuata bağlı işlemler ise muhasebeci/YMM tarafındaki sistemle mutabakat veya aktarım üzerinden yürütülebilir. Amaç resmi muhasebe programını taklit etmek değil, şirket yönetim verisinin orayla tutarlı olmasını sağlamaktır.

## 22.10. Dönem (ay) kapanışı

Her ay sonunda dönem kapanışı yapılır. Kapanıştan önce panel kontrol listesini gösterir:

- o aya ait onay bekleyen saha ve fabrika günlük kayıtları,
- onay bekleyen stok sayımları,
- sonuçlanmamış revizyon talepleri,
- hazırlanmamış hakediş, bordro veya eksik belge gibi kapanışı etkileyen açık işler.

Engelleyici kalem varsa dönem kapatılamaz ve neyin eksik olduğu gösterilir. Kapanan dönemin raporları “kesinleşmiş” olarak işaretlenir. Kapalı döneme ait değişiklik yalnız revizyon talebiyle veya yetkili kişinin gerekçeli olarak dönemi yeniden açmasıyla yapılabilir.

Ayın belirli gününe kadar (varsayılan: 10'u) kapatılmayan dönem için uyarı ve görev oluşur.

---

# 23. İnsan Kaynakları, personel ve bordro modülü

## 23.1. Personel kartı

Her personel için:

- ad-soyad,
- görev/pozisyon,
- rol,
- işe giriş tarihi,
- ayrılış tarihi,
- aktif/ayrıldı durumu,
- baz maaş ve para birimi,
- SGK bilgisi,
- IBAN,
- çalıştığı birim/şantiye/fabrika/ofis,
- sözleşme/özlük belgeleri,
- zimmetler,
- izin geçmişi,
- bordro geçmişi,
- eğitim ve süreli belgeler

tutulabilir.

Hassas bilgileri yalnızca yetkili İK ve Sahip rolleri görür.

## 23.2. Puantaj

Şantiye personelinin puantajı saha kayıtlarından beslenebilir. Fabrika ve ofis personeli için gerekli manuel puantaj girilebilir.

Aylık bazda:

- çalışma günleri,
- saat,
- izin,
- devamsızlık

görülebilir.

## 23.3. Bordro

Bordroda:

- brüt,
- SGK,
- vergi,
- diğer kesintiler,
- net,
- dönem,
- ödeme durumu

takip edilir.

Durum:

**Hazırlandı → Onaylandı → Ödendi**

şeklinde ilerleyebilir.

Ödenen bordro ilgili maliyet merkezine maaş gideri olarak yansır.

## 23.4. İmzalı bordro bağımlılığı

Sözleşme veya şirket içi kural gerektiriyorsa imzalı bordrolar sisteme yüklenmeden maaş ödeme işlemi tamamlanamayabilir.

Bordroların örneğin her ayın ilk 10 günü işverene gönderilmesi gerekiyorsa sistem muhasebeye son tarih görevi oluşturur.

## 23.5. İzin yönetimi

İzin türleri:

- yıllık izin,
- mazeret,
- rapor/hastalık,
- ücretsiz izin

gibi ayrılabilir.

Talep, onay, kullanılan gün ve bakiye görülebilir.

## 23.6. İşe giriş / işten çıkış checklist'i

Personel giriş ve çıkış işlemleri zorunlu evrak listeleriyle yönetilmelidir.

Örneğin çalışan ayrılırken:

- gerekli imzalı evraklar,
- zimmet teslimleri,
- teminat iadesi için ileride gerekebilecek belgeler,
- çıkış dokümanları

tamamlanmadan süreç kapanmamalıdır.

Amaç çalışan şehir dışına gittikten sonra eksik evrak peşinde koşmamaktır.

## 23.7. Zimmet uyarısı

İşten ayrılan bir çalışanın üzerinde hâlâ:

- telefon,
- laptop,
- araç,
- ekipman,
- diğer demirbaş

varsa kritik uyarı çıkarılmalıdır.

## 23.8. Personel günlük faaliyet raporu

Özellikle üretim kaydı olmayan roller (ofis, teknik ofis, muhasebe, İK, koordinasyon) günlük faaliyet raporu girer:

- yapılan işler (satır satır),
- başlangıç/bitiş saati,
- öncelik ve durum (tamamlandı / devam ediyor / beklemede),
- ilgili proje veya görev,
- gün değerlendirmesi,
- ertesi gün planı.

Kişi günde bir rapor girer; yöneticiler bağlı personelin raporlarını görür. Raporlar görev sistemiyle bağlantılıdır ve performans değerlendirmesine veri sağlar. Hangi rollerin rapor girmekle yükümlü olduğu ayarlanabilir.

## 23.9. Çalışma takvimi

Şirket genelinde tanımlanır:

- çalışma saatleri (varsayılan: ofis 08:00–17:00, saha ve fabrika 08:00–18:00),
- hafta tatili ve resmi tatiller,
- fazla mesai kuralları,
- maaş ödeme günü (varsayılan: her ayın 1'i).

Puantaj, fazla mesai, geç veri girişi, son tarih ve nakit projeksiyonu hesapları bu takvimi kullanır. Birim veya şantiye bazında farklı takvim tanımlanabilir.

---

# 24. Sözleşme, hukuk, yükümlülük ve uyum modülü

Her projenin sözleşmesi yalnızca PDF olarak saklanmamalı; içindeki önemli şartlar takip edilebilir kayıtlara dönüşmelidir.

## 24.1. Sözleşme şartları

Proje altında:

- iş kapsamı,
- teslim tarihi,
- iş süresi,
- ödeme koşulları,
- hakediş şartları,
- teminat oranı/şartı,
- teminat iadesi için gereken evraklar,
- gecikme cezası,
- günlük cezai tutar,
- İSG yükümlülükleri,
- işveren yükümlülükleri,
- GEOGES yükümlülükleri,
- gerekli belge/gönderim tarihleri

tanımlanabilir.

## 24.2. Yükümlülük kaydı

Her yükümlülükte:

- ne yapılacak,
- sorumlu taraf: GEOGES / işveren,
- sorumlu kişi veya rol,
- son tarih,
- durum,
- ceza riski,
- ilgili belge

görülebilir.

Süre yaklaşınca uyarı, geçince gecikme ve gerekirse kritik eskalasyon oluşur.

## 24.3. Koşullu tetikleyiciler

Bazı işler bir olay gerçekleşince doğar.

Örnekler:

- hakediş onaylandı → fatura kesme görevi,
- ay sonu geldi → bordro hazırlama/gönderme görevi,
- personel ayrılıyor → çıkış evrakı ve zimmet checklist'i,
- sertifika süresi yaklaşınca → yenileme görevi,
- iş başlangıcı → teminat/SGK/yer teslim yükümlülükleri.

## 24.4. Bağımlılık kilitleri

Belirli işlerin sırası zorunlu tutulabilir:

- imzalı bordro tamamlanmadan maaş ödeme,
- hakediş onayı olmadan fatura,
- gerekli çıkış/teminat evrakları tamamlanmadan personel çıkışını kapatma

gibi.

Panel kullanıcıya işlemin neden kilitli olduğunu açıkça göstermelidir.

## 24.5. İşveren yükümlülükleri

Yalnızca GEOGES'in değil işverenin yükümlülükleri de takip edilmelidir:

- saha teslimi,
- dolgu,
- beton,
- demir,
- elektrik/su,
- ödeme,
- diğer sözleşmesel yükümlülükler.

## 24.6. İşveren gecikme kanıtı

Saha teslim-tesellüm saatleri ve sözleşme yükümlülükleri birleştirilerek gecikme dosyası hazırlanabilmelidir.

Dosyada:

- hangi tarihte ne beklendi,
- işveren ne zaman yerine getirdi,
- kaç saat/gün gecikme oldu,
- hangi kayıt/foto/belge bunu destekliyor,
- tahmini maliyet etkisi

yer alabilir.

Bu çıktı yazdırılabilir/PDF olarak dışa aktarılabilir ve hak talebi/uyuşmazlık durumunda kullanılabilir.

## 24.7. Teminat, garanti ve resmi belge takibi

Teminat iadeleri, garanti şartları, kurum evrakları, süreli belgeler ve uyuşmazlık dosyaları da proje/şirket bazında takip edilebilir.

---

# 25. Görev ve bildirim motoru

Panelin önemli amacı yöneticinin personelin peşinde koşmasını azaltmaktır.

## 25.1. Görev kaydı

Her görevde:

- başlık,
- açıklama,
- sorumlu kişi veya rol,
- öncelik,
- son tarih,
- durum,
- görevin kaynağı,
- ilgili proje/birim,
- gerekli belge veya eylem

görülebilir.

Görevler manuel veya sistem tarafından otomatik oluşturulabilir.

## 25.2. Otomatik görev kaynakları

Sistem örneğin şu durumlardan görev üretebilir:

- geciken saha onayı,
- kritik stok,
- atıl ekipman,
- bakım tarihi geçmesi,
- geciken hakediş/alacak,
- nakit açığı,
- sözleşme yükümlülüğü,
- bordro son tarihi,
- sertifika yenileme,
- İSG aksiyonu,
- eğitim yenileme,
- toplantı kararı.

Aynı sorun için sürekli kopya görev açılmamalıdır. Sorun çözülünce ilgili görev kapanabilmelidir.

## 25.3. Eskalasyon

Görev zamanında ele alınmazsa otomatik olarak üst seviyeye çıkar:

**Sorumlu → Koordinatör → Genel Müdür → Sahip**

Bu zincir ve bekleme süreleri şirket yönetimi tarafından değiştirilebilir.

## 25.4. Görevlerim ekranı

Her kullanıcı giriş yaptığında:

- bugün yapacakları,
- gecikenleri,
- yüksek öncelikleri,
- kendisinden onay bekleyenleri

görebilmelidir.

## 25.5. Bildirim merkezi

Üst alanda bildirim sayacı/çekmecesi bulunur.

Bildirim türleri:

- yeni görev,
- görev gecikmesi,
- düzeltme isteği,
- onay talebi,
- kritik uyarı,
- rol ataması,
- belge süresi,
- stok riski,
- finansal risk.

Telefon kullanımında görev ve kritik bildirimlerin zamanında ulaşması hedeflenir.

## 25.6. Günlük özet

Saha/fabrika gün sonu verileri mümkün olduğunca erken girilmelidir. Doğru ve eksiksiz kayıt yapanlar arasında erken giriş küçük performans katkısı sağlayabilir.

Şirket sahibine akşam bakabileceği günlük özet ve en geç ertesi sabah çalışma başlamadan önce dünkü durumun tek bildirimi sunulabilir. Konuşmada örnek varsayılan olarak sabah 07:30 özeti öne çıkmıştır.

Kritik olaylar günlük özeti beklemeden anında bildirilir; acil olmayan bildirimler gereksiz dikkat dağınıklığı oluşturmamak için özetlenebilir.

## 25.7. İç destek talepleri

Her kullanıcı bir ihtiyaç veya sorun için talep açabilir:

- kategori (donanım, panel hatası, malzeme/ekipman ihtiyacı, idari talep, diğer),
- konu, açıklama, ek/fotoğraf,
- öncelik,
- ilgili şantiye/birim,
- muhatap kişi veya rol.

Talebin altında mesajlaşma yapılır. Muhatap talebi çözebilir, gerekçeyle reddedebilir veya yetki gerektiriyorsa hiyerarşide üst pozisyona sevk edebilir (örneğin Formen → Koordinatör → Genel Müdür).

Durumlar: **Açık → İşlemde → Beklemede → Çözüldü / Reddedildi → Kapatıldı**

Cevapsız kalan talep görev motorunun eskalasyon kurallarına tabidir. Kimin kime talep açabileceği ve sevk zinciri pozisyona göre ayarlanır.

---

# 26. Akıl katmanı / öneriler ve karar desteği

Panel yalnızca “ne oldu?” sorusunu değil, “şimdi ne yapmak daha mantıklı?” sorusunu da desteklemelidir.

## 26.1. Öncelikli öneri listesi

Öneriler önem derecesine göre sıralanır ve her öneride:

- sorun/fırsat,
- gerekçe,
- beklenen etki,
- ilgili ekrana geçiş

görülür.

## 26.2. Örnek öneriler

Panel şu tip öneriler oluşturabilir:

- “Bu vinç X gündür atıl; aktif şantiyede ihtiyaç var.”
- “Şu malzeme kritik seviyeye indi; sipariş ver.”
- “Bu proje zararda; başlıca neden dolgu beklemesi ve yüksek harcama.”
- “Şu hakediş/alacak N gündür bekliyor; takip et.”
- “Nakit pozisyonu zayıflıyor; şu tahsilatları hızlandır.”
- “Şu saha kaydı uzun süredir onay bekliyor.”
- “Kalıp yağı/sarf tüketimi normalin üzerinde.”
- “Mevcut üretim hızına göre proje tahmini şu tarihte biter.”

Öneri sistemi yönetici adına otomatik karar vermemeli; gerekçeli tavsiye üretmelidir.

---

# 27. Şirket geneli kaynak optimizasyonu

Şantiyeler, fabrika, araçlar, ekipman ve personel birbirinden bağımsız adalar gibi değil; şirketin ortak kaynak havuzu olarak değerlendirilmelidir.

## 27.1. Atıl kaynak ve darboğaz eşleştirmesi

Panel aynı anda:

- hangi şantiyede iş yavaş,
- hangi şantiyede ekipman bekliyor,
- hangi şantiyede ekipman eksik,
- hangi makine/kalıp/vinç boş,
- nerede personel fazla veya eksik

gibi verileri karşılaştırabilir.

## 27.2. Transfer önerisi

Örneğin sistem:

- bir vincin mevcut yerde dolgu gecikmesi nedeniyle atıl kaldığını,
- başka şantiyede vinç darboğazı olduğunu,
- iki şantiye arası nakliye/yakıt maliyetini,
- transfer edilirse tahmini üretim artışını,
- şirket toplam kârına net etkisini

hesaplayıp öneri sunabilir.

## 27.3. Personel optimizasyonu

Benzer şekilde atıl bir makinenin başka sahaya gönderilmesi ve bir personel takviyesiyle toplam ekip sayısının azaltılmasının:

- maaş,
- SGK,
- yemek,
- konaklama,
- nakliye

etkileri hesaplanabilir.

Taşeron şantiyede GEOGES tarafından karşılanan SGK/yemek/konaklama gibi destekler de optimizasyon hesabına dahil edilmelidir.

## 27.4. Öneri, otomatik emir değil

Kaynak transferi otomatik yapılmaz. Panel maliyet-kazanç hesabını ve gerekçeyi sunar; yönetici/koordinatör onay vererek talimatı başlatır.

Bir kaynağı başka yere aktarırken mevcut şantiyenin kısa süre sonra tekrar o kaynağa ihtiyaç duyup duymayacağı da değerlendirilmelidir.

---

# 28. Performans, KPI, sıralama ve prim sistemi

Sistem yalnızca saha çalışanlarını değil, tüm organizasyonu ölçmelidir. Ancak herkes kendi işinin objektif metrikleriyle değerlendirilmelidir.

## 28.1. Saha mühendisi / formen / ekip performansı

Metrikler örneğin:

- doğrulanmış üretim m²,
- panel/saat,
- zamanında veri girişi,
- kayıt eksiksizliği,
- zayi/fire oranı,
- onaya zamanında gönderme,
- kalite,
- İSG uyumu.

## 28.2. Koordinatör performansı

- sorumlu şantiyelerin toplam performansı,
- geciken onay sayısı,
- sorun çözme süresi,
- veri disiplini,
- sorumlu şantiyelerin kârlılığına etkisi.

Koordinatör kötü kâr-zararın kendi kontrolü dışındaki nedenleri yüzünden otomatik cezalandırılmamalı; örneğin geciken onay veya çözülmeyen görev gibi kendi kontrolündeki davranışlar ayrı ölçülmelidir.

## 28.3. Fabrika performansı

- üretim miktarı,
- birim maliyet,
- fire,
- makine duruşu,
- veri kalitesi,
- zamanında sevkiyat.

## 28.4. Teknik ofis performansı

- çizim/revizyon teslim süresi,
- gecikme,
- hata/revizyon oranı,
- teklif/metraj hazırlama süresi.

## 28.5. Satış ve iş geliştirme performansı

- teklif sayısı,
- teklif yanıt süresi,
- kazanma oranı,
- kaçırılan fırsat/ihale,
- tekliflerin sonradan gerçek kârlılığı.

## 28.6. Muhasebe ve İK performansı

Muhasebe:

- hakediş/fatura/ödeme işlerinin zamanında yapılması,
- yükümlülüklerin kaçırılmaması,
- hata oranı.

İK:

- bordro ve SGK süreçlerinin zamanında olması,
- eksik evrak,
- izin/zimmet/çıkış süreçlerinin doğru tamamlanması.

## 28.7. Sağlıklı sıralama ilkesi

Sıralama yalnızca “kim daha hızlı?” olmamalıdır. Yalnız hıza bağlanan sistem kaliteyi düşürebilir veya insanları sorunları gizlemeye teşvik edebilir.

Bu nedenle skor:

- doğrulanmış çıktı,
- kalite,
- zayi,
- güvenlik,
- zamanında ve eksiksiz veri

gibi boyutlardan oluşmalıdır.

Kötü haberi zamanında ve doğru şekilde bildiren kişi cezalandırılmamalıdır. Sorunu gizlemek veya veriyi geciktirmek olumsuz etkilenmelidir.

## 28.8. Erken veri girişi

Tam ve doğru kayıt temel şarttır. Bunlar eşitse erken veri girişi küçük bir bonus sağlayabilir; özensiz veya eksik erken kayıt ödüllendirilmez.

## 28.9. Sıralama görünürlüğü

Olumlu ve operasyonel performans benzer roller arasında sağlıklı rekabet için gösterilebilir. Ancak:

- kişiyi küçük düşüren “sonuncu” sunumu yapılmamalı,
- özel zayıflıklar herkese açık olmamalı,
- kâr marjı/birim maliyet gibi ticari veriler korunmalıdır.

Şirket sahibi görünürlük politikasını açıp kapatabilmelidir.

## 28.10. Hedefler ve prim

Hedefler:

- genel şirket hedefi,
- rol hedefi,
- kişiye özel hedef

olarak tanımlanabilir.

Kişiye özel hedef, varsa rol/genel hedeften öncelikli olabilir.

Prim kuralları:

- hedefi aşma,
- skor eşiği,
- belirli metriği gerçekleştirme,
- proje erken bitirme

gibi koşullara bağlanabilir.

Prim sabit tutar veya oran olabilir. Hesaplanan prim yönetim tarafından gözden geçirilip onaylanabilir.

## 28.11. Başlangıç KPI kataloğu (mevcut KPI kılavuzu v2.0)

Şirkette Excel ile kullanılan KPI sistemi panelin başlangıç kataloğu olarak aktarılır ve bundan sonra panelde yönetilir.

Kapsanan pozisyonlar: Genel Müdür, Genel Müdür Yardımcısı, Genel Koordinatör, Şantiyeler Koordinatörü, Teknik Ofis, Saha Mühendisi, Formen, İşçi, Bekçi, Temizlik Görevlisi.

Her KPI için kod (örneğin GM01, SM-01), ad, süreç, pozisyon, ağırlık %, hedef ve puanlama tipi tutulur. Örnek KPI'lar: proje bütçe sapma oranı, hakediş hazırlık süresi, metraj doğruluk oranı, as-built çizim teslimi, günlük iş raporu teslimi, ramak kala bildirimi, uygunsuzluk kapatma süresi, işçi devam durumu, nöbet düzeni, ziyaretçi/araç kaydı.

Puan 0–100 aralığındadır:

| Puan | Durum | Prim |
|---|---|---|
| ≥ 90 | Mükemmel | +%10 |
| 80–89 | İyi | +%5 |
| 70–79 | Geliştirilmeli | Normal |
| < 70 | Kritik | Uyarı |

Kılavuzdaki kayıt mantığı (uygunsuzluk, DÖF, risk, denetim, müşteri geri bildirimi; hedef gün, gerçek gün, tekrar eden sorun) kalite modülündeki uygunsuzluk/DÖF kayıtlarından (bkz. 29.4) beslenir; geciken ve tekrar eden kayıtlar puanı düşürür. Mümkün olan KPI'lar elle giriş yerine panel verisinden otomatik hesaplanır.

Katalog, ağırlıklar, hedefler ve puan bantları yetkili kullanıcı tarafından değiştirilebilir; değişiklik geçmiş dönem puanlarını bozmaz. Katalog 28.1–28.9'daki ilkelerle (sağlıklı sıralama, veri kalitesi) birlikte uygulanır.

---

# 29. Kalite modülü

Kalite kayıtları teklif, proje, malzeme, sevkiyat ve saha uygulamasıyla bağlantılı olmalıdır.

## 29.1. Test ve sertifikalar

Takip edilebilecek sertifika/test türleri:

- galvaniz kaplama,
- çekme/kopma dayanımı,
- boyut kontrolü,
- betonla ilgili kalite testleri,
- diğer gerekli laboratuvar/kurum testleri.

Her sertifikada:

- tür,
- parti/lot,
- ilgili malzeme/üretim,
- test tarihi,
- sonuç/değer,
- geçti/kaldı,
- düzenleyen laboratuvar/kurum,
- geçerlilik tarihi,
- belge,
- ilgili proje/teklif/sevkiyat

görülebilir.

## 29.2. Süre uyarısı

Sertifika:

- geçerli,
- süresi yaklaşıyor,
- süresi doldu

şeklinde işaretlenir ve gerektiğinde yenileme görevi oluşur.

## 29.3. Saha kalite kontrolleri

Proje ihtiyacına göre:

- beton priz/mukavemet,
- panel kalite kontrolü,
- montaj kot/aks/terazi,
- kurum onayları,
- imalat uygunluğu

gibi kontrol kayıtları tutulabilir.

## 29.4. Uygunsuzluk ve DÖF (düzeltici/önleyici faaliyet)

Kalite, İSG, süreç veya müşteri kaynaklı her uygunsuzluk kaydedilir:

- kayıt türü (uygunsuzluk, DÖF, risk, iç denetim bulgusu, müşteri geri bildirimi/şikâyet),
- tarih, birim/süreç, proje,
- sorumlu kişi ve pozisyon,
- etki seviyesi (kritik / majör / minör),
- açıklama, fotoğraf/belge,
- kök neden,
- düzeltici ve önleyici aksiyonlar,
- hedef çözüm süresi (gün) ve gerçek çözüm süresi,
- aynı sorunun tekrar edip etmediği,
- durum (açık / kapalı) ve kapatma onayı.

Aksiyonlar görev sistemine düşer. Hedef süreyi aşan açık kayıt eskale olur. Tekrar eden uygunsuzluklar ayrıca işaretlenir ve raporlanır. Kayıtlar ilgili pozisyonun KPI puanına yansır.

---

# 30. İSG — İş Sağlığı ve Güvenliği modülü

## 30.1. Ramak kala ve kaza kaydı

Her olayda:

- olay türü,
- tarih,
- şantiye/fabrika,
- açıklama,
- ciddiyet,
- yaralanan/ilgili/tanık kişiler,
- alınan aksiyon,
- durum,
- fotoğraf/belge

tutulabilir.

Açık aksiyonlar görev sistemine düşer; ciddi kazalar yüksek öncelik olarak üst yönetime çıkar.

## 30.2. Eğitimler

Personelin:

- eğitim türü,
- eğitim tarihi,
- geçerlilik süresi

takip edilir. Süresi yaklaşan eğitim yenileme görevi oluşturur.

## 30.3. Günlük İSG kontrolü ve KKD

Şantiye/fabrika ihtiyacına göre günlük İSG kontrol listesi, kişisel koruyucu donanım zimmeti, risk değerlendirmesi ve ilgili kontroller panel kapsamında tutulabilir.

## 30.4. Güvenliğin hız/kâr hedefinin üzerinde olması

Performans veya hızlandırma sistemi hiçbir zaman güvenlik ihlalini ödüllendirmemelidir. İSG şartı sağlanmadan bir hız/prim hedefi “başarılı” sayılmamalıdır.

---

# 31. Yasal ve periyodik belge süreleri

Panelde yalnız üretim değil, şirketi riske atabilecek süreli belgeler de takip edilmelidir.

Örnekler:

- vinç periyodik kontrolü,
- araç muayenesi,
- sigorta,
- operatör belgeleri,
- çalışan eğitimleri,
- şirket/şantiye resmi belgeleri,
- kalite sertifikaları.

Yaklaşan son tarihler önceden görev ve uyarıya dönüşür.

---

# 32. Toplantı, aksiyon ve karar defteri

Şirket içinde yapılan toplantılar sözlü hafıza olarak kalmamalıdır.

## 32.1. Toplantı kaydı

Her toplantıda:

- tarih,
- başlık,
- katılımcılar,
- gündem,
- notlar

tutulur.

## 32.2. Karar kaydı

Her karar için:

- ne karar verildi,
- sorumlu kişi veya rol,
- son tarih,
- durum,
- belge/ek

görülebilir.

Karar oluşturulduğunda ilgili kişiye görev açılabilir.

## 32.3. Karar takibi

Tüm şirket kararları tek listede görülebilir:

- açık,
- tamamlandı,
- gecikti.

Geciken karar cockpit'e uyarı olarak çıkabilir.

Karar tamamlandığında hem karar hem ona bağlı görev kapatılır. Böylece “geçen toplantıda bunu konuşmuştuk, ne oldu?” sorusunun cevabı sistemdedir.

---

# 33. Evrak, dosya ve dijital arşiv

Amaç şirketin işiyle ilgili hiçbir kritik evrakı başka yerden aramak zorunda kalmamaktır.

## 33.1. Belge kaynağına bağlı yaşar

Belge ayrı, anlamsız bir klasöre atılmak yerine ilgili kaydın altında bulunmalıdır.

Örnekler:

- imzalı sözleşme → proje/sözleşme,
- imzalı hakediş → ilgili proje/şantiye/ay,
- bordro → ilgili personel ve dönem,
- zimmet tutanağı → personel + ekipman,
- ekipman faturası → ekipman kartı,
- tartım fişi → fire/hurda kaydı,
- sertifika → ilgili malzeme/lot/proje,
- saha fotoğrafı → günlük saha kaydı/zayi,
- dekont → ödeme/tahsilat.

## 33.2. Tek pencere arşiv

Arşiv ekranı şirket içindeki tüm bu belgeleri tek pencerede aramayı sağlar.

Filtreler:

- belge türü,
- modül/kaynak,
- proje,
- kişi,
- araç/ekipman,
- tarih aralığı,
- metin arama.

Sonuca tıklanınca belgenin asıl bağlı olduğu kayda gidilir.

## 33.3. Yetkiyi aşmayan arşiv

Arşivin tek pencere olması, herkesin tüm evrakları görmesi anlamına gelmez. Kullanıcı yalnızca normalde erişmeye yetkili olduğu kayıtlara ait belgeleri görebilir.

Örneğin saha mühendisi bir şantiye fotoğrafını görebilir fakat şirketin teklif maliyet dosyasını veya maaş bordrosunu göremez.

## 33.4. Drive'ın yerini alan tek arşiv

Panel, şirketin bugün Drive'da tuttuğu evrak arşivinin yerini alır. Drive, ortak klasör veya benzeri harici depolar paralel arşiv olarak kullanılmaz; belgeler panelin kendi depolamasında tutulur.

Bunun için:

- mevcut Drive arşivi panele aktarılır ve ilgili kayıtlara bağlanır; kayda bağlanamayan eski belgeler geçici olarak “sınıflandırılmamış” alanda tutulur ve zamanla bağlanır,
- belge sürümleri saklanır (imzalı son sürüm ve önceki sürümler),
- belge silinmez, gerekirse arşivlenir,
- toplu yükleme ve toplu indirme (örneğin bir projenin tüm belgeleri) yapılabilir,
- PDF ve görseller panel içinde önizlenir,
- arşiv düzenli yedeklenir ve yedekten geri dönülebilir.

---

# 34. Raporlama ve analitik

Panelde veriler yalnızca günlük operasyon için değil, geçmiş karşılaştırması ve yönetim analizi için de kullanılmalıdır.

## 34.1. Zaman bazlı raporlar

- günlük,
- haftalık,
- 15 günlük,
- aylık,
- dönemsel,
- proje başlangıcından bugüne

raporlar üretilebilir.

## 34.2. Rapor konuları

- şirket kâr-zarar,
- proje kâr-zarar,
- üretim miktarları,
- hedef-gerçekleşen,
- kişi/ekip/şantiye verimi,
- fire/zayi,
- stok tüketimi,
- malzeme maliyet trendi,
- fabrika birim maliyet,
- ekipman kullanım/atıl gün,
- hakediş ve tahsilat,
- cari,
- nakit projeksiyonu,
- performans/KPI,
- sözleşme yükümlülükleri,
- kalite/İSG,
- yan gelirler.

## 34.3. Trend ve benchmark

Zaman içinde:

- bu ay geçen aya göre,
- şantiye A şantiye B'ye göre,
- ekip A ekip B'ye göre,
- aynı tip iş geçmiş projeye göre

karşılaştırılabilir.

## 34.4. Dışa aktarım

Uygun raporlar PDF ve Excel olarak dışa aktarılabilir. Özellikle işveren gecikme kanıtı ve yönetim raporlarında yazdırılabilir çıktı desteklenmelidir.

## 34.5. Resmi günlük saha raporu

Onaylanan günlük saha kaydından standart formatta, yazdırılabilir/PDF günlük saha raporu otomatik üretilir; işverene gönderilebilir ve arşive eklenir.

Raporda:

- şantiye, proje, işveren, tarih, hava durumu ve sıcaklık,
- personel sayıları (mühendis, formen, işçi, vinç operatörü, bekçi vb.),
- vinç sayıları (kendi malı / kiralık),
- gelen beton ve yakıt miktarları,
- döküm genel durum özeti (panel tipi bazında bugün / kümülatif / kalan),
- montaj genel durum özeti,
- şerit genel durum özeti,
- duvar bazında çelik şerit montaj icmali,
- notlar ve sorumlu kişiler

bulunur. Geçmiş raporlar tarih ve şantiyeye göre listelenir ve toplu dışa aktarılabilir.

---

# 35. Yönetim, strateji, büyüme ve yıllık planlama

Panelin uzun vadeli hedefi yalnız operasyon değil, şirket yönetiminin stratejik kararlarını da desteklemektir.

## 35.1. Yıllık hedefler

- ciro hedefi,
- kâr hedefi,
- proje sayısı,
- kapasite hedefi,
- fabrika verim hedefi,
- teklif/kazanma hedefi,
- personel/organizasyon hedefleri

gibi yıllık planlar tutulabilir.

## 35.2. Bütçe vs gerçekleşen

Planlanan gelir/gider ile gerçekleşen karşılaştırılabilir.

## 35.3. Yatırım analizi

Yeni:

- vinç,
- kalıp,
- makine,
- araç,
- üretim ekipmanı

alımında maliyet, beklenen kapasite artışı, tasarruf ve geri dönüş süresi analiz edilebilir.

## 35.4. What-if / senaryo

“Bir vinç daha alırsak?”, “Kalıp sayısını artırırsak?”, “Fabrika kapasitesini yükseltirsek?”, “Bu projeyi daha erken bitirirsek?” gibi yönetim senaryoları veriye dayalı karşılaştırılabilir.

## 35.5. Şirket sağlık karnesi

Şirketin genel durumu tek bir yönetim bakışında:

- operasyon,
- finans,
- satış,
- insan kaynağı,
- kalite,
- İSG,
- uyum,
- nakit,
- kaynak kullanımı

başlıklarında değerlendirilebilir.

---

# 36. Tanımlar / sabit veriler yönetimi

Aynı bilgi farklı kişiler tarafından tekrar tekrar yazılmamalıdır.

## 36.1. Merkezi tanımlar

Yetkili kullanıcı tek yerden yönetebilir:

- panel tipleri,
- panel en/boy/m²,
- panel kademe/ilişki bilgisi,
- çelik şerit tipleri ve boyları,
- iş kalemleri,
- birimler,
- sarf malzemeler,
- sarf reçeteleri,
- gider kategorileri,
- birim fiyat tanımları,
- tedarikçiler,
- kritik stok eşikleri,
- roller,
- onay zincirleri,
- görev/escalation kuralları,
- çalışma takvimi (bkz. 23.9),
- teklif belge şablonları (bkz. 6.8),
- KPI kataloğu ve puan bantları (bkz. 28.11),
- revizyona tabi kayıt türleri ve onaylayıcıları (bkz. 37.1).

## 36.2. Proje özel tanımlar

Bazı veriler tüm projeler için genel, bazıları belirli proje için özel olabilir. Kullanıcı tanımın kapsamını seçebilmelidir.

## 36.3. Kendini geliştiren ortak listeler

Bir kullanıcı yeni bir gider veya malzeme kalemi girmek istediğinde sistem önce benzer mevcut tanımları göstermelidir.

Örneğin “Nakliye”, “Nakliye masrafı”, “Taşıma”, “Sevkiyat” gibi aynı anlamlı dört ayrı kayıt oluşmasının önüne geçilmelidir.

Gerçekten yeni bir kalemse ortak listeye eklenebilir. Yetkili admin zamanla benzer kayıtları birleştirip listeyi temiz tutabilir.

## 36.4. Geçmişi bozmayan değişiklik

Bir tanım veya fiyat bugün değiştirildiğinde geçmişte onaylanmış işlemlerin hesabı değişmemelidir.

Örneğin Haziran'da birim fiyat değişince Mart hakedişi geriye dönük bozulmamalıdır.

## 36.5. Sisteme geçiş ve mevcut verilerin aktarılması

Panel kullanıma alınırken şirketin mevcut verileri tek seferlik ve kontrollü şekilde aktarılır:

- Excel takip dosyaları (çelik şerit takip, sipariş, haddeci, sevkiyat, şantiye envanterleri),
- personelin geliştirdiği önceki paneldeki veriler (şantiyeler, günlük raporlar, şerit stok/sevkiyat, personel, araç, vinç, puantaj),
- Drive arşivindeki belgeler (bkz. 33.4),
- açılış stokları (bkz. 18.13), cari açılış bakiyeleri, demirbaş envanteri, personel özlük bilgileri.

Aktarım önce önizleme olarak gösterilir; eşleşmeyen veya hatalı satırlar listelenir, yetkili kişi onayladıktan sonra işlenir. Aktarılan kayıtlar “aktarım” kaynağıyla işaretlenir. Aktarımdan sonra yeni kayıt panel dışında tutulmaz.

Aynı içe aktarma aracı ileride toplu tanım girişi (malzeme kataloğu, personel listesi vb.) için de kullanılabilir.

---

# 37. Manuel müdahale ve istisna yönetimi

Panel mümkün olduğunca hesap ve akışları sistem üzerinden yürütmelidir; rastgele elle değiştirme yapılmamalıdır.

Ancak sahada veya ofiste olağan dışı bir durum yaşanabilir.

Bu durumda:

1. ilgili kullanıcı istisnai manuel işlem için izin talep eder,
2. yalnızca gerekli alan/işlem için yönetim izin verir,
3. manuel değişikliğin nedeni zorunlu açıklanır,
4. kim tarafından, ne zaman ve neden değiştirildiği geçmişte kalır.

Şirket sahibi gerektiğinde bu istisna yetkisini açıp kapatabilir.

## 37.1. Onaylı kayıtlar için revizyon talebi

Onaylanmış kayıtlar (günlük saha ve fabrika kayıtları, hakediş, açılış stoku, stok sayımı, malzeme tanımları vb.) içerik olarak kilitlenir. Değişiklik gerekiyorsa kayıt doğrudan düzenlenmez, revizyon talebi açılır:

1. talep eden, hangi alanın neden ve neye değişeceğini yazar,
2. talep yetkili onaylayıcıya görev ve bildirim olarak düşer,
3. onaylayıcı eski ve yeni değeri yan yana görerek onaylar veya gerekçeyle reddeder,
4. onaylanırsa değişiklik uygulanır ve etkilenen hesaplar (stok, maliyet, hakediş, performans) fark kadar düzeltilir,
5. talep sahibine sonuç bildirilir.

Kaydın ekranında revizyon geçmişi görünür. Bekleyen revizyon talepleri Onay Merkezi'nde, cockpit'te ve dönem kapanışı kontrol listesinde (bkz. 22.10) görünür. Hangi kayıt türünün hangi durumda kilitli olduğu ve kimin onaylayacağı merkezi olarak tanımlanır.

---

# 38. Kayıt geçmişi ve denetlenebilirlik

Şirketin “kayıp-kaçak olmadan devredilebilir” hale gelmesi için her kritik işin geçmişi görünür olmalıdır.

Bir kayıtta mümkün olduğunda:

- kim oluşturdu,
- ne zaman oluşturdu,
- kim değiştirdi,
- önceki değer neydi,
- yeni değer ne oldu,
- neden değiştirildi,
- kim onayladı,
- kim düzeltme istedi,
- hangi belge eklendi

görülebilmelidir.

Yanlış kayıt tamamen görünmez şekilde silinmek yerine düzeltme geçmişiyle korunmalıdır.

Bu özellikle şirket sahibinin gelecekte profesyonel yönetime devrettiği dönemde “arkamdan ne değiştirildi?” sorusunu cevaplamak için önemlidir.

---

# 39. Genel uyarı kataloğu

Panel aşağıdaki durumları merkezi uyarı sistemine dönüştürebilecek yapıda olmalıdır:

### Saha

- günlük kayıt eksik,
- kayıt geç gönderildi,
- onay gecikti,
- hedefin altında üretim,
- hedef üstü/fazla panel dökümü,
- yüksek zayi,
- fotoğrafsız zayi giriş girişimi,
- işveren dolgusu gecikti,
- olağan dışı uzun montaj/döküm süresi,
- yüksek saha harcaması.

### Stok / malzeme

- kritik stok,
- proje ihtiyacına göre yetersiz stok,
- yüksek fire,
- sevkiyat gecikti,
- malzeme talebi onay bekliyor,
- malzeme sahaya teslim teyidi bekliyor,
- kantar farkı toleransı aştı,
- stok sayım farkı,
- stok eksiye düştü,
- maliyeti bulunamayan tüketim.

### Ekipman

- bakım gecikmesi,
- periyodik kontrol yaklaşması/geçmesi,
- ekipman uzun süredir atıl,
- arıza açık,
- olağan dışı vinç/araç yakıt tüketimi,
- ayrılan personelde zimmet kalması.

### Finans

- hakediş uzun süredir onay bekliyor,
- tahsilat gecikti,
- cari bakiye riskli,
- nakit açığı yaklaşmakta,
- ödeme onay bekliyor,
- olağan dışı gider.

### İK

- bordro eksik,
- bordro imzası eksik,
- SGK/evrak son tarihi,
- izin onay bekliyor,
- işten çıkış checklist'i eksik,
- zimmet kapanmadı.

### Uyum / hukuk

- sözleşme son tarihi yaklaşıyor,
- ceza riski,
- teminat evrakı eksik,
- işveren yükümlülüğü gecikti,
- resmi belge süresi yaklaşıyor.

### Kalite / İSG

- sertifika süresi doluyor,
- başarısız kalite testi,
- açık kaza/ramak kala aksiyonu,
- eğitim süresi doluyor,
- kritik güvenlik aksiyonu kapanmadı,
- hedef süresi geçen uygunsuzluk/DÖF.

### Yönetim

- toplantı kararı gecikti,
- görev eskalasyon seviyesine ulaştı,
- kritik sistem önerisi bekliyor,
- dönem kapanışı gecikti,
- revizyon talebi bekliyor,
- cevapsız destek talebi.

---

# 40. Panelin genel arayüz ve kullanım özellikleri

Panelin tüm modülleri aynı kullanım diline sahip olmalıdır; kullanıcı her sayfada yeniden nasıl kullanılacağını öğrenmemelidir.

## 40.1. Sol dikey modül menüsü

Masaüstünde modüller solda dikey olarak, iş akışı + kullanım sıklığı + kurumsal mantığa göre gruplanır.

Önerilen düzen:

### Genel Bakış
- Cockpit

### Saha & Günlük
- Saha Kaydı
- Onay
- Şantiyeler
- Görevler
- Öneriler
- Günlük Raporlar

### Kaynak & Üretim
- Stok
- Satın Alma
- Ekipman
- Fabrika

### Ticari
- Teklif
- Finans
- Dönem Kapanışı

### Kurumsal
- İK
- Uyum
- Kalite & İSG
- Performans
- Toplantı & Karar
- Arşiv
- Destek

### Yönetim
- Tanımlar
- Kullanıcılar & Roller
- Revizyon Talepleri
- Denetim Kayıtları
- Veri Aktarımı

Kullanıcının yetkisi olmayan modül menüde bile görünmemelidir. Bir grubun altında hiç yetkili öğe yoksa grup başlığı da gizlenir.

## 40.2. Mobil görünüm

Telefonda sol menü hamburger ile açılır. Saha gibi günlük kullanılan alanlar büyük dokunma hedefleri, az yazı ve hızlı giriş mantığıyla kullanılmalıdır.

Panel önce telefona ana ekrandan kurulabilen web uygulaması olarak kullanılır; sistem oturduktan sonra aynı işlevleri sunan mobil uygulama yapılır. Her iki durumda da:

- görev, onay ve kritik uyarılar telefona anlık bildirim olarak gelir,
- şantiyede internet yoksa günlük saha kaydı, fotoğraf, vinç kaydı ve zayi girişi çevrimdışı yapılabilir; bağlantı gelince otomatik gönderilir, çakışma olursa kullanıcıya gösterilir,
- çevrimdışı girilen kaydın gerçek giriş zamanı korunur,
- fiş, tutanak ve saha fotoğrafları doğrudan kamerayla eklenir.

## 40.3. Üst bar

Üst bölümde gerektiği kadar:

- bildirim sayacı,
- görev/bildirim çekmecesi,
- çoklu rolü olanlar için rol seçici,
- kullanıcı/çıkış

yer alabilir.

## 40.4. Açık / koyu mod

Panel açık ve koyu görünümde kullanılabilir olmalıdır.

## 40.5. Kurumsal kimlik

GEOGES marka rengi konuşmada **#0F4C81** ana mavi olarak, panel/ikincil gri ise **#DDDBDB** olarak şekillenmiştir.

Durum renkleri marka renginden bağımsız anlam taşır:

- yeşil: olumlu/onaylı/kâr,
- amber/sarı: dikkat,
- kırmızı: kritik/zarar/gecikme,
- nötr gri: pasif/hazırlık.

Doğru GEOGES logo dosyası final tasarımda kullanılmalıdır; konuşmada geçici logonun doğru olmadığı ayrıca belirtilmiştir.

---

# 41. Standart liste ekranı özellikleri

Birçok modülde aynı liste şablonu kullanılmalıdır.

Liste ekranında:

- başlık,
- “Yeni” butonu,
- arama,
- hızlı durum filtreleri,
- küçük özet göstergesi,
- kayıt listesi

bulunur.

## 41.1. Satır / kart görünümü

Kullanıcı aynı listeyi istediği an:

- satır görünümü,
- kart görünümü

arasında değiştirebilmelidir.

Seçimi ekran bazında hatırlanır.

## 41.2. Sıralama

Modüle göre:

- tarih,
- tutar,
- durum,
- ad

üzerinden artan/azalan sıralama yapılabilir.

## 41.3. Yoğunluk

Kullanıcı:

- sık,
- ferah

görünüm seçebilir.

## 41.4. Gelişmiş filtreler

İhtiyaca göre:

- durum,
- proje,
- işveren,
- tarih aralığı,
- modüle özel diğer filtreler

kullanılabilir.

Seçilen görünüm ve sıralama tercihleri hatırlanmalıdır.

---

# 42. Standart detay ekranı özellikleri

Bir kaydın detayına girildiğinde üst bölüm her zaman en kritik bilgiyi göstermelidir.

Üstte:

- başlık,
- durum,
- geri dönüş,
- yapılabilecek eylemler,
- kilit rakamlar

bulunur.

Alt bölümler aç/kapat mantığıyla çalışır. En önemli bölüm varsayılan açık, diğerleri kapalı gelebilir.

Örneğin hakedişte:

- bilgiler,
- kalemler,
- tahsilatlar,
- belgeler,
- işlem geçmişi.

Ekipmanda:

- künye,
- lokasyon,
- amortisman,
- bakım,
- zimmet,
- belgeler.

Personelde:

- özlük,
- puantaj,
- bordro,
- izin,
- zimmet,
- belgeler.

---

# 43. Standart veri giriş formu özellikleri

Formlar kullanıcıya uzun ve karmaşık duvar gibi görünmemelidir.

Özellikler:

- mantıksal gruplar,
- zorunlu alanların net işareti,
- mümkün olan yerde yazmak yerine seçim,
- açılır liste,
- chip/düğme,
- sayaç,
- anahtar,
- otomatik hesaplanan alanlar,
- akıllı öneriler,
- taslak otomatik kayıt,
- altta sürekli erişilebilir kaydet butonu,
- seri kayıt için “Kaydet ve yeni ekle”.

Amaç hızlı giriş ve hata azaltmaktır.

---

# 44. Günlük saha ekranına özel tablo tasarımı

Günlük saha ekranı diğer genel formlardan farklı olarak şirketin üretim yapısına özel tutulmalıdır.

Döküm, montaj ve şerit bölümlerinde:

- her ürün/iş tipi bir satır,
- proje hedefi,
- kümülatif gerçekleşen,
- kalan,
- ilerleme,
- bugünkü giriş

aynı ekranda görünür.

Hedefi aşan satır belirgin kritik renge döner. Dar ekranda aynı veri kart biçiminde görüntülenebilir.

Sarf bölümü de üretim reçetelerinden otomatik oluşur.

Bu ekran sahanın her gün kullanacağı için mümkün olduğunca az klavye kullanımı, büyük dokunma alanı ve net toplamlar önceliklidir.

---

# 45. Uçtan uca örnek iş akışları

Aşağıdaki akışlar, paneldeki modüllerin birbirinden bağımsız değil tek şirket sistemi gibi çalışmasının hedeflenen sonucudur.

## 45.1. Yeni işten tahsilata

1. İşveren e-posta/telefonla talep gönderir.
2. Talep satış/iş geliştirme kaydına düşer.
3. Teknik inceleme ve yaklaşık miktar hazırlanır.
4. Teklif oluşturulur; tahmini maliyet ve marj görünür.
5. Görüşme/pazarlık yapılır.
6. Teklif kazanılır.
7. Sözleşme kaydı ve yükümlülükleri açılır.
8. Teknik proje/statik/kurum onayı takip edilir.
9. Proje ve şantiye oluşturulur.
10. Günlük saha üretimleri girilir ve onaylanır.
11. Onaylı üretim hakedişe akar.
12. Hakediş işverene sunulur ve onaylanır.
13. Fatura görevi oluşur.
14. Fatura kesilir.
15. Tahsilat girilir.
16. Cari bakiye azalır.
17. Proje gerçek kâr-zararı güncellenir.
18. İş sonunda teklif tahmini ile gerçek maliyet karşılaştırılır ve gelecek tekliflere ders olur.

## 45.2. Çelik şeridin siparişten sahada kullanıma kadar akışı

1. Proje ihtiyacı çıkar.
2. Haddecilerden fiyat/termin karşılaştırılır.
3. Sipariş verilir.
4. Malzeme fabrikaya gelir ve boy/adet kaydı yapılır.
5. Delme/işleme yapılır.
6. Oluşan fire hesaplanır.
7. Galvanize sevk edilir.
8. Galvanizden dönüş kaydı girilir.
9. Fark/fire kontrol edilir.
10. Şantiyeye sevk edilir.
11. Şantiye teslim alır.
12. Stok artar.
13. Günlük montajda şerit kullanılır.
14. Saha stoğu azalır.
15. Kritik seviyeye yaklaşıldığında talep/sipariş uyarısı oluşur.

## 45.3. Günlük saha üretimi

1. Saha mühendisi günlük kaydı açar.
2. Döküm/montaj/şerit ve saatleri girer.
3. İşveren teslim-tesellüm saatlerini girer.
4. Puantaj/faaliyet kaydını tamamlar.
5. Zayi varsa foto+neden girer.
6. Harcama varsa belge/açıklama girer.
7. Sarf tüketimi otomatik önerilir.
8. Kayıt koordinatöre gönderilir.
9. Koordinatör çapraz kontrol eder.
10. Eksikse düzeltme ister; tam ise onaylar.
11. Veri ilerleme, stok, hakediş, performans, finans ve cockpit'e dağılır.

## 45.4. Personel çıkışı

1. Personel “ayrılacak” olarak işaretlenir.
2. Çıkış checklist'i açılır.
3. Gerekli imzalı evraklar listelenir.
4. Zimmetler kontrol edilir.
5. Eksik telefon/laptop/araç varsa kritik uyarı çıkar.
6. Sözleşme/teminat açısından gerekli evraklar tamamlatılır.
7. Tüm zorunluluklar kapanınca çıkış süreci tamamlanır.

## 45.5. İşveren gecikmesi

1. GEOGES montajı bitirip alanı dolguya teslim eder.
2. Teslim saati kaydedilir.
3. İşveren işi geciktirir.
4. Geri teslim saati kaydedilir.
5. Panel gecikme süresini hesaplar.
6. Tekrarlayan gecikme şantiye tanı ekranında görünür.
7. Tahmini maliyet etkisi hesaplanır.
8. Sözleşme yükümlülüğüne bağlanır.
9. Gerektiğinde tarihli gecikme/kanıt dosyası hazırlanır.

## 45.6. Toplantı kararından tamamlanan göreve

1. Toplantı kaydı açılır.
2. Karar yazılır.
3. Sorumlu atanır.
4. Son tarih girilir.
5. Görev otomatik oluşur.
6. Kullanıcı bildirim alır.
7. Süre yaklaşınca hatırlatılır.
8. Gecikirse üst yönetime çıkar.
9. İş tamamlanınca görev ve karar kapanır.

## 45.7. Kritik sertifika / İSG olayı

1. Sertifika süresi yaklaşır veya İSG olayı açılır.
2. Panel ilgili sorumluya görev oluşturur.
3. Süre/aksiyon takip edilir.
4. Ciddi durum cockpit “Dikkat” bölümünde görünür.
5. Belge/aksiyon tamamlandığında kayıt kapanır.

## 45.8. Nakit sıkışması

1. Açık hakedişlerin beklenen tahsil tarihleri vardır.
2. Bordro, sipariş, kira ve yükümlülük ödemeleri geleceğe dağılır.
3. Panel 8 haftalık nakit çizelgesinde açığı önceden görür.
4. Yönetim uyarı alır.
5. Öneri ekranı geciken alacakların hızlandırılması gibi aksiyonları gösterir.
6. Görev gerektiğinde muhasebe/satış sorumlusuna atanır.

---

# 46. Panelin ulaşması gereken nihai yönetim davranışı

GEOGES Panel'in nihai işlevi, şirket sahibinin her şeyi tek tek insanlardan sormak yerine sistemden okuyabildiği bir yapı oluşturmaktır.

Panel kullanıldığında yönetici şu soruların cevaplarını doğrudan bulabilmelidir:

- Bugün hangi şantiyede ne yapıldı?
- Hedefe göre neredeyiz?
- Hangi ekip daha hızlı ve verimli?
- Hangi şantiyede işveren yüzünden bekledik?
- Neden bu proje zararda?
- Hangi malzeme ne kadar kaldı?
- Nerede fire oluştu ve hurdaya ne oldu?
- Hangi ekipman nerede ve kaç gündür atıl?
- Hangi ekipmanın bakım zamanı geçti?
- Hangi işverenden ne kadar alacağımız var?
- Kime ne kadar borcumuz var?
- Önümüzdeki haftalarda nakit açığı olacak mı?
- Hangi teklif cevap bekliyor?
- Hangi teklif gerçekten kârlı?
- Geçmişte benzer işi kaça mal ettik?
- Hangi personelin görevi gecikti?
- Bordrolar ve evraklar tamam mı?
- Hangi sözleşme yükümlülüğünün süresi yaklaşıyor?
- İşveren hangi yükümlülüğünü geciktirdi?
- Hangi sertifika/eğitim sona yaklaşıyor?
- Açık İSG aksiyonu var mı?
- Toplantıda aldığımız kararlar uygulandı mı?
- Şu an şirketin en önemli 5 problemi/fırsatı ne?
- Hangi vinç, araç, makine veya personeli başka yere yönlendirirsek daha fazla kâr ederiz?
- Bir projeyi daha erken bitirmek gerçekten daha kârlı mı?
- Şirketin genel sağlığı bugün, bu hafta ve bu ay nasıl?

Panelin hedeflenen son hali, bu soruların cevabını kayıtlı veri, görev, belge, onay ve analiz üzerinden vermelidir.
