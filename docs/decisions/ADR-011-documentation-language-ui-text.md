# ADR-011 — Doküman dili ve arayüz metinleri

## Karar
- `/ai` klasörü ve `AGENTS.md` İngilizce yazılır (AI modelleri ve devir için).
- `/docs` klasörü Türkçe yazılır; teknik tanımlayıcılar İngilizce kalır.
- Arayüz metinleri yalnızca Türkçedir ve bileşenlerin içinde yazılır; i18n/çeviri altyapısı kurulmaz.

## Bağlam
Sahip gereksinim ve karar dokümanlarını okuyup onaylayacak; AI durum dosyaları farklı modeller arasında devredilecek. Uygulama tek dilli kullanılacak.

## Problem
Tek dil seçimi ya sahibin okumasını ya da AI devrini zorlaştırır; erken i18n ise gereksiz karmaşıklık yaratır.

## Alternatifler
1. Tamamen Türkçe dokümanlar
2. Tamamen İngilizce dokümanlar
3. Karma (seçilen)
- UI metinleri için: merkezi mesaj dosyası / TR+EN i18n / bileşen içinde (seçilen)

## Seçilen Çözüm
Karma doküman dili; UI metinleri bileşen içinde Türkçe.

## Gerekçe
Sahip onay dokümanlarını anadilinde okur; AI protokol dosyaları standart dilde kalır. Tek dilli uygulamada çeviri altyapısı aşırı mühendisliktir.

## Avantajlar
Okunabilirlik, sadelik, hız.

## Dezavantajlar
İleride ikinci dil gerekirse metinlerin bileşenlerden çıkarılması gerekir; aynı metnin farklı ekranlarda tutarsız yazılma riski.

## Riskler
Metin tutarsızlığı; önlem: UI tutarlılık incelemesi ve internal durumların tek eşleme fonksiyonuyla Türkçeye çevrilmesi.

## Geçiş (Migration) Notları
Çok dil ihtiyacı doğarsa CHG kaydıyla i18n altyapısı eklenir ve metinler anahtarlara taşınır.

## Tarih
2026-09-15

## Durum
Kabul edildi
