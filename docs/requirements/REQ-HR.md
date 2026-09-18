# REQ-HR — Personel, Puantaj, Bordro, İzin ve Günlük Faaliyet

Durum: CONFIRMED (sahip, 2026-09-18) · 2026-09-18 · Modül: HR (Human Resources)

Kaynaklar: Özellik Yapısı §23.1–§23.8; kararlar D-050, D-117, D-134, D-163…D-168; RISK-001.

**Sınır.** Çalışma takvimi, tatiller ve fazla mesai kuralları REQ-ADM-010…012'dedir (§23.9). Şantiye personelinin puantajı günlük saha kaydında girilir (REQ-SIT-026); HR onu okur. Ayrılış tarihinde erişimin kapanması REQ-IAM-007'dedir. Zimmet kaydı REQ-EQP-007'dedir. Maaş giderinin muhasebesi, ödeme ve muhasebe aktarımı REQ-FIN'dedir. Performans değerlendirmesi REQ-PRF'dedir. Onay mekanizması REQ-WFL'dedir.

**KVKK.** Bu modül gerçek kişisel ve hassas veri tutar (maaş, SGK, IBAN, sağlık raporu). Gerçek İK verisi girilmeden önce RISK-001 ve D-134 (hiçbir verinin silinmemesi) sahibe yeniden sunulur (D-050, REQ-AUD-003).

Terimler (`docs/domain/GLOSSARY.md`): Employee, Timesheet, Payroll, Payroll Parameter, Salary Advance, Bank Payment File, Leave, Leave Balance, Onboarding Checklist, Offboarding Checklist, Daily Activity Report, Working Calendar.

---

## A. Personel kartı

### REQ-HR-001 — Personel kartı

- Kaynak: §23.1
- Öncelik: Must · Kademe: T1
- Açıklama: Her personel için ad-soyad, görev/pozisyon, rol, işe giriş ve ayrılış tarihi, aktif/ayrıldı durumu, baz maaş ve para birimi, SGK bilgisi, IBAN, kayıtlı olduğu birim (şantiye, fabrika, ofis), sözleşme/özlük belgeleri, zimmetler, izin geçmişi, bordro geçmişi, eğitim ve süreli belgeler tutulur.
- Kabul kriterleri:
  - [ ] Personel kartı ile kullanıcı hesabı ayrı kayıtlardır; bir personelin hesabı olmayabilir.
  - [ ] Birim değişikliği geçerlilik tarihiyle kaydedilir; önceki birimler geçmişte kalır.
- Durum: CONFIRMED

### REQ-HR-002 — Hassas alanlar

- Kaynak: §23.1; REQ-IAM-011
- Öncelik: Must · Kademe: T1
- Açıklama: Maaş, SGK bilgisi, IBAN, sağlık raporu ve özlük belgeleri hassas kişisel veridir; yalnızca bu veri sınıfını görme izni olan roller (varsayılan: yetkili İK ve sahip) görür.
- Kabul kriterleri:
  - [ ] Hassas izni olmayan kullanıcı bu alanları listelerde, dışa aktarmalarda ve kayıt geçmişinde de görmez (REQ-AUD-004).
- Durum: CONFIRMED

### REQ-HR-003 — Süreli belge uyarıları

- Kaynak: §23.1
- Öncelik: Must · Kademe: T2
- Açıklama: Eğitim sertifikası, sağlık raporu, operatör belgesi gibi süreli belgelerin bitiş tarihi yaklaşınca ve geçince uyarı üretilir.
- Kabul kriterleri:
  - [ ] Süresi geçen zorunlu belge, sebebi çözülene kadar "Dikkat" bölümünde kalır (REQ-RPT-008).
- Durum: CONFIRMED

## B. Puantaj

### REQ-HR-004 — Puantajın kaynakları

