# GEOGES Panel — Önerilen Mimari Yaklaşım

Bu platform için en akıllıca yaklaşım, baştan “çok büyük ERP” gibi değil; **tek merkezli ama güçlü biçimde modüler bir işletme işletim sistemi** gibi kurmak olur.

## 1. Tek çekirdek, ayrı iş alanları

Sistemin ortasında ortak bir çekirdek bulunur. Bunun çevresinde birbirinden net şekilde ayrılmış iş alanları olur:

- Proje / şantiye
- Saha operasyonları
- Fabrika / üretim
- Stok / sevkiyat
- Satın alma
- Ekipman / araç / demirbaş
- İK
- Finans / muhasebe
- Teklif / satış / müşteri
- Sözleşme / yükümlülük
- Kalite / İSG
- Görev / toplantı / karar
- Evrak / arşiv
- Performans / KPI
- Yönetim / analiz / optimizasyon

Bunların her biri kendi kurallarına sahip olur ama ortak çekirdeğe bağlanır.

Önemli nokta şu: **modüller birbirlerinin içine karışmamalı.**

Örneğin saha modülü maaş hesabı yapmamalı. Sadece “Ahmet bugün 9 saat çalıştı” bilgisini üretmeli. İK bunu puantaja, finans bunu maliyete, performans sistemi bunu verim hesabına dönüştürmeli.

## 2. Veritabanı: şirketin tek gerçek kaynağı

En önemli mimari prensip:

> Bir gerçek bilgi sistemde yalnızca bir yerde asıl kayıt olarak bulunmalı.

Örneğin aynı personelin adı;

- saha kayıtlarında,
- maaş tablosunda,
- zimmetlerde,
- araç kayıtlarında

ayrı ayrı tutulmamalı.

Tek bir **Personel** kaydı olur, diğer her şey ona bağlanır.

Aynı mantık:

**Proje → Şantiye → Günlük kayıtlar → İmalatlar → Malzeme hareketleri → Hakediş → Gelir/Gider**

şeklinde ilerler.

Böylece “Çankırı projesinin gerçek maliyeti nedir?” sorusuna farklı Excel dosyalarını birleştirerek değil, ilişkili kayıtları okuyarak cevap verilir.

## 3. Veriyi üç ana sınıfa ayırmak

Veritabanını zihinsel olarak üç seviyeye ayırmak faydalı olur.

### Ana kayıtlar

Personel, proje, şantiye, müşteri, tedarikçi, araç, ekipman, malzeme, panel tipi, şerit tipi gibi şirketin temel varlıkları.

### Hareketler

Bugün 60 panel döküldü, 300 metre şerit kullanıldı, 2.000 litre yakıt alındı, araç Çankırı'dan Gölbaşı'na gitti, 50 adet malzeme galvanize gönderildi gibi gerçekleşmiş olaylar.

### Sonuçlar

Stok miktarı, proje ilerlemesi, günlük maliyet, kâr, KPI, personel performansı, kalan iş miktarı gibi hareketlerden hesaplanan bilgiler.

Bu ayrım çok kritiktir.

Örneğin sistemde:

> “Şantiyede 1.250 metre şerit var.”

diye elle yazılan bir sayı mümkün olduğunca tutulmamalı.

Onun yerine:

> Gelen − kullanılan − zayi − başka şantiyeye gönderilen = mevcut stok

olmalı.

Böylece sayıların nereden geldiği açıklanabilir.

## 4. Her şeyi “hareket” mantığıyla kurmak

Özellikle GEOGES için bunun çok değerli olacağını düşünüyorum.

Bir malzeme sadece “stokta 500 adet” şeklinde tutulmamalı.

Geçmişi şöyle görülebilmeli:

**Sipariş verildi  
→ haddeci üretti  
→ fabrikaya geldi  
→ işlendi  
→ galvanize çıktı  
→ galvanizden döndü  
→ şantiyeye sevk edildi  
→ şantiyede kullanıldı  
→ kalan stok**

Aynı prensip para için de geçerli.

Aynı prensip ekipman için de:

**Fabrika  
→ Çankırı  
→ Gölbaşı  
→ bakım  
→ tekrar şantiye**

Bu sayede sistem yalnızca “şimdi nerede?” değil, “buraya nasıl geldi?” sorusunun da cevabını bilir.

## 5. Kayıt silmek yerine geçmişi korumak

Birisi bir kaydı değiştirdiğinde eski bilgi kaybolmamalı.

Sistem şunu bilmeli:

- Kim oluşturdu?
- Ne zaman oluşturdu?
- Kim değiştirdi?
- Önce ne yazıyordu?
- Sonra ne oldu?
- Neden değiştirildi?
- Kim onayladı?

Özellikle Genel Müdür ileride başka birine bırakılırsa bu mimari çok önemli hale gelir.

Sahip seviyesinin üzerinde hiçbir yönetici geçmişi görünmez şekilde değiştirememeli.

## 6. İş akışı motoru bütün modüllerin üzerinde olmalı

Her modül kendi onay sistemini ayrı ayrı kurmamalı.

