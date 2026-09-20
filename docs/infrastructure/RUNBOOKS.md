# İşletim El Kitapçıkları

Durum: CONFIRMED (sahip, 2026-09-20) · Son güncelleme: 2026-09-20

Bir şey ters gittiğinde ne yapılacağı. Her kitapçık: belirti → ilk kontrol → düzeltme → sonrası. Yerel dönem için yazıldı; sunucu kurulunca dağıtım ve izleme adımları eklenecek (DEF-008). Görev: TASK-0078.

## RB-01 — Panel açılmıyor

1. Komut isteminde `npm run dev` çalışıyor mu; hata satırını oku.
2. Hata "port kullanımda" ise: eski süreci kapat (`Ctrl + C`) veya bilgisayarı yeniden başlat.
3. Hata bağımlılıkla ilgiliyse: `npm install`.
4. Hata veritabanı bağlantısıyla ilgiliyse: `.env.local` yerinde mi, internet var mı, Supabase projesi duruyor mu.
5. Çözülmezse: hatanın tam metnini ve son commit'i kaydet, geliştirmeye ilet.

## RB-02 — Giriş yapılamıyor

1. Parola mı, ikinci adım mı? Ekrandaki mesaj tek ve geneldir; hangi alanın yanlış olduğunu söylemez (REQ-IAM-001).
2. Ardışık hatadan sonra geçici kilit devrede olabilir; kalan süre ekranda yazar (REQ-IAM-005).
3. Telefon kaybolduysa: kurtarma kodlarından biri kullanılır; yoksa yetkili yönetici ikinci adımı sıfırlar (D-236). Sıfırlama denetime yazılır ve sahibe bildirim gider.
4. Hesap pasifse mesaj "Hesabınız kapalı" der; İK veya sahip hesabı yeniden açar.

## RB-03 — Olaylar işlenmiyor (kuyruk durdu)

**Belirti:** onaylanan günlük kayıt stoğa düşmüyor, görevler açılmıyor, sayaçlar güncellenmiyor.

1. İşleyici süreci çalışıyor mu (yerelde `npm run dev` ile birlikte kalkar).
2. `core.outbox` tablosunda bekleyen satır sayısına bak: artıyorsa işleyici durmuş demektir.
3. İşleyiciyi yeniden başlat. Olaylar sıradan işlenir; tekrar zararsızdır (ADR-014).
4. `core.dead_letter` boş mu? Doluysa RB-04.
5. Sonrası: 15 dakikadan uzun gecikme olduysa hangi kayıtların geciktiğini not et; kullanıcıya görünen sayılar birkaç dakika eski olabilir.

## RB-04 — Ölü mektup listesi doldu

1. Satırdaki hata metnini oku: hangi olay, hangi abone, hangi kayıt.
2. Hata koddaysa düzelt; veride ise kaydı düzelt.
3. Olayı elle yeniden çalıştır. Aynı olay ikinci kez işlenirse etkisi olmaz (tekrarsızlık).
4. Kök nedeni bir göreve bağla; aynı hata tekrar ediyorsa kalıcı çözüm yazılır.

## RB-05 — Akış örneği hata ile durdu

1. Yönetim > İş akışları > Çalışma günlüğünde örneği bul; hangi adımda, hangi nedenle durduğu yazar (REQ-WFL-034).
2. Neden "koşul sorgusu süreyi aştı" ise koşulu daralt (D-100).
3. Neden bir aksiyon hatasıysa kaydı düzelt ve örneği yeniden çalıştır.
4. Akış düzeltilemiyorsa: işi insan elle yapar (REQ-WFL-031); istisnai işlem denetime yazılır.
5. Kilit takılı kaldıysa sahip veya genel müdür gerekçeyle aşar (REQ-WFL-030).

## RB-06 — Göç yanlış gitti

1. Göçü **durdur**; sonraki göçleri çalıştırma.
2. Göç öncesi dökümden geri dön (`BACKUP_AND_RECOVERY.md` bölüm 4).
3. Göçü düzelt, boş bir veritabanında dene, sonra tekrar uygula.
4. Göç geri alınamıyorsa (veri silen adım) bu ayrı bir göç olmalıydı; kuralı ihlal eden göç gözden geçirilir (`docs/database/CONVENTIONS.md` bölüm 11).

## RB-07 — Yanlış veri girildi

1. Panelde silme yoktur. Kayıt onaysızsa düzeltilir; onaylıysa **revizyon talebi** açılır (REQ-AUD-007).
2. Defter satırı (stok, cari, gelir-gider) düzeltilmez; ters kayıt yazılır.
3. Toplu hata varsa (ör. yanlış reçeteyle günlerce sarf hesaplandı): kuralı tarihli olarak düzelt, etkilenen onaysız kayıtlar kendiliğinden düzelir; onaylılar için revizyon listesi çıkarılır (REQ-ADM-008).

## RB-08 — Kur alınamadı

1. `exchange_rate.missing` olayı düştü mü, ilgili kayıtlar "kur bekliyor" işaretli mi.
2. TCMB erişimi geçici sorunsa ertesi çalıştırmada tamamlanır.
3. Acil ihtiyaçta yetkili elle kur girer; kim, ne zaman, neden girdiği kayda geçer (REQ-ADM-014).

## RB-09 — Dosya açılmıyor / yüklenmiyor

1. R2 erişimi var mı; imzalı bağlantının süresi dolmuş olabilir, sayfayı yenile.
2. Yükleme sahada yarım kaldıysa bağlantı gelince kaldığı yerden tamamlanır (SPIKE-15 ile doğrulanacak).
3. Dosya bozuksa sürüm geçmişinden önceki sürüm açılır (DOC-K4).

## RB-10 — Anahtar sızdı

1. Sızan anahtarı hemen iptal et (Supabase / R2 panelinden).
2. Yeni anahtar üret, `.env.local` güncelle, uygulamayı yeniden başlat.
3. Açık oturumları düşür; denetim kaydında olağan dışı erişim ara (REQ-IAM-008).
4. Olay raporu yaz: ne sızdı, ne zaman, ne yapıldı.

## RB-11 — Sahip hesabına erişim kalmadı

1. Birden fazla sahip vardır (REQ-IAM-022); diğer sahip erişimi geri verir.
2. Tek sahip kaldıysa ve erişim yoksa: veritabanı tarafından yetkili bir hesap yeniden etkinleştirilir. Bu işlem denetime yazılır ve sonradan sahibe raporlanır.
3. Bu durumun tekrar etmemesi için ikinci bir sahip hesabı her zaman açık tutulur.
