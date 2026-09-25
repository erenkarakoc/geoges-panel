# GEOGES Panel — Yol Haritası

Son güncelleme: 26 Eylül 2026

## Kısaca: şu an neredeyiz?

Panelin **temeli** (giriş, yetkiler, görevler, bildirimler, belgeler, arama, tanımlar) ve **iş akışı
motoru** (onayların ve otomatik görevlerin kimde, ne zaman duracağını belirleyen parça) kuruldu.

Şu an **Faz 09 — ilk iş dilimi** üzerinde çalışıyoruz: **projeler, şantiyeler ve günlük saha kaydı**.
Bu faz bittiğinde bir şantiyenin bir günü panelden baştan sona yürütülebilecek: sabah kayıt açılır,
gün içinde döküm, montaj, şerit, puantaj ve harcamalar girilir, akşam koordinatörün onayına gider,
onaylanınca resmî günlük rapor çıkar ve yönetim ilerlemeyi ekranda görür.

Fazın on bir işinden ikisi yapıldı, üçüncüsü (projeler, şantiyeler, duvarlar ve hedefler) yarıyı geçti.

## Bu belge nedir?

Panelin hangi sırayla yapıldığını, bugün nerede olduğumuzu ve sırada ne olduğunu herkesin
anlayacağı dille anlatır. Birkaç kelime:

| Kelime | Anlamı |
|---|---|
| **Faz** | Yapımın bir bölümü. Önce tasarım fazları, sonra temel, sonra iş ekranları gelir. |
| **Dilim** | İş ekranlarının bir grubu. Her dilim bir iş alanını baştan sona getirir (ör. şantiye, stok, finans). |
| **Örnek veri** | Denemek için uydurulmuş firma, proje ve kişiler. Gerçek şirket verisi en sonda, canlıya geçişte girer. |
| **Kabul turu** | Yapılan işin, panelin sahibi tarafından ekranda denenip onaylanması. |
| **Pilot** | Bir dilimin birkaç kişiyle, örnek veriyle gerçek işe yakın biçimde denenmesi. |
| **Akış şablonu** | "Günlük kayıt gönderilince koordinatörün onayına düşsün" gibi hazır bir iş kuralı. Yönetim bunu kendi ihtiyacına göre değiştirebilir. |

## Tüm fazlar

| Faz | Ne getiriyor | Durum |
|---|---|---|
| **00 — Kurulum** | Proje kuralları ve çalışma düzeni | ✅ Bitti |
| **01 — Gereksinimler** | Panelin ne yapacağının tamamı: 438 madde, iş kuralları, kim neyi görür | ✅ Bitti |
| **02 — Ekran tasarımı** | 108 ekranın listesi, ekranların hâlleri, menü düzeni | ✅ Bitti |
| **03 — Mimari** | Panelin parçalarının birbiriyle nasıl konuşacağı | ✅ Bitti |
| **04 — Veritabanı tasarımı** | Bilgilerin nerede, nasıl ve kimin görebileceği biçimde saklanacağı | ✅ Bitti |
| **05 — Altyapı tasarımı** | Sunucu ortamları, yedekleme ve geri dönüş kuralları | ✅ Bitti |
| **06 — Denemeler** | Riskli konuların önceden küçük denemelerle sınanması (17 deneme) | ✅ Bitti |
| **07 — Temel** | Giriş ve iki adımlı doğrulama, roller ve yetkiler, değişiklik geçmişi, görevler, bildirimler, belgeler, arama, tanımlar | 🔨 Yapımı bitti; **sahibin kabul turu** sonraya bırakıldı |
| **08 — İş akışı motoru** | Onay ve görev kurallarını çalıştıran motor, akışları çizerek kurma ekranı, Onay Merkezi, hazır akış şablonları | 🔨 Yapımı bitti; **sahibin ekran turu** bekleniyor |
| **09 — Dilim 1: Şantiye** | Projeler, şantiyeler, duvarlar ve hedefler, günlük saha kaydı ve onayı, şantiye ekranı, resmî günlük rapor | 🔨 **Devam ediyor — şu an buradayız** |
| **09R — Kendi kayıt türünüz** | Yönetimin panele yeni kayıt türleri (alanlarıyla) ekleyebilmesi | ⬜ İlk dilimin pilotundan sonra |
| **10 — Dilim 2: Stok ve fabrika** | Malzeme, kantar ve sevkiyat, stok, sayım, satın alma, fabrika günlüğü, birim maliyet, fire ve hurda | ⬜ Başlamadı |
| **11 — Dilim 3: Finans** | Hakedişler, gelir-gider, cari hesaplar, tahsilat ve ödeme, nakit öngörüsü, döviz, dönem kapanışı | ⬜ Başlamadı |
| **12 — Dilim 4: Ekipman ve personel** | Ekipman ve bakım, vinç günlüğü, personel dosyası, puantaj, bordro, izin | ⬜ Başlamadı |
| **13 — Dilim 5: Satış** | Talepler, ihaleler, teklif ve kârlılık, teklif belgeleri, ürün satışı | ⬜ Başlamadı |
| **14 — Dilim 6: Uyum ve kalite** | Sözleşme yükümlülükleri, sertifikalar, kalite ve İSG, toplantı kararları, destek talepleri | ⬜ Başlamadı |
| **15 — Dilim 7: Raporlama** | Belge arşivi, raporlar, performans ve prim, öneriler, bütçe-gerçekleşme | ⬜ Başlamadı |
| **15M — Soru-cevap kanalı** | Yetkili kişinin panele kendi cümlesiyle soru sorabilmesi; her cevap yalnız o kişinin görebildiğinden | ⬜ Dilimlerden sonra |
| **19 — Canlıya geçiş** | Kendi sunucumuza taşınma, güvenlik ve yük kontrolü, yedekten dönüş tatbikatı, eğitim, gerçek verinin girişi | ⬜ En sonda |

