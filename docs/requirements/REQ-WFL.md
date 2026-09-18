# REQ-WFL — İş Akışı, Onay ve Kurallar

Durum: DRAFT · 2026-09-18 · Modül: WFL (Workflow & Rules)

Kaynaklar: Özellik Yapısı §4, §13 (onay mekanizması), §37 (§37.1 hariç), §45; Mimari §6, §13; ADR-005, ADR-006 (CHG-006 ekiyle); kararlar D-077…D-108 (OQ-028, TASK-0040).

**Sınır.** Bu dosya iş akışı motorunu, onay mekanizmasını, merkezi kuralları ve kayıt türü üretecini kapsar. Başka dosyalara ait olanlar:

- Günlük saha kaydının onay ekranında görülecek kontroller (üretim, saatler, zayi, puantaj…) → REQ-SIT (§13 içerik kısmı).
- Görev kaydı, bildirim merkezi, eskalasyonun yürütülmesi, günlük özet → REQ-TSK (§25). WFL yalnızca görevi ve bildirimi **üretir** ve kaynağını taşır.
- Onaylı kayıtlar için revizyon talebi → REQ-AUD (§37.1).
- Kullanıcı, rol ve yetki tipi kayıtları → REQ-IAM. WFL bunları kullanır ve tasarımcıdan tanımlanmalarını ister (REQ-WFL-021).

Kayıt türü üretecinin sahibi modül Phase 03'te belirlenir (ADM veya yeni bir platform modülü); o zamana kadar gereksinimleri burada durur (REQ-WFL-035…039).

---

## A. Katmanlar

### REQ-WFL-001 — Hesaplar sabit, süreçler akış olarak tanımlanır

- Kaynak: D-077; Mimari §6, §13; ADR-005
- Öncelik: Must · Kademe: T1
- Açıklama: Defter mantığı ve türetilen veri (tahsilatın cari bakiyeyi azaltması, onaylı üretimin hakedişe akması, stok hareketinin stoğu değiştirmesi, maliyetin tüketimden hesaplanması) kodda sabittir. Kim onaylar, kaç kademe, eşikler, eskalasyon, kilitler ve bildirimler akış tanımlarında tutulur ve kod değişmeden değiştirilebilir.
- Kabul kriterleri:
  - [ ] Hiçbir akış tanımı bir hesaplama kuralını değiştiremez; tasarımcıda buna karşılık gelen bir seçenek yoktur.
  - [ ] Bir onay zincirindeki kademe sayısı, onaylayıcı ve eşik, yazılım güncellemesi olmadan değiştirilip yayınlanabilir.
- Durum: DRAFT

### REQ-WFL-002 — Akış hiçbir defter kaydını kesinleştirmez

- Kaynak: D-080; ADR-006 (CHG-006)
- Öncelik: Must · Kademe: T1
- Açıklama: "Fatura kes", "ödemeyi işle", "stok hareketi yaz" gibi para, stok veya zimmet defterine yazan bir aksiyon yetenek kataloğunda hiç bulunmaz. Akış bu durumlarda ilgili kişiye görev açar; kaydı insan tamamlar.
- Kabul kriterleri:
  - [ ] Yetenek kataloğunda defter kesinleştiren bir aksiyon yayımlanamaz; sözleşme testi bunu reddeder (REQ-WFL-004).
  - [ ] Her defter kaydında onu tamamlayan kişi, bir akış sürümü değil, adı belli bir kullanıcıdır.
- Durum: DRAFT

## B. Yetenek kataloğu ve sözleşmeler

### REQ-WFL-003 — Her modül yetenek kataloğunu yayımlar

- Kaynak: D-078; TASK-0041
- Öncelik: Must · Kademe: T1
- Açıklama: Her modül; yayımladığı olayları, sunduğu aksiyonları ve koşulların okuyabileceği tipli, veri sınıfı belli alanları kendi REQ dosyasının sonundaki yetenek kataloğunda ilan eder (`docs/requirements/README.md` şablonu). Tasarımcının sunduğu kutular yalnızca bu kataloglardan gelir.
- Kabul kriterleri:
  - [ ] Tasarımcıdaki her olay, aksiyon ve koşul alanı bir modülün kataloğunda karşılığı olan bir kayda denk gelir.
  - [ ] Her koşul alanının veri sınıfı (genel / iç / ticari / hassas kişisel) bellidir.
