# SPIKE-12 — Türkçe arama

Durum: KALDI — hız ölçütü sağlanmadı · Tarih: 2026-09-20 · Görev: TASK-0090 · İlgili: ADR-017, D-239, REQ-NFR-012

## Deneme planı

500 bin sentetik arama satırı üzerinde Türkçe/ASCII eşleşmesi, yazım yakınlığı, RLS ile sonuç ve sayım güvenliği sınanır. İzin değişikliği sonraki istekte geçerli olmalı; hassas ve ticari içerik arama metnine alınmamalı. Arama ve sorgu aynı açık harf dönüşümünü kullanır; trigram bunu kendiliğinden yapıyor sayılmaz.

Yalnız geçici s12_ tabloları ve yardımcıları, sınırlı spike_app rolü kullanılır. Gerekirse pg_trgm standart extensions şemasına eklenir; mevcut ürün verisine dokunulmaz, reset yapılmaz. Kod repository dışındaki scratchpad'dedir. Ürün kodu veya arayüz yazılmaz.

İki ısınma sonrası 20 ölçümde, açık bağlantı üzerinde işlem başlangıcı/yerel kullanıcı kimliği, parametreli sorgu ve işlem sonu birlikte ölçülür. Hedef 300 ms altı; p95 ve en yavaş örnek ayrı raporlanır. Sorgu planı incelenir. İlk bağlantı, HTTP/UI ve eşzamanlı kullanıcı yükü kapsam dışıdır. Önceki bağlantı yardımcısının TLS sertifika doğrulama istisnası üretime taşınmaz.

Öz inceleme önceden bilinen örnek dağılımıyla yapılır; eksikler gizlenmez. Sonuç, mimaride gerekli açıklamalar ve ai kayıtları tam commit kapısından sonra main'e kaydedilip push edilir.

## Sonuç

Türkçe eşleşme ve sınanan yetki davranışları doğru; **500 bin satırda 300 ms hız şartı sağlanmadı**. TASK-0090 tamamlandı sayılmaz. ADR-017'nin teknik çözümü yeniden incelemede; D-239'un PostgreSQL yönü, RLS ve mevcut kabul ölçütü değiştirilmedi. Sonraki görev TASK-0091, açık mimari konu OQ-029. Bu sonuç genel olarak PostgreSQL ile hedefin imkânsız olduğunu değil, sınanan sorgu/politika/indeks birleşiminin yetersiz olduğunu gösterir.

## Düzenek ve doğruluk

PostgreSQL 17.6; 100 kapsam × 5.000 kayıt = 500.000 arama satırı, beş sentetik kayıt grubu. Yalnız bir kapsamı gören kişi, tüm kapsamları gören kişi ve izinsiz kişi kullanıldı. Bütün kullanıcı sorguları RLS'e tabi spike_app rolündedir. Tam yetkili veritabanı rolüyle yapılan tek sorgu planı karşılaştırması kullanıcı performans sonucu değildir.

30 ana kontrol ve ayrı betikte altı bütünlük kontrolü geçti:

- sogut/SÖĞÜT → Söğüt; hakedis/HAKEDİŞ → hakediş; igdir isci olcumu → IĞDIR İŞÇİ ÖLÇÜMÜ; cinar gunluk → Çınar günlük. Ayrı Unicode işaretleriyle yazılmış Söğüt de bulundu. hakedsi yazım hatası benzerlik aramasında hakediş kaydını buldu.
- İndekslenecek metin ve sorgu NFC normalleştirme, Türkçe harf dönüşümü ve küçük harfe çevirme uygular. SQL ile JavaScript dönüşümü üç örnekte aynı sonucu verdi. Mevcut ürün kabuğundaki yardımcı NFC uygulamıyor; bu denemede ürün dosyası değiştirilmedi. Ürün adaptöründe aynı normalleştirme sözleşmesi ayrıca kurulmalıdır.
- Yabancı kapsama özel sözcük normal aramada, benzerlik aramasında ve sonuç sayımında görünmedi; yabancı kayıt kimliği sıfır satır verdi. Aynı sözcük tüm kapsamları gören kişide bulundu. Dar kapsam 5.000 kayıt gördü; bu kapsamda Söğüt içeren kayıt sayısı bağımsız hesapla 48 olarak doğrulandı.
- Kimliği olmayan ve yetkisiz kişi sıfır kayıt gördü. Kendine kapsam izni ekleme ve arama tablosunu değiştirme 42501 ile reddedildi. Yetki kaldırılınca sonraki istekte sonuç kayboldu; izin geri verildiğinde döndü. İşlem sonrasında yerel kimlik temizlendi.
- Parametreye SQL benzeri metin yazmak sorgu yapısını değiştirmedi. Sentetik ücret, sağlık ve ticari açıklama alanlarını dışarıda bırakan yalnız başlık projeksiyonu üç gizli işaret sözcüğünü aramaya taşımadı. Bu, bütün modüllerin veri sınıflandırmasının denetlendiği anlamına gelmez.
- Beş grupta, grup başına beş yetkili sonuç ve sıralama doğrulandı. **Bu gruplu/sıralamalı sorgunun hız ölçümü yapılmadı**; aşağıdaki ölçümler tek düz sonuç listesine aittir. Tam arama ekranı teslim edilmedi.

## Hız ölçümleri

