# REQ-QHS — Kalite, Uygunsuzluk ve DÖF, İş Sağlığı ve Güvenliği

Durum: CONFIRMED (sahip, 2026-09-19) · 2026-09-19 · Modül: QHS (Quality, Health & Safety)

Kaynaklar: kararlar D-050, D-134, D-182…D-186; RISK-001.

**Sınır.** Görev, eskalasyon ve bildirim mekanizması REQ-TSK'dadır; onay ve kilitler REQ-WFL'dedir. Personelin süreli belgeleri REQ-HR-003'te, tüm süreli belgelerin tek listesi REQ-CMP-016'dadır. KKD stoğu REQ-INV'de, periyodik kontrollü ekipman REQ-EQP'dedir. Performans ve prim hesabı REQ-PRF'dedir; QHS o hesaba hangi olayın nasıl gireceğini söyler. Hızlandırma senaryolarındaki kalite ve İSG sınırı (REQ-INT-013…014) REQ-INT'tedir.

Terimler (`docs/domain/GLOSSARY.md`): Test Certificate, Material Lot, Quality Check, Nonconformity, Corrective and Preventive Action (CAPA), Root Cause, Internal Audit Finding, Customer Complaint, OHS Incident, Near Miss, Training Record, OHS Checklist, Risk Assessment, Personal Protective Equipment (PPE), PPE Issue.

---

## A. Test ve sertifikalar

### REQ-QHS-001 — Test ve sertifika kaydı

- Kaynak: Özellik Yapısı (eşleme: `docs/requirements/README.md`)
- Öncelik: Must · Kademe: T1
- Katman: Sabit + Tanım
- Tanımla ayarlanan: test ve sertifika türleri (başlangıç: galvaniz kaplama, çekme/kopma dayanımı, boyut kontrolü, beton testleri, diğer laboratuvar/kurum testleri)
- Açıklama: Her sertifikada tür, parti/lot, ilgili malzeme veya üretim, test tarihi, sonuç/değer, geçti/kaldı, düzenleyen laboratuvar veya kurum, geçerlilik tarihi, belge ve ilgili proje, teklif veya sevkiyat tutulur.
- Kabul kriterleri:
  - [ ] Bir partinin ekranında o partiye ait bütün sertifikalar görünür; sevkiyat ve proje ekranında da ilgili sertifikalar listelenir.
- Durum: CONFIRMED

### REQ-QHS-002 — Sertifika durumu ve yenileme

- Kaynak: Özellik Yapısı (eşleme: `docs/requirements/README.md`)
- Öncelik: Must · Kademe: T2
- Katman: Sabit + Akış
- Akışla ayarlanan: yenileme görevinin ne kadar önce ve kime açılacağı
- Açıklama: Sertifika geçerlilik tarihine göre "geçerli", "süresi yaklaşıyor" veya "süresi doldu" olarak işaretlenir. Süreli sertifikalar REQ-CMP-016'daki tek listede de görünür.
- Kabul kriterleri:
  - [ ] Durum geçerlilik tarihinden hesaplanır; elle değiştirilmez.
- Durum: CONFIRMED

### REQ-QHS-003 — "Kaldı" sonucu uyarı ve karar ister

- Kaynak: D-182
- Öncelik: Must · Kademe: T1
- Katman: Sabit + Akış
- Akışla ayarlanan: uyarının ve karar görevinin kime düşeceği (varsayılan: kalite sorumlusu ve koordinatör)
- Açıklama: Test sonucu "kaldı" olan parti stokta kullanılabilir kalır; kendiliğinden bloke edilmez. Uyarı ve karar görevi oluşur. Yetkili kişi kararını (iade, yeniden işlem, hurda, şartlı kabul veya kullanım) gerekçesiyle partiye yazar.
- Kabul kriterleri:
  - [ ] "Kaldı" sonucu olan ve kararı girilmemiş parti, stok, sevkiyat ve sarf ekranlarında işaretli görünür.
  - [ ] Karar, kim ve ne zaman bilgisiyle partinin geçmişinde kalır.
- Durum: CONFIRMED

## B. Saha kalite kontrolleri

### REQ-QHS-004 — Saha kalite kontrol kayıtları

