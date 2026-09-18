# REQ-IAM — Kimlik, Rol ve Erişim

Durum: CONFIRMED (sahip, 2026-09-18) · 2026-09-18 · Modül: IAM (Identity & Access)

Kaynaklar: Özellik Yapısı §2; kararlar D-036, D-039, D-040, D-041, D-043, D-083, D-098, D-101, D-111…D-118. Açık soru: OQ-026 (parola politikası ve hesap kilidi eşikleri, Phase 03).

**Sınır.** Denetim kayıtlarının gösterimi REQ-AUD'dadır; IAM giriş ve yetki olaylarını üretir. İş akışının yetki kuralları REQ-WFL-019…022'dedir; burada yalnızca IAM'in onları mümkün kılan yapısı var. Personel kartı ve işten ayrılış süreci REQ-HR'dadır; IAM ayrılış tarihine tepki verir (REQ-IAM-007).

Terimler (`docs/domain/GLOSSARY.md`): User, Role, Permission, Role Assignment, Scope, Data Class, Full Visibility, Acting Role, Role Delegation, Owner, Separation of Duties.

---

## A. Hesap ve giriş

### REQ-IAM-001 — E-posta ve parolayla giriş

- Kaynak: D-036; §2.8
- Öncelik: Must · Kademe: T1
- Katman: Sabit
- Açıklama: Saha personeli ve taşeron ekip başları dahil herkes kendi hesabıyla, e-posta ve parolayla giriş yapar. Kendi kendine kayıt yoktur; hesapları yetkili kişi açar.
- Kabul kriterleri:
  - [ ] Hesabı olmayan biri panelde hesap oluşturamaz.
  - [ ] Hatalı giriş, hangi alanın hatalı olduğunu söylemeyen tek bir mesajla reddedilir.
- Bağlı: TASK-0025
- Durum: CONFIRMED

### REQ-IAM-002 — E-posta adresi politikası

- Kaynak: D-039
- Öncelik: Must · Kademe: T2
- Katman: Sabit
- Açıklama: Şirket çalışanları kurumsal alan adlı adres kullanır; taşeron ekip başları kişisel adres kullanabilir. Panel erişimi, posta kutusunun kime ait olduğundan bağımsız olarak panelden kapatılır.
- Kabul kriterleri:
  - [ ] Kişisel adresli bir hesabın erişimi panelden kapatıldığında o adresle giriş yapılamaz.
- Durum: CONFIRMED

### REQ-IAM-003 — İki adımlı giriş

- Kaynak: §2.8; D-043
- Öncelik: Must · Kademe: T1
- Katman: Sabit + Tanım
- Tanımla ayarlanan: iki adımlı girişin zorunlu olduğu roller
- Açıklama: İkinci adım bir doğrulama uygulamasıdır (TOTP); SMS kullanılmaz. Hangi rollerde zorunlu olduğu yöneticinin ayarıdır; sahip, genel müdür ve ticari veya hassas veriye erişen roller için zorunlu tutulabilir. Kaybolan cihaz için kurtarma yöntemi Phase 03'te tasarlanır.
- Kabul kriterleri:
  - [ ] İki adımın zorunlu olduğu bir rolü taşıyan kullanıcı, ikinci adımı tamamlamadan panelin hiçbir sayfasına erişemez.
- Bağlı: TASK-0025
- Durum: CONFIRMED

### REQ-IAM-004 — Parola değiştirme ve sıfırlama

- Kaynak: §2.8
- Öncelik: Must · Kademe: T1
- Katman: Sabit
- Açıklama: Kullanıcı kendi parolasını değiştirir; yetkili yönetici bir kullanıcı için parola sıfırlama başlatır. Parola kuralları OQ-026 ile belirlenir.
- Kabul kriterleri:
  - [ ] Yönetici bir kullanıcının parolasını göremez ve kendisi belirleyemez; yalnızca sıfırlama başlatır.
- Bağlı: TASK-0025
- Durum: CONFIRMED

### REQ-IAM-005 — Hatalı giriş denemelerinde geçici kilit

- Kaynak: §2.8; OQ-026
- Öncelik: Must · Kademe: T1
- Katman: Sabit + Tanım
- Tanımla ayarlanan: deneme sayısı ve kilit süresi (OQ-026)
- Açıklama: Ardışık hatalı girişlerde hesap geçici olarak kilitlenir. Deneme sayısı ve kilit süresi OQ-026 ile belirlenir.
- Kabul kriterleri:
  - [ ] Eşik aşıldığında doğru parolayla bile kilit süresi dolana kadar giriş yapılamaz; olay denetim kaydına düşer.
