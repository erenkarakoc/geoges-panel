# GEOGES Panel — Yol Haritası

Son güncelleme: 2026-09-23. Şu an **Faz 07 — Temel yapım** içindeyiz; aktif iş **TASK-0110 — Site geneli arama**.

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
| **07 — Temel yapım** | Kimlik/yetki, denetim, kuyruklar, belgeler, görevler, bildirimler, tanımlar ve arama | 🔨 **Devam ediyor — şu an buradayız** |
| **08 — İş akışı motoru** | Akış tanımları, sürümleme, çalıştırma, test, görsel tasarımcı ve onay merkezi | ⬜ Başlamadı |
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

**15M — Panel MCP sunucusu (2026-09-23 eklendi).** Bitmiş ürün için, panelin içinde çalışan bir MCP sunucusu: asistan panele bağlanır, sunucunun kendi yetkisi yoktur, her çağrı soruyu soran kişinin kimliğiyle aynı satır güvenliğinden geçer. Yani kanal, o kişinin ekranda görebildiğinin tam olarak aynısını görür; yetkisiz kayıt yokmuş gibi davranır. Sahip iki kararı verdi: veri bulut bir modele çıkabilir ve kapı kullanıcının kendi yetkisi dahilinde her şeye açıktır. Okuma tarafı arama, kayıt detayı, yönetim kartları ve raporlar, görevler, bildirimler, onay kuyruğu ve revizyon talepleridir; belgelerde yalnız üstveri ve panel bağlantısı döner, imzalı depolama bağlantısı asla dışarı çıkmaz. Yazma tarafı sahibin kararıyla **yalnız taslakla sınırlı**: kanal bir taslak hazırlar, kişi paneli açıp onaylayana kadar hiçbir şey yürürlüğe girmez. Görev açmak, not yazmak veya revizyon talebi başlatmak doğrudan kanaldan yapılmaz; onay, imza ve para-stok-personel kaydı da panelde kalır. Araç yüzeyi her modülün kendi kaydından toplandığı için sıra dilimlerden sonradır: bugün yapılsa yüzeyin büyük bölümü henüz yok. Açık nokta: personel verisi bulut modele geçtiğinde KVKK yurt dışına aktarım dayanağı ve İK modülünün kanalda olup olmayacağının yönetici ayarı olması.

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
| TASK-0110 | Site geneli arama: yetkili sonuçlar, Türkçe eşleşme, öneri, tür grupları, son açılanlar ve yeniden dizinleme | 🔨 Devam ediyor — ayrıntı aşağıda |
| TASK-0113 | Ana ekrana ekleme, uygulama simgeleri, mobil dokunma alanları ve görev kartları | 🔨 Yapıldı; HTTPS üzerinden kurulum ve gerçek cihaz kabulü bekliyor |
| TASK-0028 | Sayfaya göre eylem/kaydetme düğmeleri taşıyan sabit alt şerit | ⬜ Tasarım hazır, uygulamaya hazır |
| TASK-0112 | Tek kullanımlık 2FA kurtarma kodları, giriş kilidi, hareketsizlik/oturum sonu ve ikinci faktör sıfırlama | ⬜ Başlamadı |
| TASK-0111 — M1 | Sahibin kendi makinesinde kurulum, 2FA ile giriş ve uçtan uca kabul turu | ⬜ Faz 07'nin kapanış kabulü |

“Bugün” ekranının adlandırması (TASK-0043) ve odak/erişilebilirlik düzeltmeleri (TASK-0054) de tamamlandı.

### Aktif iş: TASK-0110 — Arama

