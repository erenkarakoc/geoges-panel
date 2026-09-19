# Site İçi Arama

Durum: CONFIRMED (sahip, 2026-09-20) · Son güncelleme: 2026-09-20

Üst bardaki arama kutusu ve Ctrl+K (Apple klavyede ⌘K) ile açılan komut paleti (SCR-016). Gereksinim REQ-NFR-012; kararlar D-044 ve D-227; görev TASK-0029. Bileşen COSS `Command`'dır ve COSS örneğinin görünümü birebir korunur (D-060b). Kabuk bugün yalnız sayfa ve modül arıyor (`src/platform/ui/app-shell/command-palette.tsx`). Bu belge tam hâlini tarif eder; kayıt araması modüller geldikçe açılır.

## 1. Neyi arar

| Grup | Ne | Eşleşme |
|---|---|---|
| Ekranlar | Kişinin görebildiği her ekran ve modül | Ad, eş anlamlılar ("hakediş", "fatura") |
| İşlemler | Kişinin yapabildiği hızlı işlemler: "Yeni görev", "Bugünün kaydını başlat", "İzin talep et", "Hızlı kayıt"… (D-227) | Ad |
| Projeler ve şantiyeler | Proje, şantiye | Ad, kod, işveren |
| Firmalar | İşveren, tedarikçi, taşeron | Ad, vergi no |
| Kişiler | Personel ve kullanıcılar, kişinin kapsamı kadar | Ad; hassas alanlar hiçbir zaman |
| İş kayıtları | Teklif, sözleşme, sipariş, hakediş, fatura, talep, görev, toplantı kararı, destek talebi | Numara, başlık, firma |
| Stok ve varlık | Malzeme, varlık (vinç, araç, kalıp) | Ad, kod, plaka, seri no |
| Belgeler | Belge adı ve açıklaması | Ad, açıklama. **İçerik aranmaz** (D-227) |

- Grupların sonunda "Arşivde içerikte ara: …" satırı durur. Tıklanınca arşiv (SCR-170) aynı kelimeyle açılır ve orada PDF, Office ve taranmış belgelerin içinde aranır (REQ-DOC-004).
- Kullanıcı tanımlı kayıt türleri (pilot sonrası), tanımında "aramaya girsin" seçildiyse ayrı bir grup olur (REQ-WFL-037).
- Türkçe harf farkına takılmaz ("sogut" → "Söğüt"); bu kabukta var (`search-text.ts`).

## 2. Yetki (T1)

- Sonuç, kişinin görmeye yetkili olduğu kayıtlardan üretilir. Yetkisiz kayıt ne sonuç, ne sayı, ne "eşleşme var ama göremezsiniz" olarak görünür (REQ-NFR-012, REQ-DOC-003).
- Ticari veya hassas bir alan izni olmayan için aramaya hiç girmez. Örneğin maaşla, teklif tutarıyla veya sağlık raporuyla arama sonuç vermez (REQ-IAM-011).
- Sonuç satırında yalnız kişinin görebildiği alanlar yazar.
- Süzmenin nasıl yapılacağı (arama dizini mi, veritabanı sorgusu mu) Phase 03'ün işidir (TASK-0029).

## 3. Görünüm

- **Boş kutu:** son açılan 5 kayıt ve sık kullanılan işlemler.
- **Yazınca:** sonuçlar türe göre gruplu gelir; her grupta en iyi 5 sonuç ve "Tümünü gör" (D-227). "Tümünü gör", o türün liste ekranını arama kelimesiyle açar.
- **Satır:** tür simgesi · ad · ikincil bilgi (ör. şantiye, tarih, durum rozeti). Durum rozeti `Badge`'dir.
- **Alt bant:** tuş ipuçları (↑↓ seç, Enter aç, Esc kapat), COSS örneğindeki gibi (`Kbd`).
- **Telefon:** üst bardaki arama simgesi paleti tam ekran açar; klavye açıkken sonuçlar kaydırılabilir. İşlemler grubu en üsttedir.

## 4. Durumlar

| Durum | Ne görünür |
|---|---|
| Yükleniyor | Gruplar yerinde kısa iskelet; ekran ve işlem grupları beklemeden gelir, çünkü cihazda hazırdır |
| Sonuç yok | "Sonuç bulunamadı" ve "Arşivde içerikte ara: …" |
| Kısmi | Gelen gruplar gösterilir; yanıt vermeyen grup için "Bu grup yüklenemedi" ve "Tekrar dene" |
| Hata | Toast; ekran ve işlem aramaları çalışmaya devam eder |
| Bağlantı yok | Ekran ve işlem grupları çalışır; kayıt grupları yerine "Bağlantı yok" |

## 5. Bileşenler

`Command` (`CommandDialog`, `CommandInput`, `CommandPanel`, `CommandList`, `CommandGroup`, `CommandGroupLabel`, `CommandItem`, `CommandEmpty`, `CommandFooter`), `Kbd`, `Badge`, `Skeleton`. Telefonda ayrı bir `Drawer` kullanılmaz; aynı `CommandDialog` tam ekran açılır. Özel öğe gerekmez.
