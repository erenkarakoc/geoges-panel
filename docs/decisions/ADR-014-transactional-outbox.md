# ADR-014 — Modüller arası iletişim: işlemsel outbox

## Karar
Modüller birbirine olaylarla tepki verir. Her olay, onu doğuran veri değişikliğiyle **aynı veritabanı işleminde** `outbox` tablosuna yazılır; ayrı bir işleyici aboneleri çalıştırır. Teslim "en az bir kez"dir; sıra kayıt bazında korunur; tekrarı zararsız kılmak abonenin görevidir.

## Bağlam
Modüler monolitte (ADR-001) bir modül başka modülün tablosuna erişemez. Onaylanan bir günlük saha kaydı stoğa, hakedişe, puantaja ve performansa akmak zorundadır (REQ-SIT-032).

## Problem
Kayıt yazılıp olay yayımlanamazsa veri sessizce ayrışır: "kayıt onaylandı ama stok düşmedi". Kayıt geri alınıp olay yayımlanmışsa tersi olur. İkisi de REQ-NFR-001'i çiğner.

## Alternatifler
1. Doğrudan modül çağrısı (senkron zincir)
2. Kayıt sonrası olay yayımlama, aynı işlemin dışında
3. Dış mesaj kuyruğu
4. İşlemsel outbox

## Seçilen Çözüm
Seçenek 4. Ayrıntı: `docs/architecture/EVENT_BACKBONE.md` (D-234). Başarısız teslim artan aralıklarla yeniden denenir; beş denemeden sonra ölü mektuba düşer ve sahip katmanına kritik bildirim çıkar. Olay yükleri yalnız genişler; kırıcı değişiklik yeni sürüm kodudur.

## Gerekçe
Tek veritabanı işlemiyle tutarlılık garanti edilir; ek altyapı kurulmaz; olaylar kalıcı olduğu için okuma modelleri yeniden kurulabilir (D-233).

## Avantajlar
Kayıp olay yok; tek sunucuda çalışır; yeniden oynatılabilir; bir abonenin hatası diğerini durdurmaz.

## Dezavantajlar
İşleyici gecikirse tepkiler gecikir; her abonenin tekrarsızlığı kendi sorumluluğundadır.

## Riskler
Kuyruk durursa olaylar birikir; 15 dakikayı aşan gecikme sahip katmanına bildirilir. Yük artarsa işleyici ayrı sürece taşınır. Doğrulama: SPIKE-03.

## Geçiş (Migration) Notları
Outbox satırları silinmez (D-231). Dış kuyruğa geçilecekse yalnız outbox okuyucusu değişir, üreticiler değişmez.

## Tarih
2026-09-20

## Durum
Kabul edildi

## Phase 06 doğrulaması (2026-09-20)

SPIKE-03'te ilk seçim yalnız `SKIP LOCKED` kullandığı için kayıt sırasını korumadı. Düzeltilmiş denemede aynı kaydın önceki teslimi bitmeden sonraki olay seçilmiyor; teslim ve etki aynı işlemde yazılıyor. Kaynak/olay geri alma, işlem ortasında süreç kapanması, üç işleyiciyle 10.000 sıralı olay ve 500 tekrarda sıfır ek etki doğrulandı. Kararın teslim garantisi değişmedi. Ürün işleyicisi bu negatif testleri de taşımalı. Ayrıntı ve sınırlar: `docs/architecture/spikes/SPIKE-03-outbox-reliability.md` (TASK-0084).
