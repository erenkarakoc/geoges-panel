# ADR-001 — Zorunlu sınırlı modüler monolit

## Karar
Uygulama tek bir Next.js uygulaması içinde, sınırları araçla denetlenen modüllerden oluşan bir modüler monolit olarak kurulur.

## Bağlam
Şirket süreçleri birbirine sıkı bağlıdır (saha → stok → hakediş → finans → performans). Tek geliştirme ekibi ve tek şirket vardır. Mimari md "tek sistem içinde sınırları çok net modüller" diyor.

## Problem
Mikroservisler bu ölçekte gereksiz operasyon yükü getirir; sınırsız bir monolit ise zamanla değiştirilemez hale gelir.

## Alternatifler
1. Mikroservisler
2. Sınırları belirsiz klasik monolit
3. Sınırları zorunlu modüler monolit

## Seçilen Çözüm
Seçenek 3. Modül kodları `docs/architecture/MODULE_MAP.md`. Kurallar:
- Modül başka modülün tablolarına doğrudan okuma/yazma yapmaz; açık uygulama arayüzü veya olay kullanır.
- Modül içi katmanlar: `ui → application → domain → data access → infrastructure`.
- Sınırlar lint/mimari testleriyle CI'da denetlenir.

## Gerekçe
Tek deploy ve tek veritabanı operasyonel sadelik sağlar; sınırlar ise modülün bağımsız değişmesini ve ileride ayrıştırılmasını mümkün kılar.

## Avantajlar
Basit deploy, işlem (transaction) tutarlılığı, düşük maliyet, ayrıştırılabilirlik.

## Dezavantajlar
Sınır disiplini araç ve inceleme gerektirir; raporlama gibi çapraz okumalar için açık okuma modelleri tasarlanmalıdır.

## Riskler
Sınır ihlallerinin "geçici" kabul edilmesi. Önlem: CI'da kırılan kural.

## Geçiş (Migration) Notları
Bildirim, PDF üretimi, analiz gibi modüller olay tabanlı iletişim sayesinde ileride ayrı worker'lara taşınabilir.

## Tarih
2026-09-15

## Durum
Kabul edildi
