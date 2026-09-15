# Altyapı

Phase 05'te doldurulur. Kararlar: ADR-002 (Supabase Cloud, AB Frankfurt), ADR-003 (Cloudflare R2), ADR-004 (VPS + Docker, gerekirse Cloud Run), ADR-012 (alan adları).

Tasarlanacaklar: ortam matrisi (development / staging / production) · Supabase projeleri · R2 bucket'ları ve erişim · VPS düzeni, reverse proxy, SSL · `geogespanel.com` için arama motoru engeli (`robots`, `X-Robots-Tag: noindex`) · CI/CD hattı (lint → type-check → unit → integration → build → security → deploy → health check → rollback) · sır yönetimi · loglama, hata takibi, izleme · yedekleme ve felaket kurtarma (RPO/RTO, şirket dışı yedek, geri yükleme tatbikatı) · e-posta gönderimi · web push.

Açık sorular: OQ-010…OQ-017.
