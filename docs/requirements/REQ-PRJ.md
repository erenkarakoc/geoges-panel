# REQ-PRJ — Projeler, Duvarlar ve Hedefler

Durum: CONFIRMED (sahip, 2026-09-18) · 2026-09-18 · Modül: PRJ (Projects)

Kaynaklar: REQ-SIT-015; kararlar D-136…D-138.

**Sınır.** Panel tipi ve şerit tipi tanımları merkezi katalogdur (REQ-ADM, REQ-ADM-002…003, REQ-SIT-014, REQ-SIT-022). Hızlandırma ve süre-maliyet senaryoları (REQ-INT-011…014) REQ-INT'dedir. Sözleşme şartları ve yükümlülükleri REQ-CMP'dedir; proje kartı onları gösterir. Hakediş REQ-FIN'dedir. Döküm, montaj ve şerit girişleri REQ-SIT'tedir; PRJ hedefleri ve ilerlemenin hedefe oranını tutar. Duvar bazlı özetlerin resmi günlük rapora basılması REQ-RPT REQ-RPT-015'tedir.

Terimler (`docs/domain/GLOSSARY.md`): Project, Site, Wall, Authority, Quantity, Supply Responsibility Matrix, Project Revision, Technical Office Item, Project Stage, Contract Duration, Theoretical Duration, Management Target Duration, Daily Target.

---

## A. Proje ve şantiye

### REQ-PRJ-001 — Proje birden fazla şantiyeye bölünür, şantiye tek projenindir

- Kaynak: D-138
- Öncelik: Must · Kademe: T1
- Katman: Sabit
- Açıklama: Bir proje tek şantiyeden oluşabilir veya birden fazla şantiyeye bölünebilir. Her şantiye tek bir projeye bağlıdır; aynı sahada iki ayrı sözleşme varsa iki ayrı şantiye kaydı açılır. Böylece maliyet, kâr-zarar ve hakediş her zaman tek projeye yazılır.
- Kabul kriterleri:
  - [ ] Bir şantiye ikinci bir projeye bağlanamaz.
  - [ ] Projenin ilerlemesi ve maliyeti, şantiyelerinin toplamından oluşur.
- Durum: CONFIRMED

### REQ-PRJ-002 — Proje kartı

- Kaynak: REQ-IAM-011
- Öncelik: Must · Kademe: T2
- Katman: Sabit
- Açıklama: Proje kartında proje adı, işveren/ana firma, kurum/idare, şehir ve lokasyon, sözleşme bilgileri, sözleşme bedeli ve para birimi, başlangıç ve hedef bitiş tarihi, sözleşmedeki son bitiş tarihi, toplam hedef metraj, panel tipleri ve hedef adetleri, şerit tipleri ve hedef metrajları, diğer iş kalemleri, duvarlar ve duvar bazlı hedefler, sorumlu koordinatör, şantiyeler, iş modeli, teknik ofis durumu, kurum onay durumu, hakediş durumu, sözleşme yükümlülükleri ve proje dokümanları bulunur. Sözleşme bedeli ve hakediş tutarları ticari veridir.
- Kabul kriterleri:
  - [ ] Ticari yetkisi olmayan kullanıcı sözleşme bedelini ve hakediş tutarlarını görmez.
- Durum: CONFIRMED

### REQ-PRJ-003 — Proje aşamaları

- Kaynak: ADR-005
- Öncelik: Must · Kademe: T2
- Katman: Sabit + Akış + Tanım
- Akışla ayarlanan: aşama geçişlerinin onayı ve kilitleri
- Tanımla ayarlanan: aşama kataloğu
- Açıklama: Proje şu aşamalardan geçer: talep/fırsat, ön inceleme ve yaklaşık miktar, teklif, görüşme/pazarlık, sözleşme, teknik proje/statik hesap/kurum onayı, mobilizasyon ve saha kurulumu, uygulama/üretim, aylık hakedişler ve ara teslimler, tamamlama, kesin kabul/kapanış, teminat ve kapanış yükümlülüklerinin tamamlanması. Aşamalar bir katalogdur; aşama geçişleri iş akışlarıyla yönetilir ve kilitlenebilir (ör. yükümlülükler kapanmadan kapanış aşamasına geçilmez).
- Kabul kriterleri:
  - [ ] Her aşama geçişi tarih ve kişiyle projenin geçmişinde görünür.
- Durum: CONFIRMED

### REQ-PRJ-004 — Tedarik/sorumluluk matrisi

