# Mimari İlkeler

Durum: Kalıcı · Son güncelleme: 2026-09-19

Bu belge, sahibin başlangıçta verdiği mimari yaklaşım belgesinin (Git'te `scope-archive` etiketinde, `docs/sources/architecture-principles.md`) kalıcı karşılığıdır. Kaynak klasör kaldırıldıktan sonra (TASK-0027) ilkelerin bağlayıcı hali buradadır. Her ilke kısa ifadesiyle ve **nerede karşılandığıyla** yazılmıştır; henüz ayrıntılı bir kararı olmayan ilke, hangi fazda somutlaşacağıyla birlikte kayıtlıdır ve o fazın tasarımı bu ilkeye uymak zorundadır.

Ana karar: GEOGES Panel çok sayıda bağımsız küçük uygulama değil, **tek sistem içinde sınırları çok net modüller** olarak kurulur. En kritik üç omurga: tek gerçek veri kaynağı, merkezi iş akışı ve kural motoru, değiştirilemez ve geriye dönük izlenebilir denetim geçmişi.

## İlkeler

| # | İlke | Karşılandığı yer |
|---|---|---|
| 1 | **Tek çekirdek, ayrı iş alanları.** Ortak bir çekirdeğin çevresinde sınırları net iş alanları vardır ve modüller birbirinin içine karışmaz: saha modülü maaş hesaplamaz, yalnızca "bugün 9 saat çalıştı" bilgisini üretir; İK, finans ve performans onu kendi hesabına dönüştürür. | ADR-001 (sınırları araçla denetlenen modüler monolit), `docs/architecture/MODULE_MAP.md`, REQ-SIT-032 |
| 2 | **Bir gerçek bilgi yalnızca bir yerde asıl kayıttır.** Aynı personel, firma, proje veya malzeme tek kayıttır; diğer her şey ona bağlanır. Proje → şantiye → günlük kayıt → imalat → malzeme hareketi → hakediş → gelir/gider zinciri ilişkili kayıtlardan okunur, dosya birleştirerek değil. | D-027 (firma için tek kayıt), ADR-001 (her modül kendi tablolarının sahibidir). **Genel kural olarak Phase 04 veri modelinde uygulanır:** hiçbir tablo başka bir modülün ana kaydını kopyalamaz, yalnızca ona bağlanır. |
| 3 | **Veri üç sınıftır: ana kayıtlar, hareketler, sonuçlar.** Sonuçlar (stok miktarı, ilerleme, maliyet, KPI) hareketlerden hesaplanır; "şantiyede 1.250 metre şerit var" gibi bir sayı elle yazılmaz. | ADR-005 (değişmez defterler, türetilen bakiyeler), D-077, REQ-INV-003 |
| 4 | **Her şey hareket mantığıyla kurulur.** Malzeme, para ve ekipman için yalnızca "şimdi nerede" değil "buraya nasıl geldi" de bilinir. | ADR-005, REQ-INV-003, REQ-FAC-006, REQ-FAC-007, REQ-EQP-006, REQ-FIN-019 |
| 5 | **Kayıt silinmez, geçmiş korunur.** Kim oluşturdu, kim değiştirdi, önce ne yazıyordu, neden değişti, kim onayladı görülür; sahip seviyesinin üstünde hiç kimse geçmişi görünmeden değiştiremez. | REQ-AUD-001…005, D-134, ADR-005 (denetim modeli tek yönlü kapıdır) |
| 6 | **İş akışı motoru bütün modüllerin üzerindedir.** Her modül kendi onay sistemini kurmaz; tek ortak yapı olay → görev → sorumlu → son tarih → onay → sonraki görev mantığında çalışır. | ADR-006 (CHG-006 ekiyle), REQ-WFL-001…034, D-181 |
| 7 | **Önemli her hareket bir olaydır.** Bir olay diğer modülleri haberdar eder (ör. zayi → ilerleme, stok ihtiyacı, maliyet, KPI, uyarı). | ADR-001, ADR-005 (transactional outbox ile domain olayları), her REQ dosyasının yetenek kataloğu, `docs/architecture/MODULE_MAP.md` olay akışları |
| 8 | **Kişi gerçeği girer, sistem sonucu hesaplar.** "48 C6 panel döktüm" girilir; m², hedefe oran, ilerleme, maliyet ve tahmini bitiş sistemce hesaplanır. Kişiden hesaplanmış veri (ör. "bugünkü verim %87") istenmez; bu, manipülasyonu da azaltır. | REQ-SIT-014, REQ-SIT-015, REQ-SIT-021, REQ-SIT-022, REQ-PRF-002, D-077. **Genel kural olarak Phase 02 form tasarımında ve Phase 04 veri modelinde uygulanır:** hesaplanabilen hiçbir değer için giriş alanı konmaz. |
| 9 | **Operasyon ile yönetim ayrı kullanım zihniyetidir.** Aynı veriden beslenir ama personel "bugün ne yapmalıyım" ekranını, yönetim "neden, nerede, ne risk" ekranını görür; ikisi aynı ekrana sıkıştırılmaz. | D-056 (rol başına "Bugün"), REQ-RPT-001, REQ-RPT-010 |
| 10 | **Raporlama operasyonel kayıtlara doğrudan yük bindirmez.** Yönetim görünümü binlerce kaydı her açılışta yeniden taramaz; hazır özet görünümlerden okur, böylece şirket büyüdükçe sistem hantallaşmaz. | ADR-001 (çapraz okumalar için açık okuma modelleri). **Phase 03 mimarisinde okuma modeli kararıyla, Phase 06'da yük denemesiyle (REQ-NFR-020) somutlaşır.** |
| 11 | **Evrak ilişkiseldir, klasör çöplüğü değildir.** Belge ilgili kaydın altında yaşar; arşiv bu ilişkili belgelerin merkezi arama ekranıdır. | ADR-003, REQ-DOC-001…004 |
| 12 | **Yetki rol + sorumluluk alanı + veri türüdür.** Saha modülünü gören kişi yalnızca kendi şantiyesini görür; ticari veri ayrı bir görünürlük seviyesidir. | REQ-IAM-010…012, D-111, D-115 |
| 13 | **Kurallar merkezi tanımlanır.** Şirket kuralları sistemin farklı yerlerine dağılmaz; veri olarak tek yerde, tarihli sürümle tutulur. | ADR-005, REQ-WFL-032 |
| 14 | **Analiz en üst katmandır ve veriyi değiştirmez.** Önce sağlam veri toplanır; sonra durum → sapma → neden → öneri → simülasyon zinciri kurulur. Bu katman yorumlar ve önerir, karar vermez. | REQ-INT-001…004, D-195 |
| 15 | **Tek kayıt sistemi, değiştirilebilir sağlayıcılar.** İş verisi Excel, WhatsApp veya Drive'da tutulmaz; yönetilen servisler ve dış API'ler kullanılabilir ama her sağlayıcı değiştirilebilir bir arayüzün arkasındadır; yedek sağlayıcıdan bağımsız geri yüklenebilir; dış veri kaynakları yalnızca besleyicidir; eski veriler tek seferlik aktarımla gelir. | ADR-012, ADR-002, ADR-003, ADR-004, ADR-005 (port/adapter), REQ-NFR-002, REQ-NFR-003, REQ-NFR-018, REQ-NFR-019, DEF-001 |

## Katmanlar

Alttan üste: **gerçek olaylar** (kim, ne, nerede, ne zaman, neden) → **ortak şirket çekirdeği** (personel, proje, şantiye, malzeme, firma, araç, ekipman, belge, para) → **iş modülleri** (saha, proje, fabrika, stok, ekipman, finans, İK, satış, kalite, sözleşme) → **iş akışı katmanı** (görev, onay, bildirim, eskalasyon, yükümlülük, son tarih, kurallar) → **raporlama katmanı** (KPI, kâr-zarar, verim, karşılaştırma) → **sahip / yönetim aklı** (analiz, öneri, optimizasyon, senaryo, tahmin, şirket karnesi). Bir katman yalnızca altındaki katmanlardan okur; üst katmanlar alttaki kayıtları değiştirmez. Modül listesi ve bağımlılıklar `docs/architecture/MODULE_MAP.md`'dedir.

## Gelecekte ayrıştırma

Şirket çok büyürse bazı parçalar ayrı servislere taşınabilir; bugünden dağıtılmış bir yapı kurulmaz (ADR-001 geçiş notları, DEF-005).
