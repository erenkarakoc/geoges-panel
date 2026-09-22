# Özel Ekranların Yerleşimi ve Bileşenleri

Durum: CONFIRMED (sahip, 2026-09-20) · Son güncelleme: 2026-09-20

Liste, detay ve form ekranları bileşenlerini kalıplardan alır (`docs/ui-ux/SCREEN_PATTERNS.md`). Bu belge, kalıba uymayan ekranların (envanterde Ö, P, S, Ç) yerleşimini ve kullandıkları COSS bileşenlerini yazar. Durumları `docs/ui-ux/SCREEN_STATES.md`'dedir. Bileşen adları projede kurulu COSS bileşenleridir (`src/components/ui`). `Figure` projenin sayı bileşenidir (D-067). "Grafik" onaylı özel öğedir (`docs/ui-ux/CUSTOM_ELEMENTS.md`, D-226).

Kendi belgesi olanlar burada tekrar edilmez:
- SCR-021 günlük saha kaydı: `docs/ui-ux/screens/SCR-021-daily-site-log.md`
- SCR-195…198 Yönetim, akışlar ve kayıt türleri: `docs/ui-ux/ADMINISTRATION.md`
- SCR-016 arama ve komut paleti: `docs/ui-ux/SEARCH.md`

Veri aktarımı (SCR-194) ertelenmiştir.

## İş katmanı ve hesap

| Ekran | Yerleşim | COSS bileşenleri |
|---|---|---|
| SCR-004 Rol yönlendirmesi | Yeni rol başına bir adım: rolün tanımı, sorumluluklar, ilk işler, kullanacağı ekranlar (bağlantı), zorunlu görevler; "Anladım, başla" | `Card`, `Progress`, `Button`, `Badge` |
| SCR-005 Hesabım | Kullanıcı menüsünden masaüstünde `Dialog`, telefonda `Drawer`. Bölümler: parola, iki adımlı doğrulama, vekâletim (başlangıç–bitiş, vekil), tema | `Dialog`, `Drawer`, `Tabs`, `Field`, `Input`, `OTPField`, `Combobox`, `Calendar`, `Switch` |
| SCR-010 Bugün | CHG-004'te kuruldu (D-065). Kişinin iş bloğu ve göstergeler. Her gösterge kartında küçük bir eğilim grafiği (D-226); karta tıklanınca dökümüne inilir | `Card`, `Frame`, `Tabs` (Sistem gözü sekmesi), `Badge`, `Figure`, grafik |
| SCR-011 Sistem gözü | Bugün'ün ikinci sekmesi. Zaman aralığı seçici; en önemli 5 sorun ve fırsat; sağlık karnesi başlıklarının renkleri | `Tabs`, `ToggleGroup`, `Card`, `Badge`, `Figure`, grafik |
| SCR-012 Onaylar | CHG-004'te kuruldu (D-070): tek kayıt ekranı doldurur, kararla sıradaki gelir. Üstte "Bekleyenler" ve "Revizyon talepleri" sekmeleri (SCR-192, D-223). Karar düğmeleri: onayla, düzeltmeye gönder, reddet; gerekçe `Dialog` içinde zorunlu | `Tabs`, `Card`, `Button`, `Dialog`, `Textarea`, `Badge`, `Empty` |
| SCR-015 Bildirim çekmecesi | Üst bardaki zilden. Masaüstünde `Popover`, telefonda `Drawer`. Türe göre süzme açılır listeyle (Tümü, Görevler, Onay ve düzeltme, Kritik; sahip isteği 2026-09-22); her bildirim kaynağına gider | `Popover`, `Drawer`, `Select`, `ScrollArea`, `Empty`, `Badge` |

## Saha, stok ve satın alma

