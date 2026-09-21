# Yönetim Sayfası ve Akış Tasarımcısı

Durum: CONFIRMED (sahip, 2026-09-19) · Son güncelleme: 2026-09-22

D-108'in ertelediği yerleşim turu. Akış tasarımcısı, şablonlar, yeni akışlar, çalışma günlüğü ve kayıt türü oluşturucunun menüdeki yeri ve nasıl çalıştığı burada yazılır. Kararlar: D-223. Gereksinimler: REQ-WFL-001…011, REQ-WFL-017…030, REQ-WFL-033…039.

## 1. Yönetim sayfası

**Giriş.** Menüdeki "Yönetim" grubu kalkar. Yerine üst barın sağındaki **kullanıcı menüsünde "Yönetim"** girişi olur. Bu giriş, sayfanın en az bir bölümünü görme yetkisi olana görünür, diğerlerine hiç görünmez. Menü şeridinde dört modül grubu kalır.

**Düzen.** Sayfanın solunda kendi gruplu alt menüsü, sağında seçili bölüm vardır. Telefonda alt menü bir listedir; dokununca bölüm açılır, geri ile listeye dönülür. Sayfa açılınca kişinin görebildiği ilk bölüm gelir.

| Alt menü grubu | Bölüm | Ekran | Adres |
|---|---|---|---|
| Kişiler ve yetki | Kullanıcılar & Roller | SCR-191 | `/admin/users-roles` |
| Tanımlar | Katalog, reçete, takvim, kur, bordro parametreleri, KPI kataloğu, teklif şablonları, kontrol listeleri, eşikler | SCR-190 | `/admin/master-data` |
| İş akışları | Akışlar · Şablonlar · Yeni akışlar | SCR-195 | `/admin/workflows` |
| | Çalışma günlüğü | SCR-197 | `/admin/workflows/runs` |
| Kayıt türleri | Kayıt türü oluşturucu (pilot sonrası, D-105; o zamana kadar görünmez) | SCR-198 | `/admin/record-types` |
| Kayıtlar | Denetim kayıtları | SCR-193 | `/audit-log` |

Akış tasarımcısı (SCR-196) bir akış açılınca tam sayfa açılır: `/admin/workflows/[id]`. Veri aktarımı (SCR-194) ertelenmiştir; açıldığında bu sayfaya girer.

**Revizyon talepleri** (SCR-192) Yönetim'e girmez. Onaylar ekranında "Revizyon talepleri" sekmesi olur (`/approvals/revision-requests`). Talep eden kendi taleplerini de orada görür (REQ-WFL-012).

Menü kaydı (navigation registry) bu değişikliği Phase 07'de kurar.

## 2. İş akışları (SCR-195)

Liste kalıbı (`docs/ui-ux/SCREEN_PATTERNS.md` bölüm 1), üç sekmeyle:

- **Akışlar.** Sütunlar: ad, tetik, durum (taslak, yayında, kapalı), sürüm, son yayın (kim, ne zaman), kaynak şablon. Rozetler: ilk 7 gün "yeni" (REQ-WFL-023); şablonun yeni sürümü varsa "yeni sürüm var" (REQ-WFL-027). Birincil eylem: "Yeni akış". Boş başlangıç yerine "Şablondan başla" da sunulur.
- **Şablonlar.** Varsayılan şirket akışları (REQ-WFL-028) ve dış taraf onayı alt akışı (REQ-WFL-018). Her şablonda "Kopyasını kullan"; kullanılan kopyada "Şablona sıfırla".
- **Yeni akışlar.** Son 7 günde yayımlanan akışlar ve o süre içinde yaptıkları işlemler (REQ-WFL-023): hangi kayıtta hangi görevi açtı, kime bildirim gitti, hangi durumu değiştirdi.

## 3. Akış tasarımcısı (SCR-196)

**Masaüstü.**

