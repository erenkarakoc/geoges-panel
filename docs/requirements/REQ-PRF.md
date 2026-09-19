# REQ-PRF — Performans, KPI, Sıralama ve Prim

Durum: CONFIRMED (sahip, 2026-09-19) · 2026-09-19 · Modül: PRF (Performance)

Kaynaklar: Özellik Yapısı §28; kararlar D-153, D-185, D-187…D-194.

**Sınır.** PRF kendi ham verisini üretmez; diğer modüllerin kayıtlarından ve olaylarından hesaplar (günlük saha kaydı, geç giriş, onay süreleri, görevler, uygunsuzluk ve DÖF, İSG olayları, teknik ofis işleri, teklifler, hakediş ve bordro süreleri). Ramak kala ve güvenlik kuralları REQ-QHS-011 ve REQ-QHS-016'dadır. Maaş ve muhasebe aktarımı REQ-HR ve REQ-FIN'dedir. Onay ve görev mekanizması REQ-WFL ve REQ-TSK'dadır.

Terimler (`docs/domain/GLOSSARY.md`): Key Performance Indicator (KPI), Performance Score, Score Band, Performance Target, Bonus Rule, Bonus, Development Plan, Performance Ranking.

---

## A. Ölçme ilkeleri

### REQ-PRF-001 — Herkes kendi işinin metrikleriyle ölçülür

- Kaynak: §28, §28.1–§28.6
- Öncelik: Must · Kademe: T1
- Katman: Sabit + Tanım
- Tanımla ayarlanan: pozisyon başına KPI'lar, ağırlıkları ve hedefleri (REQ-PRF-009)
- Açıklama: Yalnızca saha değil bütün organizasyon ölçülür; herkes kendi işinin objektif metrikleriyle değerlendirilir. Başlangıç metrikleri: saha mühendisi, formen ve ekip için doğrulanmış üretim m², panel/saat, zamanında veri girişi, kayıt eksiksizliği, zayi/fire oranı, onaya zamanında gönderme, kalite, İSG uyumu; koordinatör için sorumlu şantiyelerin operasyonel performansı, geciken onay sayısı, sorun çözme süresi, veri disiplini; fabrika için üretim miktarı, birim maliyet, fire, makine duruşu, veri kalitesi, zamanında sevkiyat; teknik ofis için çizim/revizyon teslim süresi, gecikme, hata/revizyon oranı, teklif/metraj hazırlama süresi; satış için teklif sayısı, yanıt süresi, kazanma oranı, kaçırılan fırsat/ihale, tekliflerin sonradan gerçek kârlılığı; muhasebe için hakediş/fatura/ödeme işlerinin zamanında yapılması, yükümlülüklerin kaçırılmaması, hata oranı; İK için bordro ve SGK süreçlerinin zamanında olması, eksik evrak, izin/zimmet/çıkış süreçlerinin doğru tamamlanması.
- Kabul kriterleri:
  - [ ] Bir kişinin puanında yalnızca kendi pozisyonuna tanımlı KPI'lar yer alır.
- Durum: CONFIRMED

### REQ-PRF-002 — Hesaplanabilen KPI panel verisinden gelir

- Kaynak: §28.11
- Öncelik: Must · Kademe: T1
- Katman: Sabit
- Açıklama: Panel verisinden hesaplanabilen her KPI elle girilmez; kaynağı olan kayıtlardan kendiliğinden hesaplanır. Her KPI değeri, onu oluşturan kayıtlara açılabilir.
- Kabul kriterleri:
  - [ ] Hesaplanan bir KPI değeri elle üzerine yazılamaz.
  - [ ] Her KPI'nın veri kaynağı (hangi kayıt, hangi hesap) katalogda görünür.
- Durum: CONFIRMED

### REQ-PRF-003 — Hesaplanamayan KPI'yı doğrudan amir gerekçeyle puanlar

- Kaynak: D-190
- Öncelik: Must · Kademe: T1
- Katman: Sabit
- Açıklama: Panel verisinden hesaplanamayan KPI'ları (ör. nöbet düzeni, ziyaretçi/araç kaydı, işçi devamı) kişinin doğrudan amiri gerekçeyle ve gerekirse kanıtla puanlar; amirin amiri bu puanları görür. Panel hesabı olmayan personel (işçi, bekçi, temizlik görevlisi) de bu yolla puanlanır. Doğrudan amir rol hiyerarşisinden bulunur (REQ-IAM-014).
- Kabul kriterleri:
  - [ ] Elle girilen puan gerekçesiz kaydedilmez.
  - [ ] Kimse kendi elle KPI puanını giremez.
- Durum: CONFIRMED

### REQ-PRF-004 — Sağlıklı skor tek boyutlu değildir

