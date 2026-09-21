# SPIKE-12 — Arama hızının yeniden sınanması

Durum: GEÇTİ (D-248 soğuk başlangıç istisnasıyla, 2026-09-21) · Tarih: 2026-09-21 · Görev: TASK-0091 · Bağlı: TASK-0090, OQ-029, ADR-017, D-239, D-248, REQ-NFR-012

## Güncel sonuç — D-247 sonrası

Model ve sözcük davranışı onaylandı; CHG-007 ile tasarım kayıtlarına katlandı. Tek çağrılı düzenin 18 senaryosunda, ön ısınma olmadan 20’şer ölçümün en yavaşı 190 ms. Önceki 73 kontrole ek 14 istek ve 5 güvenlik kontrolü geçti. Ancak 12 yeni bağlantının ilk isteklerinden biri 392 ms sürdü; sonraki aynı-istek tanısında 529 ms toplamın 445 ms’si sunucuda ölçüldü. Son backend tanısında 636 ms toplam / 533 ms sunucu içi süre görüldü. Hız kapısı bütün başarısızlıkları korur; SPIKE-12 REVIEW kalır. **Güncel kanıt belgenin son bölümündedir (2026-09-21);** aradaki bütün bölümler tarihsel sırayla korunur ve üç turlu ölçümler tarihsel karşılaştırmadır. 2026-09-21'de aday soğuk ölçümde geçmedi, "yeni backend" açıklaması çürütüldü ve kalan maliyeti ayırmak için soğuk ayrıştırma probu hazırlandı.

## Önceki sonuç

500.000 sentetik kayıtta **73 doğruluk ve inceleme kontrolü geçti**. Son temizlenmiş düzende, tür başına en iyi beş sonucu getiren 18 senaryonun iki ısınma sonrası 20'şer ölçümünde p95 **220–258 ms**, en yavaş örnek **258 ms** oldu.

**SPIKE-12 tamamlandı sayılmaz:** temizlikten sonraki ilk çalıştırmalarda 461 ve 371 ms görüldü. Ek tabloların ürün modeline alınması ve sözcük eşleştirme davranışı sahip onayı bekleyen öneridir. Hedef süre veya RLS şartı düşürülmedi; tamamlanan deneme sayısı sekiz olarak kalır.

## Plan ve ölçüm

Önceki 500.000 satır korunarak yalnız spike şeması ve deney eklentileri kullanıldı. Ürün kaynak kodu, arayüz veya ürün göçü yazılmadı. Dış scratchpad betikleri geçicidir. İlk başarısızlık kanıtı: `docs/architecture/spikes/SPIKE-12-turkish-search.md`.

Açık bağlantıda işlem başlangıcı/yerel kimlik, parametreli arama ve işlem sonunun üç ağ gidiş-dönüşü ölçüldü. İki ısınma + 20 örnek; p50 sıralı 10., p95 19., maksimum 20. örnektir. İlk bağlantı, HTTP/tarayıcı ve eşzamanlı yük dahil değildir. Isınma, ilk sorgunun süre aşımı için onaylanmış istisna değildir.

## Elenen seçenekler

| Seçenek | Karşı örnek |
|---|---|
| Tek sütunlu GiST | Eşiksiz boş aramada yaklaşık 483 ms sunucu süresi |
| Sorguyla daraltılan RLS ve GiST | Dar yetkide yaygın sözcük yaklaşık 8,5 saniye |
| Bileşik GiST + kapsam alt/üst sınırı | İki uzak kapsamda işlem p95 578 ms, dört seyrek kapsamda 341 ms |
| Yetki aralıklarını ayrı arayıp birleştirme | İlk testler geçti; sonra sogut uretim 27.385 ms, santiye uretim 351 ms, uretim 499999 1.189 ms |
| GIN ön sorgusu / bitmap | Yaygın sözcük yaklaşık 574 ms sunucu süresi |
| RUM | Yaygın iki sözcük yaklaşık 10.160 ms sunucu süresi; elendi ve eklenti kaldırıldı |
| Yalnız skaler sözcük/kayıt eşlemeleri | Birlikte bulunmayan sözcüklerde yaklaşık 1.869 ms sunucu süresi |

Tek plan gözlemleri ile tekrarlı işlem ölçümleri aynı ölçüm değildir. Başarılı ara testler sonradan bulunan karşı örnekleri geçersiz kılmaz.

## Son prototip

Kaynak spike.s12_search politikasında başlangıçtaki yalnız kapsam RLS'i korunur. Son yardımcı spike.s12r_bucket_search(text), SECURITY INVOKER, sabit search_path ve non-leakproof olarak çalışır. PUBLIC/anon/authenticated çağrı yetkisi yoktur; sınırlı spike_app rolü çağırabilir.

Kaynak arama satırlarından üç veri kümesi türetilir:

| Deney tablosu | İşlev | İndeksler dahil boyut |
|---|---|---:|
| s12r_postings | Sözcük → kayıt/kapsam/tür | 363.610.112 bayt |
| s12r_words | Kapsama göre sözcükler, adetler ve yakın sözcük araması | 75.653.120 bayt |
| s12r_word_buckets | Sözcük × kapsam × tür için sıralı kayıt kimliği dizileri | 65.470.464 bayt |
| Toplam ek alan | Kaynak tablonun alanına ilave | **504.733.696 bayt ≈ 481 MiB** |

Üç tablo da kapsam RLS'ine tabidir; kullanıcı yalnız SELECT yapabilir. Sözcük tablosunda ayrıca işlem içi arama terimleri/yakınlık koşulu vardır; bunu değiştirmek kapsam izni vermez. Sonuç kaynak tablonun RLS kontrolünden tekrar geçer. Yetkisiz sözcük sözlüğü veya ayrıcalıklı kullanıcı sorgusu yoktur.

Önerilen arama davranışı:

1. Metin ve sorgu aynı NFC/Türkçe harf dönüşümünden geçer, simple tam metin sözcükleri çıkarılır; sorgu üst sınırı 200 karakterdir.
2. Sözcük yetkili sözlükte aynen varsa o kullanılır. Yoksa 0,6 ve üstü yakınlıktaki yetkili sözcükler denenir. Keyfi aday sınırı yoktur.
3. **Bütün sözcükler aynı kayıtta bulunmalıdır; sıra önemli değildir.** Bir bölümünü içeren sonuçlarla liste doldurulmaz.
4. Tek adaylı sözcüklerde en seyrek sözcüğün dizisi, diğer dizilerle intarray kesişimi kullanılarak daraltılır. Birden çok düzeltme adayı varsa skaler eşlemelerle her sözcüğün en iyi benzerliği hesaplanır.
5. Sözcük benzerliklerinin ortalamasıyla tür başına en iyi beş seçilir. Tam eşleşme puanı 1'dir. Yetki ve bütün sözcük filtresi LIMIT'ten önce uygulanır; eşit puanlarda değişmez kimlik sırası garanti edilmez.

Bu davranış, elenen prototiplerin bütün sorguya benzerlikle boşluk doldurmasından farklıdır; onaylı ürün kararı sayılmaz. Korunan eklentiler pg_trgm, btree_gist ve intarray'dir. RUM ve elenen yardımcılar/indeksler kaldırıldı; son hız testi temizlenmiş durumdadır.

## Doğruluk ve ayrı inceleme

57 ana kontrol ve ayrı incelemede 16 kontrol geçti:

- Yirmi sorgu/yetki örneği, yardımcı tablolar yerine kaynak vektörlerinden oluşturulan bağımsız referansla karşılaştırıldı. Beklenen kapsamlar açıkça verildi; adet ve tür başına puan sıralaması aynı. Eşit puanlı farklı kimlikler hata sayılmadı.
- Türkçe/Unicode, noktalama, sayılar, sözcük sırası, çok sözcük, yazım hatası, boş/seyrek/yaygın sonuç ve dar/tüm/aralıklı yetkiler sınandı. Yakın adayların arkasındaki 500000 kimlikli gerçek eşleşme bulundu.
- Kimlik veya izin yokken sonuç yok. Yetki kaldırma/geri verme sonraki istekte etkili; art arda sorgular doğru; işlem sonrası sorgu bağlamı temiz. SQL benzeri girdi sorgu yapısını değiştirmiyor.
- Kendine yetki verme ve yardımcı tablo yazma 42501; uzun girdi 22023 ile reddedildi. Üç sentetik gizli alan işareti aramaya girmedi; tüm modüllerin alan sınıflandırması denetlendiği iddia edilmez.
- Üç profilde üç yardımcı tablonun kapsam dışı veriyi gizlediği ve fonksiyonun çağrı/yetki özellikleri ayrıca sınandı.
- Tek işlemde bir başlık, eşlemeleri, adetleri ve dizileri güncellendi: yeni başlık bulundu, eski kayboldu; ROLLBACK eski sonucu geri getirdi. Ürün olay tüketicisi yazılmadı.
- Kaynak 500.000 satır; eşleme toplamı, sözcük adetleri toplamı ve dizi elemanları toplamı aynı.

## Son hız ölçümleri

Tüm değerler ms; her satır iki ısınma sonrası 20 örnek. Sonuç adedi her ölçümde doğrulandı.

| Senaryo | p50 | p95 | En yavaş |
|---|---:|---:|---:|
| Tek kapsam, tam eşleşme | 221 | 223 | 224 |
| Tüm kapsamlar, tam eşleşme | 222 | 225 | 230 |
| Tüm kapsamlar, yaygın sözcük | 222 | 223 | 224 |
| Tek kapsam, yaygın sözcük | 221 | 222 | 222 |
| Tüm kapsamlar, yazım hatası | 222 | 223 | 223 |
| Tek kapsam, olmayan sözcük | 220 | 221 | 221 |
| Tüm kapsamlar, olmayan sözcük | 220 | 220 | 221 |
| Sözcükler var, aynı kayıtta birlikte yok | 258 | 258 | 258 |
| Yaygın iki sözcük | 222 | 223 | 223 |
| Sözcük ve sayı | 222 | 222 | 223 |
| Birden çok düzeltme adayı olan sayı | 224 | 225 | 225 |
| Ters sıradaki sözcükler | 222 | 223 | 224 |
| Yakın adayların arkasındaki eşleşme | 220 | 221 | 222 |
| İki uzak kapsam | 221 | 224 | 225 |
| Dört seyrek kapsam | 221 | 222 | 225 |
| Elli ayrı kapsam | 221 | 222 | 222 |
| Dokuz ayrı kapsam | 221 | 221 | 222 |
| Sekiz ayrı kapsam | 221 | 221 | 222 |

