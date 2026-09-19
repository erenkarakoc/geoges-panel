# Uçtan Uca Akış Tanımları

Durum: TASLAK (eksikler D-222 ile kapandı; sahip onayı bekleniyor) · Son güncelleme: 2026-09-19

Sekiz uçtan uca süreç (REQ-WFL-011, REQ-WFL-028) burada **gerçek akış tanımı** olarak yazılır ve her adım palete karşı sınanır (D-089, TASK-0042). 2026-09-17 sınamasının (`docs/workflows/README.md`) yeni düğümlerle tekrarıdır. Bu tanımlar Phase 08'de motorun kabul testleri olur (REQ-WFL-028).

## Nasıl okunur

- Her süreç **birbirini tetikleyen kısa akışlardan** kurulur (D-104). Akış kodları `A1.1` biçimindedir: süreç numarası, akış sırası.
- Her iş adımı üç kutudan birine konur:
  - **Ç — çekirdek:** veri girişi, defter, hesap. Akış düğümü değildir; modül yapar ve bir olay yayımlar.
  - **Düğüm:** paletteki bir adım (REQ-WFL-005): başlangıç/olay, onay, görev, koşul, süre/bekleme, bildirim, eskalasyon, paralel dal, birleşme, alt akış, kilit, bitiş, kayıt oluştur / durum değiştir, her biri için.
  - **Eksik:** palet veya katalog karşılamıyor. Bu belgede eksikler **K-** koduyla listelenir ve kapanış kararı sonunda yazılır.
- Olay ve aksiyon kodları modüllerin yetenek kataloglarındandır (`docs/requirements/REQ-*.md` sonundaki "Yetenek kataloğu"). Rol kodları: `docs/domain/PERMISSION_MATRIX.md`.
- Süreler, eşikler, onaylayıcılar ve zincirler **şablonun varsayılanıdır**; yönetim akış tasarımcısında değiştirir (REQ-WFL-027). Buradaki sayılar örnektir.
- **Görev düğümü**, görev kapanana kadar akışı bekletir. Sistemin açtığı görev, sorun çözülünce kendiliğinden kapanır (REQ-TSK-005). Örneğin "düzelt ve yeniden gönder" görevi, kayıt yeniden gönderilince kapanır.
- **Onay düğümünün** üç sonucu vardır: onayla, reddet, düzeltmeye geri gönder (D-099). Onay isteği Onaylar kuyruğuna düşer (SCR-012).

---

## 1. Yeni işten tahsilata

Zincir: talep → teklif onayı → kazanılan işin başlatılması → kurum onayı → günlük kayıt → hakediş → fatura → tahsilat → maliyet geri beslemesi.

| # | Adım | Kutu | Nasıl |
|---|---|---|---|
| 1 | İşveren talep gönderir | Ç | Hızlı kayıt (SCR-081) |
| 2 | Talep kayda düşer | Ç | `lead.created` |
| 3 | Teknik inceleme, yaklaşık miktar | Düğüm | A1.1 görev |
| 4 | Teklif; maliyet ve marj görünür | Ç + düğüm | Teklif hazırlama (SCR-091); A1.2 onay |
| 5 | Görüşme / pazarlık | Ç | Teklif durumu |
| 6 | Teklif kazanılır | Ç | `quote.won`, `lead.won`; taslak proje açılır (REQ-CRM-014) → `project.created` |
| 7 | Sözleşme ve yükümlülükleri açılır | Ç + düğüm | A1.3 görev; sözleşmeyi ve yükümlülüklerini insan girer → `contract.signed` |
| 8 | Teknik proje, statik, kurum onayı takip edilir | Düğüm | A1.4 her biri için + dış taraf onayı alt akışı |
| 9 | Proje ve şantiye oluşturulur | Ç + düğüm | Proje 6. adımda açıldı; şantiyeyi A1.4 sonundaki görevle insan açar |
| 10 | Günlük üretim girilir ve onaylanır | Ç + düğüm | A3.1, A3.2 (süreç 3) |
| 11 | Onaylı üretim hakedişe akar | Ç | REQ-FIN |
| 12 | Hakediş işverene sunulur ve onaylanır | Düğüm | A1.5 taslak + onay; A1.6 dış taraf onayı |
| 13 | Fatura görevi oluşur | Düğüm | A1.6 görev |
| 14 | Fatura kesilir | Ç | İnsan keser; akış kesemez (D-080) → `client_progress_payment.invoiced` |
| 15 | Tahsilat girilir | Ç | `collection.recorded`; gecikirse A1.7 |
| 16 | Cari bakiye azalır | Ç | Defter |
| 17 | Proje kâr-zararı güncellenir | Ç | Türetilen |
| 18 | Teklif ile gerçekleşen karşılaştırılır | Ç + düğüm | Hesap çekirdekte (SCR-093); A1.8 görev |

