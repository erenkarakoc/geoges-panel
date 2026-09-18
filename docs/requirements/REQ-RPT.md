# REQ-RPT — "Bugün", Sahip Görünümü ve Şantiye Detayı

Durum: DRAFT · 2026-09-18 · Modül: RPT (Reporting & Cockpit)

Kaynaklar: Özellik Yapısı §3, §14; kararlar D-056, D-065, D-106, D-126…D-129. **Kapsam dışı (henüz):** §34 raporlar ve dışa aktarım, ayrı bir soru turuyla Phase 01 içinde bu dosyaya eklenecek.

**Sınır.** RPT kendi verisini üretmez; diğer modüllerin olaylarından ve kayıtlarından türetir. Şantiye genel ekranındaki temel bilgiler REQ-SIT-001'dedir; şantiye listesi ve özet tablosu SIT ekranlarındadır (REQ-RPT-006). Uyarı eşikleri merkezi kurallardır (REQ-WFL-032). Kâr-zarar ve maliyet hesabı REQ-FIN'dedir; RPT yalnızca gösterir ve etkenlere ayırır.

Terimler (`docs/domain/GLOSSARY.md`): Today Screen, Owner Cockpit, Indicator, Attention Item, Loss Diagnosis.

---

## A. "Bugün" ekranı

### REQ-RPT-001 — Her rolün giriş ekranı "Bugün"

- Kaynak: §3; D-056
- Öncelik: Must · Kademe: T2
- Açıklama: Her kullanıcının girişte açılan ekranı "Bugün"dür ve rolüne göre kurulur: sahipler ve genel müdür için yönetim görünümü (cockpit) ve "Dikkat", koordinatör için onay kuyruğu, saha mühendisi için günün kaydı, taşeron ekip başı için tek dar iş. Boş ekran biten işi gösterir.
- Kabul kriterleri:
  - [ ] Girişten sonra her rol kendi "Bugün" ekranına düşer; ayrı bir cockpit giriş noktası yoktur.
- Bağlı: TASK-0035
- Durum: DRAFT

### REQ-RPT-002 — Önce özet, sonra derine inme

- Kaynak: §3, §3.3
- Öncelik: Must · Kademe: T2
- Açıklama: Her gösterge, satır ve uyarı tıklanarak kaynağına gidilir.
- Kabul kriterleri:
  - [ ] "Bugün"deki hiçbir öğe kaynağa bağlantısız değildir.
- Durum: DRAFT

### REQ-RPT-003 — Üst yönetim göstergeleri

- Kaynak: §3.1; REQ-IAM-011
- Öncelik: Must · Kademe: T2
- Açıklama: Seçilebilecek göstergeler: aktif şantiye sayısı, bugün/dün üretim, bu ayki üretim, şirket geneli aylık kâr-zarar, nakit pozisyonu, toplam açık alacak, bekleyen onay, geciken görev, kritik uyarı, kritik stok, açık İSG olayı, süresi yaklaşan kalite/uyum belgesi, açık teklifler ve kazanma oranı, personel hareketleri, açık/geciken toplantı kararları. Her gösterge yetkiye göre süzülür; ticari göstergeleri yalnızca ticari yetkisi olan görür.
- Kabul kriterleri:
  - [ ] Yetkisi olmayan kullanıcıya gösterge hiç gösterilmez; boş kutu kalmaz.
  - [ ] Aynı sayı iki yerde görünüyorsa (ör. bekleyen onay rozeti ve göstergesi) iki yerde de aynıdır.
- Durum: DRAFT

### REQ-RPT-004 — Gösterge seçimi: rol varsayılanı, kişi düzenler

- Kaynak: D-127; §3.1
- Öncelik: Must · Kademe: T2
- Açıklama: Yetkili kişi her rol için varsayılan göstergeleri belirler. Kullanıcı kendi ekranında sıralamayı değiştirir, gösterge ekleyip çıkarır ve istediğinde varsayılana döner. Kimse yetkisinin dışındaki göstergeyi ekleyemez.
- Kabul kriterleri:
  - [ ] Kullanıcının düzenlemesi yalnızca kendi ekranını etkiler.
  - [ ] Rol varsayılanı değişince, kendi ekranını değiştirmemiş kullanıcılar yeni varsayılanı görür.
- Durum: DRAFT

### REQ-RPT-005 — Açık ve katlanmış göstergeler

- Kaynak: D-065
- Öncelik: Should · Kademe: T3
- Açıklama: Önde en fazla altı gösterge açık durur; diğerleri "Tüm göstergeler" altında katlanır. Önce iş bloğu, sonra göstergeler gelir.
- Kabul kriterleri:
  - [ ] Altıdan fazla gösterge seçildiğinde fazlası katlanmış bölümde görünür.
