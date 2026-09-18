# REQ-TSK — Görevler ve Bildirimler

Durum: CONFIRMED (sahip, 2026-09-18) · 2026-09-18 · Modül: TSK (Tasks & Notifications)

Kaynaklar: Özellik Yapısı §25.1–§25.6; kararlar D-040, D-087, D-091, D-097, D-106, D-130…D-133; OQ-016 (cevaplandı, D-132).

**Sınır.** Görevi ve bildirimi iş akışları da üretir (REQ-WFL); TSK onları tutar, gösterir, hatırlatır ve eskale eder. Onay kararları REQ-WFL-012…016'dadır; "Görevlerim" yalnızca bekleyen onayları listeler. İç destek talepleri (§25.7) REQ-SUP'tadır. Erken ve doğru giriş için performans katkısı (§25.6) REQ-PRF'dedir.

Terimler (`docs/domain/GLOSSARY.md`): Task, Notification, Escalation, Daily Digest, Push Notification.

---

## A. Görev kaydı

### REQ-TSK-001 — Görevin alanları

- Kaynak: §25.1; D-087
- Öncelik: Must · Kademe: T2
- Açıklama: Her görevde başlık, açıklama, sorumlu kişi veya rol, öncelik, son tarih, durum, görevin kaynağı, ilgili proje/birim ve gerekli belge veya eylem görünür. Kaynak, görevi elle veren kişi ya da görevi üreten akış, adım ve kayıttır.
- Kabul kriterleri:
  - [ ] Kaynağı olmayan görev oluşturulamaz.
- Durum: CONFIRMED

### REQ-TSK-002 — Elle ve sistemce oluşan görevler

- Kaynak: §25.1, §25.2
- Öncelik: Must · Kademe: T2
- Açıklama: Görevler elle verilebilir veya sistem tarafından otomatik oluşturulur. Otomatik kaynaklar arasında geciken saha onayı, kritik stok, atıl ekipman, geçen bakım tarihi, geciken hakediş/alacak, nakit açığı, sözleşme yükümlülüğü, bordro son tarihi, sertifika ve eğitim yenileme, İSG aksiyonu ve toplantı kararı vardır.
- Kabul kriterleri:
  - [ ] Otomatik görevin kaynağında onu üreten olay veya akış adımı görünür.
- Durum: CONFIRMED

### REQ-TSK-003 — Elle görev kendi kapsamındaki herkese verilir

- Kaynak: D-130
- Öncelik: Must · Kademe: T2
- Açıklama: Kullanıcı, rol atamasının kapsamındaki (şantiye/proje/şirket) herkese seviyeden bağımsız olarak görev verebilir; kendine de verebilir. Kapsamı tüm şirket olan roller herkese verebilir.
- Kabul kriterleri:
  - [ ] Kapsamı Kavaklı olan kullanıcı, Ilgaz'da çalışan birine görev veremez.
- Durum: CONFIRMED

### REQ-TSK-004 — Görevin kapanışı, verilirken seçilir

- Kaynak: D-131
- Öncelik: Must · Kademe: T2
- Açıklama: Görevi veren, oluştururken "onayım gereksin" seçeneğini işaretleyebilir. İşaretlenmezse sorumlu "tamamlandı" dediğinde görev kapanır ve veren bildirim alır; veren gerekirse yeniden açar. İşaretlenirse sorumlu "tamamladım" der, görev veren onaylayınca kapanır.
- Kabul kriterleri:
  - [ ] "Onayım gereksin" seçili görev, veren onaylamadan kapanmış görünmez.
  - [ ] Yeniden açılan görevin geçmişinde kapanış ve yeniden açılış kişi ve zamanla görünür.
- Durum: CONFIRMED

### REQ-TSK-005 — Sistem görevleri kopyalanmaz, sorun çözülünce kapanır

