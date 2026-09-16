# Tasarım Sistemi Kuralları

Durum: Kabul edildi (ADR-009) · 2026-09-15

## 1. Bileşen kaynağı

- Arayüz **yalnızca COSS UI** (https://coss.com/ui, Base UI tabanlı) ve **Tailwind CSS** ile yapılır.
- Yeni bir ihtiyaçta önce COSS'ta uygun component, primitive veya particle aranır (resmi `coss` / `coss-particles` skill'leri kullanılır).
- **Özgün (custom) element yasaktır; ancak sahip açıkça onaylarsa yapılır.** Onay istenirken: ihtiyaç, COSS'ta neden karşılanmadığı, önerilen çözüm ve yeniden kullanım alanı yazılır. Onay `ai/DECISIONS.md`'ye kaydedilir.
- COSS bileşenleri projeye ait kompozisyon katmanında sarmalanır (ör. `modules/<modul>/ui/`), ekranlara dağınık ve tutarsız biçimde kopyalanmaz. Aynı bileşenin iki farklı uygulaması olamaz.
- Yaklaşım: `COSS component → proje tasarım token'ları → proje kompozisyonu`.

### 1.1. Katman ve yüzey bileşenleri (sahip notu, 2026-09-16)

COSS UI'ın aşağıdaki bileşenleri gerektiği her yerde kullanılır; aynı ihtiyaç için özgün çözüm yazılmaz:

| Bileşen | Ne zaman |
|---|---|
| `Frame` | Kenarlıklı içerik yüzeyi; kart başlığı/gövde/alt yapısı gerekmeyen gruplanmış içerik |
| `Dialog` | Kullanıcının odaklanması gereken kısa işlem veya form (masaüstü) |
| `Drawer` | Mobilde alttan/yandan açılan panel; masaüstünde Dialog/Menu'nün mobil karşılığı |
| `Sheet` | Sayfadan ayrılmadan detay, filtre veya ayar paneli (yandan açılır) |
| `Menu` | Bir öğeye ait eylem listesi (ör. satır eylemleri, kullanıcı menüsü) |

Yıkıcı onaylar için `AlertDialog`; aranabilir seçimler için `Command` / `Combobox` kullanılır. Masaüstü–mobil eşleşmesi (ör. Dialog ↔ Drawer, Menu ↔ DrawerMenu) Phase 02 ekran tasarımında her ekran için belirlenir.

### 1.2. Site içi arama (D-044)

Panelde kapsamlı bir site içi arama bulunur ve arayüzü COSS `Command` bileşeniyle kurulur (üst bardan ve klavye kısayoluyla açılan komut paleti). Sonuçlar yalnızca kullanıcının görmeye yetkili olduğu kayıtları içerir. Ayrıntılı tasarım: TASK-0029.

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
- **Yazı tipi (sahip tercihi, 2026-09-16):** arayüzün tamamı Geist; kod alanları Geist Mono.
- **Finansal sayılar (sahip tercihi, 2026-09-16):** tüm finansal sayılar Geist Mono (`font-mono`) ve eşit genişlikli rakamlarla (`tabular-nums`) gösterilir. Kapsam: para tutarları (hakediş, gelir-gider, kâr-zarar, cari bakiye, teklif/fatura/ödeme tutarları, bütçe), döviz kurları ve finansal oranlar (marj, kâr yüzdesi). Tutarlar tek bir ortak biçimlendirme bileşeninden/fonksiyonundan geçer (para birimi, binlik ayırıcı, TL karşılığı); ekranlarda elle biçimlendirilmez. Bileşen, ilk finansal ekranla birlikte (Phase 02 tasarımı, uygulama FIN/RPT dilimleri) oluşturulur.

## 4.1. COSS varsayılanlarından sapmalar (kayıt)

Sahip isteği (2026-09-16): COSS UI / Tailwind varsayılanlarının dışına çıkılan her yer sahibe bildirilir ve bu tabloya yazılır. COSS dosyaları (`src/components/ui`) değiştirilmez; sapmalar proje katmanında (sınıf, token, kompozisyon) yapılır.

| # | Yer | COSS varsayılanı | Projede | Neden | Dosya |
|---|---|---|---|---|---|
| 1 | Renk token'ları | `--primary`, `--sidebar-primary`, `--ring` nötr gri | Marka mavisi `#0F4C81`; koyu modda açık tonu | Kurumsal kimlik (§40.5) | `src/platform/ui/theme/brand.css` |
| 2 | Logo rengi | — | `--brand-logo`: açıkta `#0F4C81`, koyuda `#EFEFEF` | Sahibin logo dosyaları | `brand.css`, `brand-logo.tsx` |
| 3 | Uygulama kartı kenarlığı | `inset` kartında yalnızca gölge | Masaüstünde 1px kenarlık | Sahip isteği: kenarlıklı kart | `app-shell.tsx` |
| 4 | Dış yerleşim boşluğu (`--layout-gap`) | Kart `m-2`, sidebar `p-2` (0,5rem) | `md` ≥: 1,5rem, `xl` ≥: 2,5rem; sidebar üst/sol/alt ve kart üst/sağ/alt kenarlarında. Sidebar ile kart arası COSS varsayılanında kalır (açık 8px, daraltılmış 14px) | Sahip isteği: geniş dış kenar boşluğu | `app-shell.tsx`, `app-sidebar.tsx` |
| 4a | Sidebar genişliği | `--sidebar-width` 16rem, daraltılmış `ikon + 1rem + 2px` | `15rem + --layout-gap + 0,5rem` (menü içeriği COSS ile aynı 15rem kalır); daraltılmış `ikon + --layout-gap + 0,5rem + 2px`; kart daraltılmışta `--layout-gap` kadar kaydırılır | 4. maddedeki boşluğun menü alanını daraltmaması | `app-shell.tsx`, `app-sidebar.tsx` |
| 5 | Sabit yükseklik, kart içi kaydırma | Sayfa (pencere) kayar; kabuk `min-h-svh` | Kabuk `h-svh`; pencere kaymaz, uygulama kartı sabit yükseklikte, içerik COSS `ScrollArea` içinde kayar; üst bar kartın tepesinde sabit | Sahip isteği | `app-shell.tsx` |
| 5a | Sidebar kenar çubuğu (rail) | Yalnızca tıklamayla aç/kapat | Tıklamaya ek olarak sürükleme: 32px sola daraltır, sağa genişletir; sürükleme sonrası tıklama yok sayılır | Sahip isteği | `sidebar-drag-rail.tsx` |
| 6 | Yazı tipi | Gövde ve başlık Inter, kod Geist Mono; alt küme `latin` | Gövde, başlık ve kod Geist / Geist Mono (COSS değişkenleri `--font-sans`, `--font-heading`, `--font-mono` korunur); alt küme `latin` + `latin-ext` | Sahip tercihi; Türkçe karakterler | `src/app/layout.tsx` |
| 7 | Kurulum bağımlılıkları | `@coss/style` `radix-ui` ve `cn` ekler | Kaldırıldı (kullanılmıyor) | Yalnızca Base UI (ADR-009) | `package.json` |
| 8 | Menü tetikleyici erişilebilir adı | "Toggle Sidebar" | "Menüyü aç veya kapat" (`aria-label`) | Türkçe arayüz (ADR-011) | `app-shell.tsx` |

Bilinen, henüz giderilmemiş fark: COSS sidebar'ın mobil başlığı ("Sidebar") ve kenar çubuğu ipucu ("Toggle Sidebar") İngilizce kalır; COSS dosyası değiştirilmeden düzeltilemez.

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
