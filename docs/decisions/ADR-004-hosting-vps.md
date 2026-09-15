# ADR-004 — Uygulama barındırma: kendi VPS'imiz

## Karar
Next.js uygulaması kendi VPS altyapımızda Docker ile çalışır. Google Cloud Run yalnızca ağır işler (PDF/doküman işleme, CPU yoğun görevler, bağımsız worker) gerekirse kullanılır.

## Bağlam
Şirket bir VDS satın aldı; ana uygulamanın kontrolü şirkette olmalı.

## Problem
Barındırma, deploy, rollback ve izleme sorumluluğu ekipte.

## Alternatifler
1. VPS + Docker
2. Vercel
3. Cloud Run (ana uygulama)

## Seçilen Çözüm
VPS + Docker + reverse proxy + SSL; CI/CD ile deploy ve otomatik rollback. Ayrıntılar Phase 05.

## Gerekçe
Maliyet kontrolü ve bağımsızlık; mevcut VDS'in kullanılması.

## Avantajlar
Kontrol, öngörülebilir maliyet.

## Dezavantajlar
Operasyon yükü (güncelleme, izleme, yedek).

## Riskler
Tek sunucu arızası; önlem Phase 05'te RTO/RPO ve geri dönüş planı.

## Geçiş (Migration) Notları
Container tabanlı olduğu için başka sağlayıcıya taşınabilir. Cloud Run kullanımı DEF-005.

## Tarih
2026-09-15

## Durum
Kabul edildi
