# REQ-SIT — Şantiye Operasyonları ve Günlük Saha Kaydı

Durum: CONFIRMED (sahip, 2026-09-18) · 2026-09-18 · Modül: SIT (Site Operations)

Kaynaklar: REQ-ADM-003, REQ-FIN-015, REQ-WFL-015…016 (onay ekranının içeriği), (iş modeli ayarı), REQ-ADM-004; kararlar D-035, D-037, D-038, D-119…D-125. Açık: OQ-027 madde 3 (günlük kaydın adım adım girişi, Phase 02).

**Sınır.** Onay mekanizması (üç sonuç, gerekçe, kuyruk, geçmiş) REQ-WFL-012…016'dadır; burada yalnızca onay ekranında görülecek kontroller var. Onaylı kaydın değiştirilmesi revizyon talebiyle olur (REQ-AUD, REQ-AUD-007…010). Şantiye detay ekranı ve "Niye zarardayız?" analizi REQ-RPT'dedir (REQ-RPT-012…014). Taşeron şantiyesinin kâr-zarar hesabı REQ-FIN'dedir (REQ-FIN-013, REQ-FIN-017); SIT yalnızca iş modelini tutar. Panel tipleri ve şerit tipleri merkezi tanımdır (REQ-ADM); proje ve duvar hedefleri REQ-PRJ'dedir.

Terimler (`docs/domain/GLOSSARY.md`): Daily Site Log, Panel Type, Panel Casting, Casting Session, Double Casting Day, Pre-Approval Casting, Over-Casting, Damaged Unit, Panel Installation, Strip Installation, Steel Strip, Coping, Handover, Client Wait Time, Timesheet, Activity Time Entry, Consumable, Consumption Recipe, Site Expense, Late Entry, Subcontractor.

---

## A. Şantiye genel ekranı

### REQ-SIT-001 — Şantiye genel bilgileri

- Kaynak: Özellik Yapısı (eşleme: `docs/requirements/README.md`)
- Öncelik: Must · Kademe: T2
- Katman: Sabit
- Açıklama: Şantiye ekranında bağlı olduğu proje, sorumlu koordinatör, saha mühendisi, ekip/iş modeli, güncel ilerleme, hedefe kalan miktar, günlük üretim, son kayıt zamanı, stok durumu, ekipman durumu, bekleyen onay, işveren beklemesi ve zayi/fire görünür. Gelir, gider ve kâr-zarar yalnızca ticari yetkisi olan kullanıcıya görünür (REQ-IAM-011).
- Kabul kriterleri:
  - [ ] Ticari yetkisi olmayan kullanıcı gelir, gider ve kâr-zarar alanlarını görmez; alanın yeri boş bırakılmaz, hiç gösterilmez.
- Durum: CONFIRMED

## B. Günlük kaydın yapısı

### REQ-SIT-002 — Her şantiye için her gün tek ana kayıt

- Kaynak: Özellik Yapısı (eşleme: `docs/requirements/README.md`)
- Öncelik: Must · Kademe: T1
- Katman: Sabit
- Açıklama: Her şantiyenin her günü için tek bir ana günlük kayıt vardır. Aynı gün içindeki birden fazla döküm, montaj veya faaliyet bu kaydın içinde ayrı satırlar veya seanslar olarak tutulur. Kayıt bir kez girilir ve ilerleme, hakediş, stok tüketimi, puantaj, performans, kâr-zarar, bekleme analizi ve işveren gecikme kanıtını besler.
- Kabul kriterleri:
  - [ ] Aynı şantiye ve gün için ikinci bir ana kayıt oluşturulamaz.
- Durum: CONFIRMED

### REQ-SIT-003 — Günlük kaydın bölümleri

