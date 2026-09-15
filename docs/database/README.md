# Veritabanı Tasarımı

Phase 04'te doldurulur. Veritabanı UI ekranlarına göre değil domain modeline göre tasarlanır.

Her varlık için değerlendirilecekler: amaç · sahiplik (modül) · ilişkiler · kısıtlar · indeksler · yetkiler · RLS · audit · geçmiş · soft delete · saklama süresi · veri sınıfı (genel / iç / ticari / hassas kişisel).

Temel ilkeler (ADR-005): hareketler değişmez defterde tutulur, bakiyeler türetilir; kurallar ve fiyatlar tarih bazlı sürümlenir; migration'lar önce ekleme yapar (expand/contract); isimlendirme `docs/standards/NAMING_CONVENTIONS.md`.
