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
| Auth / onboarding | https://www.devl.dev/c/auth/onboarding | Her ekranda tek karar, adım göstergesi (Adım 01 / 3). Yeni rol yönlendirmesi (§2.7) bu düzeni kullanır. |
| Giriş ekranı | https://www.devl.dev/c/auth/login | Tüm kimlik doğrulama ekranlarının tasarımı (D-046). |

### 3.2. Auth ekranları: tasarımın birebir alınması (D-046)

Sahip kararı (2026-09-16): devl.dev auth ekranlarının tasarımı **ilham değil, uygulanan tasarımdır**; yalnızca projeye uyarlanır.

**Alınan:** ikiye bölünmüş yerleşim (solda partikül figürü, sağda tek sütunlu form), `2xl` üstünde ortalanmış 16:9 kart çerçevesi, mono-büyük harf-geniş harf aralıklı üst etiket + başlık + açıklama düzeni, adım göstergesi, yazarken ve gönderirken figürün tepki vermesi.

**Uyarlanan:** bileşenler projenin kendi katmanlarında COSS ile kurulur (`@coss/button`, `@coss/input`, `@coss/label` zaten onların da bağımlılığı), metinler Türkçe, renkler marka token'larından, tema projenin mevcut sağlayıcısından gelir. Partikül figürünün kaynağı GEOGES logosudur.

**Alınmayan:** kendi tema sistemleri (`lib/themes`), figür PNG'leri (kayıtta yok ve lisansı belirsiz), sihirli bağlantı ile giriş ve Google/Apple düğmeleri (bizde e-posta + parola + TOTP; D-036, D-043).

`npx shadcn add` komutu bilerek çalıştırılmadı: dosya düzeni ve ikinci bir tema yığını projeye girmesin diye kayıt içerikleri okunup yeniden kuruldu.

## 4. Marka ve tasarım token'ları

- Ana marka rengi: `#0F4C81`; panel/ikincil gri: `#DDDBDB`.
- **Düz beyaz kullanılmaz (sahip kuralı, 2026-09-16):** `#FFF` yerine `--brand-light` (`#EFEFEF`) kullanılır. COSS'un açık temada beyaz boyadığı yüzeyler (`--background`, `--card`, `--popover`, `--code`) ve düğme yazısı (`--primary-foreground`) bu değere çekilir. Koyu temada ana mürekkep ailesi de (`--foreground`, `--card-foreground`, `--popover-foreground`, `--accent-foreground`, `--secondary-foreground`, `--sidebar-*-foreground`) `--brand-light`'tır; `--muted-foreground` kendi grisi olduğu için değişmez. Karşıtı `--brand-dark` (`#111111`).
- **Logo rengi bileşene özellik olarak verilir (sahip kuralı, 2026-09-16):** `BrandLogo` bileşeninin `tone` özelliği — `theme` (varsayılan, `--brand-logo`), `brand`, `light`, `dark`, `inherit`. Renk bileşenin içine gömülmez.
- Kare marka plakaları (`icon_rectangle_*`) iki renklidir (zemin + işaret), bu yüzden `currentColor` dönüşümünden geçmez: `BrandTile` bileşeniyle görsel olarak basılır. Favicon da bunları kullanır.
- Durum renkleri markadan bağımsızdır: yeşil = olumlu/onaylı/kâr, amber = dikkat, kırmızı = kritik/zarar/gecikme, nötr gri = pasif/hazırlık.
- Açık ve koyu mod desteklenir; kontrast WCAG 2.2 AA'yı sağlar.
- Renk, spacing, radius, tipografi, gölge, z-index, breakpoint ve motion değerleri merkezi token'lardan gelir; bileşen içinde rastgele değer yazılmaz.
- Doğru GEOGES logo dosyaları Phase 02'de sahipten alınır.
- **Logo ve koyu mod (sahip kuralı, 2026-09-16):** koyu modda `primary` (marka mavisi) logo **asla** kullanılmaz; her zaman `light` logo kullanılır. Bu kural logo, kare logo (tile), favicon ve logodan türetilen görseller için geçerlidir. Kodda varsayılanlar temaya uyar (`BrandLogo tone="theme"`, `BrandTile variant="theme"`); sabit `primary`/`brand` yalnızca rengi temayla değişmeyen açık bir yüzeyde kullanılabilir.
- **Yazı tipi (sahip tercihi, 2026-09-16):** arayüzün tamamı Geist; kod alanları Geist Mono.
- **Finansal sayılar (sahip tercihi, 2026-09-16):** tüm finansal sayılar Geist Mono (`font-mono`) ve eşit genişlikli rakamlarla (`tabular-nums`) gösterilir. Kapsam: para tutarları (hakediş, gelir-gider, kâr-zarar, cari bakiye, teklif/fatura/ödeme tutarları, bütçe), döviz kurları ve finansal oranlar (marj, kâr yüzdesi). Tutarlar tek bir ortak biçimlendirme bileşeninden/fonksiyonundan geçer (para birimi, binlik ayırıcı, TL karşılığı); ekranlarda elle biçimlendirilmez. Bileşen, ilk finansal ekranla birlikte (Phase 02 tasarımı, uygulama FIN/RPT dilimleri) oluşturulur.

