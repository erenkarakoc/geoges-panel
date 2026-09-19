# Gereksinimler

Durum: Phase 01'de dolduruluyor · Son güncelleme: 2026-09-19

## Kaynaklar

- Fonksiyonel kapsam (Özellik Yapısı) ve mimari ilkeler: Phase 01 sonunda depodan kaldırıldı (TASK-0027, 2026-09-19); metinleri Git'te `scope-archive` etiketinde. Kapsamın bölümleri bu dosyanın sonundaki eşleme tablosuyla gereksinimlere bağlıdır; mimari ilkeler `docs/architecture/PRINCIPLES.md`'dedir.
- Phase 00 ve Phase 01 kararları (`ai/DECISIONS.md`)

## Dosya düzeni

Modül başına bir dosya: `REQ-<MODUL>.md` (ör. `REQ-SIT.md`). Modül kodları: `docs/architecture/MODULE_MAP.md`.

## REQ kayıt şablonu

```text
### REQ-SIT-001 — <kısa başlık>

- Kaynak: Özellik Yapısı §9.3
- Modül: SIT
- Öncelik: Must / Should / Could
- Kademe: T1 / T2 / T3
- Katman: Sabit / Akış / Tanım (birden fazlaysa " + " ile)
- Akışla ayarlanan: ... (yalnızca katmanda Akış varsa)
- Tanımla ayarlanan: ... (yalnızca katmanda Tanım varsa)
- Açıklama: ...
- İş kuralları: ...
- Kabul kriterleri:
  - [ ] ...
- Bağlı: FEAT-..., TASK-...
- Durum: DRAFT / CONFIRMED / DEFERRED (DEF-...) / SUPERSEDED
```

### Katman (D-077, D-181)

Her gereksinim hangi katmanda olduğunu söyler; böylece sahip neyin kendi elinde olduğunu okur:

- **Sabit:** kayıtlar, alanlar ve hesaplar. Kodda sabittir; değişmesi kod değişikliği ister (ör. "tahsilat cari bakiyeyi azaltır").
- **Akış:** kim onaylar, kaç kademe, eşik, ne zaman görev ve hatırlatma düşer, kime bildirim gider, ne kilitlenir. Panel bunları **varsayılan akış** olarak getirir; akış tasarımcısında kod yazmadan değişir.
- **Tanım:** katalog değerleri, oranlar, süreler, şablonlar. "Tanımlar" ekranından ayarlanır.

Katmanında Akış veya Tanım olan gereksinim, değiştirilebilen kısmı "Akışla ayarlanan" ve "Tanımla ayarlanan" satırlarında adıyla yazar. Bir süreç adımı gereksinimin açıklamasına sabit bir davranış gibi yazılmaz; varsayılan akış olarak adlandırılır ve modülün kataloğu o akışın ihtiyaç duyduğu olayı ve aksiyonu yayımlar. Kayıt denetimi (`npm run records`) katman satırı olmayan veya ayarlanan kısmı yazılmamış gereksinimi reddeder.

Her gereksinim tek bir doğrulanabilir davranış anlatır. Kararsız noktalar gereksinime gömülmez, `ai/OPEN_QUESTIONS.md`'ye yazılır.

Gereksinim numaraları kayıt denetiminde doğrulanır: bir kayıtta geçen her `REQ-XXX-NNN`, burada `### REQ-XXX-NNN` başlığıyla tanımlı olmalıdır (`npm run records`).

## Yetenek kataloğu şablonu (CHG-006, D-078, TASK-0041)

Her `REQ-<MODUL>.md` dosyası, modülün iş akışı tasarımcısına sunduklarını sonunda bir **Yetenek kataloğu** bölümüyle ilan eder. Tasarımcıdaki her kutu bu kataloglardan gelir; ilan edilen her yetenek Phase 03'te tanımlanacak sözleşme testleriyle koda karşı doğrulanır. Yayımlanmış bir yetenek silinmez, yalnızca eklenir ya da "kullanımdan kalktı" işaretlenir.

```text
## Yetenek kataloğu — <MODUL>

### Olaylar
| Kod | Ad | Ne zaman | Taşıdığı alanlar | Veri sınıfı |

### Aksiyonlar
| Kod | Ad | Girdi | Gereken yetki | İki kez çalışırsa | Yarıda kalırsa |

### Koşul alanları
| Kod | Ad | Tip | Veri sınıfı |
```

