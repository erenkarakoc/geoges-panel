# REQ-DOC — Evrak, Dosya ve Dijital Arşiv

Durum: DRAFT · 2026-09-19 · Modül: DOC (Documents)

Kaynaklar: Özellik Yapısı §33; kararlar D-134, D-186, D-201; DEF-001.

**Sınır.** Her modül kendi kayıtlarına belge ekler; DOC belgelerin saklanmasını, sürümlerini, aramasını ve tek pencere arşivini sağlar. Görünürlük kaydın kendisinden gelir (REQ-IAM-011). Mevcut Drive arşivinin panele aktarılması veri aktarımı işidir ve ertelenmiştir (DEF-001, REQ-MIG). Yedekleme altyapısı Phase 05'te tasarlanır (REQ-NFR).

Terimler (`docs/domain/GLOSSARY.md`): Document, Document Version, Archive, Unclassified Document, Text Recognition.

---

## A. Belgenin yeri

### REQ-DOC-001 — Belge kaynağına bağlı yaşar

- Kaynak: §33, §33.1
- Öncelik: Must · Kademe: T1
- Katman: Sabit + Tanım
- Tanımla ayarlanan: belge türleri
- Açıklama: Belge ayrı bir klasöre değil, ilgili kaydın altına eklenir. Örnekler: imzalı sözleşme → proje/sözleşme; imzalı hakediş → proje/şantiye/ay; bordro → personel ve dönem; zimmet tutanağı → personel ve ekipman; ekipman faturası → ekipman kartı; tartım fişi → fire/hurda kaydı; sertifika → malzeme/lot/proje; saha fotoğrafı → günlük saha kaydı/zayi; dekont → ödeme/tahsilat. Sağlık raporu belgesi hiçbir kayda yüklenmez (D-186).
- Kabul kriterleri:
  - [ ] Hiçbir kayda bağlı olmayan belge yüklenemez (aktarımdaki "sınıflandırılmamış" alan hariç, REQ-DOC-009).
  - [ ] Belge türleri arasında sağlık raporu yoktur.
- Durum: DRAFT

### REQ-DOC-002 — Tek pencere arşiv

- Kaynak: §33.2
- Öncelik: Must · Kademe: T1
- Katman: Sabit
- Açıklama: Arşiv ekranı şirketteki bütün belgeleri tek pencerede arar. Filtreler: belge türü, modül/kaynak, proje, kişi, araç/ekipman, tarih aralığı, metin arama. Sonuca tıklanınca belgenin bağlı olduğu kayda gidilir.
- Kabul kriterleri:
  - [ ] Her sonuç, bağlı olduğu kaydın adını ve yolunu gösterir.
- Durum: DRAFT

### REQ-DOC-003 — Arşiv yetkiyi aşmaz

- Kaynak: §33.3; REQ-IAM-011
- Öncelik: Must · Kademe: T1
- Katman: Sabit
- Açıklama: Tek pencere arşiv herkesin her belgeyi görmesi demek değildir. Kullanıcı yalnızca erişmeye yetkili olduğu kayıtların belgelerini görür; belge bağlı olduğu kaydın kapsamını ve veri sınıfını taşır. Örneğin saha mühendisi şantiye fotoğrafını görür, teklif maliyet dosyasını veya bordroyu görmez.
- Kabul kriterleri:
  - [ ] Yetkisiz belge arama sonuçlarında, sayılarda ve toplu indirmede görünmez; varlığı da belli olmaz.
- Durum: DRAFT

### REQ-DOC-004 — İçerik araması ve taranmış belgelerde metin tanıma

- Kaynak: §33.2; D-201
- Öncelik: Must · Kademe: T2
- Katman: Sabit
- Açıklama: Metin arama belge adına, açıklamasına ve bağlı kayıt bilgilerine ek olarak PDF ve Office belgelerinin içindeki metne de bakar. Taranmış belge ve fotoğraflardaki yazı metin tanımayla okunur ve aranabilir olur. **Not:** metin tanıma belgeyi panel dışındaki bir hizmete gönderecekse bu, Phase 03'te sahibe ayrıca sorulur; panel kendi altyapısında tanıma yapabiliyorsa belge dışarı çıkmaz.
- Kabul kriterleri:
  - [ ] Metin tanıması tamamlanmamış belge aramada "okunuyor" olarak işaretlenir.
  - [ ] Hassas sınıftaki bir kaydın belgesinin içeriği, o sınıfı göremeyen kullanıcının aramasında eşleşme üretmez.
