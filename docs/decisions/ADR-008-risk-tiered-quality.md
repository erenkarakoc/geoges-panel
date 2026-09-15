# ADR-008 — Riske göre kademeli kalite süreci ve öz-inceleme

## Karar
Definition of Done ve inceleme yoğunluğu görev risk kademesine göre uygulanır (T1 kritik, T2 standart, T3 hafif). Ayrı bir inceleme ajanı kullanılmaz; kodu yazan model uygulamadan sonra ayrı ve belgeli bir öz-inceleme adımı yürütür.

## Bağlam
Protokol her görevde tam süreç ve bağımsız inceleme öneriyordu. Sahip tek kişidir ve yazılımcı değildir.

## Problem
Her küçük değişiklikte tam süreç tempoyu düşürür; kritik işlerde hafif süreç ise veri ve güvenlik riski yaratır.

## Alternatifler
1. Her görevde tam süreç + bağımsız ajan
2. Riske göre kademeli süreç + öz-inceleme
3. Minimal süreç

## Seçilen Çözüm
Seçenek 2. Kademeler ve kontrol listeleri: `docs/standards/QUALITY_GATES.md`. T1 işlerde iş kuralları sahip onayından geçer ve otomatik testler zorunludur.

## Gerekçe
Emek riskin olduğu yere yoğunlaşır.

## Avantajlar
Hız ve güvenlik dengesi.

## Dezavantajlar
Öz-inceleme, bağımsız incelemeye göre kör nokta bırakabilir.

## Riskler
Kademenin yanlış seçilmesi; kural: kararsızsa üst kademe.

## Geçiş (Migration) Notları
İleride kritik alanlarda bağımsız inceleme gerekirse bu ADR'ın yerini alan bir ADR yazılır.

## Tarih
2026-09-15

## Durum
Kabul edildi
