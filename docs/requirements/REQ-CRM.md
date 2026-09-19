# REQ-CRM — Talep, İletişim, İşveren Karnesi ve İhale Takibi

Durum: CONFIRMED (sahip, 2026-09-18) · 2026-09-18 · Modül: CRM (Leads & Client Relations)

Kaynaklar: kararlar D-027, D-103, D-169…D-172.

**Sınır.** Firma kaydının kendisi (tek kayıt, roller) D-027'dir ve ortaktır. Teklifin hazırlanması ve fiyat REQ-QTE'dedir. Proje ve aşamaları REQ-PRJ'dedir. Hatırlatma ve üst seviyeye taşıma mekanizması REQ-TSK-006'dadır. Ödeme ve tahsilat verisi REQ-FIN'den okunur. Kaçırılan ihalenin performansa yansıması REQ-PRF'dedir. E-postadan akış başlatmak ilk sürümde yoktur (D-103, DEF-006).

Terimler (`docs/domain/GLOSSARY.md`): Party, Client, Lead, Contact Log, Lead Source, Loss Reason, Client Scorecard, Scorecard Note, Tender, Quote.

---

## A. Talep ve iletişim

### REQ-CRM-001 — Hiçbir temas hafızada kalmaz

- Kaynak: Özellik Yapısı (eşleme: `docs/requirements/README.md`)
- Öncelik: Must · Kademe: T1
- Katman: Sabit + Tanım
- Tanımla ayarlanan: talep kaynakları
- Açıklama: Şirkete ulaşan her temas kaydedilir. Kaynaklar: şirket bilgi e-postası, telefon, WhatsApp, personelin kendi bulduğu iş, kurum/ana firma görüşmesi, mevcut müşteri takip görüşmesi. Kaynak listesi tanımlardan genişletilebilir.
- Kabul kriterleri:
  - [ ] Her talepte kaynak, kayıt tarihi ve kaydı açan kişi bulunur.
- Durum: CONFIRMED

### REQ-CRM-002 — Hızlı kayıt ekranı

- Kaynak: D-170
- Öncelik: Must · Kademe: T1
- Katman: Sabit + Akış
- Akışla ayarlanan: dönüş görevinin açılması ve hatırlatması
- Açıklama: Telefon ve WhatsApp temasları için telefondan da kullanılabilen hızlı kayıt ekranı vardır: kim aradı, hangi firma, ne istedi, kim ilgilenecek, ne zamana kadar dönüş yapılacak. Sonradan dönüşün yapılıp yapılmadığı ve sonuç eklenir. Ses kaydı tutulmaz. WhatsApp'a bağlantı kurulmaz; gerekirse ekran görüntüsü eklenir (D-170).
- Kabul kriterleri:
  - [ ] Hızlı kayıt, ilgilenecek kişi ve dönüş tarihi seçilmeden kaydedilmez.
  - [ ] İlgilenecek kişiye dönüş tarihli görev düşer.
- Durum: CONFIRMED

### REQ-CRM-003 — E-postadan talep elle açılır

- Kaynak: D-169
- Öncelik: Must · Kademe: T2
- Katman: Sabit
- Açıklama: Bilgi e-postasına gelen teklif talebi, personel tarafından hızlı kayıt ekranından talep olarak açılır; e-posta ekleriyle birlikte kayda yüklenir. Panel e-posta kutusunu okumaz.
- Kabul kriterleri:
  - [ ] Yüklenen e-postanın gönderen, tarih ve konu bilgisi talepte görünür.
- Durum: CONFIRMED

### REQ-CRM-004 — Talep firmaya bağlanır

- Kaynak: D-027
- Öncelik: Must · Kademe: T1
- Katman: Sabit
- Açıklama: Talep mevcut firma kaydına bağlanır; firma kayıtlı değilse yeni firma kaydı açılır. Aynı firma için ikinci kayıt açılmaz.
- Kabul kriterleri:
  - [ ] Yeni firma adı girilirken benzer adlı mevcut firmalar önerilir.
- Durum: CONFIRMED

### REQ-CRM-005 — İletişim günlüğü

- Kaynak: Özellik Yapısı (eşleme: `docs/requirements/README.md`)
- Öncelik: Must · Kademe: T2
- Katman: Sabit
- Açıklama: Talebe bağlı olmayan görüşmeler de (kurum, ana firma, mevcut müşteri takibi) firmanın iletişim günlüğüne tarih, kişi, konu ve sonuçla yazılır.
- Kabul kriterleri:
  - [ ] Firma kartında talepler ve görüşmeler tek zaman çizelgesinde görünür.
