# Yetki Matrisi — Varsayılan Rol Şablonları

Durum: CONFIRMED (sahip, 2026-09-19) · Son güncelleme: 2026-09-19

Bu tablo panelin **ilk kurulumda gelen** rol şablonlarını gösterir. Roller dinamiktir: sahip yeni rol tanımlar, yetkileri değiştirir ve kişiye özel istisna verir (REQ-IAM-009, REQ-IAM-010, REQ-IAM-015). Rol bir kişiye **kapsamla** verilir: tüm şirket, belirli şantiyeler veya projeler (REQ-IAM-012). Ticari ve hassas kişisel veriyi görme izni modül modül verilir (REQ-IAM-011). Sahip her şeyi görür ve görünürlüğü kısıtlanamaz (REQ-IAM-023). Akış tasarlama yalnızca tam görünürlüklü rollere verilebilir (REQ-IAM-017, REQ-WFL-019). Kararlar: D-111, D-115, D-214, D-215.

## Rol şablonları

| Kısaltma | Rol | Varsayılan kapsam |
|---|---|---|
| SAH | Sahip | Tüm şirket (kısıtlanamaz) |
| GM | Genel Müdür (Genel Müdür Yardımcısı aynı şablondan) | Tüm şirket |
| GK | Genel Koordinatör | Tüm şirket |
| KO | Koordinatör (Şantiyeler Koordinatörü) | Atandığı şantiyeler |
| SM | Saha Mühendisi | Atandığı şantiye |
| FO | Formen | Atandığı şantiye |
| TEB | Taşeron Ekip Başı | Kendi ekibi ve şantiyesi |
| VO | Vinç Operatörü | Atandığı vinçler |
| TO | Teknik Ofis | Tüm şirket |
| SAT | Satış / İş Geliştirme | Tüm şirket |
| MUH | Muhasebe | Tüm şirket |
| IK | İnsan Kaynakları | Tüm şirket |
| SAL | Satın Alma & Lojistik | Tüm şirket |
| FAB | Fabrika Sorumlusu | Fabrika |
| KIS | Kalite & İSG Sorumlusu | Tüm şirket |

İşçi, bekçi ve temizlik görevlisinin varsayılan olarak panel hesabı yoktur; amirleri onların kaydını ve puanını girer (REQ-PRF-003).

## Gösterim

- **Y** — görür, veri girer ve işlem yapar
- **G** — görür
- **K** — yalnızca kendisiyle ilgili olanı (kendi görevi, izni, talebi, puanı, kendi ekibi)
- **—** — erişimi yok
- **t** ekli hücre — o modülde **ticari** veriyi de görür (fiyat, maliyet, marj, kâr-zarar, cari)
- **h** ekli hücre — o modülde **hassas kişisel** veriyi de görür (maaş, IBAN, SGK, prim tutarı)

Her hücre rol kapsamıyla sınırlıdır: kapsamı bir şantiye olan rol, o modülde yalnızca o şantiyenin verisini görür.

## Matris