Tek bir ortak yapı:

**Olay → Görev → Sorumlu → Son tarih → Onay → Sonraki görev**

mantığında çalışmalı.

Örneğin:

**Hakediş hazırlandı  
→ koordinatör kontrol eder  
→ işverene gönderilir  
→ işveren onayı beklenir  
→ onay geldi  
→ muhasebeye görev açılır  
→ fatura için GM onayı  
→ fatura kesilir  
→ tahsilat takibi başlar**

Ya da:

**Personel ayrılacak  
→ çıkış evrakları açılır  
→ zimmet kontrol edilir  
→ sözleşmenin istediği belgeler kontrol edilir  
→ eksik varsa çıkış süreci kapanamaz**

Bu motor şirketin gerçek organizasyon şemasını yazılıma dönüştürür.

## 7. “Olay” merkezli mimari

Platformun zamanla akıllanabilmesi için sistemde önemli her hareket bir **olay** olarak düşünülmeli.

Örneğin:

- Panel dökümü tamamlandı
- Zayi oluştu
- Stok kritik seviyeye düştü
- Hakediş onaylandı
- Araç bakıma girdi
- Personel işten ayrıldı
- Sözleşme süresi 30 güne düştü
- İşveren dolguyu geciktirdi
- Fazla panel üretildi

Bir olay meydana geldiğinde sistem diğer modülleri haberdar edebilir.

Örneğin:

**Panel zayi edildi**

→ proje ilerlemesini etkiler  
→ stok ihtiyacını etkiler  
→ maliyeti artırır  
→ KPI'ı etkiler  
→ yüksekse koordinatöre uyarı gider

Bu yaklaşım platformun ileride çok daha gelişmiş hale gelmesini kolaylaştırır.

## 8. Hesaplanan veriyi giriş verisinden ayırmak

Personelin mümkün olduğunca **gerçekliği girmesi**, sistemin ise sonucu hesaplaması gerekir.

Saha:

> 48 C6 panel döktüm.

der.

Sistem:

- 108 m² üretim
- günlük hedefin %112'si
- proje toplamının %37'si
- tahmini işçilik maliyeti
- gerekli şerit miktarı
- kalan panel ihtiyacı
- tahmini bitiş tarihi

gibi sonuçları üretir.

Personelden “bugünkü verim %87” gibi hesaplanmış veri istenmemeli.

Bu, manipülasyonu da azaltır.

## 9. Operasyon sistemi ile yönetim sistemi ayrılmalı

Aynı veritabanından beslense de iki farklı kullanım zihniyeti olmalı.

### Operasyon tarafı

Personelin gördüğü:

- Bugün ne yapmam gerekiyor?
- Ne girmem gerekiyor?
- Ne onay bekliyor?
- Hangi malzeme eksik?
- Bugünkü hedefim ne?

### Yönetim tarafı

Sahip ve yöneticilerin gördüğü:

- Neden Gölbaşı yavaş?
- Çankırı neden zarar ediyor?
- Hangi koordinatör daha verimli?
- Nerede atıl vinç var?
- Hangi proje gecikme riski taşıyor?
- Önümüzdeki 30 günde nakit açığı var mı?

Bu iki tarafı aynı ekran mantığına sıkıştırmamak gerekir.

## 10. Raporlama operasyonel kayıtların üzerine doğrudan yük bindirmemeli

Operasyonel gerçekler ayrı, yönetim için hazırlanmış **özet görünüm** ayrı düşünülmeli.

Örneğin cockpit açıldığında binlerce saha kaydını yeniden incelemek yerine hazır olarak şunları okuyabilmeli:

- Bugünkü üretim
- Bu ayki üretim
- Proje ilerleme %
- Günlük maliyet
- Tahmini bitiş
- Toplam kâr
- Zayi oranı
- Kapasite kullanımı

Bu yaklaşım şirket büyüdüğünde sistemin hantallaşmasını da engeller.

## 11. Evrak sistemi ayrı bir “dosya çöplüğü” olmamalı

Belge mimarisi ilişkisel kurulmalı.

Bir PDF yalnızca `/Belgeler/2026/` klasöründe durmamalı.

Örneğin imzalı hakediş:

**İşveren  
→ Proje  
→ Şantiye  
→ 2026 Eylül hakedişi  
→ Hakediş belgesi**

ile ilişkili olmalı.

Bir zimmet tutanağı:

**Personel  
↔ Laptop  
↔ Zimmet işlemi  
↔ İmzalı tutanak**

şeklinde bağlı olmalı.

Arşiv ekranı ise bütün bu ilişkili belgelerin merkezi arama ekranı olur.

## 12. Yetki mimarisi rol + organizasyon + veri kapsamına göre çalışmalı

Sadece:

> “Saha mühendisi şu sayfayı görebilir.”

demek yeterli değildir.

Örneğin Bekir saha modülünü görebilir ama yalnızca kendisine bağlı Çankırı şantiyesini görmelidir.

Kadir koordinatör olarak kendi sorumluluğundaki şantiyeleri görebilir.