**A1.1 Talep karşılama**
- Tetik: `lead.created`
- Görev "Ön inceleme ve yaklaşık miktar" → talebin sorumlusu (SAT); son tarih 3 iş günü; eskalasyon: SAT → GM.
- Bitiş.

**A1.2 Teklif onayı** (şablon, REQ-WFL-028)
- Tetik: `quote.submitted_for_approval`
- Kilit: onay çıkana kadar teklif "Gönderildi" yapılamaz (REQ-WFL-029).
- Koşul: `quote.margin_percent` < hedef marj **veya** `quote.total_try` > eşik.
  - Evet → onay: GM.
  - Hayır → onay gerekmez; kilit kalkar → bitiş.
- Onayla → kilit kalkar → bitiş. Reddet → bildirim: hazırlayana → bitiş. Düzeltmeye → görev "Düzelt ve yeniden sun" → hazırlayan; geri kenar onaya.

**A1.3 Kazanılan işin başlatılması**
- Tetik: `project.created`
- Paralel dal:
  - Görev "Sözleşmeyi ve yükümlülüklerini kaydet" → GM. Kapanış: `contract.signed`.
  - Görev "Proje bilgilerini tamamla" → TO.
- Birleşme → durum değiştir: proje aşaması "teknik proje / statik / kurum onayı" (REQ-PRJ-003) → bitiş.

**A1.4 Kurum onayı takibi**
- Tetik: `project.stage_changed`, aşama = teknik proje / statik / kurum onayı.
- Her biri için (projenin kurum onayı gereken teknik ofis işleri):
  - Alt akış "Dış taraf onayı" (D-102): görev "Kuruma sun" → TO; bekleme; görev "Cevabı belgesiyle işle" → TO; hatırlatma ve eskalasyon.
- Birleşme → görev "Şantiyeyi aç, mobilizasyonu başlat" → KO → durum değiştir: proje aşaması "mobilizasyon ve saha kurulumu" → bitiş.

**A1.5 Aylık hakediş hazırlığı**
- Tetik: takvim, her ayın 25'i.
- Her biri için (aşaması "uygulama" veya "aylık hakedişler" olan projeler):
  - Kayıt oluştur `client_progress_payment.create_draft`.
  - Görev "Hakedişi kontrol et ve iç onaya hazırla" → projenin hakediş sorumlusu (MUH). Kapanış: `client_progress_payment.prepared`.
- Bitiş.

**A1.6 Hakediş → fatura** (şablon)
- Tetik: `client_progress_payment.prepared`
- Koşul: `client_progress_payment.net_amount` > eşik → onay: GM; değilse onay: KO.
- Onayla → görev "İşverene sun" → MUH. Kapanış: `client_progress_payment.submitted`.
  - Alt akış "Dış taraf onayı": işveren cevabı işlenir → durum değiştir: işveren onayladı → `client_progress_payment.client_approved`.
  - Görev "Faturayı kes" → MUH. Kapanış: `client_progress_payment.invoiced`.
- Reddet → bitiş. Düzeltmeye → görev "Düzelt" → hazırlayan; geri kenar onaya.