| Ekran | Yerleşim | COSS bileşenleri |
|---|---|---|
| SCR-029 Kaynak eşleştirme | Solda atıl kaynaklar, sağda darboğazlar. Her eşleşme önerisi bir kart: gerekçe, nakliye ve yakıt maliyeti, beklenen üretim artışı, net kâr etkisi, kaynak şantiyenin yakın ihtiyacı. Kart eylemleri: onaya sun, gerekçeyle kapat | `Card`, `Frame`, `Badge`, `Figure`, `Button`, `Dialog`, `Accordion` (hesap dökümü) |
| SCR-030 Hızlandırma senaryoları | Senaryolar yan yana sütunlar: tahmini bitiş, ek maliyetler, kurtarılan maliyetler, net etki. Önerilen sütun işaretli, "önerilmez" olanın nedeni görünür ve seçilemez. Telefonda sütunlar yatay kaydırılmayan kartlara iner | `Table`, `Card`, `Badge`, `Figure`, `Button`, `Tooltip`, grafik (bitiş tarihleri) |
| SCR-040 Stok özeti | Özet şeridi; ana alan malzeme × lokasyon/süreç durumu tablosu (hammadde, işlemde, galvanizde, hazır, sahada). Kritik ve eksi stok vurgulu. Malzemeye tıklayınca SCR-041 | `Table`, `Toolbar`, `ToggleGroup` (lokasyon / süreç görünümü), `Badge`, `Figure`, grafik (tüketim eğilimi) |
| SCR-046 Şerit kombinasyonu | Üstte ihtiyaç (boy, adet). Altta önerilen kombinasyon: kullanılan boylar, fire, parça sayısı; alternatif kombinasyonlar aç/kapa. Stok yetmezse eksik için talep önerisi. Eylemler: onayla, değiştir | `Field`, `NumberField`, `Card`, `Table`, `Collapsible`, `Alert`, `Button` |
| SCR-047 Sarf | Malzeme tablosu: birim, bugün, bugüne kadar, kalan stok, kritik durum. Normalin üstündeki tüketim vurgulu | `Table`, `Badge`, `Figure`, `Toolbar`, grafik (normal aralık ile tüketim) |
| SCR-048 Fire ve hurda zinciri | Her fire partisi bir satır; zincir adımları (oluştu, tartıldı, hurdaya ayrıldı, satıldı, gelir yazıldı) yatay adım göstergesi. Özet: çıkan fire, satılan hurda, ortalama fiyat | `Table`, `Progress`, `Badge`, `Figure`, `Dialog` (tartım belgesi) |
| SCR-053 Tedarikçi karşılaştırması | Teklifler yan yana sütun: fiyat, termin, miktar/tonaj, teslim koşulu, belge. En iyi değerler işaretli; "Bu tedarikçiden sipariş ver" | `Table`, `Badge`, `Figure`, `Button`, `PreviewCard` (belge) |
| SCR-063 Vinç operatör ekranı | Telefon öncelikli. Atanmış vinçler kart olarak; seçilince günün kaydı: çalışma saati veya sayaç, yakıt ve fiş fotoğrafı, yapılan işler, arıza bildirimi | `Card`, `Field`, `NumberField`, `Input` (kamera), `Textarea`, `Button`, `Drawer` |

## Fabrika

| Ekran | Yerleşim | COSS bileşenleri |
|---|---|---|
| SCR-070 Fabrika ana görünümü | Özet şeridi (bugün işlenen şerit, lug, fire oranı, birim maliyet). Altta hammadde → işlemde → galvanizde → sevke hazır miktarları, makine durumları, bekleyen bakım | `Card`, `Frame`, `Figure`, `Badge`, `Table`, grafik |
| SCR-072 Üretim zincirleri | Şerit ve lug sekmeleri. Her parti bir satır; zincir adımları yatay adım göstergesi ve her adımın fire oranı | `Tabs`, `Table`, `Progress`, `Badge`, `Figure` |

## Finans ve strateji

