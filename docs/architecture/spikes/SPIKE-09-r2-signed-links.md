# SPIKE-09 — R2 imzalı bağlantılar ve yetki denetimi

Durum: GEÇTİ · Tarih: 2026-09-21 · Görev: TASK-0094 · Bağlı: ADR-003, `docs/architecture/PORTS_AND_SERVICES.md`, RISK-001

**Soru.** Cloudflare R2 imzalı bağlantıları uygulamanın yetki denetimiyle birlikte çalışıyor mu? Geçme ölçütü: yetkisiz kullanıcı bağlantı üretemiyor; üretilmiş bağlantı süresi dolunca çalışmıyor; 50 MB dosya sahadaki bağlantıda inebiliyor.

**Uyulan kurallar (ADR-003).** Dosyaya erişim yetkisi her zaman uygulamada, kaydın yetkisine göre denetlenir; imzalı bağlantılar kısa ömürlüdür; kova herkese açık değildir.

## Yöntem

Deney kodu geçicidir (`spike09.mjs`), ürüne girmedi. R2 kovası `geoges-panel`, erişim anahtarı yalnız bu kovada nesne okuma/yazma yetkili. İmzalama resmi AWS S3 SDK'sıyla (3.1136.0) yapıldı; paket yalnız geçici klasöre kuruldu.

- **Bağlantı servisi:** belge kaydını kullanıcının kendi kimliği ve RLS kapsamıyla okur; kaydı göremiyorsa bağlantı üretmez, görebiliyorsa sunucu tarafında imzalar. Anahtarlar hiçbir zaman tarayıcıya gitmez.
- **Veritabanı:** belge meta verisi ve yetki tablosu, hiç commit edilmeyen tek bir işlem içinde kuruldu ve sonda geri alındı; veritabanında iz kalmadı.
- **Saha bağlantısı taklidi:** indirme istemci tarafında 512 KB/sn (~4 Mbit/sn) ile kısıldı ve 20 MB'ta bilerek kesildi.
- **Güvenlik:** imzalı bağlantılar erişim anahtarı kimliğini içerdiği için hiçbir bağlantı ekrana veya kanıt dosyasına yazılmadı; yalnız durum kodları kaydedildi.

## Sonuçlar — 17/17 kontrol geçti

| # | Kontrol | Sonuç |
|---|---|---|
| H1 | 50 MB nesne yüklendi, boyut doğru | 4,5 sn |
| Y1 | Yetkili kullanıcı kendi şantiyesinin belgesi için bağlantı alır | alındı |
| Y2 | Aynı kullanıcı başka şantiyenin belgesi için bağlantı alamaz | reddedildi |
| Y3 | Kapsamı olmayan kullanıcı ve kimliksiz istek bağlantı alamaz | reddedildi |
| E1 | İmzasız nesne isteği | 400 |
| E2 | İmzasız kova listeleme | 400 |
| E3 | İmzalı bağlantıda nesne adı değiştirilirse (başka belgeye atlama) | 403 |
| E4 | Bağlantının süresi elle uzatılırsa | 403 |
| S1 | 5 sn ömürlü bağlantı hemen çalışır | 200 |
| S2 | Aynı bağlantı süresi dolunca | 403 `ExpiredRequest` |
| B1 | 50 MB dosya eksiksiz iner (sha256 eşit) | 1,3 sn, ~330 Mbit/sn |
| B2 | Türkçe dosya adı indirme başlığında korunur | `Şantiye fotoğrafı.bin` (RFC 5987) |
| F1 | Bağlantının süresi yavaş indirmenin ortasında doldu, süren indirme kesilmedi | 20 sn bağlantı, 40 sn indirme |
| F2 | Kopan indirme süresi dolmuş eski bağlantıyla sürdürülemez | 403 |
| F3 | Yeni bağlantı ve Range isteğiyle kaldığı yerden sürdü, dosya eksiksiz | 206, sha256 eşit |
| F4 | Sürdürme için istenen yeni bağlantı da yetki denetiminden geçer | yetkisiz kullanıcı alamadı |
| T1 | Deney nesneleri R2'den silindi, veritabanında tablo kalmadı | temiz |

## Tasarım için önemli bulgu

**Bağlantının ömrü indirmenin süresini kapsamak zorunda değildir; yalnız başlamasını kapsaması yeterlidir.** R2 süreyi isteğin başında denetler: başlamış bir indirme bağlantı süresi dolduktan sonra da tamamlanır. Buna karşılık kopan bir indirme aynı bağlantıyla sürdürülemez; sürdürmek için uygulamadan yeni bağlantı istenir ve bu istek yeniden yetki denetiminden geçer.

Sonucu şudur: bağlantı ömrü kısa tutulabilir (dakikalar mertebesinde), yavaş saha bağlantısı bunu gerektirmez. Kesilen büyük indirmeler için istemci, kaldığı bayttan yeni bağlantıyla devam etmelidir. Tarayıcının kendi "devam ettir" düğmesi aynı bağlantıyı kullandığı için süre dolduktan sonra çalışmaz. Kullanıcı yeniden indir dediğinde yeni ve denetlenmiş bir bağlantı alır. Kesin bağlantı ömrü bir ürün ayarıdır ve bu raporla belirlenmedi.

## Sınırlar

1. Saha bağlantısı istemci tarafında kısılarak taklit edildi; gerçek mobil ağ, gecikme ve paket kaybı sınanmadı.
2. Tam indirme sahibin bağlantısında ölçüldü (~330 Mbit/sn); saha hızını temsil etmez.
3. Kovanın `r2.dev` herkese açık adresi ve özel alan adı S3 API'siyle sınanamaz. Kova ayarlarında "Public access"ın kapalı olduğu panelden doğrulanmalıdır.
4. Tarayıcıdan doğrudan yükleme (CORS, çok parçalı yükleme) bu deneyin kapsamında değil; SPIKE-15'e aittir.
5. **KVKK notu:** kova AB yargı bölgesinde oluşturulmamış (uç nokta adresinde `.eu.` yok). Deney sentetik veriyle yapıldı. Gerçek personel belgeleri ve bordrolar yüklenmeden önce AB yargı bölgeli bir kova kullanılıp kullanılmayacağı, RISK-001 kapsamında karar verilmesi gereken bir konudur. Yargı bölgesi kova oluşturulurken seçilir, sonradan değiştirilemez.

## Phase 07'ye taşınanlar

1. `StorageProvider.getSignedUrl`, imzalamadan önce kaydı çağıranın kimliği ve kapsamıyla okur; göremediği kayıt için bağlantı üretmez.
2. Bağlantı ömrü kısa tutulur; sürdürme her zaman yeni ve denetlenmiş bağlantıyla yapılır.
3. İndirme başlığında Türkçe dosya adı RFC 5987 biçimiyle verilir.
4. R2 anahtarları yalnız sunucu tarafında, `R2_` önekli ortam değişkenlerindedir (`.env.example`).
5. İmzalı bağlantılar günlüklere yazılmaz; yalnız durum ve belge kimliği yazılır.

Kanıt: dış scratchpad'de `spike09-evidence-1789988439694.json`.