- Kaynak: Özellik Yapısı (eşleme: `docs/requirements/README.md`)
- Öncelik: Must · Kademe: T1
- Katman: Sabit + Tanım
- Tanımla ayarlanan: matris kalemleri kataloğu
- Açıklama: Her projede "kim neyi karşılıyor" tutulur: beton, demir, dolgu temini/serme/sıkıştırma, yemek, konaklama, kamp/konteyner, nakliye, vinç ve operatör, kalıp/demirbaş, çelik şerit ve sarf. Her kalem için seçenekler: işveren karşılar · GEOGES karşılar · işveren karşılar ve GEOGES hakedişinden keser. Kalemler katalogdur. Matris maliyet ve kâr-zarar hesabının girdisidir (REQ-FIN).
- Kabul kriterleri:
  - [ ] Matriste bir kalemin değişmesi, değişiklik tarihinden sonraki maliyet hesabını etkiler; geçmiş dönemleri yeniden yazmaz.
- Durum: CONFIRMED

### REQ-PRJ-005 — Teknik ofis işleri

- Kaynak: Özellik Yapısı (eşleme: `docs/requirements/README.md`)
- Öncelik: Must · Kademe: T2
- Katman: Sabit + Akış
- Akışla ayarlanan: geciken teknik işte görevin kime düşeceği
- Açıklama: Proje altında teknik ofisin işleri izlenir: proje çizimi, revizyonlar, statik hesap, metraj, kurum onay süreci, hakediş hazırlık desteği, teknik evraklar. Her işin teslim tarihi ve revizyon sayısı tutulur; geciken teknik işler görünür. Teslim süresi ve hata/revizyon sayısı performans değerlendirmesine girer (REQ-PRF).
- Kabul kriterleri:
  - [ ] Teslim tarihi geçen teknik iş, sorumlusuna görev olarak düşer ve "Dikkat" bölümünde görünür.
- Durum: CONFIRMED

## B. Duvarlar ve hedefler

### REQ-PRJ-006 — Duvarlar

- Kaynak: Özellik Yapısı (eşleme: `docs/requirements/README.md`)
- Öncelik: Must · Kademe: T2
- Katman: Sabit
- Açıklama: Bir proje birden fazla duvardan oluşur (ör. "Kötekli Duvar 1 Sağ"). Duvar proje altında tanımlanır ve bir şantiyeye bağlanır. Her duvar için ad/kod, panel tipi başına hedef adet (duvar × panel tipi matrisi), şerit tipi ve boyuna göre hedef metraj, varsa diğer iş kalemlerinin hedefleri ve durum (başlamadı / devam ediyor / tamamlandı) tutulur.
- Kabul kriterleri:
  - [ ] Bir duvar yalnızca kendi projesinin şantiyelerinden birine bağlanabilir.
- Durum: CONFIRMED

### REQ-PRJ-007 — Proje hedefi duvarların toplamıdır

- Kaynak: REQ-SIT-015
- Öncelik: Must · Kademe: T2
- Katman: Sabit
- Açıklama: Projede panel tipi bazında hedef adet tutulur. Hedefler duvar bazında tanımlandığında proje hedefi duvarların toplamıdır; elle ayrıca girilmez.
- Kabul kriterleri:
  - [ ] Bir duvarın hedefi değişince proje hedefi kendiliğinden değişir.
- Durum: CONFIRMED

### REQ-PRJ-008 — İlerleme proje, şantiye ve duvar bazında

- Kaynak: Özellik Yapısı (eşleme: `docs/requirements/README.md`)
- Öncelik: Must · Kademe: T2
- Katman: Sabit
- Açıklama: Panel dökümü duvardan bağımsız, panel tipine göre izlenir; montaj ve şerit kayıtları ilgili duvara bağlanır. İlerleme proje, şantiye ve duvar bazında ayrı ayrı görülür; "hangi duvar ne durumda, hangi duvarda şerit eksik kaldı?" sorusu cevaplanır.
- Kabul kriterleri:
  - [ ] Her duvar için montaj ve şerit ilerlemesi, hedefine oranla görünür.
- Durum: CONFIRMED

### REQ-PRJ-009 — Hedefler proje revizyonuyla değişir