- Kaynak: REQ-FIN-015
- Öncelik: Must · Kademe: T2
- Katman: Sabit
- Açıklama: Kayıt şu bölümlerden oluşur: şantiye, tarih, hava, döküm, montaj, çelik şerit montajı, harpuşta ve diğer proje iş kalemleri, işveren teslim-tesellüm, puantaj/ekip, faaliyet saatleri, o gün kullanılan ekipmanlar (D-162, REQ-EQP-011), tüketilen malzemeler, zayi, saha harcamaları, notlar, fotoğraflar. Bölümlerin ekrandaki sırası ve adım adım giriş olup olmayacağı Phase 02'de kararlaştırılır (OQ-027 madde 3).
- Kabul kriterleri:
  - [ ] Her bölüm ayrı ayrı doldurulup kaydedilebilir.
- Durum: CONFIRMED

### REQ-SIT-004 — Giriş sorumluluğu sırası

- Kaynak: D-035
- Öncelik: Must · Kademe: T2
- Katman: Sabit + Akış
- Akışla ayarlanan: günlük giriş görevinin kime düştüğü, yedek sırası ve şantiye veya dönem bazında başka role verilmesi (varsayılan: saha mühendisi → koordinatör → teknik ofis → İK)
- Açıklama: Günlük kaydı girme sorumluluğu varsayılan olarak saha mühendisi → koordinatör → teknik ofis → İK sırasındadır; önceki kişi yoksa bir sonraki girer. Bu bir onay zinciri değildir. Yönetim sırayı değiştirebilir ve belirli bir şantiye veya dönem için giriş görevini başka bir role atayabilir. Formen veya ekip başına sınırlı giriş yetkisi verilebilir.
- Kabul kriterleri:
  - [ ] Bir şantiye için giriş sorumlusu değiştirildiğinde değişiklik, tarihiyle birlikte kayda geçer.
- Durum: CONFIRMED

### REQ-SIT-005 — Bölüm bölüm birden fazla kişi girer

- Kaynak: D-119
- Öncelik: Must · Kademe: T2
- Katman: Sabit
- Açıklama: Aynı günün kaydına yetkisi olan herkes kendi bölümlerini girer (ör. mühendis dökümü, formen puantajı). Kaydı onaya gönderen tek kişi günün giriş sorumlusudur. Her satırı kimin girdiği kayıtta görünür.
- Kabul kriterleri:
  - [ ] İki kişi aynı kaydın farklı bölümlerini aynı anda girdiğinde biri diğerinin girişini silmez.
  - [ ] Her satırın geçmişinde giren kişi ve zaman görünür.
  - [ ] Yalnızca günün sorumlusu kaydı onaya gönderebilir.
- Durum: CONFIRMED

### REQ-SIT-006 — Hazır gelen başlangıç bilgileri

- Kaynak: Özellik Yapısı (eşleme: `docs/requirements/README.md`)
- Öncelik: Should · Kademe: T2
- Katman: Sabit
- Açıklama: Kayıt açıldığında kullanıcının yetkili olduğu şantiye, bugünün tarihi ve hava bilgisi hazır gelir ve düzenlenebilir. Hava bilgisi dış kaynaktan alınır; alınamazsa elle girilir.
- Kabul kriterleri:
  - [ ] Hava servisi yanıt vermezse kayıt açılmaya devam eder ve hava alanı elle doldurulabilir.
- Durum: CONFIRMED

### REQ-SIT-007 — Sürekli taslak kaydı

- Kaynak: Özellik Yapısı (eşleme: `docs/requirements/README.md`)
- Öncelik: Must · Kademe: T2
- Katman: Sabit
- Açıklama: Girilen her şey sürekli taslak olarak saklanır; telefon kapanır veya kullanıcı ekrandan çıkarsa girişler kaybolmaz.
- Kabul kriterleri:
  - [ ] Girişin ortasında sayfa kapatılıp yeniden açıldığında son girilen değerler yerindedir.
- Durum: CONFIRMED

### REQ-SIT-008 — Tek eylemle onaya gönderme

