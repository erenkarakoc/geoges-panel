# REQ-AUD — Kayıt Geçmişi, Denetim ve Revizyon Talebi

Durum: CONFIRMED (sahip, 2026-09-18) · 2026-09-18 · Modül: AUD (Audit & History)

Kaynaklar: Özellik Yapısı §37.1, §38; kararlar D-050, D-134, D-135; REQ-IAM-008.

**Sınır.** Hangi olayların denetime yazılacağını her modül kendi gereksiniminde söyler (ör. REQ-IAM-008, REQ-WFL-020); AUD onları saklar ve gösterir. İstisnai manuel işlem izni (§37) REQ-WFL-031'dedir.

Terimler (`docs/domain/GLOSSARY.md`): Audit Log, Record History, Revision Request.

---

## A. Kayıt geçmişi

### REQ-AUD-001 — Her kaydın geçmişi

- Kaynak: §38
- Öncelik: Must · Kademe: T1
- Katman: Sabit
- Açıklama: Bir kayıtta kimin oluşturduğu, ne zaman oluşturduğu, kimin değiştirdiği, önceki ve yeni değer, değişikliğin nedeni, kimin onayladığı, kimin düzeltme istediği ve hangi belgenin eklendiği görülebilir.
- Kabul kriterleri:
  - [ ] Bir kaydın her alan değişikliği, önceki ve yeni değeriyle kaydın geçmişinde listelenir.
- Durum: CONFIRMED

### REQ-AUD-002 — Hiçbir kayıt görünmez şekilde silinmez

- Kaynak: §38
- Öncelik: Must · Kademe: T1
- Katman: Sabit
- Açıklama: Yanlış kayıt silinmez; iptal edilir ve düzeltme geçmişiyle korunur. İptal edilen kayıt listelerde varsayılan olarak gizlenebilir ama her zaman bulunabilir.
- Kabul kriterleri:
  - [ ] Panelde hiçbir kayıt türü için "sil" işlemi yoktur; yalnızca "iptal et", gerekçeyle.
- Durum: CONFIRMED

### REQ-AUD-003 — Kişisel veri de silinmez ve anonimleştirilmez

- Kaynak: D-134; D-050; RISK-001
- Öncelik: Must · Kademe: T1
- Katman: Sabit
- Açıklama: Bir kişi talep etse veya saklama süresi dolsa da hiçbir veri silinmez ve anonimleştirilmez. **Hukuki risk:** bu, KVKK'nın silme ve anonimleştirme hakkının karşılanamaması demektir; RISK-001 kapsamında kayıtlıdır. Bu karar, gerçek İK verisi girilmeden önce D-050 gereği RISK-001 ile birlikte yeniden sahibe sunulur.
- Kabul kriterleri:
  - [ ] Kişisel veri için silme veya anonimleştirme işlemi yoktur.
  - [ ] Gerçek İK verisi girişinden önceki kontrol listesinde bu karar ayrı bir madde olarak yer alır.
- Durum: CONFIRMED

### REQ-AUD-004 — Geçmişi kaydı görebilen görür, alan bazında süzülür

- Kaynak: §38; REQ-IAM-011
- Öncelik: Must · Kademe: T1
- Katman: Sabit
- Açıklama: Bir kaydın geçmişini o kaydı görebilen herkes görür. Geçmişteki değerler de kullanıcının veri sınıfı izinlerine göre süzülür: maaşı göremeyen, maaş alanının eski ve yeni değerini de göremez.
- Kabul kriterleri:
  - [ ] Ticari veya hassas izni olmayan kullanıcı, geçmişte o sınıftaki alanların değerlerini görmez; yalnızca "değişti" bilgisini görür.
- Durum: CONFIRMED

### REQ-AUD-005 — Denetim kaydı değiştirilemez

- Kaynak: §38 (amaç: "arkamdan ne değiştirildi?"); ADR-005 (değişmez defterler)
- Öncelik: Must · Kademe: T1
- Katman: Sabit
- Açıklama: Denetim kaydı yalnızca eklenir; sahipler dahil kimse bir denetim kaydını değiştiremez veya silemez.
- Kabul kriterleri:
  - [ ] Denetim kaydını değiştiren veya silen hiçbir ekran, işlem veya yetki yoktur; veritabanı düzeyinde de engellidir.
- Durum: CONFIRMED

## B. Şirket geneli denetim ekranı

### REQ-AUD-006 — "Denetim Kayıtları" ekranını yalnızca sahipler görür

