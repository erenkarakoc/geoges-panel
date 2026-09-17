# Kurgulanabilir İş Akışı Altyapısı — Yön Belgesi

> **Durum: TEKLİF — karar verilmedi.** Bu belge bir karar kaydı değildir; sahibin
> 2026-09-17 tarihli talebi üzerine, yol haritasına işlenmeden önce tartışmayı tek
> yerde toplamak için yazılmıştır. Karar verildiğinde içeriği `CHG-006` kaydına,
> ADR revizyonlarına ve `ai/MASTER_ROADMAP.md`'ye taşınır ve **bu dosya silinir**.
> Silinene kadar hiçbir kalıcı kayıt bu dosyayı kaynak gösteremez.
>
> İlgili kayıtlar: ADR-005 (hedefli esneklik), ADR-006 (görsel iş akışı motoru),
> ADR-007 (teslim stratejisi), `docs/architecture/MODULE_MAP.md`,
> `docs/sources/functional-scope.md` §4, §13, §25, §45,
> `docs/sources/architecture-principles.md` §6, §7.

---

## 1. Sahibin talebi

Sahip (2026-09-17):

> "Planımızda hazır iş akışları oluşturmak var — yeni işten tahsilata, siparişten
> sahaya, günlük saha üretimi, personel çıkışı, işveren gecikmesi, toplantı
> kararından göreve gibi. Bunları hazır üretmek yerine öyle bir altyapı kursak da
> custom iş akışları üretilebiliyor olsa mümkün mü?"

Ve aynı gün, yönü netleştirerek:

> "Hazır ama olabildiğince özelleştirmeye dayalı bir altyapı: roller, işler, işlerin
> birbiriyle bağlantısının mevcut modüllerle yeni bir iş akışı adıyla istenildiği
> anda yetkisi olan kişilerce oluşturulabilmesi. Sitedeki her işlev bağımsız bir
> modül olacak; bunların nasıl bağdaştığı, nasıl aktığı ise özelleştirilebilen bir
> aksiyon olacak."

Ağırlık merkezi değişiyor: bugünkü plan "modülleri kur, iş akışı motoru Phase 08'de
üstlerine otursun" diyor; istenen "önce bağlantı altyapısını kur, modüller ona
takılsın".

## 2. Bu yeni bir karar değil; kayıtlı kararın sırası ve ağırlığı

ADR-006 zaten şunu söylüyor: akışlar koda gömülmez, merkezi motorda **sürümlü
tanımlar** olarak çalışır, yetkili kullanıcı görsel tasarımcıyla kendi akışını
kurar, şirketin varsayılan akışları **hazır şablon** olarak gelir, özel kod düğümü
yoktur. Talep kapsamın dışında değil, merkezinde.

Değişen üç şey var:

1. **Sıra:** motorun çekirdeği modül dilimlerinden önce mi gelmeli?
2. **Teslimat:** her modülün "yetenek kataloğu" (olay + aksiyon + koşul alanı)
   bugün hiçbir fazın teslimatı değil — oysa tasarımcıyı mümkün kılan tek şey bu.
3. **Ağırlık:** motor, modüllerin üstünde bir ek değil, modüllerin bağlandığı omurga.

## 3. Üç katman modeli

Her şey özelleştirilebilir olamaz. Önerilen ayrım:

| Katman | İçerik | Kim değiştirir |
|---|---|---|
| **Çekirdek** | Defter mantığı ve türetilen veri: tahsilat cari bakiyeyi azaltır, onaylı üretim hakedişe akar, stok hareketi stoğu değiştirir, maliyet tüketimden hesaplanır | Kimse. Yazılım işi; ADR ile değişir |
| **Akış** | Kim onaylar, kaç kademe, hangi eşikte kim devreye girer, ne zaman eskale olur, ne zaman kilitlenir, kime bildirim gider, hangi görev açılır | Yetkili kullanıcı, tasarımcıyla, kod değişmeden |
| **Katalog / alan** | İş türleri, malzeme tipleri, özel alanlar, eşikler, çalışma takvimi (ADR-005 zaten veriyor) | Yönetici, ayar ekranlarından |