**A1.7 Geciken tahsilat**
- Tetik: `client_progress_payment.overdue`
- Görev "Tahsilatı takip et" → SAT; eskalasyon: SAT → GM → SAH. Kapanış: `collection.recorded`.
- Bitiş.

**A1.8 Maliyet geri beslemesi**
- Tetik: `project.stage_changed`, aşama = tamamlama.
- Görev "Teklif ile gerçekleşeni incele" → teklifi hazırlayan.
- Ayrıca `cost_feedback.deviation_exceeded` gelirse görev "Sapmayı açıkla" → aynı kişi (REQ-QTE).
- Bitiş.

## 2. Çelik şeridin siparişten sahada kullanıma

| # | Adım | Kutu | Nasıl |
|---|---|---|---|
| 1 | Proje ihtiyacı çıkar | Düğüm | A2.1 eşik tetik + taslak talep |
| 2 | Haddecilerden fiyat ve termin karşılaştırılır | Ç + düğüm | SCR-053; A2.2 görev |
| 3 | Sipariş verilir | Ç | `purchase_order.placed` |
| 4 | Fabrikaya gelir, boy ve adet kaydı | Ç | Teslim alım → `purchase_order.received` |
| 5 | Delme / işleme | Ç | Fabrika günlük kaydı |
| 6 | Fire hesaplanır | Ç | Üretim zinciri |
| 7 | Galvanize sevk edilir | Ç | `shipment.dispatched` |
| 8 | Galvanizden dönüş kaydı | Ç | `shipment.received` |
| 9 | Fark ve fire kontrol edilir | Düğüm | A2.3 |
| 10 | Şantiyeye sevk edilir | Ç + düğüm | A2.4 malzeme çıkış talebi |
| 11 | Şantiye teslim alır | Ç | `shipment.received` |
| 12 | Stok artar | Ç | Stok hareketi |
| 13 | Günlük montajda şerit kullanılır | Ç | Günlük kayıt |
| 14 | Saha stoğu azalır | Ç | Sarf |
| 15 | Kritik seviyede talep/sipariş uyarısı | Düğüm | A2.1 aynı akış |

**A2.1 Kritik stok → satın alma talebi**
- Tetik: eşik, `stock.days_to_critical` ≤ 14; ayrıca `stock.below_critical` olayı.
- Kayıt oluştur `purchase_request.create_draft` (malzeme, lokasyon, önerilen miktar).
- Görev "Talebi tamamla ve gönder" → SAL. Kapanış: `purchase_request.submitted`.
- Bitiş.

**A2.2 Satın alma talebi onayı** (şablon)
- Tetik: `purchase_request.submitted`
- Koşul: `purchase_request.amount` > eşik → onay: GM; değilse onay: KO.
- Onayla → görev "Tedarikçileri karşılaştır ve sipariş ver" → SAL. Kapanış: `purchase_order.placed`.
- Reddet → bildirim → bitiş. Düzeltmeye → görev → talep eden; geri kenar onaya.

**A2.3 Fark ve fire kontrolü**
- Tetik: `weighbridge_difference.exceeded`
- Görev "Farkı açıkla" → sevkiyat sorumlusu (SAL); eskalasyon → GM.
- Koşul: `weighbridge.difference_percent` > ikinci eşik → bildirim: GM, SAH.
- Bitiş.

**A2.4 Malzeme çıkış talebi** (şablon)
- Tetik: `material_issue_request.submitted`
- Onay: KO.
- Onayla → görev "Sevk et" → SAL. Kapanış: `shipment.dispatched`.
- Reddet → bitiş. Düzeltmeye → talep edene; geri kenar onaya.

## 3. Günlük saha üretimi

