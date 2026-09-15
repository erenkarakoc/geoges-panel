# ADR-003 — Cloudflare R2, depolama port'u arkasında

## Karar
Belge, fotoğraf ve üretilen dosyaların ana depolaması Cloudflare R2'dir; uygulama R2'ye yalnızca `StorageProvider` port'u üzerinden erişir.

## Bağlam
Panel Drive arşivinin yerini alacak; saha fotoğrafları, kantar fişleri, sözleşmeler, bordrolar yüksek hacim oluşturacak.

## Problem
Dosya depolamanın uygulamaya sıkı bağlanması ileride sağlayıcı değişikliğini zorlaştırır.

## Alternatifler
1. Cloudflare R2
2. Supabase Storage
3. VPS diski / MinIO

## Seçilen Çözüm
R2 + port. Port sözleşmesi (taslak): `upload`, `download`, `delete`, `exists`, `getSignedUrl`. Dosyaya erişim yetkisi her zaman uygulama tarafında kaydın yetkisine göre kontrol edilir; imzalı URL'ler kısa ömürlüdür; bucket'lar public değildir. Belge meta verisi ve sürümleri veritabanındadır.

## Gerekçe
Düşük depolama ve çıkış maliyeti, S3 uyumluluğu.

## Avantajlar
Maliyet, dayanıklılık, S3 uyumlu API sayesinde kolay değişim.

## Dezavantajlar
Dosyalar harici serviste; yedekleme ve erişim politikaları ayrıca yönetilmeli.

## Riskler
Yanlış yapılandırılmış erişim; önlem: public erişim kapalı, imzalı URL, audit.

## Geçiş (Migration) Notları
Adapter değiştirilerek S3, MinIO, Supabase Storage veya Google Cloud Storage'a geçilebilir.

## Tarih
2026-09-15

## Durum
Kabul edildi