Gerekçe: çekirdek özelleştirilebilir olursa kâr-zarar rakamının neden o rakam
olduğunu kimse savunamaz. `ai/PROJECT_CONTEXT.md`'deki ürün hedefi ("hiçbir iş
kayıtsız yapılmış sayılmaz", "sahip şirketi uzaktan denetleyebilir") tam olarak bu
katmanın dokunulmazlığına dayanıyor.

## 4. Birim sorusu: "her işlev bağımsız modül"

Bugün `docs/architecture/MODULE_MAP.md` 25 kod modülü tanımlıyor (IAM, SIT, INV,
FIN, WFL…). Sahibin tarifi daha ince bir birim gibi duruyor. İki okuma var:

**(a) Kod sınırı 25 modülde kalır; tasarımcının gördüğü birim "yetenek"tir.**
Her modül üç şey yayınlar:

- **Olaylar** — "günlük saha kaydı onaylandı", "stok kritik seviyeye düştü",
  "işveren dolguyu geciktirdi", "sertifika süresi 30 güne indi"
- **Aksiyonlar** — "görev aç", "onay iste", "bildirim gönder", "durum geçişini
  kilitle", "taslak kayıt oluştur"
- **Koşul alanları** — akışın okuyabileceği, tipli ve veri sınıfı belli alanlar
  (tutar, tür, rol, şantiye, tarih)

Ekranda istenen his — her işlev ayrı bir tuğla, bağlantıları kullanıcı kuruyor —
bu katalogla birebir gelir.

**(b) Kod da ince modüllere bölünür.** 25 yerine ~200 sınır, 200 sözleşme, 200 test
yüzeyi. ADR-001'in "sınırlar lint ile zorlanır" kuralı bu ölçekte yönetilemez hale
gelir.

**Öneri: (a).** Asıl yeni iş yetenek kataloğudur ve bugün planda yoktur.

## 5. Motorun kapsamı

ADR-006'nın sabit paleti korunur: başlangıç/olay · onay · görev · koşul ·
süre/bekleme · bildirim · eskalasyon · paralel dal · birleşme · alt akış · kilit ·
bitiş. Netleşmesi gerekenler:

- **Tetikleyici türleri:** olay, zamanlanmış (her gün 08:00), süre bazlı
  (X iş günü geçti), eşik (stok < X), manuel başlatma. Dış tetikleyici
  (webhook / e-posta) ayrı karar.
- **Akış hiçbir zaman defter yazmaz.** En fazla **taslak** kayıt ve **görev**
  üretir; parasal/stoksal kaydı insan kesinleştirir.
- **Kilit**, kaydı silmez veya gizlemez; yalnızca bir **durum geçişini** engeller ve
  sebebini ekranda yazar ("zimmet kapanmadan çıkış tamamlanamaz").
- **Kilit aşılabilir olmalıdır:** sahip ve genel müdür, gerekçe zorunlu, audit'e
  yazılır, ilgililere bildirim gider. Aşılamaz kilit, insanların sistemi terk edip
  WhatsApp'a dönmesinin en kısa yoludur.

## 6. Kapsam dışı — tasarımcının yapamayacakları

Bir tasarımcının değerini, yapabildikleri kadar yapamadıkları belirler. Bu liste
olmadan güvenlik incelemesi yapılamaz.

