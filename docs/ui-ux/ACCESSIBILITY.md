# Erişilebilirlik Hedefleri

Durum: TASLAK · Son güncelleme: 2026-09-19

Hedef **WCAG 2.2 AA**'dır (REQ-NFR-016, `docs/ui-ux/DESIGN_SYSTEM_RULES.md` §8). Bu belge, hedefin bu panelde ne demek olduğunu ve nasıl sınandığını yazar. Kalite kapısındaki "Accessibility" satırı (`docs/standards/QUALITY_GATES.md`) bu belgeye göre geçer veya kalır. Kararlar: D-225.

## 1. Proje kuralları

| Konu | WCAG | Kural |
|---|---|---|
| Dil | 3.1.1 | Sayfa dili `tr`. Türkçe arayüzde İngilizce kalan erişilebilir ad hatadır. Bilinen tek fark: COSS sidebar'ın "Sidebar" ve "Toggle Sidebar" metinleri (`docs/ui-ux/DESIGN_SYSTEM_RULES.md` §4.1 sonu). Phase 07'de proje katmanında Türkçeleştirilir. |
| Metin kontrastı | 1.4.3 | Normal metin en az 4,5:1, büyük metin en az 3:1; açık ve koyu temanın ikisinde de. Marka mavisi `#0F4C81` beyaz üzerinde 8,86:1, `#EFEFEF` üzerinde 7,7:1. |
| Arayüz ve odak kontrastı | 1.4.11 | Girdi kenarı, seçili durum ve odak halkası komşu renge karşı en az 3:1. **Bulgu:** açık temada COSS'un odak rengi (`--ring`, neutral-400) zemine karşı 2,25:1'dir. Açık temada `--ring` neutral-600 olur (6,8:1). Koyu tema (3,89:1) değişmez (D-225). |
| Renk tek başına anlam taşımaz | 1.4.1 | Her durum rengi yanında metin veya simge vardır: durum rozetleri metinlidir, gün şeridinde renk ve simge birliktedir (SCR-021). |
| Klavye | 2.1.1, 2.4.3 | Her ekran klavyeyle baştan sona kullanılır. Odak sırası görsel sırayla aynıdır. Esc açılan paneli kapatır ve odak, paneli açan öğeye döner (COSS / Base UI davranışı). |
| Görünür odak, örtülmeyen odak | 2.4.7, 2.4.11 | Odaklanan öğe her zaman görünür. Sabit bantlar (üst bar, kaydet çubuğu, telefondaki alt çubuk) odaklanan öğenin üstünü örtmez; odaklanan öğe kaydırılıp görünür alana getirilir. |
| Hedef boyutu | 2.5.8 | **Dokunmatik ekranda en az 44 piksel** (REQ-NFR-008, REQ-SIT-035). **Fareyle kullanılan masaüstünde en az 24 piksel**: listelerin "sık" yoğunluğu 24'ün altına inmez, "ferah" yoğunluk 44'tür. Dokunmatik ekranlı bilgisayar dokunmatik sayılır (`pointer: coarse`) (D-225). |
| Sürüklemeye alternatif | 2.5.7 | Sürükleyerek yapılan her iş tek tıkla da yapılır: menünün sürüklenen kenarı tıklamayla da açılıp kapanır; akış şemasında adım eklemek "+" düğmesiyle, düzenlemek yan panelle yapılır (SCR-196). |
| Durum mesajları | 4.1.3 | Toast'lar ekran okuyucuya okunur (COSS `Toast`). Sayaç ve rozetlerin erişilebilir adı sayıyı söyler ("3 onay bekliyor"). |
| Form hataları | 3.3.1, 3.3.3 | Hata alanın altında metinle yazılır ve alana bağlıdır (`Field`, `FieldError`); gönderimde ilk hatalı alana odaklanılır (`docs/ui-ux/SCREEN_PATTERNS.md` bölüm 3). |
| Tekrar giriş | 3.3.7 | Aynı süreçte bir kez girilen bilgi yeniden istenmez; hazır gelir (ör. kazanılan tekliften proje, REQ-CRM-014). |
| Erişilebilir kimlik doğrulama | 3.3.8 | Parola alanına yapıştırma ve parola yöneticisi serbesttir; doğrulama kodu kutusuna kod yapıştırılabilir. Resimli doğrulama (CAPTCHA) yoktur. |
| Zaman sınırı | 2.2.1 | Oturum süresi dolmadan kullanıcı uyarılır ve süreyi uzatabilir. Girilenler taslakta kalır (REQ-NFR-015). |
| Tutarlı yardım | 3.2.6 | Destek talebi girişi her ekranda aynı yerdedir. |
| Hareket | 2.3.3 (öneri) | İşletim sisteminde "hareketi azalt" açıksa animasyon yapılmaz; bu, logo geçişinde ve partikül figüründe zaten uygulanıyor. |
| Tablolar | 1.3.1 | Başlık hücreleri tablo başlığıdır. Sıralanan sütun, sıralama yönünü ekran okuyucuya bildirir. |

## 2. Sınama (D-225)

Sahip kararıyla sınama **yalnız otomatiktir**. Yapay zekâ ayrıca elle klavye denemesi ve kritik ekranlarda ekran okuyucu denemesi önermişti. Kayıt: otomatik araçlar erişilebilirlik sorunlarının ancak bir kısmını yakalar. Kalan risk, anlamı ancak bir insanın yargılayabileceği sorunlardır: yanlış okunan etiket, anlamsız okuma sırası.

- **Otomatik tarama:** her ekran; açık ve koyu temada; masaüstü ve telefon genişliğinde. Sonuç tarayıcıda çalışan erişilebilirlik tarama aracıyla alınır. İhlal varsa CI geçmez.
- **Otomatik klavye yolu:** REQ-NFR-016'nın "her ekran klavyeyle baştan sona kullanılabilir" kabul ölçütü, uçtan uca testlerde otomatik doğrulanır. Test, ekranda Tab ile baştan sona gezer; her etkileşimli öğeye ulaşıldığını, odağın görünür olduğunu ve birincil eylemin klavyeyle yapılabildiğini denetler.
- **Kontrast testi:** tema renk çiftlerinin (metin–zemin, odak–zemin, girdi kenarı–zemin) oranı birim testle iki temada denetlenir. Bir token değişikliği eşiği bozarsa test kırılır.

Araç seçimi ve CI'a bağlanması Phase 05 (CI/CD hattı) ve Phase 07'nin (test kurulumu) işidir. Bu belge neyin sınanacağını söyler.
