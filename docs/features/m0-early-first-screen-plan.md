# M0 — İlk Ekran Uygulama Planı

Durum: TASLAK (TASK-0022) · Karar: CHG-002 (Seçenek B) · 2026-09-16

## 1. Görev ve amaç

- **Görev:** TASK-0023…TASK-0026
- **Amaç:** Gerçek Supabase girişiyle çalışan giriş ekranlarını ve boş kart iskeletli dashboard'u bu bilgisayarda göstermek. Kod atılacak bir deneme değildir: Phase 07'de üzerine devam edilecek kalıcı yapı olarak kurulur.
- **Kapsam dışı:** gerçek roller ve yetki tabloları, iş verisi, denetim kaydı (audit), çevrimiçi yayın, üretim e-posta servisi. Bunlar Phase 01–07'de tasarlanır.

## 2. Bağımlılıklar

| Bağımlılık | Sahibi | Not |
|---|---|---|
| CHG-002 onayı | Sahip | Alındı (Seçenek B) |
| Supabase hesabı + dev projesi (AB Frankfurt) | Sahip | Yapay zekâ hesap açamaz ve anahtarlara dokunmaz |
| `.env.local` içine proje adresi ve publishable key | Sahip | Dosya Git'e girmez (`.gitignore`) |
| 2FA yöntemi | Sahip | Doğrulama uygulaması (TOTP), SMS yok (D-043) |
| Node 24.13.1, npm 11.8.0 | — | Kurulu. Paket yöneticisi geçici olarak npm (OQ-017) |

## 3. Esneklik ilkeleri (sahip gereksinimi, ADR-005)

1. **Modül klasörleri:** kod sahibi modüle göre ayrılır (`modules/iam`, `modules/rpt`). Ortak parçalar `platform/` altındadır. Genel `utils/` klasörü yoktur.
2. **Giriş portu:** ekranlar yalnızca `AuthProvider` arayüzünü bilir (giriş, çıkış, oturum, 2FA, parola sıfırlama). Supabase bu arayüzün bir uyarlayıcısıdır; sağlayıcı değişirse ekranlar değişmez (ADR-002).
3. **Kayıt defteri ile menü ve dashboard:** sol menü öğeleri ve dashboard kartları veri olarak tanımlanır (modül, etiket, ikon, adres, gereken yetki). Yeni modül veya kart eklemek kabuk koduna dokunmadan yapılır. Rol bazlı filtreleme sonradan bu alana bağlanır.
4. **Tasarım token'ları:** renk, boşluk, radius, tipografi merkezi değişkenlerden gelir (`#0F4C81`, `#DDDBDB`, durum renkleri, açık/koyu mod).
5. **COSS sarmalama:** COSS UI bileşenleri proje bileşen katmanında sarmalanır. Gelişmiş bileşenlerde Origin örneği referans alınır, COSS ile kurulur (D-042).
6. **Sınır kuralları ilk günden:** modüller arası doğrudan erişimi engelleyen lint kuralları kurulur (ADR-001).
7. **İş mantığı bileşende değil:** ekranlar uygulama katmanını çağırır; doğrulama ve oturum kuralları tek yerdedir.

## 4. Klasör yapısı (taslak)

