# REQ-NFR — Temel İlkeler, Uyarı Kataloğu, Arayüz Standartları ve Platform

Durum: CONFIRMED (sahip, 2026-09-19) · 2026-09-19 · Modül: NFR (Non-functional & cross-cutting)

Kaynaklar: kararlar D-044, D-051, D-054…D-070, D-132, D-209…D-212; DEF-002, DEF-003.

**Sınır.** Menü, üst bar, "Bugün" ve alt çubuk kararları CHG-004'te verildi (D-054…D-070) ve burada yeniden açılmaz. Ekran envanteri, ekran durum matrisi ve ayrıntılı liste/detay/form tasarımı Phase 02'dedir. Parola kuralları ve hesap kilidi OQ-026 ile Phase 03 güvenlik tasarımında belirlenir. Çevrimdışı giriş (DEF-002) ve yerel mobil uygulama (DEF-003) ertelenmiştir. Günlük saha tablosunun kendisi REQ-SIT-035'tedir.

Terimler (`docs/domain/GLOSSARY.md`): Attention Item, Today Screen, Owner Cockpit, Indicator, Catalog Item.

---

## A. Temel ilkeler

### REQ-NFR-001 — Kaydı olmayan iş tamamlanmış sayılmaz

- Kaynak: Özellik Yapısı (eşleme: `docs/requirements/README.md`)
- Öncelik: Must · Kademe: T1
- Katman: Sabit
- Açıklama: Panelin ana ilkesi: sistemde kaydı olmayan iş tamamlanmış sayılmaz. Bir işin tamamlanması; kaydı ve gerekiyorsa belgesi, fotoğrafı, saati, miktarı, sorumlusu ve onayıyla birlikte olur.
- Kabul kriterleri:
  - [ ] Hiçbir görev, onay veya kayıt, kişi ve zaman bilgisi olmadan "tamamlandı" durumuna geçemez.
- Durum: CONFIRMED

### REQ-NFR-002 — Tek resmi kayıt ve arşiv

- Kaynak: REQ-DOC-009
- Öncelik: Must · Kademe: T1
- Katman: Sabit
- Açıklama: Panel şirketin tek resmi kayıt ve arşiv sistemidir. Drive, Excel veya WhatsApp paralel kayıt yeri olarak kullanılmaz; iş verisi sistem dışı araçlarda tutulmaz.
- Kabul kriterleri:
  - [ ] Her modülün verisi panelin kendi veritabanında ve depolamasında tutulur; dış araçtaki bir dosyaya bağlantı kayıt yerine geçmez.
- Durum: CONFIRMED

### REQ-NFR-003 — Dış kaynak yokken panel çalışmaya devam eder

- Kaynak: REQ-ADM-013, REQ-SIT-006
- Öncelik: Must · Kademe: T1
- Katman: Sabit
- Açıklama: Bulut servisleri ve dış veri kaynakları (hava durumu, TCMB kuru, resmi endeksler) kullanılabilir. Bir kaynağa erişilemediğinde panel çalışmaya devam eder: hava durumu gibi bilgilerde son alınan değer veya elle giriş kullanılır. **Kur için REQ-ADM-013 geçerlidir:** kur alınamazsa dövizli işlem "kur bekliyor" işaretlenir, sessizce eski kurla hesaplanmaz.
- Kabul kriterleri:
  - [ ] Hiçbir dış kaynağın kesintisi kayıt girişini veya onayı durdurmaz.
  - [ ] Son alınan değerle yapılan her gösterim, değerin tarihini belirtir.
- Durum: CONFIRMED

### REQ-NFR-004 — Yönetimin soruları panelden cevaplanır