- Serbest kod / script düğümü yok (ADR-006'da zaten reddedildi)
- Doğrudan veritabanı erişimi yok
- Defter kaydını kesinleştiren düğüm yok
- Yetki veren / rol atayan düğüm yok
- Dış sisteme veri gönderen düğüm yok (entegrasyon ayrı karar)
- Hassas kişisel veriyi bildirim gövdesine koyan düğüm yok (KVKK, RISK-001); akış
  yalnızca kayda giden bağlantı gönderir
- Yeni kayıt türü / yeni ekran üretme yok — bu genel form üreteci olur ve ayrı bir
  üründür (bkz. Açık Soru 3)

## 7. §45 akışlarının yeri

`docs/sources/functional-scope.md` §45'teki sekiz uçtan uca akış koda gömülmez.
**Şirket varsayılanı şablon** olarak gelir:

- Şablon ayrı bir varlıktır; kullanılan akış onun kopyasıdır.
- Şablon güncellenirse kullanıcının düzenlediği kopya kendiliğinden değişmez;
  "yeni sürüm var" bildirimi çıkar.
- Bozulursa varsayılana dönülebilir.

Ayrıca §45 bir **doğrulama seti** olarak kullanılır: Phase 03 motor tasarımında
sekiz akışın tamamı paletle ifade edilebiliyor mu diye tek tek sınanır. İfade
edilemeyen bir adım çıkarsa iki sonuçtan biri doğrudur — ya palet eksiktir ya da o
adım çekirdeğe aittir (§3). Bu, paleti hayali ihtiyaçlarla şişirmeden doğru boyutta
tutmanın en ucuz yoludur. **Bu sınama 2026-09-17'de yapıldı; sonucu §7.1.**

Not: §45 bugün `ai/REQUIREMENTS.md`'de REQ-NFR'ye ("UI standartları, uyarılar,
platform") bağlı. Bu yön kabul edilirse REQ-WFL'e taşınması gerekir.

## 7.1 Palet sınaması — §45'in sekiz akışı düğüm düğüm denendi

Sınama 2026-09-17'de yapıldı. Yöntem: §45'teki her adım üç kutudan birine konuldu —
**Ç** (çekirdek: veri girişi, defter, türetme — akış düğümü değil), **palet**
(ADR-006'nın 12 düğümünden biri karşılıyor), **boşluk** (hiçbir düğüm karşılamıyor).

Palet: başlangıç/olay · onay · görev · koşul · süre/bekleme · bildirim · eskalasyon ·
paralel dal · birleşme · alt akış · kilit · bitiş.

| Akış | Adım | Ç | Palet | Boşluk |
|---|---|---|---|---|
| 45.1 Yeni işten tahsilata | 18 | 8 | 7 | 3 |
| 45.2 Siparişten sahada kullanıma | 15 | 11 | 2 | 2 |
| 45.3 Günlük saha üretimi | 11 | 9 | 1 | 1 |
| 45.4 Personel çıkışı | 7 | 1 | 4 | 2 |
| 45.5 İşveren gecikmesi | 9 | 5 | 3 | 1 |
| 45.6 Toplantı kararından göreve | 9 | 4 | 5 | 0 |
| 45.7 Kritik sertifika / İSG olayı | 5 | 2 | 3 | 0 |
| 45.8 Nakit sıkışması | 6 | 4 | 2 | 0 |

**45.6 ve 45.7 paletle eksiksiz ifade edilebiliyor.** Diğerlerinde altı farklı boşluk çıktı.

### Bulunan boşluklar

**B-1 — Kayıt oluşturan/güncelleyen düğüm yok.**
45.1/7 (sözleşme ve yükümlülükleri açılır), 45.1/9 (proje ve şantiye oluşturulur),
45.4/2 (çıkış checklist'i açılır), 45.6/9 (görev **ve karar** kapanır), 45.7/5
(kayıt kapanır). Paletteki 12 düğüm görev açar, onay ister, bildirim yollar — ama
hiçbiri kayıt oluşturmaz veya bir kaydın durumunu değiştirmez. Bu belgenin §5'i
"taslak kayıt oluştur"u bir aksiyon olarak sayıyor, ADR-006'nın paleti saymıyor.
İkisinden biri düzeltilmeli.

**B-2 — Liste üzerinde yineleme ("her X için") yok.**
45.4/4–5: personelin **zimmetleri** kontrol edilir, eksik olan her cihaz için uyarı
çıkar. Zimmet sayısı kişiye göre değişir. Palette sabit **paralel dal** var; dinamik
sayıda dal yok. 45.4/3 (sözleşmenin istediği evrak listesi) aynı durumda. Sabit dalla
bu akış yazılamaz.

**B-3 — Onay düğümünün reddi nereye gidiyor, tanımsız.**
45.3/10: "eksikse düzeltme ister; tam ise onaylar". Yani onayın **iki değil üç**
sonucu var — onay, red, **düzeltmeye geri gönder** — ve üçüncüsü grafikte geriye
giden bir kenar. ADR-006 onay düğümünü tanımlıyor ama çıkışlarını ve geri gönderme
kenarını tanımlamıyor. §37.1'deki revizyon talebi mekanizmasıyla da bağlantılı.

**B-4 — Koşul yalnızca tek kaydı okuyor; toplu/tarihsel koşul yok.**
45.5/6: "**tekrarlayan** gecikme şantiye tanı ekranında görünür". Bu "son 30 günde
3'ten fazla gecikme" demek — tek kaydın alanı değil, bir zaman penceresindeki sayım.
ADR-006 koşulları "tutar > eşik, tür = değer, rol = X" diye tarif ediyor; hiçbiri bunu
karşılamıyor.

**B-5 — Dış taraf onayı bekleyecek düğüm yok.**
45.1/8 (kurum onayı takip edilir), 45.1/12 (hakediş **işverene** sunulur ve onaylanır),
45.5 boyunca işveren. Onay düğümü sistemdeki bir kullanıcıya gider; işveren ve resmî
kurum sistemde kullanıcı değil. Pratikte bu "bir personel 'işveren onayladı' diye
işaretler" demek — yani görev + bekleme + koşul üçlüsü. Üç akışta tekrarladığı için
adlandırılmış bir kalıp olmayı hak ediyor; yeni düğüm mü, yoksa hazır alt akış şablonu
mu, karar konusu.

**B-6 — Tetikleyici tipleri tanımlı değil.**
45.2/1 (proje ihtiyacı çıkar) ve 45.2/15 (kritik seviyeye yaklaşınca) **eşik**
tetikleyicisi; 45.7/1 (sertifika süresi yaklaşır) **tarih/zamanlanmış** tetikleyici.
ADR-006 yalnızca "başlangıç/olay" diyor. Bu belgenin §5'i beş tetikleyici tipi
öneriyor ama ADR'de kayıtlı değil.

### Boşluk olmayan, ama sınırı netleşen iki nokta

- **45.8/3 "8 haftalık çizelgede açığı önceden görür"** yeni bir düğüm gerektirmiyor.
  Projeksiyonu **çekirdek** hesaplar ve "nakit açığı öngörüldü" olayını yayınlar; akış
  yalnızca o olayı dinler. Öngörü motorun değil, çekirdeğin işi.
- **45.2'nin 15 adımından 11'i çekirdek.** Akışın rolü iki noktada: fark/fire kontrolü
  (9) ve kritik seviye uyarısı (15). Yani bu "uçtan uca akış" aslında tek bir akış
  tanımı değil.

### Sınamanın en önemli çıktısı

**Uçtan uca bir akış, tek bir akış tanımı değildir.** 45.1 aylara yayılıyor ve sekiz
modül geçiyor; bunu tek bir yürüyen süreç olarak modellemek, aylarca açık kalan ve her
sürüm değişiminde göç sorunu çıkaran bir örnek üretir. Doğrusu: **olaylarla zincirlenen
birkaç kısa akış** (teklif akışı → sözleşme akışı → günlük onay akışı → hakediş akışı →
fatura/tahsilat akışı). §45 bunları tek bir anlatı olarak yazıyor çünkü iş dilinde öyle
anlatılıyor; motor tarafında öyle kurulmamalı. Bu, ADR-006'ya yazılması gereken bir
tasarım kuralı.

## 8. İzlenebilirlik — pazarlık dışı

Her görev ve bildirim "neden oluştu" zincirini göstermelidir: *"bu görev X akışının
Y adımında, Z kaydı onaylandığı için açıldı."* Her akış örneğinin çalışma günlüğü
tutulur.

Gerekçe: sahip yazılım geliştirmiyor. Kendi kurduğu bir motora ancak neden öyle
davrandığını görebiliyorsa güvenir. Bu olmazsa motor bir kara kutudur ve ilk hatada
terk edilir — panelin tamamı da onunla birlikte.

## 9. Yetki modeli

- **İki ayrı yetki:** "akış tasarlama" (taslak) ve "akış yayınlama" (canlıya alma).
  Sahip her ikisini de daima taşır.
- **Akış, kendisine açıkça verilen aksiyon kapsamıyla çalışır.** Tasarımcı, kendi
  yetkisinin ötesindeki aksiyonu palete koyamaz. Aksi halde akış tasarımcısı bir
  yetki yükseltme aracına dönüşür.
- Her yayın audit'e yazılır: kim, ne zaman, hangi sürüm, hangi test çalıştırmasıyla.

## 10. Yol haritasına etkisi

Bugünkü sıra: Phase 07 temel → Phase 08 motor + tasarımcı → Phase 09 Slice 1.

| # | Seçenek | Sonuç |
|---|---|---|
| a | Sıra aynı kalır; **Phase 01 ve 03'e yeni zorunlu teslimat** eklenir: her modül için yetenek kataloğu. Hiçbir dilim kendi onay mantığını koda gömemez | En az sarsıntı; motor yine geç |
| b | Motorun **çekirdeği** (tanım modeli + yürütme + olay omurgası) Phase 07 temeline çekilir; **görsel tasarımcı** Phase 08'de kalır | Motor erken; tasarımcı gecikebilir; RISK-005 küçülür |
| c | Motorun tamamı dilimlerden önce | En tutarlı; ilk dilim en geç |

**Öneri: (b) + (a) birlikte.** Motorun çekirdeği zaten temel altyapıdır (olay
omurgası, görev, bildirim, onay); tasarımcı arayüzü ayrı ve ertelenebilir bir
üründür. İkisini ayırmak RISK-005'i küçültür: motor gecikirse tasarımcı gecikir,
dilimler gecikmez.

Ayrıca Phase 02'de §45 akışları ekran akışı olarak değil, **akış tanımı taslağı**
olarak tasarlanır — düğüm düğüm, paletle sınanarak.

## 11. Riskler

| Risk | Durum |
|---|---|
| RISK-005 — görsel tasarımcı karmaşıklığı | Kayıtlı. Bu yön riski **artırmaz**, öne çeker; çekirdek/tasarımcı ayrımı (§10b) azaltır |
| RISK-002 — birinci sürüm kapsamı büyük | Bu yön kapsamı **büyütür**. Karşılığında koda dokunmadan süreç değiştirme gelir ve her modülde ayrı onay mantığı yazma işi ortadan kalkar: uzun vadede net kazanç, geciken ilk teslimat |
| Yeni — yetenek kataloğu asla bitmez | Katalog her modül tasarımıyla büyür; tek seferde yazılamaz. Faz kapıları buna göre kurulmalı |
| Yeni — akış, yetki yükseltme aracına dönüşebilir | §9'daki kapsam kuralı zorunlu, T1 |

## 12. Açık sorular

Aşağıdaki sorular sahibe 2026-09-17'de soruldu. **1–14 ve 19–25 henüz cevaplanmadı**;
cevaplanmadan CHG-006 yazılamaz. 15–18 `CHG-005` kapsamında ele alındı ve uygulandı.
19–25, §7.1 palet sınamasının çıkardığı boşuklardan geliyor.

**Sınır ve birim**

1. Üç katman ayrımı (çekirdek / akış / katalog) kabul ediliyor mu?
2. Birim ne olacak: kod sınırı 25 modülde kalıp tasarımcıya "yetenek" mi sunulacak,
   yoksa kod da ince modüllere mi bölünecek?
3. Tasarımcı yeni **kayıt türü** üretebilmeli mi (genel form üreteci)?
4. Akış bir kaydı kendiliğinden kesinleştirebilir mi, yoksa yalnızca taslak ve görev
   mi üretir?

**Yetki ve güven**

5. Akışı kim kurar, kim yayınlar?
6. Akış hangi yetkiyle çalışır?
7. Kilidi kim, hangi şartla aşabilir?

**Tasarımcının biçimi**

8. Akış nasıl yazılacak: serbest tuval mi, adım listesi/sihirbaz mı, ikisi birden mi?
9. §45 akışları şablon olarak mı gelecek; şablon güncellemesi nasıl yönetilecek?
10. Her görev/bildirim "neden oluştu" zincirini gösterecek mi?

**Yol haritası**

11. Motor ne zaman kurulacak (§10'daki a / b / c)?
12. Phase 02'de §45 akışları nasıl tasarlanacak?
13. `REVIEW`'daki CHG-004 işleri bu karardan etkileniyor mu?

**Sınırın yazılı hali**

14. §6'daki "kapsam dışı" listesi ADR-006'ya eklensin mi?

**Palet boşlukları (§7.1 sınamasından, 2026-09-17)**

19. **B-1:** Kayıt oluşturan/güncelleyen bir düğüm palete eklensin mi? (Önerim: evet, ama yalnızca **taslak** üretir ve durum değiştirir; defter kaydını asla kesinleştirmez — §5'teki kuralla aynı.)
20. **B-2:** "Liste üzerinde yineleme / her X için" düğümü eklensin mi? (Önerim: evet; 45.4 onsuz yazılamıyor. Sınır: yineleme derinliği 1, iç içe yineleme yok.)
21. **B-3:** Onay düğümünün çıkışları **onay / red / düzeltmeye geri gönder** olarak tanımlansın mı, geri gönderme kenarına izin verilsin mi? (Önerim: evet; §37.1 revizyon talebiyle aynı mekanizmaya bağlansın.)
22. **B-4:** Koşul, bir zaman penceresindeki sayım/toplamı okuyabilsin mi ("son 30 günde 3 gecikme")? (Önerim: evet ama **sınırlı**: önceden tanımlı sayaçlar üzerinden, serbest sorgu değil.)
23. **B-5:** Dış taraf onayı (işveren, resmî kurum) ayrı bir düğüm mü olsun, yoksa hazır bir **alt akış şablonu** mu? (Önerim: alt akış şablonu — yeni düğüm eklemeden aynı işi görür.)
24. **B-6:** §5'teki beş tetikleyici tipi (olay · zamanlanmış · süre bazlı · eşik · manuel) ADR-006'ya yazılsın mı? Dış tetikleyici (webhook/e-posta) ilk sürümde olsun mu? (Önerim: beşi yazılsın; dış tetikleyici ertelensin.)
25. **Tasarım kuralı:** "Uçtan uca akış = olaylarla zincirlenen birkaç kısa akış; tek uzun akış tanımı değil" kuralı ADR-006'ya yazılsın mı? (Önerim: evet — §7.1'in en önemli çıktısı bu.)

**Yol haritası tekliği (CHG-005 ile ele alındı)**

15. Milestone M1 iptal mi, yeniden mi tanımlanacak?
16. Yapılmış Phase 02/07 işleri nasıl kaydedilecek?
17. `docs/sources/` ne zaman silinecek?
18. Kayıt tutarlılık denetimi yazılsın mı?

## 13. Karar verildiğinde ne olacak

1. Cevaplar `ai/DECISIONS.md`'ye `D-NNN` olarak yazılır.
2. `CHG-006` kaydı açılır: talep · gerekçe · etkilenen gereksinimler, modüller,
   veritabanı, API, UI, yetkiler, testler, migration, geri uyumluluk, riskler.
3. ADR-006 revize edilir (kapsam dışı listesi, tetikleyici türleri, izlenebilirlik,
   yetki modeli); gerekirse ADR-005 ve ADR-007 birer ek madde alır.
4. `ai/MASTER_ROADMAP.md` yeniden yazılır; yetenek kataloğu Phase 01 ve Phase 03'e
   zorunlu teslimat olarak girer.
5. `ai/REQUIREMENTS.md`'de §45 REQ-NFR'den REQ-WFL'e taşınır.
6. **Bu dosya silinir.**