- Kaynak: Özellik Yapısı (eşleme: `docs/requirements/README.md`)
- Öncelik: Must · Kademe: T1
- Katman: Sabit + Akış
- Akışla ayarlanan: gönderilen kaydın hangi onaya gideceği (varsayılan akış: günlük saha kaydı onayı, koordinatör)
- Açıklama: Kayıt "Koordinatör onayına gönder" gibi tek bir ana eylemle onaya gider. Gönderilen kayıt, karar verilene veya düzeltmeye geri gönderilene kadar değiştirilemez (geri çekme hariç, REQ-SIT-009).
- Kabul kriterleri:
  - [ ] Gönderilmiş bir kaydın alanları, kayıt geri çekilmeden veya geri gönderilmeden düzenlenemez.
- Durum: CONFIRMED

### REQ-SIT-009 — Karar verilmeden önce geri çekme

- Kaynak: D-120
- Öncelik: Must · Kademe: T2
- Katman: Sabit
- Açıklama: Gönderen, onaylayıcı karar vermeden önce kaydı geri çekip düzeltebilir ve yeniden gönderebilir. Geri çekme kaydın geçmişinde görünür.
- Kabul kriterleri:
  - [ ] Karar verilmiş bir kayıt geri çekilemez.
  - [ ] Geri çekme, kim ve ne zaman bilgisiyle onay geçmişinde listelenir (REQ-WFL-016).
- Durum: CONFIRMED

### REQ-SIT-010 — Tatil ve iş olmayan günler

- Kaynak: D-038
- Öncelik: Must · Kademe: T2
- Katman: Sabit + Tanım
- Tanımla ayarlanan: tatil günleri (çalışma takvimi) ve "çalışma yok" nedenleri
- Açıklama: Çalışma takviminde tatil olarak işaretli günlerde günlük kayıt gerekmez. Başka bir günde iş yapılmadıysa, seçilen bir nedenle (hava, işveren beklemesi…) kısa bir "çalışma yok" kaydı zorunludur.
- Kabul kriterleri:
  - [ ] Tatil gününde kayıt eksikliği uyarı üretmez.
  - [ ] "Çalışma yok" kaydı, neden seçilmeden gönderilemez.
- Durum: CONFIRMED

### REQ-SIT-011 — Giriş süresi

- Kaynak: D-037
- Öncelik: Must · Kademe: T2
- Katman: Sabit + Akış + Tanım
- Akışla ayarlanan: süre kaçınca uyarının kime gideceği (varsayılan: giriş sorumlusu ve koordinatör)
- Tanımla ayarlanan: giriş süresi, şantiye veya proje bazında
- Açıklama: Günlük kaydın gönderilmesi gereken süre, yetkili yönetimce şantiye veya proje bazında ayarlanır; gereksinimde varsayılan değer yoktur. Süre kaçırılırsa uyarı oluşur.
- Kabul kriterleri:
  - [ ] Süresi geçen ve gönderilmemiş kayıt için sorumluya ve koordinatöre uyarı düşer.
- Durum: CONFIRMED

### REQ-SIT-012 — Geç giriş

- Kaynak: D-122
- Öncelik: Must · Kademe: T2
- Katman: Sabit
- Açıklama: Süresi geçmiş bir günün kaydı sonradan girilebilir; kayıt kalıcı olarak "geç girildi" işaretini taşır. Koordinatör ve yönetim bunu görür; performans değerlendirmesinde sayılır.
- Kabul kriterleri:
  - [ ] "Geç girildi" işareti kayıttan kaldırılamaz.
  - [ ] Geç girilen kaydın verisi ilerleme, stok ve hakedişe normal kayıt gibi yansır.
- Durum: CONFIRMED

### REQ-SIT-013 — Zorunlu alanlar tamamlanmadan gönderilemez

- Kaynak: REQ-WFL-015…016
- Öncelik: Must · Kademe: T1
- Katman: Sabit
- Açıklama: Zorunlu alanları eksik olan kayıt onaya gönderilemez. Fotoğrafsız zayi satırı ve açıklamasız fazla döküm (REQ-SIT-019) eksik sayılır.
- Kabul kriterleri:
  - [ ] Gönderme denendiğinde eksik alanlar bölüm bölüm listelenir.
- Durum: CONFIRMED

## C. Panel dökümü

### REQ-SIT-014 — Panel tipleri merkezi tanımdan gelir

