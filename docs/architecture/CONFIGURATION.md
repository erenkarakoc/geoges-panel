# Kural, Katalog ve Özel Alan Mimarisi

Durum: CONFIRMED (sahip, 2026-09-20) · Son güncelleme: 2026-09-20

Panelin "ayarlanabilir" yanının mimarisi: kataloglar, tarihli kurallar, özel alanlar ve özellik anahtarları. Üç katman kuralı (Sabit / Akış / Tanım, D-077) her gereksinimin başında yazılıdır; burası Tanım katmanının nasıl çalıştığını belirler. Görev: TASK-0061. Kararlar: D-237.

## 1. Üç tür ayar

| Tür | Örnek | Nerede yönetilir |
|---|---|---|
| **Katalog** | Panel tipi, şerit tipi, gider kategorisi, birim, sarf malzemesi | Yönetim > Tanımlar (SCR-190) |
| **Tarihli kural** | Kritik stok eşiği, onay tutar eşiği, sarf reçetesi, birim fiyat, bordro parametresi, KPI ağırlığı, geç giriş saati | Yönetim > Tanımlar; her biri geçerlilik tarihli |
| **Özellik anahtarı** | Bir dilimin açılıp kapanması | Mühendislik ayarı; yönetim ekranında görünmez |

Akış ayarları (kim onaylar, kaç kademe, eskalasyon süresi) bu belgenin değil, akış motorunun konusudur (`docs/architecture/WORKFLOW_ENGINE.md`).

## 2. Katalog kalemi

- Her kalem: kod, ad, durum (etkin/pasif), isteğe bağlı proje kapsamı (REQ-ADM-005), oluşturan ve tarih.
- **Silinmez.** Kullanılan kalem pasifleşir; geçmiş kayıtlar kalemin kimliğini taşımaya devam eder.
- **Benzer kalem önerisi** (REQ-ADM-006): yeni kalem girilirken benzerleri gösterilir; kullanıcı yine de ekleyebilir, yetkili sonradan birleştirir. Birleştirme eski kalemi pasifleştirir ve **yönlendirme** bırakır: geçmiş kayıtlar eski kimliği tutar, ekranlarda yeni ad görünür, `catalog_item.merged` olayı yayımlanır.
- **Projeye özel tanım** genel tanımdan önce gelir (REQ-ADM-005); çözümleme sırası: proje → şirket.

## 3. Tarihli kural (REQ-ADM-007, REQ-ADM-008, REQ-WFL-032)

Bir kural satırı: kural anahtarı + kapsam (şirket / proje / şantiye / birim) + **geçerlilik başlangıcı** + değer + kim, ne zaman, neden.

- Kural **hiç güncellenmez**; yeni geçerlilik satırı eklenir. Geçmiş, olduğu gibi kalır.
- Bir hesabın kullandığı kural, hesabın **olay tarihine** göre seçilir: 12 Mart'ta girilen bir kayıt, 12 Mart'ta geçerli kuralı kullanır. Kural bugün değişse bile Mart hakedişi bozulmaz (REQ-ADM-007).
- Geriye dönük tarihli kural, yalnız **onaylanmamış** işlemleri etkiler; onaylanmış kayıtlara ve kapanmış dönemlere dokunmaz (REQ-ADM-008). Onaylı kaydın etkilenmesi gerekiyorsa yol revizyon talebidir (REQ-AUD-007).
- Onaylanan her kayıt, kullandığı **kural sürümünü ve kur değerini** kendi içinde saklar (REQ-ADM-015). Böylece "bu rakam neden böyle" sorusu yıllar sonra da cevaplanır; yeniden hesap yapılmaz, kayıt okunur.
- "Hangi kural hangi tarihte neydi" ekrandan görülebilir (REQ-WFL-032).

**Kur** (REQ-ADM-013…015) bu modelin özel bir hâlidir: her iş günü TCMB alış kuru yazılır, elle giriş gerekçeyle ayrı satırdır, alınamazsa `exchange_rate.missing` olayı çıkar ve kura bağlı tutarlar "kur bekliyor" olarak işaretlenir.

**Takvim** (REQ-ADM-010…012) da tarihli kuraldır: şirket takvimi, birim veya şantiye takvimi onu geçersiz kılar; puantaj, fazla mesai, son tarihler, geç giriş ve takvime bağlı akış tetikleyicileri buradan okur.

## 4. Özel alanlar (REQ-ADM-009, D-237)

- Özel alan **belirlenmiş kayıt türlerine** eklenir. İlk sürümde bunlar: proje, şantiye, firma (işveren/tedarikçi/taşeron), personel, varlık, malzeme, sözleşme, teklif, talep. Günlük saha kaydı, hakediş, bordro, stok hareketi ve dönem kapanışı gibi **defter ve onay zinciri taşıyan kayıtlar özel alan almaz**: bu kayıtların içeriği gereksinimle sabittir, serbest alan hesabı ve denetimi bulanıklaştırır.
- Tip: metin, sayı, tarih, seçim, evet/hayır. Her alanın **veri sınıfı** tanımlanırken seçilir (genel/iç/ticari/hassas); görünürlük normal yetki kuralına girer.
- Özel alan tanımlandığında kayıt türünün **koşul alanı kataloğuna** kendiliğinden eklenir; akışlar okuyabilir, ama aksiyon üretmez.
- Özel alanlar aramaya, listelere, raporlara ve dışa aktarmaya girer; **hesaplara girmez** (maliyet, hakediş, bordro, puan). Bir sayıyı hesaba katmak gerekiyorsa o gereksinimdir, özel alan değil.
- Alan kaldırıldığında geçmiş değerler silinmez, gizlenir (REQ-WFL-038 ile aynı ilke).

## 5. Özellik anahtarları

- Ortam başına açılır/kapanır; amacı yarım kalmış bir dilimi canlıda gizli tutmaktır.
- Yönetim ekranında görünmez, iş kuralı değildir. Bir davranış kalıcı olarak ayarlanabilir olacaksa özellik anahtarı değil, tarihli kural olur.
- Anahtarla kapalı bir modül menüde görünmez; adresine gelinirse "Bu ekranı görme yetkiniz yok" değil, "Bu bölüm henüz açık değil" der.

## 6. Kuralların okunması

- Kurallar tek servisten okunur: `getRule(anahtar, kapsam, tarih)`. Hiçbir modül eşik değerini kendi koduna yazmaz.
- Okuma önbelleğe alınır; yeni geçerlilik satırı yazıldığında önbellek geçersizleşir.
- Kural bulunamazsa hesap **sessizce varsayılana düşmez**: eksik kural bir uyarıdır, ilgili kayıt "hesaplanamadı" olarak işaretlenir (REQ-RPT-013 ile aynı ilke).

## 7. Phase 04 ve Phase 06'ya devredilenler

- Phase 04: katalog, kural geçerlilik ve özel alan tablolarının şeması; özel alan değerlerinin saklanma biçimi (kullanıcı tanımlı kayıt türleriyle aynı kararın parçasıdır, TASK-0063).
- Phase 06 denemesi: tarihli kural çözümlemesinin hakediş ve bordro hesabında doğru sürümü seçtiği; geçmişe dönük kural girişinin kapanmış dönemi bozmadığı.
