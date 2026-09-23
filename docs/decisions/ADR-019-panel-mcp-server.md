# ADR-019 — Panel MCP sunucusu: yeni veri kapısı değil, ikinci kanal

## Karar
Bitmiş ürün için, panelin içinde çalışan bir MCP sunucusu kurulur (`/api/mcp`). Sunucunun kendi yetkisi yoktur: her çağrı, soruyu soran kullanıcının kimliğiyle `runAsUser` üzerinden aynı RLS yolundan geçer ve o kişinin ekranda görebildiğinin tam olarak aynısını görür. Yeni bir veri kapısı değil, mevcut yetki sisteminin ikinci kanalıdır. Yapımı modüllerden ve raporlardan sonradır (Faz 15M); araç yüzeyi, aramadaki `src/records` deseninin aynısıyla her modülün kendi kaydından toplanır.

## Bağlam
Sahip, panelin bitmiş hâlinde yönetimin sorularını konuşma diliyle sorabilmek istiyor. REQ-NFR-004 zaten yönetimin 26 sorusunun panelden cevaplanmasını istiyor; MCP bunun konuşma diliyle sorulan hâlidir. Sahip 2026-09-23'te iki soruyu cevapladı: veri bulut bir modele çıkabilir ve kapı, kullanıcının kendi yetkisi dahilinde her şeye açıktır (D-267).

## Problem
Konuşma kanalı, panelin dışındaki bir modele veri taşır. Bu iki yerleşik kararla çakışır: D-195 / REQ-INT-002 "öneri üretmek için veri panel dışına çıkmaz, yapay zekâ modeli kullanılmaz" der; `docs/security/README.md` RISK-001 "geliştirme, test ve AI oturumlarında gerçek kişisel veri kullanılmaz" der. Ayrıca yetkili bir kullanıcının belirteci (token) pratikte o kullanıcının tüm görüş alanı demektir; imzalı depolama bağlantısı ise kendi başına bir erişim anahtarıdır.

## Alternatifler
1. MCP yok; yönetim soruları yalnız panel ekranlarından cevaplanır (D-195 olduğu gibi kalır)
2. Yalnız kendi sunucumuzdaki yerel modele açık bir kanal (veri şirket dışına çıkmaz)
3. Panelin içinde, kullanıcı yetkisiyle çalışan MCP sunucusu; bulut model dahil (sahip cevabı)
4. Dış modele veri kopyalayan ayrı bir okuma deposu

## Seçilen Çözüm
Seçenek 3 (D-267). Kanal panelin içindedir, kendi yetkisi yoktur, `iam.my_grants()` ve `iam.my_data_classes()` olduğu gibi geçerlidir; yetkisiz veri "yok" gibi davranır, aramada olduğu gibi. Seçenek 4 reddedildi: ikinci bir veri deposu, yetki süzmesini kanalın içine taşır (ADR-018'in reddettiği hata). Seçenek 2 ileride açık kalır: yerel modele geçmek bu mimaride yalnız bağlanılan modelin değişmesidir.

## Gerekçe
Yetki tek yerde kalır. Kanal genişledikçe yeni izin kuralı yazılmaz; modül kendi araçlarını kaydeder, izin kapısı aynıdır. Öneri üretimi kuralla kalmaya devam eder, yani D-195'in özü korunur: makine karar vermez, insan işlemiyle başlar (REQ-INT-004).

## Avantajlar
Tek yetki kapısı; modüller bittikçe yüzey kendiliğinden büyür; panelin dışında ikinci bir kopya yoktur; her okuma denetim kaydına düşer.

## Dezavantajlar
Veri dış modele çıkar; belirteç, sahibinin tüm görüş alanı kadar değerlidir; cevaplar özet olmak zorundadır, çünkü tek soruyla tüm veritabanını çekmek istenmez.

## Riskler
- **Yurt dışına aktarım (KVKK m. 9):** bulut model Türkiye ve AB dışındadır; personel verisi kanaldan geçerse aktarım kapsamına girer. OQ-035, OQ-024'e bağlı olarak açık.
- **Belirteç kaybı:** süreli ve iptal edilebilir belirteç, her okumanın denetim kaydı ve olağandışı okuma hacmi için kritik uyarı (REQ-NFR-005) zorunludur.
- **İmzalı bağlantı sızması:** imzalı R2 bağlantısı MCP'den asla dönmez; yalnız belge üstverisi ve panel içi adres döner, içerik istenirse sunucu çözüp metin verir.
- **İstem enjeksiyonu:** panele girilmiş metin (tedarikçi notu, açıklama) dış modelde veri olarak işlenir, komut olarak değil.

## Geçiş (Migration) Notları
Yapımdan önce üç kayıt düzeltilmelidir: REQ-INT-002'nin yasağı öneri üretimine daraltılır, RISK-001'in cümlesi geliştirme oturumları için kalır ve ürün kanalı ayrı madde olur, yeni bir izin (`int.mcp.use`) izin matrisine girer. Yazma yüzeyi D-268 ile sınırlıdır ve sahibin onayını bekler. Yerel modele geçilecek olursa bu mimari değişmez.

## Tarih
2026-09-23

## Durum
Önerildi