- Kaynak: §25.2
- Öncelik: Must · Kademe: T2
- Açıklama: Aynı sorun için tekrar tekrar görev açılmaz; sorun sürdükçe mevcut görev açık kalır. Sorun çözüldüğünde sistemin açtığı görev kendiliğinden kapanır.
- Kabul kriterleri:
  - [ ] Aynı kaynak ve aynı sorun için ikinci bir açık görev oluşmaz.
  - [ ] Sorun ortadan kalkınca görev "sebebi çözüldü" notuyla kapanır.
- Durum: CONFIRMED

## B. Eskalasyon

### REQ-TSK-006 — Zamanında ele alınmayan görev üst seviyeye çıkar

- Kaynak: §25.3; D-040; REQ-IAM-014, REQ-IAM-020
- Öncelik: Must · Kademe: T1
- Açıklama: Görev zamanında ele alınmazsa üst seviyeye çıkar. Varsayılan zincir Sorumlu → Koordinatör → Genel Müdür → Sahip'tir; zincir ve bekleme süreleri yönetimce değiştirilir. Sorumlunun etkin vekili varsa görev önce vekile gider; üst seviye rol hiyerarşisinden ve kişiye elle atanmış amirden bulunur.
- Kabul kriterleri:
  - [ ] Her eskalasyon, görevin geçmişinde kimden kime ve ne zaman olarak görünür.
  - [ ] Eskale olan görev ilk sorumlunun listesinden düşmez; ikisi de görür.
- Durum: CONFIRMED

## C. Görevlerim ve bildirimler

### REQ-TSK-007 — "Görevlerim" ekranı

- Kaynak: §25.4; D-070, D-106
- Öncelik: Must · Kademe: T2
- Açıklama: Kullanıcı bugün yapacaklarını, gecikenleri, yüksek öncelikleri ve kendisinden onay bekleyenleri görür; gecikenler en üsttedir. Her görev yapılacağı ekrana gider. Açık görev yoksa ekran boş durumunu gösterir.
- Kabul kriterleri:
  - [ ] Gecikmiş görevler her zaman listenin en üstündedir.
  - [ ] Her görevden, işin yapılacağı ekrana tek tıkla gidilir.
- Bağlı: TASK-0037
- Durum: CONFIRMED

### REQ-TSK-008 — Her görev ve bildirim "neden bende" der

- Kaynak: D-087, D-097; REQ-WFL-013, REQ-WFL-033
- Öncelik: Must · Kademe: T1
- Açıklama: Görevin ve bildirimin kaynağına (akış, adım, kayıt veya veren kişi) ve kişiye hangi kuralla geldiğine tıklanarak gidilir.
- Kabul kriterleri:
  - [ ] Bir akışın ürettiği görevden, akış örneğinin çalışma günlüğüne gidilebilir.
- Durum: CONFIRMED

### REQ-TSK-009 — Bildirim merkezi

- Kaynak: §25.5; D-063, D-106
- Öncelik: Must · Kademe: T2
- Açıklama: Üst alanda bildirim sayacı ve çekmecesi bulunur. Türler: yeni görev, görev gecikmesi, düzeltme isteği, onay talebi, kritik uyarı, rol ataması, belge süresi, stok riski, finansal risk. Her bildirim kaynağına gider. Bildirim yoksa çekmece "Bildirim yok." der.
- Kabul kriterleri:
  - [ ] Sayaç yalnızca okunmamış bildirimleri sayar ve açık görev sayısından ayrıdır.
- Durum: CONFIRMED

### REQ-TSK-010 — Kanal: panel ve telefona anında bildirim

- Kaynak: D-132; §25.5; OQ-016
- Öncelik: Must · Kademe: T2
- Açıklama: Her bildirim panelde görünür. Yeni görev, onay talebi ve kritik uyarı ayrıca telefona anında bildirim olarak düşer (uygulama yüklemeden, tarayıcı bildirimiyle). E-posta yalnızca günlük özet için kullanılır.
- Kabul kriterleri:
  - [ ] Telefon bildirimine izin vermiş kullanıcı, panel kapalıyken de yeni görev, onay talebi ve kritik uyarıyı alır.
  - [ ] Telefon bildirimi reddedilmişse bildirim panelde eksiksiz durur.