## 4.1. COSS varsayılanlarından sapmalar (kayıt)

Sahip isteği (2026-09-16): COSS UI / Tailwind varsayılanlarının dışına çıkılan her yer sahibe bildirilir ve bu tabloya yazılır. COSS dosyaları (`src/components/ui`) değiştirilmez; sapmalar proje katmanında (sınıf, token, kompozisyon) yapılır.

| # | Yer | COSS varsayılanı | Projede | Neden | Dosya |
|---|---|---|---|---|---|
| 1 | Renk token'ları | `--primary`, `--sidebar-primary` nötr gri (açıkta koyu gri, koyuda beyaza yakın) | Her iki temada da marka mavisi `#0F4C81`, üzerinde beyaz yazı (sahip tercihi 2026-09-16; önceki hâli koyu modda açık maviydi). Yalnızca bu iki token değiştirilir: `--ring` (odak halkası), `--input`, `--border` ve `--background` COSS varsayılanında bırakılmıştır — sahip isteği 2026-09-16, marka rengi yalnızca birincil eylemlerde | Kurumsal kimlik (§40.5) | `src/platform/ui/theme/brand.css` |
| 2 | Logo rengi | — | `--brand-logo`: açıkta `#0F4C81`, koyuda `#EFEFEF` | Sahibin logo dosyaları | `brand.css`, `brand-logo.tsx` |
| 3 | Uygulama kartı kenarlığı | `inset` kartında yalnızca gölge | Masaüstünde 1px kenarlık, her boyutta (2026-09-16: `2xl`'de kaldırılması denendi, sahip isteğiyle geri alındı — çerçeveyle iç içe iki kenarlık tercih edildi) | Sahip isteği: kenarlıklı kart | `app-shell.tsx` |
| 4 | Dış yerleşim boşluğu (`--layout-gap`) | Kart `m-2`, sidebar `p-2` (0,5rem) | `md` ≥: 1,5rem, `xl` ≥: 2,5rem (`2xl`'de de aynı kalır); sidebar üst/sol/alt ve kart üst/sağ/alt kenarlarında. Sidebar ile kart arası COSS varsayılanında kalır (açık 8px, daraltılmış 14px) | Sahip isteği: geniş dış kenar boşluğu | `app-shell.tsx`, `app-sidebar.tsx` |
| 4a | Sidebar genişliği | `--sidebar-width` 16rem, daraltılmış `ikon + 1rem + 2px` | `15rem + --layout-gap + 0,5rem` (menü içeriği COSS ile aynı 15rem kalır); daraltılmış `ikon + --layout-gap + 0,5rem + 2px`; kart daraltılmışta `--layout-gap` kadar kaydırılır | 4. maddedeki boşluğun menü alanını daraltmaması | `app-shell.tsx`, `app-sidebar.tsx` |
| 5 | Sabit yükseklik, kart içi kaydırma | Sayfa (pencere) kayar; kabuk `min-h-svh` | Kabuk `h-svh`; pencere kaymaz, uygulama kartı sabit yükseklikte, içerik COSS `ScrollArea` içinde kayar; üst bar kartın tepesinde sabit | Sahip isteği | `app-shell.tsx` |
| 5a | Sidebar kenar çubuğu (rail) | Yalnızca tıklamayla aç/kapat | Tıklamaya ek olarak sürükleme: 32px sola daraltır, sağa genişletir; sürükleme sonrası tıklama yok sayılır | Sahip isteği | `sidebar-drag-rail.tsx` |
| 6 | Yazı tipi | Gövde ve başlık Inter, kod Geist Mono; alt küme `latin` | Gövde, başlık ve kod Geist / Geist Mono (COSS değişkenleri `--font-sans`, `--font-heading`, `--font-mono` korunur); alt küme `latin` + `latin-ext` | Sahip tercihi; Türkçe karakterler | `src/app/layout.tsx` |
| 7 | Kurulum bağımlılıkları | `@coss/style` `radix-ui` ve `cn` ekler | Kaldırıldı (kullanılmıyor) | Yalnızca Base UI (ADR-009) | `package.json` |
| 8 | Menü tetikleyici erişilebilir adı | "Toggle Sidebar" | "Menüyü aç veya kapat" (`aria-label`) | Türkçe arayüz (ADR-011) | `app-shell.tsx` |
| 9 | Partikül figürü (özgün element) | COSS'ta dekoratif canvas bileşeni yok | `ParticleField`: görüntüyü örnekleyip yaya bağlı noktalar olarak çizen canvas; imleçten kaçar, yazarken titreşir | Sahip onayı D-047, auth tasarımının imza öğesi (D-046) | `platform/ui/auth/particle-field.tsx` |
| 9a | Partikül figürünün kaynağı ve rengi | devl.dev: PNG figürler, sabit beyaz/siyah nokta rengi | GEOGES logosu (`logo_light.svg`); nokta rengi `--brand-logo` token'ından | Marka kimliği; orijinal figürler kayıtta yok ve lisansı belirsiz | `auth-shell.tsx`, `particle-field.tsx` |
| 9b | Partikül hareketi | devl.dev: dikey sürüklenme yatayın 10 katı; hareket azaltma tercihi dikkate alınmıyor | Yatay ve dikey sürüklenme eşit (keskin logoyu bulanıklaştırmaması için); `prefers-reduced-motion` açıkken figür tek seferde çizilir, animasyon yok | Logo okunabilirliği; WCAG 2.2 hareket tercihi | `particle-field.tsx` |
| 10 | Auth ekranı yerleşimi | COSS'ta hazır auth yerleşimi yok | İkiye bölünmüş yerleşim; `2xl` üstünde ortalanmış 16:9 kart, `lg` altında tek sütun | devl.dev auth tasarımı (D-046) | `platform/ui/auth/auth-split-layout.tsx` |
| 11 | 2FA karekodu | — | Supabase'in ürettiği SVG, `data:` URL'li `<img>` ile gösterilir (`next/image` değil) | Satır içi veri URL'sinde optimize edilecek bir şey yok | `two-factor-form.tsx` |
| 12 | Uygulama kabuğu dış çerçevesi | Kabuk ekranı doldurur (`min-h-svh`) | `2xl` üstünde tüm kabuk ortalanmış 16:9 çerçeveye girer: `rounded-2xl`, kenarlık, gölge, `min(94vw, 92svh×16/9)` genişlik. Auth ekranlarıyla aynı çerçeve (D-046). Çerçevenin ekran kenarına uzaklığı `--frame-inset` token'ından gelir (1,5rem); içerideki oluk ise 4. maddedeki `--layout-gap`. İki dış boşluk da `app-shell.tsx` başında tanımlıdır | Sahip isteği 2026-09-16: auth yerleşimi uygulama genelinde de kullanılsın | `app-shell.tsx` |
| 10a | Daraltılmış menüde grup başlığı | COSS başlığı `-mt-8 opacity-0` ile gizler: görünmez ama düzende kalır, tam kendi yüksekliği kadar yukarı kayıp grubun ilk öğesinin üstüne oturur ve tıklamasını yutar | `group-data-[collapsible=icon]:pointer-events-none` eklendi | COSS kusuru; daraltılmış menüde her grubun ilk öğesi tıklanamıyordu | `app-sidebar.tsx` |
| 10b | Beyaz yüzeyler | Açık temada `--background`, `--card`, `--popover`, `--code` düz beyaz; koyu temada mürekkep `neutral-100` | Hepsi `--brand-light` (`#EFEFEF`). Açık tema kuralı `:root:not(.dark)` ile sınırlanır — `brand.css`, `globals.css`'ten sonra yüklendiği için düz `:root` COSS'un `.dark` bloğunu da ezerdi | Sahip kuralı: düz beyaz kullanılmaz (§4) | `brand.css` |
| 10c | Sidebar zemini (açık tema) | `--sidebar: neutral-50` (`#FAFAFA`), karttan (beyaz) 5 ton koyu | `#EAEAEA` (`--brand-light`'tan türetilir), karttan yine 5 ton koyu | 10b sonrası kart `#EFEFEF` olunca sidebar karttan açık kalıyor, katman sırası tersine dönüyordu. COSS'un `--sidebar-foreground` karışımı bu değere bağlı olduğu için kendini yeniden hesaplar | `brand.css` |
| 11a | Tema değiştirici | — | Menü yerine tek tıkla açık/koyu geçişi; "Sistem" seçeneği arayüzden kaldırıldı (ilk ziyarette işletim sistemi tercihi yine geçerli, ilk manuel geçişten sonra seçim hatırlanır) | Sahip isteği 2026-09-16 | `theme-toggle.tsx` |
| 12a | Sidebar konumlanması | COSS sidebar'ı ekrana sabitler (`fixed h-svh`) | `2xl`'de `absolute h-full`: menü, 12. maddedeki çerçevenin içinde kalır | `fixed` ekrana göre konumlanır ve çerçeveden taşardı; COSS dosyası değiştirilmeden proje katmanından geçildi | `app-sidebar.tsx` |
| 13a | Sidebar açılış hali | Varsayılan açık (`defaultOpen = true`) | Varsayılan daraltılmış (ikon rayı); kullanıcının son tercihi COSS çereziyle hatırlanır | Sahip kararı D-057 | `app-shell.tsx` |
| 13b | Daraltılmış halde modül grupları | Daraltılmış sidebar öğeleri yalnız ikon + ipucu gösterir | Grup ikonu, grubun modüllerini COSS `Menu` ile açılır menüde listeler | D-054, D-057: grup başına tek ikon | `app-sidebar.tsx` |
| 13c | Genişletilmiş halde gruplar | — | Gruplar COSS `Collapsible` ile açılır; birden fazlası açık kalabilir, açık gruplar çerezde hatırlanır ve sunucuda açık render edilir | D-057 | `app-sidebar.tsx`, `sidebar-group-preference.ts` |
| 13d | Daraltılmış halde rozet | COSS ikon halinde `SidebarMenuBadge`'i gizler | Rozet yerine küçük bir nokta; sayı ipucunda kalır ("örnek veri" işaretiyle) | Bekleyen iş sinyali ikon halinde de görünsün (D-059) | `app-sidebar.tsx` |
| 14a | Üst çubuk yerleşimi | COSS'ta hazır üst çubuk yok; örnekler tek sıra `flex` | `xl` ve üstünde üç sütunlu ızgara (arama tam ortada); altında arama önce daralır | D-062: arama ortada ve geniş | `app-header.tsx` |
| 14b | Komut paleti arama süzgeci | Base UI'ın varsayılan süzgeci (harf duyarlı eşleşme) | Türkçe harfleri sadeleştiren süzgeç ("gorev" → "Görevler"); görünüm COSS örneğiyle birebir aynı | Sahada Türkçe karakter olmadan yazılıyor | `command-palette.tsx`, `search-text.ts` |
| 14c | Bildirim rozeti | `Badge` akış içinde durur | Zil düğmesinin sağ üst köşesine konumlanır | Sayı ikonla birlikte okunur (D-063) | `app-header.tsx` |

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

## 13. Geri bildirim: toast zorunlu (sahip kuralı, 2026-09-16)

Hata, uyarı ve başarı mesajları **bileşenin içine yazılmaz**; COSS `Toast` ile gösterilir.

| Ne | Nerede |
|---|---|
| Form düzeyi hata (ör. "E-posta veya parola hatalı") | Toast, `type: "error"` |
| Başarı bildirimi (ör. "Bağlantı gönderildi") | Toast, `type: "success"` |
| Uyarı ve bilgilendirme | Toast, `type: "warning"` / `"info"` |
| **İstisna:** alan düzeyi doğrulama | Girdinin hemen altında (`FieldError`) — sektör standardı, özellikle giriş formlarında |

- `ToastProvider` kök yerleşimdedir (`src/app/layout.tsx`), tüm ekranları kapsar.
- Sunucu eylemlerinin sonucu `useActionToast` ile toast'a çevrilir (`platform/ui/feedback/use-action-toast.ts`). Kanca, `useActionState`'in her gönderimde yeni nesne döndürmesine dayanır; böylece kullanıcı aynı hatayı iki kez alırsa toast yeniden görünür.
- Kullanıcının onaylaması gereken, akışı durduran durumlar toast değildir: `AlertDialog` kullanılır.
- Kalıcı ve bağlama gömülü bir durum anlatımı gerekiyorsa (ör. bir kaydın "taslak" olduğu bilgisi) bu bir mesaj değil, durum göstergesidir; `Badge` veya `Alert` uygundur.
