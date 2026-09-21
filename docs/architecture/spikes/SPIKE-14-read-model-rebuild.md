# SPIKE-14 — Okuma modelinin sıfırdan yeniden kurulması

Durum: GEÇTİ · Tarih: 2026-09-21 · Görev: TASK-0093 · Bağlı: D-233, D-234, D-210, ADR-014, REQ-NFR-002

**Soru.** Rapor modelleri bir yıllık olaydan sıfırdan yeniden kurulabiliyor mu? Geçme ölçütü üç parçadır: sonuç kaynak kayıtlarla birebir, süre kabul edilebilir, yeniden kurma bildirim ve görev üretmez.

**Süre tavanı.** "Kabul edilebilir süre" için kayıtlarda tek somut tavan felaket sonrası kurtarmadır: `docs/infrastructure/BACKUP_AND_RECOVERY.md` bölüm 5 adım 1, okuma modellerinin yeniden kurulup kaynakla karşılaştırılmasını zorunlu sayar ve toplam kesinti 4 saati aşamaz (RTO, D-210). Ölçüt bu tavana bağlandı; ayrıca daha sıkı bir eşik uydurulmadı.

## Yöntem

Deney kodu geçicidir, ürüne girmedi. Yalnız `spike` şemasında `s14_` tabloları kuruldu (`s14-setup.mjs`, `s14-run.mjs`).

- **Kaynak:** 80 şantiye × 365 gün = 29.200 günlük saha kaydı ve 467.004 stok hareketi.
- **Olaylar:** `outbox` içinde zamana göre sıralı **500.000 olay**, bir yıla yayılı. Günlük kayıtların %6'sı geri çekilip farklı rakamla yeniden onaylandı, %1'i geri çekilip bırakıldı. 1 Temmuz'dan önce v1, sonra atık alanı eklenmiş v2 yük kullanıldı (yük yalnız genişler, `EVENT_BACKBONE.md` bölüm 5).
- **Aboneler:** iki yeniden oynatılabilir okuma modeli abonesi (günlük katkı, stok katkısı) ve bir **yeniden oynatılamayan** bildirim abonesi. Canlı dönemde bildirim abonesi her onay için bir bildirim üretmişti (30.952 bildirim).
- **Okuma modeli:** kaynak kayıt başına sürümlü satırlar ve bunlardan toplanan şantiye/ay özeti ile şantiye/malzeme bakiyesi (`rpt.site_summary` benzeri). Satırlar kaynak kaydın kimliğini ve kapsamını taşır (`SCHEMA-ANALYTICS.md`). Bir satır yalnız **daha yeni** bir olayla güncellenir; eski veya tekrar teslim edilen olay ezmez.
- **Canlı okuma:** geçerli sürümü gösteren görünüm; yeniden kurma gölge sürüme yazar, sonra tek bir güncellemeyle atomik geçiş yapılır.
- Tam kurma, sonradan gelen olayların yakalanması ve tekrar teslim **aynı uygulama fonksiyonunu** kullanır; tek kod yolu vardır.

## Sonuçlar — 21/21 kontrol geçti

| # | Kontrol | Sonuç |
|---|---|---|
| K1 | Yalnız yeniden oynatılabilir aboneler çalıştı | günlük ve stok katkısı; bildirim abonesi atlandı |
| K2 | Şantiye/ay özeti kaynak kayıtlarla birebir | **0 fark** (960 satır) |
| K3 | Stok bakiyesi kaynak defterle birebir | **0 fark** |
| K4 | Yeniden kurma yeni bildirim üretmedi | 30.952 → 30.952, en büyük kimlik aynı |
| K5 | Bildirim işleyicisi hiç çağrılmadı, teslim kaydı değişmedi | 0 çağrı |
| K6 | v1 yüklerin atığı "bilinmiyor" sayıldı, sıfır sayılmadı | 480 satırda bilinmeyen atık adedi ayrı tutuldu |
| K7 | Olumsuz kontrol: işleyici çağrılsaydı yoklama bunu görürdü | çağrı görüldü, bildirim yine de çiftlenmedi (geri alındı) |
| K8 | Bozulan canlı özet tespit edildi ve denetime yazıldı | 1 fark; kaynak 252,00, okuma modeli 259,00 |
| K9 | Gölge sürüm kaynakla birebir | 0 fark |
| K10 | Yeniden kurma boyunca canlı okuma hep eski tam sürümü gördü | 40 okuma, tek bir değer |
| K11 | Geçişten sonra yeni sürüm göründü, bozulma düzeldi | toplam tam 7 azaldı |
| K12 | İlk 100.000 olayın tekrar teslimi hiçbir satırı değiştirmedi | parmak izleri aynı |
| K13 | Yeniden onaylanan kaydın **eski** onay olayı yeni değeri ezmedi | 0 satır |
| K14 | Tekrar teslim sonrası hâlâ kaynakla birebir | 0 fark |
| K15 | Yeniden kurmadan sonra gelen 325 olay işlendi, sonuç birebir | 588 ms, 0 fark |
| K16 | Kullanıcı yalnız kendi 10 şantiyesini görür | 130 satır, şantiye 1–10 |
| K17 | Kapsamı olmayan kullanıcı ve kimliksiz çağrı hiçbir satır görmez | 0 / 0 |
| K18 | Kullanıcı rolü yeniden kurma fonksiyonunu çalıştıramaz, okuma modeline yazamaz, sürüm değiştiremez | üçü de 42501 |
| K19 | Parça süreleri düz: doğrusal ölçekleme | 50.000'lik 10 parça 1,3–2,0 sn; en yavaş, medyanın 1,1 katı |
| K20 | Bir yıllık kurma + karşılaştırma RTO altında | 21,3 sn, RTO'nun **%0,15'i** |
| K21 | Beş yıllık (7,5 milyon olay) doğrusal tahmin de RTO altında | ~4,8 dakika |