- Kaynak: §28.7
- Öncelik: Must · Kademe: T1
- Katman: Sabit + Tanım
- Tanımla ayarlanan: boyutların ağırlıkları
- Açıklama: Skor yalnızca hıza bağlanmaz; doğrulanmış çıktı, kalite, zayi, güvenlik ve zamanında ve eksiksiz veri boyutlarından oluşur.
- Kabul kriterleri:
  - [ ] Hız veya üretim boyutunun ağırlığı tek başına skorun tamamı olamaz; en az bir kalite veya güvenlik boyutu her skora girer.
- Durum: CONFIRMED

### REQ-PRF-005 — Zamanında bildirmek her zaman gizlemekten iyidir

- Kaynak: §28.7; D-185
- Öncelik: Must · Kademe: T1
- Katman: Sabit
- Açıklama: Kötü haberi zamanında ve doğru bildiren kişi cezalandırılmaz; sorunu gizlemek veya veriyi geciktirmek olumsuz etkiler. Aynı sorun için zamanında yapılan bildirim, geç yapılan bildirimden veya hiç bildirilmemekten her zaman daha yüksek puan verir. Ramak kala bildirimi hiçbir hesapta olumsuz sayılmaz (REQ-QHS-011).
- Kabul kriterleri:
  - [ ] Geç girilen kayıt (REQ-SIT-012) ve sonradan ortaya çıkan gizlenmiş sorun, zamanında bildirilen aynı sorundan daha düşük puan verir.
- Durum: CONFIRMED

### REQ-PRF-006 — Koordinatörün puanına kâr-zarar girmez

- Kaynak: §28.2; D-192
- Öncelik: Must · Kademe: T1
- Katman: Sabit
- Açıklama: Koordinatör yalnızca kendi kontrolündeki davranış ve sonuçlarla puanlanır: sorumlu şantiyelerin operasyonel performansı, onay süresi, geciken onay sayısı, sorun çözme süresi, veri disiplini. Sorumlu şantiyelerin kâr-zararı koordinatörün puanına hiçbir biçimde girmez.
- Kabul kriterleri:
  - [ ] Koordinatör KPI'ları arasında kâr, marj veya maliyet tabanlı bir KPI tanımlanamaz.
- Durum: CONFIRMED

### REQ-PRF-007 — Erken veri girişi yalnızca tam ve doğru kayıtta ödüllendirilir

- Kaynak: §28.8
- Öncelik: Should · Kademe: T2
- Katman: Sabit + Tanım
- Tanımla ayarlanan: erken giriş bonusunun büyüklüğü
- Açıklama: Tam ve doğru kayıt temel şarttır. Bu şart sağlanıyorsa erken veri girişi küçük bir bonus verir; düzeltmeye geri gönderilen veya eksik erken kayıt bonus almaz.
- Kabul kriterleri:
  - [ ] Düzeltmeye geri gönderilmiş kayıt için erken giriş bonusu verilmez.
- Durum: CONFIRMED

## B. KPI kataloğu

### REQ-PRF-008 — Katalog panelde tanımlanır

- Kaynak: §28.11; D-187
- Öncelik: Must · Kademe: T1
- Katman: Sabit + Tanım
- Tanımla ayarlanan: KPI kataloğunun tamamı
- Açıklama: KPI kataloğu panelde sıfırdan tanımlanır; mevcut Excel kılavuzu aktarılmaz (D-187). Her KPI için kod (ör. GM01, SM-01), ad, süreç, pozisyon, ağırlık %, hedef, puanlama tipi ve veri kaynağı (hesaplanan veya amir puanı) tutulur. Başlangıç pozisyonları: Genel Müdür, Genel Müdür Yardımcısı, Genel Koordinatör, Şantiyeler Koordinatörü, Teknik Ofis, Saha Mühendisi, Formen, İşçi, Bekçi, Temizlik Görevlisi; pozisyon listesi genişletilebilir.
- Kabul kriterleri:
  - [ ] Bir pozisyonun KPI ağırlıklarının toplamı %100 değilse katalog kaydedilmez.
- Durum: CONFIRMED

### REQ-PRF-009 — Uygunsuzluk ve DÖF puanı besler

- Kaynak: §28.11; REQ-QHS-008
- Öncelik: Must · Kademe: T1
- Katman: Sabit
- Açıklama: Uygunsuzluk, DÖF, risk, iç denetim ve müşteri geri bildirimi kayıtları (hedef gün, gerçek gün, tekrar) ilgili pozisyonun KPI'larını besler; geciken ve tekrar eden kayıtlar puanı düşürür.
- Kabul kriterleri:
  - [ ] Puan dökümünde etkileyen her uygunsuzluk kaydı bağlantısıyla görünür.
- Durum: CONFIRMED

### REQ-PRF-010 — Katalog değişikliği geçmişi bozmaz