- Kaynak: Özellik Yapısı (eşleme: `docs/requirements/README.md`)
- Öncelik: Must · Kademe: T1
- Katman: Sabit
- Açıklama: Panelin nihai işlevi, sahibin her şeyi insanlara sormak yerine sistemden okumasıdır. 'daki 26 yönetim sorusunun her biri (bugün hangi şantiyede ne yapıldı, neden bu proje zararda, önümüzdeki haftalarda nakit açığı olacak mı, şirketin en önemli 5 problemi/fırsatı ne vb.) kayıtlı veri, görev, belge, onay ve analiz üzerinden cevaplanır.
- Kabul kriterleri:
 - [ ] Phase 02 ekran envanteri, 'daki her soruyu cevaplayan ekranı veya raporu adıyla gösterir; cevapsız soru kalmaz.
- Durum: CONFIRMED

## B. Uyarı kataloğu

### REQ-NFR-005 — Merkezi uyarı kataloğu

- Kaynak: REQ-RPT-007, REQ-RPT-009
- Öncelik: Must · Kademe: T1
- Katman: Sabit + Tanım
- Tanımla ayarlanan: uyarıların eşikleri (ör. "yüksek zayi", "olağan dışı gider", "riskli cari bakiye")
- Açıklama: 'daki uyarılar (saha, stok/malzeme, ekipman, finans, İK, uyum/hukuk, kalite/İSG, yönetim başlıklarında) tek bir merkezi uyarı sistemine bağlıdır. Her uyarı, onu üreten modülün kataloğundaki bir olay veya koşul alanına dayanır; eşikleri merkezi kuraldır.
- Kabul kriterleri:
 - [ ] 'daki her uyarı, bir modül kataloğundaki olaya veya koşul alanına eşlenmiş olarak listelenir; eşlenmemiş uyarı kalmaz (Phase 03 sözleşme testleri).
- Durum: CONFIRMED

## C. Arayüz

### REQ-NFR-006 — Her modülde aynı kullanım dili

- Kaynak: Özellik Yapısı (eşleme: `docs/requirements/README.md`)
- Öncelik: Must · Kademe: T1
- Katman: Sabit
- Açıklama: Bütün modüller aynı kullanım dilindedir; kullanıcı her sayfada kullanımı yeniden öğrenmez. Arayüz yalnızca COSS UI ve Tailwind ile kurulur; özel bileşen sahibin onayıyla eklenir.
- Kabul kriterleri:
  - [ ] Liste, detay ve form ekranları REQ-NFR-013…015 şablonlarını kullanır.
- Durum: CONFIRMED

### REQ-NFR-007 — Yetkisiz modül menüde görünmez

