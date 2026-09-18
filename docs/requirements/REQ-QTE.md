# REQ-QTE — Teklif, Maliyet Geri Beslemesi ve Ürün Satışı

Durum: CONFIRMED (sahip, 2026-09-18) · 2026-09-18 · Modül: QTE (Quotes & Sales)

Kaynaklar: Özellik Yapısı §6; kararlar D-027, D-140, D-149, D-173…D-176.

**Sınır.** Talep, işveren karnesi ve kazanılan işten proje açılması REQ-CRM'dedir (REQ-CRM-011, REQ-CRM-014). Kur kuralı REQ-ADM-013 ve REQ-ADM-014'tedir. Stok hareketleri REQ-INV'de, tedarikçi siparişi REQ-PUR'dadır. Fatura, tahsilat ve cari REQ-FIN'dedir. Teklif onayı gerekip gerekmediği iş akışıdır (REQ-WFL).

Terimler (`docs/domain/GLOSSARY.md`): Quote, Quote Version, Quote Template, Estimated Cost, Target Margin, Cost Feedback, Lesson Note, Sales Order, Stock Reservation, Customer, Lead.

---

## A. Teklif kartı

### REQ-QTE-001 — Teklif kaydı

- Kaynak: §6.1
- Öncelik: Must · Kademe: T1
- Açıklama: Teklifte potansiyel işveren veya müşteri, iş/proje başlığı, iş kapsamı, kalemler (panel işleri, çelik şerit, lug, harpuşta, gabion, geosentetik, oto/yaya korkuluk ve diğer kalemler), miktar ve birimler, birim fiyatlar, para birimleri, teklif toplamı, geçerlilik tarihi, özel ticari şartlar, işverenin istediği sertifikalar, teklif dokümanı ve durum tutulur. Teklif bir talebe bağlıdır (REQ-CRM). Fiyat ve maliyet ticari veridir.
- Kabul kriterleri:
  - [ ] Kalemler ürün/iş kataloğundan seçilir; katalog dışı kalem gerekçeyle eklenir.
  - [ ] Geçerlilik tarihi geçen gönderilmiş teklif için sorumlusuna uyarı düşer.
- Durum: CONFIRMED

### REQ-QTE-002 — Teklif durumları ve talebin aşaması

- Kaynak: §6.1; REQ-CRM-006
- Öncelik: Must · Kademe: T1
- Açıklama: Teklif şu durumlardan geçer: Hazırlanıyor → Gönderildi → Görüşme/Pazarlık → Kazanıldı / Kaybedildi / İptal. Teklifin durumu bağlı talebin aşamasını günceller: teklif gönderilince talep "Teklif verildi" olur; teklif kazanılınca veya kaybedilince talep de öyle olur. Bir talebin birden fazla teklifi olabilir; biri kazanılınca diğer açık teklifler "İptal" olur (kapsamdan türetilen kural, sahip onayladı).
- Kabul kriterleri:
  - [ ] "Kaybedildi" kayıp nedeni seçilmeden işaretlenemez.
  - [ ] Her durum geçişi tarih ve kişiyle teklifin geçmişinde görünür.
- Durum: CONFIRMED

### REQ-QTE-003 — Teklif sürümleri

- Kaynak: §6.8
- Öncelik: Must · Kademe: T1
- Açıklama: Gönderilmiş bir teklif değiştirilecekse yeni sürüm açılır (Rev.1, Rev.2…). Gönderilen her sürüm belgesiyle birlikte saklanır ve sürümler yan yana karşılaştırılabilir.
- Kabul kriterleri:
  - [ ] Gönderilmiş sürümün içeriği değiştirilemez.
- Durum: CONFIRMED

## B. Fiyat oluşturma

### REQ-QTE-004 — Yaklaşık proje miktarları