- Durum: DRAFT

### REQ-WFL-004 — Yetenekler sözleşmedir; ilan ile kod ayrışamaz

- Kaynak: D-078
- Öncelik: Must · Kademe: T1
- Açıklama: Kontrollü modül sınırı 25 modüldedir; modül içindeki parçalar serbestçe incelir. Her yetenek ilanı otomatik sözleşme testleriyle koda karşı doğrulanır. Yayımlanmış bir yetenek silinmez ve sessizce değiştirilmez; yalnızca eklenir ya da "kullanımdan kalktı" işaretlenir.
- Kabul kriterleri:
  - [ ] İlan ile kod arasındaki her ayrışma CI'ı kırar.
  - [ ] Yayımlanmış bir yeteneği silmek veya imzasını değiştirmek CI'ı kırar; "kullanımdan kalktı" işareti ise geçer ve tasarımcıda uyarı olarak görünür.
  - [ ] Kullanımdan kalkmış bir yeteneğe bağlı akışlar listelenebilir.
- Durum: DRAFT

## C. Akış tanımı

### REQ-WFL-005 — Sabit adım paleti

- Kaynak: ADR-006; D-095, D-096
- Öncelik: Must · Kademe: T1
- Açıklama: Akışlar yalnızca şu adımlarla kurulur: başlangıç/olay, onay, görev, koşul, süre/bekleme, bildirim, eskalasyon, paralel dal, birleşme, alt akış, kilit, bitiş, kayıt oluştur / durum değiştir, her biri için.
- Kabul kriterleri:
  - [ ] Tasarımcı bu listenin dışında bir adım tipi sunmaz.
  - [ ] Yeni bir adım tipi ancak ADR-006'nın değiştirilmesiyle eklenir.
- Durum: DRAFT

### REQ-WFL-006 — Tasarımcının yapamayacakları

- Kaynak: D-091; ADR-006 (CHG-006)
- Öncelik: Must · Kademe: T1
- Açıklama: Serbest kod veya script çalıştırma, doğrudan veritabanı erişimi, defter kesinleştirme, akış çalışırken yetki veya rol verme, dış sisteme veri gönderme ve hassas kişisel veriyi bildirim metnine koyma yoktur. Tasarım sırasında yetki tipi ve rol tanımlamak ve atamak bu yasağın dışındadır (REQ-WFL-021).
- Kabul kriterleri:
  - [ ] Bu altı işlemin hiçbiri için tasarımcıda bir adım, alan veya ayar yoktur.
  - [ ] Hassas kişisel veri sınıfındaki bir alan, bildirim metni şablonuna eklenemez; yerine kayda giden bağlantı konur.
- Durum: DRAFT

### REQ-WFL-007 — Tetikleyiciler

- Kaynak: D-103; DEF-006
- Öncelik: Must · Kademe: T2
- Açıklama: Bir akış şu durumlarda kendiliğinden başlar: bir olay gerçekleştiğinde; belirli saatte veya takvim kuralına göre (bir tarihe X gün kala dahil); bir değer eşiği geçtiğinde. Yetkili kullanıcı her akışı elle de başlatabilir. Gelen e-postayla başlatma ilk sürümde yoktur (DEF-006).
- Kabul kriterleri:
  - [ ] Her üç tetikleyici tipi ve elle başlatma, deneme çalıştırmasında örnek veriyle tetiklenebilir.
  - [ ] Takvim tetikleyicisi çalışma takvimini ve tatilleri dikkate alabilir (ADM).
- Durum: DRAFT

### REQ-WFL-008 — Koşullar, geçmişe bakan koşullar dahil

