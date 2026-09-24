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