- Kaynak: §6.2
- Öncelik: Must · Kademe: T2
- Açıklama: Teklif öncesinde boykesit, enkesit ve plan incelenerek çıkarılan yaklaşık miktarlar kaydedilir ve teklif kalemlerine aktarılır. Birim fiyat girilirken şehir, kurum, bölge, piyasa koşulları, işveren dinamiği ve proje şartları not olarak kalemle birlikte tutulur.
- Kabul kriterleri:
  - [ ] Yaklaşık miktarların kaynağı olan çizimler teklife belge olarak eklenebilir.
- Durum: CONFIRMED

### REQ-QTE-005 — Tahmini maliyet geçmiş gerçek maliyetten önerilir

- Kaynak: §6.3, §6.7; D-174
- Öncelik: Must · Kademe: T1
- Açıklama: Her kalemin tahmini birim maliyeti, şirketin o kalem için son gerçekleşen birim maliyetinden önerilir. Teklifi hazırlayan öneriyi değiştirebilir; önerilen ve girilen değer yan yana görünür. Veri yoksa maliyet elle girilir.
- Kabul kriterleri:
  - [ ] Önerinin hangi projeden ve hangi döneme ait gerçek maliyetten geldiği görünür.
- Durum: CONFIRMED

### REQ-QTE-006 — "Bu fiyata alırsam ne kazanırım?"

- Kaynak: §6.3; D-173
- Öncelik: Must · Kademe: T1
- Açıklama: Her kalemde tahmini maliyet ile satış fiyatı karşılaştırılır; teklifin tahmini toplam maliyeti, tahmini kârı ve kâr marjı gösterilir. Tahmini maliyete ilgili olduğu ölçüde malzeme, fabrika işleme, saha işçiliği, taşeron işçilik, ekipman, yemek/konaklama ve nakliye girer. Genel gider payı eklenmez; genel gideri karşılamak hedef marjın işidir (D-173, D-149 ile aynı mantık).
- Kabul kriterleri:
  - [ ] Maliyet dökümü kalem ve maliyet türü bazında görünür.
- Durum: CONFIRMED

### REQ-QTE-007 — Hedef marja göre fiyat önerisi

- Kaynak: §6.4
- Öncelik: Must · Kademe: T2
- Açıklama: Yetkili kullanıcı hedef marjı girer (ör. "en az %25"); panel tahmini maliyetten önerilen satış fiyatını hesaplar.
- Kabul kriterleri:
  - [ ] Hedef marjın altında kalan teklif gönderilirken uyarı verilir.
- Durum: CONFIRMED

### REQ-QTE-008 — Çoklu para birimi

- Kaynak: §6.5; REQ-ADM-013, REQ-ADM-014
- Öncelik: Must · Kademe: T1
- Açıklama: Aynı teklifte farklı para birimleri olabilir (ör. panel TL/m², çelik şerit USD/metre). Karşılaştırmada TL karşılığı gösterilir; kalemin kendi para birimi korunur. Kur, önceki iş gününün TCMB alış kurudur; yetkili kullanıcı gerekçeyle elle kur girebilir.
- Kabul kriterleri:
  - [ ] Teklifte kullanılan kur ve tarihi teklif kaydında saklanır.
- Durum: CONFIRMED

## C. Tekliften projeye

### REQ-QTE-009 — Kazanılan uygulama teklifi projeye geçer

- Kaynak: §6.6; REQ-CRM-014
- Öncelik: Must · Kademe: T1
- Açıklama: Kazanılan uygulama teklifi yeniden girilmez: yeni projenin başlangıç bilgisini oluşturur (REQ-CRM-014) veya mevcut bir projeye bağlanır.
- Kabul kriterleri:
  - [ ] Projenin kalemleri, miktarları ve birim fiyatları kazanılan teklif sürümünden gelir ve o sürüme bağlantı taşır.
- Durum: CONFIRMED

## D. Maliyet geri beslemesi

### REQ-QTE-010 — Tahmin ile gerçekleşen karşılaştırılır

