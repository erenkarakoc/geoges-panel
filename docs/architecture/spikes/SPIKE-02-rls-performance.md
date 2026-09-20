# SPIKE-02 — RLS ile veri erişim hızı

Durum: GEÇTİ (ölçülen yerel bağlantı ve sorgular için) · Tarih: 2026-09-20 · Görev: TASK-0083 · İlgili: D-238, ADR-015

## Ölçüt ve yöntem

100 binin üzerinde günlük kayıt ve stok hareketinde liste ve detay sorguları 300 ms altında kalmalı. Gerçek deneme verisi: 114.977 günlük kayıt, 115.015 stok hareketi. Kullanıcı kapsamı RLS ile süzülüyor; sorgular mevcut Supabase bağlantısına yerel bilgisayardan gönderiliyor. Yalnız geçici `spike` şeması kullanıldı.

## İlk deneme ve düzeltme

İlk düzen beş ayrı ağ gidiş dönüşü yapıyordu: işlem başlatma, rol, kimlik, sorgu, bitirme. İlk ölçümde liste/detay yaklaşık 400 ms, derin sayfalama yaklaşık 1,4 saniyeydi; **ilk düzen hedefi karşılamadı**.

Kapsam fonksiyonları sorgu başına hesaplanacak biçimde düzenlendi ve tarih/kimlik indeksi eklendi. Önceki ölçümlerde sunucu yürütme süresi 0,2–6,8 ms aralığına indi. Politika ve indeks birlikte değiştirildiği için kazanım yalnız birine atfedilemez. Beş ağ turuyla toplam süre yine yaklaşık 365 ms kaldı. Önceki tek tur denemesi sabit test değerleriyle SQL birleştirmişti; ürün için kullanıcı girdisi birleştirme örneği değildir.

Son doğrulamada üç tur kullanıldı: `BEGIN` + yerel rol + yalnız biçimi doğrulanmış test UUID'siyle yerel kimlik; **parametreli** veri sorgusu; `COMMIT`. Gerçek veri sorgusunun parametreleri metne birleştirilmedi. Her sorguda iki ısınma ve 20 ölçüm; p95 en yakın sıra yöntemiyle 19. ölçümdür. Süre işlem başlangıcından commit yanıtına kadardır, ilk bağlantı/TLS kurulumu dahil değildir.

| Sorgu | Gelen satır | p50 | p95 | En yavaş |
|---|---|---|---|---|
| Yetkili şantiyenin son günlük kayıtları | 50 | 238 ms | 239 ms | 239 ms |
| Yetkili günlük kaydın detayı | 1 | 238 ms | 240 ms | 241 ms |
| Yetkili şantiyenin stok hareketleri | 50 | 238 ms | 239 ms | 239 ms |

## Sonuç ve öz inceleme

Ölçülen liste/detay yolları, kimlik ve işlem maliyeti dahil hedefi geçti. Politika değişikliklerinden sonra güvenlik ayrıca 12 kontrolle sınandı (SPIKE-01). Ürün veri katmanı sorguları parametreli tutmalı, yerel kimliği aynı bağlantıdaki işlem içinde kurmalı ve hata durumunda işlemi geri almalıdır.

Bu ölçüm 50–150 eşzamanlı kullanıcının yük testi değildir; soğuk bağlantı ve internet dalgalanması dahil değildir. Beş tur yapan önceki uygulama hâlâ hedefin üstündedir. Phase 07 veri erişim adaptöründe aynı güvenlik ve toplam süre ölçümü tekrar aranır. Üretim sertifikası ve sınırlı giriş rolü SPIKE-01'de açıkça belirtilmiştir. Mimari hedef değiştirilmedi.
