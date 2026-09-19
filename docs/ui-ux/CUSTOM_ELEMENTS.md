# Özel Arayüz Öğeleri

Durum: TASLAK · Son güncelleme: 2026-09-19

Arayüz yalnız COSS UI ve Tailwind ile yapılır; COSS'ta karşılığı olmayan her öğe sahibin onayıyla yapılır (ADR-009, `docs/ui-ux/DESIGN_SYSTEM_RULES.md` §1). Bu liste, Phase 02 ekran tasarımlarının gerektirdiği özel öğelerin tamamıdır (Phase 02 teslimi). Yeni bir özel öğe ancak bu listeye sahip onayıyla eklenir.

| # | Öğe | Nerede | Neden COSS yetmiyor | Onay | Durum |
|---|---|---|---|---|---|
| 1 | Partikül figürü (`ParticleField`) | Giriş ekranları | COSS'ta dekoratif canvas yok | D-047 | Yapıldı (M0) |
| 2 | Grafikler: sütun ve çizgi | **Her yerde** (D-226): Raporlar (SCR-017), finans ana ekranı ve nakit projeksiyonu (SCR-100, SCR-107), "Bugün" göstergeleri ve Sistem gözü (SCR-010, SCR-011), strateji (SCR-111), şantiye ve proje detayları | COSS'ta grafik bileşeni yok | D-066, D-226 | Yapılacak; kütüphane kullanılıp kullanılmayacağı Phase 03'te |
| 3 | Akış şeması alanı | Akış tasarımcısı (SCR-196) | COSS'ta kutu-ok şeması yok | D-224 | Yapılacak (Phase 08) |

**Grafik kuralları (D-226, `docs/ui-ux/ACCESSIBILITY.md`).**
- Her grafiğin rakamları erişilebilir biçimde de vardır: yanında tablo veya ekran okuyucuya okunan özet (WCAG 1.1.1).
- Seriler yalnız renkle ayrılmaz; etiket veya işaret de taşır (WCAG 1.4.1).
- Seri renkleri zemine karşı en az 3:1'dir (WCAG 1.4.11).
- Renkler tema token'larından gelir, iki temada da çalışır.
- Rakamlar `Figure` kuralıyla yazılır (D-067).
- Bir göstergeye veya çubuğa tıklanınca dökümüne inilir (REQ-RPT-002).
- Kullanıcının göremediği veri grafikte de yoktur.

**Özel öğe sayılmayanlar.** Bunlar COSS bileşenlerinin birleşimi veya tarayıcının kendi öğesidir. Sapmaları `docs/ui-ux/DESIGN_SYSTEM_RULES.md` §4.1'de kayıtlıdır:
- günlük saha kaydının gün şeridi (`ScrollArea` + `Button`);
- onay kuyruğu;
- telefondaki alt çubuk;
- fotoğraf girişi (tarayıcının kamera açan dosya girişi);
- teklif belgesi önizlemesi (tarayıcının kendi PDF görüntüleyicisi).
