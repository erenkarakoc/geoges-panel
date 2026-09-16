# ADR-009 — Arayüz: yalnızca COSS UI + Tailwind CSS

## Karar
Arayüz bileşenleri yalnızca COSS UI (Base UI tabanlı) ile, stiller Tailwind CSS ile yapılır. Özgün (custom) element ancak sahibin açık onayıyla oluşturulur. devl.dev yalnızca ilham kaynağıdır.

## Bağlam
Önceki denemelerde tasarım dili parçalandı. Sahip tutarlı, profesyonel ve tek kaynaklı bir tasarım sistemi istiyor.

## Problem
Farklı kaynaklardan bileşen almak tutarsızlık ve bakım yükü doğurur.

## Alternatifler
1. COSS UI + Tailwind, özgün element onaya bağlı
2. COSS + serbest özgün bileşenler
3. shadcn/ui veya başka kütüphane

## Seçilen Çözüm
Seçenek 1. Kurallar: `docs/ui-ux/DESIGN_SYSTEM_RULES.md`. Ek (D-042, 2026-09-15): gelişmiş bileşenlerde COSS Origin örnekleri öncelikli ilham kaynağıdır; Origin Radix tabanlı olduğundan kodu kopyalanmaz, COSS UI ve Particles ile yeniden kurulur. Resmi `coss` ve `coss-particles` skill'leri UI görevlerinde kullanılır; `ui-ux-pro-max` bu projede kapatılır.

## Gerekçe
Tek tasarım otoritesi, AI'ın tahmin yerine resmi bileşen bilgisini kullanması.

## Avantajlar
Tutarlılık, erişilebilir Base UI temeli, kopyala-sahiplen modeliyle kaynak koda sahiplik.

## Dezavantajlar
COSS'ta olmayan ihtiyaçlar (ör. görsel akış editörü tuvali) için onay süreci gerekir.

## Riskler
Görsel iş akışı editörü gibi özel ihtiyaçlar; Phase 02'de onaya sunulacak özgün element listesi hazırlanır.

## Geçiş (Migration) Notları
Bileşenler proje kompozisyon katmanında sarmalandığından kütüphane değişikliğinin etkisi sınırlıdır.

## Tarih
2026-09-15

## Durum
Kabul edildi