- Kaynak: REQ-ADM-002
- Öncelik: Must · Kademe: T2
- Katman: Sabit + Tanım
- Tanımla ayarlanan: panel tipleri (REQ-ADM-002)
- Açıklama: Panel dökümü her zaman sahada yapılır; fabrika döküm yeri değildir. Panel tipleri (ad/kod, en, boy, panel başına m², gerekirse komşu tip ilişkisi) merkezi tanımlardan gelir. Kullanıcı m² değerini elle yazmaz.
- Kabul kriterleri:
  - [ ] Döküm girişinde m² alanı yoktur; adet ve panel tipinden hesaplanır.
- Durum: CONFIRMED

### REQ-SIT-015 — Günlük döküm tablosu

- Kaynak: REQ-ADM-004, REQ-PRJ-007
- Öncelik: Must · Kademe: T2
- Katman: Sabit
- Açıklama: Döküm ekranı her panel tipinin bir satır olduğu hızlı bir tablodur: panel tipi, boyut, m²/adet, proje hedef adedi, proje hedef m², bugüne kadar dökülen, kalan, ilerleme %, bugün dökülen adet. "Bugün" alanı vurgulu giriş alanıdır. Altta gün toplamı (adet ve m²) anlık gösterilir. Hedefler duvar bazında tanımlıysa proje hedefi duvarların toplamıdır.
- Kabul kriterleri:
  - [ ] "Bugün" alanına girilen her değer gün toplamını ve kalan miktarı hemen günceller.
- Durum: CONFIRMED

### REQ-SIT-016 — Çift döküm seansları

- Kaynak: Özellik Yapısı (eşleme: `docs/requirements/README.md`)
- Öncelik: Must · Kademe: T2
- Katman: Sabit
- Açıklama: Aynı gün birden fazla döküm seansı eklenebilir; her seans için panel tipi, adet, başlangıç, bitiş saati ve ısıtma kullanılıp kullanılmadığı tutulur. Çift döküm günleri performans ve kapasite analizinde ayrıca görünür.
- Kabul kriterleri:
  - [ ] Bir günde birden fazla seans eklenebilir ve seansların toplamı gün toplamına eşittir.
- Durum: CONFIRMED

### REQ-SIT-017 — Kurum onayı öncesi döküm

- Kaynak: Özellik Yapısı (eşleme: `docs/requirements/README.md`)
- Öncelik: Must · Kademe: T2
- Katman: Sabit
- Açıklama: Kurum onayı gelmeden işverenin talebiyle dökülen standart paneller "onay öncesi üretim" olarak işaretlenir. Onaylı proje geldiğinde bu adetler gerçek proje ihtiyacıyla karşılaştırılır.
- Kabul kriterleri:
  - [ ] Onaylı proje sisteme girildiğinde, onay öncesi dökülen adetlerle ihtiyaç arasındaki fark panel tipi bazında listelenir.
- Durum: CONFIRMED

### REQ-SIT-018 — Fazla döküm açıklamasız gönderilemez

- Kaynak: REQ-RPT-008; D-121
- Öncelik: Must · Kademe: T1
- Katman: Sabit + Akış
- Akışla ayarlanan: uyarının gideceği kişiler (varsayılan: saha mühendisi, koordinatör, sahipler); sahiplerden gizlenememesi sabittir
- Açıklama: Onaylı proje miktarını aşan döküm girilebilir; satır kırmızıya döner ve açıklama yazılmadan kayıt onaya gönderilemez. Uyarı saha mühendisine, koordinatöre ve sahiplere gider. Koordinatör uyarıyı kapatarak sahiplerden gizleyemez.
- Kabul kriterleri:
  - [ ] Hedefi aşan satır açıklamasız kaldıkça "Onaya gönder" çalışmaz.
  - [ ] Fazla döküm uyarısı sahiplerin görünümünden hiçbir rol tarafından kaldırılamaz.
- Durum: CONFIRMED

### REQ-SIT-019 — Fazla panel için komşu tip önerisi

