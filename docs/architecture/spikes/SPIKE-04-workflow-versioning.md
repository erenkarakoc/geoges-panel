# SPIKE-04 — Çalışan akışın sürümünü koruma

Durum: GEÇTİ (deneme kapsamı) · Tarih: 2026-09-20 · Görev: TASK-0086 · İlgili: D-235, ADR-006, REQ-WFL-024

Plan: `docs/architecture/spikes/SPIKE-04-06-plan.md`. Deneme kodu repository dışındadır; ürün motoru uygulanmadı. Gerçek PostgreSQL üzerinde, yalnız geçici `spike` şemasındaki `wf_` tabloları ve sentetik kişiler kullanıldı.

## Senaryo

1. Birinci tanım sürümü denendi ve yayımlandı. Bu sürümle başlayan örnek, koordinatör onayından önce bekletildi; sürüm kimliği, sonraki adımı ve günlüğü veritabanına yazıldı.
2. İkinci sürümde koordinatör adımının başlığı değiştirildi ve yönetici onayı eklendi. Denendikten sonra tanım yeniden değiştirildi: eski deneme sonucuyla yayın reddedildi. Yeni deneme yapılıp ikinci sürüm yayımlandı.
3. İlk bağlantı kapatıldı. Ayrı bir Node süreci, yalnız örnek kimliğiyle eski işi veritabanından açıp tamamladı. Yeni sürümle başlatılan ayrı iş de tamamlandı.

## Yedi kontrolün sonucu

| Kontrol | Sonuç |
|---|---|
| Deneme yapılmadan yayın | Reddedildi |
| Yayımlanmış tanımı veri erişim işlevinden düzenleme | 0 satır değişti |
| Tanım değiştikten sonra eski denemeyle yayın | Reddedildi |
| Ayrı süreçte kalıcı durumdan devam | Tamamlandı |
| Eski örnek | Sürüm 1; yeni yönetici adımına girmedi |
| Yeni örnek | Sürüm 2; yönetici adımından geçti |
| Geçmişin okunabilirliği | Aynı adım kimliğinin v1/v2 başlıkları ve sürümleri ayrı ayrı korundu |

Eski örnekte 7, yeni örnekte 8 adım var. Yayımlama işlevi deneme sonucunu tanımın SHA-256 içerik özetiyle karşılaştırdı. JSON nesneleri anahtar sırasından bağımsız karşılaştırıldı. Geçmiş yalnız etkin sürüm üzerinden okunmadı; örneğin bağlı olduğu sürüm kullanıldı.

## Öz inceleme ve ürün sınırı

Ortak motorun kendi sonucunu doğrulamasıyla yetinilmedi: ayrı bir salt okunur kontrol, kalıcı günlüklerdeki yolları ve sahipleri önceden yazılmış beklenen dizilerle karşılaştırdı. SPIKE-04/05 ortak incelemesinde 13 kontrol geçti.

Yayımlanmış tanımı koruyan kontrol bu denemede veri erişim işlevindedir; ayrıcalıklı SQL ile değişmezliğin zorlandığı iddia edilmez. Aynı anda iki yayın, şema göçleri, yetenek sürümü uyumluluğu, yayın bildirimleri, önceki sürümün `superseded` etiketi ve bütün düğüm paleti sınanmadı. Phase 08'de bunlar ürün kapısında ele alınır. Deneme, kalıcı sürüm bağı ve yeniden başlatma ölçütünü karşılar; çalışan ürünün hazır olduğu anlamına gelmez.
