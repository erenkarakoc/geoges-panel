# Doğrulama Denemeleri (Phase 06)

Durum: CONFIRMED (sahip, 2026-09-20) · Son güncelleme: 2026-09-20

Phase 03'te alınan mimari kararların riskli olanları, yapıma başlamadan önce küçük denemelerle sınanır. **Deneme kodu atılır**; ürüne girmez. Her deneme bir soruya "geçti", "kaldı (ve hangi kararı değiştiriyor)" ya da "sahip açıkça vazgeçti" cevabı verir. Rapor: `docs/architecture/spikes/SPIKE-<NN>-<ad>.md`. Görev: TASK-0064.

| ID | Soru | Geçme ölçütü | İlgili karar / risk |
|---|---|---|---|
| SPIKE-01 | Doğrudan PostgreSQL bağlantısı, kullanıcı kimliğini işlem başında yazarak RLS'i doğru çalıştırıyor mu? | Çok rollü, vekâletli ve şantiye kapsamlı bir kullanıcı hiçbir yetkisiz satırı göremiyor; yetki değişimi bir sonraki istekte geçerli | **GEÇTİ 2026-09-20** → `SPIKE-01-rls-correctness.md` · D-238, D-236 |
| SPIKE-02 | Aynı kurulum yeterince hızlı mı? | 100 bin satırlık günlük kayıt ve stok hareketi verisinde liste ve detay sorguları 300 ms altında | **GEÇTİ 2026-09-20** → `SPIKE-02-rls-performance.md` · D-238, RISK-002 |
| SPIKE-03 | Outbox + iş kuyruğu tek sunucuda güvenilir mi? | 10 bin olay sırayla ve tekrarsız işleniyor; kuyruk durdurulup açıldığında hiçbir olay kaybolmuyor veya ikinci kez etki üretmiyor | **GEÇTİ 2026-09-20** → `SPIKE-03-outbox-reliability.md` · D-234 |
| SPIKE-04 | Sürümlü akış tanımı ve yürüyen örnek modeli çalışıyor mu? | Yürüyen bir örnek, akışın yeni sürümü yayımlandıktan sonra kendi sürümüyle bitiyor; çalışma günlüğü iki sürümde de okunabiliyor | **GEÇTİ 2026-09-20** → `SPIKE-04-workflow-versioning.md` · D-235, REQ-WFL-024 |
| SPIKE-05 | Deneme çalıştırması gerçek yürütmeyle aynı yolu izliyor mu? | Aynı kayıtta kuru mod ve gerçek yürütme aynı adım dizisini ve aynı adım sahiplerini üretiyor; kuru modda hiçbir görev, bildirim, kilit veya kayıt oluşmuyor | **GEÇTİ 2026-09-20** → `SPIKE-05-dry-run-parity.md` · D-235, REQ-WFL-025 |
| SPIKE-06 | Geçmişe bakan koşullar süre sınırının altında kalıyor mu? | "Bu şantiyede son 30 günde 3'ten fazla bekleme" tipi koşullar gerçek hacimde 2 saniyenin altında; sınır aşımında akış hata ile duruyor | **GEÇTİ 2026-09-20** → `SPIKE-06-windowed-conditions.md` · D-100, D-235 |
| SPIKE-07 | Kutu-ok şeması COSS/Base UI ile kurulabiliyor mu, kütüphane gerekiyor mu? | 40 adımlı bir akış masaüstünde ve telefonda akıcı; klavyeyle kullanılabiliyor; kütüphane gerekiyorsa lisansı ve boyutu kabul edilebilir | **GEÇTİ 2026-09-20** → `SPIKE-07-flow-canvas.md` · D-224, ADR-009 |
| SPIKE-08 | Kullanıcı tanımlı kayıt türü uçtan uca çalışıyor mu? | Tanım → veri girişi → RLS → arama → rapor → alan emekliye ayırma zinciri tamam; 50 bin kayıtta liste ve süzme 500 ms altında | **GEÇTİ 2026-09-20** → `SPIKE-08-custom-record-types.md` · D-241, RISK-010 |
| SPIKE-09 | R2 imzalı bağlantılar yetki denetimiyle birlikte çalışıyor mu? | Yetkisiz kullanıcı bağlantı üretemiyor; üretilmiş bağlantı süresi dolunca çalışmıyor; 50 MB dosya sahadaki bağlantıda inebiliyor | ADR-003 |
| SPIKE-10 | Sunucuda üretilen PDF basılabilir kalitede mi? | Teklif belgesi ve resmî günlük rapor Türkçe karakterlerle, tablo düzeni bozulmadan, A4'te doğru çıkıyor | **İNCELEMEDE: görsel doğrulama eksik, 2026-09-20** → `SPIKE-10-pdf-quality.md` |
| SPIKE-11 | TCMB kuru her iş günü güvenilir alınıyor mu? | Kur alınamadığında `exchange_rate.missing` çıkıyor, tutarlar "kur bekliyor" işaretleniyor, ertesi gün kendiliğinden tamamlanıyor | **İNCELEMEDE: kesinti/iyileşme testi eksik, 2026-09-20** → `SPIKE-11-tcmb-exchange-rate.md` |
| SPIKE-12 | PostgreSQL araması Türkçe için yeterli mi? | "sogut" → "Söğüt", "hakedis" → "hakediş" buluyor; yetkisiz kayıt sonuca hiç girmiyor; 500 bin arama satırında 300 ms altında | **İNCELEMEDE 2026-09-20:** D-247 model onaylı; tek çağrıda 360 ölçüm en çok 190 ms, ilk isteklerde 392/529/636 ms; yeni backend doğrulamasında 540 ms toplam / 465 ms sunucu → `SPIKE-12-search-retry.md`. İlk başarısızlık: `SPIKE-12-turkish-search.md` · TASK-0091, OQ-029, ADR-017, REQ-NFR-012 |
| SPIKE-13 | Canlı sinyal kanalı sahada dayanıyor mu? | Zayıf bağlantıda kanal koptuğunda ekran sessizce yeniden bağlanıyor; sinyal kaybolduğunda sayfa yenilemesi doğru sayıyı getiriyor; kanal veri taşımıyor | D-240 |
| SPIKE-14 | Okuma modeli sıfırdan yeniden kurulabiliyor mu? | Bir yıllık olaydan rapor modelleri yeniden kuruluyor, sonuç kaynak kayıtlarla birebir; süre kabul edilebilir; yeniden kurma bildirim ve görev üretmiyor | D-233, D-234 |
| SPIKE-15 | Sahadan fotoğraf yükleme zayıf bağlantıda çalışıyor mu? | Telefondan çekilen fotoğraf küçültülüp yükleniyor; bağlantı kesilip döndüğünde yükleme kaldığı yerden tamamlanıyor; günlük kayıt bu sırada kaybolmuyor | REQ-SIT-020, REQ-NFR-015 |
| SPIKE-16 | Taranmış belgede metin tanıma panelin kendi altyapısında yapılabiliyor mu? | Tipik bir irsaliye ve tartım fişi okunabiliyor; olmuyorsa belge dışarı gönderilmeden önce sahibe sorulacak karar noktası açılır | REQ-DOC-004 |

## Sıra

Önce mimarinin taşıyıcıları: SPIKE-01, 02, 03. Sonra motor: 04, 05, 06. Sonra veri ve arayüz riskleri: 08, 07, 12, 14. Kalanlar bağımsızdır ve paralel yürüyebilir.

2026-09-20: D-247 ile model onaylandı; TASK-0091 tek çağrılı aramada ilerledi ama ilk istek aşımları nedeniyle açık. Backend başlangıcı doğrulandı (540/465 ms toplam/sunucu); ayrı yeni backend profili hızlıydı, kök neden henüz kanıtlanmadı. Eşdeğer profil 432/354 ms gecikmeyi birden çok adımda yakaladı; plan modu çözüm olmadı. Sonraki iş doğal ilk yavaş çağrıda bekleme örnekleme, sonra SPIKE-14. Sekiz deneme tamamlandı; hedef gevşetilmedi (OQ-029).

## Kural

Bir deneme "kaldı" derse ilgili karar Phase 03'e geri döner; ADR veya karar güncellenir, sonra yapıma geçilir. Denemesi yapılmamış riskli bir karar üzerine dilim inşa edilmez (`ai/PROJECT_RULES.md`).