- Kaynak: §6.7
- Öncelik: Must · Kademe: T1
- Açıklama: İş ilerledikçe ve iş bitince teklifteki tahmini maliyet ile gerçekleşen maliyet karşılaştırılır: tahmini maliyet, gerçekleşen maliyet, sapma tutarı ve yüzdesi, teklifin isabeti. Karşılaştırma iki tarafta da genel gider olmadan yapılır (D-149, D-173).
- Kabul kriterleri:
  - [ ] Sapma kalem ve maliyet türü bazında açılabilir.
  - [ ] Sapması belirlenen eşiği aşan tamamlanmış işte "maliyet neden aşıldı" açıklaması istenir; eşik merkezi kuraldır.
- Durum: CONFIRMED

### REQ-QTE-011 — Ders notları sonraki tekliflere taşınır

- Kaynak: §6.7
- Öncelik: Should · Kademe: T2
- Açıklama: Tamamlanan işe "ders/not" yazılır. Aynı kalemi veya aynı işvereni içeren yeni teklif hazırlanırken ilgili notlar teklif ekranında görünür.
- Kabul kriterleri:
  - [ ] Not, yazıldığı işe ve kaleme bağlantı taşır.
- Durum: CONFIRMED

## E. Teklif belgesi

### REQ-QTE-012 — Teklif belgesi panelde üretilir

- Kaynak: §6.8
- Öncelik: Must · Kademe: T1
- Açıklama: Teklif kaydından kurumsal görünümlü PDF üretilir; Word'de yeniden yazılmaz. Belgede kapak ve logo, muhatap firma ve kişi, proje adı, teklif tarihi ve numarası, iş tanımı ve kapsam maddeleri, kalem tablosu (tanım, birim, miktar, birim fiyat, para birimi), ticari şartlar (yemek/konaklama kimde, ödeme, geçerlilik vb.) ve imzalayan kişi bulunur.
- Kabul kriterleri:
  - [ ] Üretilen belge teklif kaydına kendiliğinden eklenir.
  - [ ] Tahmini maliyet ve marj belgede hiçbir zaman yer almaz.
- Durum: CONFIRMED

### REQ-QTE-013 — Teklif şablonları

- Kaynak: §6.8
- Öncelik: Must · Kademe: T2
- Açıklama: Şablonlar iki gruptur. Uygulama teklifleri: Toprakarme duvar, Gabion duvar, Otokorkuluk sistemi, Çelik ağ şev koruması. Ürün teklifleri: Geonet, Geogrid, Çelik şerit, Geomembran (HDPE), Geocell. Sabit metinler şablondan, değişken bilgiler teklif kaydından gelir. Yetkili kullanıcı yeni şablon ve ürün grubu ekler, şablon metinlerini günceller.
- Kabul kriterleri:
  - [ ] Şablon değişikliği daha önce üretilmiş belgeleri değiştirmez.
- Durum: CONFIRMED

## F. Ürün satışı

### REQ-QTE-014 — Kazanılan ürün teklifi satış siparişine döner

- Kaynak: §6.9
- Öncelik: Must · Kademe: T1
- Açıklama: Şantiyesi olmayan malzeme satışında (geogrid, geomembran, çelik şerit vb.) kazanılan teklif proje ve şantiye açılmadan satış siparişine döner. Zincir: Teklif → Satış siparişi → Tedarik/üretim → Müşteriye sevk → Fatura → Tahsilat.
- Kabul kriterleri:
  - [ ] Satış siparişinin kalemleri ve fiyatları kazanılan teklif sürümünden gelir.
- Durum: CONFIRMED

### REQ-QTE-015 — Satış siparişi kaydı

- Kaynak: §6.9
- Öncelik: Must · Kademe: T1
- Açıklama: Satış siparişinde müşteri, kalemler, fiyat, para birimi, teslim şekli ve tarihi, sevk irsaliyesi ve teslim/kantar belgeleri tutulur. Sevk stoktan veya tedarikçiden doğrudan müşteriye yapılabilir.
- Kabul kriterleri:
  - [ ] Tedarikçiden doğrudan sevkte ilgili satın alma siparişi (REQ-PUR) satış siparişine bağlanır ve stok hareketi oluşmaz.