- Kaynak: Özellik Yapısı (eşleme: `docs/requirements/README.md`)
- Öncelik: Should · Kademe: T2
- Katman: Sabit + Akış
- Akışla ayarlanan: önerinin hangi teknik personelin onayına gideceği
- Açıklama: Bir panel tipinde fazla üretim oluşursa ve kalan proje ihtiyacı elveriyorsa, önce bir alt / bir üst, uygun değilse iki alt / iki üst tipte kullanılabilmesi için öneri üretilir. Bu yalnızca öneridir; teknik uygunluğu yetkili teknik personel onaylar.
- Kabul kriterleri:
  - [ ] Öneri, teknik personel onaylamadan hiçbir hedefi veya stoğu değiştirmez.
- Durum: CONFIRMED

### REQ-SIT-020 — Zayi panel

- Kaynak: Özellik Yapısı (eşleme: `docs/requirements/README.md`)
- Öncelik: Must · Kademe: T1
- Katman: Sabit
- Açıklama: Zayi kaydında panel tipi, adet, neden ve fotoğraf zorunludur. Fotoğrafsız zayi tamamlanmış sayılmaz.
- Kabul kriterleri:
  - [ ] Fotoğrafı olmayan zayi satırı bulunan kayıt onaya gönderilemez.
- Durum: CONFIRMED

## D. Montaj, şerit ve diğer imalatlar

### REQ-SIT-021 — Panel montajı ve hız

- Kaynak: Özellik Yapısı (eşleme: `docs/requirements/README.md`)
- Öncelik: Must · Kademe: T2
- Katman: Sabit
- Açıklama: Montaj için duvar, panel tipi, adet, m², başlangıç ve bitiş saati tutulur. Saatlerden panel/saat ve m²/saat hesaplanır; farklı formen, ekip ve taşeronların hızı karşılaştırılabilir.
- Kabul kriterleri:
  - [ ] Başlangıç ve bitiş girildiğinde hız göstergeleri kendiliğinden hesaplanır.
- Durum: CONFIRMED

### REQ-SIT-022 — Çelik şerit montajı

- Kaynak: REQ-ADM-003
- Öncelik: Must · Kademe: T2
- Katman: Sabit + Tanım
- Tanımla ayarlanan: şerit tipleri ve boyları (REQ-ADM-003)
- Açıklama: Şerit tipleri (ör. 40×4, 50×4, 50×5; genişlik, kalınlık, delik sayısı, standart boylar) merkezi tanımdır. Takipte duvar, şerit tipi, şerit boyu, adet, toplam metre ve başlangıç/bitiş saati kullanılır. Toplam metre boy × adetten hesaplanır.
- Kabul kriterleri:
  - [ ] Toplam metre elle girilmez.
- Durum: CONFIRMED

### REQ-SIT-023 — Harpuşta ve diğer proje kalemleri

- Kaynak: Özellik Yapısı (eşleme: `docs/requirements/README.md`)
- Öncelik: Must · Kademe: T2
- Katman: Sabit
- Açıklama: Harpuşta döküm ve montajı adet veya metre olarak izlenir; aynı yapı diğer proje iş kalemlerine de uygulanır.
- Kabul kriterleri:
  - [ ] Bir proje kalemi için birim (adet veya metre) proje tanımında seçilir ve girişte o birim kullanılır.
- Durum: CONFIRMED

## E. İşveren teslim-tesellüm ve bekleme

### REQ-SIT-024 — Teslim-tesellüm saatleri

- Kaynak: D-124
- Öncelik: Must · Kademe: T1
- Katman: Sabit + Akış
- Akışla ayarlanan: saatlerin onaylayıcısı (varsayılan: günlük kayıt onayıyla koordinatör)
- Açıklama: Toprakarme döngüsündeki şu zamanlar saat saat tutulur: montaj başlangıç/bitiş, dolguya teslim saati, dolgudan geri alınma saati, şerit başlangıç/bitiş, beton talep/teslim saatleri, demir teslim saatleri. Saatleri bizim ekibimiz girer ve koordinatör onaylar; işverenden imza veya onay alınmaz. **Not (D-124):** kanıt yalnızca kendi kaydımıza dayandığı için işverenin itirazında kanıt gücü sınırlıdır; fotoğraf eklemek serbesttir.
- Kabul kriterleri:
  - [ ] Her zaman kaydı saat ve dakika hassasiyetindedir ve kimin girdiği görünür.
  - [ ] Onaylanmış teslim-tesellüm zamanları sonradan yalnızca revizyon talebiyle değişir.
