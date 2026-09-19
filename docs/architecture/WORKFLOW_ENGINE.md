# İş Akışı Motoru Mimarisi

Durum: TASLAK · Son güncelleme: 2026-09-20

ADR-006 ve CHG-006 kararlarının (D-077…D-105) mimarisi. Ne yapacağı REQ-WFL'de, nasıl görüneceği `docs/ui-ux/ADMINISTRATION.md`'de, hangi akışların hazır geleceği `docs/workflows/END_TO_END_FLOWS.md`'de yazılıdır. Bu belge motorun iç yapısını belirler. Görev: TASK-0059. Kararlar: D-235.

## 1. İki ayrı şey: tanım ve örnek

- **Tanım (definition):** bir akışın sürümlü tarifi. JSON'dur; görsel tasarımcı da, soru-cevap da aynı JSON'u üretir (REQ-WFL-026).
- **Örnek (instance):** tetiklenmiş, yürüyen ya da bitmiş bir akış. Başladığı **tanım sürümüne** bağlıdır ve o sürümle tamamlanır (REQ-WFL-024).

Yeni sürüm yayımlamak yürüyen örnekleri etkilemez. Bu, "akış değişti, yarım kalan işler bozuldu" durumunu imkânsız kılar.

## 2. Tanım modeli

```json
{
  "key": "daily-site-log-approval",
  "version": 7,
  "status": "published",
  "trigger": { "type": "event", "event": "daily_site_log.submitted" },
  "settings": { "timeZone": "Europe/Istanbul" },
  "steps": [
    {
      "id": "s1",
      "type": "approval",
      "title": "Koordinatör onayı",
      "owner": { "type": "relation", "relation": "site.coordinator" },
      "escalation": { "after": "PT8H", "to": { "type": "role", "role": "GK" } },
      "outcomes": { "approve": "end", "return": "s2", "reject": null }
    },
    {
      "id": "s2",
      "type": "task",
      "title": "Düzelt ve yeniden gönder",
      "owner": { "type": "relation", "relation": "record.submitter" },
      "completesOn": { "event": "daily_site_log.submitted", "sameRecord": true },
      "next": "s1"
    }
  ]
}
```

Kurallar:

- Adım türleri REQ-WFL-005'teki on dörtle sınırlıdır; motor başka tür tanımıyor. Serbest kod yoktur (REQ-WFL-006).
- Her adımın `id`'si tanım içinde tekildir ve **değişmez**; sürümler arasında aynı kalır, böylece çalışma günlüğü sürümler boyunca okunabilir.
- `owner` dört biçimden biridir (D-097): belirli kişi, rol, kayıtla ilişki (`site.coordinator`, `record.submitter`, `record.owner.manager`), yetki tipi. İlişki adları modüllerin yetenek kataloğunda ilan edilir.
- Geri giden kenar serbesttir (D-099); motor döngüyü yasaklamaz, **sayar** (bölüm 7).
- JSON şeması sürümlüdür; şema değişikliği eski tanımları dönüştüren bir göçle yapılır (ADR-006).

## 3. Tetikleyiciler (REQ-WFL-007, D-103)

| Tür | Nasıl çalışır |
|---|---|
| Olay | Abone olarak outbox'tan gelir (`docs/architecture/EVENT_BACKBONE.md`) |
| Saat / takvim | İş kuyruğunun zamanlayıcısı; "bitime X gün kala" da buradadır. Her çalıştırma tekrarsızlık anahtarı taşır |
| Değer eşiği | Eşiği geçiren olayla çalışır; sürekli sorgu yoktur |
| Elle | Yetkili kullanıcı her akışı elle başlatabilir |

Aynı kayıt için aynı akışın ikinci örneği, akış "tek örnek" işaretliyse açılmaz; motor var olan örneği döndürür. Varsayılan tek örnektir; çoklu örnek tasarımcıda açıkça seçilir.

## 4. Yürütme

Örnek bir **durum makinesidir**: her adım `bekliyor → çalışıyor → tamamlandı / atlandı / hata` durumlarından geçer. Motor tek bir işleyicidir; her ilerleme adımı kendi işleminde yazılır ve outbox'a kendi olayını bırakır.

- **Onay adımı** bir onay kaydı açar; kayıt Onaylar kuyruğuna düşer (REQ-WFL-012). Üç sonuç: onayla, reddet, düzeltmeye gönder (D-099). Reddetme ve geri gönderme gerekçesizse kabul edilmez (REQ-WFL-015). Vekâlet ve üst rol yedeği IAM'den gelir (REQ-IAM-020).
- **Görev adımı**, görev kapanana kadar bekler. Sistem görevi, sorunu çözen olay geldiğinde kendiliğinden kapanır (REQ-TSK-005); `completesOn` bunu tarif eder.
- **Süre/bekleme adımı** zamanlayıcıya bir uyandırma bırakır; sunucu yeniden başlasa da uyandırma veritabanındadır.
- **Kayıt oluştur / durum değiştir adımı** yalnız katalogdaki `*.create_draft` aksiyonlarını ve durum geçişlerini çağırır (D-095); defteri kesinleştiren aksiyon katalogda yoktur (D-080).
- **Her biri için adımı** listeyi, tetikleyen kayda bağlı kayıtların sorgusuyla alır (D-222); tek seviyedir (D-096). Liste sınırı vardır (bölüm 7); dallar paralel çalışır, birleşmede hepsi beklenir.
- **Kilit adımı** hedef kayda bir kilit yazar; kilit bir durum geçişini engeller ve sebebini ekranda yazar (REQ-WFL-029). Sahip ve genel müdür gerekçeyle aşar (REQ-WFL-030, D-084).
- **Alt akış adımı** ayrı bir örnek başlatır ve biterse devam eder; dış taraf onayı şablonu böyle çalışır (D-102).

