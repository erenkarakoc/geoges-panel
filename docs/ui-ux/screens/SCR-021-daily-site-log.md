# SCR-021 — Günlük Saha Kaydı Girişi

Durum: CONFIRMED (sahip, 2026-09-19) · Son güncelleme: 2026-09-19

Adres: `/daily-site-logs/[id]` · Tür: özel ekran · Roller: KO, SM, FO; TEB yalnız kendi bölümü (`docs/domain/PERMISSION_MATRIX.md`) · Kararlar: D-220.

Gereksinimler: REQ-SIT-002…030, REQ-SIT-033, REQ-SIT-035, REQ-EQP-011, REQ-INV-025. Onay kararı Onaylar kuyruğundadır (SCR-012, REQ-SIT-031). Kalıp: uzun form (`docs/ui-ux/SCREEN_PATTERNS.md` bölüm 3), özel tablo bölümleriyle.

## 1. Yerleşim

| Bölge | İçerik | COSS |
|---|---|---|
| Başlık | Şantiye adı · tarih · durum rozeti (taslak, onay bekliyor, düzeltmede, onaylandı) · "Geç girildi" rozeti (varsa) · giriş sorumlusu | `Badge` |
| Gün şeridi | Son günler yan yana; her günün durumu renk ve simgeyle (onaylı, onay bekliyor, düzeltmede, eksik, tatil, çalışma yok); en sağda eski günler için takvim | `ScrollArea` içinde `Button`, `Popover` + `Calendar` |
| Görünüm seçici | "Adım adım" / "Bölüm listesi" | `ToggleGroup` |
| İçerik | Seçili görünüme göre adım veya bölüm listesi | aşağıda |
| Kaydet çubuğu | Adım adım: "Geri" · "İleri" · adım sayısı; son adımda "Koordinatör onayına gönder". Bölüm listesi: "Koordinatör onayına gönder" ve eksik bölüm sayısı | kart altı sabit bant (TASK-0028), `Button`, `Progress` |
| Düzeltme uyarısı | Kayıt düzeltmeye geri gönderildiyse en üstte gerekçe ve hangi bölümün düzeltileceği | `Alert` |

## 2. İki görünüm (D-220)