- Kaynak: §28.11; REQ-ADM-007
- Öncelik: Must · Kademe: T1
- Katman: Sabit
- Açıklama: Katalog, ağırlıklar, hedefler ve puan bantları geçerlilik tarihiyle değişir; kapanmış dönemlerin puanları ve primleri, o dönemde geçerli tanımlarla hesaplanmış haliyle kalır.
- Kabul kriterleri:
  - [ ] Bir ağırlık değişikliği, değişiklikten önceki ayların puanlarını değiştirmez.
- Durum: CONFIRMED

## C. Puan ve dönem

### REQ-PRF-011 — Aylık puan ve bantlar

- Kaynak: §28.11; D-189
- Öncelik: Must · Kademe: T1
- Katman: Sabit + Tanım
- Tanımla ayarlanan: puan bantları ve prim oranları (varsayılan: ≥ 90 Mükemmel +%10; 80–89 İyi +%5; 70–79 Geliştirilmeli, prim yok; < 70 Kritik)
- Açıklama: Her kişinin puanı her ay 0–100 aralığında hesaplanır ve bandıyla gösterilir. Ay içinde pozisyonu değişen kişinin puanı, her pozisyonda geçirdiği gün oranında birleştirilir (türetilen kural, sahip onayladı).
- Kabul kriterleri:
  - [ ] Puan dökümü KPI, ağırlık, hedef, gerçekleşen ve katkı olarak açılabilir.
- Durum: CONFIRMED

### REQ-PRF-012 — Puan amir ve yönetimce kesinleşir; itiraz yoktur

- Kaynak: D-191
- Öncelik: Must · Kademe: T1
- Katman: Sabit + Akış
- Akışla ayarlanan: ayın puanlarını kimin, hangi sırayla kesinleştireceği
- Açıklama: Ayın puanı, elle KPI'lar girildikten sonra amir ve yönetim tarafından kesinleştirilir. Kişi puanını ve dökümünü görür; panelde itiraz süreci yoktur (D-191).
- Kabul kriterleri:
  - [ ] Kesinleşen puan yalnızca revizyon talebiyle değişir (REQ-AUD-008).
- Durum: CONFIRMED

### REQ-PRF-013 — Kritik puanda gelişim görüşmesi

- Kaynak: §28.11; D-193
- Öncelik: Must · Kademe: T2
- Katman: Sabit + Akış
- Akışla ayarlanan: gelişim görüşmesi görevinin kime ve hangi sürede düşeceği (varsayılan: doğrudan amir, 10 gün)
- Açıklama: Aylık puanı "Kritik" (< 70) olan kişi için amirine görüşme ve gelişim planı yazma görevi düşer; plan kişinin kartında kalır. Kritik durum yalnızca kişinin kendisi, amirleri ve İK tarafından görülür.
- Kabul kriterleri:
  - [ ] Kritik puan hiçbir sıralama veya karşılaştırma ekranında gösterilmez (REQ-PRF-019).
- Durum: CONFIRMED

## D. Hedefler ve prim

### REQ-PRF-014 — Üç düzeyde hedef

- Kaynak: §28.10
- Öncelik: Must · Kademe: T2
- Katman: Sabit
- Açıklama: Hedefler genel şirket hedefi, rol hedefi ve kişiye özel hedef olarak tanımlanır. Kişiye özel hedef varsa rol ve genel hedeften önce gelir.
- Kabul kriterleri:
  - [ ] Bir KPI için hangi düzeyin hedefinin kullanıldığı puan dökümünde görünür.
- Durum: CONFIRMED

### REQ-PRF-015 — Prim kuralları

- Kaynak: §28.10
- Öncelik: Must · Kademe: T1
- Katman: Sabit + Tanım
- Tanımla ayarlanan: prim kuralları (hedefi aşma, skor eşiği, belirli metriği gerçekleştirme, proje erken bitirme), tutar veya oranları
- Açıklama: Prim; hedefi aşma, skor eşiği, belirli metriği gerçekleştirme veya projeyi erken bitirme koşullarına bağlanır; sabit tutar veya oran olabilir. Güvenlik şartı sağlanmayan dönemde hız ve prim hedefi başarılı sayılmaz (REQ-QHS-016).
- Kabul kriterleri:
  - [ ] Prim hesabının dökümü (kural, koşul, taban, oran) görüntülenebilir.
- Durum: CONFIRMED

### REQ-PRF-016 — Oran kişinin baz maaşına uygulanır

- Kaynak: D-194
- Öncelik: Must · Kademe: T1
- Katman: Sabit
- Açıklama: Oranlı prim, kişinin o ayki baz maaşı üzerinden hesaplanır. Prim tutarı maaşla aynı veri sınıfındadır: maaşı göremeyen kullanıcı prim tutarını da göremez (REQ-HR-002).
- Kabul kriterleri:
  - [ ] Hassas izni olmayan kullanıcı prim tutarını hiçbir ekranda, raporda veya dışa aktarmada görmez.