- Durum: DRAFT

## B. Sürüm ve saklama

### REQ-DOC-005 — Belge sürümleri

- Kaynak: §33.4
- Öncelik: Must · Kademe: T1
- Katman: Sabit
- Açıklama: Aynı belgenin yeni sürümü yüklendiğinde önceki sürümler saklanır; imzalı son sürüm ayrıca işaretlenir.
- Kabul kriterleri:
  - [ ] Her sürüm yükleyen kişi ve tarihle listelenir; önceki sürüm açılabilir.
- Durum: DRAFT

### REQ-DOC-006 — Belge silinmez

- Kaynak: §33.4; REQ-AUD-002
- Öncelik: Must · Kademe: T1
- Katman: Sabit
- Açıklama: Belge silinmez; gerekirse gerekçeyle arşivlenir ve varsayılan listelerden çıkar, ama her zaman bulunabilir (D-134).
- Kabul kriterleri:
  - [ ] Hiçbir belge için "sil" işlemi yoktur.
- Durum: DRAFT

### REQ-DOC-007 — Toplu yükleme ve indirme

- Kaynak: §33.4
- Öncelik: Must · Kademe: T2
- Katman: Sabit
- Açıklama: Birden fazla belge tek seferde yüklenir; bir projenin veya kaydın bütün belgeleri tek seferde indirilir.
- Kabul kriterleri:
  - [ ] Toplu indirme yalnızca kullanıcının görmeye yetkili olduğu belgeleri içerir.
  - [ ] Her toplu indirme kim ve ne zaman bilgisiyle denetim kaydına yazılır.
- Durum: DRAFT

### REQ-DOC-008 — Önizleme

- Kaynak: §33.4
- Öncelik: Must · Kademe: T2
- Katman: Sabit
- Açıklama: PDF ve görseller indirilmeden panel içinde önizlenir.
- Kabul kriterleri:
  - [ ] Önizleme de indirme ile aynı yetki denetiminden geçer.
- Durum: DRAFT

## C. Tek arşiv

### REQ-DOC-009 — Panel Drive'ın yerini alır

- Kaynak: §33.4; DEF-001
- Öncelik: Must · Kademe: T1
- Katman: Sabit
- Açıklama: Panel şirketin evrak arşivinin tek yeridir; Drive, ortak klasör veya benzeri harici depolar paralel arşiv olarak kullanılmaz; belgeler panelin kendi depolamasında tutulur. Mevcut Drive arşivinin aktarımı ve kayda bağlanamayan eski belgelerin geçici "sınıflandırılmamış" alanı REQ-MIG'dedir (ertelendi, DEF-001).
- Kabul kriterleri:
  - [ ] Belgeler yalnızca panelin depolamasında tutulur; dış depoya bağlantı olarak eklenmez.
- Durum: DRAFT

### REQ-DOC-010 — Yedek ve geri dönüş

- Kaynak: §33.4
- Öncelik: Must · Kademe: T1
- Katman: Sabit
- Açıklama: Arşiv düzenli yedeklenir ve yedekten geri dönülebilir. Yedekleme sıklığı, saklama süresi ve geri dönüş hedefleri Phase 05'te belirlenir (REQ-NFR).
- Kabul kriterleri:
  - [ ] Yedekten geri dönüş en az bir kez denenmiş ve kaydedilmiş olmadan canlıya geçilmez.
- Durum: DRAFT

---

## Yetenek kataloğu — DOC

Biçim: `docs/requirements/README.md`.

### Olaylar

| Kod | Ad | Ne zaman | Taşıdığı alanlar | Veri sınıfı |
|---|---|---|---|---|
| `document.uploaded` | Belge yüklendi | Belge bir kayda eklendiğinde | belge türü, bağlı kayıt | kaydın sınıfı |
| `document.version_added` | Belgenin yeni sürümü | Yeni sürüm yüklendiğinde | belge, sürüm | kaydın sınıfı |

### Aksiyonlar

Yok.

### Koşul alanları

| Kod | Ad | Tip | Veri sınıfı |
|---|---|---|---|
| `document.type` | Belge türü | seçim | iç |