- Bağlı: TASK-0035
- Durum: DRAFT

### REQ-RPT-006 — Şantiye özet tablosu şantiye ekranlarında

- Kaynak: §3.2; D-065
- Öncelik: Must · Kademe: T2
- Açıklama: Her aktif şantiyenin özeti (proje ve şantiye adı, günlük üretim, toplam ilerleme, hedefe göre durum, son veri giriş zamanı, son kaydın onay durumu, çift döküm bilgisi, kümülatif kâr-zarar, gecikme/bekleme sinyali, zayi/fire sinyali, kritik stok veya ekipman ihtiyacı) şantiye listesi ekranında gösterilir; "Bugün"de değil. Satıra tıklanınca şantiye detayı açılır. Kâr-zarar yalnızca ticari yetkililere görünür.
- Kabul kriterleri:
  - [ ] Şantiye listesindeki her satır şantiye detayına gider.
- Durum: DRAFT

## B. Dikkat

### REQ-RPT-007 — "Dikkat" bölümü

- Kaynak: §3.3
- Öncelik: Must · Kademe: T1
- Açıklama: Yönetim görünümünde ayrı bir "Dikkat" bölümü vardır. Şu durumlar buraya çıkar: proje hedefinden fazla döküm; fazla üretimin gizlenmeye çalışılması; zayi oranının yükselmesi; fotoğrafsız veya açıklamasız zayi girişi girişimi; geciken saha onayı; uzun süre veri girilmeyen şantiye; işveren dolgusunun gecikmesi; olağan dışı sarfiyat veya kalıp yağı tüketimi; kritik stok; uzun süre atıl vinç/makine/araç; bakımı veya periyodik kontrolü geciken ekipman; geciken hakediş veya tahsilat; negatif/tehlikeli nakit pozisyonu; yaklaşan sözleşme cezası; süresi dolan sertifika veya eğitim; açık ciddi İSG olayı; geciken toplantı kararı; kapanmayan kritik görev. Her uyarı kaynağına gider.
- Kabul kriterleri:
  - [ ] Listedeki her durum türü, ilgili modül olayı geldiğinde "Dikkat"te görünür.
- Durum: DRAFT

### REQ-RPT-008 — Dikkat öğesi yalnızca sebebi çözülünce kapanır

- Kaynak: D-126; §3.3; §10.6
- Öncelik: Must · Kademe: T1
- Açıklama: Bir uyarıyı kimse elle kapatamaz; sebebi ortadan kalkınca kendiliğinden düşer. Kullanıcı "gördüm" işareti koyabilir, uyarı yerinde kalır. Hiçbir rol bir uyarıyı sahiplerin görünümünden kaldıramaz.
- Kabul kriterleri:
  - [ ] Uyarı için "kapat", "sil" veya "gizle" işlemi yoktur.
  - [ ] "Gördüm" işareti kimin ve ne zaman koyduğuyla kaydedilir ve uyarıyı gizlemez.
  - [ ] Sebep ortadan kalktığında uyarı kendiliğinden kapanır ve kapanış zamanı kaydedilir.
- Durum: DRAFT

### REQ-RPT-009 — Uyarı eşikleri merkezi kuraldır

- Kaynak: §3.3; REQ-WFL-032
- Öncelik: Must · Kademe: T2
- Açıklama: "Zayi oranı yüksek", "uzun süre veri girilmedi", "uzun süre atıl" gibi eşikler merkezi kurallarda tutulur ve yetkili yönetimce ayarlanır; gereksinimde varsayılan değer yoktur. Tatil günleri veri girilmeyen gün sayısına katılmaz (D-038).
- Kabul kriterleri:
  - [ ] Bir eşiğin değişmesi, değişiklikten sonraki değerlendirmeleri etkiler; geçmiş uyarıları yeniden yazmaz.
- Durum: DRAFT

## C. Şirketi sistem gözünden gör

### REQ-RPT-010 — Veriye dayalı şirket değerlendirmesi

- Kaynak: §3.4
- Öncelik: Must · Kademe: T2
- Açıklama: Ayrı bir ekran, seçilen zaman aralığı için (bugün, bu hafta, son 15 gün, bu ay) şu soruları veriyle cevaplar: şirket iyi mi kötü mü gidiyor; hangi proje hedefin gerisinde; hangi şantiye verimsiz; nerede bekleme var; hangi gider olağan dışı yükseldi; hangi stok kritik; hangi kaynak atıl; hangi alacak gecikti; hangi yükümlülük yaklaşıyor; hangi görev yapılmamış; yönetimin bugün neye müdahale etmesi gerekiyor.
- Kabul kriterleri:
  - [ ] Zaman aralığı değiştiğinde tüm cevaplar o aralığa göre yeniden hesaplanır.
  - [ ] Her cevap kaynağına gider.
