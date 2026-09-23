# GEOGES Panel — Yol Haritası

Son güncelleme: 2026-09-23 · Ayrıntılı ve bağlayıcı kayıt: `ai/MASTER_ROADMAP.md` ve `ai/TASKS.md`.
Bu dosya o kayıtların okunması kolay özetidir; çelişirse asıl olan `ai/MASTER_ROADMAP.md`'dir.

## Fazlar

| | Faz | Ne yapılır | Durum |
|---|---|---|---|
| ✅ | **00** Kurulum | Depo, kural sistemi, standartlar, yapay zekâ altyapısı | bitti (2026-09-15) |
| ✅ | **01** Gereksinimler | 26 dosya, 438 gereksinim, iş kuralları, rol-yetki matrisi, veri sınıfları | bitti (2026-09-19) |
| ✅ | **02** Ekran tasarımı | 108 ekranın envanteri, durumları, sekiz uçtan uca akış, gezinme | bitti (2026-09-20) |
| ✅ | **03** Sistem mimarisi | Modül sınırları, olay omurgası, iş akışı mimarisi, arama mimarisi | bitti (2026-09-20) |
| ✅ | **04** Veritabanı mimarisi | 222 tablo, geçmiş, kapsam, satır düzeyi güvenlik, defter yapıları | bitti (2026-09-20) |
| ✅ | **05** Altyapı | Ortamlar, CI, yedekleme, kurtarma, çalışma kitapları | bitti (2026-09-20) |
| ✅ | **06** Doğrulama denemeleri | 17 deneme: yetki, kuyruk, R2, metin tanıma, arama, canlı sinyal | bitti (2026-09-21) |
| 🔨 | **07** Temel yapım | Panelin altyapısı — **şu an buradayız** | devam ediyor |
| ⬜ | **08** İş akışı motoru | Akış tanımları, sürümleme, çalıştırma, görsel tasarımcı, onay merkezi | sırada |
| ⬜ | **09** Dilim 1 | Projeler, şantiyeler, duvarlar, günlük saha kaydı, onaylar, "niye zarardayız", sahip kokpiti, resmî günlük rapor | — |
| ⬜ | **10** Dilim 2 | Malzeme, tartım ve sevkiyat, stok defteri, sayım, satın alma, fabrika günlüğü ve birim maliyet, fire ve hurda | — |
| ⬜ | **11** Dilim 3 | Hakedişler, gelir-gider, cari hesaplar, nakit projeksiyonu, çoklu döviz, dönem kapanışı | — |
| ⬜ | **12** Dilim 4 | Ekipman, amortisman, bakım, vinç günlüğü; personel dosyası, puantaj, bordro, izin | — |
| ⬜ | **13** Dilim 5 | Müşteri adayları, ihale, teklif ve kârlılık, teklif belgeleri, maliyet geri beslemesi | — |
| ⬜ | **14** Dilim 6 | Sözleşme yükümlülükleri, sertifikalar, İSG, uygunsuzluk, toplantılar, destek talepleri | — |
| ⬜ | **15** Dilim 7 | Arşiv (tek pencere arama, metin tanıma), raporlama, performans ve KPI, prim, öneriler, bütçe-gerçekleşme | — |
| ⬜ | **09R** Kayıt tipi oluşturucu | Kullanıcının kendi kayıt türünü tanımlaması (dilim 1 pilotundan sonra) | — |
| ⬜ | **19** Canlıya geçiş | Kendi sunucumuza taşıma, güvenlik ve yük incelemesi, yedek geri yükleme tatbikatı, gerçek veri | — |

## Faz 07 — nerede olduğumuz

| | İş | Durum |
|---|---|---|
| ✅ | CI hattı (TASK-0100) | bitti |
| ✅ | Veri erişimi, göçler, kısıtlı çalışma rolü (TASK-0101) | bitti |
| ✅ | Yetki: kapsamlı roller, hiyerarşi, vekâlet, görünürlük (TASK-0102) | bitti |
| ✅ | Denetim kaydı ve kayıt geçmişi (TASK-0103) | bitti |
| ✅ | Olay kuyruğu, iş kuyruğu, zamanlayıcı (TASK-0104) | bitti |
| ✅ | Kataloglar, tarihli kurallar, özel alanlar (TASK-0105) | bitti |
| ✅ | Döviz kuru ve iş günü takvimi (TASK-0106) | bitti |
| ✅ | Belgeler ve depolama: R2, imzalı bağlantı, metin tanıma (TASK-0107) | bitti |
| ✅ | Bildirim ve görev çekirdeği (TASK-0108) | bitti |
| ✅ | Revizyon talebi çekirdeği (TASK-0109) | bitti |
| 🔨 | Site geneli arama (TASK-0110) | dört adımın ikisi bitti |
| 🔨 | Ana ekran ve telefon dokunma alanları (TASK-0113) | devam ediyor |
| ⬜ | Hesap güvenliği: kurtarma kodları, kilit, oturum sonu (TASK-0112) | başlamadı |
| ⬜ | Ekran altı işlevsel şerit (TASK-0028) | başlamadı |
| ⬜ | **M1 — sahibin kendi makinesinde kabul turu (TASK-0111)** | Faz 07'nin kapanışı |

## Kilometre taşları

- **M0 — ilk ekranlar:** giriş, iki adımlı doğrulama ve uygulama kabuğu. Bitti (2026-09-16).
- **M1 — yerel kabul:** sahip paneli kendi makinesine kurar, girer ve uçtan uca bir akışı gezer. Faz 07'nin sonunda.
- **Pilot ve barındırma:** gerçek kullanıcılarla pilot ve sunucu kararı Faz 09 çıkışında.
- **Gerçek veri:** Faz 19; öncesinde kendi sunucumuza taşınır ve KVKK kontrolü yapılır.

## Panelde ne zaman ne görünür

- **Bugün:** giriş ve iki adımlı doğrulama, uygulama kabuğu, "Bugün" ekranı, görevler, görev ver, bildirim çekmecesi, denetim kayıtları, revizyon talepleri.
- **Faz 07 sonunda:** arama, telefon bildirimi ve ana ekrana ekleme, kabul turu.
- **Faz 08:** akış tasarımcısı ve onay merkezi.
- **Faz 09'dan itibaren:** asıl iş ekranları — şantiye günlüğü, stok, hakediş, personel ve raporlar dilim dilim.
