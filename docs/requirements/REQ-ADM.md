# REQ-ADM — Tanımlar, Kataloglar, Çalışma Takvimi ve Döviz Kuru

Durum: CONFIRMED (sahip, 2026-09-18) · 2026-09-18 · Modül: ADM (Master Data & Settings)

Kaynaklar: (kur), REQ-SIT-014, REQ-SIT-022 (tip tanımları); ADR-005; kararlar D-139…D-141.

**Sınır.** 'deki listede ADM'e ait olmayanlar da var; bunlar kendi modüllerinde tutulur ama aynı "Tanımlar" alanından ulaşılır: roller (REQ-IAM), onay zincirleri ve eskalasyon kuralları (REQ-WFL, REQ-TSK), tedarikçiler (REQ-PUR), teklif belge şablonları (REQ-QTE), KPI kataloğu ve puan bantları (REQ-PRF), revizyona tabi kayıt türleri (REQ-AUD). Çoklu para birimiyle muhasebe ve cari REQ-FIN'dedir; ADM yalnızca kuru sağlar. Veri aktarımı ertelendi (DEF-001).

Terimler (`docs/domain/GLOSSARY.md`): Catalog Item, Panel Type, Strip Type, Consumption Recipe, Unit Price, Custom Field, Working Calendar, Exchange Rate.

---

## A. Merkezi tanımlar

### REQ-ADM-001 — Tanımlar tek yerden yönetilir

- Kaynak: Özellik Yapısı (eşleme: `docs/requirements/README.md`)
- Öncelik: Must · Kademe: T2
- Katman: Sabit + Tanım
- Tanımla ayarlanan: listelenen tanımların hepsi
- Açıklama: Yetkili kullanıcı şu tanımları tek yerden yönetir: panel tipleri, çelik şerit tipleri ve boyları, iş kalemleri, birimler, sarf malzemeler, sarf reçeteleri, gider kategorileri, birim fiyat tanımları, kritik stok eşikleri ve çalışma takvimi. Aynı bilgi farklı yerlerde tekrar yazılmaz; her modül tanımı buradan okur.
- Kabul kriterleri:
  - [ ] Bu tanımların hiçbiri başka bir ekranda ayrıca girilmez; diğer ekranlar yalnızca seçer.
- Durum: CONFIRMED

### REQ-ADM-002 — Panel tipi tanımı

- Kaynak: REQ-SIT-014
- Öncelik: Must · Kademe: T2
- Katman: Sabit + Tanım
- Tanımla ayarlanan: panel tipleri
- Açıklama: Her panel tipi için ad/kod, en, boy, bir panelin m²'si ve gerektiğinde kademe/komşu panel ilişkisi tanımlanır. m² en ve boydan hesaplanır.
- Kabul kriterleri:
  - [ ] Panel tipinin m²'si elle girilmez.
  - [ ] Komşu tip ilişkisi, fazla panel önerisinin (REQ-SIT-019) kullandığı sırayı verir.
- Durum: CONFIRMED

### REQ-ADM-003 — Çelik şerit tipi tanımı

- Kaynak: REQ-SIT-022
- Öncelik: Must · Kademe: T2
- Katman: Sabit + Tanım
- Tanımla ayarlanan: şerit tipleri ve boyları
- Açıklama: Şerit tipleri (ör. 40×4, 50×4, 50×5) genişlik, kalınlık, delik sayısı ve standart boylarıyla tanımlanır.
- Kabul kriterleri:
  - [ ] Şerit montajında yalnızca tanımlı tipler ve boylar seçilebilir.
- Durum: CONFIRMED

### REQ-ADM-004 — Sarf reçeteleri

- Kaynak: REQ-SIT-015, REQ-SIT-029, REQ-SIT-035; REQ-SIT-029
- Öncelik: Must · Kademe: T1
- Katman: Sabit + Tanım
- Tanımla ayarlanan: sarf reçeteleri
- Açıklama: Sarf reçetesi, bir birim üretim için hangi sarf malzemeden ne kadar kullanıldığını tanımlar; günlük kayıttaki tüketim önerisi buradan hesaplanır.
- Kabul kriterleri:
  - [ ] Reçete değişikliği, geçerlilik tarihinden önceki günlerin tüketimini değiştirmez (REQ-ADM-007).
- Durum: CONFIRMED

### REQ-ADM-005 — Genel veya projeye özel tanım

- Kaynak: Özellik Yapısı (eşleme: `docs/requirements/README.md`)
- Öncelik: Must · Kademe: T2
- Katman: Sabit + Tanım
- Tanımla ayarlanan: tanımın genel mi projeye özel mi olduğu
- Açıklama: Bir tanımın tüm projeler için mi yoksa belirli bir proje için mi geçerli olduğu seçilir. Projeye özel tanım yalnızca o projede görünür ve genel tanımdan önce gelir.
- Kabul kriterleri:
  - [ ] Projeye özel bir birim fiyat, o projenin hesaplarında genel fiyatın yerine kullanılır.