16–18 numaraları dilimler birleştirilirken boşaldı; atlanan bir iş yok.

## Faz 09 — İlk dilim: Şantiye (şu an burada)

### Bu faz bitince neler olacak?

- Her projenin bir **kartı** olacak: işveren, kurum, sözleşme bilgileri, üç ayrı süre (sözleşme
  süresi, beklenen süre, yönetimin hedef süresi), şantiyeleri, duvarları ve hedefleri.
- **Hedefler yalnız revizyonla değişecek.** Teknik ofis yeni revizyonu hazırlar, onaylanınca onay
  gününden geçerli olur. Böylece hedef sonradan büyütülerek fazla döküm gizlenemez.
- Saha mühendisi **günlük saha kaydını** telefondan bölüm bölüm girecek: döküm, montaj, şerit,
  teslim-tesellüm saatleri, puantaj, zayi, sarf, harcama, fotoğraflar. Birden fazla kişi aynı günün
  farklı bölümlerini doldurabilecek.
- Kayıt **koordinatörün onayına** gidecek; onaylanan gün kilitlenecek, düzeltme ancak gerekçeli
  revizyon talebiyle yapılabilecek.
- Onaydan sonra **resmî günlük rapor** PDF olarak çıkacak ve indirilebilecek.
- Yönetim **şantiye ekranında** ilerlemeyi, hedefe kalan işi ve "Niye zarardayız?" sorusunun
  cevabını görecek; **"Bugün"** ekranı gerçek şantiye verisiyle dolacak.

### Fazın işleri

| # | İş | Ne getiriyor | Durum |
|---|---|---|---|
| 1 | Üretim tanımları | Panel ve şerit tipleri, sarf reçeteleri, "çalışma yok" nedenleri — Tanımlar ekranında | ✅ Yapıldı; ekranda deneme turu bekliyor |
| 2 | Firma kartı | İşveren, tedarikçi, taşeron ve kiralayan firmalar için tek kart; aynı firma ikinci kez açılamaz, benzer adlar uyarılır | ✅ Yapıldı; sahibin turu bekleniyor |
| 3 | Projeler, şantiyeler, duvarlar, hedefler | Proje kartı, şantiyeler, revizyonlar, duvar hedefleri, günlük hedefler, teknik ofis işleri, tedarik matrisi | 🔨 **Devam ediyor** — beş adımın ikisi bitti (ayrıntı aşağıda) |
| 4 | Personel kartı | Kişi bilgileri, gizli alanlar (maaş, SGK, IBAN), süreli belgeler | ⬜ Sırada |
| 5 | Malzeme kataloğu ve depolar | Malzemeler ve bulundukları yerler | ⬜ Sırada |
| 6 | Varlık kartı | Kalıp, vinç, araç ve diğer ekipman; kendi malımız ya da kiralık | ⬜ Sırada |
| 7 | **Günlük saha kaydı** | Fazın asıl işi: bütün bölümleriyle giriş, gönderme, geri çekme, geç giriş, onay ve kilit | ⬜ 1–6 bitince |
| 8 | Şantiye ekranı | Şantiye göstergeleri ve "Niye zarardayız?" | ⬜ Günlük kayıttan sonra |
| 9 | Resmî günlük rapor | Onaydan sonra PDF, arşiv, indirme, "gönderildi" işareti | ⬜ Günlük kayıttan sonra |
| 10 | "Bugün" ekranı | Yönetimin giriş ekranında gerçek şantiye göstergeleri | ⬜ Günlük kayıttan sonra |
| 11 | Pilot örnek verisi | Örnek projeler, şantiyeler, kişiler ve bir haftalık günlük kayıt | ⬜ En sonda |

