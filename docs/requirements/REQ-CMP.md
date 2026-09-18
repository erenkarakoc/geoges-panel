# REQ-CMP — Sözleşme, Yükümlülük, Teminat ve Süreli Belgeler

Durum: CONFIRMED (sahip, 2026-09-19) · 2026-09-18 · Modül: CMP (Contracts & Compliance)

Kaynaklar: Özellik Yapısı §24, §31; kararlar D-029, D-030, D-124, D-177…D-180.

**Sınır.** Koşullu tetikleyiciler ve bağımlılık kilitlerinin mekanizması iş akışıdır (REQ-WFL-007, REQ-WFL-028…030); CMP hangi kuralların sözleşmeden doğduğunu tutar. Teslim-tesellüm saatleri ve işveren bekleme analizi REQ-SIT-024 ve REQ-SIT-025'tedir. Teminat kesintisinin hakedişten düşülmesi REQ-FIN-006'dadır. Ekipmanın periyodik kontrolleri REQ-EQP-015'te, personelin süreli belgeleri REQ-HR-003'tedir; CMP şirket ve şantiye belgelerini tutar ve hepsini tek listede gösterir. Sözleşme süresi ve teorik süre REQ-PRJ'dedir.

Terimler (`docs/domain/GLOSSARY.md`): Contract, Contract Amendment, Framework Agreement, Obligation, Delay Penalty, Extension of Time, Client Delay File, Notice Letter, Guarantee, Letter of Guarantee, Guarantee Commission, Dependency Lock, Dispute File, Contract Duration.

---

## A. Sözleşmeler

### REQ-CMP-001 — Üç tür sözleşme, izlenebilir şartlar

- Kaynak: §24; D-177
- Öncelik: Must · Kademe: T1
- Katman: Sabit
- Açıklama: İşveren sözleşmeleri, taşeron sözleşmeleri ve uzun süreli tedarikçi anlaşmaları tutulur. Sözleşme yalnızca PDF olarak saklanmaz; önemli şartları izlenebilir kayıtlara dönüşür. Sözleşme bir firmaya (D-027) ve işveren/taşeron sözleşmesinde bir projeye bağlıdır.
- Kabul kriterleri:
  - [ ] Her sözleşmede imzalı belge, taraflar, tarih ve durum bulunur.
  - [ ] Sözleşme tutarları ve fiyatları ticari veridir.
- Durum: CONFIRMED

### REQ-CMP-002 — İşveren sözleşmesinin şartları

- Kaynak: §24.1; D-029
- Öncelik: Must · Kademe: T1
- Katman: Sabit
- Açıklama: İş kapsamı, teslim tarihi, iş süresi, ödeme koşulları ve vadesi (REQ-FIN-022), hakediş şartları, teminat türü ve oranı, teminat iadesi için gereken evraklar, gecikme cezası ve günlük cezai tutar, işveren avansı ve kesinti oranı (REQ-FIN-007), İSG yükümlülükleri, işveren ve GEOGES yükümlülükleri, gerekli belge ve gönderim tarihleri tanımlanır.
- Kabul kriterleri:
  - [ ] Hakediş, nakit projeksiyonu ve ceza hesabı bu şartları sözleşmeden okur; aynı şart ikinci yerde girilmez.
- Durum: CONFIRMED

### REQ-CMP-003 — Taşeron sözleşmesi

- Kaynak: D-030, D-177; REQ-FIN-009
- Öncelik: Must · Kademe: T1
- Katman: Sabit
- Açıklama: Taşeron sözleşmesinde ödeme yöntemi (birim fiyat, götürü, gündelik), birim fiyatlar, kesintiler, iş kapsamı, süre ve tarafların yükümlülükleri tutulur. Taşeron hakedişi fiyatını bu sözleşmeden alır.
- Kabul kriterleri:
  - [ ] Geçerli taşeron sözleşmesi olmayan ekip için taşeron hakedişi hazırlanamaz.
- Durum: CONFIRMED

### REQ-CMP-004 — Tedarikçi çerçeve anlaşması