- **Olay kodu:** `<entity>.<past_tense_verb>`, küçük harf (NAMING_CONVENTIONS): `daily_site_log.approved`.
- **Aksiyon kodu (öneri, Phase 03'te sözleşme biçimiyle kesinleşir):** `<entity>.<verb>`: `task.open`, `approval.request`.
- **Koşul alanı kodu:** `<entity>.<field>`: `daily_site_log.damaged_unit_count`.
- **Terimler sözlükten gelir** (`docs/domain/GLOSSARY.md`); sözlükte yasaklı alternatif olan bir kelime (ör. `flow`, `waste`) kodda kullanılmaz.
- **Veri sınıfı:** genel · iç · ticari · hassas kişisel. Hassas kişisel alan bildirim metnine konamaz (D-091).
- **Aksiyonlar asla defter kesinleştirmez** (D-080); böyle bir aksiyon katalogda yayımlanamaz.
- "İki kez çalışırsa" ve "yarıda kalırsa" sütunları, aksiyonun tekrarlanan ve kesilen çalıştırmalarda ne yaptığını söyler; motorun güvenilir çalışması buna dayanır.

İlk örnek: `REQ-WFL.md` sonundaki katalog.

## Kapsam eşleme tablosu (TASK-0039, D-075)

Özellik Yapısı (eskiden `docs/sources/functional-scope.md`) Phase 01 sonunda depodan kaldırıldı (TASK-0027, 2026-09-19); metni Git'te `scope-archive` etiketinde okunur. Kayıtlar artık kapsamın bölüm numarasına değil, o bölümü karşılayan gereksinimlere atıf yapar. Bu tablo her bölümün hangi gereksinimlere dağıldığını gösteren kalıcı eşlemedir ve bölüm numarası taşımasına izin verilen tek kayıttır. "Eşleme" sütunu, gereksinimin bölüme doğrudan mı, alt bölümleri üzerinden mi, yoksa üst bölümü üzerinden mi bağlandığını söyler.

Mimari ilkeler belgesine (eskiden `docs/sources/architecture-principles.md`, kaldırıldı) yapılan iki atıf şöyle taşındı: Mimari §6 (iş akışı motoru) → ADR-006; Mimari §13 (merkezi kurallar) → REQ-WFL-032.

| Bölüm | Başlık | Gereksinimler | Eşleme |
|---|---|---|---|
| §1 | Panelin temel çalışma anlayışı | REQ-NFR-001…004 | doğrudan |
| §2 | Kullanıcı, rol, hiyerarşi ve görünürlük sistemi | REQ-AUD-006, REQ-IAM-001, REQ-IAM-003…006, REQ-IAM-008…015, REQ-IAM-018, REQ-IAM-022…024, REQ-IAM-026…027 | alt bölümlerden |
| §2.1 | Dinamik rol yapısı | REQ-IAM-009…010, REQ-IAM-014…015 | doğrudan |
| §2.2 | Bir kişiye birden fazla rol verme | REQ-IAM-013 | doğrudan |
| §2.3 | Vekâleten ve süreli rol | REQ-IAM-018 | doğrudan |
| §2.4 | Sahip katmanı | REQ-AUD-006, REQ-IAM-022…024 | doğrudan |
| §2.5 | Ticari ve hassas bilgilerin ayrılması | REQ-IAM-011…012 | doğrudan |
| §2.6 | Görev ayrılığı | REQ-IAM-026 | doğrudan |
| §2.7 | Rol atandığında otomatik yönlendirme | REQ-IAM-027 | doğrudan |
| §2.8 | Hesap güvenliği ve erişimin kapatılması | REQ-AUD-006, REQ-IAM-001, REQ-IAM-003…006, REQ-IAM-008 | doğrudan |
| §3 | Sahip / Genel Yönetim Cockpit'i | REQ-RPT-001…002 | doğrudan |
| §3.1 | Üst yönetim göstergeleri | REQ-RPT-003…004 | doğrudan |
| §3.2 | Şantiye kartları / şantiye tablosu | REQ-RPT-006 | doğrudan |
| §3.3 | “Dikkat” bölümü | REQ-INV-026, REQ-RPT-002, REQ-RPT-007…009 | doğrudan |
| §3.4 | “Şirketi sistem gözünden gör” ekranı | REQ-RPT-010 | doğrudan |
| §4 | Onay Merkezi ve yönetici müdahalesi | REQ-WFL-012…015 | doğrudan |
| §5 | Talep, iletişim, müşteri ve satış takibi | REQ-CRM-001, REQ-CRM-006 | doğrudan |
| §5.1 | Talep ve iletişim günlüğü | REQ-CRM-001…003, REQ-CRM-005 | doğrudan |
| §5.2 | Cevapsız talep takibi | REQ-CRM-007…008 | doğrudan |
| §5.3 | İşveren / müşteri kartı | REQ-CRM-004, REQ-CRM-009…011 | doğrudan |
| §5.4 | İhale takibi | REQ-CRM-012…013 | doğrudan |
| §6 | Teklif ve maliyet geri besleme modülü | REQ-QTE-001…015, REQ-QTE-018 | alt bölümlerden |
| §6.1 | Teklif kartı | REQ-QTE-001…002 | doğrudan |
| §6.2 | Yaklaşık proje verisinden fiyat oluşturma | REQ-QTE-004 | doğrudan |
| §6.3 | “Bu fiyata işi alırsam ne kazanırım?” hesabı | REQ-QTE-005…006 | doğrudan |
| §6.4 | Hedef marja göre fiyat önerisi | REQ-QTE-007 | doğrudan |
| §6.5 | Çoklu para birimi | REQ-QTE-008 | doğrudan |
| §6.6 | Tekliften projeye geçiş | REQ-QTE-009 | doğrudan |
| §6.7 | Maliyet geri beslemesi | REQ-QTE-005, REQ-QTE-010…011 | doğrudan |
| §6.8 | Teklif belgesi üretimi | REQ-QTE-003, REQ-QTE-012…013 | doğrudan |
| §6.9 | Ürün satışı işleri | REQ-QTE-014…015, REQ-QTE-018 | doğrudan |
| §7 | Proje kartı ve proje yaşam döngüsü | REQ-PRJ-001 | doğrudan |
| §7.1 | Proje kartı | REQ-PRJ-002 | doğrudan |
| §7.2 | Proje aşamaları | REQ-PRJ-003 | doğrudan |
| §7.3 | Proje tedarik/sorumluluk matrisi | REQ-PRJ-004 | doğrudan |
| §7.4 | Teknik ofis takibi | REQ-PRJ-005, REQ-PRJ-009 | doğrudan |
| §7.5 | Proje yapısı: duvarlar | REQ-PRJ-006…008 | doğrudan |
| §8 | İş programı, günlük hedefler ve hızlandırma senaryoları | REQ-INT-011…014, REQ-PRJ-010…011 | alt bölümlerden |
| §8.1 | Üç farklı süre | REQ-PRJ-010 | doğrudan |
| §8.2 | Günlük üretim hedefleri | REQ-PRJ-011 | doğrudan |
| §8.3 | Hızlandırma / süre-maliyet analizi | REQ-INT-011…012 | doğrudan |
| §8.4 | Kalite ve İSG sınırı | REQ-INT-013…014 | doğrudan |
| §9 | Şantiye / saha modülü | REQ-FIN-015, REQ-SIT-001…004, REQ-SIT-006…008, REQ-SIT-030, REQ-SIT-032 | alt bölümlerden |
| §9.1 | Şantiye genel ekranı | REQ-SIT-001 | doğrudan |
| §9.2 | Günlük saha kaydının sorumlusu | REQ-SIT-004 | doğrudan |
| §9.3 | Günlük tek ana kayıt | REQ-SIT-002, REQ-SIT-032 | doğrudan |
| §9.4 | Günlük kaydın ana bölümleri | REQ-FIN-015, REQ-SIT-003, REQ-SIT-030 | doğrudan |
| §9.5 | Akıllı başlangıç bilgileri | REQ-SIT-006 | doğrudan |
| §9.6 | Otomatik taslak kaydı | REQ-SIT-007…008 | doğrudan |
| §10 | Panel döküm takibi | REQ-SIT-014 | doğrudan |
| §10.1 | Panel tipleri | REQ-ADM-002, REQ-SIT-014 | doğrudan |
| §10.2 | Proje hedefleri | REQ-PRJ-007, REQ-SIT-015 | doğrudan |
| §10.3 | Günlük döküm tablosu | REQ-SIT-015 | doğrudan |
| §10.4 | Çift döküm | REQ-SIT-016 | doğrudan |
| §10.5 | Kurum onayı öncesi döküm | REQ-SIT-017 | doğrudan |
| §10.6 | Fazla döküm uyarısı | REQ-RPT-008, REQ-SIT-018 | doğrudan |
| §10.7 | Fazla panelin değerlendirilmesi | REQ-SIT-019 | doğrudan |
| §10.8 | Zayi panel | REQ-SIT-013, REQ-SIT-020 | doğrudan |
| §11 | Montaj, çelik şerit ve işveren teslim-tesellüm takibi | REQ-ADM-003, REQ-SIT-021…025 | alt bölümlerden |
| §11.1 | Panel montajı | REQ-SIT-021 | doğrudan |
| §11.2 | Çelik şerit montajı | REQ-ADM-003, REQ-SIT-022 | doğrudan |
| §11.3 | Harpuşta ve diğer imalatlar | REQ-SIT-023 | doğrudan |
| §11.4 | İşveren teslim-tesellüm saatleri | REQ-SIT-024 | doğrudan |
| §11.5 | İşveren kaynaklı bekleme analizi | REQ-SIT-025 | doğrudan |
| §12 | Puantaj ve faaliyet süresi ayrımı | REQ-SIT-026…027 | alt bölümlerden |
| §12.1 | Bordro puantajı | REQ-SIT-026 | doğrudan |
| §12.2 | Faaliyet saatleri | REQ-SIT-027 | doğrudan |
| §13 | Saha kaydı onay ve düzeltme akışı | REQ-SIT-013, REQ-SIT-031…032, REQ-WFL-015…016 | doğrudan |
| §14 | Şantiye detay ekranı ve “Niye zarardayız?” analizi | REQ-RPT-012…014 | alt bölümlerden |
| §14.1 | Üst göstergeler | REQ-RPT-012 | doğrudan |
| §14.2 | “Niye zarardayız?” tanı kartı | REQ-RPT-013 | doğrudan |
| §14.3 | Son günlük kayıtlar | REQ-RPT-014 | doğrudan |
| §15 | Taşeron ve öz kaynak iş modeli | REQ-SIT-034 | doğrudan |
| §15.1 | Taşeron / götürü işçilik | REQ-FIN-013, REQ-FIN-017 | doğrudan |
| §15.2 | Öz kaynak ekip | REQ-SIT-034 | üst bölüm §15 |
| §15.3 | Aynı panelde karşılaştırma | REQ-PRF-020 | doğrudan |
| §16 | Hakediş modülü | REQ-FIN-001…002, REQ-FIN-004…006, REQ-FIN-008…010 | alt bölümlerden |
| §16.1 | İşveren hakedişi | REQ-FIN-001…002, REQ-FIN-006 | doğrudan |
| §16.2 | Hakediş durum zinciri | REQ-FIN-004…005 | doğrudan |
| §16.3 | Hakediş onayından fatura görevine geçiş | REQ-FIN-008 | doğrudan |
| §16.4 | Taşeron hakedişi | REQ-FIN-009…010 | doğrudan |
| §17 | Fabrika ve üretim modülü | REQ-FAC-001 | doğrudan |
| §17.1 | Fabrika ana görünümü | REQ-FAC-002 | doğrudan |
| §17.2 | Fabrika günlük kaydı | REQ-FAC-003…004 | doğrudan |
| §17.3 | Çelik şerit üretim zinciri | REQ-FAC-006 | doğrudan |
| §17.4 | Lug üretim zinciri | REQ-FAC-007 | doğrudan |
| §17.5 | Fabrika giderleri ve birim maliyet | REQ-FAC-008…009 | doğrudan |
| §17.6 | Teknik iyileştirme işleri | REQ-FAC-010 | doğrudan |
| §18 | Stok, malzeme, satın alma ve sevkiyat modülü | REQ-EQP-005, REQ-INV-001…018, REQ-INV-021…024, REQ-PUR-001…005, REQ-PUR-007…011 | alt bölümlerden |
| §18.1 | Malzeme kataloğu | REQ-INV-001 | doğrudan |
| §18.2 | Tedarikçi yönetimi | REQ-PUR-001…002 | doğrudan |
| §18.3 | Sipariş yönetimi | REQ-PUR-003…005 | doğrudan |
| §18.4 | Lokasyon bazlı stok | REQ-INV-002 | doğrudan |
| §18.5 | Malzeme hareketleri | REQ-INV-003 | doğrudan |
| §18.6 | Fire hesabı | REQ-INV-004 | doğrudan |
| §18.7 | Malzeme çıkış talebi ve yönetim onayı | REQ-INV-005 | doğrudan |
| §18.8 | Şantiyeler arası doğrudan sevkiyat | REQ-INV-006 | doğrudan |
| §18.9 | Kritik stok | REQ-INV-007 | doğrudan |
| §18.10 | Proje sonu artık malzeme | REQ-INV-008 | doğrudan |
| §18.11 | Ağırlık, kantar ve tır bazlı sevkiyat | REQ-INV-009…013, REQ-PUR-004 | doğrudan |
| §18.12 | Fiziki stok sayımı | REQ-INV-014 | doğrudan |
| §18.13 | Açılış stoku | REQ-INV-015 | doğrudan |
| §18.14 | Şerit kombinasyon önerisi | REQ-INV-016 | doğrudan |
| §18.15 | Stok tüketim maliyeti | REQ-INV-017…018, REQ-INV-021…024 | doğrudan |
| §18.16 | Genel satın alma talebi | REQ-EQP-005, REQ-PUR-007…011 | doğrudan |
| §19 | Sarf malzeme reçeteleri | REQ-INV-025…026 | doğrudan |
| §20 | Fire, hurda ve yan gelir takibi | REQ-EQP-017, REQ-EQP-021, REQ-FIN-012, REQ-INV-027 | alt bölümlerden |
| §20.1 | Fire ve tartım belgesi | REQ-INV-027 | doğrudan |
| §20.2 | Yan gelir / dış iş türleri | REQ-FIN-012 | doğrudan |
| §20.3 | Servis aracını mini kâr merkezi olarak izleme | REQ-EQP-021 | doğrudan |
| §20.4 | Atıl kapasiteyi gelire çevirme | REQ-EQP-017 | doğrudan |
| §21 | Ekipman, demirbaş, kalıp ve araç yönetimi | REQ-EQP-001 | doğrudan |
| §21.1 | Envanter kartı | REQ-EQP-001…002, REQ-EQP-007 | doğrudan |
| §21.2 | Lokasyon ve transfer geçmişi | REQ-EQP-006 | doğrudan |
| §21.3 | Günlük amortisman | REQ-EQP-010, REQ-EQP-012 | doğrudan |
| §21.4 | Tamir ve zayi | REQ-EQP-013…014 | doğrudan |
| §21.5 | Bakım ve periyodik kontroller | REQ-EQP-015 | doğrudan |
| §21.6 | Atıl kaynak takibi | REQ-EQP-016 | doğrudan |
| §21.7 | Vinç günlük kaydı ve operatör ekranı | REQ-EQP-004, REQ-EQP-018…020 | doğrudan |
| §21.8 | Araç zimmeti ve devir-teslim | REQ-EQP-007…009, REQ-EQP-015 | doğrudan |
| §22 | Finans ve yönetim muhasebesi | REQ-FIN-020 | doğrudan |
| §22.1 | Finans ana ekranı | REQ-FIN-020 | doğrudan |
| §22.2 | Gelirler | REQ-FIN-011 | doğrudan |
| §22.3 | Giderler | REQ-FIN-013…014, REQ-FIN-016 | doğrudan |
| §22.4 | Proje kâr-zarar | REQ-FIN-017 | doğrudan |
| §22.5 | Çoklu para ve kur takibi | REQ-ADM-007, REQ-ADM-013…015 | doğrudan |
| §22.6 | Cari hesap | REQ-FIN-018…019 | doğrudan |
| §22.7 | Nakit akışı projeksiyonu | REQ-FIN-021, REQ-FIN-023 | doğrudan |
| §22.8 | Fatura, irsaliye, ödeme, avans ve dekont takibi | REQ-FIN-024…025 | doğrudan |
| §22.9 | Resmi muhasebe ile mutabakat | REQ-FIN-026 | doğrudan |
| §22.10 | Dönem (ay) kapanışı | REQ-FIN-027…030 | doğrudan |
| §23 | İnsan Kaynakları, personel ve bordro modülü | REQ-ADM-010…012, REQ-HR-001…006, REQ-HR-008…009, REQ-HR-012, REQ-HR-014…016 | alt bölümlerden |
| §23.1 | Personel kartı | REQ-HR-001…003 | doğrudan |
| §23.2 | Puantaj | REQ-HR-004…005 | doğrudan |
| §23.3 | Bordro | REQ-HR-006, REQ-HR-008…009 | doğrudan |
| §23.4 | İmzalı bordro bağımlılığı | REQ-HR-012 | doğrudan |
| §23.5 | İzin yönetimi | REQ-HR-014 | doğrudan |
| §23.6 | İşe giriş / işten çıkış checklist'i | REQ-HR-015 | doğrudan |
| §23.7 | Zimmet uyarısı | REQ-HR-015 | doğrudan |
| §23.8 | Personel günlük faaliyet raporu | REQ-HR-016 | doğrudan |
| §23.9 | Çalışma takvimi | REQ-ADM-010…012 | doğrudan |
| §24 | Sözleşme, hukuk, yükümlülük ve uyum modülü | REQ-CMP-001 | doğrudan |
| §24.1 | Sözleşme şartları | REQ-CMP-002, REQ-CMP-005, REQ-CMP-010 | doğrudan |
| §24.2 | Yükümlülük kaydı | REQ-CMP-006, REQ-CMP-010 | doğrudan |
| §24.3 | Koşullu tetikleyiciler | REQ-CMP-008 | doğrudan |
| §24.4 | Bağımlılık kilitleri | REQ-CMP-009 | doğrudan |
| §24.5 | İşveren yükümlülükleri | REQ-CMP-007 | doğrudan |
| §24.6 | İşveren gecikme kanıtı | REQ-CMP-012 | doğrudan |
| §24.7 | Teminat, garanti ve resmi belge takibi | REQ-CMP-014, REQ-CMP-016…017 | doğrudan |
| §25 | Görev ve bildirim motoru | REQ-SUP-001…005, REQ-TSK-001…002, REQ-TSK-005…007, REQ-TSK-009…010, REQ-TSK-012…013 | alt bölümlerden |
| §25.1 | Görev kaydı | REQ-TSK-001…002 | doğrudan |
| §25.2 | Otomatik görev kaynakları | REQ-TSK-002, REQ-TSK-005 | doğrudan |
| §25.3 | Eskalasyon | REQ-TSK-006 | doğrudan |
| §25.4 | Görevlerim ekranı | REQ-TSK-007 | doğrudan |
| §25.5 | Bildirim merkezi | REQ-TSK-009…010 | doğrudan |
| §25.6 | Günlük özet | REQ-TSK-012…013 | doğrudan |
| §25.7 | İç destek talepleri | REQ-SUP-001…005 | doğrudan |
| §26 | Akıl katmanı / öneriler ve karar desteği | REQ-INT-001, REQ-INT-006 | doğrudan |
| §26.1 | Öncelikli öneri listesi | REQ-INT-001 | doğrudan |
| §26.2 | Örnek öneriler | REQ-INT-003…004 | doğrudan |
| §27 | Şirket geneli kaynak optimizasyonu | REQ-INT-007 | doğrudan |
| §27.1 | Atıl kaynak ve darboğaz eşleştirmesi | REQ-INT-007 | doğrudan |
| §27.2 | Transfer önerisi | REQ-INT-008 | doğrudan |
| §27.3 | Personel optimizasyonu | REQ-INT-009 | doğrudan |
| §27.4 | Öneri, otomatik emir değil | REQ-INT-004, REQ-INT-008, REQ-INT-010 | doğrudan |
| §28 | Performans, KPI, sıralama ve prim sistemi | REQ-PRF-001 | doğrudan |
| §28.1 | Saha mühendisi / formen / ekip performansı | REQ-PRF-001, REQ-PRF-020 | doğrudan |
| §28.2 | Koordinatör performansı | REQ-PRF-001, REQ-PRF-006 | doğrudan |
| §28.3 | Fabrika performansı | REQ-PRF-001 | doğrudan |
| §28.4 | Teknik ofis performansı | REQ-PRF-001 | doğrudan |
| §28.5 | Satış ve iş geliştirme performansı | REQ-PRF-001 | doğrudan |
| §28.6 | Muhasebe ve İK performansı | REQ-PRF-001 | doğrudan |
| §28.7 | Sağlıklı sıralama ilkesi | REQ-PRF-004…005 | doğrudan |
| §28.8 | Erken veri girişi | REQ-PRF-007 | doğrudan |
| §28.9 | Sıralama görünürlüğü | REQ-PRF-019 | doğrudan |
| §28.10 | Hedefler ve prim | REQ-PRF-014…015, REQ-PRF-017 | doğrudan |
| §28.11 | Başlangıç KPI kataloğu (mevcut KPI kılavuzu v2.0) | REQ-PRF-002, REQ-PRF-008…011, REQ-PRF-013 | doğrudan |
| §29 | Kalite modülü | REQ-QHS-001 | doğrudan |
| §29.1 | Test ve sertifikalar | REQ-QHS-001, REQ-QHS-003 | doğrudan |
| §29.2 | Süre uyarısı | REQ-QHS-002 | doğrudan |
| §29.3 | Saha kalite kontrolleri | REQ-QHS-004 | doğrudan |
| §29.4 | Uygunsuzluk ve DÖF (düzeltici/önleyici faaliyet) | REQ-QHS-005…008 | doğrudan |
| §30 | İSG — İş Sağlığı ve Güvenliği modülü | REQ-QHS-009…016 | alt bölümlerden |
| §30.1 | Ramak kala ve kaza kaydı | REQ-QHS-009…010 | doğrudan |
| §30.2 | Eğitimler | REQ-QHS-012 | doğrudan |
| §30.3 | Günlük İSG kontrolü ve KKD | REQ-QHS-013…015 | doğrudan |
| §30.4 | Güvenliğin hız/kâr hedefinin üzerinde olması | REQ-QHS-011, REQ-QHS-016 | doğrudan |
| §31 | Yasal ve periyodik belge süreleri | REQ-CMP-016 | doğrudan |
| §32 | Toplantı, aksiyon ve karar defteri | REQ-MTG-001 | doğrudan |
| §32.1 | Toplantı kaydı | REQ-MTG-001 | doğrudan |
| §32.2 | Karar kaydı | REQ-MTG-004…005 | doğrudan |
| §32.3 | Karar takibi | REQ-MTG-006…008 | doğrudan |
| §33 | Evrak, dosya ve dijital arşiv | REQ-DOC-001 | doğrudan |
| §33.1 | Belge kaynağına bağlı yaşar | REQ-DOC-001 | doğrudan |
| §33.2 | Tek pencere arşiv | REQ-DOC-002, REQ-DOC-004 | doğrudan |
| §33.3 | Yetkiyi aşmayan arşiv | REQ-DOC-003 | doğrudan |
| §33.4 | Drive'ın yerini alan tek arşiv | REQ-DOC-005…010 | doğrudan |
| §34 | Raporlama ve analitik | REQ-RPT-015 | doğrudan |
| §34.1 | Zaman bazlı raporlar | REQ-RPT-015 | doğrudan |
| §34.2 | Rapor konuları | REQ-RPT-016 | doğrudan |
| §34.3 | Trend ve benchmark | REQ-RPT-018 | doğrudan |
| §34.4 | Dışa aktarım | REQ-RPT-019 | doğrudan |
| §34.5 | Resmi günlük saha raporu | REQ-RPT-020…022 | doğrudan |
| §35 | Yönetim, strateji, büyüme ve yıllık planlama | REQ-STR-001…003, REQ-STR-005, REQ-STR-007…008 | alt bölümlerden |
| §35.1 | Yıllık hedefler | REQ-STR-001 | doğrudan |
| §35.2 | Bütçe vs gerçekleşen | REQ-STR-002…003 | doğrudan |
| §35.3 | Yatırım analizi | REQ-STR-005 | doğrudan |
| §35.4 | What-if / senaryo | REQ-STR-007 | doğrudan |
| §35.5 | Şirket sağlık karnesi | REQ-STR-008 | doğrudan |
| §36 | Tanımlar / sabit veriler yönetimi | REQ-ADM-001 | doğrudan |
| §36.1 | Merkezi tanımlar | REQ-ADM-001…004 | doğrudan |
| §36.2 | Proje özel tanımlar | REQ-ADM-005 | doğrudan |
| §36.3 | Kendini geliştiren ortak listeler | REQ-ADM-006 | doğrudan |
| §36.4 | Geçmişi bozmayan değişiklik | REQ-ADM-007 | doğrudan |
| §36.5 | Sisteme geçiş ve mevcut verilerin aktarılması | REQ-ADM-001 | üst bölüm §36 |
| §37 | Manuel müdahale ve istisna yönetimi | REQ-WFL-031 | doğrudan |
| §37.1 | Onaylı kayıtlar için revizyon talebi | REQ-AUD-007…010, REQ-SIT-033 | doğrudan |
| §38 | Kayıt geçmişi ve denetlenebilirlik | REQ-AUD-001…002, REQ-AUD-004…005, REQ-WFL-016 | doğrudan |
| §39 | Genel uyarı kataloğu | REQ-NFR-005 | doğrudan |
| §40 | Panelin genel arayüz ve kullanım özellikleri | REQ-NFR-006 | doğrudan |
| §40.1 | Sol dikey modül menüsü | REQ-NFR-007 | doğrudan |
| §40.2 | Mobil görünüm | REQ-NFR-008 | doğrudan |
| §40.3 | Üst bar | REQ-NFR-009 | doğrudan |
| §40.4 | Açık / koyu mod | REQ-NFR-010 | doğrudan |
| §40.5 | Kurumsal kimlik | REQ-NFR-011 | doğrudan |
| §41 | Standart liste ekranı özellikleri | REQ-NFR-013 | doğrudan |
| §41.1 | Satır / kart görünümü | REQ-NFR-013 | üst bölüm §41 |
| §41.2 | Sıralama | REQ-NFR-013 | üst bölüm §41 |
| §41.3 | Yoğunluk | REQ-NFR-013 | üst bölüm §41 |
| §41.4 | Gelişmiş filtreler | REQ-NFR-013 | üst bölüm §41 |
| §42 | Standart detay ekranı özellikleri | REQ-NFR-014 | doğrudan |
| §43 | Standart veri giriş formu özellikleri | REQ-NFR-015 | doğrudan |
| §44 | Günlük saha ekranına özel tablo tasarımı | REQ-ADM-004, REQ-SIT-015, REQ-SIT-029, REQ-SIT-035 | doğrudan |
| §45 | Uçtan uca örnek iş akışları | REQ-WFL-011, REQ-WFL-028 | doğrudan |
| §45.1 | Yeni işten tahsilata | REQ-WFL-018 | doğrudan |
| §45.2 | Çelik şeridin siparişten sahada kullanıma kadar akışı | REQ-WFL-011, REQ-WFL-028 | üst bölüm §45 |
| §45.3 | Günlük saha üretimi | REQ-SIT-029…030 | doğrudan |
| §45.4 | Personel çıkışı | REQ-IAM-007, REQ-WFL-029 | doğrudan |
| §45.5 | İşveren gecikmesi | REQ-SIT-025, REQ-WFL-018 | doğrudan |
| §45.6 | Toplantı kararından tamamlanan göreve | REQ-WFL-011, REQ-WFL-028 | üst bölüm §45 |
| §45.7 | Kritik sertifika / İSG olayı | REQ-WFL-011, REQ-WFL-028 | üst bölüm §45 |
| §45.8 | Nakit sıkışması | REQ-WFL-011, REQ-WFL-028 | üst bölüm §45 |
| §46 | Panelin ulaşması gereken nihai yönetim davranışı | REQ-NFR-004 | doğrudan |