- Kaynak: Özellik Yapısı (eşleme: `docs/requirements/README.md`)
- Öncelik: Must · Kademe: T2
- Katman: Sabit + Tanım
- Tanımla ayarlanan: kontrol türleri (başlangıç: beton priz/mukavemet, panel kalite kontrolü, montaj kot/aks/terazi, kurum onayı, imalat uygunluğu) ve projede hangilerinin gerektiği
- Açıklama: Proje ihtiyacına göre kontrol kayıtları tutulur: kontrol türü, tarih, şantiye, duvar veya panel tipi, ölçülen değer, uygun/uygun değil, kontrol eden, fotoğraf ve belge.
- Kabul kriterleri:
  - [ ] "Uygun değil" sonuçlu kontrolden tek adımda uygunsuzluk kaydı açılabilir (REQ-QHS-005).
- Durum: CONFIRMED

## C. Uygunsuzluk ve DÖF

### REQ-QHS-005 — Uygunsuzluk ve DÖF kaydı

- Kaynak: Özellik Yapısı (eşleme: `docs/requirements/README.md`)
- Öncelik: Must · Kademe: T1
- Katman: Sabit + Tanım
- Tanımla ayarlanan: kayıt türleri (başlangıç: uygunsuzluk, DÖF, risk, iç denetim bulgusu, müşteri geri bildirimi/şikâyet)
- Açıklama: Kalite, İSG, süreç veya müşteri kaynaklı her uygunsuzluk kaydedilir: tür, tarih, birim/süreç, proje, sorumlu kişi ve pozisyon, etki seviyesi (kritik / majör / minör), açıklama, fotoğraf/belge, kök neden, düzeltici ve önleyici aksiyonlar, hedef çözüm süresi (gün), gerçek çözüm süresi, tekrar edip etmediği, durum (açık / kapalı) ve kapatma onayı.
- Kabul kriterleri:
  - [ ] Kök neden ve en az bir aksiyon girilmeden kayıt kapatılamaz.
  - [ ] Gerçek çözüm süresi açılış ve kapanış tarihinden hesaplanır.
- Durum: CONFIRMED

### REQ-QHS-006 — Aksiyonlar görev olur, süreyi aşan eskale olur

- Kaynak: Özellik Yapısı (eşleme: `docs/requirements/README.md`)
- Öncelik: Must · Kademe: T1
- Katman: Sabit + Akış
- Akışla ayarlanan: aksiyon görevlerinin kime düşeceği, eskalasyon zinciri ve kapatma onayının onaylayıcısı
- Açıklama: Her düzeltici ve önleyici aksiyon sorumlusuna görev olarak düşer. Hedef çözüm süresini aşan açık kayıt eskale olur. Kaydın kapanması onayla olur.
- Kabul kriterleri:
  - [ ] Açık aksiyonu olan kayıt kapatılamaz.
- Durum: CONFIRMED

### REQ-QHS-007 — Tekrar eden uygunsuzluk

- Kaynak: Özellik Yapısı (eşleme: `docs/requirements/README.md`)
- Öncelik: Must · Kademe: T2
- Katman: Sabit
- Açıklama: Aynı birim veya süreçte aynı türde tekrar eden uygunsuzluk işaretlenir ve ayrıca raporlanır. Kayıt açılırken benzer geçmiş kayıtlar önerilir; kullanıcı tekrar olduğunu işaretlerse önceki kayda bağlanır.
- Kabul kriterleri:
  - [ ] Tekrar eden kayıt, bağlandığı önceki kayıtlarla birlikte görünür.
- Durum: CONFIRMED

### REQ-QHS-008 — Uygunsuzluk performansa yansır

- Kaynak: REQ-PRF
- Öncelik: Must · Kademe: T2
- Katman: Sabit
- Açıklama: Uygunsuzluk kayıtları, sayısı, etki seviyesi, tekrar ve çözüm süresiyle ilgili pozisyonun performans verisine geçer. Ağırlıklar REQ-PRF'dedir.
- Kabul kriterleri:
  - [ ] Performansa geçen her kalem kaynağı olan uygunsuzluk kaydına bağlantı taşır.
- Durum: CONFIRMED

## D. İSG olayları

### REQ-QHS-009 — Ramak kala ve kaza kaydı

- Kaynak: D-183
- Öncelik: Must · Kademe: T1
- Katman: Sabit
- Açıklama: Her olayda olay türü (ramak kala, kaza), tarih ve saat, şantiye veya fabrika, açıklama, ciddiyet, ilgili, yaralanan ve tanık kişilerin adları, alınan aksiyon, durum, fotoğraf ve belge tutulur. Yaralanmanın türü, sağlık raporu, tedavi ve iş göremezlik bilgisi panelde tutulmaz; bu belgeler panel dışında saklanır (D-183). Kişi adları iç veridir.
- Kabul kriterleri:
  - [ ] Olay kaydında sağlık bilgisi için alan veya belge türü yoktur.
  - [ ] Olay kaydı yalnızca ilgili şantiyeyi veya fabrikayı görebilen kullanıcılara görünür.