- Durum: CONFIRMED

### REQ-PRF-017 — Prim aylık hesaplanır ve onaylanır

- Kaynak: §28.10; D-189
- Öncelik: Must · Kademe: T1
- Katman: Sabit + Akış
- Akışla ayarlanan: primin onay adımları
- Açıklama: Prim her ay, kesinleşen puandan ve prim kurallarından hesaplanır; yönetim gözden geçirip onaylar. Onaylanmamış prim ödenemez.
- Kabul kriterleri:
  - [ ] Onaylanan prim, onay anındaki kural ve puanla hesaplanmış haliyle kalır.
- Durum: CONFIRMED

### REQ-PRF-018 — Prim bordro dışı ödenir, muhasebeye aktarılır

- Kaynak: D-188; REQ-FIN-026
- Öncelik: Must · Kademe: T1
- Katman: Sabit
- Açıklama: Onaylanan prim bordroya girmez; ayrı ödeme olarak izlenir ve dekontla kapanır. Her prim ödemesi kişi, dönem ve tutarla aylık muhasebe aktarımına ayrı satır olarak girer; vergi ve SGK işlemini muhasebeci yapar. Prim gideri kişinin kayıtlı olduğu birime yazılır (REQ-HR-009 ile aynı kural). **Not:** prim hukuken ücrettir; muhasebe aktarımına girmesi bu yüzden zorunludur (D-188).
- Kabul kriterleri:
  - [ ] Ödenmiş ama muhasebe aktarımına girmemiş prim, kapanış kontrol listesinde açık madde olur (REQ-FIN-028).
- Durum: CONFIRMED

## E. Görünürlük

### REQ-PRF-019 — Sağlıklı sıralama görünürlüğü

- Kaynak: §28.9
- Öncelik: Must · Kademe: T1
- Katman: Sabit + Tanım
- Tanımla ayarlanan: sıralamanın kimlere ve hangi rollerde açık olduğu (sahip politikayı açıp kapatır)
- Açıklama: Olumlu ve operasyonel performans benzer roller arasında gösterilebilir. "Sonuncu" gibi kişiyi küçük düşüren sunum yapılmaz; kişinin zayıf yönleri herkese açık olmaz; kâr marjı ve birim maliyet gibi ticari veri sıralamada gösterilmez.
- Kabul kriterleri:
  - [ ] Sıralama ekranı yalnızca üst dilimi veya kişinin kendi yerini gösterir; alt sıralar isimle listelenmez.
  - [ ] Kişi başkalarının KPI dökümünü görmez; yalnızca amirleri ve İK görür.
- Durum: CONFIRMED

### REQ-PRF-020 — Taşeron ekipleri karşılaştırılır, prim almaz

- Kaynak: §28.1, §15.3; REQ-SIT-021
- Öncelik: Should · Kademe: T2
- Katman: Sabit
- Açıklama: Taşeron ekipleri hız, kalite ve zayi bakımından öz kaynak ekiplerle karşılaştırılır; ancak şirket çalışanı olmadıkları için KPI puanı ve prim almazlar (türetilen kural, sahip onayladı).
- Kabul kriterleri:
  - [ ] Taşeron ekip başı için prim hesabı yapılmaz.
- Durum: CONFIRMED

---

## Yetenek kataloğu — PRF

Biçim: `docs/requirements/README.md`.

### Olaylar

| Kod | Ad | Ne zaman | Taşıdığı alanlar | Veri sınıfı |
|---|---|---|---|---|
| `performance_score.calculated` | Ayın puanı hesaplandı | Ay sonunda hesap tamamlandığında | personel, ay, puan, bant | iç |
| `performance_score.finalised` | Ayın puanı kesinleşti | Kesinleştirildiğinde | personel, ay, puan, bant | iç |
| `performance_score.critical` | Kritik puan | Kesinleşen puan < 70 olduğunda | personel, ay | iç |
| `manual_kpi.pending` | Amir puanı bekleniyor | Ay sonunda elle KPI girilmemişse | amir, personel, KPI | iç |
| `bonus.calculated` | Prim hesaplandı | Hesap tamamlandığında | personel, ay, tutar | hassas |
| `bonus.approved` | Prim onaylandı | Onaylandığında | personel, ay, tutar | hassas |

### Aksiyonlar

Yok. Puanı ve primi panel hesaplar; kesinleştirme ve onay insan işidir.

### Koşul alanları

| Kod | Ad | Tip | Veri sınıfı |
|---|---|---|---|
| `performance_score.value` | Ayın puanı | sayı (0–100) | iç |
| `performance_score.band` | Puan bandı | seçim | iç |
| `bonus.amount` | Prim tutarı | tutar | hassas |