### Şu an yapılan iş: projeler, şantiyeler, duvarlar ve hedefler

| Adım | Ne getiriyor | Durum |
|---|---|---|
| 1. Proje kartı ve şantiyeler | Proje listesi ve kartı; üç süre ayrı ayrı; proje aşamaları ve aşama geçmişi; şantiyeler (bir şantiye tek projeye bağlı, başka projeye taşınamaz); herkes yalnız kendi projelerini ve şantiyelerini görür | ✅ Bitti |
| 2. Revizyonlar, duvarlar ve hedefler | Taslak revizyon, Genel Müdür onayı, duvar başına panel ve şerit hedefleri, proje hedefinin duvarların toplamı olması, iki revizyonun farkının yan yana gösterilmesi | ✅ Bitti |
| 3. Günlük hedefler | Kalan iş ve çalışma takviminden günlük hedef; tatile hedef yok; yetkili kişinin düzeltmesi hesaplanan değerle birlikte saklanır | ⬜ Sırada |
| 4. Teknik ofis işleri ve tedarik matrisi | Teknik işlerin teslim tarihi ve revizyon sayısı, geciken iş sorumlusuna görev; "kim neyi karşılıyor" tablosu | ⬜ Sırada |
| 5. Arama ve örnekler | Kalan akış bağlantıları, örnek veriler | ⬜ Sırada |

Bu işte onaylanan iş kuralları: revizyon onay gününden geçerli olur ve geriye dönük değiştirilemez;
revizyonu varsayılan olarak Genel Müdür onaylar (yönetim değiştirebilir); açılmış bir şantiye başka
projeye taşınamaz; günlük hedef kalan işin kalan iş gününe bölünmesidir; tedarik matrisinde her
kalem için "işveren karşılar / GEOGES karşılar / işveren karşılar ve hakedişten keser" seçenekleri
vardır; sözleşme bedelini yalnız ticari yetkisi olan görür.

### Bu fazda alınan kararlar

- **Ana kartlar eksiksiz kurulur.** Personel, malzeme, ekipman ve firma kartları kendi alanlarının
  tamamıyla kurulur; bordro, stok hareketi, bakım gibi arkadaki süreçler kendi dilimlerinde gelir ve
  kartta "bu bölüm kendi dilimiyle gelir" yazar.
- **Hava bilgisi** şantiyenin konumuna göre otomatik gelir; gelmezse elle yazılır.
- **Resmî günlük rapor** şimdilik indirilir; e-postayla gönderme, e-posta hizmeti seçilince gelir.
- **Pilot tamamen örnek veriyle** yapılır.

### Bu fazın çıkış şartları

- Bir şantiyenin bir günü sabahki taslaktan resmî rapora kadar panelden geçer; telefon ekranında
  yatay kaydırmadan girilebilir.
- **Sunucu kararı** verilir: pilotun telefondan erişebilmesi için panelin bir internet adresi olmalı.

## Bugün panelde neler var?

- **Giriş:** parola ve iki adımlı doğrulama, kurtarma kodları, giriş kilidi, oturum süresi.
- **Roller ve yetkiler:** herkes yalnız kendi projesini, şantiyesini ve yetkisindeki bilgiyi görür;
  maaş gibi gizli bilgiler ve sözleşme bedeli gibi ticari bilgiler ayrıca korunur.