- Kaynak: D-100
- Öncelik: Must · Kademe: T1
- Açıklama: Koşullar yetenek kataloğundaki tipli alanları okur. Ayrıca istenen kayıtlar üzerinde istenen zaman aralığında serbestçe sayım ve toplam yapılabilir ("bu işveren son 30 günde 3'ten fazla geciktirdiyse"). Koşul sorgusunun süre sınırı vardır; süre aşılırsa akış hata ile durur ve hata kaydedilir.
- Kabul kriterleri:
  - [ ] Geçmişe bakan bir koşul, yayından önceki deneme çalıştırmasında gerçek veri üzerindeki sonucunu gösterir.
  - [ ] Süre sınırını aşan bir koşul akışı sessizce geçmez; akış örneği "hata" durumuna düşer ve kurucuya bildirilir.
- Durum: DRAFT

### REQ-WFL-009 — "Her biri için" adımı

- Kaynak: D-096
- Öncelik: Must · Kademe: T2
- Açıklama: Akış, uzunluğu önceden belli olmayan bir liste üzerinde her öğe için aynı adımları çalıştırabilir (her zimmet, her eksik evrak). Tek seviyedir; iç içe kullanılamaz.
- Kabul kriterleri:
  - [ ] Personel çıkışı akışı (§45.4), her zimmet için ayrı kontrol üreterek kurulabilir.
  - [ ] Bir "her biri için" adımının içine ikinci bir "her biri için" konamaz.
- Durum: DRAFT

### REQ-WFL-010 — Kayıt oluştur / durum değiştir adımı

- Kaynak: D-095, D-080
- Öncelik: Must · Kademe: T1
- Açıklama: Akış taslak kayıt oluşturabilir (ör. çıkış kontrol listesi) ve bir kaydın durumunu değiştirebilir (ör. "tamamlandı"). Defter kaydını kesinleştiremez.
- Kabul kriterleri:
  - [ ] Akışın oluşturduğu kayıt taslak durumundadır ve kaydın geçmişinde onu oluşturan akış, sürüm ve adım görünür.
  - [ ] Bu adımla defter yazan bir kayıt türünün kesinleşmiş durumuna geçiş yapılamaz.
- Durum: DRAFT

### REQ-WFL-011 — Uçtan uca süreçler kısa akışların zinciridir

- Kaynak: D-104; §45
- Öncelik: Must · Kademe: T2
- Açıklama: Aylara yayılan bir süreç (ör. yeni işten tahsilata) birbirini tetikleyen kısa akışlardan kurulur; tek bir uzun akış tanımıyla kurulmaz. Böylece bir akış değiştiğinde yürüyen diğer işler etkilenmez.
- Kabul kriterleri:
  - [ ] Bir akışın bitişi, başka bir akışı başlatan olayı yayımlayabilir.
  - [ ] Zincirdeki bir akışın yeni sürümü yayımlandığında, zincirin diğer halkalarında yürüyen örnekler kendi sürümleriyle devam eder.
- Durum: DRAFT

## D. Onay

### REQ-WFL-012 — Tek Onay Merkezi, kuyruk düzeninde

- Kaynak: §4; D-070 (kuyruk düzeni); D-106
- Öncelik: Must · Kademe: T2
- Açıklama: Panelde tek bir Onay Merkezi vardır. Kullanıcı, yetkisine göre kendisini bekleyen bütün onayları burada görür. Bir kayıt ekranı doldurur; karar verildiğinde sıradaki kendiliğinden gelir. Bekleyen onay yoksa ekran boş durumunu gösterir.
- Kabul kriterleri:
  - [ ] Kullanıcı yalnızca kendisine düşen onayları görür (REQ-WFL-017).
  - [ ] Bir karardan sonra sıradaki kayıt, listeye dönmeden açılır.
  - [ ] Bekleyen onay sayısı çalışma katmanı rozetinde ve "Bugün"de aynı sayıyla görünür.
- Durum: DRAFT

### REQ-WFL-013 — Her onayda görülecekler

