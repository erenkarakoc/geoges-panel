# Ekran Durumları

Durum: CONFIRMED (sahip, 2026-09-19) · Son güncelleme: 2026-09-19

Her ekranın ilk açılış, yükleniyor, başarılı, boş, kısmi, hata, yetki yok, tekrar dene ve geri dönülmez işlem onayı durumları (`docs/ui-ux/DESIGN_SYSTEM_RULES.md` §6). Ortak davranış kalıplarda tanımlıdır ve **her ekrana kendiliğinden uygulanır** (`docs/ui-ux/SCREEN_PATTERNS.md`): liste için bölüm 1, detay için bölüm 2, form için bölüm 3. Bu tablo yalnızca ekrana özgü olanı yazar: boş durumun metni ve eylemi, ekranın özel durumları. Günlük saha kaydının durumları kendi belgesindedir (`docs/ui-ux/screens/SCR-021-daily-site-log.md`).

Kapsam: envanterdeki etkin ekranlar. SCR-021 bu tabloda yoktur, durumları kendi belgesinin 5. bölümündedir. Veri aktarımı (SCR-194) ertelendiği, kayıt türleri (SCR-198) pilot sonrasına kaldığı için tabloda yoktur. Görev: TASK-0051 · Kararlar: D-221.

## Her ekran için ortak kurallar

- **Yükleniyor:** içeriğin yerinde iskelet (`Skeleton`); gezinme ve araç çubuğu kullanılabilir. Yükleme 10 saniyeyi geçerse "Beklenenden uzun sürüyor" ve "Tekrar dene".
- **Hata:** kısa, Türkçe, ne yapılacağını söyleyen toast; ekranda "Tekrar dene". Teknik hata kodu kullanıcıya gösterilmez, destek talebine eklenir.
- **Kısmi:** yüklenebilen bölümler gösterilir; yüklenemeyen bölümde "Bu bölüm yüklenemedi" ve "Tekrar dene".
- **Yetki yok:** menüde görünmeyen ekrana adresle gelinirse "Bu ekranı görme yetkiniz yok" ve "Bugün"e dönüş. Görme yetkisi olmayan bir **kayda** bağlantıyla gelinirse "Bu kaydı görme yetkiniz yok" ve listeye dönüş görünür (D-221). Arama sonuçlarında, listelerde, sayılarda ve toplu indirmede yetkisiz kayıt hiç görünmez (REQ-DOC-003).
- **Bağlantı yok (D-221):** üstte "Bağlantı yok" uyarısı; okunmuş ekran okunabilir kalır, kaydetme ve gönderme bağlantı gelince yapılır. Uzun formlarda girilenler bu sırada cihazda taslak olarak korunur ki kaybolmasın (REQ-NFR-015, REQ-SIT-007); bu çevrimdışı çalışma değildir, çevrimdışı kayıt ve gönderim ertelenmiştir (DEF-002).
- **Geri dönülmez işlem onayı** (`AlertDialog`): iptal etme, geri çekme, onaya gönderme sonrası kilit, dönem kapatma, ödeme yapıldı işaretleme, bordro kesinleştirme. Silme işlemi panelde yoktur (REQ-AUD-002).
- **Başarılı:** toast; kayıt açıkken durum rozeti güncellenir.

## Ekranlara özgü durumlar