- Kaynak: D-136
- Öncelik: Must · Kademe: T1
- Katman: Sabit + Akış
- Akışla ayarlanan: revizyonun onaylayıcısı
- Açıklama: Proje ve duvar hedefleri doğrudan değiştirilmez. Teknik ofis yeni bir proje revizyonu girer (ör. "Rev.2"); yetkili onaylayınca geçerli olur. Eski revizyonun hedefleri tarihiyle saklanır. Fazla döküm ve ilerleme, her zaman o gün geçerli olan revizyona göre hesaplanır. Böylece hedef büyütülerek fazla döküm gizlenemez.
- Kabul kriterleri:
  - [ ] Onaylı hedeflerin doğrudan düzenlenebildiği bir ekran yoktur; yalnızca yeni revizyon.
  - [ ] Geçmiş bir tarihin fazla döküm değerlendirmesi, o tarihteki revizyonun hedefleriyle yapılır.
  - [ ] Revizyonlar arasındaki fark (panel tipi ve duvar bazında) yan yana gösterilir.
- Durum: CONFIRMED

## C. Süreler ve günlük hedefler

### REQ-PRJ-010 — Üç ayrı süre

- Kaynak: Özellik Yapısı (eşleme: `docs/requirements/README.md`)
- Öncelik: Must · Kademe: T2
- Katman: Sabit
- Açıklama: Projede birbirinden ayrı üç süre görünür: sözleşme süresi ve sözleşme bitiş tarihi (işverene karşı resmî süre), normal teorik süre (mevcut ekip ve kaynaklarla beklenen süre), yönetim hedef süresi (daha hızlı bitirmek için konan iç hedef).
- Kabul kriterleri:
  - [ ] Üç sürenin her biri ayrı girilir ve ayrı gösterilir; biri diğerinden türetilmez.
- Durum: CONFIRMED

### REQ-PRJ-011 — Günlük hedefler hesaplanır, yetkili düzeltir

- Kaynak: D-137
- Öncelik: Must · Kademe: T2
- Katman: Sabit
- Açıklama: Şantiyenin günlük hedefleri (panel döküm adedi/m², panel montaj adedi/m², şerit montaj metresi, diğer iş kalemleri) seçilen süreden, kalan işten ve çalışma takviminden hesaplanır. Yetkili kişi gerekirse elle düzeltir; düzeltme kayıtta kalır. Üretim geride kaldıkça kalan günlerin hedefi yeniden hesaplanır.
- Kabul kriterleri:
  - [ ] Tatil günlerine hedef verilmez.
  - [ ] Elle düzeltilen hedefte hesaplanan değer ve düzeltilen değer birlikte saklanır.
  - [ ] Gerçekleşen üretim, günlük kayıtta ve "Bugün"de hedefle karşılaştırılır.
- Durum: CONFIRMED

---

## Yetenek kataloğu — PRJ

Biçim: `docs/requirements/README.md`.

### Olaylar

| Kod | Ad | Ne zaman | Taşıdığı alanlar | Veri sınıfı |
|---|---|---|---|---|
| `project.created` | Proje oluştu | Proje kaydı açıldığında | proje, işveren, koordinatör | iç |
| `project.stage_changed` | Proje aşaması değişti | Aşama geçişinde | proje, eski aşama, yeni aşama | iç |
| `project.changed` | Proje kartı değişti | Kartın bilgisi değiştiğinde (aşama dışında) | proje | iç |
| `project_revision.submitted` | Proje revizyonu onaya gönderildi | Teknik ofis taslak revizyonu onaya gönderdiğinde | proje, revizyon, neden | iç |
| `project_revision.approved` | Proje revizyonu onaylandı | Yeni hedefler geçerli olduğunda | proje, revizyon, fark | iç |
| `wall.completed` | Duvar tamamlandı | Duvar durumu "tamamlandı" olduğunda | proje, duvar | iç |
| `technical_office_item.overdue` | Teknik ofis işi gecikti | Teslim tarihi geçtiğinde | proje, iş, sorumlu | iç |

### Aksiyonlar

Yok. Aşama değişikliği, genel "durum değiştir" adımıyla yapılır (REQ-WFL-010).

### Koşul alanları

| Kod | Ad | Tip | Veri sınıfı |
|---|---|---|---|
| `project.stage` | Proje aşaması | seçim | iç |
| `project.progress_percent` | Proje ilerlemesi | sayı (%) | iç |
| `project.days_to_contract_end` | Sözleşme bitişine kalan gün | sayı | iç |
| `project.contract_value` | Sözleşme bedeli | tutar | ticari |
| `wall.status` | Duvar durumu | seçim | iç |
| `technical_office_item.assignee_user_id` | Teknik ofis işinin sorumlusu | kişi | iç |
