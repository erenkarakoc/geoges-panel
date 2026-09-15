# Güvenlik

Phase 01 (veri sınıflandırma) ve Phase 03'te (yetki tasarımı) doldurulur.

## Başlangıç veri sınıfları (taslak)

| Sınıf | Örnek | Erişim ilkesi |
|---|---|---|
| Genel iç | Şantiye adı, üretim miktarı, görevler | Rol ve sorumluluk alanı kapsamında |
| Ticari | Kâr-zarar, birim maliyet, teklif fiyatı, marj | Yalnız ticari görünürlüğü açık roller ve Sahip |
| Hassas kişisel | TC kimlik, IBAN, SGK, maaş, sağlık raporu | Yalnız İK yetkilileri ve Sahip; sağlık verisi özel nitelikli kişisel veridir |

## Aktif risk

RISK-001 (KVKK): hassas personel verisi Supabase Cloud AB (Frankfurt) bölgesinde tutulacak; ek alan şifreleme seçilmedi. Gerçek İK verisi girilmeden önce hukuki değerlendirme önerilir (OQ-024). Geliştirme, test ve AI oturumlarında gerçek kişisel veri kullanılmaz.

## Her feature'da kontrol

Kimlik doğrulama · yetkilendirme · RLS · roller ve izinler · girdi doğrulama · rate limiting · sırlar · imzalı URL'ler · audit · hassas veri · bağımlılık güvenliği.
