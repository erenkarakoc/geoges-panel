# SPIKE-12 — Arama hızının yeniden sınanması

Durum: REVIEW — mimari öneri ve ilk çalıştırma hızı açık · Tarih: 2026-09-20 · Görev: TASK-0091 · Bağlı: TASK-0090, OQ-029, ADR-017, D-239, REQ-NFR-012

## Sonuç

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

## Ürün mimarisine öneri — onay bekliyor

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