- Durum: CONFIRMED

### REQ-IAM-006 — Pasife alınan hesabın erişimi anında kapanır

- Kaynak: §2.8
- Öncelik: Must · Kademe: T1
- Katman: Sabit
- Açıklama: Bir hesap pasife alındığında erişim anında kapanır ve açık oturumlar sonlandırılır.
- Kabul kriterleri:
  - [ ] Pasife alınan kullanıcının açık oturumu bir sonraki istekte reddedilir; yeni giriş yapılamaz.
- Durum: CONFIRMED

### REQ-IAM-007 — Ayrılış tarihinde erişim kendiliğinden kapanır

- Kaynak: D-117; §45.4
- Öncelik: Must · Kademe: T1
- Katman: Sabit
- Açıklama: İnsan Kaynakları bir personeli ayrılış tarihiyle "işten ayrıldı" olarak işaretlediğinde, o tarih geldiğinde hesap kendiliğinden pasife alınır, açık oturumlar kapanır, sahiplere ve kişinin yöneticisine bildirim gider. Bu davranış IAM'in kendisindedir, bir akışa bağlı değildir.
- Kabul kriterleri:
  - [ ] Ayrılış tarihi gelen hesap, hiçbir insan işlemi olmadan pasife alınır.
  - [ ] Ayrılış tarihi ileri bir tarihse o güne kadar erişim sürer.
- Durum: CONFIRMED

### REQ-IAM-008 — Giriş ve yetki olayları denetime yazılır

- Kaynak: §2.8
- Öncelik: Must · Kademe: T1
- Katman: Sabit
- Açıklama: Başarılı ve başarısız girişler, çıkışlar, rol atamaları ve bitişleri, vekâletler, kişisel istisnalar ve hesap pasifleştirmeleri denetim kaydına yazılır. Gösterimi REQ-AUD'dadır.
- Kabul kriterleri:
  - [ ] Bu olayların her biri kim, ne zaman ve (varsa) kim tarafından bilgisiyle kaydedilir.
- Durum: CONFIRMED

## B. Roller ve yetkiler

### REQ-IAM-009 — Dinamik roller

- Kaynak: §2.1
- Öncelik: Must · Kademe: T1
- Katman: Sabit + Tanım
- Tanımla ayarlanan: roller, seviyeleri ve üst-alt ilişkileri
- Açıklama: Roller sabit değildir; yeni rol tanımlanır, adı, hiyerarşideki seviyesi ve üst-alt ilişkisi belirlenir, sıralaması sonradan değiştirilir.
- Kabul kriterleri:
  - [ ] Yeni bir rol kod değişikliği olmadan tanımlanıp kullanılabilir.
  - [ ] Bir rolün seviyesi değiştiğinde hiyerarşiye bağlı yönlendirmeler (REQ-IAM-014) yeni duruma göre çalışır.
- Durum: CONFIRMED

### REQ-IAM-010 — Rol, yetkilerin bir araya gelmesidir

- Kaynak: §2.1; sahip notu 2026-09-18 (D-098)
- Öncelik: Must · Kademe: T1
- Katman: Sabit + Tanım
- Tanımla ayarlanan: her rolün taşıdığı yetkiler
- Açıklama: Bir rol; görebileceği modülleri, veri girebileceği alanları, onaylayabileceği işlemleri ve kendisine düşecek görev türlerini belirleyen yetkilerden oluşur. Yetkiler hem yönetici ekranından hem iş akışı tasarımcısından tanımlanabilir (REQ-IAM-016).
- Kabul kriterleri:
  - [ ] Bir kullanıcının görebildikleri ve yapabildikleri, rollerindeki yetkilerden başka hiçbir kaynaktan gelmez (kişisel istisnalar hariç, REQ-IAM-015).
- Durum: CONFIRMED

### REQ-IAM-011 — Ticari ve hassas veri görünürlüğü modül bazında

- Kaynak: D-115; §2.5
- Öncelik: Must · Kademe: T1
- Katman: Sabit
- Açıklama: Veri dört sınıftadır: genel, iç, ticari, hassas kişisel. Ticari ve hassas kişisel veriyi görme izni modül modül ayrı verilir. Örneğin İSG sorumlusu kazadaki çalışanın adını görür, maaşını, SGK numarasını ve IBAN'ını görmez; saha mühendisi kendi şantiyesinin üretimini görür, kâr marjını ve teklif fiyatını görmez.
- Kabul kriterleri:
  - [ ] Ticari veya hassas izni olmayan kullanıcı, o sınıftaki alanı ekranda, aramada, raporda, dışa aktarmada ve bildirimde görmez.
  - [ ] İzin bir modülde verilip diğerinde verilmeyebilir.