Her sorguda iki ısınma + 20 örnek. Açık bağlantıda BEGIN + sınırlı rol ve yerel kimlik kurulumu, parametreli SELECT ve COMMIT: üç ağ gidiş-dönüşü dahildir. p50 sıralı örneklerin 10'uncusu, p95 19'uncusudur. Sonuç listesi kimliğe göre sıralı, en fazla 25 satırdır. İlk bağlantı, HTTP, UI ve eşzamanlı yük dahil değildir.

| Sorgu | Yetki | p50 | p95 | En yavaş |
|---|---|---|---|---|
| sogut — tam metin | 1 kapsam | 219 ms | 220 ms | 220 ms |
| sogut — tam metin | 100 kapsam | 219 ms | 220 ms | 220 ms |
| uretim — yaygın sözcük | 100 kapsam | 218 ms | 219 ms | 219 ms |
| hakedsi — benzerlik | 100 kapsam | 224 ms | 225 ms | 225 ms |
| bulunmayanxyz — tam metin | 1 kapsam | 327 ms | 337 ms | 338 ms |
| bulunmayanxyz — tam metin | 100 kapsam | 397 ms | 398 ms | 398 ms |
| bulunmayanxyz — benzerlik | 100 kapsam | 1.833 ms | 2.846 ms | 3.181 ms |

Hızlı olumlu örnekler listenin başında yeterli eşleşme buluyor. Boş sonuçlar tüm tablo taramasını açığa çıkardı; sadece olumlu örneklerle geçme kararı verilemez. Benzerlik ölçümlerindeki dalgalanmanın nedeni ayrıca ayrıştırılmadı; bütün örnekleri rapora dahil ettik.

## Sorgu planı ve denenen düzeltme

GIN tam metin ve trigram indeksleri ile kapsam/kimlik B-tree indeksi kuruldu, ANALYZE çalıştırıldı. İlk sıralı boş arama planı 500.000 satır eledi ve sunucuda yaklaşık 1.320 ms sürdü; bu tek başlangıç gözlemidir, yukarıdaki 20 örnek dağılımıyla karıştırılmaz.

Sıralamayı kaldırmak çözmedi: RLS altında boş tam metin sorgusu sıralı tablo taramasıyla yaklaşık 231 ms, boş benzerlik sorgusu 1.557 ms **sunucu süresi** verdi. Aynı sorgular tam yetkili rolle GIN indekslerini kullandı. Veritabanı kataloğunda ilgili tam metin ve benzerlik işlevleri leakproof değildi. Bu bulgular RLS güvenlik sırasının bu düzende indeks kullanılmasını engellediği yorumunu destekliyor. PostgreSQL'in [RLS değerlendirme kuralı](https://www.postgresql.org/docs/17/ddl-rowsecurity.html) ve [pg_trgm belgeleri](https://www.postgresql.org/docs/17/pgtrgm.html) esas alındı.

Arama koşulunu kapsam koşuluyla aynı RLS politikasına taşıyan alternatif de denendi. Tek tam metin koşulu GIN kullandı; fakat tam metin/benzerlik yolları birlikte ve parametreli, yetki yükseltmeyen bir yardımcıyla kurulunca boş aramada tarama geri geldi. Birleşik benzerlik planı yaklaşık 2.010 ms sunucu süresiydi. Bu alternatif kabul edilmedi; ilk kapsam politikası geri kondu ve ek yardımcı kaldırıldı. RLS kapatılmadı, uygulama rolüne BYPASSRLS verilmedi, işlevler keyfî olarak leakproof işaretlenmedi.

## Sonraki doğrulama ve sınırlar

TASK-0091, önce PostgreSQL ve RLS içinde sorgu/indeks düzenini yeniden tasarlayıp aynı negatif örnekleri tekrarlayacak. Boş/seyrek/yaygın sonuç, yazım hatası, dar/geniş yetki, grup başına en iyi beş sonuç ve peş peşe farklı sorgular birlikte ele alınmalı. Yetkisiz sözcükleri dışarı sızdıran ortak öneri sözlüğü çözüm kabul edilmez. Başka motora geçiş, yetki modelini değiştirme veya süreyi gevşetme yapılmış bir karar değildir.

Bu deneme tam IAM, modül/tür bazında bütün izinler, olaylarla arama güncelleme, belge içeriği, kök bulma, eş anlamlılar ve eşzamanlı yükü doğrulamaz. Yetki filtreleri kapsam düzeyinde sentetiktir. TLS sertifika doğrulaması kapalı önceki yardımcı kullanıldı; üretimde doğrulanmış TLS gerekir.

pg_trgm, extensions şemasına eklendi; diğer yeni nesneler spike içinde s12_ öneklidir. 500.000 sentetik satır ve ilk kapsam politikası korunmuştur. Ürün tabloları ve kaynak kodu değişmedi. Scratchpad/spikes kanıtları: search12-setup.mjs, search12-probe.mjs, search12-review-plan.mjs, search12.mjs, search12-evidence.json, search12-policy-probe.mjs, search12-policy.mjs, search12-final-review.mjs. Kurulum mevcut tabloları reddeder; ana ölçüm ilk politikayı bekler; alternatif betikler körlemesine yeniden çalıştırılmaz. Son bağımsız inceleme RLS'i, rol sınırını, örnek sayısını, geri konan izni, 48 eşleşmeyi ve işlem kimliğinin temizliğini doğruladı.