```text
src/
  app/
    (auth)/sign-in/            giriş
    (auth)/two-factor/         2FA doğrulama ve kurulum
    (auth)/reset-password/     parola sıfırlama isteği
    (auth)/update-password/    yeni parola belirleme
    auth/confirm/route.ts      e-posta bağlantısı doğrulama (PKCE, token_hash)
    (app)/layout.tsx           uygulama kabuğu
    (app)/dashboard/           boş kart iskeleti
    (app)/[moduleSlug]/        menü kayıt defterinden otomatik üretilen modül yer tutucuları
    (auth)/onboarding/         yeni rol yönlendirmesi (ortalanmış yerleşim)
  modules/
    iam/  application/ domain/ infrastructure/supabase/ ui/
    rpt/  ui/dashboard/
  components/ui/  COSS UI temel bileşenleri (shadcn CLI `@coss/*` ile yönetilir, elle değiştirilmez)
  lib/, hooks/    COSS'un yardımcı dosyaları (CLI yönetir)
  platform/
    access/     AccessPolicy arayüzü (M0 önizleme politikası; gerçek politika IAM'den gelir)
 navigation/ navigation-registry.ts (sol menü, REQ-NFR-007)
 dashboard/ dashboard-widget-registry.ts (cockpit kartları, REQ-INV-026, REQ-RPT-002…004, REQ-RPT-006…009)
    ui/         app-shell, tema (brand.css), modül yer tutucu sayfası
    supabase/   browser ve server istemcileri (TASK-0025)
  proxy.ts     oturum yenileme ve korumalı sayfa yönlendirmesi
```

Adresler ve kod İngilizce, ekran metinleri Türkçedir (ADR-010, ADR-011).

## 5. Veritabanı

Tablo oluşturulmaz. Yalnızca Supabase Auth kullanılır. Yetki kararlarında `user_metadata` kullanılmaz (kullanıcı değiştirebilir); gerekirse `app_metadata` kullanılır.

## 6. Sunucu tarafı

- Giriş, çıkış, parola sıfırlama ve 2FA işlemleri sunucu eylemleri (server actions) üzerinden `AuthProvider` ile yapılır.
- `auth/confirm` rotası e-posta bağlantısındaki `token_hash` değerini `verifyOtp` ile doğrular.
- Korumalı sayfalar `getClaims` ile kontrol edilir; `getSession` yetki kararında kullanılmaz.
- 2FA gerekli kullanıcı `aal1` seviyesindeyse 2FA ekranına yönlendirilir; korumalı sayfalar `aal2` ister.

## 7. Arayüz

- **Giriş:** e-posta, parola, hata mesajları, yükleniyor durumu, "Parolamı unuttum" bağlantısı.
- **2FA:** kod girişi; ilk kez girenler için kurulum adımı.
- **Parola sıfırlama:** e-posta isteği, gönderildi bilgisi, yeni parola belirleme.
- **Yeni rol yönlendirmesi:** adım göstergeli tanıtım (devl.dev onboarding ilhamı). Roller henüz tasarlanmadığı için içerik statik ve "örnek" diye işaretlidir.
- **Uygulama kabuğu:** sol dikey menü (boş modül sayfaları), üst bar (kullanıcı, çıkış, tema), açık/koyu mod, mobil görünüm.
- **Dashboard:** boş kart iskeleti; kart başlıkları REQ-RPT-003…004'deki göstergelerden gelir, rakam yoktur.
- Her ekranda yükleniyor, hata ve boş durumları; klavye kullanımı; WCAG 2.2 AA kontrastı.

## 8. Güvenlik

- Tarayıcıya yalnızca publishable key gider. `service_role` veya secret key uygulamada kullanılmaz.
- Herkese açık kayıt (sign-up) Supabase panelinden kapatılır; hesapları sahip panelden açar.
- `.env.local` Git'e girmez; paket sürümleri sabitlenir ve `package-lock.json` commit edilir.
- Uygulama arama motorlarına kapalıdır (`robots` + `X-Robots-Tag: noindex`, ADR-012).
- Supabase'in varsayılan e-posta servisi yalnızca proje ekibine gönderir ve saatte 2 e-postayla sınırlıdır. Önizlemede parola sıfırlama yalnızca sahip adresiyle denenir; üretimde özel SMTP gerekir (OQ-015).
- Bilinen boşluklar (Phase 03/07'de tasarlanır): hesap kilitleme politikası (REQ-AUD-006, REQ-IAM-001, REQ-IAM-003…006, REQ-IAM-008), 2FA kurtarma yöntemi, anında oturum kapatma, denetim kaydı.

## 9. Testler

- Tip kontrolü, lint ve modül sınırı kuralları.
- Birim testleri: `AuthProvider` sözleşmesi (sahte uyarlayıcı ile), menü ve dashboard kayıt defterleri, form doğrulamaları.
- Uçtan uca duman testi: giriş → 2FA → dashboard → çıkış (yerel Supabase dev projesiyle, test hesabıyla).
- Erişilebilirlik ve mobil görünüm kontrolü.
- Uygulamadan sonra belgeli öz-inceleme (QUALITY_GATES).

## 10. Geçiş ve geri alma

- Veri geçişi yoktur.
- Tüm iş `feature/m0-early-first-screen` dalında yapılır; `main`'e ancak kalite kapısı geçince ve sahip onayıyla birleşir.
- Geri alma: dalın birleştirilmemesi veya commit'lerin geri alınması; Supabase dev projesinin silinmesi.

## 11. Kabul kriterleri

1. Sahibin açtığı hesapla giriş yapılır; hatalı parolada anlaşılır Türkçe hata gösterilir.
2. 2FA etkin hesapta kod girilmeden dashboard'a geçilemez.
3. Parola sıfırlama e-postası sahip adresine gelir ve yeni parola belirlenir.
4. Giriş yapmamış kullanıcı korumalı sayfaya giderse giriş ekranına yönlendirilir.
5. Sol menü ve dashboard kartları kayıt defterinden gelir; yeni öğe eklemek yalnızca kayıt defterine satır eklemekle görünür.
6. Açık/koyu mod ve mobil görünüm çalışır.
7. Tip kontrolü, lint, sınır kuralları ve testler geçer.
8. Yeni rol yönlendirmesi adım adım gezilebilir.
