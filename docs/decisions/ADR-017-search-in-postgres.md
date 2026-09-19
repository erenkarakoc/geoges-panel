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
Tek veri kaynağı; tutarlı yetki; ek işletme maliyeti yok; Türkçe yazım yakınlığı trigram ile çözülür.

## Dezavantajlar
Eş anlam sözlüğü ve gelişmiş ağırlıklandırma sınırlı; çok büyük hacimde yavaşlar.

## Riskler
Hacim büyürse arama yavaşlar. Doğrulama: SPIKE-12. Geçiş bir adaptör değişimidir.

## Geçiş (Migration) Notları
Arama satırı modeli korunarak dış motora aktarılabilir; kaynak veri her zaman modüllerdedir.

## Tarih
2026-09-20

## Durum
Kabul edildi (SPIKE-12 ile doğrulanacak)
