# SPIKE-06 — Geçmiş koşullarının hızı ve süre sınırı

Durum: GEÇTİ (ölçülen sorgu biçimi) · Tarih: 2026-09-20 · Görev: TASK-0088 · İlgili: D-100, D-235, REQ-WFL-008

Plan: `docs/architecture/spikes/SPIKE-04-06-plan.md`. Gerçek PostgreSQL üzerinde 500.000 sentetik geçmiş satırı, şantiye + olay türü + tarih birleşik indeksi ve toplama miktarını içeren indeks kullanıldı. Sınır kontrolleri için altı ek satır yazıldı. Bütün deney yalnız geçici `spike` şemasında çalıştı.

## Dokuz kontrolün sonucu

Sayım ve toplam aynı parametreli sorguda değerlendirildi. Deneyin tarih aralığı başlangıç dahil, bitiş hariçtir; bu, kullanıcıya yeni bir takvim kuralı koymaz. 30 günlük aralığın iki sınırı, aralık dışındaki gün ve farklı olay türünün dışlanması kontrol edildi. İki uygun satırın sayısı 2, toplamı 5 çıktı; yeni satır eklendikten sonraki değerlendirme 3 ve 9 döndürdü. Sonuç önceki çalışmadan önbelleklenmedi.

Her veri durumu için iki ısınma sonrası 20 ölçüm alındı. Aşağıdaki süreler işlem başlatma, sorgu ve geri alma dahil üç ağ turunun toplamıdır; açık bağlantı kullanılır. p95, sıralı 20 ölçümün 19'uncusudur.

| Veri durumu | Sayım / toplam | p50 | p95 | En yavaş |
|---|---|---|---|---|
| Kayıt bulunan şantiye | 140 / 560 | 237 ms | 238 ms | 244 ms |
| Boş şantiye | 0 / 0 | 237 ms | 241 ms | 245 ms |
| Sınır kontrolü şantiyesi | 3 / 9 | 237 ms | 241 ms | 243 ms |

Üç sorgu da 2 saniyelik hedefi geçti. İki doğruluk kontrolü ve üç hız kontrolüne ek olarak dört hata kontrolü yapıldı:

- İşlem yerelinde `statement_timeout=2000ms`; kontrollü `pg_sleep(3)` sorgusu gerçek `57014` hatasıyla kesildi ve örnek `failed` oldu.
- Başarısız işlem geri alındı; neden ayrı işlemde günlüğe yazıldı. Koşul `false` kabul edilmedi, sonraki iş adımı çalışmadı.
- Tek etki, sahip ve tasarımcıyı hedefleyen hata bildirimi kuyruğu satırıydı. Görev/kilit/kayıt etkisi oluşmadı; gerçek bildirim gönderilmedi.
- Aynı bağlantı geri almadan sonra yeniden sorgu çalıştırabildi.

Hatanın oluşması, geri alma ve hata/bildirim kaydının yazılması dahil toplam 2.796 ms ölçüldü. **2 saniye sorgunun sunucudaki sınırıdır**; ağ ve hata kaydıyla birlikte bütün işlemin 2 saniyede bittiği iddia edilmez.

## Öz inceleme ve sınırlar

Deneme zaman aşımını sahte bir uygulama hatasıyla üretmedi; gerçek PostgreSQL iptal yolunu kullandı. Ancak kontrollü bekleme, karmaşık bir üretim sorgusunun yük davranışının yerine geçmez. 50–150 eşzamanlı kullanıcı, bütün katalog alanları, bütün serbest koşul birleşimleri, saat dilimi sınırları ve ürün IAM bağlantısı bu deneyde sınanmadı. Ölçüm, bu indeksli sayım/toplam biçiminin uygulanabilirliğini doğrular; serbest koşulların kapsamını daraltmaz.

Phase 08'de koşul derleyicisi parametreleri bağlamalı, izinli katalog alanlarını doğrulamalı ve her sorguya süre sınırını uygulamalı. Zaman aşımı, işlem geri alma ve ayrı hata kaydı için ürün kabul testi bulunmalıdır. Önceki bağlantı yardımcısının TLS doğrulama sınırlaması bu deneyde de sürer; ürün bağlantısı için güvenlik onayı verilmez.

Kaynak: [PostgreSQL statement_timeout](https://www.postgresql.org/docs/17/runtime-config-client.html#GUC-STATEMENT-TIMEOUT).