| Bölge | İçerik |
|---|---|
| Başlık | Akışın adı · sürüm · durum rozeti · "Deneme çalıştır" · "Yayımla" · "…" (kopyala, kapat, sürüm geçmişi) |
| Şema (ana alan) | Kutu-ok şeması. Her kutu bir adımdır (REQ-WFL-005'teki on dört türden biri). İki kutu arasındaki "+" yeni adım ekler ve adım türlerinin listesini açar. Onay kutusunun üç çıkışı ayrı oklardır (onayla, reddet, düzeltmeye geri gönder); geri giden ok serbesttir (REQ-WFL-014). |
| Yan panel | Kutuya tıklanınca o adımın soruları açılır: "Ne olunca başlasın?", "Kim onaylasın?", "Onaylanmazsa ne olsun?" (REQ-WFL-026). Paneldeki değişiklik şemada anında görünür, şemadaki değişiklik panelde. |
| Hata işaretleri | Eksik veya hatalı adım kutuda işaretlenir (ör. sahibi seçilmemiş onay, çıkışı olmayan koşul). Hata varken deneme çalıştırılamaz. |

**Telefon.** Tam düzenleme vardır. Şema tam ekrandır. Bir kutuya dokununca o adımın soruları alttan açılan panelde gelir. İki kutu arasındaki "+" ile yeni adım eklenir. Deneme çalıştırması ve yayın telefondan da yapılır.

**Deneme çalıştırması** (REQ-WFL-025). Örnek bir kayıt seçilir. Sonuç, her adımın kime düşeceğini, koşulların gerçek veri üzerindeki sonucunu (REQ-WFL-008) ve üretilecek görev ve bildirimleri adım adım gösterir. Hiçbir gerçek kayıt oluşmaz. Son denemeden sonra akış değiştiyse "Yayımla" yeniden deneme ister.

**Yayın** (REQ-WFL-023, REQ-WFL-024). Yayımlamadan önce onay penceresi özetler: bu sürümde ne değişti, yürüyen kaç örneğin eski sürümle devam edeceği, sahibe bildirim gideceği. Yayın denetim kaydına yazılır.

**Yetki.** Tasarımcıyı yalnız akış tasarlama yetkisi olan açar; bu yetki yalnız tam görünürlüklü rollere verilebilir (REQ-WFL-019). Tasarım sırasında yeni yetki tipi ve rol tanımlanabilir ve atanabilir (REQ-WFL-021).

**Özel bileşen.** COSS'ta kutu-ok şeması bileşeni yoktur. Şema alanı özel bir arayüz öğesidir (ADR-009); sahip 2026-09-19'da onayladı (D-224). Yan panel, alt panel, menüler, pencereler ve formlar COSS bileşenleridir (`Sheet`, `Drawer`, `Menu`, `AlertDialog`, `Field`, `Select`, `Combobox`, `NumberField`).

## 4. Çalışma günlüğü (SCR-197)

Yalnız Yönetim > İş akışları içindedir; akış tasarlama yetkisi olanlar görür (D-223).

- **Liste:** akış, sürüm, tetikleyen olay ve kayıt, başlangıç, durum (yürüyor, bekliyor, bitti, hata ile durdu), şu an beklediği adım ve kişi. Süzgeçler: akış, durum, tarih, kayıt.
- **Detay:** adımların zaman çizelgesi. Her adımda sonuç, kime düştüğü, ne zaman, ne kadar beklediği. Hata ile duran örnekte hatanın nedeni (ör. koşul sorgusu süreyi aştı, REQ-WFL-008).

**"Neden bende" (REQ-TSK-008, REQ-WFL-033).** Akış tasarlama yetkisi olmayan kişi, görevde veya bildirimde akışın ve adımın adını ve kişiye hangi kuralla geldiğini **yazı olarak** görür, kayda ise bağlantıyla gider. Örnek: "Bu görev 'Hakediş → fatura' akışının 'Faturayı kes' adımından, 'projenin hakediş sorumlusu' kuralıyla geldi." Akış tasarlayan kişi ayrıca çalışma günlüğündeki örneğe gider.

## 5. Kayıt türleri (SCR-198, pilot sonrası)

Oluşturucu Slice 1 pilotundan sonra yapılır (D-105); ayrıntılı ekran tasarımı o zaman gerçek kullanıma göre yapılır. Buradan bağlayıcı olanlar:

- Tanımlanan tür, tanımlanırken **seçilen modül grubunda** görünür ve oradaki ekranlar gibi davranır; kullanıcı hazır türle sonradan tanımlananı ayırt etmez (D-223).
- Tanım adımları: ad ve menüdeki grup · alanlar · başka kayıtlarla ilişkiler · ekran düzeni (standart liste, detay ve form kalıpları) · yetki (rol bazlı okuma-yazma, şantiye bazlı görünürlük, hassas alan; REQ-WFL-036) · arama, rapor ve "Bugün" katılımı (REQ-WFL-037).
- Tür değişince geçmiş korunur (REQ-WFL-038); tür deftere yazmaz (REQ-WFL-039).
