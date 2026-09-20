# SPIKE-05 — Etkisiz deneme ile gerçek yürütmenin eşliği

Durum: GEÇTİ (sınanan dört yol) · Tarih: 2026-09-20 · Görev: TASK-0087 · İlgili: D-235, REQ-WFL-025

Plan: `docs/architecture/spikes/SPIKE-04-06-plan.md`. Gerçek ve kuru yürütme aynı geçiş değerlendiricisini kullandı. Değerlendirici sıradaki adımı, sorumluyu, koşul sonucunu ve yapılacak etkileri döndürdü. Yalnız gerçek yürütme bu etkileri yazan adaptörü çağırdı. Kuru mod gerçek PostgreSQL bağlantısında salt okunur işlem kullandı.

## On kontrolün sonucu

| Senaryo | Adım sayısı | Yol ve sorumlular eşit | Kuru modda kalıcı değişiklik |
|---|---|---|---|
| Onay | 7 | Evet | Yok |
| Ret | 3 | Evet | Yok |
| Düzeltmeye gönderme, sonra onay | 9 | Evet | Yok |
| Koşul sağlanmıyor | 2 | Evet | Yok |

Bu dört senaryoda öncesi/sonrası karşılaştırmasıyla sekiz kontrol yapıldı. Örnekler, etkiler, kaynak kayıtlar, tanımlar ve etkin sürüm bilgisi karşılaştırıldı; geçmiş satır sayısı da aynı kaldı. Koşullar bellekte sabitlenmiş bir yanıt yerine veritabanından okundu.

İki ek kontrol: salt okunur işlemde kasıtlı kayıt değiştirme girişimi PostgreSQL `25006` koduyla reddedildi; gerçek adaptör görev, bildirim, kilit ve kayıt türlerinin dördü için de etki satırları üretti. Bunlar geçici deney etki tablosundadır; gerçek görev, bildirim gönderimi veya defter hareketi değildir.

## Öz inceleme ve sınırlar

Eşlik testi tek başına iki modun aynı yanlışı yapmasını yakalayamaz. Bu nedenle ayrı inceleme, beş referans senaryodaki altı tamamlanmış örneğin yol ve sahiplerini sabit beklenen listelerle karşılaştırdı; 13 kontrol geçti (SPIKE-04 ile ortak).

Sorumlular sentetik kaynak kaydındaki koordinatör, yönetici ve hazırlayan ilişkilerinden çözüldü; gerçek IAM vekâlet/yetki servisi kurulmadı. Onay yanıtları ve görev tamamlama olayları deney girdileriyle temsil edildi. Aynı tanım, kaynak veri ve kararlar altında eşlik doğrulandı; canlı verinin iki çalışma arasında değişmesiyle aynı yolun korunacağı vaat edilmez.

14 düğümün tamamı, paralel birleşmeler, alt akışlar ve bir taslak oluşturma adımının varsayımsal çıktısını sonraki koşulda kullanma bu denemede yoktur. Bunlar Phase 08 kabul testlerinde ayrıca sınanmalıdır. Deneme sırasında iş etkisi adaptörünü hiç çağırmamak ve veritabanı yazmasını ayrıca engellemek, ürün motorunda korunacak iki ayrı güvencedir. Salt okunur işlem dış servise yapılan çağrıyı engellemez; o güvence adaptör sınırındadır.

Kaynak: [PostgreSQL salt okunur işlemler](https://www.postgresql.org/docs/17/sql-set-transaction.html).
