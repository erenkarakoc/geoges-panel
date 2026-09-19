# ADR-006 — Görsel iş akışı motoru ve tasarımcısı

## Karar
Onay zincirleri, eskalasyonlar, tetikleyiciler ve bağımlılık kilitleri merkezi bir iş akışı motorunda çalışır ve yetkili kullanıcılar tarafından **görsel tasarımcıyla** tanımlanır. Tasarımcı ilk sürüm kapsamındadır.

## Bağlam
Mimari md "iş akışı motoru bütün modüllerin üzerinde olmalı" ve "kurallar merkezi tanımlanmalı" diyor. Sahip süreçleri kendisinin şekillendirebilmesini istiyor.

## Problem
Görsel tasarımcı çekirdeğin parçası olur; serbest bırakılırsa güvenlik, test ve hata ayıklama yönetilemez hale gelir.

## Alternatifler
1. Sınırlı tipli kural modeli (editörsüz)
2. Görsel tasarımcı, sabit düğüm paleti
3. Görsel tasarımcı + özel kod/script düğümü
4. Kodda sabit akışlar

## Seçilen Çözüm
Seçenek 2:
- **Sabit düğüm paleti:** başlangıç/olay, onay, görev, koşul, süre/bekleme, bildirim, eskalasyon, paralel dal, birleşme, alt akış, kilit, bitiş. Özel kod düğümü yoktur.
- Koşullar tipli ve sınırlı ifadelerle yazılır (ör. tutar > eşik, tür = değer, rol = X).
- **Sürümleme:** akış tanımları sürümlüdür; devam eden süreçler başladıkları sürümle tamamlanır.
- **Yayın öncesi test çalıştırması** örnek veriyle zorunludur; yayın yetkisi yalnızca yetkili rollerdedir; yayınlar audit'e yazılır.
- Motor ve tanım modeli önce kurulur; görsel editör aynı tanım modelinin (JSON) üzerine oturur.
- Varsayılan şirket akışları hazır şablon olarak gelir.

## Gerekçe
Sahibin süreçleri kendisi yönetebilmesi sağlanırken, sınırlı palet sayesinde her akış test edilebilir ve güvenli kalır.

## Avantajlar
Kod değişikliği olmadan süreç değişikliği; tüm modüllerde tek onay mantığı.

## Dezavantajlar
Yüksek geliştirme ve test yükü; tüm modüller bu motora bağımlı olur.

## Riskler
RISK-005: motorun gecikmesi tüm slice'ları etkiler. Önlemler: Phase 06 doğrulama spike'ı, Phase 08'de motorun slice'lardan önce tamamlanması.

## Geçiş (Migration) Notları
Tanım modeli JSON şemasıyla sürümlenir; şema değişiklikleri eski tanımları dönüştüren migration ile yapılır.

## Değişiklik (CHG-006, 2026-09-18, sahip onaylı)

Sahip, uçtan uca akışların (REQ-WFL-011, REQ-WFL-028) hazır kodlanmış akışlar yerine kullanıcıların kendi kurabileceği bir altyapı üzerinde kurulmasını istedi. Yedi turluk soru-cevapla (OQ-028) alınan kararlar bu ADR'yi şöyle genişletir. Kararların tamamı ve gerekçeleri: `ai/DECISIONS.md`, CHG-006, D-077…D-105.

**Katmanlar (D-077).** Hesaplar sabittir (defter mantığı, türetilen veri). Süreçler değiştirilebilir (kim onaylar, kaç kademe, eşikler, eskalasyon, kilitler, bildirimler). Kataloglar yönetici ayarıdır.

**Yetenek kataloğu ve sözleşmeler (D-078).** Kontrollü modül sınırı 25 modülde kalır; modül içi parçalar serbestçe incelir. Her modül yeteneklerini (olay, aksiyon, koşul alanı) ilan eder; ilan otomatik sözleşme testleriyle koda karşı doğrulanır ve CI ayrışmada kırılır. İlan edilmiş bir yetenek silinmez veya sessizce değiştirilmez; yalnızca eklenir ya da "kullanımdan kalktı" işaretlenir.

