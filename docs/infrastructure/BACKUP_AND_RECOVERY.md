# Yedekleme ve Felaket Kurtarma

Durum: TASLAK · Son güncelleme: 2026-09-20

Veri kaybına ve uzun kesintiye karşı plan. Hedefler gereksinimden gelir: **en çok 1 saatlik veri kaybı (RPO ≤ 1 saat)** ve **en çok 4 saatlik kesinti (RTO ≤ 4 saat)** (REQ-NFR-018, REQ-NFR-019). Görev: TASK-0077. İlgili: `docs/infrastructure/ENVIRONMENTS.md`, D-231 (hiçbir kayıt zamanla silinmez).

## 1. Neyi koruyoruz

| Varlık | Nerede | Kaybı ne demek |
|---|---|---|
| Veritabanı | Supabase (PostgreSQL) | Bütün iş kaydı: günlük kayıtlar, hakedişler, stok, yetkiler |
| Dosyalar | Cloudflare R2 | Fotoğraflar, tartım fişleri, sözleşmeler, imzalı belgeler |
| Yapılandırma | Veritabanı + `config:export` dosyası | Akışlar, kataloglar, kurallar, roller (D-246) |
| Sırlar | `.env.local`, sağlayıcı panelleri | Erişim kaybı; veri kaybı değil |
| Kod ve göçler | Git + GitHub | Uygulamanın kendisi |

Kod ve göçler zaten iki yerde (yerel + GitHub). Asıl risk veritabanı ve dosyalardır.

## 2. Bugünkü düzen (yerel dönem)

| Ne | Sıklık | Nerede durur | Saklama |
|---|---|---|---|
| Supabase otomatik yedeği | Günlük | Supabase | Planın verdiği süre |
| Elle tam döküm (`pg_dump`) | Haftada bir **ve her göçten önce** | Geliştirme makinesi + harici disk | Son 8 döküm |
| Yapılandırma dışa aktarımı | Her önemli akış değişikliğinden sonra | Git'e bağlı olmayan bir klasör | Son 5 sürüm |
| R2 sürümleme | Sürekli | R2 | Silinen dosya 30 gün geri alınabilir |

Bu dönemde veri örnek veridir; kayıp tahammül edilebilir. Yine de göç öncesi döküm zorunludur: hatalı bir göç, üzerinde çalıştığınız yapılandırmayı bozabilir.

## 3. Gerçek veriden önce zorunlu olanlar

Aşağıdakiler tamamlanmadan panele gerçek şirket verisi girilmez (Phase 19 kapısı, REQ-NFR-019):

1. **Sunucudan ve Supabase'den ayrı bir yerde yedek** (OQ-013, DEF-008): günlük otomatik kopya, en az 30 gün saklama.
2. **Saatlik yedekleme** veya sürekli arşivleme: RPO ≤ 1 saat bunsuz sağlanamaz.
3. **Geri dönüş tatbikatı:** boş bir ortama tam geri dönüş yapılır, süresi ölçülür ve yazılır. 4 saatin altında kalmalı.
4. **Dosya yedeği:** R2 kovasının ikinci bir bölgeye veya sağlayıcıya kopyası.
5. **Sır kurtarma:** anahtarların nerede tutulduğu ve kimin erişebildiği yazılı olmalı.

## 4. Senaryolar ve karşılıkları

| Senaryo | Etki | Yapılacak | Hedef süre |
|---|---|---|---|
| Yanlış göç şemayı bozdu | Panel açılmıyor | Göç öncesi dökümden geri dön, göçü düzelt, tekrar uygula | 1 saat |
| Bir kayıt yanlışlıkla iptal edildi | Tek kayıt | Panelde kayıt silinmez; iptal geri alınır ve denetime yazılır (REQ-AUD-002) | Dakikalar |
| Veritabanı bozuldu / silindi | Tüm veri | Son yedekten geri dön; kayıp pencere son yedekten bu yana | 4 saat (RTO) |
| Supabase erişilemez | Panel çalışmıyor | Sağlayıcı durumu izlenir; uzarsa yedekten başka bir PostgreSQL'e dönülür (ADR-002 taşınabilirlik) | Sağlayıcıya bağlı |
| R2 erişilemez | Belgeler açılmıyor | Panel çalışmaya devam eder; belge görüntüleme "geçici olarak kullanılamıyor" der | — |
| Sunucu çöktü (canlı dönemde) | Panel yok | Yeni sunucuya dağıtım + veritabanı zaten ayrı | 4 saat |
| Anahtar sızdı | Yetkisiz erişim riski | Anahtarı iptal et, yenile, oturumları düşür, denetim kaydını incele | 1 saat |
| Kuyruk durdu | Olaylar işlenmiyor | Olaylar outbox'ta birikir; kuyruk yeniden başlatılır, sıradan işlenir (ADR-014) | 1 saat |

## 5. Kurtarma sonrası zorunlu adımlar

1. Okuma modelleri yeniden kurulur ve kaynak kayıtlarla karşılaştırılır (D-233).
2. Outbox'ta bekleyen olaylar işlenir; ölü mektup listesi boşaltılır.
3. Kayıp pencereye düşen veriler kullanıcılara bildirilir: hangi tarih aralığının yeniden girilmesi gerektiği açıkça yazılır.
4. Olay, nedeni ve süresiyle birlikte `docs/infrastructure/` altına bir olay raporu olarak yazılır.

## 6. Sorumluluk

Yerel dönemde yedekleme geliştirme tarafındadır. Canlıya geçince yedeğin alındığını ve geri dönüşün denendiğini doğrulamak **sahibin görebildiği bir kontrol** olur: son yedek zamanı ve son tatbikat tarihi Yönetim sayfasında görünür. Görünmeyen yedek, olmayan yedektir.
