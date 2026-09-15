# ADR-002 — Supabase Cloud, taşınabilir kullanım

## Karar
Veritabanı ve kimlik doğrulama için Supabase Cloud, **AB (Frankfurt)** bölgesinde kullanılır. Kullanım, ileride kendi sunucumuzda self-hosted Supabase'e geçişe engel olmayacak şekilde sınırlanır.

## Bağlam
Sahip hızlı başlangıç ve yönetilen servis tercih etti. Supabase'in resmi agent skill'leri AI destekli geliştirmeyi güçlendirir.

## Problem
Yönetilen servis bağımlılığı ve hassas personel verisinin yurt dışında tutulması (KVKK).

## Alternatifler
1. Supabase Cloud
2. İlk günden self-hosted Supabase
3. Saf PostgreSQL + özel kimlik doğrulama

## Seçilen Çözüm
Seçenek 1, şu taşınabilirlik kurallarıyla:
- Şema, RLS politikaları, fonksiyonlar repo içindeki SQL migration'larla yönetilir (panelden elle değişiklik yapılmaz).
- İş mantığı standart PostgreSQL ve uygulama katmanında yaşar; Supabase'e özgü ürünler (Edge Functions, Realtime, Cron, Queues, Storage) yalnızca port/adapter arkasında ve ADR ile kullanılır.
- Kimlik doğrulama bir auth port'u arkasındadır; çoklu rol, vekâlet ve işlem rolü uygulamanın kendi tablolarındadır.
- Veri erişim yaklaşımı (supabase-js/PostgREST vs doğrudan Postgres istemcisi) Phase 03'te spike sonrası karara bağlanır (OQ-020).
- Ortam başına ayrı Supabase projesi (OQ-012).

## Gerekçe
Hız ve yönetilen yedek/izleme avantajı alınırken, kilitlenme riski kurallarla sınırlanır.

## Avantajlar
Hızlı kurulum, yönetilen Postgres/Auth, resmi AI skill desteği.

## Dezavantajlar
Maliyet planlara bağlı; bazı özellikler self-hosted'da farklı davranabilir.

## Riskler
- RISK-001 KVKK: yalnızca AB bölgesi seçildi, ek alan şifreleme yok (sahip kararı). Gerçek İK verisi öncesi hukuki değerlendirme önerilir (OQ-024).
- RISK-006 sağlayıcı kilitlenmesi.

## Geçiş (Migration) Notları
Self-hosted geçişi DEF-004 olarak kayıtlıdır. Geçiş planı: şema migration'ları + veri dökümü + auth kullanıcı aktarımı + adapter yapılandırması.

## Tarih
2026-09-15

## Durum
Kabul edildi
