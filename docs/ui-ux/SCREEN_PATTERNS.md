# Standart Ekran Kalıpları: Liste, Detay, Form

Durum: CONFIRMED (sahip, 2026-09-19; alt bant bölümü D-228, 2026-09-20) · Son güncelleme: 2026-09-22

Ekran envanterindeki (`docs/ui-ux/SCREEN_INVENTORY.md`) her L, D ve F ekranı bu üç kalıptan birini kullanır (REQ-NFR-006, REQ-NFR-013…015). Kalıplar CHG-004 kabuğunun üzerine oturur: üst bar, açık kayıtta ikinci satır (bağlam satırı, D-064), çalışma katmanı ve telefonda alt çubuk (D-054…D-070) değişmez. Bileşenlerin hepsi projede kurulu COSS bileşenleridir; özel bileşen gerekmez (ADR-009). Kararlar: D-219.

Her kalıpta geçerli ortak kurallar:

- **Geri bildirim** toast'tır; alan hatası girdinin altında durur; akışı durduran onay `AlertDialog`'dur (`docs/ui-ux/DESIGN_SYSTEM_RULES.md` §13).
- **Yetki:** kullanıcının yapamayacağı eylem gösterilmez, pasif de bırakılmaz; ticari veya hassas alan izni olmayana hiç basılmaz, yeri boş kalmaz (REQ-IAM-011, REQ-SIT-001).
- **Durumlar:** ilk açılış, yükleniyor, boş, kısmi, hata, yetki yok, tekrar dene ve silme onayı her kalıpta tanımlıdır (aşağıda); ekran bazındaki farklar durum matrisinde yazılır (Phase 02 işi 2).
- **Sayılar:** finansal sayılar `Figure` ile, rakamlar mono ve eşit genişlikte (D-067).
- **Telefon:** 375 piksel genişlikte yatay kaydırma yoktur; dokunma alanı en az 44 pikseldir (REQ-NFR-008, REQ-SIT-035).

---

## 1. Liste kalıbı (REQ-NFR-013)

**Yerleşim (yukarıdan aşağıya)**

| Bölge | İçerik | COSS |
|---|---|---|
| Başlık satırı | Ekran adı; sağda birincil eylem "Yeni …" (yetkisi varsa) | `Button` |
| Özet şeridi | 2–4 küçük gösterge (ör. açık, geciken, bu ay); her biri tıklanınca listeyi süzer | `Frame` + `Figure` |
| Araç çubuğu | Arama · hızlı durum filtreleri · "Filtreler" · sıralama · görünüm (satır/kart) · yoğunluk (sık/ferah) · kayıtlı görünümler · dışa aktar | `Toolbar`, `InputGroup`, `ToggleGroup`, `Menu`, `Button` |
| Etkin filtreler | Seçili filtreler kaldırılabilir etiketler olarak; "Temizle" | `Badge` + `Button` |
| Liste | Satır görünümünde tablo; kart görünümünde kart ızgarası | `Table` / `Card` |
| Alt | Toplam kayıt sayısı ve sayfalama | `Pagination` |

**Davranış**

- **Arama** listenin kendi alanlarında arar; Türkçe harf farkına takılmaz ("sogut" → "Söğüt"). Site geneli arama ayrıdır (REQ-NFR-012).
- **Hızlı filtreler** en çok kullanılan 2–4 durumdur (ör. Tümü · Onay bekleyen · Geciken); tek tıkla seçilir.
- **Gelişmiş filtreler** masaüstünde yandan açılan `Sheet`, telefonda alttan açılan `Drawer` içindedir; durum, proje, işveren, tarih aralığı ve modüle özel alanlar (REQ-NFR-013).
- **Sıralama** tablo başlığına tıklayarak veya araç çubuğundaki menüden; tarih, tutar, durum, ad (modüle göre).
- **Satır / kart:** masaüstünde varsayılan satır, telefonda varsayılan kart; kullanıcı değiştirebilir.
- **Yoğunluk:** sık / ferah; yalnızca satır görünümünü etkiler.
- **Hatırlama:** görünüm, yoğunluk, sıralama ve filtreler ekran bazında kullanıcıya göre hatırlanır (REQ-NFR-013). Adı verilen hâl "kayıtlı görünüm" olur ve role paylaşılabilir (REQ-RPT-017).
- **Sayfalama:** masaüstünde sayfa numaraları ve sayfa başına kayıt seçimi; telefonda listenin sonunda "Daha fazla göster". Toplam kayıt sayısı her zaman görünür (D-219). Bileşen: `ListPagination` (`platform/ui/list`, DESIGN_SYSTEM_RULES §4.1 satır 20); ekranlar COSS sayfalama parçalarını doğrudan kullanmaz. Sayfa başına kayıt seçimi ve telefondaki "Daha fazla göster" ortak standart liste bileşeniyle (Faz 09) gelir; o zamana kadar telefonda önceki/sonraki ve "3 / 12" görünür.
- **Satıra tıklamak** detayı açar. Satırın kendi eylemleri sağdaki "…" menüsündedir (`Menu`); telefonda aynı eylemler `Drawer` menüsünde.
- **Toplu seçim** yalnızca toplu eylemi olan listelerde vardır (ör. toplu dışa aktarım); seçim olunca araç çubuğu toplu eylem çubuğuna döner.
- **Dışa aktarım** ekranda görülebilenden fazlasını içermez ve denetime yazılır (REQ-RPT-019).
- **İptal edilmiş kayıtlar** varsayılan olarak gizlenir; "İptal edilenleri göster" filtresiyle görünür (REQ-AUD-002).