- Kaynak: D-177; REQ-PUR-003
- Öncelik: Should · Kademe: T2
- Katman: Sabit
- Açıklama: Uzun süreli tedarikçi anlaşmasında malzeme, çerçeve fiyat, para birimi, teslim şartları ve geçerlilik süresi tutulur; yükümlülükleri diğer sözleşmeler gibi izlenir. O tedarikçiye sipariş açılırken çerçeve fiyat öneri olarak gelir; siparişteki fiyat farklıysa fark görünür (D-177'den türetilen kural, sahip onayladı).
- Kabul kriterleri:
  - [ ] Süresi biten anlaşmanın fiyatı öneri olarak gelmez; bitişten önce sorumlusuna uyarı düşer.
- Durum: CONFIRMED

### REQ-CMP-005 — Sözleşme değişikliği yeni sürümdür

- Kaynak: §24.1; D-136 (aynı mantık)
- Öncelik: Must · Kademe: T1
- Katman: Sabit
- Açıklama: Sözleşmede değişiklik (zeyilname) olursa geçerlilik tarihli yeni sürüm açılır; önceki sürüm ve şartları silinmez. Her hesap, işlemin tarihinde geçerli sürümü kullanır (D-177'den türetilen kural, sahip onayladı).
- Kabul kriterleri:
  - [ ] Sürümler arasındaki şart farkları yan yana görülebilir.
- Durum: CONFIRMED

## B. Yükümlülükler

### REQ-CMP-006 — Yükümlülük kaydı

- Kaynak: §24.2
- Öncelik: Must · Kademe: T1
- Katman: Sabit + Akış
- Akışla ayarlanan: uyarının ne kadar önce, kime gideceği ve eskalasyon zinciri
- Açıklama: Her yükümlülükte ne yapılacağı, sorumlu taraf (GEOGES, işveren, taşeron veya tedarikçi), sorumlu kişi veya rol, son tarih, durum, ceza riski ve ilgili belge görünür. Süre yaklaşınca uyarı, geçince gecikme ve gerekirse kritik eskalasyon oluşur (REQ-TSK-006).
- Kabul kriterleri:
  - [ ] Gecikmiş yükümlülük, sebebi çözülene kadar "Dikkat" bölümünde kalır (REQ-RPT-008).
- Durum: CONFIRMED

### REQ-CMP-007 — İşveren yükümlülükleri

- Kaynak: §24.5; REQ-SIT-024
- Öncelik: Must · Kademe: T1
- Katman: Sabit
- Açıklama: İşverenin yükümlülükleri de izlenir: saha teslimi, dolgu, beton, demir, elektrik/su, ödeme ve diğer sözleşmesel yükümlülükler. Yerine getirilme zamanı teslim-tesellüm kayıtlarından ve tahsilattan gelir.
- Kabul kriterleri:
  - [ ] İşveren yükümlülüğü gecikince işveren karnesine yansır (REQ-CRM-009).
- Durum: CONFIRMED

### REQ-CMP-008 — Sözleşmeden doğan tetikleyiciler

- Kaynak: §24.3; REQ-WFL-007, REQ-WFL-028
- Öncelik: Must · Kademe: T1
- Katman: Sabit + Akış
- Akışla ayarlanan: listelenen tetikleyicilerin tamamı; her biri varsayılan akıştır. Sözleşmedeki tarihli yükümlülüklerin kayda dönüşmesi sabittir
- Açıklama: Bir olayla doğan işler iş akışıyla kurulur. Varsayılan şirket akışları arasında: hakediş onaylandı → fatura görevi; ay sonu → bordro hazırlama/gönderme görevi; personel ayrılıyor → çıkış kontrol listesi; sertifika süresi yaklaşıyor → yenileme görevi; iş başlangıcı → teminat, SGK ve yer teslim yükümlülükleri.
- Kabul kriterleri:
  - [ ] Sözleşme kaydedilince içindeki tarihli yükümlülükler kendiliğinden yükümlülük kaydına dönüşür.
- Durum: CONFIRMED

### REQ-CMP-009 — Bağımlılık kilitleri ve nedeni

- Kaynak: §24.4; REQ-WFL-029, REQ-WFL-030
- Öncelik: Must · Kademe: T1
- Katman: Sabit + Akış
- Akışla ayarlanan: hangi kilitlerin hangi geçişlerde kurulduğu; kilidin nedeninin gösterilmesi sabittir
- Açıklama: Belirli işlerin sırası zorunlu tutulur: imzalı bordro tamamlanmadan maaş ödemesi (REQ-HR-012), hakediş onayı olmadan fatura, çıkış ve teminat evrakları tamamlanmadan personel çıkışının kapanması (REQ-HR-015). Kullanıcı işlemin neden kilitli olduğunu ve kilidi neyin açacağını açıkça görür.
- Kabul kriterleri:
  - [ ] Kilitli işlemde eksik koşullar bağlantılarıyla listelenir.
- Durum: CONFIRMED

## C. Süre ve ceza

### REQ-CMP-010 — Gecikme cezası riski

- Kaynak: §24.1, §24.2
- Öncelik: Must · Kademe: T1
- Katman: Sabit + Akış
- Akışla ayarlanan: ceza riski uyarısının kime gideceği
- Açıklama: Sözleşme bitiş tarihi ile beklenen bitiş (REQ-PRJ teorik süre) karşılaştırılır; aşılacak gün sayısı günlük cezai tutarla çarpılarak ceza riski gösterilir. Ceza riski ticari veridir.
- Kabul kriterleri:
  - [ ] Ceza riski oluştuğunda proje sorumlusuna ve yönetime uyarı gider; risk tutarı değiştikçe güncellenir.
- Durum: CONFIRMED

### REQ-CMP-011 — Süre uzatımı

- Kaynak: D-178
- Öncelik: Must · Kademe: T1
- Katman: Sabit
- Açıklama: Süre uzatımı talebi gerekçesi ve gecikme dosyasıyla (REQ-CMP-012) kaydedilir. İşverenin kararı belgesiyle girilince sözleşme bitiş tarihi ve ceza hesabı yeni tarihe göre güncellenir; önceki tarihler geçmişte kalır.
- Kabul kriterleri:
  - [ ] Karar girilmeden bitiş tarihi değişmez.
  - [ ] Talep, verilen ve reddedilen gün sayısı projede ayrı görünür.
- Durum: CONFIRMED

## D. İşveren gecikmesi

### REQ-CMP-012 — İşveren gecikme dosyası

- Kaynak: §24.6; REQ-SIT-025; D-124
- Öncelik: Must · Kademe: T1
- Katman: Sabit
- Açıklama: Teslim-tesellüm saatleri ve sözleşme yükümlülükleri birleştirilerek gecikme dosyası hazırlanır: hangi tarihte ne beklendi, işveren ne zaman yerine getirdi, kaç saat/gün gecikme oldu, hangi kayıt, fotoğraf ve belge bunu destekliyor, tahmini maliyet etkisi. Dosya PDF olarak dışa aktarılır. Kanıt kendi kayıtlarımıza dayanır; işverenden imza alınmaz (D-124).
- Kabul kriterleri:
  - [ ] Dosyadaki her gecikme satırı, kaynağı olan kayda bağlantı taşır.
- Durum: CONFIRMED

### REQ-CMP-013 — Bildirim yazısı taslağı

- Kaynak: D-179
- Öncelik: Must · Kademe: T2
- Katman: Sabit + Akış
- Akışla ayarlanan: yazı taslağının ne zaman üretileceği ve kararın kime görev olarak düşeceği (varsayılan akış: işveren yükümlülüğü gecikmesi)
- Açıklama: Panel, bir işveren gecikmesini kayıtlarla belgeleyen resmi bildirim yazısı taslağı (PDF) üretebilir; bu yetenek akışlara `notice_letter.create_draft` aksiyonuyla açıktır. Varsayılan akış, işveren yükümlülüğü gecikince taslağı üretir ve karar için yetkiliye görev açar. Gönderilip gönderilmeyeceğine yetkili karar verir; gönderildiyse tarihi, yolu ve belgesi kaydedilir.
- Kabul kriterleri:
  - [ ] Gönderilen yazı gecikme dosyasına ve yükümlülüğe bağlanır.
  - [ ] Yazı şablonları yetkili kullanıcı tarafından güncellenebilir.
- Durum: CONFIRMED

## E. Teminat, belgeler ve uyuşmazlık

### REQ-CMP-014 — Teminat takibi

- Kaynak: §24.7; D-029
- Öncelik: Must · Kademe: T1
- Katman: Sabit + Akış
- Akışla ayarlanan: uzatma uyarısının ne kadar önce ve kime gideceği
- Açıklama: Teminat mektubu (banka, tutar, para birimi, süre, iade), hakedişten teminat kesintisi (REQ-FIN-006) ve nakit teminat izlenir. İade için gereken evraklar listelenir; iş bitince iade süreci ve alacak görünür.
- Kabul kriterleri:
  - [ ] Süresi bitecek teminat mektubu için uzatma uyarısı düşer.
  - [ ] İade evrakları tamamlanmadan teminat iadesi talebi kapanmaz.
- Durum: CONFIRMED

### REQ-CMP-015 — Teminat mektubu komisyonu projenin gideridir

- Kaynak: D-180
- Öncelik: Must · Kademe: T2
- Katman: Sabit
- Açıklama: Teminat mektubunun banka komisyonu, mektubun alındığı projenin gideridir ve mektup süresi boyunca dönem dönem yazılır.
- Kabul kriterleri:
  - [ ] Mektup iade edilince komisyon yazımı durur.
- Durum: CONFIRMED

### REQ-CMP-016 — Süreli belgeler tek listede

- Kaynak: §31, §24.7; REQ-EQP-015, REQ-HR-003
- Öncelik: Must · Kademe: T1
- Katman: Sabit + Akış + Tanım
- Akışla ayarlanan: uyarı ve görevin kime düşeceği
- Tanımla ayarlanan: belge türleri ve ne kadar önce uyarılacağı
- Açıklama: Şirket ve şantiye resmi belgeleri, kurum evrakları ve kalite sertifikaları bitiş tarihleriyle tutulur. Ekipman kontrolleri ve personel belgeleriyle birlikte tüm süreli belgeler tek listede, yaklaşan ve geçen olarak görünür. Yaklaşan son tarih önceden görev ve uyarıya dönüşür.
- Kabul kriterleri:
  - [ ] Liste belge türü, sahip (şirket, şantiye, ekipman, personel) ve kalan güne göre süzülür.
- Durum: CONFIRMED

### REQ-CMP-017 — Uyuşmazlık dosyaları

- Kaynak: §24.7
- Öncelik: Should · Kademe: T2
- Katman: Sabit
- Açıklama: Uyuşmazlık ve hak talebi dosyaları proje veya şirket bazında tutulur: konu, taraf, tarih, tutar, durum, ilgili gecikme dosyaları, yazışmalar ve belgeler.
- Kabul kriterleri:
  - [ ] Uyuşmazlık işveren karnesine yansır (REQ-CRM-009).
- Durum: CONFIRMED

---

## Yetenek kataloğu — CMP

Biçim: `docs/requirements/README.md`.

### Olaylar

| Kod | Ad | Ne zaman | Taşıdığı alanlar | Veri sınıfı |
|---|---|---|---|---|
| `contract.signed` | Sözleşme kaydedildi | Sözleşme veya yeni sürüm yürürlüğe girdiğinde | tür, firma, proje | ticari |
| `obligation.due_soon` | Yükümlülük tarihi yaklaşıyor | Uyarı süresine girildiğinde | yükümlülük, sorumlu taraf, son tarih | iç |
| `obligation.overdue` | Yükümlülük gecikti | Son tarih geçtiğinde | yükümlülük, sorumlu taraf, gecikme | iç |
| `client_obligation.delayed` | İşveren yükümlülüğü gecikti | İşveren tarafı gecikince | proje, yükümlülük, gecikme | iç |
| `delay_penalty.risk_changed` | Ceza riski değişti | Beklenen bitiş sözleşme tarihini aşınca veya risk değişince | proje, gün, tutar | ticari |
| `extension_of_time.decided` | Süre uzatımı karara bağlandı | İşveren kararı girildiğinde | proje, istenen, verilen gün | iç |
| `guarantee.expiring` | Teminat süresi bitiyor | Uyarı süresine girildiğinde | teminat, bitiş | ticari |
| `document.expiring` | Süreli belge bitiyor | Uyarı süresine girildiğinde | belge türü, sahip, bitiş | iç |
| `framework_agreement.expiring` | Çerçeve anlaşma bitiyor | Uyarı süresine girildiğinde | tedarikçi, bitiş | ticari |

### Aksiyonlar

| Kod | Ad | Girdi | Gereken yetki | İki kez çalışırsa | Yarıda kalırsa |
|---|---|---|---|---|---|
| `obligation.create` | Yükümlülük oluştur | sözleşme, ne yapılacak, sorumlu, son tarih | akışın sistem yetkisi | Aynı sözleşme, konu ve tarih için açık yükümlülük varsa onu döndürür | Yükümlülük açılmamış sayılır |
| `notice_letter.create_draft` | Bildirim yazısı taslağı üret | proje, yükümlülük | akışın sistem yetkisi | Aynı yükümlülük için gönderilmemiş taslak varsa onu döndürür | Taslak üretilmemiş sayılır |

### Koşul alanları

| Kod | Ad | Tip | Veri sınıfı |
|---|---|---|---|
| `obligation.responsible_party` | Sorumlu taraf | seçim | iç |
| `obligation.days_to_due` | Son tarihe kalan gün | sayı | iç |
| `delay_penalty.risk_amount` | Ceza riski tutarı | tutar | ticari |
| `document.days_to_expiry` | Belgenin bitmesine kalan gün | sayı | iç |
| `contract.type` | Sözleşme türü | seçim | iç |