Temizlikten sonraki ön ısınmasız tekil gözlemler: birlikte bulunmayan sözcükler **461 ms**, yaygın iki sözcük 249 ms, sözcük + sayı **371 ms**, belirsiz sayı 274 ms. Tekrarlı soğuk başlangıç testi değildir; ilk çalıştırma hedefinin sağlandığı söylenemez. Sonraki doğrulama bu aşımı yeniden üretip çözmeli; yalnız ısınmayı zorunlu sayarak hedef geçmiş kabul edilemez.

## Önceden sunulan ürün mimarisi önerisi — D-247 ile onaylandı

Aşağıdaki etki analizi onay öncesinde yazıldı; bekleyen onay ve 211 tablo ifadeleri o tarihe aittir. D-247 ile yön onaylandı, ürün tasarımı SCHEMA-PLATFORM belgesinde 215 tabloya katlandı. İlk istek hızına istisna verilmedi.

PostgreSQL yönü ve arama satırı korunarak üç türetilmiş veri kümesi eklenebilir. Ölçülen başarı karşılığında ek disk, yazma, bakım ve yeniden kurma maliyeti vardır.

| Etki | Öneri / kalan iş |
|---|---|
| Gereksinim, özellik ve görev | REQ-NFR-012, REQ-IAM-011, D-227/D-239 korunur. TASK-0090/0091 REVIEW, OQ-029 açık. Genel aramanın yukarıdaki sözcük davranışı onay bekler. Onay ve hız doğrulamasından sonra SPIKE-14 |
| Veri modeli | Üç yardımcı veri kümesi, sürümlü normalleştirme ve kayıt eşlemesi. Phase 04'ün 211 tabloluk onaylı listesi bu raporla değiştirilmez; ürün adları/alanları onay sonrası tasarlanır |
| Kimlik ve kapsam | Deney dizileri int4 kimlik kullanır. Ürün UUID'si doğrudan dönüştürülemez; kapasite kontrollü benzersiz arama kimliği eşlemesi gerekir. Skaler kapsam ürün scope_type/scope_ids modeline uyarlanmalı, mükerrer sonuç önlenmeli |
| Backend/API/UI | Mevcut port arkasında, dış servis veya yeni UI öğesi yok. Olay tüketicisi arama satırı ve yardımcılarını aynı işlemde güncellemeli; tekrar teslim ve emekliye ayırma sınanmalı. Tam sayım ve sayfalama aynı koşullarla ayrıca yapılmalı |
| Yetki | Her yardımcıda RLS, sonuçta kaynak yetkisi; değişen izin sonraki istekte etkili. Hizmet rolüyle kullanıcı sorgusu yok |
| Göç ve geri dönüş | Eklentiler envantere eklenir; arama satırlarından deterministik yeniden kurma/karşılaştırma sonrası okuma yolu değiştirilir. Eski yol geçici geri dönüş olabilir ama bilinen hız kusuruyla ürün kabulü sayılamaz |
| Uyumluluk ve test | Kaynak iş kayıtları değişmez. Normalleştirme, UUID eşlemesi, bütün kapsamlar, güncelleme/izin değişimi, yeniden kurma, ilk sorgu, eşzamanlılık, daha çok tür ve belirsiz aday yükü doğrulanmalı |
| Risk | Örneklemde yaklaşık 481 MiB ek alan; ürün dağılımı farklı olabilir. Keyfi aday sınırı yoktur; genel hız garantisi verilmez. İlk çalıştırma hedefi açık |

## Kanıt ve güvenli devam

Dış scratchpad/spikes içinde search12r-final-evidence.json (57 kontrol, temizlik öncesi hızlar), search12r-final-review.json (16 kontrol), search12r-clean-final-speed.json (son hızlar) bulunur. Betikler search12r-final-test.mjs, search12r-final-review.mjs, search12r-clean-final-speed.mjs; temizlik search12r-cleanup.mjs'dir. Geçici betikler Git teslimatı değildir; kalıcı kanıt bu rapordur.

Veritabanında s12_search/s12_access/s12_fold, üç s12r_ tablo ve s12r_bucket_search kalır. s12r_search, s12r_lookup, s12r_token_search ve elenen kaynak GiST/RUM indeksleri kaldırıldı. 103 sentetik başlık değişti, ilk kapsamın 48 Söğüt eşleşmesi korunur. İzni kaldırılan kullanıcıya izin geri verildi. Eski kurulum/başarısız politika betikleri körlemesine tekrar çalıştırılmaz; reset yapılmadı.

İşlem içinde açık SQL SET LOCAL statement_timeout='10s' kullanılır. Bağlantı yardımcısının zaman aşımı seçeneği önceki 27 saniyelik sorguyu durdurmadığından yeterli sayılmaz. Burada yeni iptal/kurtarma testi iddia edilmez; gerçek iptal kanıtı SPIKE-06'dadır. Geçici bağlantı yardımcısının TLS sertifika doğrulama istisnası ürüne taşınmaz.

Tam IAM, bütün kapsam türleri, gerçek modül/tür kataloğu, ürün olay tüketicisi, HTTP/tarayıcı, ilk bağlantı, tekrar üretilebilir soğuk plan ve eşzamanlı yük teslim edilmedi. Sahip onayı bunların test edilmiş olduğu anlamına gelmez.