- Kaynak: §4; D-087, D-097
- Öncelik: Must · Kademe: T2
- Açıklama: Her onayda işlemin özeti, ilgili proje/birim, sorumlu kişi, miktar/tutar, varsa belge ve fotoğraf, kontrol edilmesi gereken tutarsızlıklar ve **bu onayın bu kişiye neden geldiği** (hangi akış, hangi adım, hangi adresleme kuralıyla) görünür.
- Kabul kriterleri:
  - [ ] Her onayda kaynak akış, adım ve kayda giden bağlantı vardır.
  - [ ] Onayı bu kişiye getiren kural açıkça yazar (ör. "şantiye sorumlusu olduğunuz için").
- Durum: DRAFT

### REQ-WFL-014 — Onayın üç sonucu

- Kaynak: D-099; §4
- Öncelik: Must · Kademe: T1
- Açıklama: Onaylayıcı onaylar (akış ilerler), reddeder (akış kapanır) veya düzeltmeye geri gönderir (kayıt açana döner; düzeltildiğinde aynı onaya geri gelir).
- Kabul kriterleri:
  - [ ] Üç sonuç da her onayda mevcuttur.
  - [ ] Düzeltilip yeniden gönderilen kayıt, aynı onay adımına ve aynı onaylayıcı kuralına döner.
- Durum: DRAFT

### REQ-WFL-015 — Ret ve geri göndermede gerekçe zorunlu

- Kaynak: D-107; §4; §13
- Öncelik: Must · Kademe: T2
- Açıklama: Reddeden ve düzeltmeye geri gönderen kişi gerekçe yazmadan işlemi tamamlayamaz. Gerekçe, kaydı açan kişiye neyi düzelteceğini açıkça söyler.
- Kabul kriterleri:
  - [ ] Gerekçe alanı boşken ret ve geri gönderme yapılamaz.
  - [ ] Kaydı açan kişi, dönen kayıtta gerekçeyi görür ve bildirim alır.
- Durum: DRAFT

### REQ-WFL-016 — Onay ve düzeltme geçmişi

- Kaynak: §13; §38
- Öncelik: Must · Kademe: T2
- Açıklama: Bir kaydın onay geçmişinde kimin ne zaman gönderdiği, kimin neden geri çevirdiği, hangi düzeltmenin yapıldığı ve ne zaman yeniden gönderildiği görünür.
- Kabul kriterleri:
  - [ ] Her gönderme, karar ve yeniden gönderme; kişi, zaman ve gerekçeyle birlikte kaydın geçmişinde listelenir.
- Durum: DRAFT

### REQ-WFL-017 — Adım sahibinin belirlenmesi

- Kaynak: D-097
- Öncelik: Must · Kademe: T1
- Açıklama: Bir adımı kimin yapacağı dört yolla belirlenir: yetki tipiyle, rolle, kayıtla ilişkiyle (kaydı açanın amiri, şantiyenin sorumlu mühendisi) veya belirli bir kişiyle.
- Kabul kriterleri:
  - [ ] Dört adresleme yolu da tasarımcıda seçilebilir.
  - [ ] Kişi ayrıldığında veya rolü değiştiğinde, yetki tipi, rol ve ilişki ile adreslenen adımlar kendiliğinden doğru kişiye gider; belirli kişiyle adreslenen adımlar için akış kurucusuna uyarı düşer.
  - [ ] Adımı yapabilecek kimse yoksa akış örneği bekletilir ve kurucuya bildirilir.
- Durum: DRAFT

### REQ-WFL-018 — Dış taraf onayı

- Kaynak: D-102; §45.1, §45.5
- Öncelik: Must · Kademe: T2
- Açıklama: İşveren veya resmî kurum gibi panele giriş yapmayan birinin onayı, hazır bir alt akış şablonuyla beklenir: bizden biri görevi alır, iletir, cevabı "onayladı / reddetti" olarak işaretleyip belgesini ekler; süre içinde cevap gelmezse hatırlatma ve eskalasyon işler. Dış taraflara panel girişi açılmaz.
- Kabul kriterleri:
  - [ ] Şablon, tasarımcıda tek hamlede bir akışa eklenebilir.
  - [ ] Dış cevabın belgesi eklenmeden "onayladı" işaretlenemez.
- Durum: DRAFT

## E. Yetki, yayın ve sürüm

### REQ-WFL-019 — Akış tasarlama yalnızca tam görünürlüklü rollerde