- Kaynak: D-051, D-054
- Öncelik: Must · Kademe: T1
- Katman: Sabit
- Açıklama: Modüller menüde iş akışı, kullanım sıklığı ve kurumsal mantığa göre gruplanır (düzen D-051 ve D-054'tedir). Kullanıcının yetkisi olmayan modül menüde görünmez; bir grubun altında yetkili öğe yoksa grup başlığı da gizlenir.
- Kabul kriterleri:
  - [ ] Yetkisiz bir modülün adresine doğrudan gidildiğinde de erişim reddedilir.
- Durum: CONFIRMED

### REQ-NFR-008 — Telefonda kullanım

- Kaynak: D-132; DEF-002, DEF-003
- Öncelik: Must · Kademe: T1
- Katman: Sabit
- Açıklama: Panel telefonun ana ekranına kurulabilen web uygulaması olarak kullanılır. Saha gibi günlük alanlar büyük dokunma hedefleri, az yazı ve hızlı girişle çalışır. Görev, onay ve kritik uyarılar telefona anında bildirim olarak gelir; fiş, tutanak ve saha fotoğrafları doğrudan kamerayla eklenir. Çevrimdışı giriş (DEF-002) ve yerel mobil uygulama (DEF-003) ertelenmiştir.
- Kabul kriterleri:
  - [ ] 375 piksel genişlikte hiçbir ekran yatay kaydırma gerektirmez.
  - [ ] Fotoğraf alanı telefonda doğrudan kamerayı açar.
- Durum: CONFIRMED

### REQ-NFR-009 — Üst bar

- Kaynak: D-055
- Öncelik: Must · Kademe: T2
- Katman: Sabit
- Açıklama: Üst bar üç bölgelidir (D-055): solda bulunulan yer, ortada arama ve komut paleti, sağda role özgü ana eylem, bildirimler ve kullanıcı menüsü.
- Kabul kriterleri:
  - [ ] Bildirim sayacı yalnızca okunmamış bildirimleri sayar (REQ-TSK-009).
- Durum: CONFIRMED

### REQ-NFR-010 — Açık ve koyu görünüm

- Kaynak: Özellik Yapısı (eşleme: `docs/requirements/README.md`)
- Öncelik: Must · Kademe: T2
- Katman: Sabit
- Açıklama: Panel açık ve koyu görünümde kullanılır; seçim kullanıcıya göre hatırlanır.
- Kabul kriterleri:
  - [ ] Her iki görünümde de metin kontrastı WCAG 2.2 AA'yı karşılar.
- Durum: CONFIRMED

### REQ-NFR-011 — Kurumsal kimlik ve durum renkleri

- Kaynak: Özellik Yapısı (eşleme: `docs/requirements/README.md`)
- Öncelik: Must · Kademe: T2
- Katman: Sabit
- Açıklama: Ana mavi #0F4C81, ikincil gri #DDDBDB. Durum renkleri marka renginden bağımsızdır: yeşil olumlu/onaylı/kâr, amber dikkat, kırmızı kritik/zarar/gecikme, nötr gri pasif/hazırlık. Final tasarımda doğru GEOGES logo dosyası kullanılır.
- Kabul kriterleri:
  - [ ] Durum yalnızca renkle anlatılmaz; metin veya simgeyle de belirtilir.
- Durum: CONFIRMED

### REQ-NFR-012 — Site geneli arama

- Kaynak: D-044
- Öncelik: Must · Kademe: T1
- Katman: Sabit
- Açıklama: Üst bardan ve klavye kısayoluyla açılan komut paleti bütün modüllerde arar. Sonuçlar kullanıcının yetkisine ve veri sınıfına göre süzülür.
- Kabul kriterleri:
  - [ ] Ticari veya hassas veri, izni olmayan kullanıcının aramasında ne sonuç ne eşleşme olarak görünür.
- Durum: CONFIRMED

## D. Standart ekranlar

### REQ-NFR-013 — Standart liste ekranı

- Kaynak: Özellik Yapısı (eşleme: `docs/requirements/README.md`)
- Öncelik: Must · Kademe: T2
- Katman: Sabit
- Açıklama: Liste ekranında başlık, "Yeni" düğmesi, arama, hızlı durum filtreleri, küçük özet göstergesi ve kayıt listesi bulunur. Kullanıcı satır ve kart görünümü arasında geçer; modüle göre tarih, tutar, durum veya ada göre sıralar; sık veya ferah yoğunluk seçer; durum, proje, işveren, tarih aralığı ve modüle özel gelişmiş filtreler kullanır.
- Kabul kriterleri:
  - [ ] Görünüm, sıralama ve filtre tercihleri ekran bazında hatırlanır.
- Durum: CONFIRMED

### REQ-NFR-014 — Standart detay ekranı

- Kaynak: Özellik Yapısı (eşleme: `docs/requirements/README.md`)
- Öncelik: Must · Kademe: T2
- Katman: Sabit
- Açıklama: Detay ekranının üstünde başlık, durum, geri dönüş, yapılabilecek eylemler ve kilit rakamlar bulunur. Alt bölümler açılıp kapanır; en önemli bölüm varsayılan açıktır. Her detay ekranında belgeler ve işlem geçmişi bölümü vardır.
- Kabul kriterleri:
  - [ ] Kullanıcının yetkisi olmayan eylem, detay ekranında gösterilmez.
- Durum: CONFIRMED

### REQ-NFR-015 — Standart veri giriş formu

- Kaynak: Özellik Yapısı (eşleme: `docs/requirements/README.md`)
- Öncelik: Must · Kademe: T2
- Katman: Sabit
- Açıklama: Formlar mantıksal gruplara ayrılır; zorunlu alanlar açıkça işaretlenir; mümkün olan yerde yazmak yerine seçim (açılır liste, düğme, sayaç, anahtar) kullanılır; hesaplanan alanlar kendiliğinden dolar; akıllı öneriler sunulur; taslak kendiliğinden kaydedilir; kaydet düğmesine her zaman erişilir; seri kayıt için "Kaydet ve yeni ekle" vardır.
- Kabul kriterleri:
  - [ ] Yarım kalan form yeniden açıldığında girilen değerler yerindedir.
- Durum: CONFIRMED

### REQ-NFR-016 — Erişilebilirlik

- Kaynak: MASTER_ROADMAP Phase 02
- Öncelik: Must · Kademe: T1
- Katman: Sabit
- Açıklama: Arayüz WCAG 2.2 AA düzeyini hedefler: klavyeyle kullanım, ekran okuyucu etiketleri, yeterli kontrast, en az 44 piksel dokunma alanı.
- Kabul kriterleri:
  - [ ] Her ekran klavyeyle baştan sona kullanılabilir.
- Durum: CONFIRMED

## E. Platform

### REQ-NFR-017 — Yalnızca Türkçe arayüz

- Kaynak: D-211
- Öncelik: Must · Kademe: T2
- Katman: Sabit
- Açıklama: Arayüz, üretilen belgeler ve bildirimler Türkçedir. Kod, veritabanı ve API adları İngilizcedir; bu yüzden ileride dil eklemek mümkün kalır.
- Kabul kriterleri:
  - [ ] Arayüz metinleri koda gömülmez; tek bir metin kaynağından gelir.
- Durum: CONFIRMED

### REQ-NFR-018 — En fazla 1 saatlik veri kaybı

- Kaynak: D-209
- Öncelik: Must · Kademe: T1
- Katman: Sabit
- Açıklama: Büyük bir arızada en fazla son 1 saatte girilen veri kaybolabilir (RPO ≤ 1 saat). Veritabanı ve belgeler buna göre yedeklenir; yedek sunucudan ayrı bir yerde tutulur.
- Kabul kriterleri:
  - [ ] Yedekten geri dönüş denemesinde kayıp, 1 saati aşmaz.
- Durum: CONFIRMED

### REQ-NFR-019 — En fazla 4 saatlik kesinti

- Kaynak: D-210; REQ-DOC-010
- Öncelik: Must · Kademe: T1
- Katman: Sabit
- Açıklama: Büyük bir arızada panel en fazla 4 saat içinde yeniden çalışır (RTO ≤ 4 saat). Geri dönüş adımları yazılı ve denenmiştir.
- Kabul kriterleri:
  - [ ] Canlıya geçmeden önce geri dönüş baştan sona denenmiş ve süresi kaydedilmiştir.
- Durum: CONFIRMED

### REQ-NFR-020 — 50–150 kullanıcı için boyutlandırma

- Kaynak: D-212
- Öncelik: Must · Kademe: T2
- Katman: Sabit
- Açıklama: Altyapı ve maliyet, iki yıl içinde 50–150 giriş yapan kullanıcıya göre boyutlandırılır (yönetim, ofis, mühendis, koordinatör, formen ve taşeron ekip başları).
- Kabul kriterleri:
  - [ ] Phase 05 maliyet tahmini ve Phase 06 yük denemesi 150 kullanıcıyla yapılır.
- Durum: CONFIRMED

---

## Yetenek kataloğu — NFR

Biçim: `docs/requirements/README.md`.

### Olaylar

Yok. NFR kesişen ilkeleri tanımlar; olaylar ilgili modüllerdedir.

### Aksiyonlar

Yok.

### Koşul alanları

Yok.