**Durumlar**

| Durum | Ne görünür |
|---|---|
| Yükleniyor | Tablo veya kart iskeleti (`Skeleton`); araç çubuğu kullanılabilir |
| Boş (hiç kayıt yok) | `Empty`: ne olduğu, neden boş olduğu ve yetkisi varsa "Yeni …" düğmesi |
| Boş (filtre sonucu) | `Empty`: "Bu filtrelerle kayıt yok" ve "Filtreleri temizle" |
| Kısmi | Gelen kayıtlar gösterilir; eksik kalan bölüm için satır içi uyarı ve "Tekrar dene" |
| Hata | Toast ve listenin yerinde `Empty` benzeri hata alanı + "Tekrar dene" |
| Yetki yok | Menüde görünmez; doğrudan adresle gelinirse "Bu ekranı görme yetkiniz yok" ve "Bugün"e dönüş (REQ-NFR-007) |

## 2. Detay kalıbı (REQ-NFR-014)

**Yerleşim**

| Bölge | İçerik | COSS |
|---|---|---|
| Başlık alanı | Geri dönüş · kayıt adı · durum rozeti · kilit rakamlar (2–4) · "…" menüsü (seyrek eylemler: iptal et, dışa aktar, kopyala) | `Breadcrumb` veya geri `Button`, `Badge`, `Figure`, `Menu` |
| Alt bant | Kaydın birincil ve ikincil eylemleri (ör. "Hakedişi onaya sun", "Düzenle", "Revizyon talep et"); bölüm 4 (D-228) | `Button` |
| Bölüm sekmeleri | Büyük kayıtlarda üst barın ikinci satırında (D-064); her sekme kendi adresidir, paylaşılabilir | `Tabs` (bağlantı olarak) |
| Sekme içeriği | Aç/kapa alt bölümler; en önemlisi açık gelir | `Accordion` / `Collapsible` içinde `Frame` |
| Sabit bölümler | Her kayıtta: "Belgeler" ve "İşlem geçmişi" (REQ-DOC-001, REQ-AUD-001) | `Frame`, `Table` |

**Davranış**

- **Sekme mi, yalnız aç/kapa mı:** kaydın kendi alt kayıtları varsa (şantiye → günlük kayıtlar, stok, ekipman; proje → şantiyeler, revizyonlar, hakedişler; personel → puantaj, bordro, izin, zimmet) bunlar sekmedir. Küçük kayıtlarda (ör. bir izin, bir destek talebi) sekme yoktur, yalnız aç/kapa bölümler vardır (D-219).
- **Açık gelen bölüm:** kaydın durumuna göre en önemli olan (ör. onay bekleyen hakedişte kalemler, reddedilmiş kayıtta ret gerekçesi).
- **Kilitli kayıt:** onaylanmış kayıtta düzenleme düğmesi yoktur; yerine "Revizyon talep et" vardır; bekleyen revizyon varsa başlık alanında gösterilir (REQ-AUD-007…010).
- **Geçmiş:** "İşlem geçmişi" alan alan değişiklikleri kişi, zaman ve nedenle listeler; izni olmayan alanlarda yalnız "değişti" yazar (REQ-AUD-004).
- **İlgili kayıtlar** bağlantıdır: tıklanınca o kaydın detayı açılır (ör. hakedişten projeye, sevkiyattan siparişe).
- **Telefonda** kilit rakamlar ikişerli ızgaraya iner; sekmeler yatay kayan şerittir (DESIGN_SYSTEM_RULES §4.1 madde 17c); eylem menüsü `Drawer` olur.

**Durumlar:** yükleniyor (başlık ve bölüm iskeleti) · bulunamadı ("Kayıt bulunamadı veya iptal edildi" ve listeye dönüş) · yetki yok ("Bu kaydı görme yetkiniz yok" ve listeye dönüş; sahip kararıyla değişti, D-221; arama ve listelerde yetkisiz kayıt yine hiç görünmez, REQ-DOC-003) · kısmi (yüklenemeyen bölümde "Tekrar dene") · hata (toast + tekrar dene).

## 3. Form kalıbı (REQ-NFR-015)

**Nerede açılır (D-219)**

| Form | Masaüstü | Telefon |
|---|---|---|
| Kısa (birkaç alan: izin, hızlı kayıt, görev ver, not ekle) | `Dialog` | `Drawer` (alttan) |
| Uzun (hakediş, teklif, günlük kayıt, bordro, sözleşme) | Tam sayfa | Tam sayfa |