- Kaynak: D-083
- Öncelik: Must · Kademe: T1
- Açıklama: Akış tasarlama yetkisi yalnızca sahip ve tüm veriyi görebilen rollere verilebilir. Bu, kodda zorlanır: kısıtlı görünürlüğü olan bir role bu yetki verilmeye çalışılırsa işlem reddedilir.
- Kabul kriterleri:
  - [ ] Kısıtlı bir role akış tasarlama yetkisi atanamaz; deneme hata verir ve kaydedilir.
  - [ ] Bir rolün görünürlüğü daraltılırsa, o roldeki akış tasarlama yetkisi kaldırılır ve sahibe bildirilir.
- Durum: DRAFT

### REQ-WFL-020 — Çalışan akış sistem yetkisiyle hareket eder

- Kaynak: D-082
- Öncelik: Must · Kademe: T1
- Açıklama: Çalışan bir akış, kurucusunun yetkisiyle sınırlı değildir; modüller arasında gerektiği veriyi okur. Bu, REQ-WFL-019 ile güvenlidir.
- Kabul kriterleri:
  - [ ] Akış, kurucusunun göremeyeceği bir modülün verisini okuyarak koşul değerlendirebilir.
  - [ ] Akışın yaptığı her işlem, akış sürümü ve adımıyla birlikte audit'e yazılır.
- Durum: DRAFT

### REQ-WFL-021 — Tasarımcı yetki tipi ve rol tanımlar ve atar

- Kaynak: D-098, D-101
- Öncelik: Must · Kademe: T1
- Açıklama: Tasarımcı, akışı kurarken o akış için yeni bir yetki tipi ve yeni bir rol tanımlayabilir ve rolü kişilere atayabilir. Atamalar, yönetici ekranındaki atamalarla aynı kayda yazılır ve orada da görünür.
- Kabul kriterleri:
  - [ ] Tasarımcıdan yapılan bir rol ataması, "Kullanıcılar & Roller" ekranında aynı şekilde görünür ve oradan geri alınabilir.
  - [ ] Her tanım ve atama, kim ve ne zaman bilgisiyle audit'e yazılır.
- Durum: DRAFT

### REQ-WFL-022 — Geçici yetki yoktur

- Kaynak: D-098
- Öncelik: Must · Kademe: T1
- Açıklama: Bir adımı yapabilmek için gereken yetki tipine veya role sahip olmak yeterlidir. Akış, bir adım süresince kimseye geçici yetki vermez.
- Kabul kriterleri:
  - [ ] Bir kişinin görebildikleri, akış çalışırken değişmez; yalnızca rol atamalarıyla değişir.
- Durum: DRAFT

### REQ-WFL-023 — Yayın ve telafi kontrolleri

- Kaynak: D-081
- Öncelik: Must · Kademe: T1
- Açıklama: Akışı kuran kişi canlıya da alır. Her yayında sahibe bildirim gider, yayın audit'e yazılır (kim, ne zaman, hangi sürüm) ve akış ilk 7 gün "yeni" işaretli kalır; o süredeki işlemleri ayrı bir listede görünür.
- Kabul kriterleri:
  - [ ] Yayın anında sahibe bildirim gider.
  - [ ] Yayınlanan akış 7 gün boyunca "yeni" işaretiyle ve işlem listesiyle görünür, sonra işaret kendiliğinden kalkar.
- Durum: DRAFT

### REQ-WFL-024 — Sürümleme

- Kaynak: ADR-006
- Öncelik: Must · Kademe: T1
- Açıklama: Akış tanımları sürümlüdür. Yürüyen bir akış örneği, başladığı sürümle tamamlanır; yeni sürüm yalnızca yeni başlayan örneklere uygulanır.
- Kabul kriterleri:
  - [ ] Yeni sürüm yayımlandığında yürüyen örneklerin hiçbiri yeni sürüme geçmez.
  - [ ] Her örneğin hangi sürümle çalıştığı görünür.
- Durum: DRAFT

### REQ-WFL-025 — Yayından önce deneme çalıştırması zorunlu