| Ekran | Boş durum (metin → eylem) | Özel durumlar |
|---|---|---|
| SCR-001 Giriş | — | Hatalı giriş: tek genel mesaj, hangi alanın yanlış olduğu söylenmez (REQ-IAM-001); geçici kilit: kalan süre (REQ-IAM-005); hesap pasif: yalnız doğru paroladan sonra "Hesabınız kapalı" (D-221) |
| SCR-002 İki adımlı doğrulama | — | Yanlış kod; süresi geçmiş kod; kurulum gerektiren ilk giriş (karekod) |
| SCR-003 Parola sıfırlama | — | Bağlantı gönderildi (e-posta var olsun olmasın aynı mesaj); süresi dolmuş bağlantı |
| SCR-004 Rol yönlendirmesi | — | Birden fazla yeni rol: her rol için ayrı adım |
| SCR-005 Hesabım | — | Etkin vekâlet varsa bitiş tarihiyle gösterilir |
| SCR-010 Bugün | İş yok: "Bugün temiz — bekleyen işiniz yok" | Örnek veri işareti (pilot, D-216); "Dikkat" öğesi varsa en üstte |
| SCR-011 Sistem gözü | Veri yetersiz: "Bu aralık için yeterli kayıt yok" | Zaman aralığı değişince yeniden hesaplanıyor |
| SCR-012 Onaylar | "Bugün temiz — onay bekleyen kayıt yok" | Kayıt başkası tarafından karara bağlandıysa: "Bu kayıt karara bağlandı" ve sıradakine geçiş; vekil olarak onay (REQ-IAM-020) |
| SCR-013 Görevler | "Açık göreviniz yok" → "Görev ver" | Geciken görevler en üstte ve vurgulu |
| SCR-014 Görev ver | — | Kapsam dışı kişi seçilemez (REQ-TSK-003) |
| SCR-015 Bildirimler | "Bildirim yok." | Telefon bildirimi reddedilmişse bir kez bilgi notu |
| SCR-016 Arama | "Sonuç bulunamadı" | Yetkisiz kayıtlar sonuçta hiç görünmez; son açılanlar boş aramada |
| SCR-017 Raporlar | "Görebileceğiniz rapor yok" | Kayıtlı görünüm yoksa hazır raporlar |
| SCR-020 Günlük saha kayıtları | "Bu şantiye için kayıt yok" → "Bugünün kaydını başlat" | Eksik günler ayrı işaretli; tatil günleri eksik sayılmaz |
| SCR-022 Projeler | "Henüz proje yok" → "Yeni proje" | Taslak projeler (kazanılan tekliften) ayrı rozetle |
| SCR-023 Proje detayı | — | Ceza riski varsa başlıkta uyarı; kapanış aşamasında artık malzeme kararı bekleniyor (REQ-INV-008) |
| SCR-024 Proje revizyonu | — | Onay bekleyen revizyon varken yeni revizyon açılmaz; revizyonlar arası fark görünümü |
| SCR-025 Tedarik matrisi | Tanımlı kalem yoksa Tanımlar'a bağlantı | Değişiklik geçerlilik tarihinden sonrasını etkiler uyarısı |
| SCR-026 Şantiyeler | "Aktif şantiye yok" | Uzun süre veri girilmeyen şantiye vurgulu |
| SCR-027 Şantiye detayı | — | Zarardayken "Niye zarardayız?" en üstte (REQ-RPT-013) |
| SCR-028 Öneriler | "Şu an öneri yok" | Gerekçeyle kapatılmış öneriler ayrı filtrede |
| SCR-029 Kaynak eşleştirme | "Atıl kaynak veya darboğaz bulunmadı" | Kaynak şantiyenin yakın ihtiyacı uyarısı |
| SCR-030 Hızlandırma senaryoları | "Henüz senaryo yok" → "Senaryo oluştur" | "Önerilmez" senaryo seçilemez ve nedeni görünür |
| SCR-031 Günlük raporlar | "Onaylanmış günlük kayıt yok" | İşverene gönderildi/gönderilmedi işareti |
| SCR-040 Stok özeti | "Stok hareketi yok" → "Açılış stoku gir" | Eksi stok ve kritik stok vurgulu; "kur bekliyor" maliyetler |
| SCR-041 Malzeme detayı | — | "Maliyet bulunamadı" hareketleri işaretli; geçici maliyet rozeti |
| SCR-042 Malzeme çıkış talebi | — | Onayda, sevkiyatta, teslim alındı adımları |
| SCR-043 Sevkiyat ve tır | — | Tolerans dışı kantar farkı: açıklama girilmeden kapanmaz |
| SCR-044 Stok sayımı | — | Tolerans dışı fark kritik uyarı; onay bekleyen sayım stoğu değiştirmez uyarısı |
| SCR-045 Açılış stoku | — | Onaylandıktan sonra kilitli |
| SCR-046 Şerit kombinasyonu | "Stok bu ihtiyacı karşılamıyor" → talep/sipariş önerisi | Eşit fireli kombinasyonlardan az parçalı önde |
| SCR-047 Sarf | "Bu dönemde sarf kaydı yok" | Olağan dışı tüketim vurgulu |
| SCR-048 Fire ve hurda | "Fire kaydı yok" | Tartım belgesi eksik fire hurdaya ayrılamaz |
| SCR-050 Tedarikçiler | "Tedarikçi yok" → "Yeni tedarikçi" | Aynı firma zaten varsa benzer kayıt önerisi |
| SCR-051 Siparişler | "Sipariş yok" → "Yeni sipariş" | Geciken siparişler vurgulu |
| SCR-052 Sipariş detayı | — | Toleransı aşan fazla teslim onay bekliyor; kısmi teslim ilerlemesi |
| SCR-053 Karşılaştırma | "Karşılaştırılacak teklif yok" → "Teklif ekle" | — |
| SCR-054 Satın alma talebi | — | Onaysız talep için alım açılamaz |
| SCR-060 Varlıklar | "Kayıtlı varlık yok" → "Yeni varlık" | Kontrolü geçmiş ve uzun süre atıl varlıklar vurgulu |
| SCR-061 Varlık kartı | — | Zayi edilmiş varlık pasif rozetli, salt okunur |
| SCR-062 Devir-teslim | — | Karşı tarafın onayı bekleniyor; hesabı yoksa kâğıt tutanak fotoğrafı |
| SCR-063 Vinç operatör ekranı | "Size atanmış vinç yok" | Yakıt fişi fotoğrafı olmadan gönderilemez; sayaç geri gidemez |
| SCR-064 Periyodik kontroller | "Yaklaşan kontrol yok" | Geçmiş kontroller en üstte |
| SCR-070 Fabrika ana görünümü | "Bugün fabrika kaydı yok" → "Kaydı başlat" | Geçici birim maliyet rozeti |
| SCR-071 Fabrika günlük kaydı | — | SCR-021 ile aynı gönderim ve onay durumları |
| SCR-072 Üretim zincirleri | "İzlenen parti yok" | Adım başına fire |
| SCR-073 Birim maliyet dökümü | "Bu ay hesap yok" | Ay kapanmadan "geçici" |
| SCR-074 Teknik iyileştirme | "Kayıtlı iş yok" → "Yeni iş" | — |
| SCR-080 Talepler | "Talep yok" → "Hızlı kayıt" | Cevapsız talepler vurgulu |
| SCR-081 Hızlı kayıt | — | Benzer firma önerisi |
| SCR-082 Talep detayı | — | Kaybedildi: kayıp nedeni zorunlu |
| SCR-083 Firma kartı ve karne | Karne için veri yok: "Henüz geçmiş iş yok" | Ticari rakamlar izinsiz kullanıcıya hiç basılmaz |
| SCR-084 İhaleler | "Takipte ihale yok" → "Yeni ihale" | Son tarihi yaklaşan ve kaçırılan ayrı |
| SCR-090 Teklifler | "Teklif yok" → "Yeni teklif" | Geçerliliği biten gönderilmiş teklif vurgulu |
| SCR-091 Teklif hazırlama | — | Gönderilmiş sürüm salt okunur, "Yeni sürüm"; hedef marjın altında uyarısı; tahmini maliyet verisi yoksa elle giriş |
| SCR-092 Teklif belgesi | — | Belge üretiliyor; üretilemedi → tekrar dene |
| SCR-093 Maliyet geri beslemesi | "İş henüz tamamlanmadı" | Eşiği aşan sapmada açıklama isteniyor |
| SCR-094 Satış siparişleri | "Satış siparişi yok" | Stok ayrılamadı (yetersiz) uyarısı |
| SCR-100 Finans ana ekranı | "Henüz finans hareketi yok" | Nakit açığı beklenen hafta uyarısı; "kur bekliyor" |
| SCR-101 Hakedişler | "Hakediş yok" → "Hakediş hazırla" | Tahsilatı geciken hakediş vurgulu |
| SCR-102 Hakediş hazırlama | — | Öneri değiştirildiyse gerekçe zorunlu; devreden miktar satırı; durum atlanamaz |
| SCR-103 Taşeron hakedişi | — | Geçerli taşeron sözleşmesi yoksa hazırlanamaz |
| SCR-104 Gelir ve gider | "Kayıt yok" → "Yeni gider" / "Yeni gelir" | Olası tekrar gider eşleştirme önerisi; onay bekleyen harcama ayrı |
| SCR-105 Proje kâr-zararı | "Henüz hareket yok" | Hesaplanamayan etken "hesaplanamadı" (REQ-RPT-013) |
| SCR-106 Cari kartı | "Hareket yok" | Kur farkı ayrı satır |
| SCR-107 Nakit projeksiyonu | "Planlı kalem yok" → "Planlı kalem ekle" | Açık beklenen hafta vurgulu ve kalemlerine açılır |
| SCR-108 Fatura ve ödemeler | "Bekleyen ödeme yok" | Onaysız ödeme "ödendi" yapılamaz; faturası gelmemiş teslimler |
| SCR-109 Muhasebe aktarımı | "Bu ay aktarılacak kayıt yok" | Mutabakat farkı açık kalem |
| SCR-110 Dönem kapanışı | "Kapatılacak dönem yok" | Engelleyici kalemler bağlantılı liste; yeniden açma gerekçe ister; gecikmiş kapanış |
| SCR-111 Strateji | "Bu yıl için hedef veya bütçe yok" → "Bütçe oluştur" | Endeksi eksik ay "endeks yok" |
| SCR-120 Personel | "Personel yok" → "Yeni personel" | Ayrılmış personel ayrı filtre |
| SCR-121 Personel kartı | — | Hassas alanlar izinsiz kullanıcıya hiç basılmaz; kalan zimmet/avans uyarısı |
| SCR-122 Puantaj | "Bu ay puantaj yok" | Aynı gün iki yerde çalışmış görünme uyarısı; onaysız günlük kayıtlar ayrı |
| SCR-123 Bordro | — | Yeni yıl parametresi eksik uyarısı; IBAN'ı eksik personel listesi; imzalı bordro şartı |
| SCR-124 İzinler | "İzin talebi yok" → "İzin talep et" | Bakiyeyi aşan talep uyarısı; rapor izninde tarih zorunlu |
| SCR-125 Giriş ve çıkış listeleri | "Açık liste yok" | Ayrılış tarihi geçmiş ama liste açık: kritik |
| SCR-126 Günlük faaliyet raporu | "Bugünün raporu girilmedi" → "Rapor gir" | — |
| SCR-130 Sözleşmeler | "Sözleşme yok" → "Yeni sözleşme" | Süresi biten çerçeve anlaşma |
| SCR-131 Yükümlülükler | "Açık yükümlülük yok" | Geciken ve kilit oluşturanlar vurgulu |
| SCR-132 Gecikme dosyası | "Kayıtlı işveren gecikmesi yok" | Yazı taslağı üretiliyor; gönderildi işareti |
| SCR-133 Teminatlar | "Teminat yok" | Süresi yaklaşan mektup |
| SCR-134 Süreli belgeler | "Yaklaşan veya geçmiş belge yok" | Geçmişler en üstte |
| SCR-135 Uyuşmazlık | "Uyuşmazlık dosyası yok" | — |
| SCR-140 Test ve sertifikalar | "Sertifika yok" → "Sertifika ekle" | "Kaldı" ve kararı girilmemiş parti vurgulu |
| SCR-141 Kalite kontrolü | — | "Uygun değil" sonucundan uygunsuzluk açma |
| SCR-142 Uygunsuzluk ve DÖF | "Açık uygunsuzluk yok" | Süreyi aşan ve tekrar eden vurgulu; kök neden ve aksiyon olmadan kapanmaz |
| SCR-143 İSG olayları | "Kayıtlı olay yok" → "Olay bildir" | Ciddi kaza vurgulu |
| SCR-144 Eğitimler | "Eğitim kaydı yok" | Zorunlu eğitimi eksik personel |
| SCR-145 Günlük İSG kontrolü | "Bugünün kontrolü yapılmadı" → "Kontrole başla" | "Uygun değil" açıklamasız kaydedilmez |
| SCR-146 Risk değerlendirmeleri | "Risk değerlendirmesi yok" | Geçerli değerlendirmesi olmayan aktif şantiye |
| SCR-147 KKD teslimi | — | Onay bekleyen teslim |
| SCR-150 Puanım | "Bu ay için puan henüz hesaplanmadı" | Güvenlik şartı nedeniyle geçersiz hedef ve nedeni; kritik puan yalnız kişiye ve amirlere |
| SCR-151 Ekibin puanlaması | "Puanlanacak kişi yok" | Gerekçesiz puan kaydedilmez; ay kesinleşince kilitli |
| SCR-152 Primler | "Bu ay prim yok" | Onaysız prim ödenemez |
| SCR-153 Sıralama | "Sıralama kapalı" (sahip politikası) | Alt sıralar isimle gösterilmez |
| SCR-160 Toplantılar | "Toplantı yok" → "Yeni toplantı" | — |
| SCR-161 Toplantı kaydı | — | Kaydedilince kilitli; önceki açık kararlar gündemde |
| SCR-162 Kararlar | "Açık karar yok" | Geciken kararlar vurgulu |
| SCR-170 Arşiv | "Sonuç bulunamadı" | Metin tanıması süren belge "okunuyor" |
| SCR-180 Destek talepleri | "Destek talebi yok" → "Talep aç" | Cevapsız talep vurgulu |
| SCR-195 İş akışları | "Henüz akış yok" → "Şablondan başla" | Şablonun yeni sürümü: "yeni sürüm var"; ilk 7 gün "yeni" rozeti |
| SCR-196 Akış tasarımcısı | Yeni akış: tek başlangıç kutusu ve "Ne olunca başlasın?" sorusu | Hatalı adım kutuda işaretli; deneme sonrası değişiklik varsa yayın yeniden deneme ister; yürüyen örnekler eski sürümle sürer |
| SCR-197 Çalışma günlüğü | "Bu süzgeçle akış örneği yok" | Hata ile duran örnek en üstte, nedeniyle |
| SCR-190 Tanımlar | Boş katalog: "Bu listede kalem yok" → "Kalem ekle" | Kullanılan kalem silinmez, pasifleşir; benzer kalem önerisi |
| SCR-191 Kullanıcılar & Roller | — | Tam görünürlüğü olmayan role akış tasarlama verilemez; sahip görünürlüğü kısıtlanamaz |
| SCR-192 Revizyon talepleri (Onaylar sekmesi) | "Bekleyen revizyon talebi yok" | Eski ve yeni değer yan yana |
| SCR-193 Denetim kayıtları | "Bu süzgeçle kayıt yok" | Salt okunur, düzenleme yok |