- Durum: DRAFT

### REQ-RPT-011 — Sistem gözü ekranını sahipler ve genel müdür görür

- Kaynak: D-128
- Öncelik: Must · Kademe: T1
- Açıklama: Bu ekran ticari ve hassas veri içerdiği için yalnızca sahipler ve genel müdür tarafından görülür.
- Kabul kriterleri:
  - [ ] Başka bir role ekranın yetkisi verilemez; deneme reddedilir.
- Durum: DRAFT

## D. Şantiye detayı

### REQ-RPT-012 — Şantiye detayında üst göstergeler

- Kaynak: §14.1
- Öncelik: Must · Kademe: T2
- Açıklama: Şantiye detayında toplam ilerleme %, günlük/kümülatif döküm, günlük/kümülatif montaj, kalan iş ve hedefe göre durum görünür; ticari yetkisi olana gelir, gider ve kâr-zarar da görünür.
- Kabul kriterleri:
  - [ ] Ticari yetkisi olmayan kullanıcı gelir, gider ve kâr-zararı görmez.
- Durum: DRAFT

### REQ-RPT-013 — "Niye zarardayız?" tanı kartı

- Kaynak: §14.2; D-129
- Öncelik: Must · Kademe: T1
- Açıklama: Kart her zaman görünür ve şantiyenin maliyet etkenlerini ayırır: işveren dolgu beklemesi, yüksek zayi, hedefin altında ilerleme, yüksek saha harcaması, taşeron işçilik maliyeti, malzeme maliyeti, yemek/konaklama, kamp/kira, nakliye, vinç/operatör, ekipman amortismanı, fazla personel, atıl kapasite. Mümkün olduğunda her etkenin parasal etkisi gösterilir. Şantiye zarardayken veya kârlılık düşüşteyken kart en üste çıkar ve en büyük etkenler vurgulanır. Kart ticari veridir; ticari yetkisi olmayan kullanıcı görmez.
- Kabul kriterleri:
  - [ ] Etkenlerin parasal toplamı, gösterilen gider toplamıyla açıklanabilir biçimde ilişkilidir; hesaplanamayan etken "hesaplanamadı" diye belirtilir, sıfır gösterilmez.
  - [ ] Zarar durumunda kart sayfanın en üstünde, en büyük üç etken vurgulu görünür.
- Durum: DRAFT

### REQ-RPT-014 — Son günlük kayıtlar ve eksik günler

- Kaynak: §14.3; D-038
- Öncelik: Must · Kademe: T2
- Açıklama: Şantiye detayında son günlerin listesi vardır: tarih, döküm, montaj, durum, onay/düzeltme, günlük gider/kâr-zarar (ticari yetkiliye), eksik kayıt uyarısı. Kayıt girilmeyen günler kolayca fark edilir; tatil günleri eksik sayılmaz.
- Kabul kriterleri:
  - [ ] Kayıt girilmemiş iş günü listede boş satır olarak değil, belirgin bir "kayıt yok" satırı olarak görünür.
- Durum: DRAFT

---

## Yetenek kataloğu — RPT

Biçim: `docs/requirements/README.md`. RPT türetilmiş veriyi yayımlar; akışlar "Dikkat" öğelerine tepki verebilir (ör. uzun süre açık kalan bir uyarıyı üst role taşımak).

### Olaylar

| Kod | Ad | Ne zaman | Taşıdığı alanlar | Veri sınıfı |
|---|---|---|---|---|
| `attention_item.raised` | Dikkat öğesi oluştu | Bir uyarı durumu ortaya çıktığında | tür, kaynak kayıt, şantiye | iç |
| `attention_item.resolved` | Dikkat öğesi kapandı | Sebebi ortadan kalktığında | tür, kaynak kayıt, açık kaldığı süre | iç |

### Aksiyonlar

Yok. RPT hiçbir kaydı değiştirmez.

### Koşul alanları

| Kod | Ad | Tip | Veri sınıfı |
|---|---|---|---|
| `attention_item.type` | Uyarı türü | seçim (REQ-RPT-007 listesi) | iç |
| `attention_item.open_days` | Uyarının açık kaldığı gün | sayı | iç |
| `site.progress_percent` | Şantiye ilerlemesi | sayı (%) | iç |
| `site.profit_loss` | Şantiye kümülatif kâr-zararı | tutar | ticari |