- Kaynak: §23.2; REQ-SIT-026
- Öncelik: Must · Kademe: T1
- Açıklama: Şantiye personelinin puantajı onaylı günlük saha kayıtlarından gelir. Fabrika ve ofis personeli için puantaj elle girilir. Onaylı izinler puantaja kendiliğinden işlenir.
- Kabul kriterleri:
  - [ ] Onaylanmamış günlük kaydın puantajı bordroya girmez.
  - [ ] Aynı kişi aynı gün iki yerde tam gün çalışmış görünürse uyarı üretilir.
- Durum: CONFIRMED

### REQ-HR-005 — Aylık puantaj görünümü

- Kaynak: §23.2; REQ-ADM-012
- Öncelik: Must · Kademe: T2
- Açıklama: Her personel için aylık çalışma günü, saat, fazla mesai, izin ve devamsızlık görünür. Fazla mesai, çalışma takviminin kurallarıyla hesaplanır.
- Kabul kriterleri:
  - [ ] Ayın puantajı, bordro hazırlanmadan önce İK tarafından kontrol edildi olarak işaretlenir.
- Durum: CONFIRMED

## C. Bordro

### REQ-HR-006 — Panel bordroyu kendisi hesaplar

- Kaynak: §23.3; D-163
- Öncelik: Must · Kademe: T1
- Açıklama: Panel, baz maaş ve puantajdan (çalışılan gün, fazla mesai, ücretsiz izin, devamsızlık) brüt ücreti, SGK primlerini, gelir ve damga vergisini, asgari ücret istisnasını ve diğer kesintileri hesaplayarak net ücreti bulur. Bordroda brüt, SGK, vergi, diğer kesintiler, net, dönem ve ödeme durumu tutulur.
- Kabul kriterleri:
  - [ ] Her bordro satırının hesap dökümü (hangi oran, hangi matrah) görüntülenebilir.
  - [ ] Hesap, bilinen örnek bordrolarla karşılaştırılan otomatik testlerle doğrulanır; test örnekleri muhasebeciden alınır.
- Durum: CONFIRMED

### REQ-HR-007 — Bordro parametreleri tarihli tanımdır

- Kaynak: D-163; REQ-ADM-007, REQ-ADM-008
- Öncelik: Must · Kademe: T1
- Açıklama: Gelir vergisi dilimleri, SGK prim oranları ve tavanı, damga vergisi oranı, asgari ücret ve istisna tutarları geçerlilik tarihli tanımlardır. Yeni değer girildiğinde yalnızca o tarihten sonraki, henüz onaylanmamış bordroları etkiler.
- Kabul kriterleri:
  - [ ] Onaylanmış bordro, parametre değişince yeniden hesaplanmaz.
  - [ ] Yeni yıl için parametre girilmemişse ocak bordrosu hazırlanırken uyarı üretilir.
- Durum: CONFIRMED

### REQ-HR-008 — Bordro durumu

- Kaynak: §23.3
- Öncelik: Must · Kademe: T1
- Açıklama: Bordro şu durumlardan geçer: Hazırlandı → Onaylandı → Ödendi. Onay iş akışında tanımlıdır.
- Kabul kriterleri:
  - [ ] Onaylanan bordro kilitlenir; değişiklik revizyon talebiyle yapılır (REQ-AUD-007).
  - [ ] Bordroyu hazırlayan kendi bordrosunu onaylayamaz.
- Durum: CONFIRMED

### REQ-HR-009 — Maaş gideri kayıtlı birime yazılır

