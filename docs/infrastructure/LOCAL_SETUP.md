# Paneli Kendi Bilgisayarınızda Çalıştırma

Durum: CONFIRMED (sahip, 2026-09-20) · Son güncelleme: 2026-09-22

Her dilim bitiminde paneli kendi bilgisayarınızda açıp gezmeniz için (D-245). Windows içindir. İlk kurulum bir kez yapılır, sonraki dilimlerde yalnız 5. ve 6. adımlar tekrarlanır.

> Not: Ürün kodu Phase 07'de yazılmaya başlıyor. Bu belge şimdiden hazır; ilk çalıştırılabilir sürüm çıktığında adımlar test edilip güncellenecek.

## 1. Gerekenler (bir kez)

| Ne | Neden | Nereden |
|---|---|---|
| Node.js 24 LTS | Panel bununla çalışır | nodejs.org, "LTS" sürümü |
| Git | Kodu almak için | git-scm.com |
| Bir metin düzenleyici (isteğe bağlı) | Ayar dosyasını açmak için | Not Defteri yeterli |

Kurulumdan sonra komut istemini (PowerShell) açıp `node -v` yazın; `v24...` görmelisiniz.

## 2. Kodu alın (bir kez)

```powershell
git clone https://github.com/<kullanıcı>/geoges-panel.git
cd geoges-panel
```

## 3. Ayar dosyası (bir kez)

Size ayrı olarak ileteceğim `.env.local` dosyasını proje klasörüne koyun. İçinde Supabase ve dosya deposu anahtarları vardır. **Bu dosyayı kimseyle paylaşmayın ve Git'e eklemeyin.**

Dosyada `SUPABASE_SERVICE_ROLE_KEY` de bulunur. Bu anahtar yalnız iki iş için okunur: kurtarma koduyla giriş ve yöneticinin bir başkasının ikinci faktörünü sıfırlaması (TASK-0112). Anahtar eksikse panel çalışır, yalnız bu iki işlem açık bir mesajla reddedilir.

## 4. Bağımlılıkları kurun (bir kez, sonra ara sıra)

```powershell
npm install
```

## 5. Güncel sürümü alın (her dilimde)

```powershell
git pull
npm install
```

## 6. Çalıştırın (her seferinde)

```powershell
npm run dev
```

Tarayıcıda `http://localhost:3000` adresini açın. Kapatmak için komut isteminde `Ctrl + C`.

## 7. Örnek veriyle çalışma

Panel örnek veriyle gelir: örnek şantiye, örnek proje, örnek kullanıcılar. Ekranlarda "örnek veri" işareti görürsünüz.

- Arka plandaki işler (olayların işlenmesi, gece çalışan işler) panel açıkken kendiliğinden çalışır. Durumlarını görmek için `npm run jobs:status`; beş kez başarısız olmuş bir işi yeniden çalıştırmak için `npm run jobs:retry -- <kimlik>`.
- Örnek iş verisini temizlemek için: `npm run db:reset:data` — kurduğunuz akışlar, kataloglar ve eşikler **durur**, yalnız örnek şantiye, günlük kayıt, stok ve görevler silinir.
- Yapılandırmayı da fabrika ayarına döndürmek için: `npm run db:reset:config` — önce yapılandırmanızın bir kopyasını `exports/` klasörüne alır, sonra onay için `SIFIRLA` yazmanızı ister.
- Örnek veriyi yeniden yüklemek için: `npm run db:sample`.
- Gerçek veri girildiği gün iki komut da kilitlenecek (`ENVIRONMENTS.md` bölüm 4a).
- Örnek kişiler sıfırlamayla silinir; sizin hesabınız ve gerçek hesaplar hiçbir sıfırlamada silinmez. Yapılandırmayı sıfırladığınızda sahip rolünüz başlangıç verisiyle kendiliğinden geri gelir (D-256).

## 8. Giriş

Kurulumla birlikte size bir sahip hesabı ve parolası iletilir. Hesap Supabase'de açıldıktan sonra panele sahip olarak bağlanır: `npm run iam:bootstrap-owner -- <e-posta>` (TASK-0102). İlk girişte iki adımlı doğrulamayı telefonunuzdaki doğrulama uygulamasıyla kurarsınız (Google Authenticator, Microsoft Authenticator veya benzeri). Kurtarma kodlarınızı bir yere kaydedin (D-236).

## 9. Bir sorun çıkarsa

| Belirti | Ne yapmalı |
|---|---|
| `npm run dev` hata veriyor | `npm install` çalıştırıp tekrar deneyin |
| Sayfa açılmıyor | Komut istemi penceresi açık mı, `Ctrl + C` ile kapanmış olabilir |
| "Bağlantı yok" uyarısı | İnternet bağlantınızı kontrol edin; veritabanı buluttadır |
| Ekran beklediğiniz gibi değil | Ekran görüntüsü alıp bana gönderin; kaydın hangi ekranda olduğunu yazın |

## 10. Telefondan bakmak

Aynı Wi-Fi ağındaysanız, komut isteminde yazan ikinci adresi (`http://192.168...:3000`) telefonunuzdan açabilirsiniz. Saha ekranlarını telefon boyutunda görmek için en pratik yol budur.

## 11. Arama dizinini yeniden kurmak

`npm run search:rebuild`, çalışan işlemciden kayıtların kendi kaynaklarını yeniden okuyup yeni dizin sürümü yayımlamasını ister. Komutun kuyruğa yazması işin tamamlandığı anlamına gelmez; `npm run jobs:status` ile izlenir. Henüz arama kaynağı kaydedilmemişse açıklama verip durur. Her modül `src/records` birleştirme köküne tek kayıt izdüşümünü, sayfalı kaynak tarayıcısını ve gerçek liste adresini ekler.

`npm run search:rebuild -- --check` yalnız arama yardımcılarının tutarlılığını okur; veri değiştirmez. Yeniden kurma sırasında eski sonuçlar okunmaya devam eder. İşlem başarısız olursa eski sürüm korunur; bildirim ve görev aboneleri tekrar oynatılmaz.