- **Görevler ve bildirimler:** görev verme, hatırlatma, gecikme uyarısı, günlük özet.
- **Belgeler:** yükleme, sürümler, taranmış belgeden yazı okuma.
- **Değişiklik geçmişi:** her kaydın kim tarafından, ne zaman, neden değiştirildiği; onaylı kayıtta
  düzeltme yalnız gerekçeli revizyon talebiyle.
- **Arama:** firmalar, projeler ve şantiyeler panelin üstündeki aramada bulunuyor; Türkçe harfler ve
  yazım hataları tolere ediliyor.
- **Tanımlar:** birimler, iş kalemleri, sarf malzemeleri, panel ve şerit tipleri, reçeteler, proje
  aşamaları, tatil takvimi, döviz kurları.
- **İş akışları:** akışları kutu ve oklarla çizerek kurma, denemeden yayımlamama kuralı, Onay Merkezi,
  çalışma günlüğü ve 28 hazır şablon.
- **Firmalar ve projeler:** firma kartı; proje listesi ve kartı, şantiyeler, revizyonlar, duvarlar ve
  hedefler.

## Hazır akış şablonları

Panel 28 hazır akış şablonuyla geliyor: günlük saha kaydı onayı, malzeme çıkış talebi, ödeme onayı,
hakedişten faturaya, personel çıkışı, revizyon talebi, stok sayımı onayı, satın alma talebi, teklif
onayı, proje revizyonu onayı ve sekiz uçtan uca süreç (yeni işten tahsilata, şeridin siparişten
sahaya, günlük saha üretimi, personel çıkışı, işveren gecikmesi, toplantı kararından göreve, sertifika
ve İSG olayı, nakit sıkışması).

Bir şablonun çalışması için yönetimin onu İş Akışları ekranından kopyalayıp yayımlaması gerekir.
Şablonların çoğu, bağlı olduğu iş ekranı kendi diliminde gelince çalışmaya başlar.

Gereksinimlerin istediği altı şablon daha kendi dilimlerine yazıldı: ay sonu bordro, atıl ekipman,
geçen bakım tarihi (Faz 12); cevapsız talep (Faz 13); yaklaşan sözleşme yükümlülüğü, cevapsız destek
talebi (Faz 14). "Geciken teknik ofis işi" şablonu şu anki işin 4. adımında gelecek.

## Sahibin denemesini bekleyenler

Bunlar yapıldı; panelin sahibinin ekranda deneyip onaylaması bekleniyor:

1. **İş akışı ekranları:** bir şablonu kopyalayıp yayımlamak, Onay Merkezi'nde bir onay vermek,
   çalışma günlüğüne bakmak.
2. **Tanımlar ve firma kartı:** Faz 09'un ilk iki işi.
3. **Temelin kabul turu:** giriş, görevler, bildirimler ve diğer temel ekranlar
   ([kontrol listesi](docs/features/m1-local-acceptance.md)).
4. **Ana ekrana ekleme ve telefona bildirim:** panelin bir internet adresi olunca denenebilecek.

## Sırada ne var?

1. Projeler işinin kalan üç adımı: günlük hedefler, teknik ofis işleri ve tedarik matrisi, son
   bağlantılar.
2. Personel kartı, malzeme kataloğu ve varlık kartı.
3. **Günlük saha kaydı** — fazın asıl işi — ve arkasından şantiye ekranı, resmî rapor ve "Bugün".
4. Pilot örnek verisi ve **sunucu kararı**; ardından ilk dilimin pilotu.

## Kilometre taşları ve gerçek veri

| Aşama | Ne zaman |
|---|---|
| **İlk ekranlar** | Tamamlandı: giriş, iki adımlı doğrulama ve panelin iskeleti |
| **Temelin kabulü** | Kontrol listesi hazır; sahibin turu sonraya bırakıldı |
| **Pilot ve sunucu** | Faz 09 sonunda: sunucu kararı verilir, pilot örnek veriyle yapılır |
| **Gerçek şirket verisi** | Faz 19'da: kendi sunucumuza geçiş, KVKK kontrolü, yedekten dönüş tatbikatı ve sahibin onayından sonra |

Ayrıntılı teknik kayıtlar [ana yol haritasında](ai/MASTER_ROADMAP.md), [görev listesinde](ai/TASKS.md)
ve [güncel durum](ai/CURRENT_STATE.md) dosyasındadır; bu belge onların herkes için yazılmış özetidir.