- Kaynak: ADR-006; D-100
- Öncelik: Must · Kademe: T1
- Açıklama: Bir akış, örnek veriyle deneme çalıştırması yapılmadan yayımlanamaz. Deneme, her adımın hangi kişiye düşeceğini, koşulların sonucunu ve üretilecek görev/bildirimleri gösterir; hiçbir gerçek kayıt oluşturmaz.
- Kabul kriterleri:
  - [ ] Deneme çalıştırması yapılmamış veya son değişiklikten sonra tekrarlanmamış bir akışta "Yayınla" pasiftir.
  - [ ] Deneme çalıştırması gerçek veri üzerinde hiçbir kalıcı değişiklik yapmaz.
- Durum: DRAFT

## F. Tasarımcı ve şablonlar

### REQ-WFL-026 — Soru-cevap ve şema birlikte

- Kaynak: D-085
- Öncelik: Must · Kademe: T2
- Açıklama: Akış iki görünümle kurulur: adım adım soru-cevap ("Ne olunca başlasın? Kim onaylasın? Onaylanmazsa ne olsun?") ve kutu-ok şeması. İkisi de düzenlenebilir ve aynı tanımı gösterir. Ekran yerleşimi ve menüdeki yeri ayrı bir soru-cevap turunda kararlaştırılır (D-108).
- Kabul kriterleri:
  - [ ] Bir görünümde yapılan değişiklik diğerinde aynı anda görünür.
- Durum: DRAFT

### REQ-WFL-027 — Şablonlar kopya olarak gelir

- Kaynak: D-086
- Öncelik: Must · Kademe: T2
- Açıklama: Şirketin varsayılan akışları şablondur; kullanılan akış onun kopyasıdır. Şablon güncellendiğinde kopya kendiliğinden değişmez, "yeni sürüm var" bildirimi çıkar. Kopya şablona sıfırlanabilir.
- Kabul kriterleri:
  - [ ] Şablon güncellemesi, değiştirilmiş kopyaları değiştirmez ve kopya sahibine bildirim üretir.
  - [ ] "Şablona sıfırla" işlemi yeni bir akış sürümü olarak yayımlanır ve audit'e yazılır.
- Durum: DRAFT

### REQ-WFL-028 — Varsayılan şirket akışları

- Kaynak: D-089; §45; `docs/workflows/README.md`
- Öncelik: Must · Kademe: T2
- Açıklama: Panel şu şablonlarla gelir: günlük saha kaydı onayı, malzeme çıkış talebi, ödeme onayı, hakediş → fatura, personel çıkışı, revizyon talebi, stok sayımı onayı, satın alma talebi, teklif onayı ve §45'in sekiz uçtan uca süreci. §45 süreçleri motorun kabul testleridir.
- Kabul kriterleri:
  - [ ] §45'in sekiz sürecinin her biri, TASK-0042'de yazılan tanımıyla motorda çalıştırılıp beklenen görevleri ve kayıtları üretir.
- Durum: DRAFT

## G. Kilit ve istisna

### REQ-WFL-029 — Bağımlılık kilidi

- Kaynak: ADR-006; §45.4
- Öncelik: Must · Kademe: T1
- Açıklama: Kilit, kaydı silmez veya gizlemez; yalnızca bir durum geçişini engeller ve sebebini ekranda yazar ("zimmet kapanmadan çıkış tamamlanamaz").
- Kabul kriterleri:
  - [ ] Kilitli geçiş denendiğinde işlem yapılmaz ve kilidin sebebi ile kaynağı gösterilir.
- Durum: DRAFT

### REQ-WFL-030 — Kilidi aşma

- Kaynak: D-084
- Öncelik: Must · Kademe: T1
- Açıklama: Kilidi yalnızca sahip ve genel müdür aşabilir; gerekçe zorunludur, audit'e yazılır ve ilgililere bildirim gider.
- Kabul kriterleri:
  - [ ] Sahip ve genel müdür dışında hiçbir rol kilidi aşamaz.
  - [ ] Gerekçesiz aşma yapılamaz; her aşma audit'te ve ilgili kaydın geçmişinde görünür.
