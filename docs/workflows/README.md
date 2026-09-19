# İş Akışları

Durum: Kabul edildi · Son güncelleme: 2026-09-19 (CHG-006)

Şirket süreçleri (onay zincirleri, eskalasyonlar, tetikleyiciler, bağımlılık kilitleri) koda gömülmez; iş akışı motorunda **sürümlü akış tanımları** olarak çalışır ve tam görünürlüklü yetkili kullanıcılar tarafından tasarımcıyla kurulur. Kurallar: ADR-006 (CHG-006 ekiyle), kararlar D-077…D-105.

- Phase 01: her modül **yetenek kataloğunu** çıkarır — yayınladığı olaylar, sunduğu aksiyonlar, koşulların okuyabileceği tipli ve sınıflandırılmış alanlar (TASK-0041).
- Phase 02: sekiz uçtan uca akış (REQ-WFL-011, REQ-WFL-028) **gerçek akış tanımı** olarak adım adım yazılır ve her adım palete karşı sınanır (D-089, TASK-0042).
- Phase 08: motor ve tasarımcı kurulur; varsayılan akışlar **şablon** olarak gelir, kullanılan akış onun kopyasıdır (D-086).

Uçtan uca bir süreç tek uzun akış değildir; **birbirini tetikleyen kısa akışlardan** kurulur (D-104).

İlk tanımlanacak varsayılan akışlar: günlük saha kaydı onayı · malzeme çıkış talebi · ödeme onayı · hakediş → fatura · personel çıkışı · revizyon talebi · stok sayımı onayı · satın alma talebi · teklif onayı · ve sekiz uçtan uca süreç (REQ-WFL-011, REQ-WFL-028).

## Uçtan uca akışların palet sınaması (REQ-WFL-011, REQ-WFL-028) (2026-09-17)

