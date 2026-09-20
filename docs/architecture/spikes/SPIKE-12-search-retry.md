# SPIKE-12 — Arama hızının yeniden sınanması

Durum: REVIEW — D-247 model onaylı; yeni bağlantı ilk istek hızı açık · Tarih: 2026-09-20 · Görev: TASK-0091 · Bağlı: TASK-0090, OQ-029, ADR-017, D-239, REQ-NFR-012

## Güncel sonuç — D-247 sonrası

Model ve sözcük davranışı onaylandı; CHG-007 ile tasarım kayıtlarına katlandı. Tek çağrılı düzenin 18 senaryosunda, ön ısınma olmadan 20’şer ölçümün en yavaşı 190 ms. Önceki 73 kontrole ek 14 istek ve 5 güvenlik kontrolü geçti. Ancak 12 yeni bağlantının ilk isteklerinden biri 392 ms sürdü; sonraki aynı-istek tanısında 529 ms toplamın 445 ms’si sunucuda ölçüldü. Hız kapısı her iki başarısızlığı korur; SPIKE-12 REVIEW kalır. Son bölüm güncel kanıttır; aşağıdaki üç turlu ölçümler tarihsel karşılaştırmadır.

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
