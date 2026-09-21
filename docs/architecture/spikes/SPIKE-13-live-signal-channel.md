# SPIKE-13 — Canlı sinyal kanalının sahada dayanması

Durum: GEÇTİ (ilk koşuda bulunan bir kusur düzeltilerek) · Tarih: 2026-09-21 · Görev: TASK-0095 · Bağlı: ADR-018, D-240, D-232

**Soru.** Canlı sinyal kanalı zayıf bağlantıda dayanıyor mu? Geçme ölçütü: kanal koptuğunda ekran sessizce yeniden bağlanıyor; sinyal kaybolduğunda sayfa yenilemesi doğru sayıyı getiriyor; kanal veri taşımıyor.

**Karar çerçevesi (ADR-018).** Tarayıcıya tek yönlü bir akışla (SSE) yalnız "şu değişti" sinyali gider; veriyi ekran kullanıcının kendi yetkisiyle ayrıca çeker. Supabase Realtime kullanılmaz.

## Yöntem

Deney kodu geçicidir (`spike13.mjs`), ürüne girmedi; veritabanı, kimlik bilgisi veya dış servis kullanılmadı.

- **Sunucu:** yerel bir SSE sunucusu. Sinyal akışı (`retry: 1000`, 5 sn'de bir canlı tutma yorumu), kullanıcının şantiye kapsamına göre sayı döndüren uç nokta ve "onay geldi" tetikleyicisi. A kullanıcısının kapsamı şantiye 1–2, B'ninki şantiye 3.
- **İstemci:** gerçek Chrome (başsız, `puppeteer-core`), iki kullanıcı için iki sayfa. Sayfa sinyal gelince ve akış açılınca sayıyı kendi yetkisiyle yeniden çeker.
- **Zayıf bağlantı senaryoları:** sunucunun akışı kesmesi; tarayıcının 10 sn çevrimdışı kalması (CDP); sunucunun 4 sn boyunca 503 dönmesi; bağlantının hemen koparıldığı ağ hatası türü kesinti; 400 ms gecikmeli, 400 kbit/sn yavaş bağlantı.

## İlk koşuda bulunan kusur

İlk koşu **C5'te kaldı**. Günlük mekanizmayı açıkça gösterdi:

1. Çevrimdışı öykünmesi açık akışı kesmedi; o sırada gelen üç sinyal ulaştı.
2. Her sinyalin ardından yapılan sayı isteği çevrimdışı olduğu için **başarısız oldu**.
3. Bağlantı dönünce ne yeni sinyal geldi ne yeniden bağlanma oldu, çünkü akış hiç kopmamıştı. Sayaç bir sonraki kopmaya kadar, yaklaşık 18 saniye, **yanlış kaldı**.

Sahadaki kısa kopmalarda beklenecek durum tam olarak budur: sinyal gelmiş ama veri çekilememiştir. **Düzeltme:** başarısız sayı isteği artan aralıklarla (0,5 → 8 sn) yeniden denenir ve tarayıcının `online` olayında da yenilenir. Başarısız koşunun kanıtı ayrıca saklandı (`spike13-evidence-1789989843605.json`).

## Sonuçlar — düzeltmeden sonra 12/12

| # | Kontrol | Sonuç |
|---|---|---|
| C1 | İlk açılışta iki ekran da kendi doğru sayısını gösterir | A 1, B 1 |
| C2 | Sinyal gelince sayaç doğru değere güncellenir | 66 ms |
| C3 | A'nın kapsamındaki değişiklik B'ye sinyal olarak gitmez | B'ye 0 sinyal |
| C4 | Sunucu akışı kestiğinde tarayıcı kendiliğinden yeniden bağlanır, sayı doğru | 820 ms |
| C5 | Çevrimdışıyken kaçırılan değişiklikler dönüşte kendiliğinden doğru | **62 ms** (düzeltmeden önce düzelmiyordu) |
| C6 | 503 aldığında tarayıcının `EventSource`'u kalıcı olarak kapanır | bilinen tuzak doğrulandı |
| C7 | Kendi sarmalayıcımız artan aralıklarla yeniden bağlanır, sayı doğru | 4,3 sn, 3 deneme |
| C8 | Ağ hatası türü kesintide tarayıcı kendisi yeniden bağlanır | 2,8 sn |
| C9 | 400 ms gecikmeli yavaş bağlantıda sayaç yine güncellenir | 496 ms |
| C10 | Sayfa yenilemesi kaynaktaki doğru sayıyı getirir | A 9, B 1 |
| C11 | Kanaldan geçen her sinyal yalnız tür taşır; sayı, kayıt veya şantiye bilgisi yok | 10 çerçevenin 10'u |
| C12 | Kopma ve yeniden bağlanma boyunca kullanıcıya hata gösterilmedi | tasarım gereği; güçlü bir kanıt değil |

## Tasarım için bulgular

1. **Tarayıcının kendi yeniden bağlanması yetmez.** Ağ hatasında `EventSource` kendisi yeniden bağlanır, ama sunucu 503 gibi bir HTTP hatası döndüğünde kalıcı olarak kapanır. Bakım, dağıtım veya aşırı yük anında bu olur. Artan aralıklı kendi yeniden bağlanma sarmalayıcımız gereklidir.
2. **Sinyal ile veri isteği ayrı ayrı başarısız olabilir.** Sinyalin ulaşması, verinin çekildiği anlamına gelmez. Veri isteği başarısız olursa yeniden denenmeli ve `online` olayında yenilenmelidir. Aksi halde ekran bayat kalır.
3. **Kaçırılan sinyaller yeniden oynatılmaz, gerek de yoktur.** Akış her açıldığında sayı kaynaktan yeniden çekilir; bu, `Last-Event-ID` ile sinyal geçmişi tutmaktan basit ve daha güvenilirdir.
4. **Kanal veri taşımaz.** Sinyal yalnız türünü taşır; sayı daima ayrı ve yetki denetimli istekle gelir. B, A'nın kapsamındaki değişikliğin sinyalini hiç almadı.

## Sınırlar

1. Sunucu yereldi. Gerçek barındırmadaki vekil sunucular (nginx, Cloudflare vb.) SSE akışını tamponlayabilir veya boşta kalan bağlantıyı kesebilir. Barındırma kararında (DEF-008) tamponlamanın kapatılması ve canlı tutma aralığının boşta kesme süresinden kısa olması doğrulanmalıdır.
2. **Çoklu sekme sınanmadı.** HTTP/1.1'de tarayıcı aynı adrese en çok 6 bağlantı açar; her sekme bir akış tuttuğu için yedinci sekme takılabilir. Üretimde HTTP/2 kullanılmalı ya da sekmeler arasında tek akış paylaşılmalıdır.
3. Sinyaller outbox işleyicisinden değil, deney tetikleyicisinden üretildi; "olay gerçekten işlendikten sonra sinyal" bağlantısı Phase 07'de kurulacak.
4. Zayıf bağlantı CDP öykünmesi ve sunucu tarafı kesintilerle taklit edildi; gerçek mobil ağ sınanmadı.
5. Telefonun ekranı kilitlemesi veya uygulamanın arka plana alınması gibi mobil tarayıcı davranışları sınanmadı.

## Phase 07'ye taşınanlar

1. SSE istemci sarmalayıcısı: kalıcı kapanmada artan aralıklı yeniden bağlanma; her açılışta kaynaktan yenileme.
2. Veri isteği için yeniden deneme ve `online` olayında yenileme.
3. Sinyal yükü yalnız tür taşır; sayı veya kayıt bilgisi eklenmez. Bu bir sözleşme testiyle korunur.
4. HTTP/2 veya sekmeler arası tek akış; vekil sunucuda tamponlama kapalı; canlı tutma aralığı boşta kesme süresinden kısa.

Kanıt: dış scratchpad'de `spike13-evidence-*.json` (başarısız koşu ve düzeltilmiş koşu ayrı dosyalarda).