- Durum: CONFIRMED

### REQ-SIT-025 — İşveren kaynaklı bekleme analizi

- Kaynak: REQ-WFL-018
- Öncelik: Must · Kademe: T2
- Katman: Sabit
- Açıklama: Teslim-tesellüm zamanlarından işveren kaynaklı bekleme süresi hesaplanır. Kaç ekip/kişinin beklediği, ekipmanın boşta kalıp kalmadığı, beklemenin tahmini maliyeti ve proje süresine etkisi gösterilir. Tahmini maliyet ticari veridir.
- Kabul kriterleri:
  - [ ] Bekleme süresi, dolguya teslim ile geri alınma arasındaki süreden hesaplanır; elle girilmez.
  - [ ] Tahmini maliyet yalnızca ticari yetkisi olan kullanıcıya görünür.
- Durum: CONFIRMED

## F. Puantaj, faaliyet ve ekip

### REQ-SIT-026 — Bordro puantajı

- Kaynak: Özellik Yapısı (eşleme: `docs/requirements/README.md`)
- Öncelik: Must · Kademe: T1
- Katman: Sabit
- Açıklama: Öz kaynak personel için hangi gün çalıştığı, kaç saat/gün çalıştığı ve izin/devamsızlık durumu günlük kayıtta tutulur; maaş ve SGK hesabı için İK'ya akar (REQ-HR).
- Kabul kriterleri:
  - [ ] Onaylanan puantaj, İK'nın ilgili dönem puantajında görünür.
- Durum: CONFIRMED

### REQ-SIT-027 — Faaliyet saatleri

- Kaynak: Özellik Yapısı (eşleme: `docs/requirements/README.md`)
- Öncelik: Must · Kademe: T2
- Katman: Sabit
- Açıklama: Performans ölçümü için döküm, montaj, şerit ve işveren dolgusunun başlangıç ve bitiş saatleri, taşeron şantiyeleri dahil her şantiyede tutulur. Bordro puantajından ayrıdır.
- Kabul kriterleri:
  - [ ] Taşeron şantiyesinde bordro puantajı olmadan faaliyet saatleri girilebilir.
- Durum: CONFIRMED

### REQ-SIT-028 — Taşeron ekibi kişi kişi isimle

- Kaynak: D-125
- Öncelik: Must · Kademe: T1
- Katman: Sabit
- Açıklama: Taşeron şantiyelerinde günlük kayıtta sahada çalışan taşeron işçileri isimleriyle tutulur. **KVKK notu:** bu, şirket çalışanı olmayan kişilerin kişisel verisidir; RISK-001 kapsamında izlenir, hukuki inceleme yapılmadığı kayıtlıdır (D-050). İsimler iç veri sınıfındadır; SGK numarası, IBAN gibi hassas alanlar bu kayıtta tutulmaz.
- Kabul kriterleri:
  - [ ] Taşeron işçisi kaydında hassas kişisel veri alanı yoktur.
  - [ ] İsim listesi yalnızca ilgili şantiyeyi görebilen kullanıcılara görünür.
- Durum: CONFIRMED

## G. Malzeme ve harcama

### REQ-SIT-029 — Sarf reçeteden önerilir, değiştirilebilir, fark işaretlenir

- Kaynak: REQ-ADM-004; D-123
- Öncelik: Must · Kademe: T1
- Katman: Sabit + Tanım
- Tanımla ayarlanan: sarf reçeteleri (REQ-ADM-004)
- Açıklama: Tüketilen malzeme, günün üretiminden sarf reçeteleriyle hesaplanıp önerilir. Saha mühendisi gerçekte kullanılan miktarı girebilir; öneriyle arasındaki fark kayıtta işaretlenir ve koordinatör onayda görür.
- Kabul kriterleri:
  - [ ] Önerilen ve girilen miktar yan yana saklanır; fark onay ekranında görünür.
  - [ ] Stok tüketimi, önerilen değil girilen miktar üzerinden yapılır.
