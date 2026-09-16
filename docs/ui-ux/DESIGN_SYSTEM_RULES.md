# Tasarım Sistemi Kuralları

Durum: Kabul edildi (ADR-009) · 2026-09-15

## 1. Bileşen kaynağı

- Arayüz **yalnızca COSS UI** (https://coss.com/ui, Base UI tabanlı) ve **Tailwind CSS** ile yapılır.
- Yeni bir ihtiyaçta önce COSS'ta uygun component, primitive veya particle aranır (resmi `coss` / `coss-particles` skill'leri kullanılır).
- **Özgün (custom) element yasaktır; ancak sahip açıkça onaylarsa yapılır.** Onay istenirken: ihtiyaç, COSS'ta neden karşılanmadığı, önerilen çözüm ve yeniden kullanım alanı yazılır. Onay `ai/DECISIONS.md`'ye kaydedilir.
- COSS bileşenleri projeye ait kompozisyon katmanında sarmalanır (ör. `modules/<modul>/ui/`), ekranlara dağınık ve tutarsız biçimde kopyalanmaz. Aynı bileşenin iki farklı uygulaması olamaz.
- Yaklaşım: `COSS component → proje tasarım token'ları → proje kompozisyonu`.

## 2. UI kaynak önceliği

1. Kullanıcı ihtiyacı ve doğru UX akışı
2. Projenin mevcut tasarım sistemi
3. COSS UI
4. Projede mevcut bileşenler
5. **COSS Origin gelişmiş bileşen örnekleri (öncelikli ilham, D-042)** — bkz. §3.1
6. devl.dev örüntüleri (ilham)
7. Sahip onaylı özgün element

Hazır bileşen var diye kötü UX kurulmaz.

## 3.1. COSS Origin kullanımı (D-042)

- Gelişmiş bir bileşen gerektiğinde (tarih/saat seçici, dosya yükleme, zengin tablo, çok adımlı form, etiket girişi, ağaç görünümü, sürükle-bırak vb.) **önce https://coss.com/origin örnekleri incelenir**; tasarım ve davranış oradan referans alınır.
- Origin kodu doğrudan projeye kopyalanmaz: Origin, COSS'un Radix tabanlı eski kopyasıdır ("legacy snapshot", sınırlı bakım). Aynı tasarım ve davranış **COSS UI primitive'leri ve COSS Particles** ile kurulur; böylece tek altyapı (Base UI) korunur (ADR-009).
- COSS UI/Particles ile karşılanamayan bir Origin davranışı özgün element sayılır ve sahip onayına sunulur.
- Origin lisansı MIT'tir (`cosscom/coss` `apps/origin/LICENSE.md`); tasarım referansı olarak kullanımda lisans engeli yoktur.

## 3. devl.dev kullanımı

Kural: `Inspect → Understand → Adapt → Standardize`. Kod veya tasarım körü körüne kopyalanmaz; lisans koşulları kontrol edilmeden kod alınmaz; uyarlama COSS bileşenleriyle yapılır.

Kullanım alanları: uygulama kabuğu, dashboard, navigasyon, ayarlar, formlar, kimlik doğrulama, onboarding, kartlar, veri gösterimi, boş durumlar, aktivite akışı, bildirimler.

**Kayıtlı referanslar**

| Alan | Referans | Not |
|---|---|---|
| Auth / onboarding | https://www.devl.dev/c/auth/onboarding | Her ekranda tek karar, adım göstergesi (Adım 01 / 3). Giriş, 2FA, parola sıfırlama ve yeni rol yönlendirmesi (§2.7) için ilham. |

## 4. Marka ve tasarım token'ları

- Ana marka rengi: `#0F4C81`; panel/ikincil gri: `#DDDBDB`.
- Durum renkleri markadan bağımsızdır: yeşil = olumlu/onaylı/kâr, amber = dikkat, kırmızı = kritik/zarar/gecikme, nötr gri = pasif/hazırlık.
- Açık ve koyu mod desteklenir; kontrast WCAG 2.2 AA'yı sağlar.
- Renk, spacing, radius, tipografi, gölge, z-index, breakpoint ve motion değerleri merkezi token'lardan gelir; bileşen içinde rastgele değer yazılmaz.
- Doğru GEOGES logo dosyaları Phase 02'de sahipten alınır.

## 5. Ekran değerlendirme sırası

`Kullanıcı hedefi → Bilgi hiyerarşisi → Birincil eylem → İkincil eylemler → Geri bildirim → Kurtarma`

## 6. Zorunlu ekran durumları

Uygun olan her ekranda: `INITIAL, LOADING, SUCCESS, EMPTY, PARTIAL, ERROR, PERMISSION DENIED, RETRY, DESTRUCTIVE CONFIRMATION`. `OFFLINE` durumu ilk sürümde "bağlantı yok" uyarısı olarak ele alınır (çevrimdışı giriş DEF-002).

## 7. Form UX

Doğru input türü · anlaşılır etiket · yardımcı açıklama · istemci ve sunucu doğrulaması · alan ve form düzeyi hata · yükleniyor durumu · başarı geri bildirimi · çift gönderim engeli · klavye ile kullanım · mümkün olan yerde yazmak yerine seçim · otomatik hesaplanan alanlar · taslak otomatik kayıt · altta sabit kaydet · "Kaydet ve yeni ekle".

## 8. Erişilebilirlik

WCAG 2.2 AA hedefi: klavye navigasyonu, görünür odak, semantik HTML, etiketler, doğru ARIA, kontrast, ekran okuyucu davranışı, anlaşılır hata iletimi. Definition of Done'ın parçasıdır.

## 9. Responsive

Her önemli ekran için masaüstü, tablet ve mobil davranışı ayrı düşünülür. Mobil, masaüstünün küçültülmüş hali değildir; gerekirse farklı bilgi hiyerarşisi uygulanır. Saha ekranlarında büyük dokunma alanı, az klavye, net toplamlar.

## 10. Standart ekran kalıpları

Liste (başlık, Yeni, arama, hızlı filtre, özet, satır/kart görünümü, sıralama, sık/ferah yoğunluk, gelişmiş filtre, tercihlerin hatırlanması), detay (başlık, durum, eylemler, kilit rakamlar, aç/kapa bölümler) ve form kalıpları Özellik Yapısı §41–§44'e göre Phase 02'de COSS bileşen eşlemesiyle ayrıntılandırılır.

## 11. UI tutarlılık incelemesi

Önemli UI değişikliğinden sonra: Bu başka yerde var mı? Örüntü tutarlı mı? COSS bunu çözüyor mu? Spacing ve tipografi seviyeleri tutarlı mı? Durumlar tam mı? Mobil düşünüldü mü? Erişilebilirlik düşünüldü mü? Daha az adımla yapılabilir mi? Birincil eylem net mi? Özgün element kullanıldıysa onayı var mı?

## 12. Metinler

Arayüz metinleri Türkçe ve bileşen içinde yazılır (ADR-011). Dil sade, kurumsal ve yönlendiricidir; internal durum değerleri kullanıcıya Türkçe karşılığıyla gösterilir.