Kaynaklar: [PostgreSQL pg_trgm](https://www.postgresql.org/docs/17/pgtrgm.html), [PostgreSQL intarray](https://www.postgresql.org/docs/17/intarray.html), [Supabase RUM](https://supabase.com/docs/guides/database/extensions/rum). Bu rapor belgelerin yanında yalnız belirtilen deneyin sonuçlarını kaydeder.
## Bu oturumun devam planı — 2026-09-20

Sahibin iki öneriden sonra verdiği "devam" talimatıyla önerilen yön ve sözcük davranışı benimsenir; karar D-247, değişiklik CHG-007 olarak katlanır. Bu onay hız istisnası değildir. Önce ADR, veri sözleşmesi ve yol haritası güncellenir. Ardından yalnız geçici deneyde, her sorgudan önce işlem içi DISCARD PLANS ile yeniden planlama, sorgu/işlem sürelerinin ayrılması ve sınırlı rol altında EXPLAIN ölçümü yapılır. Kaynak veriye veya ürün tablolarına yazılmaz. Gerekirse yalnız deney fonksiyonu düzenlenir; eski tanımı dış scratchpad'e kaydedilir ve geri dönüş mümkün tutulur. Başarı için ilk plan ve sıcak sorgular aynı sonuçları üretmeli, RLS korunmalı ve 300 ms sınırı aşılmamalıdır. Sunucu yeniden başlatma veya işletim sistemi önbelleğini temizleme yapılmaz; soğuk veri önbelleği bu yöntemle kanıtlanmış sayılmaz.

### Tek gidiş-dönüşlü okuma denemesi

Üç gidiş-dönüşün toplamı bazı örneklerde sorgu çalışmasından çok daha uzundur. Aynı arama yordamını, kimliği işlem başında kuran SECURITY INVOKER bir deney sarmalayıcısıyla tek parametreli SQL çağrısında sınayacağız. PostgreSQL'in örtük işlemi çağrı sonunda yerel kimliği temizlemeli; bu başarıda ve hatada ayrı doğrulanacak. Rol işlemden önce sabit sınırlı roldür; sarmalayıcı yanlış rolde çalışmayı reddeder. Bu, yetki veya 300 ms şartını değiştirmez; ölçüm biçiminin üç ağ turundan bire indiği açıkça raporlanır. İlk bağlantı/rol kurma maliyeti ayrıca belirtilir. Ürün bağlantısında gerçek sınırlı giriş rolü gerekir; deneyin yönetici bağlantısı ürüne taşınmaz.

## Son tanı ve tek çağrılı ölçümler — 2026-09-20

İlk planı yeniden üretmek için DISCARD PLANS, ayrıca 12 yeni bağlantı ve dönüşümlü SELECT 1 kontrolü kullanıldı. DISCARD PLANS veri/işletim sistemi önbelleğini temizlemez; soğuk disk veya sunucu yeniden başlatma sınanmadı. İlk üç turlu yeniden denemede 828/348 ms görüldü. Yeni bağlantı EXPLAIN örneklerinde sorgu çalışması yaklaşık 4–40 ms iken bazı toplamlar 331–462 ms idi. Bu örneklerde önemli gecikme sorgu çalışmasının dışındadır; ağ/havuz/istemci payları ayrı ayrı kanıtlanmadı.

Dönüşümlü 20 kontrol ve 20 aramada SELECT 1 p95 238, en yavaş 243 ms; arama p95 279, en yavaş 631 ms oldu. Bu kez ilk aramanın sunucu çalışması 384 ms olduğundan bütün gecikmeyi ağa bağlamak da yanlıştır. JIT açık/kapalı karşılaştırması tek başına çözüm göstermedi: 744/919/856 ms işlemlerde sunucu yaklaşık 39–42 ms, BEGIN/COMMIT ağ turları 228–324 ms idi. Kalıcı JIT ayarı değiştirilmedi.

spike.s12r_request_search(actor uuid, q text) yalnız spike_app rolüyle, SECURITY INVOKER olarak kimliği işlem yerel kurup mevcut s12r_bucket_search yordamını çağırır. Tek SQL komutu PostgreSQL'in örtük işlemiyle tamamlanır; ek BEGIN ve COMMIT ağ turları yoktur. Kullanıcı ve sorgu bağlı parametredir. Üründe actor yalnız doğrulanmış sunucu oturumundan gelir; tarayıcının serbest kimlik seçmesine izin verilmez. Bu bir iş kuralı değişikliği değil ADR-015 içindeki okuma çağrısı denemesidir.

Aşağıdaki süreler **bir ağ gidiş-dönüşüdür**; önceki üç turlu ölçümlerle yöntem farkı açık tutulur. Ön ısınma yok; her örnek öncesi planlar atıldı (tanı komutunun süresi ölçüme dahil değil, üründe çalıştırılmaz). Bağlantı ve sınırlı rol kurulumu ölçümden önce tamamlandı. 20 örneğin tümünde sonuç sayısı kontrol edildi.

| Senaryo kodu | İlk | p50 | p95 | En yavaş (ms) |
|---|---:|---:|---:|---:|
| one-exact | 99 | 76 | 76 | 99 |
| all-exact | 77 | 77 | 77 | 79 |
| all-common | 76 | 77 | 79 | 80 |
| one-common | 76 | 80 | 91 | 91 |
| all-typo | 169 | 91 | 100 | 169 |
| one-absent | 75 | 79 | 85 | 88 |
| all-absent | 80 | 81 | 88 | 88 |
| multi-absent | 122 | 140 | 158 | 160 |
| multi-common | 175 | 88 | 99 | 175 |
| number | 190 | 84 | 90 | 190 |
| ambiguous | 145 | 89 | 123 | 145 |
| reversed | 123 | 112 | 123 | 124 |
| late | 115 | 88 | 98 | 115 |
| holes | 91 | 87 | 105 | 109 |
| sparse | 123 | 114 | 123 | 125 |
| 50-ranges | 105 | 90 | 105 | 108 |
| 9-ranges | 85 | 84 | 88 | 89 |
| 8-ranges | 86 | 85 | 98 | 101 |

Ayrı 12 yeni bağlantıdaki ilk istekler sırasıyla 123, **392**, 133, 84, 263, 78, 115, 76, 119, 83, 137, 84 ms. Bağlantı/rol kurma ayrıca 524–3560 ms sürdü ve hedef sorgu süresine katılmadı. Yeni istemci bağlantısı, havuzun yeni PostgreSQL backend'i verdiğini kanıtlamaz. 392 ms örneği çıkarılmadı; tüm ilk istekler hedefi karşılıyor iddiası yoktur.

14 ek istek kontrolü geçti: aynı bağlantıda farklı kullanıcılar, izinsiz kullanıcı, başarı ve geçersiz girdi sonrasında temiz kimlik/arama bağlamı, kimliksiz arama ve doğrudan kaynak okumanın boş dönmesi. Ayrı beş güvenlik kontrolü: private/invoker özellikler, yanlış rolün 42501 ile reddi, gerçek 1 ms iptalinin 57014 vermesi, iptal sonrası kimlik temizliği ve sonraki izinsiz kullanıcının boş sonucu.

İlk ayrı inceleme yanlış rol kontrolünde durdu: test, yeni bağlantıda yönetici rolüne kendiliğinden dönüldüğünü varsaymıştı. Havuzdaki önceki SET ROLE durumu nedeniyle sınırlı rol hâlâ etkindi. Test başlangıcında açık RESET ROLE, sonunda RESET ROLE/RESET statement_timeout eklenince beş kontrol geçti. Güvenlik sınırı gevşetilmedi. Ürün bağlantısı gerçek sınırlı giriş rolü kullanmalı; yöneticiyle bağlanıp SET ROLE durumuna güvenen deney kopyalanmamalı. Deney sarmalayıcısı yanlış rolde çalışmayı zaten reddeder; geçici betikler başlangıç/son durumunu açık kurmalıdır.

Kanıtlar: search12r-cold-evidence.json, search12r-fresh-evidence.json, search12r-control-evidence.json, search12r-jit-evidence.json ve search12r-onecall-evidence.json. Yeni bağlantı incelemesi JSON yazmadan negatif testte durdu; 12 basılmış gözlem eksiksiz search12r-first-observations.json dosyasına, konsol aktarımı olduğu belirtilerek kaydedildi. Düzeltilmiş güvenlik betiği search12r-onecall-security.mjs beş kontrolü geçti. search12r-speed-gate.mjs iki son hız kanıtını okuyup 392 ms için **FAIL / çıkış kodu 1** verir. Bu, ürün test kapısının bozulduğu anlamına gelmez: doğrulama denemesinin başarısız kabul ölçütü kayda geçirilmiştir.

Son veritabanında önceki yardımcıların yanında s12r_request_search de kalır. Kaynak veri değiştirilmedi; s12r_bucket_search tanımı tanı sırasında aynı içerikle yeniden oluşturuldu, algoritma değişmedi. Başlangıçtaki SQL tanımı dış scratchpad'de search12r-current-function.sql olarak saklandı. Sonraki iş, kimlik/rol sözleşmesi korunarak ilk çağrının sunucu ve bağlantı giderlerini eşzamanlı kaydetmek, aşımı kontrollü biçimde yeniden üretmek ve gidermektir. Hedefi yükseltmek veya aykırı örneği silmek çözüm değildir.

Teknik dayanak: [PostgreSQL işlem sınırları](https://www.postgresql.org/docs/17/tutorial-transactions.html), [DISCARD PLANS](https://www.postgresql.org/docs/17/sql-discard.html), [Supabase gözlemlenebilirlik](https://supabase.com/docs/guides/observability). Belgelerin tanımladığı davranış ile bu deneyin ölçümleri ayrı değerlendirilir.

## Aynı istekte sunucu/istemci ayrımı — devam planı

2026-09-20: TASK-0091 kapsamında 24 yeni istemci bağlantısının ilk arama çağrısı EXPLAIN ANALYZE ile ölçülecek. Her gözlemde bağlantı kurulumu, toplam sorgu süresi, PostgreSQL planlama/çalışma süresi ve blok okumaları aynı isteğe ait olacak. Sonuç adedi ve sınırlı rol doğrulanacak; başlangıç ve kapanışta rol/zaman aşımı açıkça temizlenecek. Kanıt her örnekte diske yazılacak. Yalnız sentetik arama okunacak; ürün veya deney algoritması değiştirilmeyecek. Bu tanı başarısız örnekleri silmez, önceki hız kapısını kendiliğinden kapatmaz.

### Daraltma planı

Adım profili, birlikte bulunmayan sözcüklerde sürenin çoğunun kapsam/tür kümelerini tek tek işleyen döngüde geçtiğini gösterdi (yaklaşık 39–73 ms sıcak sunucu süresi). Aynı intarray kesişimini tek özyinelemeli SQL sorgusunda yapmak sınanacak: bütün sözcükler ve kapsam filtresi korunacak, tür başına beş seçimi kaynak RLS'inden sonra yapılacak. Önce yeni deney fonksiyonu kurulacak; mevcut yordam değiştirilmeyecek. Bağımsız sonuç/sıralama referansı geçmeden yeni yol kabul edilmeyecek; başarısız olursa yardımcı kaldırılacak.

## Aynı isteğin süre ayrımı — sonuç

24 yeni istemci bağlantısında ilk arama çağrısı ölçüldü. İlk zor arama **529 ms** sürdü: PostgreSQL çalışma süresi **444,701 ms**, dış planlama 0,059 ms, kalan yaklaşık 84 ms. Bu örnekte baskın gecikme sunucudadır; yalnız ağ gecikmesi açıklaması reddedilir. Sonraki aynı tür sorgular yaklaşık 118–152 ms, diğer sorgular 77–239 ms oldu. İlk dört sorgunun sunucu süreleri sırasıyla 444,701 / 159,776 / 69,025 / 47,829 ms; sonraki örnekler belirgin biçimde azaldı. Bu gözlem bir başlangıç maliyetini gösterir, nedenini tek başına kanıtlamaz.

| Örnek | Tür | Toplam ms | Sunucu ms | Dış plan ms | Kalan ms | Paylaşımlı blok okuma |
|---|---|---:|---:|---:|---:|---:|
| 0 | absent | 529 | 444.701 | 0.059 | 84 | 0 |
| 1 | number | 239 | 159.776 | 0.028 | 79 | 0 |
| 2 | common | 143 | 69.025 | 0.029 | 74 | 0 |
| 3 | typo | 128 | 47.829 | 0.029 | 80 | 0 |
| 4 | absent | 152 | 72.736 | 0.035 | 79 | 0 |
| 5 | number | 83 | 3.776 | 0.029 | 79 | 0 |
| 6 | common | 84 | 4.571 | 0.03 | 79 | 0 |
| 7 | typo | 84 | 4.47 | 0.029 | 79 | 0 |
| 8 | absent | 119 | 39.553 | 0.028 | 79 | 0 |
| 9 | number | 77 | 3.808 | 0.028 | 73 | 0 |
| 10 | common | 78 | 4.665 | 0.029 | 73 | 0 |
| 11 | typo | 83 | 4.425 | 0.029 | 78 | 0 |
| 12 | absent | 119 | 39.493 | 0.027 | 79 | 0 |
| 13 | number | 83 | 3.809 | 0.032 | 79 | 0 |
| 14 | common | 79 | 4.715 | 0.029 | 74 | 0 |
| 15 | typo | 78 | 4.294 | 0.03 | 73 | 0 |
| 16 | absent | 118 | 44.835 | 0.028 | 73 | 0 |
| 17 | number | 84 | 3.79 | 0.029 | 80 | 0 |
| 18 | common | 78 | 4.593 | 0.028 | 73 | 0 |
| 19 | typo | 84 | 4.279 | 0.029 | 79 | 0 |
| 20 | absent | 125 | 44.413 | 0.027 | 80 | 0 |
| 21 | number | 78 | 3.864 | 0.029 | 74 | 0 |
| 22 | common | 84 | 4.684 | 0.028 | 79 | 0 |
| 23 | typo | 84 | 4.394 | 0.028 | 79 | 0 |

Bütün örneklerde sonuç adedi, sınırlı rol ve işlem sonrası boş kimlik kontrol edildi. Bağlantı kurma/rol hazırlama 508–625 ms ve yukarıdaki çağrı sürelerine dahil değildir. Shared Read Blocks=0, bu sorguda raporlanan paylaşımlı bloklarda fiziksel okuma olmadığını gösterir; sistem katalogları, işletim sistemi veya backend ilk yükleme maliyetinin bütünüyle elendiğini göstermez. Yeni istemci bağlantısı havuzun yeni PostgreSQL backend'i verdiği anlamına gelmez.

Ayrı tanı kopyası arama adımlarına süre ölçümü koydu. Sıcak durumda setup yaklaşık 0,6–2,2 ms, sözcük bakışları yaklaşık 0,6–1 ms, küme döngüsü yaklaşık 39–73 ms oldu. 445 ms'lik başlangıç aşımı bu kopyada yeniden oluşmadı; onu döngünün tek başına açıkladığı ileri sürülemez. JIT açık/kapalı tanısı çözüm göstermedi. Sunucunun mevcut JIT ayarı off; pg_stat_statements içinde arama çağrılarıyla eşleşen 408 çağrı için jit_functions ve derleme süreleri sıfır. Mevcut aşımın JIT kaynaklı olduğu desteklenmiyor.

Özyinelemeli toplu kesişim alternatifi ayrı s12r_set_search yordamında denendi: birlikte bulunmayan sözcükler yaklaşık 81 ms sunucu süresi, yaygın iki sözcük **7555 ms**. Eşit puan sıralaması kaldırılınca yaygın iki sözcük yaklaşık 139 ms'ye indi ama mevcut yordamın sıcak 4–5 ms davranışından hâlâ kötüydü. Alternatif kabul edilmedi; bağımsız tam sonuç testi yapılmış sayılmaz. s12r_set_search ve süre ölçüm kopyası s12r_profile_search kaldırıldı. Asıl s12r_bucket_search/s12r_request_search değişmedi; asıl yolun bir sonuçlu sorgusu ve işlem sonrası kimlik temizliği tekrar geçti. Veri ve ürün kodu değişmedi.

Kanıt: search12r-attribution.mjs/json (her örnekte yazıldı), search12r-stage.mjs ve search12r-stage-evidence.json; elenen düzenler search12r-set.mjs/search12r-set2.mjs, salt okunur JIT incelemesi search12r-jitstats.mjs; temizlik search12r-attribution-cleanup.mjs. Eski betikler körlemesine çalıştırılmaz. Hız kapısı mevcut ve yeni ilk-istek kanıtlarını birlikte değerlendirir; 392 ve 529 ms için başarısız kalır.

**Sonraki tanı:** istemci bağlantısı ile gerçek PostgreSQL backend başlangıcını ayırmak için backend kimliği/başlangıç zamanı aynı ölçümle kaydedilecek. Havuzun aynı backend'i yeniden kullanması ile gerçekten yeni backend'in ilk yürütmesi karşılaştırılmalı; gerekirse aynı test projesinin doğrudan bağlantı yolu erişilebilirliği incelenmeli. Sunucu/başka kullanıcı oturumları sonlandırılmayacak, soğuk örnekler ölçümden çıkarılmayacak. Kök neden ve düzeltme henüz tamamlanmadı; TASK-0091 REVIEW, OQ-029 açık.

## Bölge ve gerçek backend ayrımı — plan

2026-09-20: Sahip İrlanda konumunun etkisini sordu. Mevcut bağlantının yalnız bölge kodu/parola içermeyen bağlantı modu okunacak. Arama isteğiyle aynı SQL komutunda backend kimliği, backend yaşı ve arama çalışma süresi kaydedilecek. Her yeni istemci bağlantısında iki ardışık çağrı karşılaştırılacak; sonuç/yetki/kimlik temizliği kontrol edilecek. Hiçbir bölge değişimi, proje taşıma veya servis yeniden başlatma yapılmayacak. Konumun ağ gecikmesine etkisi ile sunucu içindeki maliyet ayrı yorumlanacak.

## Bölge ve gerçek backend ayrımı — sonuç

Mevcut test bağlantısının bölge kodu eu-west-1 (İrlanda), portu 6543: paylaşımlı **işlem havuzu**. Önceki Frankfurt ifadesi hedef yönelimdi; test projesinin gerçek konumu olarak kullanılmamalı. [Supabase bölgeleri](https://supabase.com/docs/guides/platform/regions) yakınlığın gecikmeye etkisini, [bağlantı belgesi](https://supabase.com/docs/guides/database/connecting-to-postgres) işlem havuzunun bağlantı davranışını açıklar. Bölge/proje değiştirilmedi.

16 yeni istemci bağlantısında ikişer arama, toplam 32 gözlem yapıldı; tamamı aynı backend kimliğini (488000) verdi. İlk birlikte bulunmayan sözcük araması 636 ms toplam, 533,213 ms sunucu içi süre; hemen sonraki aynı sorgu 119 / 38,564 ms. İlk numara araması 183 / 109,076 ms, sonraki 77 / 2,834 ms. Sonuç adedi, sınırlı rol ve işlem sonrası kimlik temizliği bütün örneklerde geçti. Backend kimliğinin aynı olması yeniden kullanımı gösterir; ilk örnekten önce ne zaman başladığını göstermez.

Ölçüm, bağımlı MATERIALIZED CTE içinde clock_timestamp ile arama ve sonuç toplama süresini ölçer; dış SQL planlaması bu süreye dahil değildir. Önceki EXPLAIN ölçümüyle birebir aynı araç değildir. Toplamdan kalan süre yalnız ağ değildir; havuz, dış planlama ve istemci giderlerini de içerir. Dolayısıyla 533 ms sunucu içi maliyeti yalnız coğrafi ağ uzaklığı açıklamaz. Frankfurt karşılaştırması yapılmadı; taşınmanın sağlayacağı kazanç bilinmiyor.

Ölçüm betiğinde görünmeyen backend_start değerinin Number(null) ile sıfır yazılması incelemede bulundu. Kanıt yaş alanları null olarak düzeltildi ve düzeltmenin kökeni kaydedildi; backend'in sıfır yaşında olduğu iddia edilmez. Sonraki yönetici okumasında ölçülen PID artık görünmedi, bu nedenle başlangıç zamanı doğrulanamadı. Hiçbir oturum sonlandırılmadı.

İşlem havuzunda oturum düzeyinde SET ROLE/timeout ayarlarına güvenilemez. Bu seride rol her sorguda doğrulandı ve sarmalayıcı yanlış rolü reddeder; yine de sonraki deney başlangıç/son ayarlarını aynı açık işlemde SET LOCAL ile kurmalı. Bu çok turlu tanının süresi tek çağrılı ürün hedefiyle karıştırılmamalı. Üründe gerçek sınırlı giriş rolü şartı değişmez.

Kanıt: search12r-backend.mjs, search12r-backend-evidence.json ve search12r-backend-review.mjs. Hız tekrar kapısına bu seri de eklendi: 392/529/636 ms örnekleri korunur, sonuç FAIL. Sonraki adım aynı işlemde rol/kimlik ve backend başlangıcını birlikte yakalayıp ilk-yürütme maliyetini sınamak; tekrarlanan sıcak ölçümler çözüm sayılmaz. TASK-0091 REVIEW ve OQ-029 açık; ürün kodu yazılmadı.

## İşlem yerel tanı — plan

2026-09-20: Sahip bölge değişimini sonraya bıraktı; mevcut İrlanda projesinde devam. TASK-0091 için altı yeni istemci bağlantısında açık işlem, yönetici görünürlüğünde backend başlangıcı, ardından SET LOCAL ROLE spike_app kullanılacak. Aynı işlemde iki sorgunun sonuçları ve süreleri karşılaştırılacak; savepoint geri alımı kimliği temizleyecek. Zaman aşımı işlem yerel 10 saniye, son işlem ROLLBACK; veri/şema değişmeyecek. İlk bağlantıda planlar atılmayacak; sonraki bağlantılarda DISCARD PLANS etkisi ayrıca işaretlenecek. Bu tanının çok turlu toplamı ürünün tek çağrılı hız ölçümü değildir. Kabul: backend başlangıcı gerçekten görünür, sonuç/rol/kimlik kontrolleri geçer; görünmeyen alanlar sıfır sayılmaz. Kök neden kanıtlanmadan hız kapısı kapanmaz.

### Yeni backend üzerinde adım profili

İşlem yerel tanıda başlangıç yaşı 0,157 saniye olan backend üzerinde ilk sorgu 540 ms / sunucu 464,720 ms, ikinci sorgu 112 / 38,945 ms ölçüldü. On iki örneğin sonuç/rol/kimlik kontrolleri geçti. Sonraki adım: asıl fonksiyon değişmeden ayrı private/invoker süre ölçüm kopyası kurulacak; mevcut deney bağlantısı açık işlemle tutulurken ikinci bağlantıda backend başlangıcı kaydedilip profil çalıştırılacak. Yalnız iki deney bağlantısı kullanılacak; başka oturum sonlandırılmayacak. Kopya sonunda kaldırılacak; rol ve zaman aşımı işlem yerel kalacak. Bu deney yeni backend başlangıcı ile arama alt adımlarını aynı örnekte eşleştirmek içindir.

## İşlem yerel tanı — sonuç ve inceleme

Altı istemci bağlantısında 12 sorgunun tamamında sonuç, sınırlı rol, sabit backend kimliği ve savepoint geri alımı sonrası boş kimlik doğrulandı. Backend 489491 başlangıcı 15:29:27,992 UTC; ilk hazırlık sorgusunda yaşı 0,157 saniyeydi. İlk arama 540 ms toplam / 464,720 ms sunucu içi, ikinci arama 112 / 38,945 ms. İlk numara araması 206 / 132,791 ms, ikinci 79 / 2,789 ms. Kalan çağrılar 76–119 ms; sonraki DISCARD PLANS işlemleri büyük aşımı yeniden üretmedi. Yeni backend'in ilk yürütmesinde aşım artık başlangıç zamanı ile birlikte gözlendi; yalnız yeni istemci bağlantısına dayanılmadı. Hazırlık ve geri alım ağ turları arama sürelerine dahil değildir.

Ayrı private SECURITY INVOKER profil kopyası için yalnız iki deney bağlantısı kullanıldı. İkinci backend 489510 gerçekten yeniydi (hazırlıkta yaş 0,083 saniye). İlk profil çağrısı 125 ms toplam / 48,324 ms sunucu, ikinci 114 / 39,604 ms oldu. İlk adımlar: hazırlık 3,270 ms; iki kesin sözcük bakışı 2,203 ve 0,784 ms; eşleme 0,516 ms; küme döngüsü 40,675 ms. Paylaşımlı blok okuma sıfırdı. Profil kopyası doğrudan çağrıldı, asıl istek sarmalayıcısından geçmedi; ayrıca veritabanı önceki tanıyla kullanılmıştı. Bu nedenle profil, ilk 465 ms'nin nedenini kanıtlamaz ve asıl çağrıyla kontrollü eşdeğer karşılaştırma sayılmaz. Yeni backend açılmasının tek başına her seferinde yavaşlık yarattığı iddiası desteklenmiyor.

İnceleme: görünmeyen yaş artık assert ile reddediliyor; rol/zaman aşımı SET LOCAL, bütün asıl tanı işlemleri ROLLBACK ile kapanıyor. İstekler arasındaki kimlik temizliği aynı backend üzerinde savepoint geri alımıyla denetlendi; bu yeni bir COMMIT/iptal testi değildir (önceki güvenlik kanıtları ayrı kalır). Profil kopyası kaldırıldı; asıl fonksiyonlar, veriler, bağlantı dosyası ve bölge değiştirilmedi. Bölge taşıması sahibin isteğiyle sonraya bırakıldı (DEF-009).

Kanıt: search12r-pinned.mjs/evidence.json ve search12r-cold-stage.mjs/evidence.json. Hız tekrar kapısı yeni 540 ms örneğini de içerir ve FAIL kalır. Sonraki tanı asıl sarmalayıcıyla eşdeğer profili aynı koşullarda karşılaştırmalı ve ilk aşımın katalog/planlama/IO maliyetini kaydetmeli; sıcak profil tek başına ilk yürütmenin açıklaması değildir. TASK-0091 REVIEW, OQ-029 açık; sekiz deneme tamamlanmış durumda.

## Eşdeğer sarmalayıcı profili — plan

TASK-0091: Asıl yordam ve istek sarmalayıcısından ayrı private/invoker kopyalar üretilecek; arama adımlarına yalnız süre bildirimi eklenecek. Dört bağlantı açık işlemle ayrı backend tutacak; ikisinde profil, ikisinde asıl çağrı çalışacak, her birinde iki tekrar yapılacak. Backend başlangıcı, EXPLAIN planlama/çalışma ve blok sayaçları kaydedilecek. Profil ilk çalıştırılacak; ortak veritabanı/işletim sistemi önbelleği eşit soğuk varsayılmayacak. Girdiler parametreli, rol ve zaman aşımı işlem yerel, sonuç/kimlik kontrolleri zorunlu. Deney sonunda kopyalar kaldırılacak; asıl fonksiyonlar/veriler aynı kalacak. Yeni ürün kodu veya bölge taşıması yok.

### Plan seçimi karşılaştırması

Aynı arama tanımıyla auto, force_generic_plan ve force_custom_plan işlem yerel karşılaştırılacak. Boş çok sözcük, yaygın çok sözcük, nadir numara ve belirsiz yazım örnekleri ikişer kez; 5 saniye gerçek statement_timeout; sonuç adetleri, rol ve kimlik temizliği kontrol edilecek. Plan atımı veri/OS önbelleğini boşaltmaz. Ayar sunucuda veya fonksiyonda kalıcı değiştirilmeyecek. Hızlanan tek örnek bütün arama davranışı için kabul sayılmayacak.

### İlk arama sırasında bekleme örnekleme

Plan seçimi tek başına çözüm göstermedi. Sonraki salt okunur tanıda hedef arama ve ayrı gözlem bağlantısı aynı anda çalışacak. Gözlemci yalnız hedef deney PID'sinin state/wait_event alanlarını 5 ms aralık hedefiyle 1,5 saniye örnekleyecek; sorgu metni veya diğer kullanıcılar okunmayacak. Gerçek örnekleme aralığı zaman damgalarıyla saklanacak. CPU çalışması ile kayıtlı IO/kilit beklemelerini ayırmaya yardımcı olur; örnekleme hiçbir beklemenin kaçmadığını kanıtlamaz. İki bağlantı işlem yerel timeout/rol ile kapanacak; kalıcı nesne değişmeyecek.

## Eşdeğer profil, plan seçimi ve bekleme örnekleri — sonuç

Dört ayrı backend üzerinde sekiz çağrının sonuç adedi, sınırlı rol ve savepoint sonrası boş kimlik kontrolleri geçti. Asıl fonksiyonlardan türetilen profil ve sarmalayıcı kopyaları aynı rol/girdi/arama yapısını korudu. İlk profil çağrısı **432 ms toplam / 353,717 ms sunucu**: hazırlık 41,154 ms; kesin sözcük bakışları 91,509 ve 52,077 ms; eşleme 2,654 ms; küme döngüsü 165,201 ms. Aynı çağrının tekrarı 113 / 39,416 ms. Diğer üç backend'in ilk çağrıları 121–128 / 47–49 ms. Dış planlama yaklaşık 0,03 ms ve raporlanan paylaşımlı blok okuma sıfır. Yavaşlık artık profil içinde de yakalandı ve birden çok aşamaya dağılmış durumda; dış EXPLAIN planlama süresi, iç PL/pgSQL sorgularının planlama maliyetini ayrı ölçmez. Bütün sistem/katalog/OS IO'sunun sıfır olduğu sonucu çıkarılamaz. Kopyalar sonunda kaldırıldı.

Üç işlem yerel plan modu, dört senaryo ve ikişer tekrar ile 24 sorguda sonuç/rol doğrulandı. Genel plan modunda boş çok sözcük sorgusu sunucuda 39–41 ms; auto 39–40 ms; her defasında özel plan zorlanınca 84 ms. Diğer senaryolarda genel planın ilk çalıştırmaları 77–116 ms sunucu süresi, tekrarları 4–7 ms idi. Bütün bu çağrılar toplamda 77–189 ms arasında kaldı, zaman aşımı olmadı. Seri genel planla başladığı için önbellek/sıra etkisi vardır; eşit soğuk koşullar sağlandığı iddia edilmez. Genel plan başlangıç maliyetinin tamamını ortadan kaldırmadı, auto'ya karşı kabul edilecek bir kazanç göstermedi. Hiçbir kalıcı plan ayarı değiştirilmedi. Bu seride yalnız sonuç/rol kontrolü ve son ROLLBACK yapıldı; ayrıca kimlik temizliği assert'i eklenmiş sayılmaz.

Bekleme örneklemesi asıl aramaya eşzamanlı ayrı bağlantıdan 300 örnek aldı. Arama bu kez 126 ms toplam / 41,902 ms sunucu sürdü: yedi örnek active ve wait_event boş, kalan 293 örnek işlem içinde istemciden sonraki komutu bekliyor (ClientRead). Bu **sıcak** çalışmada görünür IO/kilit beklemesi yakalanmadı; yavaş ilk çağrının CPU kaynaklı olduğunu kanıtlamaz. Yalnız hedef deney PID'si okundu; asıl veri/fonksiyonlar, bölge ve bağlantı dosyası değişmedi.

Kanıt: search12r-wrapper-profile.mjs/evidence.json, search12r-plan-mode.mjs/evidence.json ve search12r-waits.mjs/evidence.json. Profilin 432 ms'si tanı ölçümüdür, ürün hızıyla doğrudan eşdeğer kabul edilmez; eski asıl istek aşımları ayrıca korunur. İnceleme sonunda geçici kopyalar kaldırıldı, bütün işlemler geri alındı ve kalıcı ayar değişmedi.

Sonraki başlangıçta **başka bir veritabanı deneyi öncesinde** search12r-waits.mjs çalıştırılmalı; böylece doğal boşta kalma sonrasındaki olası yavaş ilk çağrı bekleme kaydıyla eşleşebilir. Yavaşlık oluşmazsa aynı sıcak testi tekrarlamak kök neden ilerlemesi sayılmaz. Kontrollü ilk-çağrı/altyapı ölçümü halen gerekir; 300 ms hedefi, TASK-0091 REVIEW ve OQ-029 açık durumu değişmedi.

## Soğuk bekleme kaydı ve iç planlama — plan

2026-09-20: İlk veritabanı eylemi bekleme örnekleyicisi oldu: 571 ms toplam / 486,752 ms sunucu, 93 active/no-wait ve 207 ClientRead örneği. Hızlı önceki örnek ayrı tarihsel kayıtta durur; yeni kanıt search12r-waits-cold-evidence.json olarak ayrıca korundu. İç planlama ölçümü için pg_stat_statements.track=all, track_planning=on ve track_io_timing=on mevcut yönetici bağlantısında SET LOCAL ile kullanılabiliyor; kalıcı ayar/yetki değişmedi. Sonraki tanı spike_app rolünün iç sorgu sayaçlarını sıfırlamadan öncesi/sonrası farkıyla ölçecek. Dört sentetik sorgu ikişer kez, açık işlem/10 saniye timeout; sonuç ve rol kontrolleri, sonda ROLLBACK. Sayaçların ortak olması ve gözlemin kendi maliyeti sınır olarak yazılacak.

### Kesin sözcük için kapsayan indeks adayı

İç sayaçlarda nadir numara aramasının ilk 145,881 ms sunucu süresinde kesin sözcük sorguları 131,848 ms yürütme ve yalnız 0,401 ms planlama gösterdi. Plan incelemesi kesin eşleşmede s12r_words_gist kullandığını doğruladı. Deney: yalnız spike.s12r_words üzerinde (word, scope_id) INCLUDE (record_count) B-tree indeksi eklenecek. Amaç kesin sorgunun index-only yolunu seçmesi; benzerlik GiST'i ve bütün RLS kuralları korunacak. Dört sözcük planı ve 18 arama senaryosu, sonuç/scope/kimlik kontrolleriyle sınanacak. Asıl yordamlar değişmeyecek; anlamlı kazanç/plan değişimi olmazsa aday indeks kaldırılacak. İlk doğal soğuk doğrulama geçmeden SPIKE-12 kapanmaz; aday ürün göçü değildir.

### Aynı sınırla kesin eşleşme adayı

Kapsayan indeks yaygın sözcüklerde index-only seçildi fakat nadir 499997 için GiST kaldı (ilk yürütme 81,343 ms). Aynı alt ve üst sözcük sınırı (word >= term AND word <= term), ayrı 499996 örneğinde kapsayan B-tree seçti (1,287 ms toplam sunucu; iki paylaşımlı blok okuması). Sözcükler farklı olduğundan bu ölçüm kontrollü hız kazancı değildir. Asıl fonksiyon değiştirilmeden yalnız kesin eşleşme koşulu bu eşdeğer sıralama aralığına çevrilen private/invoker aday üretilecek. Aynı kolasyon korunacak, RLS ve benzerlik yolu aynı kalacak. 18 senaryoda eski/yeni satırlar birebir karşılaştırılacak; yanlış rol, yetkisiz kullanıcı, girdi hatası ve kimlik temizliği kontrol edilecek. Başarısızlıkta kopya/indeks kaldırılabilir; aday ilk çağrı doğrulamasına kadar REVIEW kalır.

## İç planlama ayrımı ve kesin eşleşme adayı — sonuç

İlk veritabanı işlemi olarak çalışan bekleme tanısı 571 ms toplam / 486,752 ms sunucu gecikmesini yakaladı. Yeni backend 493031; raporlanan paylaşımlı okuma sıfır. 300 örneğin 93'ünde sorgu active ve wait_event boştu; 207'sinde bitmiş sorgunun bağlantısı ClientRead bekliyordu. Bu, görünür kilit/IO beklemesi yakalanmadığını gösterir; CPU çalışması, işletim sistemi zamanlaması veya PostgreSQL'in işaretlemediği maliyetler arasında tek başına ayrım yapmaz.

İç sayaçlar yalnız açık işlemde etkinleştirildi; bütün rol/izleme ayarları ROLLBACK ile eski haline döndü, istatistikler sıfırlanmadı. Sekiz çağrının sonuç/rol/kimlik kontrolleri geçti. Nadir numara sorgusunun ilk 145,881 ms sunucu süresinde kesin sözcük sorgularının toplam yürütmesi 131,848 ms, planlaması 0,401 ms idi. İç yordam süreleri birbirini kapsayabilir; toplam yürütme süreleri toplanıp isteğe eşitlenmez. Sayaçlar rol genelindedir, başka eşzamanlı spike_app kullanımı varsa ayrım gerekir. Bu örnek, gecikmenin tamamını sorgu planlamasına yüklemeyi desteklemiyor.

Kesin sözcük planı nadir terimde s12r_words_gist kullanıyordu. Eklenen **s12r_words_exact_cover** B-tree indeksi (word, scope_id) INCLUDE (record_count), 15.785.984 bayt (~15,05 MiB). Yaygın sözcüklerde index-only seçildi; nadir 499997 teriminde GiST kaldı ve ilk sorgu 81,343 ms oldu. Tek indeksle 18 senaryo × 3 tekrar, sonuç sayısı/tekrarsızlık/tek-kapsam örnekleri ve kimlik temizliği kontrollerini geçti (73–130 ms); bu tam yetki regresyonunun tekrarı değildir.

Aynı alt/üst sözcük sınırıyla kesin eşleşme, nadir 499996 örneğinde B-tree index-only yolunu seçti (1,287 ms). Ayrı sözcükler ve önbellek koşulları olduğundan 81→1 ms kontrollü kazanç iddiası yoktur. Deney kopyaları s12r_range_search ve s12r_range_request, yalnız kesin eşleşme koşulunu aynı kolasyondaki kapalı aralığa çevirir; asıl fonksiyonlar korunur. SECURITY INVOKER ve dar EXECUTE izinleri, RLS, benzerlik ve sonuç sıralaması değişmedi.

18 senaryoda aday ve asıl çağrının bütün dönen satırları birebir eşleşti; aday 73–116 ms, asıl 73–111 ms. Karşılaştırmalar ısınmış ortamda ve aday önce çalıştırılarak yapıldı, kabul hız deneyi değildir. Ek yetkisiz/kimliksiz çağrı, uzun girdide 22023, hata sonrası temiz kimlik, yanlış rolde 42501, anon/authenticated EXECUTE yokluğu ve invoker özellikleriyle 24 işaretli kontrol geçti. Bu sayı her iç assert'in ayrı sayımı değildir. Bağımsız kaynak referansı ve ilk-soğuk aday ölçümü henüz tamamlanmadı.

Kanıt: search12r-waits-cold-evidence.json; search12r-planning-capability.json; search12r-nested-plans-1789921376747.json; search12r-word-plan-evidence.json; search12r-cover-evidence.json; search12r-exact-range-evidence.json; search12r-range-candidate-evidence.json. Eski bekleme betiği sabit dosya adını kullandığı için önceki 126 ms'nin ham dosyası üzerine yazıldı; tarihsel özet raporda korunur, ham iz korunmuş gibi gösterilmez. Yeni bekleme/iç planlama kanıtları zaman damgalı dosyalara yazılır; soğuk 571 ms ayrıca sabit arşiv kopyasındadır.

**Devam:** ilk veritabanı eylemi search12r-range-waits.mjs olmalı; adayın doğal boşta kalma sonrası ilk çağrısını örnekler. Bu betik hiçbir kurulum/ısınma araması yapmaz. Aday tanım ve yeni indeks deney veritabanında kalır; eski kurulum betikleri tekrar çalıştırılmaz. Soğuk aday geçerse bağımsız kaynak referansı, yeni ölçüm serisi ve indeks yazma/bakım maliyeti doğrulanır; geçmezse aday düzeltilir veya iki fonksiyon ve yalnız yeni indeks kaldırılır. Eski başarısız ölçümler silinmez; baseline hız kapısı 571 ms'yi de içerip FAIL kalır. Ürün tasarımına kabul edilmiş bir indeks değişikliği, ürün kodu veya bölge taşıması yok; TASK-0091 REVIEW ve OQ-029 açık.

## Adayın soğuk ilk çağrısı ve nedenin daraltılması — 2026-09-21

### Aday soğuk ölçümde geçmedi

Oturumun ilk veritabanı eylemi hazırlanan bekleme örnekleyicisiydi; kurulum veya ısınma araması yapmaz. Yaklaşık altı saatlik doğal boşta kalmanın ardından aday aralık fonksiyonunun ilk çağrısı **554 ms toplam / 468,950 ms sunucu** sürdü. Backend 519335, yaşı bir saniyenin altında. Paylaşımlı blok isabeti 6079, **fiziksel okuma sıfır**. 300 örnekten 89'u `active` ve bekleme olayı boş, 211'i bitmiş sorgunun ClientRead beklemesi; örneklerin zaman damgaları sorgunun 460 ms boyunca kesintisiz `active` kaldığını gösteriyor.

Asıl sürümün soğuk ölçümü 571 / 486,752 ms idi. Aday 554 / 468,950 ms. Fark ölçüm gürültüsü sınırındadır; **aday ilk çağrı hedefini karşılamadı ve soğuk maliyeti azaltmadı.** Bu ölçüm hız tekrar kapısına eklendi; kapı altı korunan başarısızlıkla FAIL vermeye devam ediyor (571, 554, 540, 636, 529, 392 ms).

### "Yeni backend" açıklaması çürütüldü

Daha önce yeni backend'in ilk yürütmesi olası neden sayılıyordu. Bunu sınamak için aynı anda açık işlemle tutulan **altı ayrı backend** (PID 519369–519376, yaşları 0,084–0,165 saniye) üzerinde üç kol karşılaştırıldı: A hiç ısınma yok, B yalnız ilişki/katalog dokunuşu, C ucuz bir arama çağrısı. Kolların sırası [B, A, C, C, A, B] olarak dağıtıldı.

| Kol | Isınma | Ölçülen ilk hedef arama (sunucu ms) | Blok isabeti |
|---|---|---:|---:|
| A (kontrol) | yok | 46,789 · 47,094 | 6025 |
| B (ilişki dokunuşu) | 5 sınırlı SELECT | 48,069 · 44,336 | 5664 |
| C (ucuz çağrı) | tek sözcük araması | 40,153 · 40,502 | 5067 |

Ölçüm başına sonuç adedi, sınırlı rol ve savepoint sonrası boş kimlik doğrulandı; toplam 24 işaretli kontrol geçti. **Hiç ısınmayan, bir saniyeden genç altı backend'in ilk araması 40–48 ms sunucu süresi verdi** — kırk dakika önce aynı yaştaki bir backend'in ölçtüğü 469 ms'nin onda biri. Backend'in yeniliği ne gerekli ne yeterli koşuldur; ayrıca ısınma kollarının kazancı ihmal edilebilir düzeydedir. Ayırt edici etken backend değil, **örnek genelindeki uzun boşta kalmadır.** Bu bir eleme sonucudur; nedeni kanıtlamaz.

### Adayın sıcak ortamdaki kontrollü farkı

İki backend üzerinde, sıra yanlılığını iptal etmek için dönüşümlü (backend 0 asıl-önce, backend 1 aday-önce), terim başına on ikişer örnekle karşılaştırıldı:

| Senaryo | Asıl medyan sunucu ms | Aday medyan sunucu ms | Asıl blok | Aday blok |
|---|---:|---:|---:|---:|
| sogut uretim (birlikte yok) | 38,453 | 38,359 | 5230 | 5040 |
| uretim (yaygın) | 2,311 | 2,478 | 290 | 198 |
| 499997 (nadir) | 1,688 | 1,174 | 79 | 20 |
| 499996 (nadir) | 1,197 | 0,915 | 100 | 20 |
| sogut (tek kesin) | 2,288 | 2,383 | 279 | 181 |
| uretim 499999 | 2,305 | 1,354 | 316 | 45 |

Aday blok isabetlerini gerçekten düşürüyor, fakat kazanç **yarım ile bir milisaniye** aralığındadır ve ağır senaryoda hiç yoktur. Tek çağrılık toplam süre 77–117 ms bandında kalıyor; bu bandı ağ turu belirliyor. Aday, 300 ms ilk-istek sorununa dokunmuyor.

### İki kaldıraç aynı planlayıcı hatasını çözüyor

`spike.s12r_words` üzerinde zaten **`s12r_words_pkey` UNIQUE B-tree (word, scope_id)** vardı, boyutu 15.777.792 bayt. Aday indeks `s12r_words_exact_cover` aynı anahtarı kullanıp yalnız `INCLUDE (record_count)` ekliyor ve 15.785.984 bayt tutuyor; yani mevcut birincil anahtarın neredeyse birebir kopyasıdır.

İndeks, aynı işlem içinde düşürülüp sonda `ROLLBACK` ile geri getirilerek (PostgreSQL'de `DROP INDEX` işlemseldir) kalıcı değişiklik yapılmadan ölçüldü. Kimlik işlem yerel kurularak sınırlı rolde alınan plan kanıtı:

| Durum | `word = term` planı | `word >= term AND word <= term` planı |
|---|---|---|
| Kapsayan indeks var | Index Only Scan `s12r_words_exact_cover` | Index Only Scan `s12r_words_exact_cover` |
| Kapsayan indeks yok | Index Scan `s12r_words_gist` (65–109 blok) | Index Scan `s12r_words_pkey` (3–105 blok) |

Buradan çıkan sonuç: kesin eşleşmede trigram GiST seçilmesi tek bir planlayıcı tercihidir ve **iki ayrı yoldan** düzeltilebilir — ya kapsayan indeks eklenerek ya da yalnız aralık koşulu yazılarak. İkincisi **mevcut birincil anahtarı kullanır, yeni indeks gerektirmez.**

İndeks varken ve istatistikler tazeyken asıl fonksiyon adaydan biraz daha hızlıdır (0,669 / 2,172 / 37,827 ms; aday 0,903 / 2,405 / 38,142 ms) ve blok isabetleri eşittir. İndeks yokken aday üstündür (nadir terimde 0,905 ms ve 20 blok, asıl 1,092 ms ve 79 blok). Yani ikisi birlikte kullanılırsa aday hiçbir şey kazandırmaz.

### Kapsayan indeksin yazma maliyeti

Yazmalar açık işlem ve savepoint ile geri alındı, veri değişmedi. 20.000 satırlık işlemlerin medyan sunucu süreleri:

| İşlem | İndeks varken | İndeks yokken | Fark |
|---|---:|---:|---:|
| INSERT 20.000 satır | 1011,316 ms | 937,910 ms | +73,4 ms (~%8) |
| UPDATE 20.000 `record_count` | 1376,084 ms | 952,260 ms | +423,8 ms (~%45) |

Güncelleme farkı büyüktür, çünkü `record_count` indeksin `INCLUDE` sütunudur ve değişmesi HOT güncellemeyi engeller. Ölçüm sırası rastgeleleştirilmedi (önce indeksli kol çalıştı), bu yüzden mutlak değerler değil yön ve büyüklük mertebesi kullanılmalıdır.

**Değerlendirme:** kapsayan indeks 15,05 MiB yer ve güncellemelerde yaklaşık %45 ek maliyet karşılığında sıcak aramada yarım milisaniye kazandırıyor; aynı planlayıcı düzeltmesi bedelsiz aralık koşuluyla da elde edilebiliyor. Ürün tasarımına önerilmez. Kalıcı olarak alınması önerilen tek şey, kesin eşleşmenin sıralama aralığı olarak yazılmasıdır. Bu bir ürün kararı değil, ölçülmüş bir öneridir.

### Fikstüre verilen zarar ve onarımı

Yazma maliyeti ölçümü, geri alınmış olmasına rağmen fiziksel ölü satır bıraktı: `s12r_words` indeksleri GiST 37.289.984 → 57.188.352, pkey 15.777.792 → 17.801.216, aday 15.785.984 → 20.930.560 bayta çıktı. Bu bu oturumun yan etkisidir ve sonraki soğuk ölçümü bozacaktı. `VACUUM (ANALYZE)` ve `REINDEX TABLE spike.s12r_words` ile onarıldı: ölü satır sıfır, satır sayısı 500.411 değişmedi, aday ve pkey **bayt bayt eski boyutlarına** döndü, GiST 37.437.440 bayt olarak yeniden kuruldu (%0,4 fark).

Onarımın ölçülebilir bir yan etkisi vardır ve saklanmaz: `ANALYZE` öncesinde asıl fonksiyon nadir terimde 79 blok (GiST) kullanıyordu, sonrasında 20 blok (kapsayan indeksle index-only). Yani **bu oturumdan önceki bütün ölçümler bayat istatistiklerle alınmıştır.** Tazelenmiş istatistik soğuk 469 ms sorununu değiştirmez: soğuk ölçüm zaten `VACUUM`'dan önce alınmıştı ve sıcak ölçümler her iki durumda da 38 ms bandındadır.

### Sıradaki tanı — soğuk ayrıştırma

Soğuk maliyetin bilinen özellikleri artık şunlardır: sunucu içinde, `active` durumda, görünür bekleme olayı yok, fiziksel okuma yok, bütün aşamalara yayılmış, yeni backend'e bağlı değil, plan veya indeks seçimine bağlı değil, DISCARD PLANS ile yeniden üretilemiyor. Geriye kalan aday açıklamalar örnek düzeyindedir ve arama sorgusuna özgü değildir.

`search12r-cold-triage.mjs` hazırlandı ve **sonraki oturumun ilk veritabanı eylemi** olmalıdır; uzun bir doğal boşta kalma gerektirir. Tek işlemde, artan maliyetli dört probu sırayla ölçer:

| Prob | İçerik | Yavaşsa işaret ettiği |
|---|---|---|
| P0 | `select 1` | bağlantı/backend uyanma maliyeti, sorgu işi yok |
| P1 | `pg_stat_activity` sayımı | sistem kataloğu okuma maliyeti |
| P2 | `generate_series(1..1.000.000)` sayımı | saf CPU; hiç paylaşımlı tampon kullanmaz |
| P3 | `s12r_words` üzerinde seq scan | çok blok, az CPU; host tarafında sayfa hatalanması |
| P4 | asıl `s12r_request_search` | maliyet arama yoluna özgü |

Her prob üç kez çalışır, ilk ve sonraki çalıştırmaların farkı kaydedilir. P4 sonuç adedi, sınırlı rol ve savepoint sonrası kimlik temizliği kontrolleriyle korunur; işlem `ROLLBACK` ile kapanır. Betik kurulum, ısınma, DDL veya reset yapmaz. Hız kapısı bu betiğin P4 sonuçlarını da okuyacak biçimde genişletildi.

Bu ayrım kök nedeni kanıtlamaz, yalnız arama yolu ile örnek düzeyindeki maliyeti birbirinden ayırır. P2 soğukken de yavaşsa sorun sorgu mühendisliğiyle çözülemez ve barındırma/örnek kararına taşınır.

### Veritabanında kalanlar

Sahibin "en uygun gördüğün şekilde" talimatıyla geri alma uygulandı. **`s12r_words_exact_cover` kaldırıldı.** Gerekçe: ürün tasarımında böyle bir indeks yoktur, dolayısıyla onu bırakmak sonraki soğuk ölçümü ürün temel çizgisi yerine reddedilmiş bir yapılandırmada yapmak olurdu. Dokuz kontrol geçti: indeks gitti, `s12r_words_pkey` ve `s12r_words_gist` yerinde, dört fonksiyon yerinde, 500.411 satır değişmedi (`search12r-candidate-rollback-*.json`).

Aday aralık fonksiyonları `spike.s12r_range_search(text)` ve `spike.s12r_range_request(uuid,text)` **bilerek korundu.** İndeks kalkınca aralık yazımı bedelsiz ve ölçülebilir bir kazanca dönüşür — nadir terimde 0,905 ms ve 20 blok, asıl yolda 1,092 ms ve 79 blok; `uretim 499999` örneğinde 1,392 ms ve 143 blok, asıl yolda 2,213 ms ve 301 blok. Bu, ürün tasarımına taşınmayı hak eden tek öneridir ve henüz benimsenmemiştir; 300 ms ilk-istek sorununa etkisi yoktur.

Asıl `spike.s12r_bucket_search(text)` ve `spike.s12r_request_search(uuid,text)`, kaynak GiST ve birincil indeksler, RLS kuralları ve 500.411 sözcük satırı değişmedi. Bu oturumda ürün kodu yazılmadı, bölge taşınmadı, oturum sonlandırılmadı, reset yapılmadı ve hedef gevşetilmedi. TASK-0090/0091 REVIEW, OQ-029 açık.

Kanıt dosyaları dış scratchpad'de: `search12r-range-waits-1789943726422.json`, `search12r-warmup-arms-*.json`, `search12r-ab-warm-*.json`, `search12r-index-cost-*.json`, `search12r-fixture-restore-*.json`, `search12r-poststats-*.json`. Betikler aynı adları taşır. Hız kapısı `search12r-speed-gate.mjs` zaman damgalı soğuk kanıtları da okuyacak biçimde genişletildi ve FAIL veriyor.

## Soğuk ayrıştırma sonucu — maliyet sorguda değil, veri sayfalarının ilk dokunuşunda · 2026-09-21

`search12r-cold-triage.mjs`, veritabanına son dokunuştan (02:22) yaklaşık **on saat** sonra, 12:47'de, başka hiçbir sorgudan önce çalıştı. Backend 566139, yaşı 2,4 saniye. On kontrolün tamamı geçti (sonuç adedi, sınırlı rol, savepoint sonrası boş kimlik). Kanıt: `search12r-cold-triage-1789984049320.json`.

| Prob | İçerik | İlk (sunucu ms) | Tekrarlar | Blok isabeti / okuma | Soğuk cezası |
|---|---|---:|---:|---|---|
| P0 | `select 1` | 0,079 | 0,028 · 0,018 | — | yok |
| P1 | `pg_stat_activity` sayımı | 4,441 | 0,108 · 0,095 | — | ihmal edilebilir |
| P2 | `generate_series(1..1.000.000)` | **219,209** | **216,361 · 219,239** | 0 / 0 | **yok** |
| P3 | `s12r_words` seq scan | **517,260** | **58,150 · 58,027** | 2705 / 0, her üç çalıştırmada aynı | **~9 kat** |
| P4 | asıl `s12r_request_search` | 383,094 (462 toplam) | 40,359 · 40,011 | 6166 → 5228 / 0 | ~9 kat |

Bağlantı kurma 527 ms, BEGIN 76 ms sürdü; bunlar sorgu sürelerine dahil değildir.

### Ne gösteriyor

1. **Bağlantı veya backend uyanma maliyeti yok.** `select 1` ilk çağrıda 0,079 ms.
2. **CPU soğukken yavaş değil.** Hiç paylaşımlı tampon kullanmayan saf CPU probu ilk ve sonraki çalıştırmalarda aynı sürede (216–219 ms) bitti. Örneğin işlemcisinin boşta kalma sonrasında kısılması açıklaması çürütüldü.
3. **Ceza, veri sayfalarının ilk dokunuşunda.** Aynı 2705 blok, üç çalıştırmada da PostgreSQL açısından **paylaşımlı tampon isabeti ve sıfır okuma** olarak sayıldı; ama ilk tarama 517 ms, sonrakiler 58 ms sürdü. Ek maliyet 459 ms / 2705 blok ≈ **170 µs/blok**.
4. **Arama, dokunduğu her yeni ilişki için aynı cezayı ödüyor.** P3 `s12r_words`'ü ısıttığı halde P4 ilk çağrıda 383 ms sürdü, çünkü arama başka ilişkilere (eşlemeler, sözcük kümeleri, kaynak tablo, GiST indeksi) de dokunur.

Bu tablo, önceki bütün gözlemlerle tutarlıdır: sorgunun `active` kalıp hiçbir bekleme olayı göstermemesi, fiziksel okumanın sıfır olması, maliyetin bütün aşamalara yayılması, yeni backend'e bağlı olmaması, DISCARD PLANS ile üretilememesi ve örnek sıcakken hiç görülmemesi.

### En olası açıklama — kanıtlanmış değil

PostgreSQL'in kendi paylaşımlı belleğinde olduğunu sandığı sayfaların altındaki bellek, uzun boşta kalmada işletim sistemi veya sanallaştırma katmanı tarafından geri alınıyor (takas alanına yazma veya bellek geri kazanımı). İlk dokunuşta sayfa çekirdek düzeyinde geri getiriliyor; PostgreSQL bunu bir okuma olarak görmez, isabet sayar ve süreç bekleme olayı olmadan `active` görünür. Sayfa başına ~170 µs, bellekteki basit bir sayfa hatasından çok, arkasında depolama olan bir geri getirme maliyetine uyar.

Bu açıklama PostgreSQL içinden **doğrudan gözlenemez**; sunucunun işletim sistemi sayaçlarına erişimimiz yok. Doğrulama yolu: Supabase panelindeki veritabanı bellek ve takas (swap) grafiğinde, boşta kalma sonrasında takas kullanımının yükselip yükselmediğine bakmak.

### OQ-029 için sonucu

Kalan ilk-istek aşımı **sorgu tasarımıyla çözülebilecek bir sorun değildir.** İndeks, plan modu, aralık yazımı veya tek çağrı düzeni bu cezayı değiştirmez; ölçümler bunu defalarca gösterdi. Karşılanması şu seçeneklerden birine bağlıdır ve bu bir **sahip kararıdır**:

- **Sıcak tutma:** arama ilişkilerini belirli aralıklarla hafifçe okuyan bir iş (ör. `pg_prewarm` veya sınırlı tarama). Sayfaların geri alınmasını önleyip önlemediği saatler süren ayrı bir deneyle ölçülmelidir.
- **Örnek boyutu:** daha çok belleği olan bir hesaplama katmanı bellek baskısını ve geri alımı azaltabilir; maliyeti vardır ve barındırma kararına (DEF-008) bağlıdır.
- **Gerçek kullanım örüntüsü:** gün içinde sürekli kullanımda boşta kalma kısa olur; ceza büyük olasılıkla sabahın ilk kullanıcısına düşer. Bu bir gözlem değil, varsayımdır ve hedefi kendiliğinden karşılamaz.

Hedef gevşetilmedi. Hız kapısı bu ölçümü de okur ve yedi korunan başarısızlıkla FAIL verir (392, 529, 540, 554, 571, 636 ve 462 ms). TASK-0090/0091 REVIEW, OQ-029 açık; artık bir teknik tanı değil, bir karar sorusudur.

## Kapanış — sahip kararıyla soğuk başlangıç istisnası · 2026-09-21

Soğuk ayrıştırma sonucunda sahibe dört seçenek sunuldu: sıcak tutma deneyi, daha büyük sunucu, soğuk başlangıç istisnası veya önce Supabase bellek grafiğine bakmak. **Sahip soğuk başlangıç istisnasını seçti (D-248 / CHG-008).**

İstisnanın kapsamı dardır:

- **Kapsanan:** veritabanı örneği boşta kaldıktan sonra veri sayfalarına ilk kez dokunulduğu için 300 ms'yi aşan arama istekleri.
- **Kapsanmayan:** sıcak istekler. Bunlar 300 ms sınırına bağlı kalır; sıcak bir isteğin aşması başarısızlıktır. Ölçülen sıcak seride 18 senaryonun en yavaşı 190 ms.
- **Kanıt:** yedi soğuk gözlem (392, 462, 529, 540, 554, 571, 636 ms) silinmedi; istisna altında ayrıca listelenir. Altısı bir çalıştırmanın boşta kalma sonrası ilk isteğiydi. 392 ms, yeni bağlantı serisinin ikinci isteğiydi ve büyük olasılıkla birinci isteğin dokunmadığı ilişkilere ilk dokunuştu; ayrıştırma her yeni ilişkinin cezayı ayrı ödediğini gösterdi. Tutarlıdır, tek tek kanıtlanmamıştır.
- **Yeniden değerlendirme:** barındırma ve hesaplama katmanı seçildiğinde (DEF-008) soğuk ilk istek o sunucuda yeniden ölçülür.

### Öz inceleme (T1)

Bugünkü bakım (VACUUM/ANALYZE, REINDEX, aday indeksin kaldırılması) sonrasında, yalnız okuyan bir bütünlük kontrolü **19/19** geçti (`search12r-post-maintenance-*.json`): kaynak 500.000 satır; sözcük tablosu 500.411 satır; eşleme, sözcük adetleri ve dizi elemanı toplamları eşit (1.994.801); `s12r_words` üzerinde yalnız GiST ve birincil anahtar; ölü satır yok; üç profilde üç yardımcı tablo da kapsam dışı satır göstermiyor; iki fonksiyon invoker, private ve yalnız `spike_app` tarafından çalıştırılabilir; kapsamsız kullanıcıya sonuç yok, yetkili kullanıcıya var; işlem sonrası kimlik temiz.

İndeks ve istatistik değişiklikleri sorgu sonucunu değiştirmez; bugünkü bütün A/B serilerinde aslı ve aday yol her terimde aynı sonuç sayısını verdi. Kaynak vektörlerden kurulan bağımsız referansla yapılan tam satır karşılaştırması önceki turda (57 + 16 kontrol) geçmişti ve veri değişmediği için tekrar edilmedi.

Hız kapısı yeniden yazılmadı, yeniden sınıflandırıldı: sıcak seri 300 ms'yi aşarsa hâlâ KALIR; soğuk gözlemler istisna altında listelenir. Önceki sürüm `search12r-speed-gate-pre-d248.mjs` olarak korunur. Şu anki sonuç: **PASS**, sıcak en yavaş 190 ms, yedi soğuk gözlem istisnada.

### Sonuç: GEÇTİ (D-248 istisnasıyla)

Doğruluk, yetki ve sıcak hız ölçütleri karşılandı; boşta kalma sonrası ilk istek sahip kararıyla istisnadır. TASK-0090 ve TASK-0091 kapanır; SPIKE-14'ün önündeki engel kalkar. Phase 07 arama adaptörüne taşınanlar: tam eşleşmenin aralık olarak yazılması (bedelsiz, ölçülmüş) ve barındırma kararında soğuk ilk isteğin yeniden ölçülmesi.
