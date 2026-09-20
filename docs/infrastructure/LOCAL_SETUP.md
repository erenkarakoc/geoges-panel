# Paneli Kendi Bilgisayarınızda Çalıştırma

Durum: TASLAK · Son güncelleme: 2026-09-20

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

- Veriyi başlangıç hâline döndürmek için: `npm run db:reset`
- Bu komut **bütün örnek veriyi siler ve yeniden kurar**. Gerçek veri girildiği gün komut kilitlenecek (`ENVIRONMENTS.md` bölüm 2).

## 8. Giriş

Kurulumla birlikte size bir sahip hesabı ve parolası iletilir. İlk girişte iki adımlı doğrulamayı telefonunuzdaki doğrulama uygulamasıyla kurarsınız (Google Authenticator, Microsoft Authenticator veya benzeri). Kurtarma kodlarınızı bir yere kaydedin (D-236).

## 9. Bir sorun çıkarsa

| Belirti | Ne yapmalı |
|---|---|
| `npm run dev` hata veriyor | `npm install` çalıştırıp tekrar deneyin |
| Sayfa açılmıyor | Komut istemi penceresi açık mı, `Ctrl + C` ile kapanmış olabilir |
| "Bağlantı yok" uyarısı | İnternet bağlantınızı kontrol edin; veritabanı buluttadır |
| Ekran beklediğiniz gibi değil | Ekran görüntüsü alıp bana gönderin; kaydın hangi ekranda olduğunu yazın |

## 10. Telefondan bakmak

Aynı Wi-Fi ağındaysanız, komut isteminde yazan ikinci adresi (`http://192.168...:3000`) telefonunuzdan açabilirsiniz. Saha ekranlarını telefon boyutunda görmek için en pratik yol budur.