- Durum: CONFIRMED

### REQ-IAM-012 — Rol ataması kapsam taşır

- Kaynak: D-111; §2.5
- Öncelik: Must · Kademe: T1
- Katman: Sabit
- Açıklama: Bir rol kişiye verilirken geçerli olduğu kapsam seçilir: tüm şirket, belirli şantiyeler veya belirli projeler. Aynı rol farklı kişilere farklı kapsamla verilebilir.
- Kabul kriterleri:
  - [ ] Kavaklı kapsamıyla "Saha Mühendisi" olan kişi Ilgaz'ın verisini görmez.
  - [ ] Kapsam değiştiğinde görünürlük hemen değişir.
- Durum: CONFIRMED

### REQ-IAM-013 — Birden fazla rol; yetkiler birleşir, işlemde rol kaydedilir

- Kaynak: D-113; §2.2
- Öncelik: Must · Kademe: T1
- Katman: Sabit
- Açıklama: Bir kişiye birden fazla rol verilebilir. Kişi bütün rollerinin yetkilerini aynı anda kullanır, rol değiştirmek zorunda kalmaz. Yaptığı her işlemin kaydına hangi rol kapsamında yapıldığı yazılır; iki rol de aynı işleme izin veriyorsa kişiye bir kez sorulur. Tek rolü olana rol seçimi gösterilmez.
- Kabul kriterleri:
  - [ ] Onay ve kayıt işlemlerinin geçmişinde işlemin yapıldığı rol görünür.
  - [ ] Tek rollü kullanıcı hiçbir ekranda rol seçimi görmez.
- Durum: CONFIRMED

### REQ-IAM-014 — Hiyerarşi: rol düzeyinde, kişi için elle değiştirilebilir

- Kaynak: D-112; §2.1
- Öncelik: Must · Kademe: T1
- Katman: Sabit
- Açıklama: Rollerin üst-alt ilişkisi tanımlanır. Bir kişinin amiri, aynı kapsamda bir üst rolü taşıyan kişidir. Gerektiğinde bir kişi için amir elle değiştirilebilir; elle değiştirilen amir rol hiyerarşisinden önce gelir.
- Kabul kriterleri:
  - [ ] "Kaydı açanın amiri" ve eskalasyon, önce kişiye elle atanmış amiri, yoksa rol hiyerarşisini kullanır.
  - [ ] Bir kapsamda bir üst rolü taşıyan kimse yoksa bir sonraki üst seviyeye çıkılır.
- Durum: CONFIRMED

### REQ-IAM-015 — Kişisel istisnalar

- Kaynak: §2.1
- Öncelik: Must · Kademe: T1
- Katman: Sabit
- Açıklama: Sahip, rolün varsayılan yetkilerine ek olarak belirli bir kişi için tek tek modül veya ekran erişimini açıp kapatabilir. Bu istisnalar kayıt altında tutulur ve toplu listelenir.
- Kabul kriterleri:
  - [ ] Yalnızca sahip katmanındaki kişiler kişisel istisna tanımlayabilir.
  - [ ] Tüm kişisel istisnalar tek bir listede, kişi ve tarihle görülebilir.
- Durum: CONFIRMED

### REQ-IAM-016 — Yetki ve rol iş akışı tasarımcısından da tanımlanıp atanır

- Kaynak: D-098, D-101; REQ-WFL-021
- Öncelik: Must · Kademe: T1
- Katman: Sabit
- Açıklama: İş akışı tasarımcısı akış için yeni yetki ve rol tanımlayıp kişilere atayabilir. Bunlar yönetici ekranındaki tanım ve atamalarla aynı kayda yazılır; "kim neyi görüyor" tek yerden okunur.
- Kabul kriterleri:
  - [ ] Tasarımcıdan tanımlanan rol ve yapılan atama "Kullanıcılar & Roller" ekranında görünür ve oradan değiştirilebilir.
- Durum: CONFIRMED

### REQ-IAM-017 — Tam görünürlük

