# ADR-010 — İngilizce teknik isimlendirme

## Karar
Kod, veritabanı, API, event, ortam değişkeni, depolama anahtarı, log, test ve altyapı isimleri İngilizcedir. Veritabanı `snake_case`, TypeScript ekosistem kuralları. Kullanıcı arayüzü Türkçedir. Domain terimleri `docs/domain/GLOSSARY.md`'den gelir.

## Bağlam
Önceki kod Türkçe ve karışık isimlendirme kullanıyordu; farklı AI modelleri ve geliştiriciler arasında devir hedefleniyor.

## Problem
Karışık dilde isimlendirme okunabilirliği, arama ve araç desteğini bozar.

## Alternatifler
1. Tamamen İngilizce teknik isimler
2. Türkçe teknik isimler
3. Karışık

## Seçilen Çözüm
Seçenek 1. Ayrıntılar: `docs/standards/NAMING_CONVENTIONS.md`.

## Gerekçe
Sektör standardı, AI ve kütüphane uyumu, devredilebilirlik.

## Avantajlar
Tutarlılık, araç desteği.

## Dezavantajlar
Sektörel Türkçe terimlerin (hakediş, zayi, fire) doğru karşılığı için sözlük emeği.

## Riskler
Yanlış terim seçimi; önlem: isimlendirme karar süreci ve sahip onayı (OQ-007).

## Geçiş (Migration) Notları
Yeni proje olduğu için mevcut isim yok.

## Tarih
2026-09-15

## Durum
Kabul edildi
