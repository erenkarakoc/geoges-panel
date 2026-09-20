# SPIKE-04–06 — Deneme planı

Tarih: 2026-09-20 · Durum: TAMAMLANDI (deneme kapsamı) · Görevler: TASK-0086, TASK-0087, TASK-0088

Amaç: D-235 ve ADR-006 kapsamındaki sürüm sabitleme, etkisiz deneme çalıştırması ve 2 saniyelik geçmiş sorgusu sınırını ayrı kabul ölçütleriyle doğrulamak. İş kuralları zaten sahip onaylıdır; yeni iş kararı alınmaz.

Bağımlılıklar: TASK-0064; mevcut Phase 03 mimarisi ve Phase 04 şema tasarımı. Etkilenen kalıcı dosyalar yalnız bu plan, üç sonuç raporu, mimari doğrulama notu ve ai kayıtlarıdır. Ürün/backend/frontend kodu değişmez; arayüz oluşturulmaz.

Veritabanı: yalnız izinli geçici spike şemasında wf_ önekli, örnek verili deney tabloları. Ürün şeması ve gerçek kişisel veri kullanılmaz. Çalıştırıcı ve yardımcılar repository dışındaki geçici klasörde tutulur. Ürün göçü yoktur. Önceden aynı adlı tablo varsa üzerine yazmak yerine deney durur. Geri alma: açık işlemler rollback; deney tabloları diğer denemelerden ayrı kalır, toplu reset veya CASCADE kullanılmaz.

SPIKE-04: v1 ile başlatılan ve bekletilen örnek kalıcı tutulur; bağlantı kapatılır. v2 yayımlanır; yeni bağlantıyla eski örnek v1, yeni örnek v2 üzerinde tamamlanır. Adım kimliği/sürüm/tetikleyen kayıt/sahip bilgisi kalıcı çalışma günlüğünden doğrulanır. Yayımlanmış tanımı düzenleme ve eski deneme sonucuyla yayınlama reddedilir.

SPIKE-05: aynı geçiş değerlendiricisi gerçek ve kuru modda çalışır. Aynı örnek veri, kararlar ve yetki ilişkileri altında approve/reject/return yollarının adım dizisi ve sahipleri eşit olmalı. Kuru modda iş etkisi adaptörü çağrılmamalı, gerçek veritabanı salt okunur işlemde kalmalı; deney tablolarının öncesi/sonrası aynı olmalı. Yanlışlıkla yazma girişimi ayrıca reddedilmeli. Onay cevapları deney girdisidir; gerçek kullanıcı etkileşimi veya 14 düğümün tamamı bu denemelerin konusu değildir.

SPIKE-06: 500.000 sentetik geçmiş satırında şantiye+tür+tarih indeksleriyle sayım ve toplam; sınır günleri ve veri eklenince taze sonuç kontrol edilir. İki ısınma sonrası 20 ölçüm alınır. Gerçek PostgreSQL statement_timeout=2000 ve 3 saniyelik kontrollü bekleme ile zaman aşımı üretilir. İşlem geri alınır; örnek ayrı işlemde hata durumuna geçmeli, günlükte neden ve bildirim kuyruğunda kayıt olmalı; koşul false sayılıp sonraki adım çalışmamalı.

Güvenlik: sırlar yalnız bağlantı yardımcısı tarafından okunur, çıktıya yazılmaz. Önceki yardımcının sertifika doğrulama sınırlaması devam eder; bu deney üretim bağlantısının güvenlik onayı değildir. Kuru modda gerçek kullanıcı yerine sentetik rol/ilişki kayıtları okunur; tam IAM bağlantısı Phase 08 kapsamındadır.

Kapanış: gerçek çıktılarla öz inceleme; başarısızlıklar saklanır, ölçülmeyen davranışlar açıkça belirtilir. Kayıtlar güncellenir; tam commit kapısı geçerse main'e commit ve otomatik push yapılır.

Sonuçlar: `SPIKE-04-workflow-versioning.md`, `SPIKE-05-dry-run-parity.md`, `SPIKE-06-windowed-conditions.md`. 26 ana kontrol ve 13 bağımsız günlük/sorumlu kontrolü geçti. Ürün kodu değişmedi. wf_ deney tabloları sentetik verilerle bırakıldı; üzerine yazma veya şema sıfırlama yapılmadı.