- Kaynak: D-083; REQ-WFL-019
- Öncelik: Must · Kademe: T1
- Katman: Sabit
- Açıklama: Tam görünürlük, tüm modüllerde tüm veri sınıflarını tüm kapsamlarda görebilmektir. Sahip katmanı her zaman tam görünürlüktedir. Akış tasarlama yetkisi yalnızca tam görünürlüklü rollere verilebilir ve bu, rol atanırken kodda denetlenir.
- Kabul kriterleri:
  - [ ] Bir rolün tam görünürlükte olup olmadığı rol ekranında görünür.
  - [ ] Tam görünürlükte olmayan bir role akış tasarlama yetkisi eklenemez.
- Durum: CONFIRMED

## C. Vekâlet ve süreli rol

### REQ-IAM-018 — Süreli vekâlet

- Kaynak: §2.3
- Öncelik: Must · Kademe: T1
- Katman: Sabit
- Açıklama: Bir kişiye başlangıç ve bitiş tarihiyle vekâleten rol verilir. Süre boyunca ilgili yetkileri kullanır; süre bitince vekâlet kendiliğinden sona erer.
- Kabul kriterleri:
  - [ ] Bitiş tarihinde vekâlet, hiçbir insan işlemi olmadan sona erer ve vekilin o rolden gelen erişimi kapanır.
- Durum: CONFIRMED

### REQ-IAM-019 — Vekâleti kim verir

- Kaynak: D-116
- Öncelik: Must · Kademe: T1
- Katman: Sabit + Akış
- Akışla ayarlanan: kişinin kendi verdiği vekâlette yöneticisine giden bildirim
- Açıklama: Planlı durumlarda kişi kendi vekilini ve tarihlerini girer, yöneticisine bildirim gider. Plansız durumlarda yöneticisi veya yetkili kişi vekâlet verir. Her vekâlet kayıt altındadır.
- Kabul kriterleri:
  - [ ] Kişi yalnızca kendi rolleri için vekâlet verebilir.
  - [ ] Kişinin kendi verdiği vekâlette yöneticisine bildirim gider.
- Durum: CONFIRMED

### REQ-IAM-020 — Onay yedeği: önce vekil, sonra üst rol

- Kaynak: D-040
- Öncelik: Must · Kademe: T1
- Katman: Sabit + Akış
- Akışla ayarlanan: onay adımındaki bekleme süresi ve eskalasyon hedefi
- Açıklama: Onaylayıcının etkin vekili varsa onay önce ona gider. Vekil yoksa veya ayarlanan bekleme süresi geçerse onay bir üst role (REQ-IAM-014) eskale olur. Süreler yöneticinin ayarıdır.
- Kabul kriterleri:
  - [ ] Etkin vekili olan onaylayıcının onayları vekile düşer.
  - [ ] Bekleme süresi dolan onay bir üst role çıkar ve bu geçiş onay geçmişinde görünür.
- Durum: CONFIRMED

### REQ-IAM-021 — Sahip vekili

- Kaynak: D-041
- Öncelik: Must · Kademe: T1
- Katman: Sabit
- Açıklama: Sahibe özel onaylar, sahip yokken sahibin belirlediği vekil tarafından, sahibin belirlediği süre içinde verilebilir; vekilin yaptığı her işlem sahibe raporlanır.
- Kabul kriterleri:
  - [ ] Sahip vekilinin her işlemi sahiplere bildirim ve rapor olarak düşer.
- Durum: CONFIRMED

## D. Sahip katmanı

### REQ-IAM-022 — Birden fazla sahip

- Kaynak: D-114; §2.4
- Öncelik: Must · Kademe: T1
- Katman: Sabit
- Açıklama: Sahip katmanı birden fazla kişide olabilir (ortaklar). Sahipler birbirinden veri gizleyemez ve birbirlerinin işlemlerini denetleyebilir.
- Kabul kriterleri:
  - [ ] Hiçbir sahip, başka bir sahibin görünürlüğünü kısıtlayamaz.
- Durum: CONFIRMED

### REQ-IAM-023 — Sahibin görünürlüğü kısıtlanamaz

- Kaynak: §2.4
- Öncelik: Must · Kademe: T1
- Katman: Sabit
- Açıklama: Genel müdür dahil hiçbir yönetici sahipten veri gizleyemez; sahibin görünürlüğünü azaltan hiçbir ayar yoktur.
- Kabul kriterleri:
  - [ ] Sahip katmanındaki bir kişinin yetkilerini daraltmaya yönelik her işlem reddedilir.
- Durum: CONFIRMED

### REQ-IAM-024 — Sahibin yetkileri

