# ADR-015 — Veri erişimi: RLS korunarak doğrudan PostgreSQL

## Karar
Uygulama veriye PostgREST üzerinden değil, havuzlanmış **doğrudan PostgreSQL bağlantısıyla** ve tipli sorgu kurucusuyla erişir. Satır düzeyi güvenlik korunur: her işlemin başında kullanıcının kimliği oturum değişkenine yazılır. RLS'i atlayan servis bağlantısı yalnız göçlerde ve outbox işleyicisinde kullanılır.

## Bağlam
Supabase barındırma ve kimlik doğrulama için kullanılıyor (ADR-002); iş mantığı standart PostgreSQL'de kalmalı.

## Problem
Kayıt ve outbox satırı tek işlemde yazılmak zorunda (ADR-014). Hakediş, nakit projeksiyonu ve okuma modelleri çok tablolu sorgular ister. PostgREST ikisini de zorlaştırır.

## Alternatifler
1. supabase-js / PostgREST
2. Doğrudan PostgreSQL + RLS (oturum kimliğiyle)
3. Doğrudan PostgreSQL, RLS'siz; yetki yalnız uygulamada

## Seçilen Çözüm
Seçenek 2 (D-238). Ayrıntı: `docs/architecture/PORTS_AND_SERVICES.md` bölüm 2. Seçenek 3 reddedildi: sunucuda unutulan tek bir kontrol veri sızdırır, RLS son savunmadır (`docs/architecture/PERMISSIONS.md` bölüm 3).

## Gerekçe
Tutarlılık, sorgu gücü ve taşınabilirlik; güvenlik katmanı kaybedilmeden.

## Avantajlar
Tek işlem; karmaşık sorgu; sağlayıcıdan bağımsızlık; RLS korunur.

## Dezavantajlar
Bağlantı havuzu ve oturum değişkeni yönetimi bizde kalır; PostgREST'in hazır uç noktaları kullanılmaz.

## Riskler
Oturum değişkeni yazılmadan açılan bir işlem yetkisiz veri görebilir. Önlem: bağlantı yalnız veri katmanında açılır ve sözleşme testi bunu denetler (`docs/architecture/MODULE_BOUNDARIES.md` bölüm 5). Doğrulama: SPIKE-01, SPIKE-02.

## Geçiş (Migration) Notları
Karar Phase 06 denemesine kadar geçicidir (OQ-020). Deneme kalırsa seçenek 1'e dönülür ve outbox veritabanı tetikleyicisiyle yazılır.

## Tarih
2026-09-20

## Durum
Kabul edildi (SPIKE-01 ve SPIKE-02 ile doğrulanacak)