| Parça | Güncel durum |
|---|---|
| Yetki, kapsam ve veri sınıfına göre arama | Kuruldu; yetkisiz kayıtların sonuç, sayı ve öneriye sızmaması test edildi |
| Türkçe harf eşleştirme, bütün sözcüklerle eşleşme ve yazım önerisi | Kuruldu ve test edildi |
| Sözcük yardımcıları ve olaylarla güncelleme | Kuruldu; kayıt taşıma, silme ve eski olay senaryoları test edildi |
| Tür başına beş sonuç ve “Tümünü gör” | Kuruldu; bir türün diğerinin sonuçlarını bastırmaması test edildi |
| Son açılanlar | Yalnız adresler kullanıcıya göre oturumda tutuluyor; başlıklar güncel yetkiyle yeniden okunuyor |
| Mobil palet | Tam ekran, kayan liste, sabit COSS footer ve kapatma düğmesi 390 px tarayıcı görünümünde doğrulandı |
| Kaynaktan yeniden dizinleme | Geçici veri kümesi, karşılaştırma, tek işlemde yayın ve hata halinde geri dönüş kuruldu |
| Küçük veri kümesinde hız | 56 sentetik kayıt / 20 sıcak istekte p95 **279 ms**, en yüksek **284 ms** (son ölçüm; 0030 okuma anı denetimi bu ölçümde yaklaşık 10 ms tutuyor); önceki ölçümler 271/263/274/255/258 ms, 0025 öncesi p95 348 ms idi. Bu ölçüm 300 ms hedefinin altında |
| Normalleştirme sürümü | Satır, sözcük eşlemeleri, kova ve sözlüğün tamamına eklendi (0029); yazma yalnız yürürlükteki sürüme, okuma yalnız yürürlükteki sürümden yapılıyor ve bütünlük denetimi sürüm bazında karşılaştırıyor. Görünür eski sürümde kontrollü hata korunuyor. Kullanıcı sorgusunda görünürlükle sınırlı tam yardımcı tutarlılığı açık |
| Yardımcı bütünlüğü | 0028 ile eşlemeler, kova dizileri ve sözcük sayıları doğrudan arama metninden türetilip karşılaştırılıyor; bozuk yayın reddediliyor ve işletim komutu aynı denetimi kullanıyor. 0030 ile kullanıcı sorgusunda da sınırlı bir denetim var: dönen kayıtlar için kova üyeliği kontrol ediliyor, cevap değişmiyor, kullanıcıya bir şey gösterilmiyor. Var olup bir kimliği düşmüş kovanın kaydı gizlemesi bu yolla görülemez; o yön tam taramanın işi olarak kalıyor |
| Çoklu kapsam | OQ-034 yanıtı bekleniyor: ortak kaydı görmek için ilgili şantiyelerden birine mi, tümüne mi yetki gerekecek? |
| Eşzamanlı kaynak değişiklikleri | Gerçek kaynak ve olay kuyruğuyla commit/geri alma, taşıma/silme, tarama sırasının gerisine ekleme ve tekrar teslim sınandı. Yakalanan değişiklikler kuyruk işleyicisi çalışmadan yayın adayına yansıyor; hata eski sürümü koruyor |
| Yayın öncesi olay yakalama | Uygulandı ve küçük veri kümesinde doğrulandı. Geç tamamlanan düşük numaralı olaylar da yakalanıyor; belirlenen sınırdan sonrakiler normal kuyruktan işleniyor |
| Büyük veri | **20.000 kayıtla ölçüldü (23 Eylül).** İlk ölçümde arama hedefin çok üstündeydi: yaygın bir sözcük 942 ms, iki sözcük 1.250 ms. Beş göçten sonra (0031-0035) örneklenen altı sorgunun tamamı **90-287 ms**, yani 300 ms hedefinin içinde — ağ turu dahil. Dizin kayıt başına yaklaşık 260 bayt yer tutuyor; 20.000 satırın tam bütünlük taraması 1,5-2,4 sn. Açık kalan: çok sayıda kaydın paylaştığı bir sözcükte sıralama hâlâ bütün eşleşmeleri okumak zorunda, bu hacimde yeniden kurma maliyeti ve gerçek veri şekliyle doğrulama |
| Gerçek kaynaklarla tarayıcı kabulü | Modüller kendi dilimlerinde arama kaynağını kaydedecek; gerçek telefon klavyesiyle kabul de açık |

**Arama henüz tamamlandı sayılmıyor.** Küçük veri kümesindeki hız sonucu, büyük veri kabulünün yerine geçmiyor.

### Son doğrulamalar

- **Hacim ölçümü ve beş hızlandırma göçü (0031-0035).** 20.000 kayıtlık gerçek bir dizinle ölçüldü: sorgu tüm kayıt tablosunu dolaşıp her satıra yetki denetimi uyguluyormuş (790 ms'in 718'i). Artık önce eşlemeler sayılıyor ve yalnız eşleşen satırlar anahtarla okunuyor; eşleme politikası modülü satırı okumadan buluyor; bütün sözcükleri bilinen sorgu tür listesini hiç sormuyor. Sonuç: 958 → 167 ms, 676 → 287 ms, 1.552 → 212 ms, 1.293 → 264 ms. **204 veritabanı testi**, **273 birim testi**, biçim ve derleme geçti. 0035'te kendi testinin yakaladığı bir gerileme de düzeltildi: yazım önerisi atlanınca normalleştirme sürümü denetimi de atlanıyor, arama reddetmek yerine boş cevap veriyordu.

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

1. **TASK-0110:** çoklu kapsam kararını uygulamak, kalan yardımcı sürüm/tutarlılık işlerini ve üretim hacminde hız/yeniden kurma ve gerçek cihaz kabulünü tamamlamak.
2. **TASK-0028:** ekran altı işlevsel şeridi kurmak.
3. **TASK-0112:** kalan hesap güvenliği özelliklerini kurmak.
4. **TASK-0111 — M1:** yerel kabul turu ve Faz 07 çıkış kontrolü.
5. **Faz 08:** iş akışı motoru ve görsel tasarımcı.

**Paralel kabul:** TASK-0113 mobil kurulum doğrulaması HTTPS/gerçek cihaz koşullarını bekliyor. Barındırma bağımlılığı DEF-008 olarak açık; barındırma kararı Faz 09 çıkışına bağlı.

## Kilometre taşları ve veri kullanımı

| Aşama | Ne zaman / koşul |
|---|---|
| **M0 — İlk ekranlar** | Tamamlandı: giriş, iki adımlı doğrulama ve uygulama kabuğu |
| **M1 — Yerel kabul** | Faz 07 sonunda; sahibi kendi makinesinde tam akışı yürütür, geri bildirim kayda girer |
| **Pilot ve barındırma** | Faz 09 çıkışında sunucu/dağıtım kararı ve pilot kullanıcılar belirlenir; pilot örnek veriyle yapılır |
| **Gerçek şirket verisi** | Faz 19'da; kendi sunucusuna geçiş, KVKK kontrolü, yedekten dönüş ve sahip onayı sonrasında |

İş ekranları Faz 09'dan başlayarak dilim dilim gelir. Mevcut arama ve revizyon altyapısına gerçek kayıt türleri, o kayıtların sahibi modüller yapılırken bağlanır.