| Ekran | Yerleşim | COSS bileşenleri |
|---|---|---|
| SCR-100 Finans ana ekranı | Finans sorularının her biri bir gösterge kartı (param nerede, alacaklar, borçlar, proje kâr/zarar, bu ay gelir/gider, yaklaşan nakit). Her kart dökümüne iner | `Card`, `Figure`, `Badge`, grafik |
| SCR-107 Nakit projeksiyonu | Üstte haftalık kümülatif nakit grafiği ve eşik çizgisi. Altta hafta sütunlu tablo: giriş, çıkış, net, kümülatif; satırlar kalem türüne açılır. Açık beklenen hafta vurgulu. "Planlı kalem ekle" | `Table`, `Collapsible`, `Figure`, `Badge`, `Dialog`, grafik |
| SCR-109 Muhasebe aktarımı | Ay seçici. Adımlar: dosyayı üret → indir → mutabakat sonucunu işaretle. Mutabakat farkları tablo | `Select`, `Button`, `Table`, `Badge`, `Alert` |
| SCR-110 Dönem kapanışı | Kapanış birimleri listesi (şantiyeler, fabrika, genel) ve her birinin durumu. Birim seçilince kontrol listesi: engelleyici kalemler bağlantılı. "Dönemi kapat" `AlertDialog` ile | `Table`, `Badge`, `Checkbox` (salt okunur işaret), `Alert`, `AlertDialog`, `Textarea` (yeniden açma gerekçesi) |
| SCR-111 Strateji | Sekmeler: Hedefler, Bütçe, Yatırım, Sağlık karnesi. Bütçede ay × maliyet merkezi tablosu ve sapma; enflasyona göre düzeltilmiş görünüm anahtarı. Sağlık karnesinde başlık başına renk kartı, nedenine açılır | `Tabs`, `Table`, `Switch`, `Card`, `Badge`, `Figure`, `Accordion`, grafik |

## İnsan kaynakları, uyum, performans ve arşiv

| Ekran | Yerleşim | COSS bileşenleri |
|---|---|---|
| SCR-122 Puantaj | Personel × gün tablosu (ay). Hücre: çalışıldı, izin, devamsız, saat. Satır sonunda toplamlar ve fazla mesai. Günlük kayıttan gelen hücreler salt okunur | `Table`, `ScrollArea`, `Select`, `Badge`, `Tooltip` |
| SCR-125 Giriş ve çıkış kontrol listeleri | Açık listeler; liste açılınca maddeler, sorumluları ve durumu; zimmet ve avans maddeleri kaynağına bağlı | `Table`, `Checkbox`, `Badge`, `Progress`, `Alert` |
| SCR-132 Gecikme dosyası | Solda gecikmeler zaman sırasıyla (tarih, süre, kanıt), sağda yazı taslağı önizlemesi; "Taslağı üret", "Gönderildi olarak işaretle" | `Table`, `Frame`, `Button`, `Badge`, `Dialog` |
| SCR-153 Sıralama | Benzer roller arasında olumlu ve operasyonel sıralama; kişinin kendisi vurgulu; alt sıralar isimsiz. Ticari veri yok | `Table`, `ToggleGroup` (rol), `Badge`, `Avatar` |
| SCR-170 Arşiv | Üstte arama; solda süzgeçler (tür, proje, tarih, kayıt), ana alanda belge listesi veya ızgara. Belge açılınca önizleme ve sürümler | `InputGroup`, `Sheet` / `Drawer` (süzgeçler), `Table`, `Card`, `ToggleGroup`, `Dialog` (önizleme), `Badge` |
| SCR-092 Teklif belgesi | Masaüstünde tam ekran `Dialog`: belge önizlemesi (tarayıcının PDF görüntüleyicisi), sağda gönderim bilgileri; "Gönder" | `Dialog`, `Drawer`, `Field`, `Button`, `Spinner` |
| SCR-191 Kullanıcılar & Roller | Yönetim içinde sekmeler: Kullanıcılar (liste kalıbı), Roller (hiyerarşi listesi, sıralama), Yetki tipleri, Vekâletler. Rol ataması `Dialog`: rol, kapsam (tüm şirket / şantiyeler / projeler), başlangıç–bitiş | `Tabs`, `Table`, `Dialog`, `Combobox`, `Calendar`, `Switch`, `Badge`, `AlertDialog` (hesabı pasife al) |
| SCR-190 Tanımlar | Yönetim içinde kendi ikinci düzey listesi (katalog adları). Her katalog liste kalıbındadır; kalem ekleme ve düzenleme kısa formdur. Kullanılan kalem pasifleşir | `Table`, `Dialog`, `Drawer`, `Field`, `Select`, `NumberField`, `Switch`, `Badge` |

Bu belge özel öğe gerektiren yeni bir ihtiyaç doğurmadı. Grafik ve akış şeması dışında her ekran COSS bileşenleriyle kuruluyor.
