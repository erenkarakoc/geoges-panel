# SPIKE-07 — Akış şeması alanı

Durum: GEÇTİ · Tarih: 2026-09-20 · İlgili karar: D-224, ADR-009, D-235

**Soru.** Kutu-ok şeması COSS/Base UI ile kurulabiliyor mu, kütüphane gerekiyor mu? 40 adımlı bir akış masaüstünde ve telefonda akıcı mı, klavyeyle kullanılabiliyor mu, kütüphane gerekiyorsa lisansı ve boyutu kabul edilebilir mi?

**Yöntem.** `src/sandbox/spike-flow/` altında atılacak bir prototip: gerçek şablonların şeklinde 40 adım (başlangıç, koşul, onay, görev, kayıt oluştur, bildirim, bekleme, paralel dal, her biri için, birleşme, eskalasyon, alt akış, kilit, bitiş), 40 bağlantı, üç çıkışlı bir onay kutusu, geriye giden "düzeltmeye gönder" kenarı ve eksik bırakılmış bir adım. Adım kutusu tamamen tema token'larıyla; adım soruları COSS `Sheet` panelinde. Ölçümler geliştirme derlemesinde (üretim derlemesi daha hızlıdır).

## Sonuçlar

| Ölçüm | Sonuç | Değerlendirme |
|---|---|---|
| İlk çizim (masaüstü) | 258 ms | Geçer |
| İlk çizim (375 px) | 315 ms | Geçer |
| Sürekli yakınlaştırma + kaydırma, 40 kutu | medyan **12,1 ms/kare**, p95 12,3 ms, en kötü 30 ms | ~80 kare/sn; akıcı |
| Telefonda yatay sayfa kaydırması | Yok | Geçer (REQ-NFR-008) |
| Klavye | 40 kutunun 40'ı da odaklanabilir; Tab ile sırayla geziliyor | Geçer, ama not 1 |
| Yan panel | Kutuya tıklayınca adımın türü, başlığı, sahibi ve kimliği açılıyor | Geçer |
| Açık ve koyu tema | İkisinde de token'larla doğru çalışıyor | Geçer |
| Kütüphane | `@xyflow/react` 12.11.6, **MIT** | Kabul edilebilir |
| Boyut | ~52 KB + ~36 KB (gzip, react + system) ≈ **88 KB** | Kabul edilebilir; yalnız Yönetim ekranında yüklenir |

## Karar

**Kütüphane gerekiyor ve `@xyflow/react` uygun.** Kendi elimizle kaydırma, yakınlaştırma, kenar yönlendirme, mini harita ve seçim yönetimi yazmak haftalar alır ve erişilebilirlik tarafı baştan kurulmak zorunda kalır. Kütüphane projede zaten var (geliştirme sandbox'ı, D-052), MIT lisanslı ve şema alanı dışında hiçbir ekranda yüklenmiyor.

Bu, D-224'ü doğruluyor: şema alanı **özel arayüz öğesidir**; içindeki kutular, paneller, menüler ve formlar COSS bileşenleriyle kurulur (denemede `Sheet` ve `Button` öyle kullanıldı).

## Phase 08'e taşınan üç not

1. **40 Tab durağı fazla.** WCAG karşılanıyor ama kullanışlı değil. Gerçek tasarımcıda şema tek Tab durağı olmalı; içinde ok tuşlarıyla kutular arasında gezilmeli, Enter kutuyu açmalı (yaygın "kompozit widget" kalıbı). Bu, `docs/ui-ux/ACCESSIBILITY.md`'ye eklenecek bir kuraldır.
2. **Telefonda mini harita kapalı gelmeli.** 375 pikselde ekranın dörtte birini kaplıyor; asıl işi zorlaştırıyor.
3. **Kütüphane gecikmeli yüklenmeli.** Şema alanı yalnız tasarımcı açıldığında indirilsin; Yönetim sayfasının diğer bölümleri bu 88 KB'ı taşımasın.

## Ölçümün sınırları

- Geliştirme derlemesi ölçüldü; üretimde daha iyi olması beklenir.
- Sürükleyerek kutu taşıma ve kenar çizme denenmedi; bunlar Phase 08'in işi ve kütüphanenin hazır yetenekleri.
- Deneme kodu rapordan sonra silindi; Git geçmişinde `SPIKE-07` commit'inde duruyor.
