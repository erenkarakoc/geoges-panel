# Phase 08 — İş Akışı Motoru Planı

Durum: ONAY BEKLİYOR (D-281 PROPOSED) · Tarih: 2026-09-24 · Faz: Phase 08 · Bağlı: `ai/MASTER_ROADMAP.md`,
`docs/architecture/WORKFLOW_ENGINE.md`, `docs/requirements/REQ-WFL.md`

Bu belge Phase 08'in keşif ve planlama adımıdır (PROJECT_RULES §2, §3, §10). Motorun **ne yapacağı**
REQ-WFL'de, **nasıl kurulacağı** WORKFLOW_ENGINE.md'de yazılı ve ikisi de CONFIRMED; burada yazılan
şey **hangi sırayla, hangi parçalarla ve neye karşı kabul edileceği**.

## 1. Soru turu — sonuç

| Konu | Sahibin kararı (2026-09-24) | Kayıt |
|---|---|---|
| Motor, kayıtları Faz 09–11'de gelecek akışlarla nasıl kabul edilir | Deneme kayıt türüyle uçtan uca; sekiz gerçek şablon kendi diliminde etkinleştirilip orada kabul edilir | D-279, OQ-038 |
| Yetenek kataloğu mevcut beş modül için de yazılsın mı | Evet: mekanizma + IAM, ADM, AUD, DOC, TSK'nın gerçek yetenekleri | D-280, OQ-039 |
| M1 turu Faz 08'i bekletir mi | Hayır; tur ertelendi, Faz 07 açık kalır | D-278 |

Soru çıkmayan konular, çünkü kaydı var ve CONFIRMED: adım paleti (REQ-WFL-005), motorun
yapamayacakları (REQ-WFL-006, D-091), tetikleyiciler (D-103), koşullar (D-100), sahiplik biçimleri
(D-097), sınırlar (`docs/architecture/WORKFLOW_ENGINE.md` bölüm 7), yayın ve sürümleme (REQ-WFL-023/024), deneme çalıştırması
(REQ-WFL-025), şablonlar (D-086).

## 2. Sıra ve görevler

