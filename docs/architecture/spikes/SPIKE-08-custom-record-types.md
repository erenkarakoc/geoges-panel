# SPIKE-08 — Kullanıcı tanımlı kayıt türleri

Durum: GEÇTİ (veri altyapısı denemesi) · Tarih: 2026-09-20 · Görev: TASK-0089 · İlgili: ADR-016, D-241, REQ-WFL-035…039

## Deneme planı

Amaç: tür tanımı → doğrulanmış giriş → RLS → arama → rapor → alanı emekliye ayırma zinciri ve 50 bin kayıtta liste/süzmenin 500 ms altında kalması. Bağımlılık TASK-0064; mimari RECORD_TYPES ve Phase 04 SCHEMA-CUSTOM-RECORDS esas alınır. İş kuralları önceden sahip onaylıdır.

Kalıcı dosyalar: bu rapor, mimari doğrulama notları ve ai kayıtları. Backend/frontend ürün kodu yok; ekran oluşturmadan, tanımdan üretilen giriş ve okuma sözleşmeleri sınanır. Deneme kodu repository dışında; yalnız spike şemasında c8_ önekli sentetik tablolar kullanılır. Var olan denemelerin üzerine yazılmaz; ürün göçü veya toplu reset yok. Geri alma: açık işlemler rollback, yeni nesneler izole tutulur.

Bir ortak JSONB kayıt tablosu, tür/alan/izin/ilişki tanımları, bağlar, geçmiş ve arama satırları. İki tür ve farklı kapsam/yetkili kullanıcılar. Yetki tablolarına uygulama rolünün yazması yasak. Her türde aynı politika kümesi; okuma ve yazma ayrılır. Satır kapsamı ve tür izni birlikte sınanır. Hassas alanlar SQL projeksiyonundan ve arama vektöründen çıkarılır; raporda izinsiz alan seçme girişimi reddedilir.

Tanımdan tip doğrulama ve ifade indeksi üretimi; bilinmeyen alan, eksik zorunlu alan, yanlış tip, izinsiz yazma ve kapsam değiştirme negatif testleri. Yetkisiz kayıt listede, doğrudan kimlikte, arama sonuçlarında ve rapor toplamında görünmemeli. Mevcut örnek şantiye kaydına ilişki kurulmalı; yetkisiz hedefe bağ reddedilmeli.

Alan emekliye ayrıldıktan sonra normal okuma ve yeni girişte bulunmamalı; güncelleme diğer eski JSONB değerlerini silmemeli. Tür tanımının eski sürümü ve kayıt geçmişi denetim kanalıyla okunabilmeli. Eski alanın tipi değiştirilememeli. Arama/rapor katılım bayrakları sınanır.

İki ısınma ve 20 ölçüm: liste ve tipli süzme, kullanıcı kimliği kurulması ve işlem sonu dahil. Parametreli sorgular kullanılır; kullanıcı alan kodları SQL üretiminden önce doğrulanır. Güvenlikte yalnız RLS'e tabi spike_app test rolü; sertifika doğrulaması kapalı önceki bağlantı yardımcısı üretime örnek değildir. Gerçek IAM ve görsel oluşturucu Phase 09R'de ayrıca sınanır.

Öz inceleme: sorgu sonuçları bilinen örnek dağılımına göre kontrol edilir; yalnız kodun kendi çıktısıyla karşılaştırılmaz. Ölçülmeyenler raporda açık kalır. Tam commit kapısı sonrasında kayıtlar main'e commit ve otomatik push edilir.

## Sonuç — 48 kontrol geçti

Gerçek PostgreSQL üzerinde iki tür ve dört sentetik yetki profili kullanıldı: bir türün bir şantiyesine yazabilen kişi, aynı kapsamda yalnız okuyabilen kişi, iki türün iki şantiyesini ve hassas alanını görebilen kişi, izinsiz kişi. Kayıtlar ortak JSONB tablosundadır; tür başına tablo veya RLS politikası üretilmedi. Okuma, ekleme ve güncelleme için aynı üç politika iki türde de çalıştı. Kapsam JSONB dışında tutuldu.

37 ana kontrol, öz incelemede 9 kontrol ve düzeltmelerden sonra 2 olumlu gerileme kontrolü geçti. Öz inceleme kontrollerinin ikisi ilk kurulumdaki kusurları yeniden üretir; bunlar nihai davranış diye sunulmaz.

| Alan | Doğrulanan davranış |
|---|---|
| Tanım ve giriş | Metin, sayı, tarih, seçim ve mantıksal değerler tanımdan doğrulandı. Bilinmeyen alan, boş zorunlu alan, sayıya metin, geçersiz tarih ve seçim reddedildi. Alan koduyla SQL üretimine müdahale girişimi reddedildi |
| Yetki | Yalnız okuyanın yazması, yabancı şantiyeye/türe yazma, kapsamı yabancı şantiyeye taşıma ve kendine yetki ekleme reddedildi |
| İlişki | Mevcut sentetik şantiyeye bağ kuruldu; yetkisiz hedefe bağ reddedildi |
| Liste ve doğrudan erişim | 50.001 kayıttan kullanıcı yalnız izinli tür ve kapsamındaki 20.001 kaydı gördü. İzinsiz kişi sıfır, yabancı kimlik sorgusu sıfır satır aldı |
| Arama | İzinli 20.000 örnek bulundu; yabancı şantiyenin işaret sözcüğü sıfır sonuç verdi. Hassas işaret sözcüğü, tam yetkili kişi aradığında da sıfırdı: arama vektörüne hiç yazılmadı |
| Hassas alan | İzinsiz kişinin SQL çıktısını kuran alan listesinde yoktu; yetkili kişinin ayrıntı çıktısında vardı. Rapor alan listesinde de süzüldü |
| Rapor | Önceden bilinen dağılımda 20.001 kayıt ve 980.012 toplam doğrulandı; yetkisiz kayıtlar toplama girmedi |
| Alanı emekliye ayırma | Normal çıktıdan ve yeni girişten çıkarıldı. Başka alan güncellenirken eski JSONB değeri korundu; geçmişte değer, kişi ve zaman bulundu |
| Tanım geçmişi | Eski alan tipi ve emeklilik öncesi tanımı sürüm kaydından yeniden okundu. Var olan alanın tipini değiştirme veri katmanında reddedildi |
| Katılım | Arama ve rapor bağımsız açılıp kapatıldı; Bugün sayacı kapatılınca 0, açılınca 20.001 verdi |

