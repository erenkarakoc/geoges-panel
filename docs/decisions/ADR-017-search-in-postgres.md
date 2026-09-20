# ADR-017 — Arama PostgreSQL içinde kalır

## Karar
Site içi arama, ayrı bir arama motoru kurulmadan PostgreSQL'in tam metin araması ve benzerlik eklentisiyle (`pg_trgm`) yapılır. Aranabilir her kayıt için, kapsam sütunlarını taşıyan bir arama satırı tutulur ve olaylarla güncellenir.

## Bağlam
Panelde üst bardan ve kısayoldan açılan site geneli arama var (REQ-NFR-012, D-044); sonuçlar yetkiye ve veri sınıfına göre süzülmek zorunda.

## Problem
Ayrı bir arama motoru yetki süzmesini ikinci bir yere kopyalar ve işletilecek ikinci bir sistem doğurur. Kopya süzme, "yetkisiz kayıt sonuçta hiç görünmez" kuralını kırılgan hale getirir.

## Alternatifler
1. Dış arama motoru (Elasticsearch, Meilisearch, Typesense)
2. PostgreSQL tam metin araması + trigram
3. Yalnız `LIKE` sorguları

## Seçilen Çözüm
Seçenek 2 (D-239). Ayrıntı: `docs/architecture/PORTS_AND_SERVICES.md` bölüm 3. Ticari ve hassas alanlar arama vektörüne hiç girmez; belge içeriği arşivin kendi aramasındadır (D-227).

## Gerekçe
Yetki süzmesi RLS ile aynı yerde kalır; işletilecek tek sistem; şirket ölçeğinde yeterli.

## Avantajlar
Tek veri kaynağı; tutarlı yetki; ayrı arama hizmeti işletilmez. İndekslerin disk, yazma ve bakım maliyeti vardır. Türkçe harf duyarsızlığı, sorgu ve indekslenen metne aynı açık normalleştirmeyi uygulayarak sağlanır; trigram ayrıca yazım yakınlığı içindir.

## Dezavantajlar
Eş anlam sözlüğü ve gelişmiş ağırlıklandırma sınırlı; çok büyük hacimde yavaşlar.

## Riskler
Hacim büyürse arama yavaşlar. İlk SPIKE-12 düzeni RLS altında boş sonuçlarda GIN indekslerini kullanmadı ve 300 ms hedefini aştı. TASK-0091'in yardımcı veri modeli sıcak sorgularda hedefi sağladı; model D-247 ile onaylandı, ilk çalıştırma hızı açık. Çözüm doğrulanmadan arama ürün koduna taşınmaz. Başka motora geçiş kararı alınmadı.

## SPIKE-12 bulgusu — 2026-09-20

500.000 satırda 36 doğruluk/bütünlük kontrolü geçti; boş tam metin ve benzerlik aramalarında p95 398 ve 2.846 ms ölçüldü. Denenen birleşik alternatif sorunu çözmedi. RLS veya hedef süre değiştirilmedi. D-239'un PostgreSQL yönü korunuyor; bu ADR'nin mevcut sorgu/indeks varsayımı tekrar incelemede. Ayrıntı: `docs/architecture/spikes/SPIKE-12-turkish-search.md`; açık konu OQ-029.

## Geçiş (Migration) Notları

### D-247 / CHG-007 — onaylanan ek, 2026-09-20

Üç kapsam korumalı yardımcı tablo, sözcük/kayıt eşlemelerini ve kayıt dizilerini tutar; intarray kesişimi çok sözcüklü sorguyu daraltır. 500.000 kayıtta 73 kontrol geçti; 18 sıcak senaryoda p95 220–258 ms. İlk çalıştırmalarda 461/371 ms görüldü. Ek tablo ve indeksler yaklaşık 481 MiB; btree_gist ve intarray ek bağımlılıkları kabul edildi. RUM denendi, elendi ve kaldırıldı.

Onaylanan davranışta bütün sorgu sözcükleri aynı kayıtta bulunur; yalnız yetkili sözlükte aynen bulunmayan sözcüklere yazım yakınlığı uygulanır. Ürün UUID/kapsam modeline uyarlama, atomik güncelleme, yeniden kurma, ilk sorgu ve eşzamanlılık doğrulaması tamamlanmadan ürün kabulü yapılamaz. Ayrıntılı etki analizi: `docs/architecture/spikes/SPIKE-12-search-retry.md`; sahibin devam talimatıyla D-247 kaydedildi. Phase 04 tablosu üç yardımcıyla 215 tabloya genişletildi. OQ-029 yalnız kalan hız doğrulaması için açıktır.

### İstek yürütme doğrulaması

Kimliği kurup aramayı tek parametreli çağrıda çalıştıran SECURITY INVOKER deney sarmalayıcısı, örtük PostgreSQL işlemiyle üç ağ turunu bire indirdi. 360 ölçümün en yavaşı 190 ms; yeni bağlantılarda 392 ms ve sonraki tanıda 529 ms ilk istek görüldü (ikincisinde 445 ms sunucu çalışması). Bu nedenle teknik kapanış halen açık. Ek 19 istek/güvenlik kontrolü, başarı/hata/iptal sonrası kimlik temizliğini doğruladı; yanlış başlangıç rolü varsayan test düzeltildi. Üründe gerçek sınırlı giriş rolü zorunludur; havuzda SET ROLE durumunun bağlantılar arasında kendiliğinden sıfırlandığı varsayılmaz.

### Mevcut geçiş yönü

Arama satırı modeli korunarak dış motora aktarılabilir; kaynak veri her zaman modüllerdedir.

## Tarih
2026-09-20

## Durum
YENİDEN İNCELEMEDE — TASK-0091 sıcak sorgu ölçütünü sağladı; yardımcı model/sözcük davranışı D-247 ile onaylı, ilk istek hızı doğrulanıyor. D-239 korunur; SPIKE-12 tamamlandı sayılmaz.