- Durum: CONFIRMED

### REQ-SIT-030 — Saha harcaması

- Kaynak: REQ-FIN-015
- Öncelik: Must · Kademe: T2
- Katman: Sabit + Akış
- Akışla ayarlanan: saha harcamasının onay adımları (REQ-FIN-015)
- Açıklama: Saha harcaması tutar, konu, belge (fiş/fatura fotoğrafı) ve açıklamayla girilir. Onayı ve finans kaydı REQ-FIN'dedir.
- Kabul kriterleri:
  - [ ] Belgesi olmayan harcama işaretlenir ve onay ekranında görünür.
- Durum: CONFIRMED

## H. Onay ekranı ve onay sonrası

### REQ-SIT-031 — Koordinatörün onay ekranında görecekleri

- Kaynak: REQ-WFL-015…016
- Öncelik: Must · Kademe: T1
- Katman: Sabit
- Açıklama: Onay ekranında en az şunlar görünür: üretim miktarları; başlangıç/bitiş saatleri; işveren teslim-tesellüm saatleri; panel hedefiyle günlük ve kümülatif üretim farkı; fazla döküm; zayi ve zorunlu fotoğraflar; malzeme tüketiminin üretimle uyumu (öneri–giriş farkı dahil); puantaj ve ekip bilgisi; saha harcamaları; eksik zorunlu alanlar; geç giriş işareti. Karar mekanizması REQ-WFL-014…016'dadır.
- Kabul kriterleri:
  - [ ] Kontrol edilmesi gereken her tutarsızlık onay ekranında işaretli görünür.
- Durum: CONFIRMED

### REQ-SIT-032 — Onaylanan veri diğer modüllere dağılır

- Kaynak: REQ-WFL-015…016
- Öncelik: Must · Kademe: T1
- Katman: Sabit
- Açıklama: Onaylanan günlük veri şantiye ilerlemesine, stok tüketimine, hakediş hesabına, taşeron hakedişine, puantaja, performans değerlendirmesine, kâr-zarara ve yönetimin "Bugün" ekranına yansır. Bu yansıma bir olayla yapılır (`daily_site_log.approved`); modüller birbirinin verisine doğrudan yazmaz (ADR-001).
- Kabul kriterleri:
  - [ ] Onaydan sonra her tüketici modül veriyi olay üzerinden alır; olay iki kez gelirse veri iki kez işlenmez.
- Durum: CONFIRMED

### REQ-SIT-033 — Onaylı kayıt kilitlenir

- Kaynak: REQ-AUD-007…010
- Öncelik: Must · Kademe: T1
- Katman: Sabit
- Açıklama: Onaylanmış günlük kayıt içerik olarak kilitlenir; değişiklik doğrudan yapılmaz, revizyon talebiyle yapılır (REQ-AUD).
- Kabul kriterleri:
  - [ ] Onaylı kaydın hiçbir alanı ekrandan doğrudan düzenlenemez.
- Durum: CONFIRMED

## I. İş modeli

### REQ-SIT-034 — Şantiyenin işçilik modeli

- Kaynak: Özellik Yapısı (eşleme: `docs/requirements/README.md`)
- Öncelik: Must · Kademe: T2
- Katman: Sabit
- Açıklama: Her şantiyenin işçilik modeli tanımlanır: taşeron/götürü (ör. m² üzerinden birim fiyatla yalnızca işçilik) veya öz kaynak ekip. Model, puantaj ve faaliyet girişini ve maliyet hesabını belirler. Maliyet hesabı REQ-FIN'de, taşeron–öz kaynak karşılaştırması REQ-RPT/REQ-PRF'dedir.
- Kabul kriterleri:
  - [ ] Modeli taşeron olan şantiyede bordro puantajı istenmez, faaliyet saatleri ve ekip listesi istenir.
