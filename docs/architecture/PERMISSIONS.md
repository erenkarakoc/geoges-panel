# Kimlik, Yetki ve Görünürlük Mimarisi

Durum: CONFIRMED (sahip, 2026-09-20) · Son güncelleme: 2026-09-20

REQ-IAM'in ve yetki matrisinin (`docs/domain/PERMISSION_MATRIX.md`) mimarisi: kim kimdir, bir işlemin yapılıp yapılamayacağına nerede karar verilir, veri nasıl süzülür. Görev: TASK-0060. Kararlar: D-230, D-236.

## 1. Kavramlar

| Kavram | Nedir |
|---|---|
| Kullanıcı | Panele giren kişi (personel veya taşeron ekip başı). Kendi kendine kayıt yok (REQ-IAM-001) |
| Rol | Yetkilerin adlandırılmış kümesi; dinamiktir, sonradan tanımlanır (REQ-IAM-009, REQ-IAM-010) |
| Yetki tipi | Tek bir izin (`sit.daily-site-log.enter`, `fin.payment.approve`). Yönetici ekranından da, akış tasarımcısından da tanımlanır (REQ-IAM-016) |
| Rol ataması | Kullanıcı + rol + **kapsam** (tüm şirket / belirli şantiyeler / belirli projeler) + tarih aralığı (REQ-IAM-012) |
| Vekâlet | Süreli rol ataması; bitince kendiliğinden düşer (REQ-IAM-018, REQ-IAM-019) |
| Kişisel istisna | Sahibin bir kişiye özel açtığı veya kapattığı modül/ekran (REQ-IAM-015) |
| Veri sınıfı | genel · iç · ticari · hassas kişisel (REQ-IAM-011) |

## 2. Etkin yetkinin hesabı

Bir istek geldiğinde kullanıcının **etkin yetkisi** şu sırayla kurulur:

1. Kullanıcının o an geçerli bütün rol atamaları (vekâletler dahil) toplanır. Yetkiler **birleşir**; kişi rol değiştirmek zorunda kalmaz (REQ-IAM-013).
2. Her yetkinin **kapsamı** atamadan gelir; aynı rol iki kişide farklı kapsamda olabilir.
3. Kişisel istisnalar uygulanır: açılan açılır, kapatılan kapanır (REQ-IAM-015).
4. Sahip katmanı her zaman tam görünürlüktedir; hiçbir ayar sahibin görünürlüğünü azaltamaz (REQ-IAM-023).
5. Sonuç bir **yetki anlık görüntüsüdür**: izin kümesi + kapsam kümesi + veri sınıfı izinleri. Oturum boyunca önbelleğe alınır, rol ataması değişince ya da hesap pasifleşince anında geçersizleşir (REQ-IAM-006).

Her yazma işleminin kaydına **hangi rol kapsamında** yapıldığı yazılır; iki rol de izin veriyorsa kişiye bir kez sorulur ve seçimi hatırlanır (REQ-IAM-013).

## 3. Üç katmanda zorlama

Yetki üç yerde kontrol edilir; üçü de zorunludur.

| Katman | Ne yapar | Neden |
|---|---|---|
| Arayüz | Yapılamayacak eylemi hiç göstermez, izinsiz alanı hiç basmaz (`docs/ui-ux/SCREEN_PATTERNS.md`) | Kullanıcıyı yanıltmamak |
| Sunucu | Her komut ve sorgu, çalışmadan önce etkin yetkiyi sorar; karar tek bir yetki servisindedir | Arayüz atlanabilir |
| Veritabanı | Satır düzeyinde güvenlik (RLS): kullanıcının kapsamı dışındaki satır sorguya hiç gelmez | Sunucuda unutulan bir kontrol veri sızdırmasın |

Veri sınıfı süzmesi sunucu katmanındadır: ticari veya hassas alan, izni olmayan için **sorgudan çıkarılır**; boş gösterilmez, gizlenmiş de görünmez (REQ-IAM-011, REQ-SIT-001). Bu, arama, rapor, dışa aktarma ve bildirim için de geçerlidir.

RLS politikalarının tablo tablo yazımı Phase 04'ün işidir; bu belge kuralı koyar: **her tablonun bir sahibi modülü, bir kapsam sütunu ve bir RLS politikası vardır.**

## 4. Hiyerarşi, vekâlet ve onay yedeği

