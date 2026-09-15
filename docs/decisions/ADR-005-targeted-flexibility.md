# ADR-005 — Hedefli esneklik mimarisi

## Karar
Esneklik, değişimin bilindiği noktalara yapılandırılabilirlik olarak; geri kalan her yere ise "değiştirmesi güvenli kod" olarak kurulur. Mimari, yerini alan ADR'larla sonradan yeniden şekillendirilebilir.

## Bağlam
Sahip esnekliği en önemli kalite özelliği olarak belirledi. Şirket organizasyonu, kuralları ve iş kalemleri değişecek; yeni modüller eklenecek.

## Problem
Her şeyi yapılandırılabilir yapmak sistemi karmaşık ve hataya açık bir iç platforma dönüştürür; hiç esneklik koymamak ise her kural değişikliğini geliştirme işine çevirir.

## Alternatifler
1. Hedefli esneklik
2. Her şey yapılandırılabilir (low-code platform)
3. Sade kod, değişiklikler geliştirmeyle

## Seçilen Çözüm
Seçenek 1. Mekanizmalar:

| Değişim noktası | Mekanizma |
|---|---|
| İş kuralları, onay zincirleri, eşikler | Veri olarak tutulan, tarih bazlı sürümlü kurallar; görsel iş akışı motoru (ADR-006) |
| Organizasyon | Dinamik rol, çoklu rol, vekâlet, görünürlük politikaları |
| İş türleri (imalat kalemi, malzeme türü, ürün grubu, şablon, gider kategorisi) | Katalog tabloları; enum yalnızca sistem durumları için |
| Ek alan ihtiyacı | Belirlenmiş varlıklarda tipli özel alanlar |
| Modüller arası tepkiler | Transactional outbox ile domain olayları |
| Stok, para, ekipman hareketleri | Değişmez defterler; bakiye ve raporlar türetilir, yeniden hesaplanabilir |
| Sağlayıcılar | Port/adapter (auth, storage, jobs, notification, email, exchange rate, weather, PDF) |
| Kademeli açılış | Özellik anahtarları (rol/kullanıcı bazlı) |
| Arayüz | Tasarım token'ları + proje bileşen katmanı |

**Tek yönlü kapılar** (şimdi sağlam karar): modül sınırları, olay modeli, defter yapısı, tarih bazlı sürümleme, kimlik/yetki/audit modeli, isimlendirme.
**Çift yönlü kapılar** (değiştirilebilir bırakılır): barındırma, depolama, iş kuyruğu, ORM/veri erişim kütüphanesi, UI kütüphanesi ayrıntıları.

Değişim güvenliği: domain testleri, mimari sınır testleri, staging, ekleme öncelikli migration (expand/contract), ADR supersede mekanizması.

## Gerekçe
Esnekliğin maliyeti yalnızca geri dönüşü olduğu yerde ödenir; aşırı mühendislik yasağıyla (PROJECT_RULES §6) uyumludur.

## Avantajlar
Kural değişiklikleri kod gerektirmez; geçmiş hesaplar korunur; sağlayıcılar değişebilir; raporlar veri kaybı olmadan yeniden kurulabilir.

## Dezavantajlar
Olay ve defter tasarımı başlangıçta daha fazla tasarım emeği ister.

## Riskler
Yapılandırılabilirliğin kontrolsüz genişlemesi. Önlem: yeni yapılandırma noktası ancak kayıtlı değişim ihtiyacıyla ve ADR/CHG ile eklenir.

## Geçiş (Migration) Notları
Yerini alan ADR'lar eski kararı `Yerini aldı` olarak işaretler ve etki analizini içerir.

## Tarih
2026-09-15

## Durum
Kabul edildi
