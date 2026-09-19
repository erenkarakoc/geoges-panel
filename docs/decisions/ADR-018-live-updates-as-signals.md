# ADR-018 — Canlı güncelleme: veri değil sinyal

## Karar
Canlı güncelleme yalnız onay sayacı, bildirim sayacı ve onay kuyruğu içindir. Tarayıcıya tek yönlü bir akışla (SSE) yalnız "şu değişti" sinyali gider; veriyi ekran, kullanıcının kendi yetkisiyle çeker. Supabase Realtime kullanılmaz.

## Bağlam
Koordinatör onay ekranındayken yeni kayıt gelebilir; sahibin "Dikkat" sayacı güncel olmalı. Sahip, canlı güncellemenin sayaç ve kuyrukla sınırlı kalmasını seçti (D-232).

## Problem
Veritabanı değişikliklerini doğrudan yayımlamak, yetki süzmesini kanalın içine taşır. Kanal yanlış süzerse veri sızar; ayrıca sağlayıcıya bağlanılır (ADR-002).

## Alternatifler
1. Supabase Realtime (veritabanı değişikliklerini yayımla)
2. Kendi sinyal kanalımız (SSE), veri taşımadan
3. Belirli aralıklarla yoklama
4. Canlı güncelleme yok

## Seçilen Çözüm
Seçenek 2 (D-240). Sinyaller outbox işleyicisinden çıkar; kullanıcı, olay gerçekten işlendikten sonra haberdar olur.

## Gerekçe
Yetki tek yerde kalır; sahada veri kullanımı düşük; sağlayıcıdan bağımsız.

## Avantajlar
Sızma yüzeyi yok; ucuz; bağlantı koparsa ekran sessizce yeniden bağlanır.

## Dezavantajlar
Ekran, sinyalden sonra ikinci bir istek yapar; her şey canlı değildir.

## Riskler
Zayıf bağlantıda sinyal kaybı. Önlem: sayfa yenilemesi her zaman doğru sayıyı getirir. Doğrulama: SPIKE-13.

## Geçiş (Migration) Notları
Kanal genişletilecekse yeni sinyal türü eklenir; "veri taşımaz" kuralı değişmez.

## Tarih
2026-09-20

## Durum
Kabul edildi