| # | Adım | Kutu | Nasıl |
|---|---|---|---|
| 1 | Saha mühendisi kaydı açar | Ç + düğüm | A3.1 taslağı hazırlar; kayıt SCR-021'de |
| 2–6 | Döküm, montaj, şerit, saatler, teslim-tesellüm, puantaj, zayi, harcama | Ç | SCR-021 bölümleri |
| 7 | Sarf otomatik önerilir | Ç | Reçete (REQ-SIT-029) |
| 8 | Koordinatöre gönderilir | Ç | `daily_site_log.submitted` |
| 9 | Koordinatör çapraz kontrol eder | Düğüm | A3.2 onay |
| 10 | Eksikse düzeltme ister, tamsa onaylar | Düğüm | A3.2 onayın üç sonucu |
| 11 | Veri ilerleme, stok, hakediş, performans, finans ve yönetim ekranına dağılır | Ç | `daily_site_log.approved` |

**A3.1 Günlük kaydın açılması**
- Tetik: takvim, çalışma günleri 07:00 (çalışma takvimi).
- Her biri için (aktif şantiyeler):
  - Kayıt oluştur `daily_site_log.create_draft`.
  - Bildirim → günün giriş sorumlusu.
- Bitiş.

**A3.2 Günlük saha kaydı onayı** (şablon)
- Tetik: `daily_site_log.submitted`
- Onay: şantiyenin koordinatörü (KO, kayıtla ilişki, D-097); 8 saatte karar yoksa eskalasyon → GK.
- Onayla:
  - Koşul `daily_site_log.expense_total` > eşik → onay: GM (saha harcaması, REQ-FIN-015).
  - Bitiş.
- Düzeltmeye → görev "Düzelt ve yeniden gönder" → gönderen. Görev kayıt yeniden gönderilince kapanır; geri kenar onaya.
- Reddet → şablonda kapalıdır: iş yapılmış bir gün yok sayılamaz, yalnız düzeltilir (D-222).

**A3.3 Kaçırılan giriş**
- Tetik: `daily_site_log.deadline_missed`
- Görev "Günün kaydını gir" → giriş sorumlusu; eskalasyon → KO → GK.
- Bitiş.

## 4. Personel çıkışı

| # | Adım | Kutu | Nasıl |
|---|---|---|---|
| 1 | Personel "ayrılacak" işaretlenir | Ç | `employee.leaving_date_set` |
| 2 | Çıkış kontrol listesi açılır | Düğüm | A4.1 kayıt oluştur `offboarding_checklist.create_draft` |
| 3 | Gerekli imzalı evraklar listelenir | Ç + düğüm | Maddeler Tanımlar'dan gelir (REQ-HR-015); her biri için görev |
| 4 | Zimmetler kontrol edilir | Düğüm | Her biri için (açık zimmetler) |
| 5 | Eksik telefon, laptop, araç varsa kritik uyarı | Düğüm | Bildirim (kritik) + görev |
| 6 | Sözleşme ve teminat evrakları tamamlatılır | Düğüm | Liste maddesi görevleri |
| 7 | Tüm zorunluluklar kapanınca çıkış tamamlanır | Düğüm | Kilit + birleşme + durum değiştir |

**A4.1 Personel çıkışı** (şablon)
- Tetik: `employee.leaving_date_set`
- Kayıt oluştur `offboarding_checklist.create_draft`
- Kilit: liste kapanmadan personel "ayrıldı" yapılamaz (REQ-WFL-029).
- Paralel dal:
  - Her biri için (listenin açık maddeleri): görev → maddenin sorumlu rolü (varsayılan IK).
  - Her biri için (personelin açık zimmetleri): bildirim (kritik) → IK, varlığın sorumlusu; görev "Zimmeti teslim al" → varlığın sorumlusu. Görev, zimmet kapanınca kapanır.
- Birleşme → durum değiştir: liste "tamamlandı" → kilit kalkar → bitiş.
- Liste süresinde kapanmazsa `offboarding_checklist.overdue` → eskalasyon: IK → GM.
- Erişim, ayrılış tarihinde çekirdek tarafından kapanır (REQ-IAM-007); akış bunu yapmaz.

## 5. İşveren gecikmesi