- Durum: CONFIRMED

### REQ-ADM-006 — Kendini geliştiren ortak listeler

- Kaynak: D-139
- Öncelik: Must · Kademe: T2
- Katman: Sabit + Tanım
- Tanımla ayarlanan: ortak liste kalemleri ve birleştirmeler
- Açıklama: Kullanıcı yeni bir gider veya malzeme kalemi girmek istediğinde sistem önce benzer mevcut kalemleri gösterir ("Nakliye", "Nakliye masrafı", "Taşıma", "Sevkiyat" gibi). Gerçekten yeniyse kullanıcı ekler ve hemen kullanır. Yetkili kişi zamanla benzer kalemleri birleştirir; geçmiş kayıtlar birleştirilen kaleme bağlanır, eski ad geçmişte görünür kalır.
- Kabul kriterleri:
  - [ ] Yeni kalem eklenmeden önce benzer adlı kalemler (Türkçe karakter ve ek farklarına duyarsız) listelenir.
  - [ ] Birleştirme sonrası raporlar birleşik kalem üzerinden toplanır; tek bir geçmiş kayıt kaybolmaz.
- Durum: CONFIRMED

### REQ-ADM-007 — Geçmişi bozmayan değişiklik

- Kaynak: ADR-005
- Öncelik: Must · Kademe: T1
- Katman: Sabit
- Açıklama: Tanımlar ve fiyatlar geçerlilik tarihiyle sürümlenir. Bugün yapılan bir değişiklik, geçmişte onaylanmış işlemlerin hesabını değiştirmez (Haziran'daki fiyat değişikliği Mart hakedişini bozmaz).
- Kabul kriterleri:
  - [ ] Onaylanmış her işlem, onaylandığı anda geçerli tanım ve fiyatla hesaplanmış haliyle kalır.
  - [ ] Bir tanımın hangi tarihte hangi değerde olduğu görülebilir.
- Durum: CONFIRMED

### REQ-ADM-008 — Geriye dönük geçerlilik yalnızca onaylanmamış işlemlere

- Kaynak: D-141
- Öncelik: Must · Kademe: T1
- Katman: Sabit
- Açıklama: Yeni bir fiyat veya tanım geçmiş bir tarihten geçerli girilebilir. Yalnızca o tarihten sonraki henüz onaylanmamış işlemlere uygulanır; onaylanmış kayıtlara ve kapanmış dönemlere dokunmaz. Onaylı bir kaydın etkilenmesi gerekiyorsa revizyon talebi açılır (REQ-AUD-008).
- Kabul kriterleri:
  - [ ] Geriye dönük girilen fiyat, kapsadığı tarih aralığındaki onaylı kayıtları değiştirmez ve bunları "revizyon gerekebilir" diye listeler.
- Durum: CONFIRMED

### REQ-ADM-009 — Tipli özel alanlar

- Kaynak: ADR-005
- Öncelik: Must · Kademe: T2
- Katman: Sabit + Tanım
- Tanımla ayarlanan: özel alanlar ve veri sınıfları
- Açıklama: Belirlenmiş kayıt türlerine yetkili kişi tipli özel alan ekleyebilir (metin, sayı, tarih, seçim, evet/hayır). Hangi kayıt türlerinin özel alan alacağı belirlendi (D-237): referans kayıtlar alır, defter ve onay zinciri taşıyan kayıtlar almaz (`docs/architecture/CONFIGURATION.md`). Yeni kayıt türü tanımlamak bu gereksinimin değil, kayıt türü üretecinin konusudur (REQ-WFL-035).
- Kabul kriterleri:
  - [ ] Özel alanın veri sınıfı tanımlanırken seçilir ve görünürlük buna göre süzülür (REQ-IAM-011).
- Durum: CONFIRMED

## B. Çalışma takvimi

### REQ-ADM-010 — Şirket takvimi

- Kaynak: Özellik Yapısı (eşleme: `docs/requirements/README.md`)
- Öncelik: Must · Kademe: T2
- Katman: Sabit + Tanım
- Tanımla ayarlanan: şirket takvimi
- Açıklama: Şirket genelinde çalışma saatleri (varsayılan: ofis 08:00–17:00, saha ve fabrika 08:00–18:00), hafta tatili ve resmî tatiller, fazla mesai kuralları ve maaş ödeme günü (varsayılan: her ayın 1'i) tanımlanır.
- Kabul kriterleri:
  - [ ] Resmî tatiller yıl bazında girilir ve her yıl yeniden tanımlanabilir.
- Durum: CONFIRMED

### REQ-ADM-011 — Birime veya şantiyeye özel takvim

- Kaynak: Özellik Yapısı (eşleme: `docs/requirements/README.md`)
- Öncelik: Must · Kademe: T2
- Katman: Sabit + Tanım
- Tanımla ayarlanan: birime veya şantiyeye özel takvimler
- Açıklama: Bir birim veya şantiye için şirket takviminden farklı bir takvim tanımlanabilir; tanımlanmadıysa şirket takvimi geçerlidir.
- Kabul kriterleri:
  - [ ] Özel takvimi olan şantiyede günlük hedef, geç giriş ve tatil kontrolü o takvimle yapılır.
- Durum: CONFIRMED

### REQ-ADM-012 — Takvimi kullanan hesaplar

- Kaynak: REQ-SIT-010, REQ-PRJ-011, REQ-WFL-007
- Öncelik: Must · Kademe: T2
- Katman: Sabit
- Açıklama: Puantaj, fazla mesai, geç veri girişi, son tarihler, nakit projeksiyonu, günlük hedefler ve takvime bağlı akış tetikleyicileri bu takvimi kullanır.
- Kabul kriterleri:
  - [ ] Takvim değişikliği, geçerlilik tarihinden sonraki hesapları etkiler; geçmişte hesaplanmış son tarihleri yeniden yazmaz.
- Durum: CONFIRMED

## C. Döviz kuru

### REQ-ADM-013 — Günlük kur: önceki iş gününün TCMB döviz alış kuru

- Kaynak: D-140
- Öncelik: Must · Kademe: T1
- Katman: Sabit + Akış
- Akışla ayarlanan: kur alınamayınca görevin kime düşeceği
- Açıklama: TL, USD, EUR ve gerekli diğer para birimleri için günlük TL karşılığında varsayılan olarak bir önceki iş gününün TCMB döviz alış kuru kullanılır. Kur her iş günü kendiliğinden alınır.
- Kabul kriterleri:
  - [ ] Kur alınamazsa yetkiliye görev ve uyarı düşer; o gün için kur girilene kadar dövizli işlemler "kur bekliyor" olarak işaretlenir, sessizce eski kurla hesaplanmaz.
- Durum: CONFIRMED

### REQ-ADM-014 — Elle kur girişi

- Kaynak: Özellik Yapısı (eşleme: `docs/requirements/README.md`)
- Öncelik: Must · Kademe: T1
- Katman: Sabit
- Açıklama: Gerekli özel durumda yetkili kullanıcı elle kur girer; kim, ne zaman ve neden girdiği kayda geçer.
- Kabul kriterleri:
  - [ ] Elle girilen kur, gerekçesiz kaydedilemez ve TCMB kurundan ayırt edilerek gösterilir.
- Durum: CONFIRMED

### REQ-ADM-015 — Geçmiş kayıtların kuru korunur

- Kaynak: Özellik Yapısı (eşleme: `docs/requirements/README.md`)
- Öncelik: Must · Kademe: T1
- Katman: Sabit
- Açıklama: Bir işlemde kullanılan kur, işlemle birlikte saklanır; daha sonra kur düzeltilse bile onaylanmış işlemin hesabı değişmez.
- Kabul kriterleri:
  - [ ] Her dövizli işlem, kullandığı kuru ve kurun kaynağını (TCMB / elle) taşır.
- Durum: CONFIRMED

---

## Yetenek kataloğu — ADM

Biçim: `docs/requirements/README.md`.

### Olaylar

| Kod | Ad | Ne zaman | Taşıdığı alanlar | Veri sınıfı |
|---|---|---|---|---|
| `catalog_item.created` | Listeye yeni kalem eklendi | Kullanıcı ortak listeye kalem eklediğinde | liste, kalem, ekleyen | iç |
| `catalog_item.merged` | Kalemler birleştirildi | Yetkili benzer kalemleri birleştirdiğinde | liste, kalan kalem, birleşenler | iç |
| `unit_price.changed` | Birim fiyat değişti | Yeni fiyat sürümü girildiğinde | kalem, eski fiyat, yeni fiyat, geçerlilik | ticari |
| `exchange_rate.received` | Kur alındı | Günlük kur bülteni okunduğunda | para birimi, tarih, kur | iç |
| `exchange_rate.missing` | Kur alınamadı | Günlük kur alınamadığında | para birimi, tarih | iç |

### Aksiyonlar

Yok.

### Koşul alanları

| Kod | Ad | Tip | Veri sınıfı |
|---|---|---|---|
| `unit_price.change_percent` | Fiyat değişim oranı | sayı (%) | ticari |
| `catalog_item.list` | Kalemin ait olduğu liste | seçim | iç |