- Durum: CONFIRMED

### REQ-CRM-006 — Talebin aşamaları

- Kaynak: Özellik Yapısı (eşleme: `docs/requirements/README.md`)
- Öncelik: Must · Kademe: T2
- Katman: Sabit + Tanım
- Tanımla ayarlanan: talep aşamaları ve kayıp nedenleri
- Açıklama: Talep şu aşamalardan geçer: Yeni → İnceleniyor → Teklif hazırlanıyor → Teklif verildi → Kazanıldı veya Kaybedildi. Aşamalar katalogdur ve ayarlanabilir.
- Kabul kriterleri:
  - [ ] "Kaybedildi" kayıp nedeni seçilmeden işaretlenemez; nedenler katalogdur.
  - [ ] Her aşama geçişi tarih ve kişiyle talebin geçmişinde görünür.
- Durum: CONFIRMED

## B. Cevapsız talep

### REQ-CRM-007 — Cevapsız talep hatırlatılır ve yukarı taşınır

- Kaynak: REQ-TSK-006
- Öncelik: Must · Kademe: T1
- Katman: Akış
- Akışla ayarlanan: hatırlatma zamanı, üst seviyeye taşıma zinciri ve süreleri (varsayılan akış: cevapsız talep)
- Açıklama: Varsayılan "cevapsız talep" akışı: dönüş tarihine kadar cevaplanmayan talep için ilgili kişiye hatırlatma gider; gecikme sürerse üst yönetime taşınır. Süreler ve zincir akışta değiştirilir.
- Kabul kriterleri:
  - [ ] Talep "İnceleniyor" veya sonraki bir aşamaya geçince hatırlatma durur.
- Durum: CONFIRMED

### REQ-CRM-008 — Sahip cevapsız talepleri görür

- Kaynak: REQ-RPT-007
- Öncelik: Must · Kademe: T2
- Katman: Sabit
- Açıklama: Sahip "Bugün" ekranında cevapsız talepleri (ör. "2 gündür cevaplanmamış teklif talebi") görür; tıklayınca kime atandığını ve neden ilerlemediğini görür.
- Kabul kriterleri:
  - [ ] Cevapsız talep, sebebi çözülene kadar "Dikkat" bölümünde kalır (REQ-RPT-008).
- Durum: CONFIRMED

## C. İşveren karnesi

### REQ-CRM-009 — İşveren karnesi kayıtlardan hesaplanır

- Kaynak: D-171
- Öncelik: Must · Kademe: T1
- Katman: Sabit
- Açıklama: Her işverenin kartı zamanla karneye dönüşür. Kayıtlardan kendiliğinden hesaplananlar: geçmiş ve devam eden projeler, verilen teklifler, kazanılan/kaybedilen işler, ödeme ve tahsilat geçmişi, ortalama ödeme hızı, hakediş onay gecikmeleri, saha teslim/dolgu/beton/demir gecikmeleri, geçmiş işlerin gerçek kârlılığı, kesinti geçmişi. Ödeme ve kârlılık ticari veridir.
- Kabul kriterleri:
  - [ ] Her gösterge, onu oluşturan kayıtlara açılabilir.
  - [ ] Elle puan verilmez.
- Durum: CONFIRMED

### REQ-CRM-010 — Karneye gerekçeli not

- Kaynak: D-171
- Öncelik: Must · Kademe: T2
- Katman: Sabit
- Açıklama: Yetkili kişi karneye tarihli ve gerekçeli not ekler (ör. sözleşme kaynaklı problem, uyuşmazlık). Not değiştirilmez; düzeltme yeni notla yapılır.
- Kabul kriterleri:
  - [ ] Notta yazan kişi ve tarih görünür; not silinmez.
- Durum: CONFIRMED

### REQ-CRM-011 — Karne teklifte görünür

- Kaynak: REQ-QTE
- Öncelik: Must · Kademe: T2
- Katman: Sabit
- Açıklama: Aynı işverene teklif hazırlanırken karnenin özeti (ör. "geç ödüyor", "sahayı sık bekletiyor") teklif ekranında görünür, böylece ticari risk fiyat ve şartlara yansıtılabilir.
- Kabul kriterleri:
  - [ ] Teklif ekranındaki özet, ticari yetkisi olmayan kullanıcıya ödeme ve kârlılık rakamlarını göstermez.