## Süreler

| Ölçüm | Değer |
|---|---:|
| Sıfırdan kurma (500.000 olay), ilk | 19.255 ms (uygulama 17.345 + özet 1.910) |
| Sıfırdan kurma, ikinci (gölge sürüm) | 16.936 ms |
| Kaynakla karşılaştırma | 2.089 ms |
| Sonradan gelen 325 olayın yakalanması | 588 ms |
| Doğrusal tahmin, 1,5 milyon olay | ~58 sn |
| Doğrusal tahmin, 7,5 milyon olay (beş yıl) | ~4,8 dk |

Ölçüm, Free Plan'ın 500 MB RAM'li paylaşımlı örneğinde ve `work_mem` 2 MB ile yapıldı; üretim sunucusunda daha yavaş olması beklenmez.

## Sınırlar ve düzeltmeler

1. **Hacim bir varsayımdır.** Kayıtlarda yıllık olay hacmi yok. İlk deneme 1,5 milyon olayla (D-212 üst sınırı 150 kullanıcı × ~30 olay/gün × ~300 gün) yapıldı ve test projesinin diski doldu (`53100`); işlem tamamen geri alındı, örnek sağlıklı kaldı. Koşu 500.000 olayla yapıldı. Parça süreleri düz olduğu için doğrusal tahmin savunulabilir, ama 1,5 milyon ve 7,5 milyon **ölçülmedi, tahmindir.**
2. **Fikstür tabloları UNLOGGED'dı.** Kaynak ve `outbox` yüklemesi WAL üretmesin diye loglanmadı. Ölçülen okuma modeli tabloları normal (loglu) kaldı; süre ölçümü üretimi temsil eder.
3. **Görev üreten abone ayrıca modellenmedi.** Yeniden oynatılamayan abone olarak bildirim üreten abone kullanıldı. Görev üreten abone aynı mekanizmadır (`replayable = false`), ayrı sınanmadı.
4. **Toplu (küme tabanlı) yeniden oynatma** kullanıldı: parça içinde kayıt başına son olay alınır. Olayları uygulama katmanında tek tek işleyen bir yol sınanmadı; o yol çok daha yavaş olur ve önerilmez.
5. **Disk koruması.** Koşu sonundaki `DISK_GUARD` hatası, bütün kontroller geçtikten sonra devreye giren kendi korumamdı (veritabanı + WAL 1.666 MB). Kanıt dosyası 21/21 kontrolü içerir.

## Karar ve Phase 07/08'e taşınanlar

Okuma modeli yaklaşımı (D-233) ve yeniden oynatma kuralı (D-234) doğrulandı. Ürün uygulamasında korunacaklar:

1. Okuma modeli satırları kaynak kayıt başına tutulur ve yalnız daha yeni olayla güncellenir; tekrar teslim ve sıra dışı olay bu kuralla zararsızdır.
2. Yeniden kurma gölge sürüme yazılır, kaynakla karşılaştırılır, sonra tek güncellemeyle geçiş yapılır; kullanıcı yarım model görmez.
3. Orkestratör yalnız `replayable = true` abonelerin işleyicilerini çağırır; bu, bildirim/görev yoklamasıyla otomatik testte korunur.
4. Eksik alan (eski yük sürümü) sıfır sayılmaz, "bilinmiyor" olarak taşınır (REQ-RPT-013).
5. Karşılaştırma farkı denetime yazar (D-233, REQ-NFR-002).

Kanıt: dış scratchpad'de `s14-setup-*.json` ve `s14-run-1789985815006.json`. Fikstür, sahibin onayıyla 2026-09-21'de `spike` şemasının tamamıyla birlikte silindi (Free Plan 500 MB sınırı); betiklerle yeniden üretilebilir.