**Palet (ek düğümler).** Başlangıç/olay · onay · görev · koşul · süre/bekleme · bildirim · eskalasyon · paralel dal · birleşme · alt akış · kilit · bitiş, **artı**: kayıt oluştur / durum değiştir (yalnızca taslak ve durum; D-095) ve her biri için (tek seviye; D-096).

**Onay (D-099).** Üç sonuç: onayla, reddet, düzeltmeye geri gönder. Geri giden kenar serbesttir.

**Koşullar (D-100).** Tipli alanlara ek olarak geçmişe bakan serbest sayım/toplam koşulları. Güvenceler: sorgu süre sınırı; yayın öncesi deneme çalıştırması koşulun gerçek veri üzerindeki sonucunu gösterir.

**Tetikleyiciler (D-103).** Olay · saat/takvim (bitime X gün kala dahil) · değer eşiği. Elle başlatma her zaman vardır. E-postayla başlatma ertelendi (DEF-006).

**Adım sahibi (D-097).** Yetki tipiyle, rolle, kayıtla ilişkiyle (kaydı açanın amiri, şantiyenin sorumlusu) veya belirli kişiyle belirlenir.

**Yetki modeli.** Çalışan akış **sistem yetkisiyle** hareket eder (D-082). Bunu güvenli kılan kural: **akış tasarlama yetkisi yalnızca tam görünürlüklü rollere verilebilir ve bu kodda zorlanır** (D-083); dolayısıyla çıktı süzme düzeneği yapılmaz. Geçici yetki kavramı yoktur (D-098). Tasarımcı, tasarım sırasında akış için yeni yetki tipi ve rol tanımlayabilir (D-098) ve bunları kişilere atayabilir; atamalar yönetici ekranındaki atamalarla aynı kayda yazılır (D-101).

**Yayın (D-081).** Akışı kuran kişi canlıya da alır. Her yayında sahibe bildirim gider, yayın audit'e yazılır (kim, ne zaman, hangi sürüm) ve akış ilk 7 gün "yeni" işaretli kalır, eylemleri ayrı listede izlenir.

**Kilit (D-084).** Sahip ve genel müdür aşabilir; gerekçe zorunlu, audit, ilgililere bildirim.

**Editör (D-085).** Adım adım soru-cevap ve kutu-ok şeması birlikte; ikisi de düzenlenebilir, ikisi de aynı tanımı gösterir.

**Şablonlar (D-086).** Varsayılan şirket akışları şablondur; kullanılan akış kopyadır. Şablon güncellemesi kopyayı değiştirmez, "yeni sürüm var" bildirimi çıkar; kopya şablona sıfırlanabilir.

**İzlenebilirlik (D-087, T1).** Her görev ve bildirim, onu üreten akışı, adımı ve kaydı taşır ve oraya bağlantı verir.

**Zincirleme (D-104).** Uçtan uca bir süreç, birbirini tetikleyen kısa akışlardan kurulur; tek uzun akış tanımı kullanılmaz.

**Dış taraf onayı (D-102).** İşveren/kurum onayı yeni düğüm değil, hazır alt akış şablonudur.

**Kapsam dışı — tasarımcının yapamayacakları (D-091):** serbest kod/script yok · doğrudan veritabanı erişimi yok · **defter kaydını kesinleştiren aksiyon katalogda hiç yoktur** (fatura kesme, ödeme işleme, stok hareketi yazma; akış bunun yerine görev açar — D-080) · **akış çalışırken** yetki veya rol veren düğüm yok · dış sisteme veri gönderme yok · hassas kişisel veriyi bildirim metnine koyma yok. Tasarım sırasında yetki tipi/rol tanımlama ve atama bu yasağın dışındadır (D-098, D-101).

**Sıra (D-088).** Motor ve tasarımcı, temel altyapıdan sonra ve modül dilimlerinden önce Phase 08'de kurulur (değişmedi).

## Tarih
2026-09-15 · CHG-006 eki 2026-09-18

## Durum
Kabul edildi (ayrıntılı tasarım Phase 03) · CHG-006 ile genişletildi (2026-09-18)