- Durum: CONFIRMED

## J. Ekran

### REQ-SIT-035 — Sahaya özel tablo ekranı

- Kaynak: REQ-ADM-004
- Öncelik: Must · Kademe: T2
- Katman: Sabit
- Açıklama: Döküm, montaj ve şerit bölümlerinde her ürün/iş tipi bir satırdır; proje hedefi, kümülatif gerçekleşen, kalan, ilerleme ve bugünkü giriş aynı ekranda görünür. Hedefi aşan satır belirgin kritik renge döner. Dar ekranda aynı veri kart biçiminde görünür. Az klavye, büyük dokunma alanı ve net toplamlar önceliklidir.
- Kabul kriterleri:
  - [ ] 375 piksel genişlikte yatay kaydırma olmadan girilebilir.
  - [ ] Dokunma alanları en az 44 piksel yüksekliktedir.
- Durum: CONFIRMED

---

## Yetenek kataloğu — SIT

Biçim: `docs/requirements/README.md`.

### Olaylar

| Kod | Ad | Ne zaman | Taşıdığı alanlar | Veri sınıfı |
|---|---|---|---|---|
| `site.created` | Şantiye açıldı | Projede yeni şantiye açıldığında | şantiye, proje | iç |
| `site.changed` | Şantiye kartı değişti | Şantiyenin bilgisi ya da durumu değiştiğinde | şantiye, proje, durum | iç |
| `daily_site_log.submitted` | Günlük kayıt onaya gönderildi | Sorumlu kaydı gönderdiğinde | şantiye, tarih, gönderen, geç giriş | iç |
| `daily_site_log.recalled` | Günlük kayıt geri çekildi | Gönderen karar öncesi geri çektiğinde | şantiye, tarih, çeken | iç |
| `daily_site_log.approved` | Günlük kayıt onaylandı | Onay kararıyla | şantiye, tarih, üretim, tüketim, puantaj, bekleme | iç |
| `daily_site_log.returned` | Günlük kayıt düzeltmeye döndü | Onaylayıcı geri gönderdiğinde | şantiye, tarih, gerekçe | iç |
| `daily_site_log.deadline_missed` | Giriş süresi kaçırıldı | Süre dolup kayıt gönderilmediğinde | şantiye, tarih, sorumlu | iç |
| `over_casting.recorded` | Fazla döküm girildi | Hedefi aşan döküm kaydedildiğinde | şantiye, panel tipi, fazla adet, açıklama | iç |
| `damaged_unit.recorded` | Zayi girildi | Zayi satırı kaydedildiğinde | şantiye, panel tipi, adet, neden | iç |
| `client_wait.recorded` | İşveren beklemesi kaydedildi | Dolgudan geri alınma saati girildiğinde | şantiye, bekleme süresi | iç |

### Aksiyonlar

| Kod | Ad | Girdi | Gereken yetki | İki kez çalışırsa | Yarıda kalırsa |
|---|---|---|---|---|---|
| `daily_site_log.create_draft` | Günün taslak kaydını aç | şantiye, tarih | `sit.daily-site-log.enter` | Aynı gün için mevcut taslağı döndürür, ikinci kayıt açmaz | Kayıt açılmamış sayılır; tekrar çalıştırılabilir |

### Koşul alanları

| Kod | Ad | Tip | Veri sınıfı |
|---|---|---|---|
| `daily_site_log.site` | Şantiye | şantiye | iç |
| `daily_site_log.date` | Tarih | tarih | iç |
| `daily_site_log.cast_count` | Günün döküm adedi | sayı | iç |
| `daily_site_log.damaged_unit_count` | Günün zayi adedi | sayı | iç |
| `daily_site_log.is_late_entry` | Geç girildi mi | evet/hayır | iç |
| `daily_site_log.consumption_deviation_percent` | Sarf önerisinden sapma | sayı (%) | iç |
| `daily_site_log.expense_total` | Günün saha harcaması | tutar | ticari |
| `client_wait.hours` | İşveren bekleme süresi | sayı (saat) | iç |
