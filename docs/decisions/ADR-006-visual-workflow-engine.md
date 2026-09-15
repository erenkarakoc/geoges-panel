# ADR-006 — Görsel iş akışı motoru ve tasarımcısı

## Karar
Onay zincirleri, eskalasyonlar, tetikleyiciler ve bağımlılık kilitleri merkezi bir iş akışı motorunda çalışır ve yetkili kullanıcılar tarafından **görsel tasarımcıyla** tanımlanır. Tasarımcı ilk sürüm kapsamındadır.

## Bağlam
Mimari md "iş akışı motoru bütün modüllerin üzerinde olmalı" ve "kurallar merkezi tanımlanmalı" diyor. Sahip süreçleri kendisinin şekillendirebilmesini istiyor.

## Problem
Görsel tasarımcı çekirdeğin parçası olur; serbest bırakılırsa güvenlik, test ve hata ayıklama yönetilemez hale gelir.

## Alternatifler
1. Sınırlı tipli kural modeli (editörsüz)
2. Görsel tasarımcı, sabit düğüm paleti
3. Görsel tasarımcı + özel kod/script düğümü
4. Kodda sabit akışlar

## Seçilen Çözüm
Seçenek 2:
- **Sabit düğüm paleti:** başlangıç/olay, onay, görev, koşul, süre/bekleme, bildirim, eskalasyon, paralel dal, birleşme, alt akış, kilit, bitiş. Özel kod düğümü yoktur.
- Koşullar tipli ve sınırlı ifadelerle yazılır (ör. tutar > eşik, tür = değer, rol = X).
- **Sürümleme:** akış tanımları sürümlüdür; devam eden süreçler başladıkları sürümle tamamlanır.
- **Yayın öncesi test çalıştırması** örnek veriyle zorunludur; yayın yetkisi yalnızca yetkili rollerdedir; yayınlar audit'e yazılır.
- Motor ve tanım modeli önce kurulur; görsel editör aynı tanım modelinin (JSON) üzerine oturur.
- Varsayılan şirket akışları hazır şablon olarak gelir.

## Gerekçe
Sahibin süreçleri kendisi yönetebilmesi sağlanırken, sınırlı palet sayesinde her akış test edilebilir ve güvenli kalır.

## Avantajlar
Kod değişikliği olmadan süreç değişikliği; tüm modüllerde tek onay mantığı.

## Dezavantajlar
Yüksek geliştirme ve test yükü; tüm modüller bu motora bağımlı olur.

## Riskler
RISK-005: motorun gecikmesi tüm slice'ları etkiler. Önlemler: Phase 06 doğrulama spike'ı, Phase 08'de motorun slice'lardan önce tamamlanması.

## Geçiş (Migration) Notları
Tanım modeli JSON şemasıyla sürümlenir; şema değişiklikleri eski tanımları dönüştüren migration ile yapılır.

## Tarih
2026-09-15

## Durum
Kabul edildi (ayrıntılı tasarım Phase 03)