- Durum: CONFIRMED

### REQ-TSK-011 — Bildirim metninde hassas kişisel veri yoktur

- Kaynak: D-091; REQ-IAM-011
- Öncelik: Must · Kademe: T1
- Açıklama: Hiçbir bildirimin metnine (panel, telefon veya e-posta) hassas kişisel veri konmaz; yerine kayda giden bağlantı konur. Bu kural elle ve sistemce üretilen bütün bildirimler için geçerlidir.
- Kabul kriterleri:
  - [ ] Hassas kişisel sınıftaki bir alan, bildirim metni üretilirken hiçbir yoldan metne giremez.
- Durum: CONFIRMED

### REQ-TSK-012 — Kritik anında, acil olmayan özetlenir

- Kaynak: §25.6
- Öncelik: Must · Kademe: T2
- Açıklama: Kritik olaylar günlük özeti beklemeden anında bildirilir; acil olmayan bildirimler dikkat dağıtmamak için özette toplanabilir.
- Kabul kriterleri:
  - [ ] Bir bildirim türünün "anında" mı "özette" mi gideceği ayarlanabilir; kritik uyarı her zaman anında gider.
- Durum: CONFIRMED

### REQ-TSK-013 — Günlük özet

- Kaynak: D-133; §25.6
- Öncelik: Must · Kademe: T2
- Açıklama: Her kullanıcı sabah kendi işleriyle ilgili tek bir özet alır (dünden kalanlar, bugün yapılacaklar). Sahipler ayrıca şirketin dünkü durumunun özetini alır. Gönderim saati yönetimin ayarıdır (örnek varsayılan 07:30).
- Kabul kriterleri:
  - [ ] Özet e-postayla ve panelde gelir; içeriği kişinin yetkisine göre süzülür.
  - [ ] Hiç işi olmayan kullanıcıya boş özet gönderilmez.
- Durum: CONFIRMED

---

## Yetenek kataloğu — TSK

Biçim: `docs/requirements/README.md`.

### Olaylar

| Kod | Ad | Ne zaman | Taşıdığı alanlar | Veri sınıfı |
|---|---|---|---|---|
| `task.created` | Görev oluştu | Görev elle veya sistemce açıldığında | görev, sorumlu, kaynak, son tarih | iç |
| `task.completed` | Görev tamamlandı | Görev kapandığında | görev, kapatan, nasıl kapandı | iç |
| `task.overdue` | Görev gecikti | Son tarih geçtiğinde | görev, sorumlu, gecikme | iç |
| `task.escalated` | Görev eskale oldu | Görev üst seviyeye çıktığında | görev, kimden, kime | iç |

### Aksiyonlar

| Kod | Ad | Girdi | Gereken yetki | İki kez çalışırsa | Yarıda kalırsa |
|---|---|---|---|---|---|
| `task.open` | Görev aç | başlık, sorumlu (dört adresleme yolundan biri, REQ-WFL-017), son tarih, öncelik, kaynak | akışın sistem yetkisi (REQ-WFL-020) | Aynı kaynak ve aynı adım için ikinci görev açmaz, mevcut görevi döndürür | Görev açılmamış sayılır; tekrar çalıştırılabilir |
| `notification.send` | Bildirim gönder | alıcı, şablon, kayda bağlantı | akışın sistem yetkisi | Aynı kaynak, alıcı ve şablon için kısa sürede ikinci bildirimi göndermez | Gönderilmemiş sayılır; tekrar denenir |

### Koşul alanları

| Kod | Ad | Tip | Veri sınıfı |
|---|---|---|---|
| `task.status` | Görev durumu | seçim | iç |
| `task.priority` | Öncelik | seçim | iç |
| `task.overdue_days` | Gecikme günü | sayı | iç |
