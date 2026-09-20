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
Tek veri kaynağı; tutarlı yetki; ek işletme maliyeti yok. Türkçe harf duyarsızlığı, sorgu ve indekslenen metne aynı açık normalleştirmeyi uygulayarak sağlanır; trigram ayrıca yazım yakınlığı içindir.

## Dezavantajlar
Eş anlam sözlüğü ve gelişmiş ağırlıklandırma sınırlı; çok büyük hacimde yavaşlar.

## Riskler
Hacim büyürse arama yavaşlar. SPIKE-12'de RLS altındaki sorgular olumlu örneklerde hızlı olsa da boş sonuçlarda GIN indekslerini kullanmadı ve 300 ms hedefini aştı. Teknik düzen TASK-0091 ile yeniden doğrulanacak; çözüm doğrulanmadan arama ürün koduna taşınmaz. Başka motora geçiş kararı alınmadı.

## SPIKE-12 bulgusu — 2026-09-20

500.000 satırda 36 doğruluk/bütünlük kontrolü geçti; boş tam metin ve benzerlik aramalarında p95 398 ve 2.846 ms ölçüldü. Denenen birleşik alternatif sorunu çözmedi. RLS veya hedef süre değiştirilmedi. D-239'un PostgreSQL yönü korunuyor; bu ADR'nin mevcut sorgu/indeks varsayımı tekrar incelemede. Ayrıntı: `docs/architecture/spikes/SPIKE-12-turkish-search.md`; açık konu OQ-029.

## Geçiş (Migration) Notları
Arama satırı modeli korunarak dış motora aktarılabilir; kaynak veri her zaman modüllerdedir.

## Tarih
2026-09-20

## Durum
YENİDEN İNCELEMEDE — SPIKE-12 hız ölçütünden kaldı; TASK-0091 doğrulaması bekleniyor. Önceki sahip onayı D-239 korunur, teknik yeterlilik henüz kanıtlanmadı.