| Modül | SAH | GM | GK | KO | SM | FO | TEB | VO | TO | SAT | MUH | IK | SAL | FAB | KIS |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Bugün, görevler, bildirimler (RPT, TSK) | Y | Y | Y | Y | Y | Y | K | K | Y | Y | Y | Y | Y | Y | Y |
| Onay Merkezi (WFL) | Y | Y | Y | Y | K | K | K | K | K | K | K | K | K | K | K |
| Akış tasarımı (WFL) | Y | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| Kullanıcılar & Roller (IAM) | Y | G | — | — | — | — | — | — | — | — | — | G | — | — | — |
| Denetim Kayıtları (AUD) | Y | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| Tanımlar (ADM) | Y | Y | G | G | G | — | — | — | Y | G | Y | Y | G | G | G |
| Projeler (PRJ) | Yt | Yt | Yt | Gt | G | G | K | — | Yt | Gt | Gt | — | G | — | G |
| Şantiye ve günlük kayıt (SIT) | Gt | Gt | Gt | Yt | Y | Y | K | — | G | — | Gt | G | G | — | G |
| Stok (INV) | Gt | Gt | Gt | Gt | Y | K | — | — | G | G | Gt | — | Yt | Y | G |
| Satın Alma (PUR) | Yt | Yt | Gt | K | K | K | — | — | — | — | Gt | — | Yt | K | — |
| Fabrika (FAC) | Gt | Gt | G | — | — | — | — | — | G | G | Gt | G | G | Y | G |
| Ekipman (EQP) | Gt | Gt | Gt | Gt | Y | K | — | K | — | — | Gt | G | Yt | Y | G |
| Finans (FIN) | Yt | Yt | Gt | Yt | K | K | K | K | — | Gt | Yt | — | Gt | K | — |
| İK (HR) | Yh | Gh | G | G | K | K | — | K | K | K | Gh | Yh | K | K | G |
| Talepler & Müşteriler (CRM) | Gt | Gt | G | K | — | — | — | — | Y | Yt | Gt | — | — | — | — |
| Teklif (QTE) | Yt | Yt | Gt | — | — | — | — | — | Yt | Yt | Gt | — | G | G | — |
| Uyum (CMP) | Yt | Yt | Gt | Gt | G | — | — | — | G | Gt | Yt | G | Gt | — | G |
| Kalite & İSG (QHS) | G | G | G | Y | Y | Y | K | K | G | — | — | G | G | Y | Y |
| Toplantı & Karar (MTG) | Y | Y | Y | Y | K | K | K | K | K | K | K | K | K | K | K |
| Arşiv (DOC) | G | G | G | G | G | G | K | K | G | G | G | G | G | G | G |
| Destek (SUP) | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y |
| Performans (PRF) | Yh | Yh | G | Y | Y | Y | — | K | K | K | Gh | Gh | K | Y | K |
| Öneriler (INT) | Gt | Gt | Gt | Gt | K | — | — | — | G | G | Gt | — | G | G | G |
| Strateji (STR) | Yt | Yt | — | — | — | — | — | — | — | — | Gt | — | — | — | — |
| Sistem gözü (RPT-011) | G | G | — | — | — | — | — | — | — | — | — | — | — | — | — |

Veri aktarımı (MIG) ertelendiği için (DEF-001) matriste yoktur.

## Satırlara ilişkin notlar

- **Arşiv:** tek pencere arşiv yetkiyi aşmaz; her rol yalnızca görebildiği kayıtların belgelerini görür (REQ-DOC-003). Tablodaki "G" bunu ifade eder.
- **Onay Merkezi:** "K", kişinin önüne düşen onaylar demektir; hangi onayın kime düşeceği akışla ayarlanır (REQ-WFL-017).
- **Finans:** koordinatör kendi şantiyelerinin kâr-zararını, gelir-giderini ve taşeron birim fiyatlarını görür (D-215); saha rolleri yalnızca kendi girdikleri saha harcamasını, taşeron ekip başı kendi hakedişini görür.
- **İK:** Genel Müdür hassas personel verisini görür (D-215); muhasebe bordro ödemesi için tutar ve IBAN'ı görür; kalite & İSG eğitim kayıtlarını görür, hassas veriyi görmez (REQ-IAM-011).
- **Teklif:** teknik ofis fiyat, tahmini maliyet ve marjı görür (D-215).
- **Satın alma:** satın alma & lojistik sorumlusu sipariş fiyatlarını, tedarikçi tekliflerini ve tedarikçi carisini görür; proje kâr-zararını, işveren carisini ve nakit durumunu görmez (D-215).
- **Performans:** amirler bağlı personelin puanını girer ve görür; herkes kendi puanını görür; prim tutarı hassas veridir (REQ-PRF-016); kritik puan yalnızca kişiye, amirlerine ve İK'ya görünür (REQ-PRF-013).
- **Akış tasarımı:** varsayılan olarak yalnızca sahip; sahip bu yetkiyi yalnızca tam görünürlüklü bir role verebilir (REQ-WFL-019).