- Durum: DRAFT

### REQ-WFL-031 — İstisnai manuel işlem izni

- Kaynak: §37
- Öncelik: Must · Kademe: T1
- Açıklama: Olağan dışı bir durumda kullanıcı istisnai manuel işlem için izin talep eder; yönetim yalnızca gerekli alan veya işlem için izin verir; değişikliğin nedeni zorunludur; kim, ne zaman, neden değiştirdi geçmişte kalır. Sahip bu istisna yetkisini açıp kapatabilir.
- Kabul kriterleri:
  - [ ] İzin yalnızca talep edilen alan veya işlem için geçerlidir; kapsam dışı bir değişiklik reddedilir.
  - [ ] Sahip istisna yetkisini kapattığında yeni izin talebi açılamaz.
- Durum: DRAFT

## H. Merkezi kurallar

### REQ-WFL-032 — Kurallar merkezi ve tarih bazlı sürümlü

- Kaynak: Mimari §13; ADR-005
- Öncelik: Must · Kademe: T1
- Açıklama: Şirket kuralları (ör. günlük kaydın en geç ertesi sabah 08:00'de girilmesi, zayide fotoğraf zorunluluğu, belirli tutarın üstündeki ödemenin sahip onayı istemesi) sistemin farklı yerlerine dağılmaz; veri olarak tek yerde tutulur ve geçerlilik tarihiyle sürümlenir. Geçmiş hesaplar, o tarihte geçerli kuralla yapılmış haliyle kalır.
- Kabul kriterleri:
  - [ ] Bir kuralın değişmesi, önceki tarihlere ait kayıtların değerlendirmesini değiştirmez.
  - [ ] Hangi kuralın hangi tarihte ne olduğu görülebilir.
- Durum: DRAFT

## I. İzlenebilirlik

### REQ-WFL-033 — "Bu neden açıldı" her zaman izlenebilir

- Kaynak: D-087
- Öncelik: Must · Kademe: T1
- Açıklama: Akışın ürettiği her görev ve bildirim, onu üreten akışı, sürümü, adımı ve kaydı taşır ve oraya bağlantı verir. Görevin ve bildirimin gösterimi REQ-TSK'dadır; kaynağın taşınması burada.
- Kabul kriterleri:
  - [ ] Akışın ürettiği hiçbir görev veya bildirim kaynak bilgisi olmadan oluşturulamaz.
- Durum: DRAFT

### REQ-WFL-034 — Akış örneği çalışma günlüğü

- Kaynak: D-087; ADR-006
- Öncelik: Must · Kademe: T1
- Açıklama: Her akış örneğinin hangi olayla başladığı, hangi adımlardan hangi sonuçla geçtiği, kime ne zaman düştüğü ve nerede durduğu bir çalışma günlüğünde görünür.
- Kabul kriterleri:
  - [ ] Bir görevden, onu üreten akış örneğinin çalışma günlüğüne gidilebilir.
  - [ ] Hata ile durmuş örnekler ayrı listelenir.
- Durum: DRAFT

## J. Kayıt türü üreteci

Yapımı Phase 09R'dir (ilk dilim pilotundan sonra, D-105). Mimarisi Phase 03'te, veri modeli Phase 04'te, uçtan uca denemesi Phase 06'da hazırlanır.

### REQ-WFL-035 — Kullanıcı kendi kayıt türünü tanımlar

- Kaynak: D-079
- Öncelik: Must · Kademe: T1
- Açıklama: Yetkili kullanıcı, kendi alanları, başka kayıtlarla ilişkileri, ekran düzeni ve raporlarıyla yeni bir kayıt türü tanımlar; tanımlanan tür akışlarda kullanılabilir.
- Kabul kriterleri:
  - [ ] Tanımlanan bir tür için liste ve detay ekranı kod yazılmadan kullanılabilir hale gelir.
  - [ ] Tür, mevcut bir kayda (ör. şantiye, personel, ekipman) ilişkilendirilebilir.
  - [ ] Tür, bir akışın tetikleyicisi, koşulu ve kayıt oluştur adımında kullanılabilir.
- Durum: DRAFT

### REQ-WFL-036 — Kullanıcı tanımlı kayıtlar panelin yetki modelini kullanır

- Kaynak: D-092
- Öncelik: Must · Kademe: T1
- Açıklama: Rol bazında görme ve yazma, şantiye bazında satır görünürlüğü ve hassas alan işaretleme, tür tanımlanırken seçilir ve diğer kayıtlarla aynı şekilde uygulanır.
- Kabul kriterleri:
  - [ ] Yetkisi olmayan kullanıcı, kullanıcı tanımlı bir kaydı ne listede ne aramada ne raporda görür.
- Durum: DRAFT

### REQ-WFL-037 — Arama, rapor ve "Bugün" katılımı tanımda seçilir

- Kaynak: D-093
- Öncelik: Must · Kademe: T2
- Açıklama: Her tür için aramaya girip girmeyeceği, raporlara ve dışa aktarmaya katılıp katılmayacağı ve "Bugün"de sayısının görünüp görünmeyeceği ayrı ayrı seçilir.
- Kabul kriterleri:
  - [ ] Seçimlerin her biri tek başına açılıp kapatılabilir ve hemen etkili olur.
- Durum: DRAFT

### REQ-WFL-038 — Tür değişince geçmiş korunur

- Kaynak: D-094
- Öncelik: Must · Kademe: T1
- Açıklama: Bir alan kaldırıldığında geçmiş kayıtlardaki değerleri silinmez, yalnızca gösterilmez. Kim ne zaman değiştirdi bilgisi bu kayıtlar için de tutulur.
- Kabul kriterleri:
  - [ ] Kaldırılan bir alanın geçmiş değeri kaydın geçmişinde okunabilir kalır.
- Durum: DRAFT

### REQ-WFL-039 — Kullanıcı tanımlı kayıtlar deftere yazmaz

- Kaynak: D-077, D-080
- Öncelik: Must · Kademe: T1
- Açıklama: Kullanıcı tanımlı bir kayıt türü para, stok veya zimmet defterine hareket üretemez; hesaplama kurallarını değiştiremez.
- Kabul kriterleri:
  - [ ] Üretecin alan tiplerinde defter hareketi oluşturan bir tip yoktur.
- Durum: DRAFT

---

## Yetenek kataloğu — WFL

Biçim: `docs/requirements/README.md`. WFL'in kendi yayımladıkları; diğer modüllerin akışları bunları dinleyebilir.

### Olaylar

| Kod | Ad | Ne zaman | Taşıdığı alanlar | Veri sınıfı |
|---|---|---|---|---|
| `flow.published` | Akış yayımlandı | Bir akış sürümü canlıya alındığında | akış, sürüm, yayımlayan | iç |
| `flow_instance.started` | Akış başladı | Bir akış örneği tetiklendiğinde | akış, sürüm, tetikleyen olay/kayıt | iç |
| `flow_instance.completed` | Akış tamamlandı | Bir örnek bitiş adımına ulaştığında | akış, sürüm, sonuç | iç |
| `flow_instance.failed` | Akış hata ile durdu | Bir adım hata verdiğinde veya koşul süre sınırını aştığında | akış, sürüm, adım, hata | iç |
| `approval.decided` | Onay kararı verildi | Onayla / reddet / düzeltmeye geri gönder seçildiğinde | kayıt, karar, karar veren, gerekçe | kaydın sınıfı |
| `lock.overridden` | Kilit aşıldı | Sahip veya GM bir kilidi aştığında | kayıt, kilit, aşan, gerekçe | iç |

### Aksiyonlar

WFL'in kendi aksiyonları palet adımlarıdır (REQ-WFL-005); ayrıca katalog aksiyonu yayımlamaz.

### Koşul alanları

| Kod | Ad | Tip | Veri sınıfı |
|---|---|---|---|
| `approval.decision` | Onay kararı | seçim: onayla / reddet / geri gönder | iç |
| `approval.waiting_hours` | Onayın beklediği süre | sayı (saat) | iç |
| `flow_instance.age_days` | Akış örneğinin yaşı | sayı (gün) | iç |