- Kaynak: §23.3; D-164
- Öncelik: Must · Kademe: T1
- Açıklama: Ödenen bordro, personelin kayıtlı olduğu birimin maliyet merkezine maaş gideri olarak yazılır; ay içinde başka şantiyede çalışması gideri değiştirmez. Birim ay içinde değişmişse gider, geçerlilik tarihlerine göre iki birime gün oranında bölünür (D-164'ten türetilen kural, sahip onayladı). İşveren SGK payı da giderdir.
- Kabul kriterleri:
  - [ ] Maaş gideri bordro onaylanınca FIN'e yazılır (REQ-FIN-013).
- Durum: CONFIRMED

### REQ-HR-010 — Maaş avansı sonraki bordrodan kesilir

- Kaynak: D-165
- Öncelik: Must · Kademe: T2
- Açıklama: Personele verilen maaş avansı iş akışındaki onaydan geçer, kaydedilir ve bir veya birkaç bordroya bölünerek kesilir. Kalan avans personel kartında görünür.
- Kabul kriterleri:
  - [ ] Kesilen toplam, verilen avansı aşamaz.
  - [ ] Ayrılan personelin kalan avansı çıkış kontrol listesinde açık madde olur (REQ-HR-015).
- Durum: CONFIRMED

### REQ-HR-011 — Banka toplu ödeme dosyası

- Kaynak: D-168
- Öncelik: Must · Kademe: T2
- Açıklama: Onaylanan bordrodan, şirketin çalıştığı bankanın kabul ettiği toplu ödeme dosyası üretilir. Muhasebe dosyayı bankaya yükler; dekont girilince bordro "Ödendi" olur.
- Kabul kriterleri:
  - [ ] Onaylanmamış bordro için dosya üretilemez.
  - [ ] IBAN'ı eksik personel dosyaya girmez ve eksik olarak listelenir.
- Durum: CONFIRMED

### REQ-HR-012 — İmzalı bordro şartı ve son tarih görevi

- Kaynak: §23.4
- Öncelik: Must · Kademe: T2
- Açıklama: Sözleşme veya şirket kuralı gerektiriyorsa imzalı bordrolar yüklenmeden maaş ödemesi tamamlanamaz. Bordroların belirli bir güne kadar işverene gönderilmesi gerekiyorsa muhasebeye son tarih görevi oluşur. Hangi projede bu şartların geçerli olduğu ayarlanır.
- Kabul kriterleri:
  - [ ] Şart açık olan projede imzalı bordro yüklenmeden "Ödendi" işlemi çalışmaz.
- Durum: CONFIRMED

### REQ-HR-013 — Resmi bildirimler muhasebecide

- Kaynak: D-167; REQ-FIN-026
- Öncelik: Must · Kademe: T2
- Açıklama: SGK bildirgesi ve muhtasar beyan gibi resmi bildirimleri muhasebeci kendi programından yapar. Panelin hesapladığı bordro tutarları aylık muhasebe aktarımına eklenir ve muhasebecininkiyle karşılaştırılır.
- Kabul kriterleri:
  - [ ] Karşılaştırmada çıkan fark gerekçesiyle kaydedilir ve kapanana kadar açık kalem olarak görünür.
- Durum: CONFIRMED

## D. İzin

### REQ-HR-014 — İzin talebi, onay ve bakiye

- Kaynak: §23.5; D-166
- Öncelik: Must · Kademe: T2
- Açıklama: İzin türleri (yıllık, mazeret, rapor/hastalık, ücretsiz; liste tanımlardan genişletilebilir) ayrı izlenir. Personel talep eder, iş akışındaki onaydan geçer; kullanılan gün ve bakiye görünür. Yıllık izin hakkını İK her personel için elle girer.
- Kabul kriterleri:
  - [ ] Bakiyeyi aşan yıllık izin talebi uyarıyla gösterilir.
  - [ ] Rapor/hastalık izni belge olmadan onaylanmaz.
- Durum: CONFIRMED

## E. Giriş ve çıkış

### REQ-HR-015 — Giriş ve çıkış kontrol listeleri

- Kaynak: §23.6, §23.7; REQ-EQP-007, REQ-IAM-007
- Öncelik: Must · Kademe: T1
- Açıklama: İşe giriş ve işten çıkış zorunlu evrak listeleriyle yürür. Çıkışta imzalı evraklar, zimmet teslimleri, kalan avans, ileride gerekebilecek belgeler ve çıkış dokümanları tamamlanmadan süreç kapanmaz. Listeler tanımlardan ayarlanır.
- Kabul kriterleri:
  - [ ] Ayrılan personelin üzerinde telefon, laptop, araç, ekipman veya başka demirbaş varsa kritik uyarı çıkar ve sebebi çözülene kadar kalır.
  - [ ] Ayrılış tarihinde erişim kapanır (REQ-IAM-007), ama kontrol listesi açık kalır ve İK'nın görevidir.
- Durum: CONFIRMED

## F. Günlük faaliyet raporu

### REQ-HR-016 — Günlük faaliyet raporu

- Kaynak: §23.8
- Öncelik: Must · Kademe: T2
- Açıklama: Üretim kaydı olmayan roller (ofis, teknik ofis, muhasebe, İK, koordinasyon) günde bir faaliyet raporu girer: yapılan işler satır satır, başlangıç/bitiş saati, öncelik ve durum (tamamlandı / devam ediyor / beklemede), ilgili proje veya görev, gün değerlendirmesi ve ertesi gün planı. Hangi rollerin yükümlü olduğu ayarlanır.
- Kabul kriterleri:
  - [ ] Yöneticiler bağlı personelin raporlarını görür (REQ-IAM hiyerarşisi).
  - [ ] Bir rapor satırı bir göreve bağlanabilir ve görevin geçmişinde görünür (REQ-TSK).
  - [ ] Girilmeyen rapor, performansa veri olarak geçer (REQ-PRF).
- Durum: CONFIRMED

---

## Yetenek kataloğu — HR

Biçim: `docs/requirements/README.md`.

### Olaylar

| Kod | Ad | Ne zaman | Taşıdığı alanlar | Veri sınıfı |
|---|---|---|---|---|
| `employee.hired` | Personel işe girdi | Kart aktifleştiğinde | personel, birim, giriş tarihi | iç |
| `employee.leaving_date_set` | Ayrılış tarihi girildi | Ayrılış tarihi kaydedildiğinde | personel, tarih | iç |
| `employee.document_expiring` | Süreli belge bitiyor | Uyarı süresine girildiğinde | personel, belge türü, bitiş | iç |
| `leave_request.submitted` | İzin talep edildi | Talep gönderildiğinde | personel, tür, tarihler | iç |
| `leave_request.approved` | İzin onaylandı | Onaylandığında | personel, tür, gün | iç |
| `payroll.prepared` | Bordro hazırlandı | Hazırlandığında | dönem, kişi sayısı, toplam | hassas |
| `payroll.approved` | Bordro onaylandı | Onaylandığında | dönem, toplam | hassas |
| `payroll.paid` | Bordro ödendi | Dekont girildiğinde | dönem | hassas |
| `salary_advance.requested` | Maaş avansı istendi | Talep gönderildiğinde | personel, tutar | hassas |
| `offboarding_checklist.overdue` | Çıkış listesi tamamlanmadı | Ayrılıştan belirli gün sonra açık kaldığında | personel, eksik maddeler | iç |
| `daily_activity_report.missing` | Faaliyet raporu girilmedi | Gün sonunda | personel, tarih | iç |

### Aksiyonlar

| Kod | Ad | Girdi | Gereken yetki | İki kez çalışırsa | Yarıda kalırsa |
|---|---|---|---|---|---|
| `payroll.create_draft` | Taslak bordro hazırla | dönem, birim | akışın sistem yetkisi | Aynı dönem ve birim için açık bordro varsa onu döndürür | Taslak açılmamış sayılır |

Akış bordroyu onaylayamaz ve ödeyemez; bunları bir insan yapar.

### Koşul alanları

| Kod | Ad | Tip | Veri sınıfı |
|---|---|---|---|
| `leave_request.days` | İzin gün sayısı | sayı | iç |
| `leave_request.type` | İzin türü | seçim | iç |
| `salary_advance.amount` | Avans tutarı | tutar | hassas |
| `employee.unit` | Personelin birimi | seçim | iç |
| `employee.days_to_document_expiry` | Belgenin bitmesine kalan gün | sayı | iç |