Sınama 2026-09-17'de yapıldı. Yöntem: uçtan uca akışlardaki (REQ-WFL-011, REQ-WFL-028) her adım üç kutudan birine konuldu —
**Ç** (çekirdek: veri girişi, defter, türetme — akış düğümü değil), **palet**
(ADR-006'nın 12 düğümünden biri karşılıyor), **boşluk** (hiçbir düğüm karşılamıyor).

Palet: başlangıç/olay · onay · görev · koşul · süre/bekleme · bildirim · eskalasyon ·
paralel dal · birleşme · alt akış · kilit · bitiş.

| Akış | Adım | Ç | Palet | Boşluk |
|---|---|---|---|---|
| 45.1 Yeni işten tahsilata | 18 | 8 | 7 | 3 |
| 45.2 Siparişten sahada kullanıma | 15 | 11 | 2 | 2 |
| 45.3 Günlük saha üretimi | 11 | 9 | 1 | 1 |
| 45.4 Personel çıkışı | 7 | 1 | 4 | 2 |
| 45.5 İşveren gecikmesi | 9 | 5 | 3 | 1 |
| 45.6 Toplantı kararından göreve | 9 | 4 | 5 | 0 |
| 45.7 Kritik sertifika / İSG olayı | 5 | 2 | 3 | 0 |
| 45.8 Nakit sıkışması | 6 | 4 | 2 | 0 |

**45.6 ve 45.7 paletle eksiksiz ifade edilebiliyor.** Diğerlerinde altı farklı boşluk çıktı.

### Bulunan boşluklar

**B-1 — Kayıt oluşturan/güncelleyen düğüm yok.**
45.1/7 (sözleşme ve yükümlülükleri açılır), 45.1/9 (proje ve şantiye oluşturulur),
45.4/2 (çıkış checklist'i açılır), 45.6/9 (görev **ve karar** kapanır), 45.7/5
(kayıt kapanır). Paletteki 12 düğüm görev açar, onay ister, bildirim yollar — ama
hiçbiri kayıt oluşturmaz veya bir kaydın durumunu değiştirmez. Bu belgenin §5'i
"taslak kayıt oluştur"u bir aksiyon olarak sayıyor, ADR-006'nın paleti saymıyor.
İkisinden biri düzeltilmeli.

**B-2 — Liste üzerinde yineleme ("her X için") yok.**
45.4/4–5: personelin **zimmetleri** kontrol edilir, eksik olan her cihaz için uyarı
çıkar. Zimmet sayısı kişiye göre değişir. Palette sabit **paralel dal** var; dinamik
sayıda dal yok. 45.4/3 (sözleşmenin istediği evrak listesi) aynı durumda. Sabit dalla
bu akış yazılamaz.

**B-3 — Onay düğümünün reddi nereye gidiyor, tanımsız.**
45.3/10: "eksikse düzeltme ister; tam ise onaylar". Yani onayın **iki değil üç**
sonucu var — onay, red, **düzeltmeye geri gönder** — ve üçüncüsü grafikte geriye
giden bir kenar. ADR-006 onay düğümünü tanımlıyor ama çıkışlarını ve geri gönderme
kenarını tanımlamıyor. REQ-AUD-007…010, REQ-SIT-033'deki revizyon talebi mekanizmasıyla da bağlantılı.

**B-4 — Koşul yalnızca tek kaydı okuyor; toplu/tarihsel koşul yok.**
45.5/6: "**tekrarlayan** gecikme şantiye tanı ekranında görünür". Bu "son 30 günde
3'ten fazla gecikme" demek — tek kaydın alanı değil, bir zaman penceresindeki sayım.
ADR-006 koşulları "tutar > eşik, tür = değer, rol = X" diye tarif ediyor; hiçbiri bunu
karşılamıyor.

**B-5 — Dış taraf onayı bekleyecek düğüm yok.**
45.1/8 (kurum onayı takip edilir), 45.1/12 (hakediş **işverene** sunulur ve onaylanır),
45.5 boyunca işveren. Onay düğümü sistemdeki bir kullanıcıya gider; işveren ve resmî
kurum sistemde kullanıcı değil. Pratikte bu "bir personel 'işveren onayladı' diye
işaretler" demek — yani görev + bekleme + koşul üçlüsü. Üç akışta tekrarladığı için
adlandırılmış bir kalıp olmayı hak ediyor; yeni düğüm mü, yoksa hazır alt akış şablonu
mu, karar konusu.

**B-6 — Tetikleyici tipleri tanımlı değil.**
45.2/1 (proje ihtiyacı çıkar) ve 45.2/15 (kritik seviyeye yaklaşınca) **eşik**
tetikleyicisi; 45.7/1 (sertifika süresi yaklaşır) **tarih/zamanlanmış** tetikleyici.
ADR-006 yalnızca "başlangıç/olay" diyor. Bu belgenin §5'i beş tetikleyici tipi
öneriyor ama ADR'de kayıtlı değil.

### Boşluk olmayan, ama sınırı netleşen iki nokta

- **45.8/3 "8 haftalık çizelgede açığı önceden görür"** yeni bir düğüm gerektirmiyor.
  Projeksiyonu **çekirdek** hesaplar ve "nakit açığı öngörüldü" olayını yayınlar; akış
  yalnızca o olayı dinler. Öngörü motorun değil, çekirdeğin işi.
- **45.2'nin 15 adımından 11'i çekirdek.** Akışın rolü iki noktada: fark/fire kontrolü
  (9) ve kritik seviye uyarısı (15). Yani bu "uçtan uca akış" aslında tek bir akış
  tanımı değil.

### Sınamanın en önemli çıktısı

**Uçtan uca bir akış, tek bir akış tanımı değildir.** 45.1 aylara yayılıyor ve sekiz
modül geçiyor; bunu tek bir yürüyen süreç olarak modellemek, aylarca açık kalan ve her
sürüm değişiminde göç sorunu çıkaran bir örnek üretir. Doğrusu: **olaylarla zincirlenen
birkaç kısa akış** (teklif akışı → sözleşme akışı → günlük onay akışı → hakediş akışı →
fatura/tahsilat akışı). REQ-WFL-011, REQ-WFL-028 bunları tek bir anlatı olarak yazıyor çünkü iş dilinde öyle
anlatılıyor; motor tarafında öyle kurulmamalı. Bu, ADR-006'ya yazılması gereken bir
tasarım kuralı.

### Boşlukların kapanışı (2026-09-18)

| Boşluk | Karar |
|---|---|
| B-1 kayıt oluşturan/güncelleyen düğüm | Eklendi: taslak ve durum değişikliği, defter asla (D-095, D-080) |
| B-2 liste üzerinde yineleme | Eklendi: "her biri için", tek seviye (D-096) |
| B-3 onayın reddi | Üç sonuç: onayla / reddet / düzeltmeye geri gönder; geri kenar serbest (D-099) |
| B-4 geçmişe bakan koşul | Serbest; sorgu süre sınırı ve deneme çalıştırmasında gerçek sonuç (D-100) |
| B-5 dış taraf onayı | Hazır alt akış şablonu; işverene panel girişi yok (D-102) |
| B-6 tetikleyici tipleri | Olay, saat/takvim, eşik; elle başlatma her zaman; e-posta ertelendi — DEF-006 (D-103) |

Phase 02'de (TASK-0042) sınama yeni düğümlerle sekiz akışın tamamı için yeniden yapıldı: palet eksiği çıkmadı, dört katalog eksiği ve bir bağlama kuralı sahip kararıyla kapandı (D-222). Tanımlar: `docs/workflows/END_TO_END_FLOWS.md`.
