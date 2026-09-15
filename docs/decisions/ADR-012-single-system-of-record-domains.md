# ADR-012 — Tek kayıt sistemi, dış servisler ve alan adları

## Karar
- Şirketin iş kayıtları, belgeleri ve yazışmaları yalnızca panelde tutulur; Excel, WhatsApp ve Drive kayıt sistemi olarak kullanılmaz. Panel Drive arşivinin yerini alır.
- "Dış bağımlılık olmaması" bu anlama gelir; teknoloji altyapısında yönetilen servisler (Supabase, Cloudflare, gerekirse Google Cloud Run, hata takibi vb.) ve dış API'ler (TCMB kurları, hava durumu vb.) kullanılabilir. Dış veri kaynağına erişilemezse son değer veya elle giriş kullanılır.
- Uygulama alan adı `geogespanel.com`'dur ve arama motorlarına kapalıdır (`robots` engeli ve `X-Robots-Tag: noindex`). `geoges.com` gerekli yerlerde (ör. e-posta göndericisi, kurumsal bağlantılar) kullanılabilir — kullanım yeri Phase 05'te belirlenir (OQ-015).
- Kaynak kod deposu: `github.com/erenkarakoc/geoges-panel` (private).

## Bağlam
Şirketin mevcut dağınıklığının kaynağı Excel ve WhatsApp takibidir. İlk yorumda "dış bağımlılık yok" teknoloji servisleri olarak da anlaşılmış, sahip bunu netleştirmiştir.

## Problem
Kayıt sisteminin tekliği ile teknoloji seçim serbestliğinin karıştırılması.

## Alternatifler
1. Hiçbir dış servis kullanmamak
2. Kayıtlar panelde, teknoloji servisleri serbest (seçilen)

## Seçilen Çözüm
Seçenek 2.

## Gerekçe
İş hedefi verinin tek yerde olmasıdır; yönetilen servisler geliştirme hızını artırır ve port/adapter yapısıyla değiştirilebilir kalır.

## Avantajlar
Tek doğruluk kaynağı; hızlı ve güvenilir altyapı.

## Dezavantajlar
Birden fazla servis sağlayıcısının yönetimi ve maliyeti.

## Riskler
Uygulamanın yanlışlıkla indekslenmesi; önlem: tüm ortamlarda noindex, deploy kontrol listesinde doğrulama.

## Geçiş (Migration) Notları
Mevcut Excel, eski panel ve Drive verilerinin aktarımı DEF-001.

## Tarih
2026-09-15

## Durum
Kabul edildi