- **Adım adım (varsayılan):** bölümler sırayla tek tek gelir. Kişi yalnız girmeye yetkili olduğu bölümleri görür; ör. formen için puantaj ve ekip. Her adımın altında "Bugün bu bölümde iş yok" seçeneği vardır ve bölümü boş ama tamamlanmış sayar; zorunlu bölümlerde bu seçenek yoktur. Son adım özettir: günün toplamları, uyarılar, eksikler ve gönder düğmesi.
- **Bölüm listesi:** aynı bölümler, her birinin durumu (boş, dolu, eksik, "iş yok") ve kimin girdiğiyle listelenir. Dokununca bölüm açılır, kaydedilince listeye dönülür. Birden fazla kişinin girdiği günlerde ve düzeltme sırasında hızlı erişim içindir.
- Kişinin seçtiği görünüm hatırlanır; her yeni kayıt o görünümle açılır (D-220'den türetilen kural, sahip onayladı).
- İki görünüm aynı veriyi gösterir; biri diğerinin kısayoludur.

## 3. Bölümler ve sırası

Sıra REQ-SIT-003'teki gibidir; ekrandaki sıra Tanımlar'dan değiştirilebilir. Her bölüm ayrı kaydedilir (REQ-SIT-003) ve girilen her satırda giren kişi görünür (REQ-SIT-005).

| # | Bölüm | İçerik ve kurallar |
|---|---|---|
| 1 | Başlangıç | Şantiye, tarih ve hava hazır gelir, düzenlenebilir; hava servisi yanıt vermezse elle girilir (REQ-SIT-006). Tatil değilse ve iş yapılmadıysa "Çalışma yok" + neden seçilir; bu seçilirse kalan bölümler atlanır (REQ-SIT-010). |
| 2 | Döküm | Panel tipi başına bir satır: tip, boyut, m²/adet, proje hedefi, bugüne kadar, kalan, ilerleme %, **bugün** (vurgulu `NumberField`). Altta gün toplamı adet ve m² olarak anında güncellenir; m² elle yazılmaz (REQ-SIT-014, REQ-SIT-015, REQ-SIT-035). "Seans ekle" ile çift döküm seansları: tip, adet, başlangıç, bitiş, ısıtma (REQ-SIT-016). Kurum onayı öncesi döküm işareti (REQ-SIT-017). Hedefi aşan satır kırmızıya döner ve açıklama alanı açılır; açıklamasız gönderilemez (REQ-SIT-018); komşu tip önerisi satırın altında görünür (REQ-SIT-019). |
| 3 | Montaj | Duvar, panel tipi, adet, m², başlangıç–bitiş; panel/saat ve m²/saat kendiliğinden hesaplanır (REQ-SIT-021). |
| 4 | Çelik şerit montajı | Duvar, şerit tipi, boy, adet, başlangıç–bitiş; toplam metre hesaplanır (REQ-SIT-022). |
| 5 | Harpuşta ve diğer kalemler | Proje tanımındaki birimle (adet veya metre) (REQ-SIT-023). |
| 6 | İşveren teslim-tesellüm | Dolguya teslim, dolgudan geri alma, beton talep/teslim, demir teslim saatleri; saat ve dakika (REQ-SIT-024). |
| 7 | Puantaj ve ekip | Öz kaynak personelin gün/saat ve izin/devamsızlık durumu (REQ-SIT-026); taşeron şantiyesinde puantaj yerine taşeron işçileri adlarıyla (REQ-SIT-028, REQ-SIT-034). |
| 8 | Faaliyet saatleri | Döküm, montaj, şerit ve dolgu başlangıç–bitiş (REQ-SIT-027). |
| 9 | Kullanılan ekipman | O an şantiyede bulunan ekipmanlardan seçim (REQ-EQP-011). |
| 10 | Tüketilen malzeme | Reçeteden önerilen miktar hazır gelir; girilen farklıysa fark işaretlenir ve önerilen yanında kalır (REQ-SIT-029, REQ-INV-025). |
| 11 | Zayi | Panel tipi, adet, neden, **fotoğraf** (kamera doğrudan açılır); fotoğrafsız satır eksik sayılır (REQ-SIT-020). |
| 12 | Saha harcaması | Tutar, konu, fiş/fatura fotoğrafı, açıklama; belgesiz harcama işaretlenir (REQ-SIT-030). |
| 13 | Notlar | Serbest metin. |
| 14 | Fotoğraflar | Günün genel fotoğrafları; kameradan doğrudan. |
| 15 | Özet ve gönderim | Günün toplamları, hedefe göre durum, uyarılar (fazla döküm, fark, belgesiz harcama), eksik zorunlu alanlar bölüm bölüm; "Koordinatör onayına gönder" (REQ-SIT-008, REQ-SIT-013). |

**Telefonda** döküm, montaj ve şerit tabloları kart görünümüne iner: her kartta tip, kalan ve büyük "bugün" girişi; toplam kartların altında sabit durur (REQ-SIT-035). 375 piksel genişlikte yatay kaydırma yoktur.

## 4. Davranış

- **Taslak:** her giriş kendiliğinden taslak olarak saklanır; telefon kapanıp açılınca kaldığı yerden devam edilir (REQ-SIT-007).
- **Aynı anda giriş:** iki kişi farklı bölümleri aynı anda girer, biri diğerinin girişini silmez (REQ-SIT-005). Aynı bölümü başka biri düzenliyorsa bölümün üstünde kimin düzenlediği yazar.
- **Gönderme** yalnız günün giriş sorumlusundadır; gönderilen kayıt salt okunur olur (REQ-SIT-005, REQ-SIT-008).
- **Geri çekme:** koordinatör karar vermeden önce gönderen "Geri çek" ile kaydı düzenlemeye açar; bu geçmişe yazılır (REQ-SIT-009).
- **Düzeltmeye dönen kayıt** gerekçesiyle açılır ve ilgili bölümden başlar.
- **Onaylı kayıt** kilitlidir; düzenleme yerine "Revizyon talep et" görünür (REQ-SIT-033).
- **Geç giriş:** süresi geçmiş günün kaydı girilebilir, "Geç girildi" rozeti kalıcıdır (REQ-SIT-011, REQ-SIT-012).
- **Gün şeridinde** eksik günler (tatil olmayan ve kayıt girilmemiş) belirgin renkle görünür; dokununca o günün kaydı açılır.

## 5. Durumlar

| Durum | Ne görünür |
|---|---|
| Yükleniyor | Başlık ve bölüm iskeleti; gün şeridi kullanılabilir |
| Bu gün için kayıt yok | "Bu günün kaydını başlat" düğmesi (yetkisi varsa); tatil gününde "Tatil — kayıt gerekmez" |
| Taslak | Görünüm seçici, bölümler, kaydet çubuğu |
| Onay bekliyor | Salt okunur; gönderen için "Geri çek" |
| Düzeltmede | Gerekçe uyarısı + düzenlenebilir bölümler |
| Onaylandı | Salt okunur, kilit simgesi; "Revizyon talep et" |
| Gönderilemedi (eksik) | Özet adımında eksikler bölüm bölüm, her biri bölüme bağlantı |
| Hava servisi yanıt vermedi | Hava alanı boş ve elle girilebilir; kayıt açılmaya devam eder |
| Bağlantı yok | "Bağlantı yok, girişler bu cihazda taslak olarak tutuluyor" uyarısı; gönderim bağlantı gelince yapılabilir (çevrimdışı giriş DEF-002 ile ertelendi) |
| Yetki yok | "Bu şantiyenin kaydını görme yetkiniz yok" |
| Hata | Toast; girişler korunur |

## 6. Bileşenler

`Badge`, `ToggleGroup`, `ScrollArea`, `Button`, `Popover`, `Calendar`, `Progress`, `Table`, `Card`, `NumberField`, `Combobox`, `Select`, `Input`, `Textarea`, `Field`, `Fieldset`, `Alert`, `Toast`, `Drawer` (telefonda fotoğraf önizleme ve satır eylemleri), `AlertDialog` (gönderim onayı değil; geri çekme ve iptal gibi geri dönülmez işlemler için). Fotoğraf girişi tarayıcının kamera açan dosya girişidir (`capture`), `Field` içinde. Özel bileşen gerekmez.