- Durum: CONFIRMED

### REQ-QHS-010 — Olay aksiyonları ve ciddi kaza

- Kaynak: Özellik Yapısı (eşleme: `docs/requirements/README.md`)
- Öncelik: Must · Kademe: T1
- Katman: Sabit + Akış
- Akışla ayarlanan: aksiyon görevlerinin kime düşeceği ve ciddi kazanın kime, hangi öncelikle bildirileceği (varsayılan: sahipler ve genel müdür, anında)
- Açıklama: Olayın açık aksiyonları görev olarak düşer. Ciddi kaza yüksek öncelikle üst yönetime çıkar ve kapanana kadar "Dikkat" bölümünde kalır (REQ-RPT-008).
- Kabul kriterleri:
  - [ ] Ciddi kaza bildirimi, günlük özeti beklemeden anında gider (REQ-TSK-012).
- Durum: CONFIRMED

### REQ-QHS-011 — Ramak kala bildirimi hiçbir yerde cezalandırılmaz

- Kaynak: D-185
- Öncelik: Must · Kademe: T1
- Katman: Sabit
- Açıklama: Ramak kala bildirmek, bildirenin, şantiyenin veya ekibin hiçbir performans, sıralama veya prim hesabında olumsuz sayılmaz. Amaç ramak kalaların saklanmamasıdır.
- Kabul kriterleri:
  - [ ] Performans ve prim hesaplarında ramak kala sayısı olumsuz yönde hiçbir formüle girmez.
- Durum: CONFIRMED

## E. Eğitim

### REQ-QHS-012 — Eğitim kayıtları

- Kaynak: Özellik Yapısı (eşleme: `docs/requirements/README.md`)
- Öncelik: Must · Kademe: T2
- Katman: Sabit + Akış + Tanım
- Akışla ayarlanan: yenileme görevinin ne kadar önce ve kime açılacağı
- Tanımla ayarlanan: eğitim türleri ve geçerlilik süreleri
- Açıklama: Personelin aldığı eğitimler tür, tarih, veren kurum, geçerlilik süresi ve belgeyle tutulur. Süresi yaklaşan eğitim yenileme görevi oluşturur; süreli belge olarak REQ-HR-003 ve REQ-CMP-016 listelerinde de görünür.
- Kabul kriterleri:
  - [ ] Bir rol veya iş için zorunlu eğitimi eksik olan personel listelenebilir.
- Durum: CONFIRMED

## F. Günlük kontrol, risk değerlendirmesi ve KKD

### REQ-QHS-013 — Günlük İSG kontrol listesi

- Kaynak: Özellik Yapısı (eşleme: `docs/requirements/README.md`)
- Öncelik: Should · Kademe: T2
- Katman: Sabit + Akış + Tanım
- Akışla ayarlanan: "uygun değil" işaretlenen maddeden kime görev açılacağı
- Tanımla ayarlanan: şantiye veya fabrika bazında kontrol listesinin maddeleri
- Açıklama: Şantiye veya fabrika ihtiyacına göre günlük İSG kontrol listesi doldurulur: her madde uygun / uygun değil / geçerli değil, açıklama ve fotoğraf.
- Kabul kriterleri:
  - [ ] "Uygun değil" işaretlenen madde açıklama olmadan kaydedilmez.
- Durum: CONFIRMED

### REQ-QHS-014 — Risk değerlendirmesi

- Kaynak: Özellik Yapısı (eşleme: `docs/requirements/README.md`)
- Öncelik: Should · Kademe: T2
- Katman: Sabit + Akış
- Akışla ayarlanan: gözden geçirme tarihinden ne kadar önce ve kime görev açılacağı
- Açıklama: Şantiye ve fabrika için risk değerlendirmesi belgesiyle, hazırlayanı, tarihi ve gözden geçirme tarihiyle tutulur; yeni sürüm eskisini silmez.
- Kabul kriterleri:
  - [ ] Geçerli risk değerlendirmesi olmayan aktif şantiye "Dikkat" bölümünde görünür.
- Durum: CONFIRMED

### REQ-QHS-015 — KKD kişiye adetle teslim edilir

