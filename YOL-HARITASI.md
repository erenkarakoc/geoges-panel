# GEOGES Panel — Yol Haritası

Son güncelleme: 2026-09-25. Şu an **Faz 08 — İş akışı motoru** içindeyiz; fazın dört görevinin yapımı bitti — motor, tasarımcı, Onay Merkezi ve şablonlar — ve kalan iş sizin tarayıcı turunuz. Faz 07'nin yapım işi bitti; kalan tek işi **M1 yerel kabul turu** ve o sizde — siz turları sonraya bıraktığınız için faz kapanmadan Faz 08 başladı (D-278).

Bu dosya [ana yol haritasının](ai/MASTER_ROADMAP.md), [görev kayıtlarının](ai/TASKS.md) ve [güncel durumun](ai/CURRENT_STATE.md) okunması kolay özetidir. Faz sırası ve kapsam için bağlayıcı kaynak `ai/MASTER_ROADMAP.md`'dir. “Tamamlandı” temel altyapının kabulünü ifade eder; sonraki fazlardaki iş ekranlarının da yapıldığı anlamına gelmez.

## Tüm fazlar

| Faz | Kapsam | Güncel durum |
|---|---|---|
| **00 — Kurulum** | Depo, proje kuralları, standartlar ve geliştirme altyapısı | ✅ Tamamlandı |
| **01 — Gereksinimler** | 438 gereksinim, iş kuralları, rol-yetki matrisi ve veri sınıfları | ✅ Tamamlandı |
| **02 — Ekran tasarımı** | 108 ekranın envanteri, ekran durumları, gezinme ve uçtan uca kullanıcı akışları | ✅ Tamamlandı |
| **03 — Sistem mimarisi** | Modül sınırları, veri erişimi, olay omurgası, iş akışı ve arama mimarisi | ✅ Tamamlandı |
| **04 — Veritabanı mimarisi** | 222 tabloluk tasarım; kayıt geçmişi, kapsam, satır güvenliği ve defterler | ✅ Tamamlandı — 222, tasarlanan tablo sayısıdır |
| **05 — Altyapı tasarımı** | Ortamlar, CI, yedekleme, kurtarma ve işletim yönergeleri | ✅ Tamamlandı |
| **06 — Doğrulama denemeleri** | 17 deneme: yetki, kuyruk, depolama, metin tanıma, arama, canlı sinyal ve diğer riskler | ✅ Tamamlandı |
| **07 — Temel yapım** | Kimlik/yetki, denetim, kuyruklar, belgeler, görevler, bildirimler, tanımlar ve arama | 🔨 Yapım bitti; **M1 kabul turu** sahipte, o yüzden faz açık |
| **08 — İş akışı motoru** | Akış tanımları, sürümleme, çalıştırma, test, görsel tasarımcı ve onay merkezi | 🔨 **Devam ediyor — şu an buradayız** |
| **09 — Dilim 1** | Projeler, şantiyeler, duvarlar, günlük saha kaydı, onaylar, maliyet/zarar görünümü, sahip kokpiti ve resmî günlük rapor | ⬜ Başlamadı |
| **09R — Kayıt tipi oluşturucu** | Kullanıcının kendi kayıt türünü, alanlarını ve bunların akış/arama bağlantısını tanımlaması | ⬜ Dilim 1 pilotundan sonra; diğer dilimleri bekletmez |
| **10 — Dilim 2** | Malzeme, tartım, sevkiyat, stok defteri, sayım, satın alma, fabrika günlüğü, birim maliyet, galvaniz/fire ve hurda takibi | ⬜ Başlamadı |
| **11 — Dilim 3** | Hakedişler, gelir-gider, cari hesaplar, tahsilat/ödeme, nakit projeksiyonu, çoklu döviz ve dönem kapanışı | ⬜ Başlamadı |
| **12 — Dilim 4** | Ekipman, amortisman, bakım, vinç günlüğü; personel dosyası, puantaj, bordro ve izin | ⬜ Başlamadı |
| **13 — Dilim 5** | Müşteri adayları, ihale, teklif/kârlılık, teklif belgeleri, ürün satışları ve maliyet geri beslemesi | ⬜ Başlamadı |
| **14 — Dilim 6** | Sözleşme yükümlülükleri, sertifikalar, kalite/İSG, uygunsuzluk, toplantılar ve destek talepleri | ⬜ Başlamadı |
| **15 — Dilim 7** | Arşiv ve içerik araması, raporlama, performans/KPI, prim, öneriler, strateji ve bütçe-gerçekleşme | ⬜ Başlamadı |
| **15M — Panel MCP sunucusu** | Panelin, sahibin ve yetkili kişilerin sorularını kendi dilleriyle cevaplaması; asistan panele bağlanır, kullanıcının kendi yetkisiyle okur | ⬜ Dilimlerden sonra; kararlar alındı, yapımı başlamadı |
| **19 — Canlıya geçiş** | Gerçek veriden önce kendi sunucusuna geçiş, güvenlik/yük incelemesi, yedekten dönüş tatbikatı, eğitim ve şirket geneli kullanım | ⬜ Başlamadı |

16–18 numaraları, dilimler birleştirilirken kaldırıldı; atlanan iş yok. Faz 19, mevcut atıflar bozulmasın diye numarasını koruyor.

**15M — Panel MCP sunucusu (2026-09-23 eklendi).** Bitmiş ürün için, panelin içinde çalışan bir MCP sunucusu: asistan panele bağlanır, sunucunun kendi yetkisi yoktur, her çağrı soruyu soran kişinin kimliğiyle aynı satır güvenliğinden geçer. Yani kanal, o kişinin ekranda görebildiğinin tam olarak aynısını görür; yetkisiz kayıt yokmuş gibi davranır. Sahip iki kararı verdi: veri bulut bir modele çıkabilir ve kapı kullanıcının kendi yetkisi dahilinde her şeye açıktır. Okuma tarafı arama, kayıt detayı, yönetim kartları ve raporlar, görevler, bildirimler, onay kuyruğu ve revizyon talepleridir; belgelerde yalnız üstveri ve panel bağlantısı döner, imzalı depolama bağlantısı asla dışarı çıkmaz. Yazma tarafı sahibin kararıyla **yalnız taslakla sınırlı**: kanal bir taslak hazırlar, kişi paneli açıp onaylayana kadar hiçbir şey yürürlüğe girmez. Görev açmak, not yazmak veya revizyon talebi başlatmak doğrudan kanaldan yapılmaz; onay, imza ve para-stok-personel kaydı da panelde kalır. Araç yüzeyi her modülün kendi kaydından toplandığı için sıra dilimlerden sonradır: bugün yapılsa yüzeyin büyük bölümü henüz yok. KVKK sorusu da sahibin kararıyla kapandı (D-271): kanal kurulabilir ve **İK modülü de kanalda** olacak; her okuma yine kişinin kendi yetkisi dahilinde ve denetim kaydıyla. Gerçek personel verisi panele girmeden önceki hukuki değerlendirme (OQ-024) Faz 19 kapısı olarak yerinde duruyor.