| Sıra | Görev | Neden bu sırada |
|---|---|---|
| 1 | TASK-0118 — Yetenek kataloğu ve sözleşme testi | Motor yalnız katalogdakini çağırabilir; katalog yoksa motorun çağıracak gerçek bir şeyi de, sözleşme testinin karşılaştıracak bir şeyi de olmaz |
| 2 | TASK-0117 — Motor çekirdeği: tanım, örnek, yürütme | Katalogun üstüne kurulur; kabul deneme kayıt türüyle uçtan uca |
| 3 | TASK-0119 — Görsel tasarımcı ve soru-cevap (aynı JSON'u üretir, REQ-WFL-026) | Motor çalışmadan tasarımcı tasarlanamaz; ikisi aynı şemayı paylaşır |
| 4 | TASK-0120 — Onay Merkezi'nin gerçek kuyruğa bağlanması ve sekiz şablonun JSON olarak gelmesi | Kuyruk motorun ürettiği onay kayıtlarını gösterir; şablonlar dilimlerde etkinleşir |

TASK-0119 ve TASK-0120 kendi planlarını TASK-0117 bittiğinde alır; bu belge 1. ve 2. sırayı tarif
eder, çünkü ötesini bugünden tarif etmek motor çalışmadan varsayım üretmek olur.

## 3. TASK-0118 — Yetenek kataloğu ve sözleşme testi

**Bugünkü durum.** Yirmi beş modülün REQ dosyasının sonunda yetenek kataloğu **yazılı** (olaylar,
aksiyonlar, koşul alanları; her birinin veri sınıfıyla). Kodda bunun karşılığı yok: CI'ın Faz
05'ten beri söz verdiği sözleşme testi (`docs/infrastructure/CI.md` bölüm 2) bu yüzden hiç
kurulmadı — karşılaştıracağı bir ilan yoktu.

**Biçim (adım 1).** Her modül kendi `capabilities.ts` dosyasında tipli bir ilan verir ve onu
`index.ts`'ten yayımlar:

- **Olay:** kod, ad, ne zaman, taşıdığı alanlar, veri sınıfı.
- **Aksiyon:** kod, ad, girdi şeması (zod), gereken yetki, tekrarlanırsa ne olur, yarıda kalırsa ne
  olur, ve **çalıştıran fonksiyonun kendisi**. Fonksiyon referansı ilanın parçasıdır; böylece
  "ilan var, kod yok" ayrışması derleme zamanında imkânsız olur, sözleşme testinin işi de
  ilanın kayıtla ve gerçekle uyuşmasını denetlemeye kalır.
- **Koşul alanı:** kod, ad, tip, veri sınıfı, hangi kayıt türünde okunur.
- **Sahiplik ilişkisi:** `site.coordinator`, `record.submitter` gibi adlar (D-097).
- **Durum:** `active` ya da `deprecated`. Silme yoktur (REQ-WFL-004).

Kataloglar bileşim kökünde (`src/records`) birleştirilir; modüller birbirinin katalogunu
okumaz, motor da modülleri tek tek tanımaz (ADR-001, MODULE_MAP).

**Sözleşme testi (adım 2).** Üç karşılaştırma, üçü de CI'da:

1. **Kod → kayıt.** Kodda ilan edilen her yeteneğin REQ dosyasındaki katalog tablosunda karşılığı
   vardır; kod ve kayıt aynı adı ve aynı veri sınıfını söyler. Tersi zorunlu değildir: kayıttaki
   yetenekler bitmiş ürünü tarif eder, yapılmamış olanı kod ilan etmez.
2. **İlan → gerçek.** İlan edilen her olay kodu, kodda ya da göçlerde gerçekten yayımlanan bir
   olaydır (`core.publish_event('...')` taraması); yayımlanan ama ilan edilmeyen olay da rapor
   edilir.
3. **Silinmezlik.** Yayımlanmış yetenek kodlarının anlık görüntüsü depoda tutulur; bir kodun
   kaybolması ya da imzasının değişmesi CI'ı kırar, `deprecated` işaretlenmesi geçer
   (REQ-WFL-004'ün kabul ölçütü).

**Beş modülün ilanı (adım 3).** Yalnız **bugün gerçekten yapılabilen** yetenekler: TSK'da görev
açma ve bildirim gönderme, DOC'ta belge arşivleme ve sürüm okuma, AUD'da revizyon talebi başlatma ve
kayıt geçmişi koşulları, ADM'de tarihli kural okuma ve katalog öğesi çözme, IAM'de kişi/rol
ilişkileri (sahiplik biçimleri için). Deftere yazan hiçbir aksiyon yoktur ve olmayacaktır (D-080).

**Kabul.** Sözleşme testi üç ayrışmayı da yakalar — bunu kanıtlamak için testin kendisi, bilerek
bozulmuş bir ilanla düşer (TASK-0116'daki gibi). Beş modülün ilanı kayıtla uyuşur. Motor henüz
yoktur; katalog tek başına çağrılabilir bir yüzeydir.

## 4. TASK-0117 — Motor çekirdeği

**Veri modeli (göç).** `wfl` şeması: tanım (`key`, `version`, `status`, JSON, içerik özeti), örnek
(tanım sürümüne bağlı, durum, tetikleyen kayıt, tek-örnek anahtarı), adım durumu, çalışma günlüğü,
ve deneme çalıştırması kanıtı (tanımın SHA-256 özetiyle bağlı). Satır güvenliği ve katman kaydı
Faz 07'nin kurallarına uyar; `scope_source` beyan edilir (D-277).

**Yürütme.** Örnek bir durum makinesidir; her ilerleme kendi işleminde yazılır ve outbox'a kendi
olayını bırakır (`docs/architecture/WORKFLOW_ENGINE.md` bölüm 4). Mevcut iş kuyruğu ve outbox kullanılır, yeni bir altyapı
kurulmaz (TASK-0104).

**Sırayla kurulacak parçalar.** (a) tanım deposu, sürüm ve yayın kuralları; (b) tetikleyiciler
(olay, saat, eşik, elle); (c) adım paleti: başlangıç, koşul, bitiş → onay, görev, bildirim,
eskalasyon → süre/bekleme, paralel dal, birleşme → kayıt oluştur/durum değiştir, kilit, alt akış,
her biri için; (d) koşullar, geçmişe bakanlar dahil, süre sınırıyla; (e) kuru mod; (f) motorun
sınırları.

**Kabul (D-279).** Depoda yaşayan bir **deneme kayıt türü** ve onun yetenek kataloğu üzerinde uçtan
uca: sekiz adımlık bir tanım tetiklenir, onaydan ve görevden geçer, koşul dallanır, süre adımı
uyandırılır, kuru mod aynı yolu iş etkisi olmadan yürür, yayın denemesiz reddedilir, yürüyen örnek
eski sürümüyle biter. SPIKE-04/05/06'nın taşıdığı kontroller (`docs/architecture/WORKFLOW_ENGINE.md` bölüm 12) bu listenin
parçasıdır. Deneme kayıt türü test malzemesidir; ekran olarak gelmez.

## 5. Bilinçli olarak bu fazda olmayanlar

- Kullanıcının kendi kayıt türünü tanımlaması (Faz 09R, D-105).
- Sekiz şablonun gerçek kayıtlarla kabulü (kendi dilimlerinde, D-279).
- Dış taraf onayı şablonunun gerçek dış tarafla denenmesi (D-102; kayıt tipi gelince).
- Tasarımcının ekran tasarımı `docs/ui-ux/ADMINISTRATION.md`'de yazılı; bu plan onu tekrar etmez.

## 6. Bu planın bilinen riski

Motor, Faz 07 temelinin sahibi tarafından kullanılarak doğrulanmadığı bir zeminde kurulacak
(D-278). M1 turundan çıkacak bir düzeltme temelde değişiklik isterse, üstünde motor dururken
yapılacak. Bu, sahibin bilerek aldığı karardır ve burada yazılı olması riskin kaybolmaması içindir.

## TASK-0119 — Görsel tasarımcı ve soru-cevap ikizi (uygulama planı, 2026-09-25)

Karar: D-283 (ONAY BEKLİYOR). Tasarım kaynağı `docs/ui-ux/ADMINISTRATION.md` bölüm 2-3 (SCR-195,
SCR-196), ölçüm kaynağı SPIKE-07, kurallar REQ-WFL-019, 023-026 ve D-085.

**Neden şimdi yapılabilir.** Motor bitti (TASK-0117): tanım şeması, taslak/yayın kuralları, kuru mod
ve çalışma günlüğü duruyor. Tasarımcının üreteceği şey zaten var olan `FlowDefinition`; bu plan onu
**ekranda kurmanın** planı, yeni bir model icat etmenin değil.

### 1. İki editör, tek JSON (REQ-WFL-026, D-085)

Şema alanı ile yan paneldeki sorular **aynı tanımı** düzenler. Panel bir adımın alanlarını sorar
("Kim onaylasın?", "Onaylanmazsa ne olsun?"), şema adımların **sırasını ve dallarını** kurar; ikisi
de tek bir `FlowDefinition` nesnesine yazar ve biri diğerinin yazdığını açabilir. Doğrulama tek
yerdedir: `definitionSchema`. Ekranın kendi kontrol listesi yoktur — ikinci bir doğrulayıcı, kuru
modun ikinci bir değerlendiricisi ne ise odur.

### 2. Kütüphane ve yükleme

`@xyflow/react` (MIT, SPIKE-07 ile ölçüldü: 40 adımda p95 12,3 ms/kare, ~88 KB gzip). **Yalnız
tasarımcı rotası** açıldığında indirilir (SPIKE-07 not 3); Yönetim sayfasının diğer bölümleri bu
yükü taşımaz. Kutular, paneller, menüler ve formlar COSS bileşenleridir; özel olan yalnız şema
alanının kendisidir (D-224, ADR-009 — sahip onayladı).

### 3. Ekranlar

- **SCR-195 — İş akışları listesi** (`/admin/workflows`), bu görevde **asgari**: ad, tetik, durum,
  sürüm, son yayın ve "Yeni akış". Şablonlar ve "yeni akışlar" sekmeleri TASK-0120'nin işi.
- **SCR-196 — Tasarımcı** (`/admin/workflows/[key]`), tam sayfa: başlık (ad, sürüm, durum rozeti,
  "Deneme çalıştır", "Yayımla"), şema, yan panel, hata işaretleri.

### 4. Taslağın nerede durduğu

Çalışma kopyası tarayıcıda, kaynak veritabanındadır: her düzenleme `wfl.save_draft` ile açık taslağı
**değiştirir** (yeni sürüm açmaz — motor zaten böyle kurulu). Kaydetme gecikmeli ve otomatiktir;
başlıkta "kaydedildi / kaydediliyor" durumu görünür. Yayımlanmış bir sürüm düzenlenemez; düzenlemeye
başlamak yeni bir taslak açar.

### 5. Hatalar, deneme ve yayın

- **Hata işaretleri** `definitionSchema`'nın kendi bulgularından gelir; her bulgu bir adıma bağlanır
  (yol bilgisi zaten şemada var). Hata varken deneme çalıştırılamaz (ADMINISTRATION bölüm 3).
- **Deneme** var olan `dryRunVersion`'ı çağırır: örnek kayıt seçilir, sonuç adım adım yolu, her
  adımın kime düşeceğini ve koşulların gerçek veriyle cevabını gösterir. Deneme hiçbir şey yazmaz.
- **Yayın** onay penceresiyle: bu sürümde ne değişti, yürüyen kaç örnek eski sürümle devam edecek,
  sahibe bildirim gideceği. Sonra `publishVersion`; denemesiz yayını zaten veritabanı reddediyor.

### 6. Klavye ve telefon (SPIKE-07'nin taşıdığı notlar)

Şema **tek Tab durağıdır**; içinde ok tuşlarıyla kutular arasında gezilir, Enter adımın panelini
açar, Escape şemaya döner. Telefonda tam düzenleme vardır: şema tam ekran, panel alttan çekmece,
mini harita kapalı gelir.

### 7. Yetki

Tasarımcıyı yalnız `wfl.workflow.design` olan açar (REQ-WFL-019); bu yetki zaten yalnız tam
görünürlüklü rollere verilebiliyor ve bunu 0003 zorluyor. Yetkisiz kişi standart "bu ekranı görme
yetkiniz yok" halini görür.

### 8. Bu görevde bilerek olmayanlar

- Şablonlar, "yeni akışlar" sekmesi ve Onay Merkezi'nin gerçek kuyruğu — TASK-0120.
- Çalışma günlüğü ekranı (SCR-197) — kendi görevinde; motorun günlüğü zaten yazılı.
- Tasarımcı içinden yeni yetki tipi ve rol tanımlama (D-098, D-101) — IAM'in kendi ekranıyla gelir.
- Sürükleyerek kutu taşıma ve kenar çizme kütüphanenin hazır yetenekleridir; ölçülmedi (SPIKE-07'nin
  yazdığı sınır) ve ilk turda yalnız "+" ile ekleme ve panelden bağlama kullanılacaktır.

### 9. Kabul

Bir akış baştan sona **tasarımcıdan** kurulabilir: adımlar eklenir, sorular cevaplanır, hata
işaretleri düzelir, deneme çalıştırılır ve yayımlanır; ardından gerçek bir olay o akışı başlatır ve
çalışma günlüğü tasarımcıdaki yolu gösterir. Erişilebilirlik: şema tek Tab durağı, ok tuşlarıyla
gezinme, açık ve koyu temada okunabilirlik. Telefonda 375 px'te yatay kaydırma yok.


## TASK-0120 — Onay Merkezi'nin gerçek kuyruğu ve şablonlar (uygulama planı, 2026-09-25)

Karar: D-285 (ONAY BEKLİYOR). Gereksinimler REQ-WFL-012…018, REQ-WFL-027, REQ-WFL-028, REQ-WFL-033,
REQ-IAM-020/025/026; ekranlar SCR-012 (Onaylar), SCR-195'in kalan iki sekmesi, SCR-197 (çalışma
günlüğü); kararlar D-070, D-086, D-087, D-097, D-099, D-104, D-106, D-107, D-223.

**Neden şimdi yapılabilir.** Motor onayları açıyor, kararı olay olarak geri alıyor ve akışı
sürdürüyor (TASK-0117); tasarımcı bir akışı kurup yayımlıyor (TASK-0119). Eksik olan, **insanların bu
motorla temas ettiği iki yer**: onayın önüne düştüğü ekran ve akışların şablondan gelmesi.

### 1. Bu görev iki iş

1. **Onay Merkezi'nin gerçek kuyruğu** (SCR-012): bugün ekran boş durumdan başka bir şey
   göstermiyor, çünkü örnek kuyruk sahibin isteğiyle kaldırılmıştı (D-106).
2. **Şablon mekanizması ve varsayılan akış tanımları** (REQ-WFL-027, REQ-WFL-028): şablonlar kopya
   olarak gelir, kopya şablona sıfırlanabilir, şablonun yeni sürümü kopyayı sessizce değiştirmez.

### 2. Kuyruk için eksik olan tek veri: "bu onay bana neden geldi"

Motor sahibi çalışma anında hesaplıyor ama **hangi kuralla** hesapladığını yazmıyor. REQ-WFL-013 ve
REQ-WFL-033 tam olarak bunu istiyor: "şantiye sorumlusu olduğunuz için". Göç **0057** onayın ve adım
durumunun yanına adresleme kuralını ve onun insan diliyle cümlesini koyar; motor onayı açarken yazar.
Bu cümle üç yerde aynı cümledir: onay kartında, görevde ve bildirimde (REQ-TSK-008).

Aynı göçte ikinci bir eksik kapanır: **bir onay tek kişiye değil bir gruba da düşebilir.** Sahip
onayı, sahip katmanındaki herkese görünür ve herhangi biri tamamlar (REQ-IAM-025, REQ-IAM-026); bugün
`owner_user_id` tek kişi. Alan boş kalabilir hale gelir, kuralın kendisi satırda durur, satır
güvenliği kuralı kimin görüp karar verebileceğini söyler. Vekâlet (REQ-IAM-020) aynı kapıdan geçer:
vekil, vekâlet ettiği kişinin onaylarını kendi kuyruğunda **"vekâletle"** etiketiyle görür.

### 3. Kuyruk ekranı (SCR-012)

- **Tek kayıt ekranı doldurur** (D-070): karar verilince sıradaki **listeye dönmeden** açılır.
- Kartta: işlemin özeti, kaynak akış ve adım, kayda bağlantı, bu onayın neden bu kişide olduğu, ne
  zamandan beri beklediği, daha önce geri gönderildiyse o geçmiş (REQ-WFL-016).
- Üç sonuç (REQ-WFL-014): onayla · düzeltmeye gönder · reddet. Son ikisinde gerekçe `Dialog` içinde
  zorunlu (REQ-WFL-015) — tabloda da zorunlu, yani ekran erken söyler, veritabanı son söyler.
- Boş durum bugünkü cümleyle kalır; "bu kayıt başkası tarafından karara bağlandı" hali de yazılı
  (SCREEN_STATES).
- **Rozet sayısı** çalışma katmanında ve "Bugün"de aynı sayı olmalı (REQ-WFL-012). `workCounts` bugün
  boş bir sabit; kabuk sayıyı kişiye göre okuyup verecek şekilde değişir ve sayıyı WFL ile TSK söyler.

**Bilerek eksik ve nedeni yazılı:** REQ-WFL-013 kartta miktar/tutar, belge ve tutarsızlık da istiyor.
Bunlar kaydın sahibi modülden gelir ve o modüller henüz yok (kayıt türleri Faz 09R). Kart bugün
akışın bildiği her şeyi gösterir; zenginleşmesi modüllerin kendi dilimlerinde olur ve o dilimlerin
kabulüne yazılır.

### 4. Şablonlar (REQ-WFL-027, REQ-WFL-028)

Göç **0058**: şablon kaydı (anahtar, ad, sürüm, tanım) ve akışın hangi şablonun kaçıncı sürümünden
kopyalandığı. Üç işlem:

- **Kopyasını kullan:** şablonun tanımıyla yeni bir akış taslağı; bağ kaydedilir.
- **Şablona sıfırla:** yeni bir akış **sürümü** olarak yayımlanır ve denetim kaydına yazılır — sessiz
  bir üzerine yazma değil (REQ-WFL-027 kabul kriteri).
- **"Yeni sürüm var":** şablon sürümü kopyanınkinden yeniyse SCR-195'te rozet ve kopyanın sahibine
  bildirim; kopya kendiliğinden değişmez.

Tanımların kendisi JSON olarak gelir (`db/seeds/`): günlük saha kaydı onayı · malzeme çıkış talebi ·
ödeme onayı · hakediş → fatura · personel çıkışı · revizyon talebi · stok sayımı onayı · satın alma
talebi · teklif onayı, ve sekiz uçtan uca sürecin **zincir halkaları** (D-104 — tek uzun akış değil).
Her şablon için CI'da iki şey sınanır: tanım `definitionSchema`'dan geçer ve kuru modda baştan sona
yürür. Gerçek kayıtlarla kabul, D-279 gereği kendi dilimlerinde.

### 5. Çalışma günlüğü (SCR-197)

Bu görevde, çünkü onay kartındaki "neden bende" oradan devam ediyor: liste (akış, sürüm, tetikleyen
olay ve kayıt, durum, beklediği adım ve kişi; süzgeçler) ve detay (adımların zaman çizelgesi, her
adımın sonucu ve kime düştüğü, hata ile duran örnekte nedeni). Yalnız akış tasarlama yetkisi olan
görür (D-223); yetkisi olmayan kişi aynı bilgiyi görevindeki ve bildirimindeki **cümleyle** alır.

### 6. Sıra

1. Göç 0057 — adresleme kuralı ve cümlesi, gruba düşen onay, satır güvenliği; motor yazmaya başlar.
2. Kuyruk ekranı, üç sonuç, gerekçe penceresi, sıradakine geçiş, rozet sayıları.
3. Göç 0058 — şablon kaydı, kopyala / sıfırla / "yeni sürüm var".
4. Şablon tanımları ve her biri için şema + kuru mod sınaması.
5. SCR-195'in "Şablonlar" ve "Yeni akışlar" sekmeleri, SCR-197 çalışma günlüğü.

### 7. Bu görevde bilerek olmayanlar

- Kartın zengin özeti (miktar, belge, tutarsızlık): kayıt türleri gelince, o modüllerin dilimlerinde.
- Dış taraf onayının gerçek bir dış tarafla kabulü (D-102).
- Şablonların gerçek kayıtlarla kabulü (D-279).
- İstisnai manuel işlem izni (REQ-WFL-031): kendi görevi, IAM tarafında.

### 8. Kabul

Bir onay gerçek bir akıştan düşer, kuyrukta **neden orada olduğunu söyleyerek** görünür, üç sonucu da
verilebilir, gerekçesiz ret ve geri gönderme olmaz, karardan sonra sıradaki açılır ve rozet sayısı üç
yerde aynıdır. Bir şablonun kopyası kurulur, değiştirilir, şablon güncellenince kopya değişmez ama
haber verir, "şablona sıfırla" yeni bir sürüm olarak yayımlanır. Her varsayılan şablon CI'da şemadan
ve kuru moddan geçer.