Sahip tüm şirketi görür.

Dolayısıyla yetki:

**Rol + sorumluluk alanı + veri türü**

üçlüsüyle çalışmalı.

Ticari bilgiler ayrıca ayrı bir görünürlük seviyesi olarak ele alınmalı.

## 13. Kurallar merkezi olarak tanımlanmalı

Şirket kuralları sistemin farklı noktalarına dağılmamalı.

Örneğin:

- Günlük saha kaydı en geç ertesi sabah 08:00
- Zayi kaydında fotoğraf zorunlu
- Belirli tutarın üzerindeki ödeme Sahip onayı ister
- Stok kritik eşiğin altına düşerse uyarı oluşur
- İşveren hakedişi onaylamadan fatura süreci başlayamaz
- İmzalı bordrolar tamamlanmadan maaş ödeme süreci kapanamaz

Bu kurallar merkezi şekilde yönetilmeli.

Böylece şirket geliştikçe sistemin davranışları da kontrollü biçimde değiştirilebilir.

## 14. Analiz ve “sistem aklı” en üst katmanda olmalı

En başta bu katman operasyonu yönetmemeli.

Önce sistem sağlam veri toplamalı.

Daha sonra üstüne:

**Durum → Sapma → Neden → Öneri → Simülasyon**

zinciri oturmalı.

Örneğin:

> Gölbaşı hedefin %18 gerisinde.

Sonra:

> Ana neden: işveren dolgu teslim gecikmeleri.

Sonra:

> Çankırı'daki vinç son 6 gündür %35 kapasiteyle çalışıyor.

Sonra:

> Vinci Gölbaşı'na taşırsanız tahmini +X m²/gün artış sağlanabilir.

Sonra:

> Nakliye maliyeti 12.000 TL, tahmini net kazanç 74.000 TL.

Bu katman **veriyi değiştirmez**, veriyi yorumlar ve öneri üretir.

## 15. Tek kayıt sistemi ve değiştirilebilir sağlayıcılar

Platformun amacı şirketin bütün kayıtlarını tek sistemde toplamaktır. Buradaki “dış bağımlılık olmaması”, iş verisinin Excel, WhatsApp, Drive gibi sistem dışı araçlarda tutulmaması anlamına gelir:

- iş kayıtları, belgeler ve yazışmalar sistem dışında tutulmaz; mevcut Drive arşivi platforma taşınır,
- teknoloji altyapısında yönetilen servisler ve dış API'ler kullanılabilir (başlangıç: Supabase Cloud ve Cloudflare R2; ileride kendi sunucumuzda self-hosted Supabase),
- her sağlayıcı değiştirilebilir bir arayüzün arkasında kullanılır; sağlayıcı değişikliği iş mantığını etkilemez,
- veri düzenli yedeklenir ve yedek, sağlayıcıdan bağımsız biçimde geri yüklenebilir,
- kur (TCMB), hava durumu gibi genel bilgiler için ücretsiz dış veri kaynaklarından (API) yararlanılabilir; bunlar veri besleyicisidir, temel işleyişin parçası değildir. Kaynağa erişilemezse son alınan değer kullanılır veya elle giriş yapılır; alınan değerler kayıt anındaki haliyle saklanır,
- Excel, eski panel ve Drive verileri tek seferlik aktarımla içeri alınır; sonrasında paralel kayıt tutulmaz.

## Genel Mimari Piramit

```text
                 SAHİP / YÖNETİM AKLI
           Analiz • Öneri • Optimizasyon
          Senaryo • Tahmin • Şirket Karnesi

                 RAPORLAMA KATMANI
           KPI • K/Z • Verim • Benchmark

                İŞ AKIŞI KATMANI
       Görev • Onay • Bildirim • Eskalasyon
        Yükümlülük • Son Tarih • Kurallar

                 İŞ MODÜLLERİ
   Saha • Proje • Fabrika • Stok • Ekipman
   Finans • İK • Satış • Kalite • Sözleşme

                ORTAK ŞİRKET ÇEKİRDEĞİ
  Personel • Proje • Şantiye • Malzeme • Firma
          Araç • Ekipman • Belge • Para

                   GERÇEK OLAYLAR
      Kim • Ne • Nerede • Ne zaman • Neden
```

## Sonuç

GEOGES için en doğru ana karar, sistemi çok sayıda bağımsız küçük uygulama şeklinde değil, başlangıçta **tek sistem içinde sınırları çok net modüller halinde** kurmaktır.

Şirket ileride çok büyürse bazı parçalar ayrıştırılabilir; fakat bugünden gereksiz yere dağıtılmış bir yapı oluşturmak, şirket süreçlerinin birbirine bu kadar bağlı olduğu bir sistemde işleri zorlaştırır.

En kritik üç omurga:

1. **Tek gerçek veri kaynağı**
2. **Merkezi iş akışı ve kural motoru**
3. **Değiştirilemez ve geriye dönük izlenebilir denetim geçmişi**

Bu üçü doğru kurulursa geri kalan onlarca modül zamanla çok daha rahat eklenebilir.