- Bir kişinin amiri, aynı kapsamda bir üst rolü taşıyan kişidir; kişi için elle amir atanırsa o öne geçer (REQ-IAM-014).
- Onay bir kişiye düşerken sıra: etkin vekil → asıl kişi → bekleme süresi geçerse bir üst rol (REQ-IAM-020). Bu çözüm akış motorunda değil, IAM'dedir; motor yalnız "bu adımın sahibi kim" diye sorar (D-097).
- Sahip onayı isteyen işlerde sahiplerden herhangi biri yeterlidir (REQ-IAM-025).
- "Hazırlayan kendi işlemini onaylayamaz" kuralı onay adımının ayarıdır; açıkken motor adım sahibini hesaplarken hazırlayanı eler ve bir üst role gider (REQ-IAM-026).

## 5. Akışların yetkisi

- Çalışan akış **sistem yetkisiyle** hareket eder (D-082): kullanıcı kapsamıyla sınırlı değildir, çünkü akışın kendisi şirket kuralıdır.
- Bunu güvenli kılan tek kural: **akış tasarlama yetkisi yalnız tam görünürlüklü role verilebilir** ve bu kodda zorlanır (D-083, REQ-IAM-017). Kısıtlı görünürlüğü olan bir role bu yetki verilmeye çalışılırsa işlem reddedilir — yönetici ekranında da, akış tasarımcısında da aynı kontrol çalışır.
- Akışın ürettiği görev, bildirim ve kayıt **alıcının** yetkisiyle görünür: akış sistem yetkisiyle üretir, kullanıcı kendi yetkisiyle okur. Bildirim metnine hassas kişisel veri konmaz (REQ-TSK-011).
- Tasarım sırasında yeni yetki tipi ve rol tanımlanabilir ve atanabilir (REQ-IAM-016, D-098, D-101); bunlar yönetici ekranındakiyle **aynı kayda** yazılır, ikinci bir yetki dünyası oluşmaz.

## 6. Giriş, ikinci adım ve oturum

- Giriş e-posta ve parolayladır; hesapları yetkili açar (REQ-IAM-001).
- Parola: en az 8 karakter, karmaşıklık şartıyla; süre dolması yok; sık kullanılan parolalar reddedilir (D-230).
- Hatalı girişte geçici kilit; deneme sayısı ve süre yönetici ayarıdır (REQ-IAM-005). Hangi alanın yanlış olduğu söylenmez.
- İkinci adım TOTP'dir; SMS yoktur (REQ-IAM-003). Hangi rollerde zorunlu olduğu yönetici ayarıdır.
- **Kurtarma (D-236):** kurulumda 10 tek kullanımlık kurtarma kodu verilir **ve** yetkili yönetici bir kişinin ikinci adımını sıfırlayabilir. Sıfırlama denetim kaydına yazılır ve sahibe bildirim gider; sıfırlanan kişi bir sonraki girişinde yeniden kurar. Kurtarma kodları yalnız üretildiği anda gösterilir, panelde saklanmaz (özetleri tutulur).
- Oturum 30 gün sürer, 3 gün hareketsizlikte kapanır; hesap pasife alınırsa oturum anında düşer (D-230, REQ-IAM-006). Süre dolmadan önce uyarı çıkar ve uzatılabilir (`docs/ui-ux/ACCESSIBILITY.md`).
- Ayrılış tarihinde hesap kendiliğinden pasifleşir; bu davranış IAM'in kendisindedir, akışa bağlı değildir (REQ-IAM-007).

## 7. Denetim

Giriş ve çıkışlar, başarısız denemeler, rol atamaları ve bitişleri, vekâletler, kişisel istisnalar, ikinci adım sıfırlamaları ve hesap pasifleştirmeleri denetim kaydına yazılır (REQ-IAM-008). Kayıtlar silinmez (D-231).

## 8. Phase 04 ve Phase 06'ya devredilenler

- Phase 04: her tablonun kapsam sütunu ve RLS politikası; veri sınıfı sütun düzeyinde nasıl işaretlenir; yetki anlık görüntüsünün veritabanında nasıl temsil edildiği.
- Phase 06 denemesi: çok rollü + vekâletli + kapsamlı bir kullanıcı için RLS'in doğru ve yeterince hızlı çalıştığı; yetki değişiminin açık oturumlara ne kadar sürede yansıdığı.
