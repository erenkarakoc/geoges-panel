# GEOGES Panel — Yol Haritası

Son güncelleme: 2026-09-25. Şu an **Faz 08 — İş akışı motoru** içindeyiz. Faz 07'nin yapım işi bitti; kalan tek işi **M1 yerel kabul turu** ve o sizde — siz turları sonraya bıraktığınız için faz kapanmadan Faz 08 başladı (D-278).

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

## Faz 08 — İş akışı motoru (şu an burada)

Motor, panelin süreçleri yürüten parçası: bir olay olduğunda ya da saati geldiğinde akışı başlatır,
adım adım yürütür, birinin onayını veya bir görevin kapanmasını bekler, sonra devam eder.

**Fazın şekli iki kararla belirlendi (24 Eylül):** motor, kayıtları Faz 09-11'de gelecek gerçek
akışlar yerine **deneme kayıt türüyle** uçtan uca kabul edilecek (D-279) — sekiz gerçek şablon kendi
diliminde etkinleştirilip orada kabul edilir; ve **yetenek kataloğu** mevcut beş modül için de
yazıldı (D-280).

| Sıra | İş | Durum |
|---|---|---|
| 1 | **TASK-0118 — Yetenek kataloğu ve sözleşme testi** | ✅ Tamamlandı |
| 2 | **TASK-0117 — Motor çekirdeği** | 🔨 Devam ediyor — sekiz adımın sekizi yapıldı, aşağıda |
| 3 | TASK-0119 — Görsel tasarımcı ve soru-cevap | ⬜ Motor bitince kendi planını alacak |
| 4 | TASK-0120 — Onay Merkezi'nin gerçek kuyruğa bağlanması ve sekiz şablon | ⬜ Motor bitince |

### Yetenek kataloğu (TASK-0118, tamamlandı)

Her modül, bir akışın kendisinden ne isteyebileceğini kendi yerinde ilan ediyor — ve ilan,
**çalıştıran fonksiyonu taşıyor**. Yani "ilan var, kod yok" bir test hatası değil, **derleme hatası**.
Sözleşme testi de derleyicinin göremediği üç şeye bakıyor: ilan modülün kendi REQ kataloğuyla uyuşuyor
mu, ilan edilen olaylar gerçekten yayımlanıyor mu (ve yayımlanan her olay ilan edilmiş mi), ve bir
zamanlar yayımlanmış bir yetenek kaybolmuş mu. İlk koşuşunda dört gerçek ayrışma yakaladı: kodun
yayımladığı dört olayın hiçbir katalogda adı geçmiyordu, yani hiçbir akış onları duyamazdı.

### Motor çekirdeği (TASK-0117, devam ediyor)

| Parça | Durum |
|---|---|
| Sürümlü tanım, taslak, yayın | ✅ Yayımlanmış bir sürümün tanımı **kimse tarafından** değiştirilemiyor — yönetici bağlantısı dahil; aynı anda tek yayımlanmış sürüm tekil indeks |
| Denemesiz yayın yasağı | ✅ Yayın, **tam olarak bu tanımın** geçmiş bir denemesini istiyor; tanım denemeden sonra değişirse kanıt geçersiz (içerik özeti) |
| Örnekler ve çalışma günlüğü | ✅ Örnek, **başladığı sürümü** tutuyor; üstüne yeni sürüm yayımlansa da yarım iş değişmiyor. Tek örnekli akışta kayıt başına tek koşu |
| Adım sınırı | ✅ Bitmeyen döngü, sayılarak durduruluyor; sınır bir istisna değil **kayıtlı bir sonuç** (sebebi günlükte, örnek "başarısız" kapanıyor) |
| Tetikleyici: olay | ✅ Yayımlanan akış aynı anda dinlemeye başlıyor (abonelik yayının kendisi tarafından yazılıyor); aynı teslimat ikinci koşu açmıyor |
| Tetikleyici: saat | ✅ "Her gün 07:30" ya da "her 30 dakika"; her koşu ait olduğu **zaman dilimini** taşıyor, tur iki kez dönerse ikinci koşu açılmıyor |
| Tetikleyici: eşik / elle | 🔨 Elle başlatma var (tasarım yetkisi istiyor); eşik tetikleyicisi kalan iş |
| Adım: başlangıç, koşul, bitiş | ✅ Koşullar kaydın verisiyle değerlendiriliyor; hangi daldan neden gidildiği günlükte |
| Adım: onay | ✅ Üç sonuç (onayla / reddet / geri gönder), gerekçesiz ret veya geri gönderme **tablonun kısıtıyla** reddediliyor; karar akışı kendisi yürütmüyor, olay olarak geri geliyor |
| Adım: görev | ✅ Motor görevi kendi yazmıyor, **kataloğun aksiyonunu** çağırıyor; görev kapanınca akış kaldığı yerden devam ediyor |
| Adım: bekleme (süre) | ✅ Bellekte zamanlayıcı değil, **veritabanında satır**: sekiz saatlik bekleme yeniden başlatmayı ve dağıtımı atlatıyor |
| Adım: bildirim | ✅ Yine kataloğun aksiyonu üzerinden |
| Kalan yedi adım | ⬜ Eskalasyon, paralel dal, birleşme, alt akış, kilit, kayıt oluştur/durum değiştir, her biri için |
| Kuru mod (deneme çalıştırması) | ✅ **Gerçek çalışmanın ta kendisi**: adımın yaptığı şey bir portun arkasında, deneme hiçbir şey yazmayan bir port veriyor. Koşullar gerçek veriyle, sahipler gerçekten hesaplanıyor; örnek/onay/görev/bildirim **hiç** yazılmıyor |
| Pencereli koşullar ("son 30 günde 3'ten fazla") | ⬜ Kalan iş |

Bugüne kadar: **yedi göç** (0045-0051), **333 birim testi**, **291 veritabanı testi**. Motorun her
adımı kendi testleriyle geldi ve testler yol boyunca üç gerçek motor kusuru buldurdu: açık adımda
bekleyen örneğin yeniden yürütülünce aynı adıma ikinci kez girmesi, görünürlük politikasında dıştaki
kimliği gölgeleyen bir alt sorgu, ve olay kodunu `case` ile seçtiği için sözleşme testine görünmeyen
bir yayın çağrısı.

**Fazın bilinen riski (D-278):** motor, temelin sizin kullanımınızla doğrulanmadığı bir zeminde
kuruluyor. M1 turundan çıkacak bir düzeltme temeli değiştirirse, üstünde motor dururken yapılacak.

## Faz 07 — Ayrıntılı durum

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

### Son doğrulamalar

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

1. **Motorun kalan işi (TASK-0117):** eşik tetikleyicisi, yedi adım ve pencereli koşullar.
2. **TASK-0119 ve TASK-0120:** görsel tasarımcı, ve Onay Merkezi'nin motorun açtığı gerçek kuyruğa bağlanması.
3. **TASK-0111 — M1:** kontrol listesi hazır, tur sizde. Notlarınız kayda girer (düzeltme → görev, kapsam → CHG) ve Faz 07 kapanır.
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