| # | Adım | Kutu | Nasıl |
|---|---|---|---|
| 1–2 | Alan dolguya teslim edilir, saati kaydedilir | Ç | Günlük kayıt, teslim-tesellüm (REQ-SIT-024) |
| 3 | İşveren geciktirir | — | Dış olay |
| 4 | Geri teslim saati kaydedilir | Ç | `client_wait.recorded` |
| 5 | Gecikme süresi hesaplanır | Ç | `client_wait.hours` (REQ-SIT-025) |
| 6 | Tekrarlayan gecikme tanı ekranında görünür | Ç + düğüm | Tanı kartı çekirdekte; A5.1 geçmişe bakan koşul |
| 7 | Tahmini maliyet etkisi hesaplanır | Ç | REQ-SIT-025 |
| 8 | Sözleşme yükümlülüğüne bağlanır | Ç | Panel bağlar ve yükümlülüğü gecikmiş sayar → `client_obligation.delayed` (REQ-CMP-007, D-222) |
| 9 | Tarihli gecikme / kanıt dosyası hazırlanır | Düğüm | A5.2 `notice_letter.create_draft` |

**A5.1 Tekrarlayan işveren beklemesi**
- Tetik: `client_wait.recorded`
- Koşul, geçmişe bakan (REQ-WFL-008): bu şantiyede son 30 günde 3'ten fazla bekleme **veya** toplam 24 saatten fazla.
  - Evet → bildirim: KO, GM.
- Bitiş.

**A5.2 İşveren yükümlülüğü gecikmesi** (REQ-CMP varsayılanı)
- Tetik: `client_obligation.delayed`
- Kayıt oluştur `notice_letter.create_draft`.
- Görev "Yazıyı incele, gönderme kararını ver" → GM. Kapanış: yazı gönderildi ya da gerekçeyle gönderilmedi.
- Bitiş.

## 6. Toplantı kararından tamamlanan göreve

| # | Adım | Kutu | Nasıl |
|---|---|---|---|
| 1–4 | Toplantı, karar, sorumlu, son tarih | Ç | SCR-161 |
| 5 | Görev otomatik oluşur | Ç | REQ-MTG-005 (sabit) |
| 6 | Kullanıcı bildirim alır | Ç | Yeni görev bildirimi (REQ-TSK-010) |
| 7 | Süre yaklaşınca hatırlatılır | Düğüm | A6.1 |
| 8 | Gecikirse üst yönetime çıkar | Düğüm | A6.2 |
| 9 | Görev ve karar birlikte kapanır | Ç | REQ-MTG-007 |

**A6.1 Karar hatırlatması**
- Tetik: takvim, kararın son tarihine 2 gün kala.
- Bildirim → sorumlu.
- Bitiş.

**A6.2 Geciken karar**
- Tetik: `meeting_decision.overdue`
- Eskalasyon: sorumlu → toplantıyı yöneten → GM.
- Bitiş.

## 7. Kritik sertifika / İSG olayı

| # | Adım | Kutu | Nasıl |
|---|---|---|---|
| 1 | Sertifika süresi yaklaşır veya İSG olayı açılır | Ç | `test_certificate.expiring`, `training.expiring`, `document.expiring`, `employee.document_expiring`, `ohs_incident.recorded` |
| 2 | Sorumluya görev | Düğüm | A7.1, A7.2 |
| 3 | Süre ve aksiyon takip edilir | Düğüm | Görev son tarihi + eskalasyon |
| 4 | Ciddi durum "Dikkat" bölümünde görünür | Ç | REQ-RPT-007 listesi |
| 5 | Belge veya aksiyon tamamlanınca kayıt kapanır | Ç + düğüm | Yeni belge yüklenince görev kapanır; olayda durum değiştir |

**A7.1 Süresi biten belge**
- Tetik: yukarıdaki dört "süresi yaklaşıyor" olayından biri.
- Görev "Yenile" → belgenin sorumlusu; eskalasyon → KIS → GM.
- Görev, yeni belge yüklenince kapanır.
- Bitiş.

**A7.2 İSG olayı**
- Tetik: `ohs_incident.recorded`
- Koşul `ohs_incident.severity` = ciddi:
  - Evet → bildirim (kritik): SAH, GM, KIS; kayıt oluştur `nonconformity.create_draft`.