- Kaynak: D-184
- Öncelik: Must · Kademe: T2
- Katman: Sabit + Tanım
- Tanımla ayarlanan: KKD türleri ve hangilerinin periyodik kontrol isteyen demirbaş olarak izlendiği
- Açıklama: KKD stoktan sarf gibi çıkar (REQ-INV) ve kişinin kartına ne, kaç adet ve hangi tarihte verildiği yazılır. Kişi teslim aldığını kendi hesabından telefonda onaylar; panel hesabı olmayan kişi için imzalı teslim tutanağının fotoğrafı yüklenir (D-160 ile aynı yol; D-184'ten türetilen kural, sahip onayladı). Emniyet kemeri gibi periyodik kontrol isteyen KKD tek tek demirbaş kartıyla izlenir (REQ-EQP-015).
- Kabul kriterleri:
  - [ ] Kişinin kartında aldığı KKD'lerin geçmişi görünür.
  - [ ] Onayı veya tutanağı olmayan teslim "onay bekliyor" olarak işaretli kalır.
- Durum: CONFIRMED

## G. Güvenlik hız ve primin üstündedir

### REQ-QHS-016 — Ciddi kaza veya açık kritik bulgu hedefi geçersiz kılar

- Kaynak: D-185
- Öncelik: Must · Kademe: T1
- Katman: Sabit
- Açıklama: Bir dönemde şantiyede ciddi kaza olduysa veya kapatılmamış kritik İSG bulgusu (kritik etki seviyeli İSG uygunsuzluğu) varsa, o şantiyenin o dönemki hız ve prim hedefi "başarılı" sayılmaz. Ramak kala ve hafif olaylar hedefi etkilemez (REQ-QHS-011).
- Kabul kriterleri:
  - [ ] Hedefi geçersiz kılan olay, performans ekranında gerekçe olarak bağlantısıyla görünür.
  - [ ] Kritik bulgu kapatıldığında, o dönemin değerlendirmesi dönem kapanmadıysa yeniden yapılır; kapandıysa geçersizlik kalır.
- Durum: CONFIRMED

---

## Yetenek kataloğu — QHS

Biçim: `docs/requirements/README.md`.

### Olaylar

| Kod | Ad | Ne zaman | Taşıdığı alanlar | Veri sınıfı |
|---|---|---|---|---|
| `test_certificate.failed` | Test "kaldı" çıktı | Sonuç kaydedildiğinde | tür, parti, malzeme | iç |
| `test_certificate.expiring` | Sertifika süresi yaklaşıyor | Uyarı süresine girildiğinde | tür, parti, geçerlilik | iç |
| `quality_check.failed` | Kalite kontrolü uygun değil | Kontrol kaydedildiğinde | kontrol türü, şantiye, duvar | iç |
| `nonconformity.opened` | Uygunsuzluk açıldı | Kayıt açıldığında | tür, etki seviyesi, birim, proje, tekrar mı | iç |
| `nonconformity.overdue` | Uygunsuzluk süresi aştı | Hedef çözüm süresi geçtiğinde | kayıt, gecikme | iç |
| `nonconformity.closed` | Uygunsuzluk kapandı | Kapatma onaylandığında | kayıt, çözüm süresi | iç |
| `ohs_incident.recorded` | İSG olayı kaydedildi | Olay kaydedildiğinde | tür, ciddiyet, şantiye | iç |
| `ohs_checklist.item_failed` | Günlük İSG maddesi uygun değil | Kontrol kaydedildiğinde | şantiye, madde | iç |
| `training.expiring` | Eğitim süresi yaklaşıyor | Uyarı süresine girildiğinde | personel, eğitim türü, bitiş | iç |
| `ppe.issued` | KKD teslim edildi | Kişi onayladığında | personel, KKD türü, adet | iç |

### Aksiyonlar

| Kod | Ad | Girdi | Gereken yetki | İki kez çalışırsa | Yarıda kalırsa |
|---|---|---|---|---|---|
| `nonconformity.create_draft` | Taslak uygunsuzluk aç | kaynak kayıt, tür, etki seviyesi | akışın sistem yetkisi | Aynı kaynak kayıt için açık kayıt varsa onu döndürür | Kayıt açılmamış sayılır |

### Koşul alanları

| Kod | Ad | Tip | Veri sınıfı |
|---|---|---|---|
| `nonconformity.impact_level` | Etki seviyesi | seçim | iç |
| `nonconformity.is_repeat` | Tekrar eden mi | evet/hayır | iç |
| `ohs_incident.type` | Olay türü | seçim | iç |
| `ohs_incident.severity` | Ciddiyet | seçim | iç |
| `test_certificate.result` | Test sonucu | seçim | iç |