- Kaynak: D-135; §2.4, §2.8
- Öncelik: Must · Kademe: T1
- Katman: Sabit
- Açıklama: Şirket genelinde kimin neyi, ne zaman ve neden değiştirdiğini; giriş ve yetki olaylarını (REQ-IAM-008) gösteren ekranı yalnızca sahip katmanındaki kişiler görür. Kişi, kayıt türü, zaman aralığı ve işlem türüne göre süzülür.
- Kabul kriterleri:
  - [ ] Sahip katmanı dışında hiçbir role bu ekranın yetkisi verilemez.
  - [ ] Genel müdür dahil herkesin işlemleri bu ekranda görünür.
- Durum: CONFIRMED

## C. Revizyon talebi

### REQ-AUD-007 — Onaylı kayıtlar kilitlidir

- Kaynak: §37.1
- Öncelik: Must · Kademe: T1
- Katman: Sabit + Akış
- Akışla ayarlanan: kayıt türü başına revizyon talebinin onaylayıcısı (varsayılan akış: revizyon talebi)
- Açıklama: Onaylanmış kayıtlar (günlük saha ve fabrika kayıtları, hakediş, açılış stoku, stok sayımı, malzeme tanımları vb.) içerik olarak kilitlenir. Hangi kayıt türünün hangi durumda kilitli olduğu ve kimin onaylayacağı merkezi olarak tanımlanır.
- Kabul kriterleri:
  - [ ] Kilitli bir kaydın alanları doğrudan düzenlenemez; tek yol revizyon talebidir.
- Durum: CONFIRMED

### REQ-AUD-008 — Revizyon talebinin adımları

- Kaynak: §37.1
- Öncelik: Must · Kademe: T1
- Katman: Sabit + Akış
- Akışla ayarlanan: talebin onaylayıcısı, kademe sayısı ve bildirimler (varsayılan akış: revizyon talebi)
- Açıklama: Talep eden hangi alanın neden ve neye değişeceğini yazar; talep yetkili onaylayıcıya görev ve bildirim olarak düşer; onaylayıcı eski ve yeni değeri yan yana görerek onaylar veya gerekçeyle reddeder (REQ-WFL-015); onaylanırsa değişiklik uygulanır; talep sahibine sonuç bildirilir.
- Kabul kriterleri:
  - [ ] Onay ekranında her değişen alanın eski ve yeni değeri yan yanadır.
  - [ ] Ret gerekçesiz yapılamaz.
- Durum: CONFIRMED

### REQ-AUD-009 — Onaylanan revizyon etkilenen hesapları fark kadar düzeltir

- Kaynak: §37.1; D-077
- Öncelik: Must · Kademe: T1
- Katman: Sabit
- Açıklama: Revizyon onaylandığında etkilenen hesaplar (stok, maliyet, hakediş, performans) değişiklik kadar düzeltilir. Önceki değerler silinmez; düzeltme ayrı bir hareket olarak yazılır ve revizyon talebine bağlanır.
- Kabul kriterleri:
  - [ ] Düzeltme hareketleri kaynağındaki revizyon talebine bağlantı taşır.
  - [ ] Revizyondan önceki hesap değerleri geçmişte okunabilir kalır.
- Durum: CONFIRMED

### REQ-AUD-010 — Revizyon geçmişi ve bekleyen revizyonlar görünür

- Kaynak: §37.1
- Öncelik: Must · Kademe: T2
- Katman: Sabit
- Açıklama: Kaydın ekranında revizyon geçmişi görünür. Bekleyen revizyon talepleri Onay Merkezi'nde, yönetimin "Bugün" ekranında ve dönem kapanışı kontrol listesinde (§22.10, REQ-FIN) görünür.
- Kabul kriterleri:
  - [ ] Bekleyen revizyon talebi olan bir dönem, kapanış kontrol listesinde açık madde olarak görünür.
- Durum: CONFIRMED

---

## Yetenek kataloğu — AUD

Biçim: `docs/requirements/README.md`.

### Olaylar

| Kod | Ad | Ne zaman | Taşıdığı alanlar | Veri sınıfı |
|---|---|---|---|---|
| `revision_request.submitted` | Revizyon talep edildi | Talep açıldığında | kayıt, alanlar, talep eden, gerekçe | kaydın sınıfı |
| `revision_request.approved` | Revizyon onaylandı | Onaylandığında | kayıt, onaylayan | kaydın sınıfı |
| `revision_request.rejected` | Revizyon reddedildi | Reddedildiğinde | kayıt, reddeden, gerekçe | kaydın sınıfı |

### Aksiyonlar

Yok. Revizyon talebini bir insan açar; akış açamaz.

### Koşul alanları

| Kod | Ad | Tip | Veri sınıfı |
|---|---|---|---|
| `revision_request.record_type` | Revizyonun kayıt türü | seçim | iç |
| `revision_request.waiting_days` | Bekleme günü | sayı | iç |
