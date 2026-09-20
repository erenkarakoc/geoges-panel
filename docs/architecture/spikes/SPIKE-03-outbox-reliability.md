# SPIKE-03 — Outbox sırası, kesinti ve tekrar

Durum: GEÇTİ (düzeltilmiş deneme işleyicisi) · Tarih: 2026-09-20 · Görev: TASK-0084 · İlgili: D-234, ADR-014

## İlk denemenin eksikleri

Önceki işleyici 10 bin olayı saymış ve 500 tekrarın toplamı artırmadığını göstermişti. Ancak üretici yalnız outbox'a yazıyordu; kaynak kayıtla aynı işlem iddiası sınanmamıştı. Durdurma işlem aralarında gerçekleşiyordu; işlem ortasında kapanma denenmemişti. Toplam sayacın doğru olması olayların kayıt bazında sırayla işlendiğini kanıtlamaz.

Ek testte ilk olay kilitli tutulduğunda eski `ORDER BY id ... SKIP LOCKED` seçimi aynı kaydın ikinci olayını alabildi. **Eski seçim sıra ölçütünü karşılamadı.** Bu ilk başarısızlık rapordan çıkarılmadı.

## Düzeltilmiş deneme

Yalnız `spike` içinde ayrı `review_source`, `review_events`, `review_deliveries`, `review_projection` tabloları oluşturuldu. Kaynak kayıt ve olaylar aynı işlemde yazıldı. İşleyici, aynı kaydın daha eski teslim edilmemiş olayı varsa sonraki olayı seçmiyor. Teslim anahtarı ve yan etki aynı işlemde yazılıyor; daha önce teslim edilmiş olay etki üretmiyor. Her etki için sıra numarası öncekinin tam bir fazlası olmalı; değilse test hata vererek işlemi geri alıyor. Bu denemede tek abone var; üründe anahtar `(olay, abone)` olacak.

## Yeniden doğrulama: 10/10 kontrol

| Kontrol | Sonuç |
|---|---|
| Eski seçimin sıra ihlalini yeniden üretme | İlk olay kilitliyken ikincisi seçildi; kusur doğrulandı |
| Kaynak kayıt + olay birlikte geri alma | İki tabloda da sıfır kayıt |
| Kaynak kayıt + 10.000 olay birlikte commit | 100 kaynak kayıt, her biri için 100 olay |
| İlk olay kilitliyken aynı kaydın ilerlemesini engelleme | Diğer 99 kayıt seçildi; kilitli kaydın sonraki olayı seçilmedi |
| İşleyiciyi commit öncesinde kapatma | Çocuk Node süreci 100 etkiyi yazdıktan sonra kod 91 ile kapandı |
| Kapanan işlemin geri alınması | Teslim 0, etki 0 |
| İşlem aralarında durdurma | 1.000 olaydan sonra durdu |
| Üç işleyiciyle devam | 10.000 teslim, 10.000 etki; 100 kaydın her birinde son sıra 100; kalan 9.000 olay 30.670 ms |
| İlk 500 olayı tekrar gönderme | Yeni etki 0 |
| Son toplam | 10.000 |

## Sonuç ve öz inceleme

ADR-014'ün kaynakla atomik yayımlama, kayıt bazında sıra ve tekrarı zararsız kılma yaklaşımı doğrulandı. Sıralı seçimle throughput, önceki yalnız sayaç deneyinden farklıdır; eski yaklaşık 1.309 olay/sn değeri sıralı işleyicinin hızı diye kullanılamaz.

Phase 07 zorunlulukları: sıra kontrolü ve negatif testi, teslim/etki atomikliği, işlem ortasında kapanma testi, abone başına benzersiz teslim anahtarı. Geri çekilme zamanlaması, ölü mektup, birden çok abonenin bağımsızlığı, dış servise gönderimin tekrarsızlığı ve sunucunun güç kaybı bu deneyde sınanmadı; ürünün T1 kapısında ayrıca doğrulanır. Deneme kodu ürüne taşınmadı. Geçici şema örnek veriyle bırakıldı; gerçek kayıtlar değiştirilmedi.