## 5. Koşullar (REQ-WFL-008, D-100)

- Tipli koşullar katalogdaki koşul alanlarını okur; alanın veri sınıfı korunur.
- Geçmişe bakan koşullar ("son 30 günde 3'ten fazla") sayım ve toplam sorgularıdır. Güvenceler: sorgu süresi sınırlıdır (varsayılan 2 saniye), sorgu yalnız hazır dizinli alanlar üzerinde kurulur, ve sonuç örnek içinde önbelleğe alınmaz — her değerlendirme tazedir.
- Süre aşılırsa akış **hata ile durur** ve nedeni çalışma günlüğüne yazılır; sessizce "yanlış" kabul edilmez.
- Koşullar **sistem yetkisiyle** okur (D-082); bu yüzden akış tasarlama yetkisi yalnız tam görünürlüklü rollere verilir ve bu kodda zorlanır (D-083). Zorlama IAM'dedir (`docs/architecture/PERMISSIONS.md`).

## 6. Deneme çalıştırması ve yayın

- **Deneme (REQ-WFL-025):** örnek bir kayıtla tanım baştan sona yürütülür, ama motor "kuru mod"dadır: aksiyonlar çağrılmaz, görev ve bildirim üretilmez, kilit yazılmaz. Koşullar **gerçek veriyle** değerlendirilir ve sonucu gösterilir; adım sahipleri gerçek kişiler olarak hesaplanır.
- Deneme sonucu tanım sürümüne bağlanır. Tanım denemeden sonra değiştiyse yayın yeni deneme ister.
- **Yayın (REQ-WFL-023, D-081):** yayımlayan kişi tanımı `published` yapar; önceki sürüm `superseded` olur. Yayın denetim kaydına yazılır, sahibe bildirim gider, akış 7 gün "yeni" işaretli kalır ve o süredeki işlemleri ayrı listelenir.
- Bir akış **kapatılabilir** (`disabled`): yeni örnek başlamaz, yürüyenler biter.

## 7. Sınırlar (motorun kendini koruması)

| Sınır | Varsayılan | Neden |
|---|---|---|
| Bir örnekte işlenen adım sayısı | 500 | Geri kenarla kurulmuş sonsuz döngü |
| "Her biri için" liste uzunluğu | 500 | Yanlış sorgu binlerce görev açmasın |
| Koşul sorgusu süresi | 2 sn | REQ-WFL-008 |
| Bir olaya bağlı eşzamanlı örnek | 50 | Toplu işlem akışı boğmasın |
| Örneğin yaşam süresi | 180 gün | Aylarca açık kalan örnek (D-104'ün tersi) fark edilsin |

Sınıra çarpan örnek hata ile durur, sahip katmanına bildirim gider ve çalışma günlüğünde nedeni yazar. Sınırlar mühendislik ayarıdır; tasarımcıda görünmez.

## 8. İzlenebilirlik (D-087, T1)

- Motorun ürettiği her görev, bildirim, kilit ve durum değişikliği şu üçlüyü taşır: akış anahtarı + sürüm, adım kimliği, tetikleyen kayıt.
- Çalışma günlüğü (SCR-197) bu üçlüden kurulur; "neden bende" metni de (D-223).
- Örnek geçmişi denetim kaydının parçasıdır ve silinmez (D-231).

## 9. Şablonlar (D-086)

- Varsayılan şirket akışları `templates/` altında JSON olarak gelir; kurulumda her biri **kopya** olarak şirkete yazılır.
- Şablon güncellenince kopya değişmez; "yeni sürüm var" bildirimi çıkar ve kopya şablona sıfırlanabilir.
- `docs/workflows/END_TO_END_FLOWS.md`'deki tanımlar bu şablonların kaynağıdır ve Phase 08'de motorun **kabul testleri** olur (REQ-WFL-028).

## 10. Motorun yapamadıkları (REQ-WFL-006, D-091)

Serbest kod, doğrudan veritabanı erişimi, defter kesinleştirme, çalışırken yetki verme, dış sisteme veri gönderme, bildirim metnine hassas kişisel veri koyma. Bunlar katalogda hiç yoktur; yasak bir ayar değil, olmayan bir yetenektir.

## 11. Phase 06'ya giden sorular

- Sürümlü tanım + yürüyen örnek modeli, sürüm göçü olmadan çalışıyor mu?
- Geçmişe bakan koşullar gerçek veri hacminde süre sınırının altında kalıyor mu?
- Kuru mod (deneme), gerçek yürütmeyle aynı yolu izliyor mu — yoksa iki ayrı davranış mı doğuyor?
