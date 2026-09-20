# SPIKE-01 — Satır düzeyi güvenliğin doğruluğu

Durum: GEÇTİ · Tarih: 2026-09-20 · İlgili: ADR-015, D-238, `docs/architecture/PERMISSIONS.md`

**Soru.** Doğrudan PostgreSQL bağlantısı, kullanıcının kimliğini işlem başında oturum değişkenine yazarak satır düzeyi güvenliği (RLS) doğru çalıştırıyor mu? Çok rollü, vekâletli ve şantiye kapsamlı bir kullanıcı hiçbir yetkisiz satırı görmüyor mu? Yetki değişimi bir sonraki istekte geçerli mi?

**Yöntem.** Gerçek Supabase projesinde (PostgreSQL 17.6) atılacak bir `spike` şeması: kullanıcı, kapsamlı rol ataması, şantiye, günlük saha kaydı ve stok hareketi tabloları; kapsam sütunlarına dayanan RLS politikaları. Dört kullanıcı: şirket kapsamlı sahip, iki şantiyeli koordinatör, tek şantiyeli mühendis, süreli vekâletle üçüncü şantiyeye bakan vekil. Üç şantiyeye beşer günlük kayıt. Her sorgu, RLS'e tabi bir uygulama rolüyle ve işlem başında yazılan kimlikle çalıştırıldı.

## Sonuçlar — 9 kontrolün 9'u geçti

| Kontrol | Sonuç |
|---|---|
| Şirket kapsamlı kullanıcı 15 kaydın tamamını görüyor | 15 |
| İki şantiyeli koordinatör yalnız kendi şantiyelerini görüyor | 10 |
| Tek şantiyeli mühendis yalnız kendi şantiyesini görüyor | 5 |
| Süreli vekâlet çalışıyor (bugün geçerli aralık) | 5 |
| Yetkisiz kaydın kimliğiyle doğrudan sorgulama | 0 satır |
| Toplamlar da süzülüyor (sayı sızıntısı yok) | Beklenen toplam |
| Yetkisiz şantiyeye yazma | RLS reddetti |
| Yetki bitince (atama tarihi geçmişe çekilince) | 0 satır, bir sonraki istekte |
| Kimlik yazılmadan açılan işlem | 0 satır |

Son satır önemlidir: kimliği yazmayı unutan bir kod yolu **fazla** veri değil, **hiç** veri görür. Hata, sızıntı değil boş ekrandır.

## Yol boyunca çıkan gerçek ayrıntı

Bağlanan kullanıcı, geçmek istediği uygulama rolünün **üyesi olmak zorunda**: `postgres` rolü `set role` ile kendi oluşturduğu role bile üyelik olmadan geçemedi (`permission denied to set role`). Üretimde uygulama zaten kendi rolüyle bağlanacağı için bu bir kurulum ayrıntısıdır, ama göçlerde rol üyeliğinin yazılı olması gerekir (Phase 07).

## Yeniden doğrulama ve yetki düzeltmesi (2026-09-20)

İlk dokuz kontrol tek başına yeterli değildi: deneme kurulumu `spike_app` rolüne bütün tablolarda yazma hakkı vermişti. Ek negatif test, bu rolün `role_assignment` tablosuna şirket kapsamlı atama ekleyerek 114.977 kaydın tamamını okuyabildiğini gösterdi. Sahte atama aynı işlemde geri alındı. Bu, ürün kodunda değil, atılacak deneme kurulumunda bulunan bir açıktır.

Deneme rolünün toplu tablo ve dizi yetkileri kaldırıldı. Yalnız şantiye, günlük kayıt ve stok hareketini okuma; günlük kayda RLS denetimiyle ekleme yetkisi bırakıldı. Yetki yardımcılarının `PUBLIC` çalıştırma hakkı kaldırılıp yalnız deneme rolüne verildi. Yetki tablolarına doğrudan erişim kapatıldı.

Önceki hız iyileştirmesinde değiştirilmiş politikalar üzerinde **12/12 kontrol geçti**: rolün RLS'i atlayamaması; iki ayrı rolün kapsam birleşimi; toplamların süzülmesi; yabancı kimliğin görünmemesi; yabancı şantiyeye yazmanın reddi; kendi şantiyesine yazabilme (geri alındı); kendine rol eklemenin reddi; atama tablosunun okunamaması; vekâletin bitmesinin sonraki işlemde uygulanması; bütün atamalar bitince sıfır satır; şirket kapsamının bütün satırları görmesi; aynı bağlantıda sonraki kimliksiz işleme kimlik sızmaması. Ek test kullanıcısı ve atamaları temizlendi.

## Karar ve sınırlar

D-238 ve ADR-015'in **işlem başına kimlik ve kapsam süzmesi yaklaşımı**, daraltılmış yetkilerle bu denemede doğrulandı. Bu sonuç bütün IAM sisteminin veya üretim güvenliğinin onayı değildir. Oturum doğrulama, kişisel istisnalar, hassas sütun süzmesi ve bütün ürün tablolarının politikaları Phase 07 testlerine dahildir. Kimlik değişkeni güvenilen sunucu tarafından yazılır; SQL bağlantısı son kullanıcıya verilmez.

Bağlantı yardımcısında TLS sertifika doğrulaması kapalıydı; bu kurulum üretime taşınamaz. Ürün bağlantısı doğrulanan sertifika ve ayrı, sınırlı giriş rolü kullanmalıdır. Denemedeki şema sahibi bağlantısından `SET LOCAL ROLE` geçişi, ayrı giriş rolünün uçtan uca sınanması yerine geçmez.

Öz inceleme: ilk rapordaki geniş güvenlik iddiası daraltıldı; negatif yetki testi eklendi; ürün şemalarına dokunulmadı. Görev: TASK-0082. Kaynak: [Supabase RLS rehberi](https://supabase.com/docs/guides/database/postgres/row-level-security).

**Phase 07 için kural:** her istek, işlemin ilk ifadesinde kimliği yazar; kimlik yazılmadan sorgu çalıştıran bir kod yolu testle yakalanır (veri katmanı sözleşme testi).