- Kaynak: §2.4
- Öncelik: Must · Kademe: T1
- Katman: Sabit
- Açıklama: Sahip tüm şirket verisini ve tüm kritik uyarıları görür; genel müdür dahil herkesin işlem geçmişini denetler; görünürlükleri açıp kapatır; istisnai işlemlere izin verir; onay zincirlerini değiştirir; kimin hangi rol ve yetkiye sahip olduğunu yönetir.
- Kabul kriterleri:
  - [ ] Bu yetkilerin her biri sahip katmanında varsayılan olarak vardır ve kaldırılamaz.
- Durum: CONFIRMED

### REQ-IAM-025 — "Sahip onayı" herhangi bir sahiple tamamlanır

- Kaynak: D-118
- Öncelik: Must · Kademe: T1
- Katman: Sabit
- Açıklama: Sahip onayı isteyen işlerde (ör. belirli tutarın üstündeki ödeme) sahiplerden herhangi birinin onayı yeterlidir.
- Kabul kriterleri:
  - [ ] Sahip onayı bekleyen iş, bütün sahiplerin onay kuyruğunda görünür; biri onayladığında diğerlerinin kuyruğundan düşer.
- Durum: CONFIRMED

## E. Görev ayrılığı

### REQ-IAM-026 — Hazırlayan kendi işlemini onaylayamaz

- Kaynak: §2.6
- Öncelik: Must · Kademe: T1
- Katman: Sabit + Akış
- Akışla ayarlanan: kuralın hangi onay adımlarında açık olduğu
- Açıklama: Kritik işlerde aynı kişinin hazırladığı işlemi yine kendisinin onaylaması engellenebilir. Bu kural onay adımında açılıp kapatılan bir ayardır.
- Kabul kriterleri:
  - [ ] Kural açık bir onay adımında, işlemi hazırlayan kişiye onay düşmez; başka bir yetkiliye gider.
- Durum: CONFIRMED

## F. Rol ataması yönlendirmesi

### REQ-IAM-027 — Yeni rol atanınca kullanıcı yönlendirilir

- Kaynak: §2.7
- Öncelik: Must · Kademe: T2
- Katman: Sabit + Tanım
- Tanımla ayarlanan: yönlendirme içeriği (rol tanımının parçası)
- Açıklama: Kişiye yeni rol atandığında panel ona rolünü, temel sorumluluklarını, ilk yapması gereken işleri, kullanacağı ekranları ve zorunlu görevlerini gösterir. Bu içerik rol tanımının parçasıdır.
- Kabul kriterleri:
  - [ ] Rol atandıktan sonraki ilk girişte yönlendirme ekranı açılır.
  - [ ] Yönlendirme içeriği rol tanımından gelir; rolü olmayan içerik gösterilmez.
- Bağlı: TASK-0026
- Durum: CONFIRMED

---

## Yetenek kataloğu — IAM

Biçim: `docs/requirements/README.md`. IAM, akışların dinleyebileceği olayları ve koşulların okuyabileceği alanları yayımlar. **Yetki veren veya geri alan hiçbir aksiyon yayımlamaz** (D-091): rol tanımı ve ataması tasarım sırasında yapılır (REQ-IAM-016), erişimin kapanması IAM'in kendi davranışıdır (REQ-IAM-007).

### Olaylar

| Kod | Ad | Ne zaman | Taşıdığı alanlar | Veri sınıfı |
|---|---|---|---|---|
| `role_assignment.created` | Rol atandı | Bir kişiye kapsamıyla rol verildiğinde | kişi, rol, kapsam, atayan | iç |
| `role_assignment.ended` | Rol ataması bitti | Atama kaldırıldığında veya süresi dolduğunda | kişi, rol, kapsam | iç |
| `role_delegation.started` | Vekâlet başladı | Vekâlet başlangıç tarihinde | vekâlet veren, vekil, rol, bitiş | iç |
| `role_delegation.ended` | Vekâlet bitti | Vekâlet bitiş tarihinde | vekâlet veren, vekil, rol | iç |
| `user.deactivated` | Hesap pasife alındı | Hesap pasifleştiğinde (elle veya ayrılış tarihinde) | kişi, sebep | iç |

### Aksiyonlar

Yok (yukarıdaki açıklama).

### Koşul alanları

| Kod | Ad | Tip | Veri sınıfı |
|---|---|---|---|
| `user.roles` | Kişinin rolleri | liste (rol) | iç |
| `user.is_owner` | Sahip katmanında mı | evet/hayır | iç |
| `user.manager` | Kişinin amiri | kişi | iç |
| `role_assignment.scope` | Atamanın kapsamı | kapsam (şirket / şantiye / proje) | iç |