- Durum: CONFIRMED

## D. İhale

### REQ-CRM-012 — İhale ve fırsat son tarihleri

- Kaynak: Özellik Yapısı (eşleme: `docs/requirements/README.md`)
- Öncelik: Must · Kademe: T1
- Katman: Sabit + Akış
- Akışla ayarlanan: uyarının ne kadar önce ve kime gideceği
- Açıklama: İhale ve yeni iş fırsatları son tarihleriyle izlenir; son tarih yaklaşınca sorumlusuna ve yöneticisine uyarı gider.
- Kabul kriterleri:
  - [ ] Son tarihi geçen ve teklif verilmemiş ihale "kaçırıldı" olarak işaretlenir.
- Durum: CONFIRMED

### REQ-CRM-013 — Kaçırılan ihale performansa yansır

- Kaynak: REQ-PRF
- Öncelik: Should · Kademe: T2
- Katman: Sabit
- Açıklama: Kaçırılan ihale veya zamanında hazırlanmayan teklif, ilgili satış/teknik ofis kişisinin performans verisine geçer.
- Kabul kriterleri:
  - [ ] Performansa geçen kayıt, kaçırılan ihaleye bağlantı taşır.
- Durum: CONFIRMED

## E. Kazanılan iş

### REQ-CRM-014 — Kazanılan işten hazır doldurulmuş proje

- Kaynak: D-172; REQ-PRJ-003
- Öncelik: Must · Kademe: T1
- Katman: Sabit
- Açıklama: Uygulama işinde talep "Kazanıldı" işaretlenince talep ve kabul edilen teklifteki bilgilerle (işveren, kalemler, miktarlar, fiyatlar) taslak proje açılır; teknik ofis tamamlar. Proje "sözleşme" aşamasından başlar; önceki aşamalar (talep/fırsat, ön inceleme, teklif, görüşme/pazarlık) talebin geçmişinden gelir ve projenin geçmişinde görünür (D-172'den türetilen kural, sahip onayladı).
- Kabul kriterleri:
  - [ ] Bir talepten yalnızca bir proje açılır; proje talebe ve teklife bağlantı taşır.
 - [ ] Ürün satışında proje açılmaz; kazanılan teklif satış siparişine döner (REQ-QTE-014…015, REQ-QTE-018, REQ-QTE-014).
- Durum: CONFIRMED

---

## Yetenek kataloğu — CRM

Biçim: `docs/requirements/README.md`.

### Olaylar

| Kod | Ad | Ne zaman | Taşıdığı alanlar | Veri sınıfı |
|---|---|---|---|---|
| `lead.created` | Talep açıldı | Talep kaydedildiğinde | firma, kaynak, ilgilenecek kişi, dönüş tarihi | iç |
| `lead.unanswered` | Talep cevaplanmadı | Dönüş tarihi geçtiğinde | talep, ilgilenecek kişi, bekleme süresi | iç |
| `lead.stage_changed` | Talep aşaması değişti | Aşama değiştiğinde | talep, eski ve yeni aşama | iç |
| `lead.won` | İş kazanıldı | "Kazanıldı" işaretlendiğinde | talep, firma, teklif | ticari |
| `lead.lost` | İş kaybedildi | "Kaybedildi" işaretlendiğinde | talep, firma, kayıp nedeni | iç |
| `tender.deadline_approaching` | İhale son tarihi yaklaşıyor | Uyarı süresine girildiğinde | ihale, son tarih, sorumlu | iç |
| `tender.missed` | İhale kaçırıldı | Son tarih teklifsiz geçtiğinde | ihale, sorumlu | iç |

### Aksiyonlar

Yok. Talebi ve görüşmeyi bir insan girer.

### Koşul alanları

| Kod | Ad | Tip | Veri sınıfı |
|---|---|---|---|
| `lead.source` | Talep kaynağı | seçim | iç |
| `lead.waiting_hours` | Cevapsız bekleme süresi | sayı (saat) | iç |
| `client_scorecard.average_payment_days` | Ortalama ödeme günü | sayı | ticari |
| `tender.days_to_deadline` | İhale son tarihine kalan gün | sayı | iç |