- Görev "Olayı incele, aksiyonları tamamla" → KIS; eskalasyon → GM.
- Durum değiştir: olay "kapandı".
- Bitiş.

## 8. Nakit sıkışması

| # | Adım | Kutu | Nasıl |
|---|---|---|---|
| 1–2 | Beklenen tahsilatlar ve ödemeler geleceğe dağılır | Ç | Nakit projeksiyonu (REQ-FIN) |
| 3 | Açık 8 haftalık çizelgede önceden görülür | Ç | `cash_projection.shortfall_expected` |
| 4 | Yönetim uyarı alır | Düğüm | A8.1 bildirim |
| 5 | Öneri ekranı aksiyonları gösterir | Ç | REQ-INT, `recommendation.raised` |
| 6 | Görev muhasebe veya satışa atanır | Düğüm | A8.1 her biri için |

**A8.1 Nakit açığı**
- Tetik: `cash_projection.shortfall_expected`
- Bildirim (kritik) → SAH, GM, MUH.
- Her biri için (açık penceresinde tahsil tarihi geçmiş veya geçecek hakedişler): görev "Tahsilatı hızlandır" → projenin satış sorumlusu (SAT); eskalasyon → GM.
- Bitiş.

---

## Diğer varsayılan şablonlar (REQ-WFL-028)

Uçtan uca süreçlerin dışında kalan dört şablon da aynı sınamadan geçti:

| Şablon | Tetik | Adımlar | Durum |
|---|---|---|---|
| Ödeme onayı | `payment.submitted_for_approval` | Koşul `payment.amount` > eşik → onay GM, değilse KO; hazırlayan kendi ödemesini onaylayamaz (REQ-FIN) | Tam |
| Revizyon talebi | `revision_request.submitted` | Onay: kaydın onaylayıcısı; üç sonuç | Tam |
| Stok sayımı onayı | `stock_count.submitted` | Koşul `stock_count.difference_percent` > tolerans → onay GM, değilse KO | Tam |
| Personel çıkışı, teklif onayı, satın alma talebi, malzeme çıkış talebi, günlük kayıt onayı, hakediş → fatura | Yukarıda | — | Yukarıda |

## Sonuç ve eksikler

**Palet eksiği yok.** On dört adım sekiz sürecin hepsini karşıladı. 2026-09-17 sınamasındaki altı boşluğun (B-1…B-6) hepsi yeni düğümlerle kapandı.

Kalan eksikler **katalog** eksikleriydi (düğüm değil, bir modülün yayımlaması gereken olay veya aksiyon). Hepsi sahip kararıyla kapandı (D-222):

| Kod | Eksik | Nerede lazımdı | Kapanış |
|---|---|---|---|
| K-1 | Teklifin onaya sunulduğunu bildiren olay | Teklif onayı (A1.2) | REQ-QTE olayı `quote.submitted_for_approval` eklendi |
| K-2 | Çıkış kontrol listesini açan aksiyon | Personel çıkışı (A4.1) | REQ-HR aksiyonu `offboarding_checklist.create_draft` eklendi |
| K-3 | Ödemenin onaya sunulduğunu bildiren olay | Ödeme onayı | REQ-FIN olayı `payment.submitted_for_approval` eklendi |
| K-4 | Sayımın onaya sunulduğunu bildiren olay | Stok sayımı onayı | REQ-INV olayı `stock_count.submitted` eklendi |
| K-5 | İşveren beklemesini sözleşme yükümlülüğüne bağlayan yol | Süreç 5, adım 8 | Panel kendisi bağlar; sabit kural (REQ-CMP-007) |

"Her biri için" adımının listesi **tetikleyen kayda bağlı kayıtların sorgusudur** ("personelin açık zimmetleri", "projenin kurum onayı gereken işleri"); koşullardaki sorguyla aynı düzenektir ve aynı süre sınırına tabidir (REQ-WFL-009, D-222).

**Sonuç: sekiz süreçte eksik kalmadı.**