50.000 toplu örnekten 40.000'i birinci türde, 10.000'i ikinci türdedir; her tür iki şantiyeye eşit dağılır. Tanımdan girilen ayrı bir kayıtla toplam 50.001 olur. Rapor kontrolünden sonraki bir güncelleme miktarı 12'den 15'e çıkardı; 980.012, güncellemeden önceki doğrulanmış toplamdır.

## Hız

Açık bağlantıda, iki ısınma sonrası 20 ölçüm. İşlem başlangıcı + sınırlı rol/yerel kimlik kurulumu, parametreli sorgu ve işlem sonu dahildir. Alan/izin tanımının yüklenip SQL projeksiyonuna çevrilmesi ölçümden önce yapıldı; ilk ekran yükleme veya bütün API isteği süresi diye okunmamalıdır. p95 sıralı 20 ölçümün 19'uncusudur.

| Sorgu | Satır | p50 | p95 | En yavaş |
|---|---|---|---|---|
| Yetkiye göre liste | 50 | 239 ms | 240 ms | 241 ms |
| Sayısal alanda süzme ve sıralama | 50 | 269 ms | 270 ms | 271 ms |

İkisi de 500 ms ölçütünü geçti. Süzülebilir alan indeksleri tanımdan üretildi. Sayı için metin indeksi yerine sayısal dönüşümle aynı ifadeyi kullanan indeks kuruldu. Arama ve rapor doğruluğu sınandı; onlar için p95 hız iddiası yoktur.

## Bulunan iki kusur ve düzeltme

**Yardımcı tablo yetkisi:** İlk geçmiş ekleme politikası yalnız kaydı okuyabilmeyi kontrol ediyordu. Yalnız okuma yetkili kişi sahte geçmiş satırı ekleyebildi; bu işlem hemen geri alındı. Geçmiş ve arama satırı ekleme politikalarına türün yazma izni ve kapsam denetimi eklendi. Sonraki iki negatif kontrol 42501 ile reddedildi. Yetkili kişinin kayıt + geçmiş + arama yazabildiği ayrıca kontrol edilip işlem geri alındı; örnek sayısı 50.001 kaldı.

**Eski arama metni:** Alanı yalnız emekli işaretlemek, eski arama vektöründeki 20.000 eşleşmeyi temizlemedi. Bu kusur işlem içinde üretilip geri alındı. Sonra alan değişikliğiyle etkilenen arama satırlarının yeniden kurulması aynı işlemde yapıldı. Sonuç sıfır eşleşme; 40.001 kaynak kaydın eski alan değeri yerinde; ilk tanım sürümü geçmişten okunabilir. Türün yeni tanım sürümü de denetim kanalında saklandı.

## Öz inceleme ve ürün sınırı

Bu deneme Phase 09R ekranlarını veya tam oluşturucuyu teslim etmez. Liste/detay veri sözleşmesi ve giriş doğrulaması tanımdan üretildi; tarayıcıda form oluşturma, yerleşim düzenleme ve COSS bileşenleri sınanmadı. Tam IAM, şirket/proje kapsamı, bütün ilişki türleri, 50 tür/60 alan sınırlarında yük, eşzamanlı tanım değişikliği ve akış motoruna olay/aksiyon bağlantısı ayrıca ürün kabul testidir. Örnek yalnız şantiye kapsamını kullandı. Gerçek defterlere erişilmedi.

Alan sınıfı süzmesi tasarımdaki gibi sunucu sorgu projeksiyonundadır; ortak JSONB sütununu ham SQL ile okuyabilen uygulama rolü için sütun düzeyinde veritabanı gizliliği kanıtlanmadı. Denetim/geçmiş uçları da aynı alan sınıfı kontrolünü uygulamalıdır. Sadece kayıt sürüm numarasını saklamak eski tanımı yeniden kurmaya yetmez; denetim kanalında alan tanımı sürümlerinin korunması deneyin gerekli parçasıydı.

Veri katmanındaki tip doğrulaması, tam yetkili SQL bağlantısının keyfî yazmasını engelleyen veritabanı kısıtı değildir. Deneme yardımcısında önceki TLS sertifika doğrulama sınırlaması sürer; üretime kopyalanmaz. SQL süreleri eşzamanlı kullanıcı yük testi değildir. c8_ tabloları örnek veriyle bırakıldı; ürün şeması ve kaynak kodu değiştirilmedi. Geçici betikler: custom8.mjs, custom8-review.mjs, custom8-regression.mjs (önceki oturumun scratchpad/spikes klasöründe; körlemesine yeniden çalıştırılmaz).

Kaynaklar: [PostgreSQL JSONB](https://www.postgresql.org/docs/17/datatype-json.html), [satır güvenliği politikaları](https://www.postgresql.org/docs/17/ddl-rowsecurity.html).
