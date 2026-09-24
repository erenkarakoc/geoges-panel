# M1 — Yerel kabul turu (TASK-0111)

Durum: hazır · Son güncelleme: 2026-09-24

Faz 07'nin kapanış kabulü (D-245): paneli kendi bilgisayarınızda kurup çalıştırıyor, iki adımlı
doğrulamayla giriyor ve baştan sona bir tur atıyorsunuz. Amaç hata aramak değil, **temel altyapının
sizin elinizde gerçekten çalıştığını** görmek ve aklınıza takılanı kayda geçirmek.

Kurulum adımları `docs/infrastructure/LOCAL_SETUP.md`'de. Bu belge turun kendisidir.

## Tur başlamadan: neyin olmadığını bilin

Bunlar **bilerek** yok; not almanıza gerek yok:

| Yok | Nerede gelecek |
|---|---|
| Şantiye, proje, hakediş, stok gibi iş ekranları | Faz 09 ve sonrası (dilimler) |
| İş akışı tasarımcısı ve otomatik onay akışları | Faz 08 |
| Aramada gerçek kayıt sonuçları | Modüller kendi kayıtlarını Faz 09'da bağlayacak; şimdilik yalnız menü/sayfa sonuçları çıkar |
| Ana ekrana ekleme ve telefon bildirimi | HTTPS adresi gerektiriyor; barındırma Faz 09 çıkışında (D-274, DEF-008) |
| E-posta gönderimi | Sağlayıcı seçilmedi; günlük özet `.mail/` klasörüne dosya olarak yazılıyor |
| Rol, yetki ve vekâlet ekranları | Kullanıcılar ekranı şimdilik asgari (D-273) |
| **Tanımlar ekranı** | Kataloglar, tarihli kurallar ve özel alanlar veritabanında çalışıyor (TASK-0105) ama ekranı yok; menüdeki girdi "henüz geliştirilmedi" der. Ekran Faz 09'da |

## Tur

On adımda **ne yapacağınız** ve **ne görmeniz gerektiği** yazıyor. Beklenenden farklı bir şey
görürseniz ekran görüntüsü alıp not edin.

### 1. Giriş ve iki adımlı doğrulama

1. `npm run dev`, sonra `http://localhost:3000`.
2. E-posta ve parolanızla girin. → Doğrulama uygulamasındaki 6 haneli kod isteniyor.
3. Kodu girin. → "Bugün" ekranı açılıyor.
4. Hesap menüsünden (sağ üst) çıkış yapın, tekrar girin. → Aynı akış; oturumunuz yeniden başlıyor.

Görmeniz gereken: yanlış parolada hesabın var olup olmadığını **söylemeyen** bir mesaj; arka arkaya
beş yanlış denemeden sonra "giriş … dakika kapalı" uyarısı (isterseniz deneyin, süre dolunca açılır).

### 2. Kurtarma kodları

1. Hesap menüsü → "İki adımlı doğrulama".
2. Kodlarınız duruyorsa bir şey yapmayın. Yoksa: kaldırıp yeniden kurun. → Kurulum bitince **on
   kurtarma kodu bir kez** gösterilir.
3. Kodları kaydedin. Telefonunuzu kaybederseniz panele bunlarla girersiniz.

### 3. Bugün ekranı

Görmeniz gereken: tarih, "Dikkat" bloğu ve göstergeler. Rakamların yanında **"Örnek veri"** işareti
olmalı — bu ekrandaki sayılar gerçek değil, şimdilik yerini tutuyor.

### 4. Görev verme ve alt bant

1. Sağ üstten "Görev ver". → Pencere açılır (telefonda aşağıdan çekmece).
2. Kendinize bir görev verin. → Görevler listesinde görünür, zil sayacı artar.
3. Görevi açın. → Eylem düğmesi **kartın altındaki sabit bantta**. "Tamamladım" deyin. → Görev
   kapanır, geçmişine satır düşer.
4. "Yeniden aç" deyin, gerekçe yazın. → Gerekçe alanı kayıtla birlikte, düğme bantta.

### 5. Bildirimler

Zile tıklayın. → Görev bildiriminiz listede. Filtreyi (Tümü / Görevler / …) deneyin. Hesap
menüsünde "Telefona anında bildirim" satırı var; HTTPS olmadan telefonda çalışmaz, bilgisayarda
açmayı deneyebilirsiniz.

### 6. Onaylar ve revizyon talepleri

"Onaylar" → "Bugün temiz" görmelisiniz; kuyruk Faz 08'de dolacak. Üstteki ikinci sekme (ya da menüdeki
"Revizyon Talepleri") revizyon taleplerini açar: aynı ekranın sekmesidir (D-223). Bugün boş, çünkü
henüz kilitli kayıt üreten bir modül yok; ekranın kendisi çalışıyor.

### 7. Denetim kayıtları

"Yönetim → Denetim Kayıtları". → Girişleriniz, görev işlemleriniz ve iki adımlı doğrulama
değişiklikleriniz burada. Filtreleri deneyin. Bu ekranı yalnız sahipler görür.

### 8. Kullanıcılar

"Yönetim → Kullanıcılar & Roller". → Asgari ekran: kişiler, iki adımlı doğrulama durumu, kalan
kurtarma kodu, açık oturum sayısı ve "İkinci faktörü sıfırla". **Kendinize uygulamayın** (kendi
faktörünüzü silersiniz); ne sorduğuna bakmak yeterli.

### 9. Telefondan

Aynı Wi-Fi'de, komut isteminde yazan `http://192.168...:3000` adresini telefonunuzdan açın. →
Altta gezinme çubuğu, ortada büyük "+" düğmesi. Bir görev detayına girin: **gezinme çubuğu çekilir,
yerine ekranın kendi bandı gelir**; çıkınca geri gelir.

### 10. Arka plan işleri

Komut isteminde `npm run jobs:status`. → Zamanlanmış işler ve son çalışmaları. Panel açıkken bunlar
kendiliğinden çalışır.

## Geri bildiriminiz

Her not için: **hangi ekran**, **ne yaptınız**, **ne bekliyordunuz**, **ne oldu**. Ekran görüntüsü
en iyisi. Notlarınız `ai/DECISIONS.md` ve ilgili göreve işlenir; düzeltme isteyenler görev olur,
kapsam değiştirenler değişiklik talebi (CHG) olur.

Tur bittiğinde TASK-0111 kapanır ve Faz 07 çıkışı için son adım kalır.