- Durum: CONFIRMED

### REQ-QTE-016 — Satış siparişi stok ayırır

- Kaynak: D-175; REQ-INV-002
- Öncelik: Must · Kademe: T1
- Açıklama: Stoktan karşılanacak satış siparişinin miktarı açıldığında stokta ayrılır; ayrılan miktar şantiyelere ve başka siparişlere kullanılabilir stok olarak görünmez. Sevk edilince ayırma kalkar ve stok düşer; sipariş iptal edilirse ayırma kalkar.
- Kabul kriterleri:
  - [ ] Stok ekranında her lokasyon için toplam, ayrılmış ve kullanılabilir miktar ayrı görünür.
- Durum: CONFIRMED

### REQ-QTE-017 — Her sevkiyat ayrı faturalanır

- Kaynak: D-176; REQ-FIN-024
- Öncelik: Must · Kademe: T2
- Açıklama: Sipariş birkaç sevkiyatta gidebilir; her sevkiyatta giden miktar için muhasebeye fatura görevi oluşur. Siparişin sevk edilen, faturalanan ve kalan kısmı görünür.
- Kabul kriterleri:
  - [ ] Fatura görevi sevkiyata bağlıdır; fatura girilince görev kapanır.
- Durum: CONFIRMED

### REQ-QTE-018 — Sipariş bazında maliyet ve kâr

- Kaynak: §6.9
- Öncelik: Must · Kademe: T2
- Açıklama: Satış siparişinin maliyeti (stoktan çıkışta lokasyonun ağırlıklı ortalaması, doğrudan sevkte alış bedeli, nakliye) ve kârı sipariş bazında izlenir; teklifteki tahminle geri besleme aynı mantıkla yapılır (REQ-QTE-010).
- Kabul kriterleri:
  - [ ] Sipariş kapandığında tahmini ve gerçekleşen kâr yan yana görünür.
- Durum: CONFIRMED

---

## Yetenek kataloğu — QTE

Biçim: `docs/requirements/README.md`.

### Olaylar

| Kod | Ad | Ne zaman | Taşıdığı alanlar | Veri sınıfı |
|---|---|---|---|---|
| `quote.sent` | Teklif gönderildi | Bir sürüm gönderildiğinde | teklif, sürüm, firma, toplam | ticari |
| `quote.below_target_margin` | Teklif hedef marjın altında | Gönderilirken marj hedefin altındaysa | teklif, marj, hedef | ticari |
| `quote.expiring` | Teklif geçerliliği bitiyor | Uyarı süresine girildiğinde | teklif, geçerlilik tarihi | iç |
| `quote.won` | Teklif kazanıldı | Kazanıldı işaretlendiğinde | teklif, firma, tür (uygulama/ürün) | ticari |
| `quote.lost` | Teklif kaybedildi | Kaybedildi işaretlendiğinde | teklif, firma, kayıp nedeni | iç |
| `cost_feedback.deviation_exceeded` | Maliyet sapması eşiği aştı | Tamamlanan işte sapma eşiği aşınca | proje veya sipariş, sapma yüzdesi | ticari |
| `sales_order.created` | Satış siparişi açıldı | Sipariş açıldığında | müşteri, kalemler, teslim tarihi | ticari |
| `sales_order.shipped` | Satış siparişi sevk edildi | Bir sevkiyat yapıldığında | sipariş, giden miktar, kalan | iç |

### Aksiyonlar

Yok. Teklifi, sürümü ve siparişi bir insan hazırlar.

### Koşul alanları

| Kod | Ad | Tip | Veri sınıfı |
|---|---|---|---|
| `quote.total_try` | Teklif toplamı (TL karşılığı) | tutar | ticari |
| `quote.margin_percent` | Tahmini kâr marjı | sayı (%) | ticari |
| `quote.type` | Teklif türü (uygulama/ürün) | seçim | iç |
| `sales_order.days_to_delivery` | Teslim tarihine kalan gün | sayı | iç |