## Faz 08 — Ayrıntılı durum (şu an burada)

Motor, panelin süreçleri yürüten parçası: bir olay olduğunda ya da saati geldiğinde akışı başlatır,
adım adım yürütür, birinin onayını ya da bir görevin kapanmasını bekler, sonra devam eder.

**Fazın şekli iki kararla belirlendi (24 Eylül):** motor, kayıtları Faz 09-11'de gelecek gerçek
akışlar yerine **deneme kayıt türüyle** uçtan uca kabul edilecek (D-279) — sekiz gerçek şablon kendi
diliminde etkinleştirilip orada kabul edilir; ve **yetenek kataloğu** mevcut beş modül için de
yazıldı (D-280). Plan: `docs/features/phase-08-workflow-plan.md` (D-281, sahip onayladı).

| Görev | İş ve teslim edilenler | Güncel durum / kalan |
|---|---|---|
| TASK-0118 | Yetenek kataloğu ve sözleşme testi: her modül ne yapabildiğini ilan eder, CI ilan ile kodu karşılaştırır | ✅ Tamamlandı; beş modül 25 yetenek ilan etti, test ilk koşuşunda dört gerçek ayrışma buldu |
| TASK-0117 | Motor çekirdeği: sürümlü tanım, örnek, yürütme, tetikleyiciler, adım paleti, koşullar, kuru mod | ✅ **Tamamlandı** — dört tetikleyici, on dört adımın hepsi, iki tür koşul, motorun sınırları ve kuru mod; on iki göç (0045-0056) |
| TASK-0119 | Görsel tasarımcı ve soru-cevap (ikisi de aynı JSON'u üretir) | ✅ **Yapımı bitti** (25 Eylül, beş adımda; plan D-283, siz onayladınız) — kalan tek iş sizin tarayıcı turunuz |
| TASK-0120 | Onay Merkezi'nin motorun açtığı gerçek kuyruğa bağlanması ve sekiz şablonun gelmesi | ✅ **Yapımı bitti** (25 Eylül, altı adımda; plan D-285) — gerçek onay kuyruğu, 27 şablon, çalışma günlüğü, "Yeni akışlar"; fazın kabul testi üç varsayılan akışı motordan geçiriyor — kalan tek iş sizin tarayıcı turunuz |

### Motorun parçaları

| Parça | Durum |
|---|---|
| Sürümlü tanım, taslak, yayın | ✅ Yayımlanmış sürümün tanımını **kimse** değiştiremiyor (yönetici bağlantısı dahil); aynı anda tek yayımlanmış sürüm tekil indeks |
| Denemesiz yayın yasağı | ✅ Yayın, **tam olarak bu tanımın** geçmiş bir denemesini istiyor; tanım denemeden sonra değişirse kanıt geçersiz (içerik özeti) |
| Örnek, adım durumları, çalışma günlüğü | ✅ Örnek **başladığı sürümü** tutuyor; tek örnekli akışta kayıt başına tek koşu; günlük adımın kendi ayrıntısını da taşıyor |
| Motorun sınırları | ✅ Bitmeyen döngü sayılarak durduruluyor; sınır bir istisna değil **kayıtlı bir sonuç** |
| Tetikleyici: olay | ✅ Yayımlanan akış aynı anda dinlemeye başlıyor; abonelik yayının kendisi tarafından yazılıyor; aynı teslimat ikinci koşu açmıyor |
| Tetikleyici: saat | ✅ "Her gün 07:30" ya da "her 30 dakika"; her koşu ait olduğu **zaman dilimini** taşıyor |
| Tetikleyici: elle | ✅ Ayrı bir kapı; tasarım yetkisi istiyor (motorunki istemiyor, çünkü motor sistemin kendisi) |
| Tetikleyici: eşik | ✅ Olayı herkes gibi duyuyor, sonra yükündeki değer eşiği geçiyor mu diye soruyor; ölçecek şeyi olmayan olay akışı başlatmıyor |
| Adımlar: başlangıç, koşul, bitiş | ✅ |
| Adım: onay | ✅ Üç sonuç; gerekçesiz ret/geri gönderme **tablonun kısıtıyla** reddediliyor; karar akışı kendisi yürütmüyor, olay olarak geri geliyor |
| Adım: görev | ✅ Motor görevi kendi yazmıyor, **kataloğun aksiyonunu** çağırıyor; görev kapanınca akış devam ediyor |
| Adım: bekleme (süre) | ✅ Bellekte zamanlayıcı değil **veritabanında satır**; sekiz saatlik bekleme yeniden başlatmayı atlatıyor |
| Adım: bildirim | ✅ Yine kataloğun aksiyonu üzerinden |
| Adım: eskalasyon | ✅ Onay taşınıyor (kopyalanmıyor); kime taşınacağı zamanlayıcı çaldığında hesaplanıyor; cevaplanmış onay taşınmıyor |
| Adım: kilit | ✅ Bir geçişi kapatıyor ve nedenini söylüyor; aynı akış ikinci kilidi yığmıyor; yalnız sahip ve GM gerekçeyle aşabiliyor, aşma denetim kaydına yazılıyor |
| Adım: paralel dal + birleşme | ✅ Her yol kendi koşusu (çocuk örnek): kendi günlüğü, kendi beklemesi, kendi adım sınırı; son dal bitince ana akış devam ediyor; hata veren dal ana akışı kendi gerekçesiyle durduruyor |
| Adım: her biri için | ✅ Liste, kaydın sahibi modülün yeteneği; her öğe bir dal; boş liste hata değil, uzun liste akışı durduruyor; iç içe kullanım tanımda reddediliyor |
| Adım: alt akış | ✅ Başka bir yayımlanmış akışı çocuk olarak başlatıp bekliyor; üç kademe derinlik sınırı; yayımlanmamış akış koşuyu durduruyor |
| Adım: kayıt oluştur / durum değiştir | ✅ Motor kendi yazmıyor, modülün aksiyonunu çağırıyor ve hangi akış/sürüm/adım sorduğunu iletiyor; defteri kesinleştirmeyi modül reddediyor, koşu modülün sözleriyle duruyor |
| Adım: eskalasyon (ayrı adım) | ✅ Üste haber verip devam ediyor (D-282, sahibin cevabı): muhatabına görev ve bildirim, günlüğe kime iletildiği; hiçbir şey beklemiyor, çünkü uyarı için duran akış uyarı değildir |
| Koşullar: alan | ✅ Kaydın verisiyle değerlendiriliyor; hangi daldan neden gidildiği günlükte |
| Koşullar: geçmişe bakan | ✅ Sayım sorgusu, **her seferinde taze**, kendi süre sınırıyla (2 sn); sınır aşılırsa akış sessizce "hayır" demiyor, **gerekçesiyle duruyor** |
| Kuru mod (deneme çalıştırması) | ✅ **Gerçek çalışmanın ta kendisi**: adımın yaptığı şey bir portun arkasında, deneme hiçbir şey yazmayan bir port veriyor |

### Tasarımcının parçaları (TASK-0119)

| Parça | Durum |
|---|---|
| Akış listesi (SCR-195, asgari) | ✅ Ad, tetik, durum, sürüm, son yayın; telefonda kart, masaüstünde tablo; "Yeni akış" çalışıyor |
| Yeni akış | ✅ Tek soru — akışın adı; adresi addan türüyor (Türkçe harfler sadeleşir, alınmış adres numaralanır), akış bir başlangıç ve bir bitişle açılıyor |
| Şema alanı (kutu-ok) | ✅ Tek özel arayüz öğesi (D-224); kütüphanenin yalnız motoru kullanılıyor, kütüphane **yalnız bu rotada** indiriliyor |
| Yerleşim | ✅ Saf fonksiyon: şemanın ne çizeceği tarayıcı olmadan testte okunuyor; kimsenin bağlamadığı adım da çiziliyor |
| Klavye | ✅ Şema **tek Tab durağı**; oklarla kutular, Enter panel, Escape şema (SPIKE-07'nin notu) |
| Telefon | ✅ Tam düzenleme; panel alttan çekmece; mini harita telefonda **hiç çizilmiyor** (saklanmıyor) |
| Adım ekleme/çıkarma | ✅ Her okun üstünde "+" ve palette on dört adım; yeni adım iki kutunun **arasına** giriyor; ortadan çıkarılan adımda akış kopmuyor |
| Adımın soruları | ✅ On dört adımın kendi soruları; hiç adım seçilmemişken akışın kendi sorusu ("Ne olunca başlasın?") |
| Seçenekler nereden geliyor | ✅ **Modüllerin ilanından**: olaylar, koşulun okuyabileceği alanlar ve sahiplik ilişkileri kataloğun kendisi (REQ-WFL-003, D-280); roller, kişiler ve diğer akışlar sahibi modülden |
| Hata işaretleri | ✅ Şemanın kendi bulguları, ait olduğu adıma bağlı; ekranın ikinci bir kontrol listesi yok |
| Kaydetme | ✅ Otomatik ve yazmanın bir adım gerisinde; şemanın reddettiği taslak **gönderilmiyor**, çünkü veritabanı da aynı şemayı tutuyor |
| Deneme çalıştırması | ✅ İşçiden **isteniyor**, istek içinde koşulmuyor (D-284); sonuç adım adım, kime düşeceğiyle; "hiçbir şey oluşmadı" aynı pencerede yazıyor |
| Deneme: örnek kayıt | ⬜ Boş örnekle çalışıyor; örnek kayıt seçimi kayıt türleri gelince (Faz 09R, D-105) — ekran bunu kendi söylüyor |
| Yayın | ✅ Onay penceresi: hangi sürüm yayına, hangisi geçmişe, kaç koşu başladığı sürümle devam edecek, denetim ve bildirim; yalnız **bu tanımın** geçmiş denemesiyle açılıyor |
| Başlıktaki "…" | ✅ Kopyasını çıkar (kendi taslağı olarak), akışı kapat (gerekçesiyle, silme değil), sürüm geçmişi |
| Kutuları elle taşımak | ⬜ Bu görevin dışında bırakıldı (D-283) |
| Tasarım içinden yeni yetki tanımlamak (REQ-WFL-021) | ⬜ Bu görevin dışında bırakıldı (D-283) |

### Onay Merkezi ve şablonların parçaları (TASK-0120)

| Parça | Durum |
|---|---|
| "Bu onay bana neden geldi" | ✅ Akışın kullandığı kural onayla birlikte duruyor; cümle bugünkü adlarla kuruluyor ("Genel Müdür rolünü taşıdığınız için sizde"), bilinmeyen ad için bile kod değil cümle |
| Gruba düşen onay | ✅ Rolü ya da yetkiyi taşıyan herkes görür, biri cevaplar — sahip onayı tam olarak bu; kişi ayrılınca hiçbir yer elle düzeltilmez |
| Vekâlet | ✅ Vekil, yerine baktığı kişinin onaylarını "vekâleten" etiketiyle görür (şimdilik şirket kapsamlı vekâlet; onay kaydın kapsamını taşımıyor) |
| Onay kuyruğu (SCR-012) | ✅ Tek kayıt ekranı doldurur, kararla sıradaki açılır; üç sonuç; ret ve düzeltmede gerekçe zorunlu; daha önce düzeltmeye döndüyse son gerekçe kartta |
| Rozet sayısı | ✅ Gerçek sayı ve üç yerde aynı: çalışma katmanı, "Bugün", Onay Merkezi |
| Kartta kaydın zengin özeti (tutar, belge, tutarsızlık) | ⬜ Kaydın sahibi modüller gelince (Faz 09R ve dilimler); kart bugün bunu açıkça söylüyor |
| Şablonlar | ✅ 27 şablon: dokuz bağımsız akış, dış taraf onayı alt akışı ve sekiz uçtan uca sürecin bütün zincir halkaları |
| Kopya kuralı | ✅ Kopya geldiği şablonu ve sürümü hatırlar; şablon güncellenince kopya değişmez, rozet çıkar ve sahibine bir kez haber gider |
| Şablona sıfırla | ✅ Yeni taslak yazar, yayındakinin üstüne yazmaz; denetim kaydına geçer |
| Aylık saat tetikleyicisi | ✅ "Her ayın 25'i" gibi (D-286); şubat atlanmasın diye 28 ile sınırlı |
| Çalışma günlüğü (SCR-197) | ✅ Her çalışma nerede duruyor, kimi bekliyor; açınca adımlar sırayla |
| Yeni akışlar | ✅ Son bir haftada yayımlanan akışın gerçekten ne yaptığı, atılan adımlardan sayılarak |
| Fazın kabul testi | ✅ Günlük saha kaydı onayı, malzeme çıkışı ve ödeme onayı şablondan kopyalanıp, denenip, yayımlanıp gerçek olayla tetikleniyor ve rolü taşıyanın kuyruğundan cevaplanıyor |
| Diğer şablonların gerçek kayıtlarla kabulü | ⬜ Kendi dilimlerinde (D-279); altısı henüz hiçbir modülün yayımlamadığı bir listeyi bekliyor ve test bunu gerekçesiyle söylüyor |

### Son doğrulamalar

- **Yetenek kataloğu kuruldu (TASK-0118).** İlan, çalıştıran fonksiyonu taşıyor; "ilan var, kod yok"
  bir test hatası değil **derleme hatası**. Sözleşme testi derleyicinin göremediği üçüne bakıyor: ilan
  modülün kendi REQ kataloğuyla uyuşuyor mu, ilan edilen olaylar gerçekten yayımlanıyor mu (ve
  yayımlanan her olay ilan edilmiş mi), bir zamanlar yayımlanmış bir yetenek kaybolmuş mu. İlk
  koşuşunda **dört gerçek ayrışma** buldu: kodun yayımladığı dört olayın hiçbir katalogda adı
  geçmiyordu, yani hiçbir akış onları duyamazdı. Kayıtlara eklendi.

- **Motor uçtan uca çalışıyor (D-279'un istediği gibi).** Gerçek bir olay gerçek outbox'tan
  yayımlanıyor, teslimat oluşuyor, motor akışı yürütüyor ve çalışma günlüğü hangi daldan **neden**
  gidildiğini söylüyor. Aynı teslimat ikinci kez gelince hiçbir şey değişmiyor. Kullanılan kayıt tipi
  yalnız testin içinde yaşayan bir deneme tipi; hiçbir modül beklenmedi.

- **Kuru mod, gerçek çalışmanın ta kendisi (SPIKE-05).** Adımın *yaptığı* şey tek bir portun
  arkasında; deneme, hiçbir şey yazmayan bir port veriyor. Koşullar gerçek veriyle değerlendiriliyor,
  sahipler gerçekten hesaplanıyor, ama örnek/onay/görev/bildirim/zamanlayıcı **hiç** yazılmıyor —
  testi bunu üçünü de sayarak doğruluyor. Sapabilecek ikinci bir değerlendirici yok.

- **Testler üç gerçek motor kusuru buldurdu.** (1) Açık adımda bekleyen örnek yeniden yürütülünce
  aynı adıma ikinci kez giriyordu — tekrar gelen teslimatın yaptığı şey buydu. (2) Görünürlük
  politikasındaki bir alt sorgu dıştaki kimliği gölgeliyor, koşuyu tam da beklediği kişiden
  gizliyordu. (3) Olay kodunu `case` ile seçen bir yayın çağrısı veritabanına doğru şeyi, sözleşme
  testine hiçbir şeyi söylüyordu.

- **Bir kusuru siz buldunuz.** Panel açılmıyordu: iş kayıt defteri olaysız aboneyi reddediyor, motorun
  listesi ise bilerek boş (neyi duyacağı yayımlanmış tanımlarda yazıyor). Abone artık bunu açıkça
  söylüyor (`dynamicEvents`), denetim herkes için duruyor. Birim testlerinin hiçbiri worker'ı
  başlatmadığı için testler bunu yakalayamazdı; dev sunucusunu çalıştırıp worker'ın kuyruğu
  boşalttığını izleyerek doğruladım.

- **Tasarımcı, 25 Eylül'de beş adımda kuruldu** ve her adımı kendi testleriyle geldi: yerleşim ve
  düzenleme saf modüller (32 birim testi), denemenin istenmesi/okunması, kopya ve kapatma dört
  veritabanı testi. Ekranın kendi kontrol listesi yok: geçerli tanım nedir sorusunu **yalnız**
  `definitionSchema` cevaplıyor, yani ekran motorla çelişemiyor.

- **Bir mimari kararı yazıya geçirdim (D-284).** Deneme çalıştırması motorun kendi döngüsü ve motor
  işçinin bağlantısında çalışıyor; istek kodu o bağlantıyı asla tutmuyor. Bu yüzden ekran denemeyi
  *istiyor*, işçi bir-iki saniye içinde koşuyor, ekran de kanıt satırını bekliyor. Bunun iki
  görünen sonucu var ve ikisi de ekranda yazılı: sonuç anında değil bir-iki saniye sonra geliyor ve
  örnek kayıt şimdilik boş.

- **Tasarımcı tarayıcıda henüz gezilmedi.** Dev sunucusunun oturumu düştü ve parolayı siz
  yazıyorsunuz; bu yüzden TASK-0119'un kalite kapısı sizin turunuz: akış aç, adım ekle, sorularını
  cevapla, denemeyi çalıştır, yayımla.

Bugüne kadar: **on iki göç** (0045-0056), **355 birim testi**, **337 veritabanı testi**. Her adım
kendi testleriyle geldi.

**Fazın bilinen riski (D-278):** motor, temelin sizin kullanımınızla doğrulanmadığı bir zeminde
kuruluyor. M1 turundan çıkacak bir düzeltme temeli değiştirirse, üstünde motor dururken yapılacak.

## Faz 07 — Ayrıntılı durum (yapımı bitti)

| Görev | İş ve teslim edilenler | Güncel durum / kalan |
|---|---|---|
| M0 ve erken kabuk işleri | Giriş, TOTP 2FA, parola sıfırlama, rol başlangıcı, uygulama kabuğu, tema ve gezinme | ✅ Tamamlandı; ek hesap güvenliği TASK-0112'de |
| TASK-0099 | Modül sınırları, bağımlılık kuralları ve SQL erişim denetimi | ✅ Tamamlandı |
| TASK-0100 | GitHub CI: kalite kontrolleri ve temiz veritabanında göç/geri dönüş testleri | ✅ Tamamlandı |
| TASK-0101 | PostgreSQL veri erişimi, göçler, sınırlı çalışma rolü, işlem-yerel kimlik ve TLS | ✅ Tamamlandı |
| TASK-0076 | Örnek veri/yapılandırma sıfırlama, dışa/içe aktarma ve gerçek veri kilidi | ✅ Tamamlandı |
| TASK-0102 | Kapsamlı roller, hiyerarşi, kişisel istisnalar, etkin rol, vekâlet ve görünürlük | ✅ Tamamlandı |
| TASK-0103 | Denetim kaydı, kayıt geçmişi ve değişiklik gerekçesi | ✅ Tamamlandı |
| TASK-0104 | Olay kuyruğu, iş kuyruğu, zamanlayıcı, yeniden deneme ve okuma modeli altyapısı | ✅ Tamamlandı |
| TASK-0105 | Kataloglar, tarihli kurallar ve özel alanlar | ✅ Tamamlandı; aynı zaman damgalı düzeltme sıralaması 0026 ile ayrıca düzeltildi |
| TASK-0106 | TCMB döviz kuru, iş günü takvimi ve tatiller | ✅ Tamamlandı |
| TASK-0107 | R2 depolama, imzalı bağlantılar, sürdürülebilir yükleme, metin tanıma ve toplu indirme | ✅ Temel altyapı tamamlandı; arşiv içerik araması Faz 15'te |
| TASK-0108 | Görevler, görev verme formu, bildirim çekmecesi, canlı sayaç, telefon bildirimi, günlük özet ve gecikme uyarıları | ✅ Çekirdek tamamlandı; gerçek telefonda push kabulü açık, e-posta sağlayıcısı seçilene kadar özet dosyaya yazılıyor |
| TASK-0109 | Revizyon talebi, eski/yeni karşılaştırması, gerekçeli karar, düzeltme hareketi ve bildirim bağlantısı | ✅ Çekirdek tamamlandı; iş kaydı uygulayıcıları ilgili modül dilimlerinde |
| TASK-0110 | Site geneli arama: yetkili sonuçlar, Türkçe eşleşme, öneri, tür grupları, son açılanlar ve yeniden dizinleme | 🔨 Bu fazda yapılabilecek işi bitti; gerçek kayıt kaynaklarıyla kabulü Faz 09'da — ayrıntı aşağıda |
| TASK-0113 | Ana ekrana ekleme, uygulama simgeleri, mobil dokunma alanları ve görev kartları | 🔨 Yapıldı; ana ekrana kurulum ve gerçek cihazda bildirim kabulü **gerçek bir adres** bekliyor. Sahip tünel istemedi (D-274); barındırma bağımlılığı DEF-008 |
| TASK-0028 | Sayfaya göre eylem/kaydetme düğmeleri taşıyan sabit alt şerit | ✅ Tamamlandı; 24 Eylül turunda masaüstünde ve 375 px'te görüldü: bant kartın altında, içerik bandın yüksekliği kadar boşluk alıyor, telefonun gezinme çubuğu bant varken çekiliyor ve bandın düğmesi içinde olmadığı formu gönderiyor |
| TASK-0112 | Tek kullanımlık 2FA kurtarma kodları, giriş kilidi, hareketsizlik/oturum sonu ve ikinci faktör sıfırlama | ✅ Tamamlandı (göç 0038-0043); tarayıcı turunda giriş, oturum satırları, kurtarma kodu ekranı ve giriş kilidi gerçek ekranda doğrulandı, turda çıkan üç kusur düzeltildi |
| Kullanıcılar & Roller (asgari) | Yöneticinin ikinci faktör sıfırlama düğmesi için asgari kişiler ekranı (D-273) | ✅ Kuruldu (`/users-roles`, göç 0043): kişiler, iki adım durumu, kalan kurtarma kodu ve açık oturum **sayıları**, "İkinci faktörü sıfırla". Rol, yetki ve vekâlet kendi ekranının işi; bu ekran o tasarım gelince değiştirilecek. 24 Eylül'de tarayıcıda görüldü: dar pencerede sıfırlama düğmesi kenarın dışında kalıyordu, telefon/dar pencere artık kart listesi |
| TASK-0111 — M1 | Sahibin kendi makinesinde kurulum, 2FA ile giriş ve uçtan uca kabul turu | ⬜ Faz 07'nin kapanış kabulü; **kontrol listesi hazır** ([m1-local-acceptance.md](docs/features/m1-local-acceptance.md)), tur sahibinde |

“Bugün” ekranının adlandırması (TASK-0043) ve odak/erişilebilirlik düzeltmeleri (TASK-0054) de tamamlandı.

### Faz 07'de kalan işler

Fazın yapım işi bitti. Kalan üç şeyin hiçbiri kod işi değil: **M1 turu** sahibinde, **TASK-0113'ün** ana ekran ve bildirim kabulü gerçek bir adres bekliyor, **aramanın** son iki maddesi modüller kendi kayıt kaynaklarını kaydettiğinde Faz 09'da kabul edilecek.

### Arama — TASK-0110 ayrıntısı

| Parça | Güncel durum |
|---|---|
| Yetki, kapsam ve veri sınıfına göre arama | Kuruldu; yetkisiz kayıtların sonuç, sayı ve öneriye sızmaması test edildi |
| Türkçe harf eşleştirme, bütün sözcüklerle eşleşme ve yazım önerisi | Kuruldu ve test edildi |
| Sözcük yardımcıları ve olaylarla güncelleme | Kuruldu; kayıt taşıma, silme ve eski olay senaryoları test edildi |
| Tür başına beş sonuç ve “Tümünü gör” | Kuruldu; bir türün diğerinin sonuçlarını bastırmaması test edildi |
| Son açılanlar | Yalnız adresler kullanıcıya göre oturumda tutuluyor; başlıklar güncel yetkiyle yeniden okunuyor |
| Mobil palet | Tam ekran, kayan liste, sabit COSS footer ve kapatma düğmesi 390 px tarayıcı görünümünde doğrulandı |
| Kaynaktan yeniden dizinleme | Geçici veri kümesi, karşılaştırma, tek işlemde yayın ve hata halinde geri dönüş kuruldu |
| Küçük veri kümesinde hız | 56 sentetik kayıtta p95 koşudan koşuya 250-303 ms arasında geziniyor; bu ölçekte süreyi ağ turu belirlediği için artık belirleyici sayı büyük veri satırındaki ölçüm. (Tarihçe: 0025 öncesi 348 ms, sonra 255-279 ms) |
| Normalleştirme sürümü | Satır, sözcük eşlemeleri, kova ve sözlüğün tamamına eklendi (0029); yazma yalnız yürürlükteki sürüme, okuma yalnız yürürlükteki sürümden yapılıyor ve bütünlük denetimi sürüm bazında karşılaştırıyor. Görünür eski sürümde kontrollü hata korunuyor; 0035'te bu reddin atlandığı bir gerileme oluştu ve kendi testiyle yakalanıp düzeltildi |
| Yardımcı bütünlüğü | 0028 ile eşlemeler, kova dizileri ve sözcük sayıları doğrudan arama metninden türetilip karşılaştırılıyor; bozuk yayın reddediliyor ve işletim komutu aynı denetimi kullanıyor. 0030 ile kullanıcı sorgusunda da sınırlı bir denetim var: dönen kayıtlar için kova üyeliği kontrol ediliyor, cevap değişmiyor, kullanıcıya bir şey gösterilmiyor. Var olup bir kimliği düşmüş kovanın kaydı gizlemesi bu yolla görülemez; o yön tam taramanın işi olarak kalıyor |
| Çoklu kapsam | Kuruldu (0037, D-270): sahibin kararı "birine yetki yetsin". Hem şantiye hem proje taşıyan bir kayıt, yerlerinden herhangi birine yetkili olana görünüyor; her yer bütün olarak değerlendiriliyor, yani bir yerin hem görme yetkisini hem de ticari/hassas sınıf iznini vermesi gerekiyor. Ayrı yerlerden toplanan yarım yetkiler birleşmiyor |
| Eşzamanlı kaynak değişiklikleri | Gerçek kaynak ve olay kuyruğuyla commit/geri alma, taşıma/silme, tarama sırasının gerisine ekleme ve tekrar teslim sınandı. Yakalanan değişiklikler kuyruk işleyicisi çalışmadan yayın adayına yansıyor; hata eski sürümü koruyor |
| Yayın öncesi olay yakalama | Uygulandı ve küçük veri kümesinde doğrulandı. Geç tamamlanan düşük numaralı olaylar da yakalanıyor; belirlenen sınırdan sonrakiler normal kuyruktan işleniyor |
| Büyük veri | **20.000 kayıtla ölçüldü (23 Eylül).** İlk ölçümde arama hedefin çok üstündeydi: yaygın bir sözcük 942 ms, iki sözcük 1.250 ms. Beş göçten sonra (0031-0035) örneklenen altı sorgunun tamamı **90-287 ms**, yani 300 ms hedefinin içinde — ağ turu dahil. Dizin kayıt başına yaklaşık 260 bayt yer tutuyor; 20.000 satırın tam bütünlük taraması 1,5-2,4 sn. Yeniden kurma maliyeti de ölçüldü: 20.000 kaydın kaynaklardan yeniden kurulması on dakikada bitmiyordu, 0036'dan sonra **29 saniye** (2.000 kayıt 4,7 sn). Açık kalan: çok sayıda kaydın paylaştığı bir sözcükte sıralama hâlâ bütün eşleşmeleri okumak zorunda ve gerçek veri şekliyle doğrulama |
| Gerçek kaynaklarla tarayıcı kabulü | Modüller kendi dilimlerinde arama kaynağını kaydedecek; gerçek telefon klavyesiyle kabul de açık |

**Arama henüz tamamlandı sayılmıyor,** ama bu fazda yapılabilecek işi bitti: hız kapısı 20.000 kayıtta geçildi, yeniden kurma 29 saniyeye indi, çoklu kapsam kuruldu. Kalanlar Faz 09'a bağlı: modüller kendi arama kaynaklarını kaydedince gerçek kayıtlarla tarayıcı kabulü, ve çok büyük hacimde tek bir sözcüğü paylaşan yüz binlerce kayıtta sıralama.

### Faz 07'nin son doğrulamaları

- **M1 kontrol listesi yazıldı (TASK-0111, 24 Eylül).** Kurulum yönergesi paneli nasıl çalıştıracağınızı söylüyordu, çalıştıktan sonra ne yapacağınızı söylemiyordu. Tur artık yazılı: [m1-local-acceptance.md](docs/features/m1-local-acceptance.md) — on bir adım, her birinde *ne yapacağınız* ve *ne görmeniz gerektiği*. Başında bilerek yapılmayanların tablosu var (modül ekranları, iş akışı tasarımcısı, aramada gerçek kayıt sonuçları, telefona bildirim), çünkü yoksa henüz gelmemiş bir dilim hata olarak not alınır. Geri bildirim düzeltmeyse görev, kapsamı değiştiriyorsa CHG olur.

- **Tarayıcı turu yapıldı (24 Eylül, sahip giriş yaptı).** Alt bant, hesap güvenliği ve panelin kendi oturumu gerçek ekranda doğrulandı: iki canlı oturum satırı (tarayıcı panelinden "Windows · Chrome", sahibin telefonundan "iPhone · Safari") ikinci faktör işaretli, otuz günlük bitiş ve ilerleyen son görülme ile duruyordu. **Tur üç kusur buldu, üçü de düzeltildi:** on beş dakikalık kilit "16 dakika" diyordu (kalan süre paneli çalıştıran makinenin saatiyle ölçülüyordu, kilidi yazan ise veritabanının saati — süre artık aynı ifadede veritabanından geliyor); kurtarma kodu alanının placeholder'ı gerçek bir kod gibi okunuyordu (`XXXXX-XXXXX` oldu); ve giriş sütunu hem ortalayıp hem kendi kendine kaydığı için on kodun başlığı logonun altına kayıyordu (sütun kayıyor, içindeki sarmalayıcı `min-h-full` ile ortalıyor; 390x380'de başlık logoyu 50 px boşlukla geçiyor). Hiçbirini test yakalamazdı: üçü de bakmakla görülen şeyler. Kod ekranı tek bir kod okunmadan doğrulandı — desene uyan on ayrı girdi sayıldı, veritabanı on kullanılmamış özet ve bir `two_factor.enrolled` kaydı gösterdi.

- **Kullanıcılar ekranı tarayıcıda görüldü ve bir kusuru düzeltildi (24 Eylül).** Masaüstünde doğruydu; 1280 px'in altında beş sütun yana kayıyor ve kenarın dışında kalan sütun, ekranın var olma sebebi olan **sıfırlama düğmesi** oluyordu. Artık satır gerçekten sığana kadar kişi başına bir kart gösteriliyor — sınır tahmin edilmedi, ölçüldü: hücreler satır kırmadığı için tablo yaklaşık 810 px panel genişliği istiyor, bunu ilk veren 1280 px. Ayrıca COSS tablosuna verilen `hidden md:block`, tablonun kendi `display: table`'ını eziyordu: satırlar başka genişliğe göre kurulmuş bir kabın içinde kendi doğal genişliklerine yayılıyordu. Bu sınıfı kullanan iki tablo (kişiler ve görevler) artık `table` diyor. Onay kutusu telefonda açılıp iptal edildi: alttan çekmece olarak geliyor, kişinin adını ve ne olacağını söylüyor; hiçbir şey sıfırlanmadı.

- **Kullanıcılar ekranı asgari haliyle kuruldu (D-273, göç 0043).** Yöneticinin ikinci faktör sıfırlama düğmesinin basılacak yeri yoktu: menüde girdi vardı, ekran yoktu ve Faz 02'de tasarlanmamıştı — uydurmak yerine sahibe soruldu, sahip "şimdilik asgari ekran" dedi. Erişim hakkında gösterdiği her şey **sayı**, asla içerik: kalan kurtarma kodu ve açık oturum sayısı, yani yönetici birinin geri dönüş yolu var mı diye bakabiliyor, o yolun ne olduğunu göremiyor. Veritabanı `iam.module.manage` olmayana hiçbir şey cevaplamıyor. Menüdeki girdi de var olmayan bir yetkiyi istiyordu; artık ekranın ve veritabanının gerçekten denetlediği yetkiyi istiyor. **299 birim testi**, lint, tip, biçim ve derleme geçti.

- **Hesap güvenliği kuruldu (TASK-0112, göç 0038-0042).** Giriş kilidi sağlayıcıya sorulmadan önce bakıyor (kilitliyken doğru parola da geçmiyor); panelin kendi oturumu 30 gün / 3 gün hareketsizlik kurallarını taşıyor ve hesap pasifleşince anında kapanıyor; on tek kullanımlık kurtarma kodu bir kez gösteriliyor ve kullanıldığında ikinci adımı geçtiğini panelin oturumu söylüyor; kayıp faktör tek bir sunucu dosyasındaki yönetici anahtarıyla siliniyor; yöneticinin sıfırlaması sahip katmanına bildiriliyor; iki adım zorunlu roller yöneticinin tarihli kuralından okunuyor. **298 birim testi**, **16 dosyada 226 veritabanı testi**, biçim ve derleme geçti; CI **35961770987 yeşil**. Tarayıcı turu 24 Eylül'de yapıldı; aşağıda.

- **Alt bant kuruldu ve görüldü (TASK-0028, artık tamamlandı).** Ekran kendi bandını yazıyor, içerik bandın altından kayıyor ve bandın yüksekliği kadar boşluk alıyor; telefonda gezinme çubuğu bant varken çekiliyor. Görev detayının kapanış adımları ve "Görev ver" sayfasının eylemi banda taşındı. **273 birim testi**, lint, tip, biçim ve derleme geçti, CI yeşil; tur masaüstünde ve 375 px'te doğruladı — bandın düğmesi içinde olmadığı formu gönderip görevi kapattı, gerekçe alanı kayıtla kaldı.

- **Çoklu kapsam kuruldu (0037).** Bir kayıt hem şantiye hem proje taşıyorsa eskiden yalnız ilkine bakılıyordu; artık her yer ayrı değerlendiriliyor ve birine yetki yetiyor. Okuma anı denetimi de kovanın kendi yerine bakıyor, yoksa kaydı projesinden bulan kişiye sağlıklı dizin bozukmuş gibi görünüyordu. Dört yeni test; ikisi göç geri alındığında düşüyor. **208 veritabanı testi**, **273 birim testi**, biçim ve derleme geçti; `a8f294e` ile gönderildi, CI **35928366252 yeşil**.

- **Yeniden kurma da ölçüldü (0036).** 20.000 kayıtlık yeniden kurma on dakikada bitmiyordu: yayın her kaydı sıradan yazıcıyla yazıyor, o da her kayıtta kovayı ve sözlüğü güncelliyordu — üç bin kimlik taşıyan bir kova eklenen her kimlik için baştan yazılıyor, üstelik yayın zaten sonunda hepsini yeniden kuruyor. Yayına özel toplu yazıcıyla süre **29 saniyeye** indi. **204 veritabanı testi**, **273 birim testi**, biçim ve derleme geçti; `b79c36a` ile gönderildi, CI **35916332932 yeşil**.

- **Hacim ölçümü ve beş hızlandırma göçü (0031-0035).** 20.000 kayıtlık gerçek bir dizinle ölçüldü: sorgu tüm kayıt tablosunu dolaşıp her satıra yetki denetimi uyguluyormuş (790 ms'in 718'i). Artık önce eşlemeler sayılıyor ve yalnız eşleşen satırlar anahtarla okunuyor; eşleme politikası modülü satırı okumadan buluyor; bütün sözcükleri bilinen sorgu tür listesini hiç sormuyor. Sonuç: 958 → 167 ms, 676 → 287 ms, 1.552 → 212 ms, 1.293 → 264 ms. **204 veritabanı testi**, **273 birim testi**, biçim ve derleme geçti; `927b455` ile gönderildi, CI **35911823080 yeşil**. 0035'te kendi testinin yakaladığı bir gerileme de düzeltildi: yazım önerisi atlanınca normalleştirme sürümü denetimi de atlanıyor, arama reddetmek yerine boş cevap veriyordu.

- 0030 ile arama, cevap verirken yardımcılarını da denetliyor: dönen kayıtlar için (tür başına en çok altı) kova üyeliği anahtar okumasıyla kontrol ediliyor. **61 arama testi** (5 yeni), **15 dosyada 203 veritabanı testi**, **273 birim testi**, biçim ve derleme yerelde geçti; göçün down/up turu cevabı değiştirmiyor. Değişiklik `7dc54c1` ile gönderildi; CI **35867217424 yeşil**: 61 arama testi dahil **201 veritabanı testi**, tam geri dönüş/yeniden kurulum öncesinde ve sonrasında geçti.

- 0029 ile kova ve sözlük de normalleştirme sürümünü taşıyor. **56 arama testi** (5 yeni sürüm senaryosu), **15 dosyada 198 veritabanı testi**, **273 birim testi**, biçim ve derleme yerelde geçti; göçün down/up turu sonrasında kova içeriği ile bütünlük raporu birebir aynı kaldı. Değişiklik `0b82633` ile gönderildi; CI **35862720223 yeşil**: 56 arama testi dahil **196 veritabanı testi**, tam geri dönüş/yeniden kurulum öncesinde ve sonrasında geçti. Kimlik bilgisi olmayan 2 canlı R2 testi CI'da atlandı.

- 0028 yardımcı bütünlüğü göçü test projesine uygulandı. **51 arama testi**, **273 birim testi** ve üretim derlemesi geçti; 19 yeni test kasıtlı bozulma, yetki ve geri dönüş senaryolarını kapsıyor. Salt okunur işletim kontrolü testlerden sonra sıfır uyuşmazlık raporladı. Değişiklik `7490e1c` ile gönderildi; CI **35857129525 yeşil**: 51 arama testi dahil **191 veritabanı testi**, tam geri dönüş/yeniden kurulum öncesinde ve sonrasında geçti. Kimlik bilgisi olmayan 2 canlı R2 testi CI’da atlandı.

- Yayın öncesi yakalama için arama senaryoları **32** oldu; yerelde toplu ve hedefli koşularda geçti. **273 birim testi** ve üretim derlemesi geçti. İlk CI turunun geri dönüş sonrası testinde olay numaralarının metin sırasıyla okunması hatası yakalandı ve düzeltildi; yeni sınır testi yerelde geçti. Düzeltme `73116da` ile gönderildi; CI **35832578935 yeşil**: 32 arama testi dahil **172 veritabanı testi**, tam geri dönüş/yeniden kurulum öncesi ve sonrasında geçti. CI kimlik bilgileri olmayan 2 canlı R2 testi atlandı. Yeni veritabanı göçü yok.

- Eşzamanlılık testleri `9b6a9f9` ile gönderildi. CI 35830079315 yeşil: toplam **26 arama testi**, **273 birim testi** ve temiz kurulum/tam geri dönüş/yeniden kurulum geçti. Test şeması, sentetik olaylar, roller ve dizin satırları temizlendi.

- 273 birim testi, göç geri dönüş/sürüm doldurma senaryosu dahil 23 arama veritabanı testi ve üretim derlemesi geçti. 0027 değişikliği `3d493bd` ile gönderildi; CI 35811145952 temiz kurulum/tam geri dönüş/yeniden kurulum testleriyle yeşil.
- 0025 ile arama için ağ turu dörtten üçe indi; RLS, salt okunur işlem, önceden kurulan 15 saniye sınırı ve hata/iptalde kimlik temizliği korundu.
- CI, mevcut tarihli kural kodunda aynı işlemde eski düzeltmenin seçilebildiğini yakaladı. 0026 düzeltmesiyle ters UUID sırası kullanılarak da son düzeltmenin seçildiği ve 10 ADM veritabanı testinin geçtiği doğrulandı.
- `c62f80e` için CI **35809769758 geçti**: temiz kurulum, testler, tüm göçleri geri alma ve yeniden uygulama doğrulandı.

## Buradan sonraki sıra

1. **Faz 08 turu (sizde):** giriş yapıp bir şablonun kopyasını alın ya da yeni akış açın, bir adımın sorularını cevaplayın, denemeyi çalıştırıp yayımlayın; sonra Onay Merkezi'nde bir onay verin ve çalışma günlüğüne bakın. TASK-0119 ve TASK-0120'nin kalite kapısı bu tur.
2. **TASK-0111 — M1:** kontrol listesi hazır, tur sizde. Notlarınız kayda girer (düzeltme → görev, kapsam → CHG) ve Faz 07 kapanır.
3. **Faz 09 — ilk dilim** (projeler, şantiyeler, günlük saha kaydı): soru turu 25 Eylül'de yapıldı (D-287…D-290); plan onayınızı bekliyor (D-291, `docs/features/phase-09-slice-1-plan.md`). On bir görev: üretim tanımları, firma kartı, projeler/şantiyeler/duvarlar, personel kartı, malzeme ve lokasyonlar, varlık kartı, günlük saha kaydı, şantiye detayı ve "Niye zarardayız?", resmi günlük rapor, "Bugün"ün şantiye göstergeleri, pilot örnek verisi. Pilot tamamen örnekle (D-290); barındırma kararı fazın çıkış şartı olarak duruyor.
4. **Faz 09'da açılacak arama işleri:** modüller kendi kaynaklarını kaydedince gerçek kayıtlarla kabul, ve tek bir sözcüğü çok sayıda kaydın paylaştığı durumda sıralama.
5. **TASK-0113'ün kalan kabulü:** barındırma geldiğinde ana ekrana kurulum ve gerçek cihazda bildirim.

**Paralel kabul:** TASK-0113'ün mobil kurulum doğrulaması HTTPS ve gerçek cihaz koşullarını bekliyor; sahip bunun için geçici bir tünel istemedi (D-274). Barındırma bağımlılığı DEF-008 olarak açık ve barındırma kararı Faz 09 çıkışına bağlı, yani bu kabul M1'i ve Faz 08'i bekletmiyor.

## Kilometre taşları ve veri kullanımı

| Aşama | Ne zaman / koşul |
|---|---|
| **M0 — İlk ekranlar** | Tamamlandı: giriş, iki adımlı doğrulama ve uygulama kabuğu |
| **M1 — Yerel kabul** | Faz 07 sonunda; sahibi kendi makinesinde tam akışı yürütür, geri bildirim kayda girer. Kontrol listesi hazır: [m1-local-acceptance.md](docs/features/m1-local-acceptance.md) |
| **Pilot ve barındırma** | Faz 09 çıkışında sunucu/dağıtım kararı ve pilot kullanıcılar belirlenir; pilot örnek veriyle yapılır |
| **Gerçek şirket verisi** | Faz 19'da; kendi sunucusuna geçiş, KVKK kontrolü, yedekten dönüş ve sahip onayı sonrasında |

İş ekranları Faz 09'dan başlayarak dilim dilim gelir. Mevcut arama ve revizyon altyapısına gerçek kayıt türleri, o kayıtların sahibi modüller yapılırken bağlanır.