**Yerleşim ve davranış**

- **Gruplar:** alanlar mantıksal gruplara ayrılır (`Fieldset` + başlık); uzun formlarda gruplar aç/kapa olabilir, hatası olan grup açık gelir.
- **Alan:** her alan etiket, gerekirse açıklama ve hata alanıyla gelir (`Field`, `Label`, `FieldError`). Zorunlu alan etiketinde açıkça işaretlidir.
- **Yazmak yerine seçmek:** kısa sabit listelerde `Select` veya `RadioGroup`; uzun veya aranabilir listelerde `Combobox`; evet/hayır `Switch`; sayılar `NumberField`; tarihler `Calendar` açılan seçici; birim ve para birimi girdinin yanında (`InputGroup`).
- **Hesaplanan alanlar** giriş alanı değildir; yanında "hesaplanır" işaretiyle salt okunur gösterilir (ilke 8, `docs/architecture/PRINCIPLES.md`).
- **Akıllı öneri:** önerilen değer (ör. reçeteden tüketim, geçmiş maliyet) alanın içinde gelir; kullanıcı değiştirirse önerilen değer yanında görünmeye devam eder (REQ-SIT-029, REQ-QTE-005).
- **Taslak:** girilen her şey kendiliğinden taslak olarak saklanır; sayfa kapanıp açılınca değerler yerindedir (REQ-NFR-015, REQ-SIT-007). Kaydedilmemiş değişiklikle ayrılmaya çalışılırsa uyarı çıkar.
- **Kaydet çubuğu:** uzun formlarda alt banttır (bölüm 4): birincil eylem (ör. "Onaya gönder"), ikincil eylemler ("Taslak olarak bırak", seri girişte "Kaydet ve yeni ekle") ve varsa eksik alan sayısı.
- **Gönderim:** gönderirken düğme yükleniyor durumuna geçer ve ikinci gönderim engellenir; sunucu hatası toast'tır, alan hataları alanlarına dağıtılır ve ilk hatalı alana odaklanılır.
- **Eksik zorunlu alan** varken gönderilemez; denenirse eksikler grup grup listelenir (REQ-SIT-013).
- **Klavye:** sekme sırası görsel sırayla aynıdır; Enter kısa formda gönderir, uzun formda yalnız kaydet çubuğundaki düğmeyle gönderilir.

**Durumlar:** ilk açılış (taslak varsa geri yüklenir ve bu belirtilir) · kaydediliyor · kaydedildi (toast) · doğrulama hatası (alan altında) · sunucu hatası (toast + girişler korunur) · yetki yok (form açılmaz) · kilitli kayıt (form yerine "Revizyon talep et").

## 4. Alt bant (TASK-0028, D-228)

Uygulama kartının altında sabit duran işlevsel bant. İçerik altından kayar; içeriğe bandın yüksekliği kadar alt boşluk verilir, hiçbir şey arkasında kalmaz. Odaklanan öğe bandın altında kalmaz (`docs/ui-ux/ACCESSIBILITY.md`).

| Nerede | İçerik |
|---|---|
| Uzun form | Birincil eylem, ikincil eylemler, eksik alan sayısı |
| Detay ekranı | Kaydın birincil ve ikincil eylemleri; seyrek eylemler başlıktaki "…" menüsünde kalır |
| Günlük saha kaydı (SCR-021) | Geri · İleri · adım sayısı; son adımda gönder |
| Onay kuyruğu (SCR-012) | Onayla · Düzeltmeye gönder · Reddet |
| Liste, satır seçiliyken | Seçili sayısı ve toplu işlemler; seçim kalkınca bant kalkar |

- Yalnız eylemi olan ekranda bant vardır. Kullanıcının yapamayacağı eylem bantta da görünmez; hiç eylemi yoksa bant basılmaz.
- Birincil eylem sağdadır ve marka rengindedir. İkincil eylemler solundadır. Telefonda birincil eylem tam genişliğe yakındır, ikinciller "…" içine iner.
- **Telefonda** bant varken alt gezinme çubuğu gizlenir; altta yalnız bant durur. Geri ile çıkılınca çubuk geri gelir (D-228).
- Bileşenler: `Button`, `Menu` / `Drawer` (telefonda ikinciller), `Badge` (eksik sayısı). Kabuktaki yer, isteğe bağlı bir alt bant yuvasıdır (app shell). Phase 07'de kurulur.

---

## Özel kalıplar

Liste–detay–form dışında kalan ekranlar (envanterde "Ö" ve "P"): onay kuyruğu (D-070'te kuruldu), "Bugün" panosu (D-065), günlük saha kaydı tablosu (Phase 02 işi 4, REQ-SIT-035), nakit projeksiyonu, senaryolar, üretim zincirleri ve arşiv. Bunlar kendi ekran tasarımlarında bu belgedeki ortak kuralları kullanır.
