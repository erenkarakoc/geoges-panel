# Terim Sözlüğü (Glossary)

Durum: KESİNLEŞTİ — bütün terimler sahip tarafından onaylandı (OQ-007, 2026-09-19); yeni terim eklenirken PROPOSED başlar ve modülün onayıyla kesinleşir · Son güncelleme: 2026-09-19

Kod, veritabanı, API ve event isimlerinde yalnızca **Canonical English Term** kullanılır. Durum sütunu: `PROPOSED` (önerildi), `CONFIRMED` (kesinleşti), `OPEN` (tartışmalı).

| Türkçe terim | Canonical English Term | Tanım | İzinli alternatif | Yasak alternatif | Durum | Not |
|---|---|---|---|---|---|---|
| Sahip | Owner | Şirket sahibi; hiçbir rol tarafından kısıtlanamayan en üst görünürlük | — | admin, boss | CONFIRMED | Sistem yöneticisi rolünden ayrıdır |
| Rol | Role | Yetki ve sorumluluk seti | — | position (farklı kavram) | CONFIRMED | |
| Vekâlet | Role Delegation | Belirli süreli rol ataması | — | proxy, deputy | CONFIRMED | |
| Kullanıcı | User | Panele giriş yapan hesap | — | account, member | CONFIRMED | Personelden (Employee) ayrıdır; taşeron ekip başı da kullanıcıdır |
| Yetki | Permission | Bir rolün taşıdığı tek bir izin (ör. `wfl.approval.view`) | Yetki tipi (UI) | right, privilege | CONFIRMED | Roller yetkilerin bir araya gelmesidir (D-098) |
| Rol ataması | Role Assignment | Bir rolün bir kişiye bir kapsamla verilmesi | — | user_role | CONFIRMED | D-111 |
| Kapsam | Scope | Rol atamasının geçerli olduğu alan: tüm şirket, şantiyeler veya projeler | — | area, region | CONFIRMED | D-111 |
| Veri sınıfı | Data Class | Verinin gizlilik sınıfı: genel, iç, ticari, hassas kişisel | — | sensitivity_level | CONFIRMED | Görme izni modül bazında (D-115) |
| Tam görünürlük | Full Visibility | Tüm modüllerde tüm veri sınıflarını tüm kapsamlarda görebilmek | — | superuser, admin | CONFIRMED | Akış tasarlama yetkisinin şartı (D-083) |
| Görev ayrılığı | Separation of Duties | Hazırlayanın kendi işlemini onaylayamaması kuralı | — | four_eyes | CONFIRMED | REQ-IAM-026 |
| İşlem yapılan rol | Acting Role | Çoklu rolü olan kullanıcının işlemi yaptığı rol | — | current_role | CONFIRMED | |
| Firma | Party | Şirketin iş yaptığı her firma/kurum için tek kayıt; rolleri olur (işveren, müşteri, tedarikçi…) | — | company, firm, organization | CONFIRMED | D-027; aynı firma için ikinci kart açılmaz |
| İşveren | Client | Bizi uygulama işine alan firma/idare; Party rolü `client` | Employer (sözleşme metinlerinde) | company | CONFIRMED | D-027; FIDIC "Employer" kullanır |
| Müşteri (ürün satışı) | Customer | Ürün satışı yaptığımız firma; Party rolü `customer` | — | client (uygulama işi için ayrılmış) | CONFIRMED | D-027; işverenle aynı firma olabilir |
| Kurum / İdare | Authority | Projeyi onaylayan kamu kurumu | — | institution | CONFIRMED | |
| Proje | Project | Sözleşmeli iş; 1..N şantiye | — | job | CONFIRMED | |
| Şantiye | Site | Projenin fiziksel uygulama yeri | — | construction_site, workplace | CONFIRMED | Arayüzde modül ve menü adı "Şantiye" (D-026) |
| Proje revizyonu | Project Revision | Onaylanınca geçerli olan, hedefleri taşıyan proje sürümü (ör. Rev.2) | — | version, drawing_rev | CONFIRMED | D-136 |
| Proje aşaması | Project Stage | Projenin yaşam döngüsündeki yeri | — | phase, status | CONFIRMED | REQ-PRJ-003 |
| Teknik ofis işi | Technical Office Item | Teknik ofisin proje altında izlenen işi | — | tech_task | CONFIRMED | REQ-PRJ-005, REQ-PRJ-009 |
| Sözleşme süresi | Contract Duration | İşverene karşı resmî süre | — | deadline | CONFIRMED | REQ-PRJ-010 |
| Teorik süre | Theoretical Duration | Mevcut kaynaklarla beklenen süre | — | estimate | CONFIRMED | REQ-PRJ-010 |
| Yönetim hedef süresi | Management Target Duration | Yönetimin koyduğu iç hedef süre | — | goal | CONFIRMED | REQ-PRJ-010 |
| Günlük hedef | Daily Target | Şantiyenin bir günlük üretim hedefi | — | quota | CONFIRMED | D-137 |
| Duvar | Wall | Proje içindeki duvar birimi | — | structure | CONFIRMED | |
| Toprakarme | Reinforced Earth (MSE wall) | Çelik şerit donatılı zemin duvarı | mechanically stabilized earth | — | CONFIRMED | Kodda `mse` kısaltması kullanılmaz |
| Katalog kalemi | Catalog Item | Ortak listelerdeki tek bir tanım (gider kategorisi, malzeme…) | — | lookup, option | CONFIRMED | D-139 |
| Şerit tipi | Strip Type | Genişlik, kalınlık, delik sayısı ve standart boylarıyla tanımlı çelik şerit türü | — | strip_model | CONFIRMED | REQ-ADM-003, REQ-SIT-022 |
| Özel alan | Custom Field | Belirlenmiş kayıt türlerine eklenen tipli alan | — | extra_field, meta | CONFIRMED | ADR-005 |
| Çalışma takvimi | Working Calendar | Çalışma saatleri, tatiller ve fazla mesai kuralları | — | schedule, shift_plan | CONFIRMED | REQ-ADM-010…012 |
| Panel tipi | Panel Type | C4, C5… gibi tanımlı panel ölçüsü | — | panel_model | CONFIRMED | |
| Kademe (panel sırası) | Panel Course | Panelin duvarda alttan üste yer aldığı sıra/yükseklik (1. kademe, 2. kademe…) | — | level, grade, rank | CONFIRMED | D-031 |
| Panel dökümü | Panel Casting | Sahada panelin kalıpta dökülmesi | — | pouring, production | CONFIRMED | |
| Döküm seansı | Casting Session | Aynı gün içindeki ayrı döküm | — | batch | CONFIRMED | Çift döküm = birden fazla session |
| Priz | Curing | Betonun sertleşme süreci | — | — | CONFIRMED | |
| Montaj | Panel Installation | Panelin duvara yerleştirilmesi | erection | assembly, mounting | CONFIRMED | |
| Çelik şerit | Steel Strip | Galvaniz kaplı donatı şeridi | reinforcing strip | band, belt | CONFIRMED | |
| Şerit montajı | Strip Installation | Şeritlerin serilip lug'a bağlanması | — | strip_laying | CONFIRMED | |
| Lug | Tie Strip Lug | Panele gömülen, şeridin bağlandığı bağlantı elemanı; tek standart tip, adetle izlenir | lug | — | CONFIRMED | D-032 |
| Harpuşta | Coping | Duvar üst başlığı | — | cap | CONFIRMED | |
| Dolgu | Backfill | İşverenin serip sıkıştırdığı dolgu | — | fill_material | CONFIRMED | |
| Teslim-tesellüm | Handover | Alanın işverene/işverenden teslimi | — | delivery | CONFIRMED | `handover_to_client`, `handover_from_client` |
| İşveren bekleme süresi | Client Wait Time | Dolguya teslim ile geri alınma arasında işveren kaynaklı geçen süre | — | delay, idle_time | CONFIRMED | REQ-SIT-025 |
| Saha harcaması | Site Expense | Şantiyede yapılan, belgeyle girilen harcama | — | cost, spending | CONFIRMED | REQ-FIN-015, REQ-SIT-003, REQ-SIT-030 |
| Geç giriş | Late Entry | Giriş süresi geçtikten sonra girilen günlük kayıt | — | overdue_log | CONFIRMED | D-122 |
| Günlük saha kaydı | Daily Site Log | Şantiyenin günlük ana kaydı | — | daily_report (resmi rapor ayrıdır) | CONFIRMED | |
| Resmi günlük rapor | Official Daily Report | Onaylı kayıttan üretilen PDF rapor | — | — | CONFIRMED | |
| Puantaj | Timesheet | Bordro amaçlı çalışma günü/saat kaydı | attendance | — | CONFIRMED | |
| Faaliyet süresi | Activity Time Entry | Performans amaçlı iş başlangıç-bitiş kaydı | — | work_hours | CONFIRMED | Puantajdan ayrıdır |
| Taşeron | Subcontractor | Götürü işçilik yapan ekip | — | contractor | CONFIRMED | |
| Götürü işçilik | Subcontracted Labor | Taşeron ekibe verilen işçilik işi | — | unit_rate_labor | CONFIRMED | D-030; ödeme yöntemi ayrı alandır |
| Taşeron ödeme yöntemi | Subcontractor Payment Method | `unit_rate` (onaylı miktar × birim fiyat), `lump_sum` (sabit toplam bedel), `day_rate` (gün / kişi-gün) | — | payment_type | CONFIRMED | D-030 |
| Öz kaynak | In-House Crew | Şirket bordrolu ekip | self-performed | own_resource | CONFIRMED | |
| İş modeli (şantiye) | Labor Model | `subcontracted` / `in_house` | — | work_model | CONFIRMED | |
| Hakediş (işveren) | Client Progress Payment | Dönemsel yapılan iş bedeli talebi | interim payment certificate | invoice | CONFIRMED | |
| Taşeron hakedişi | Subcontractor Progress Payment | Taşerona onaylı üretim üzerinden ödeme hesabı | — | — | CONFIRMED | |
| Metraj | Quantity | Ölçülen/hesaplanan iş miktarı | quantity take-off (teklif aşaması) | measurement | CONFIRMED | |
| İcmal | Summary Sheet | Özet tablo | — | recap | CONFIRMED | |
| Birim fiyat | Unit Price | Birim başına fiyat | — | rate | CONFIRMED | |
| Kesinti | Deduction | Hakedişten düşülen tutar | — | cut | CONFIRMED | |
| Stopaj | Withholding Tax | — | — | — | CONFIRMED | |
| Teminat | Guarantee | Sözleşme teminatı; türü `letter_of_guarantee`, `retention`, `cash_guarantee` | performance guarantee | deposit | CONFIRMED | D-029; üç tür de takip edilir |
| Teminat mektubu | Letter of Guarantee | Bankadan alınan teminat mektubu; tutar, süre, iade takibi | — | bank_letter | CONFIRMED | D-029 |
| Teminat kesintisi | Retention | Hakedişten teminat olarak kesilen tutar; iş sonunda iade | — | deduction (genel kesinti ayrıdır) | CONFIRMED | D-029 |
| Nakit teminat | Cash Guarantee | İş başında yatırılan nakit teminat | — | cash_deposit | CONFIRMED | D-029 |
| Teklif | Quote | Fiyat teklifi | — | offer, proposal, bid | CONFIRMED | |
| İhale | Tender | — | — | auction | CONFIRMED | |
| Talep (satış) | Lead | Gelen iş talebi/fırsat | — | request, opportunity | CONFIRMED | |
| Satış siparişi | Sales Order | Ürün satışı siparişi | — | — | CONFIRMED | |
| Sözleşme | Contract | — | — | agreement | CONFIRMED | |
| Yükümlülük | Obligation | Sözleşmeden doğan iş/tarih | — | duty, requirement | CONFIRMED | |
| Tedarik matrisi | Supply Responsibility Matrix | Kim neyi karşılıyor | — | — | CONFIRMED | |
| Tedarikçi | Supplier | Tedarikçi rolü taşıyan firma | — | vendor | CONFIRMED | D-027 |
| Satın alma siparişi | Purchase Order | Tedarikçiye verilen sipariş | — | po_order | CONFIRMED | REQ-PUR-003…005 |
| Satın alma talebi | Purchase Request | Katalog içi veya dışı alım için iç talep | — | requisition | CONFIRMED | REQ-EQP-005, REQ-PUR-007…011 |
| Tedarikçi teklifi | Supplier Quote | Bir tedarikçinin fiyat, termin ve koşul teklifi | — | offer | CONFIRMED | REQ-EQP-005, REQ-PUR-007…011 |
| Fazla teslim | Over-Delivery | Siparişten fazla gelen miktar | — | surplus | CONFIRMED | D-144 |
| Malzeme çıkış talebi | Material Issue Request | Şantiyenin malzeme sevki için açtığı talep | — | requisition | CONFIRMED | REQ-INV-005 |
| Tır | Truck Load | Tek bir tırla yapılan sevkiyat parçası | — | vehicle_trip | CONFIRMED | REQ-INV-009…013, REQ-PUR-004 |
| Şerit kombinasyonu | Strip Combination | Bir uzunluk ihtiyacını karşılayan stok boyları bileşimi | — | cut_plan | CONFIRMED | REQ-INV-016 |
| Gelene kadarki maliyet | Landed Cost | Alış bedeli + galvaniz + stoğa gelene kadarki nakliye | — | total_cost | CONFIRMED | D-142 |
| Ağırlıklı ortalama maliyet | Weighted Average Cost | Lokasyon başına alışların ağırlıklı ortalaması | — | avg_price | CONFIRMED | D-143 |
| Düz lama | Flat Bar | Lug hammaddesi | — | plate | CONFIRMED | REQ-FAC-007 |
| Fabrika günlük kaydı | Factory Daily Log | Fabrikanın günlük üretim ve hareket kaydı | — | factory_report | CONFIRMED | REQ-FAC-003…004 |
| Gider dağıtımı | Overhead Allocation | Fabrika giderinin işlere işçilik saatiyle dağıtılması | — | cost_split | CONFIRMED | D-145 |
| Teknik iyileştirme işi | Technical Improvement Work | Fabrikadaki kalıp, aparat, geliştirme işleri | — | rnd_task | CONFIRMED | REQ-FAC-010 |
| Devreden miktar | Carried-Over Quantity | İşverenin onaylamadığı, sonraki hakedişte yeniden önerilen miktar | — | backlog | CONFIRMED | D-147 |
| İşveren avansı | Client Advance | İşverenden iş başında alınan, hakedişlerden kesilerek kapanan avans | — | prepayment | CONFIRMED | D-150 |
| Gelir | Income | Bir maliyet merkezine yazılan her gelir kaydı | — | revenue_item | CONFIRMED | REQ-FIN-011 |
| Gider | Expense | Bir maliyet merkezine yazılan her gider kaydı | — | cost, spending | CONFIRMED | REQ-FIN-013…014, REQ-FIN-016 |
| Genel gider | General Expense | Hiçbir projeye ait olmayan, projelere dağıtılmayan gider | — | overhead (fabrika gider dağıtımıyla karışır) | CONFIRMED | D-149 |
| Maliyet merkezi | Cost Center | Gelir ve giderin yazıldığı birim: proje, şantiye, fabrika, ekipman, genel | — | department | CONFIRMED | REQ-FIN-011 |
| Nakit akışı projeksiyonu | Cash Flow Projection | Önümüzdeki haftaların beklenen giriş, çıkış ve kümülatif nakdi | — | forecast | CONFIRMED | REQ-FIN-021, REQ-FIN-023 |
| Ödeme | Payment | Bir firmaya yapılan, onaylı ve dekontla kapanan ödeme | — | transfer | CONFIRMED | REQ-FIN-024…025 |
| Muhasebe aktarımı | Accounting Export | Muhasebeci/YMM programına verilen aylık dosya | — | sync | CONFIRMED | D-153 |
| Kapanış birimi | Closing Unit | Dönemini kendi kapatan birim: her şantiye, fabrika, genel | — | branch | CONFIRMED | D-154 |
| Grup halinde izlenen eşya | Asset Group | Lokasyon başına adetle izlenen düşük değerli eşya (ör. el aletleri) | — | bulk_item | CONFIRMED | D-158 |
| Kiralık varlık | Rented Asset | Kiralayan firma, bedel ve süreyle kaydedilen, amortismana girmeyen varlık | — | leased_item | CONFIRMED | D-161 |
| Devir-teslim tutanağı (varlık) | Asset Custody Record | Aracın veya varlığın el değiştirirken km, yakıt, fotoğraf ve iki taraf onayıyla düzenlenen tutanak | — | handover (işveren teslim-tesellümüne ayrılmış) | CONFIRMED | D-160 |
| Ekipman çalışma günü | Equipment Working Day | Ekipmanın bir şantiyede çalıştığı, amortismanın o şantiyeye yazıldığı gün | — | usage_day | CONFIRMED | D-155, D-162 |
| Atıl ekipman gideri | Idle Equipment Expense | Ekipmanın çalışmadığı günlerin amortisman payı; projelere yüklenmez | — | idle_cost | CONFIRMED | D-156 |
| Demirbaş zayii | Asset Write-Off | Kullanılamaz hale gelen varlığın kalan değerinin gidere yazılması | — | damaged_unit (panel zayiine ayrılmış) | CONFIRMED | D-157 |
| Periyodik kontrol | Periodic Inspection | Vinç fenni kontrolü, araç muayenesi, sigorta, bakım gibi zorunlu kontroller | — | check_up | CONFIRMED | REQ-EQP-015 |
| Vinç günlük kaydı | Crane Daily Log | Vincin günlük çalışma saati, yakıt, arıza/bekleme ve iş kaydı | — | crane_report | CONFIRMED | REQ-EQP-004, REQ-EQP-018…020 |
| Vinç operatörü | Crane Operator | Kendisine atanmış vinçlerin kaydını giren kişi | — | driver | CONFIRMED | REQ-EQP-004, REQ-EQP-018…020 |
| Bordro parametresi | Payroll Parameter | Vergi dilimi, SGK oranı ve tavanı, asgari ücret gibi geçerlilik tarihli bordro tanımı | — | tax_setting | CONFIRMED | D-163 |
| Maaş avansı | Salary Advance | Personele verilen, sonraki bordrolardan kesilen avans | — | loan | CONFIRMED | D-165 |
| Banka toplu ödeme dosyası | Bank Payment File | Onaylı bordrodan bankaya yüklenmek üzere üretilen dosya | — | bank_export | CONFIRMED | D-168 |
| İzin bakiyesi | Leave Balance | Hak edilen ve kullanılan izin günlerinin farkı | — | vacation_days | CONFIRMED | REQ-HR-014 |
| İşe giriş kontrol listesi | Onboarding Checklist | İşe girişte tamamlanması gereken evrak ve işler | — | hire_list | CONFIRMED | REQ-HR-015 |
| İşten çıkış kontrol listesi | Offboarding Checklist | Ayrılışta evrak, zimmet ve avans tamamlanmadan kapanmayan liste | — | exit_list | CONFIRMED | REQ-HR-015 |
| Günlük faaliyet raporu | Daily Activity Report | Üretim kaydı olmayan rollerin günlük iş raporu | — | daily_log (günlük saha kaydıyla karışır) | CONFIRMED | REQ-HR-016 |
| İletişim kaydı | Contact Log | Bir firmayla yapılan görüşmenin tarih, kişi, konu ve sonuç kaydı | — | call_log | CONFIRMED | REQ-CRM-001…003, REQ-CRM-005 |
| Talep kaynağı | Lead Source | Talebin geldiği kanal: e-posta, telefon, WhatsApp, kendi bulduğumuz iş… | — | channel | CONFIRMED | REQ-CRM-001…003, REQ-CRM-005 |
| Kayıp nedeni | Loss Reason | Kaybedilen talebin katalogdan seçilen nedeni | — | lost_cause | CONFIRMED | REQ-CRM-001, REQ-CRM-006 |
| İşveren karnesi | Client Scorecard | İşverenin kayıtlardan hesaplanan ödeme, gecikme ve kârlılık geçmişi | — | rating, score | CONFIRMED | D-171 |
| Karne notu | Scorecard Note | Karneye eklenen tarihli, gerekçeli, silinmeyen not | — | comment | CONFIRMED | D-171 |
| Teklif sürümü | Quote Version | Gönderilmiş teklifin değişmeyen sürümü (Rev.1, Rev.2…) | — | revision (proje revizyonuna ayrılmış) | CONFIRMED | REQ-QTE-003, REQ-QTE-012…013 |
| Teklif şablonu | Quote Template | Teklif belgesinin sabit metinlerini taşıyan şablon | — | form | CONFIRMED | REQ-QTE-003, REQ-QTE-012…013 |
| Tahmini maliyet | Estimated Cost | Teklif kaleminin geçmiş gerçek maliyetten önerilen veya elle girilen maliyeti | — | budget | CONFIRMED | D-174 |
| Hedef marj | Target Margin | Yetkilinin istediği en düşük kâr marjı | — | markup | CONFIRMED | REQ-QTE-007 |
| Maliyet geri beslemesi | Cost Feedback | Tahmini ve gerçekleşen maliyetin karşılaştırılması | — | variance_report | CONFIRMED | REQ-QTE-005, REQ-QTE-010…011 |
| Ders notu | Lesson Note | Tamamlanan işten sonraki tekliflere taşınan not | — | comment | CONFIRMED | REQ-QTE-005, REQ-QTE-010…011 |
| Stok ayırma | Stock Reservation | Satış siparişi için stokta ayrılan, kullanılabilir sayılmayan miktar | — | hold, block | CONFIRMED | D-175 |
| Sözleşme değişikliği (zeyilname) | Contract Amendment | Geçerlilik tarihli yeni sözleşme sürümü; öncekiler silinmez | — | revision (proje revizyonuna ayrılmış) | CONFIRMED | REQ-CMP-005 |
| Çerçeve anlaşma | Framework Agreement | Tedarikçiyle süreli fiyat ve teslim şartı anlaşması | — | blanket_order | CONFIRMED | D-177 |
| Gecikme cezası | Delay Penalty | Sözleşme süresinin aşılmasında günlük cezai tutarla hesaplanan risk | — | fine | CONFIRMED | REQ-CMP-002, REQ-CMP-005, REQ-CMP-010 |
| Süre uzatımı | Extension of Time | İşverenin sözleşme bitiş tarihini ileri alma kararı | EOT | delay_extension | CONFIRMED | D-178 |
| İşveren gecikme dosyası | Client Delay File | İşveren gecikmelerini kayıt ve belgeyle toplayan dosya | — | claim_report | CONFIRMED | REQ-CMP-012 |
| Bildirim yazısı | Notice Letter | İşverene gönderilen resmi gecikme bildirimi | — | warning_letter | CONFIRMED | D-179 |
| Teminat mektubu komisyonu | Guarantee Commission | Teminat mektubu için bankaya ödenen, projeye yazılan komisyon | — | bank_fee | CONFIRMED | D-180 |
| Uyuşmazlık dosyası | Dispute File | Hak talebi veya uyuşmazlık kaydı ve belgeleri | — | case | CONFIRMED | REQ-CMP-014, REQ-CMP-016…017 |
| Test sertifikası | Test Certificate | Bir partinin laboratuvar/kurum test sonucu ve belgesi | Sertifika (UI) | cert, report | CONFIRMED | REQ-QHS-001, REQ-QHS-003 |
| Parti (malzeme) | Material Lot | Aynı üretim veya teslimden gelen, birlikte izlenen malzeme miktarı | Lot (UI) | batch (döküm seansına ayrılmış) | CONFIRMED | REQ-QHS-001, REQ-QHS-003 |
| Kalite kontrolü | Quality Check | Sahada yapılan ölçüm veya uygunluk kontrolü kaydı | — | inspection (periyodik kontrole ayrılmış) | CONFIRMED | REQ-QHS-004 |
| Kök neden | Root Cause | Uygunsuzluğun asıl sebebi | — | reason | CONFIRMED | REQ-QHS-005…008 |
| İç denetim bulgusu | Internal Audit Finding | İç denetimde tespit edilen bulgu; uygunsuzluk kayıt türü | — | audit_log (denetim kaydına ayrılmış) | CONFIRMED | REQ-QHS-005…008 |
| Müşteri şikâyeti | Customer Complaint | Müşteri veya işveren geri bildirimi; uygunsuzluk kayıt türü | — | ticket | CONFIRMED | REQ-QHS-005…008 |
| İSG olayı | OHS Incident | Kaza veya ramak kala kaydı | — | accident (tür değeridir) | CONFIRMED | REQ-QHS-009…010 |
| Eğitim kaydı | Training Record | Personelin aldığı eğitim, tarihi ve geçerliliği | — | course | CONFIRMED | REQ-QHS-012 |
| Günlük İSG kontrol listesi | OHS Checklist | Şantiye/fabrikanın günlük İSG kontrol maddeleri | — | safety_form | CONFIRMED | REQ-QHS-013…015 |
| Risk değerlendirmesi | Risk Assessment | Şantiye/fabrika İSG risk değerlendirme belgesi | — | risk (uygunsuzluk kayıt türüyle karışır) | CONFIRMED | REQ-QHS-013…015 |
| KKD teslimi | PPE Issue | KKD'nin kişiye adetle verilmesi ve kişinin onayı | — | ppe_assignment (demirbaş zimmetiyle karışır) | CONFIRMED | D-184 |
| KPI (performans göstergesi) | Key Performance Indicator (KPI) | Bir pozisyonun kodlu, ağırlıklı ve hedefli ölçütü (ör. SM-01) | KPI | metric (genel ölçü için) | CONFIRMED | REQ-PRF-002, REQ-PRF-008…011, REQ-PRF-013 |
| Performans puanı | Performance Score | Kişinin aylık 0–100 puanı | — | rating | CONFIRMED | D-189 |
| Puan bandı | Score Band | Puan aralığı ve karşılığı (Mükemmel, İyi, Geliştirilmeli, Kritik) | — | grade | CONFIRMED | REQ-PRF-002, REQ-PRF-008…011, REQ-PRF-013 |
| Performans hedefi | Performance Target | Şirket, rol veya kişi düzeyindeki KPI hedefi | — | goal | CONFIRMED | REQ-PRF-014…015, REQ-PRF-017 |
| Prim kuralı | Bonus Rule | Primi bir koşula ve tutara/orana bağlayan kural | — | incentive | CONFIRMED | REQ-PRF-014…015, REQ-PRF-017 |
| Prim | Bonus | Performansa bağlı, bordro dışı ödenen ek ödeme | — | premium, incentive | CONFIRMED | D-188 |
| Gelişim planı | Development Plan | Kritik puandan sonra amirin kişiyle yazdığı plan | — | pip | CONFIRMED | D-193 |
| Performans sıralaması | Performance Ranking | Benzer roller arasında olumlu performansın gösterimi | — | leaderboard | CONFIRMED | REQ-PRF-019 |
| Öneri | Recommendation | Tanımlı bir kuraldan üretilen, gerekçeli ve rakamlı tavsiye; karar vermez | — | suggestion (genel), advice | CONFIRMED | D-195 |
| Öneri türü | Recommendation Type | Bir öneriyi üreten kural ve hesabı | — | rule (iş akışı kuralıyla karışır) | CONFIRMED | REQ-INT-003…004 |
| Kaynak darboğazı | Resource Bottleneck | Bir şantiyede kaynak eksikliğinden yavaşlayan iş | — | shortage | CONFIRMED | REQ-INT-007 |
| Kaynak transfer önerisi | Resource Transfer Suggestion | Atıl kaynağın darboğaza aktarılması için maliyet-kazanç hesabıyla öneri | — | move_order | CONFIRMED | REQ-INT-008 |
| Hızlandırma senaryosu | Acceleration Scenario | Projeyi hızlandırma seçeneği ve süre-maliyet hesabı | — | what_if | CONFIRMED | REQ-INT-011…012 |
| Senaryo sınırı | Scenario Limit | Aşıldığında senaryoyu "önerilmez" yapan tanımlı sınır | — | cap | CONFIRMED | D-196 |
| Toplantı | Meeting | Tarih, katılımcı, gündem ve notlarıyla toplantı kaydı | — | session (döküm seansıyla karışır) | CONFIRMED | REQ-MTG-001 |
| Toplantı tutanağı | Meeting Minutes | Toplantının kaydedilince kesinleşen notları | — | report | CONFIRMED | D-200 |
| Belge | Document | Bir kayda bağlı dosya | Evrak (UI) | file (genel dosya için), attachment | CONFIRMED | REQ-DOC-001 |
| Belge sürümü | Document Version | Aynı belgenin yeni yüklemesi; öncekiler saklanır | — | revision (proje revizyonuna ayrılmış) | CONFIRMED | REQ-DOC-005…010 |
| Arşiv | Archive | Tüm belgeleri yetkiye göre tek pencerede arayan ekran | — | drive, repository | CONFIRMED | REQ-DOC-002, REQ-DOC-004 |
| Sınıflandırılmamış belge | Unclassified Document | Aktarımda kayda bağlanamayan, geçici alanda tutulan belge | — | orphan | CONFIRMED | REQ-DOC-005…010, DEF-001 |
| Metin tanıma | Text Recognition | Taranmış belge ve fotoğraftaki yazının okunması | OCR | scan_text | CONFIRMED | D-201 |
| Yıllık hedef | Annual Target | Şirketin yıllık ciro, kâr, kapasite ve benzeri hedefi | — | goal | CONFIRMED | REQ-STR-001 |
| Bütçe | Budget | Ay, maliyet merkezi ve gider türü bazında planlanan gelir ve gider | — | plan (genel) | CONFIRMED | D-202 |
| Revize bütçe | Budget Revision | Onaylı bütçenin yıl içindeki yeni sürümü; ilk bütçe silinmez | — | revision (proje revizyonuna ayrılmış) | CONFIRMED | REQ-STR-002…003 |
| Bütçe sapması | Budget Variance | Bütçe ile gerçekleşen arasındaki fark | — | deviation | CONFIRMED | REQ-STR-002…003 |
| Enflasyona göre düzeltilmiş görünüm | Inflation-Adjusted View | Rakamların TÜFE ile bugünün lirasına çevrilmiş gösterimi | — | real_value | CONFIRMED | D-203 |
| Yatırım analizi | Investment Analysis | Yeni ekipman alımının maliyet, kazanç ve geri dönüş hesabı | — | roi_report | CONFIRMED | REQ-STR-005 |
| Geri dönüş süresi | Payback Period | Yatırımın kendini ödediği süre; basit ve indirgenmiş | — | roi | CONFIRMED | D-204 |
| Şirket sağlık karnesi | Company Health Scorecard | Şirketin başlık başına renkli genel durumu | — | score (işveren karnesiyle karışır) | CONFIRMED | D-205 |
| Merkezi kural | Business Rule | Tek yerde, tarihli sürümle tutulan şirket kuralı değeri | — | setting (tanımla karışır) | CONFIRMED | REQ-WFL-032 |
| Döküm satırı | Casting Entry | Bir döküm seansında panel tipi başına adet | — | pour_row | CONFIRMED | REQ-SIT-015 |
| Tüketim satırı | Consumption Entry | Günlük kayıtta önerilen ve girilen malzeme tüketimi | — | usage | CONFIRMED | REQ-SIT-029 |
| Kullanıcı tanımlı kayıt | Custom Record | Kayıt türü üreteciyle tanımlanmış türün bir kaydı | — | dynamic_entity | CONFIRMED | REQ-WFL-035 |
| Ekipman kullanım satırı | Equipment Use Entry | Günlük kayıtta o gün kullanılan ekipman | — | equipment_log | CONFIRMED | REQ-EQP-011 |
| Teslim-tesellüm saati | Handover Time | Dolgu, beton, demir teslim ve geri alma zamanı | — | delivery_time | CONFIRMED | REQ-SIT-024 |
| Gösterge seçimi | Indicator Selection | Rol varsayılanı ve kişinin kendi gösterge düzeni | — | widget_config | CONFIRMED | REQ-RPT-004 |
| Montaj satırı | Installation Entry | Panel montajı: duvar, tip, adet, saatler | — | mount_row | CONFIRMED | REQ-SIT-021 |
| Elle belirlenen amir | Manager Override | Bir kişi için rol hiyerarşisinden önce gelen amir | — | boss_override | CONFIRMED | REQ-IAM-014 |
| Kişisel istisna | Personal Exception | Sahibin bir kişiye tanıdığı ek veya eksik erişim | — | user_permission | CONFIRMED | REQ-IAM-015 |
| Kayıtlı rapor görünümü | Saved Report View | Filtre ve sütunlarıyla adlandırılmış rapor görünümü | — | report_preset | CONFIRMED | REQ-RPT-017 |
| Şerit montaj satırı | Strip Installation Entry | Şerit montajı: duvar, tip, boy, adet, metre | — | strip_row | CONFIRMED | REQ-SIT-022 |
| Taşeron işçisi | Subcontractor Worker | Günlük kayıtta adıyla tutulan taşeron çalışanı; hassas alan yok | — | worker (personelle karışır) | CONFIRMED | REQ-SIT-028 |
| Tedarik matrisi satırı | Supply Responsibility | Tedarik matrisinde bir kalemin kimde olduğu | — | responsibility | CONFIRMED | REQ-PRJ-004 |
| Puantaj satırı | Timesheet Entry | Bir kişinin bir günlük puantaj kaydı | — | attendance | CONFIRMED | REQ-SIT-026 |
| Akış adımı çalışması | Workflow Step Run | Bir akış örneğinin bir adımdaki çalışması | — | step_log | CONFIRMED | REQ-WFL-034 |
| Akış sürümü | Workflow Version | Yayımlanmış akış tanımı sürümü | — | revision (proje revizyonuna ayrılmış) | CONFIRMED | REQ-WFL-024 |
| Nakit kalemi | Cash Flow Item | Nakit projeksiyonunda planlı tek seferlik veya tekrarlayan kalem | — | cash_line | PROPOSED | REQ-FIN-021 |
| Fabrika maliyet dönemi | Factory Cost Period | Ayın fabrika giderleri, saat payları ve birim maliyetleri; geçici veya kesin | — | cost_month | PROPOSED | REQ-FAC-009 |
| Teslim alım | Goods Receipt | Bir siparişin tır bazında teslim alınması | — | delivery (sevkiyatla karışır) | PROPOSED | REQ-PUR-004 |
| Cari hareketi | Party Account Entry | Bir firmanın carisindeki tek hareket | — | ledger_line | PROPOSED | REQ-FIN-019 |
| Üretim satırı | Production Entry | Fabrika günlük kaydında iş türü başına miktar ve işçilik saati | — | output_row | PROPOSED | REQ-FAC-003 |
| Hakediş kalemi | Progress Payment Line | Hakedişte önerilen ve düzeltilen miktar, gerekçe, devreden miktar | — | invoice_line | PROPOSED | REQ-FIN-002 |
| Malzeme | Material | — | item (katalog satırı) | product | CONFIRMED | |
| Sarf malzeme | Consumable | — | — | supply | CONFIRMED | |
| Sarf reçetesi | Consumption Recipe | İş birimi başına standart sarf | bill of materials | — | CONFIRMED | |
| Stok hareketi | Stock Movement | Stok defterindeki tekil hareket | — | transaction | CONFIRMED | |
| Lokasyon | Location | Fabrika, depo, galvanizci, şantiye, sevkiyatta | — | place, warehouse | CONFIRMED | |
| Haddeci | Rolling Mill Supplier | Şerit/lama üreten tedarikçi türü | rolling mill | — | CONFIRMED | Tedarikçi türü değeri: `rolling_mill` |
| Galvanizci | Galvanizer | Galvaniz kaplama yapan tedarikçi türü | — | — | CONFIRMED | `galvanizer` |
| Sevkiyat | Shipment | Tır bazlı malzeme taşıma kaydı | — | dispatch, transfer | CONFIRMED | Şantiyeler arası da shipment |
| Kantar fişi | Weighbridge Ticket | Tartım belgesi | — | scale_receipt | CONFIRMED | |
| Teorik ağırlık | Theoretical Weight | Ölçülerden hesaplanan ağırlık | — | — | CONFIRMED | |
| Stok sayımı | Stock Count | Fiziki sayım | — | inventory_check | CONFIRMED | |
| Açılış stoku | Opening Stock | Başlangıç bakiyesi | — | initial_stock | CONFIRMED | |
| Fire | Process Loss | Fabrika işleme, galvaniz veya sevkiyatta giren-çıkan miktar farkı; tartılır | — | waste (belirsiz) | CONFIRMED | D-028 |
| Zayi (panel) | Damaged Unit | Kırılan/kullanılamaz hale gelen panel veya ürün; adet + neden + fotoğraf zorunlu | — | waste (belirsiz) | CONFIRMED | D-028 |
| Hurda | Scrap | Fire veya zayiden ayrılıp satılabilen malzeme | — | — | CONFIRMED | D-028 |
| Yan gelir | Ancillary Income | Ana sözleşme dışı gelir | — | side_income, extra | CONFIRMED | |
| Cari hesap | Party Account | Firmanın para birimi bazında tek net yürüyen bakiyesi (alacak ve borç netleşir), TL karşılığıyla | account ledger | current_account | CONFIRMED | D-033, D-034 |
| Tahsilat | Collection | — | receipt | — | CONFIRMED | |
| Döviz kuru | Exchange Rate | — | — | currency_rate, kur | CONFIRMED | |
| Dönem kapanışı | Period Close | Aylık kapanış | — | month_end | CONFIRMED | |
| Revizyon talebi | Revision Request | Onaylı kayıt değişiklik talebi | — | edit_request | CONFIRMED | |
| Onay | Approval | — | — | confirmation | CONFIRMED | |
| Düzeltme isteği | Correction Request | Kaydı düzeltmeye geri gönderme | — | rejection (farklı) | CONFIRMED | |
| Akış örneği | Workflow Instance | Bir iş akışının tek bir çalışması | — | run, process, flow | CONFIRMED | CHG-006 |
| Akış şablonu | Workflow Template | Varsayılan şirket akışı; kullanılan akış onun kopyasıdır | — | preset | CONFIRMED | D-086 |
| Yetenek kataloğu | Capability Catalog | Bir modülün akışlara sunduğu olaylar, aksiyonlar ve koşul alanları | — | api_list | CONFIRMED | D-078 |
| Bağımlılık kilidi | Dependency Lock | Bir koşul sağlanmadan durum geçişini engelleyen kural | — | block, freeze | CONFIRMED | ADR-006, D-084 |
| Kayıt türü üreteci | Record Type Builder | Kullanıcının yeni kayıt türü tanımladığı araç | — | form_builder | CONFIRMED | D-079 |
| Kullanıcı tanımlı kayıt türü | Custom Record Type | Üreteçle tanımlanmış kayıt türü | — | custom_entity | CONFIRMED | D-079 |
| İş akışı | Workflow | Tanımlı süreç | — | process, flow (kodda) | CONFIRMED | |
| Bildirim | Notification | Kullanıcıya bir olayı haber veren ileti | — | alert, message | CONFIRMED | |
| Telefon bildirimi | Push Notification | Tarayıcı üzerinden telefona anında giden bildirim | web push | sms | CONFIRMED | D-132 |
| Günlük özet | Daily Digest | Kişiye sabah giden tek özet ileti | — | report, summary_mail | CONFIRMED | D-133 |
| Denetim kaydı | Audit Log | Değiştirilemeyen işlem kaydı | — | history_table, log | CONFIRMED | D-135 |
| Kayıt geçmişi | Record History | Bir kaydın alan alan değişiklik geçmişi | — | changelog, versions | CONFIRMED | REQ-AUD-001…002, REQ-AUD-004…005, REQ-WFL-016 |
| Görev | Task | Sorumluya atanan iş | — | job, todo | CONFIRMED | Geliştirme görevleri `TASK-NNNN` ID'si ile karışmaması için kodda `work_task` Phase 04'te değerlendirilir |
| Eskalasyon | Escalation | — | — | — | CONFIRMED | |
| Demirbaş / Varlık | Asset | Envanter kalemi (makine, araç, laptop…) | — | fixture, inventory_item | CONFIRMED | |
| Ekipman | Equipment | Asset alt kategorisi | — | — | CONFIRMED | |
| Zimmet | Asset Assignment | Varlığın kişiye teslimi | custody | — | CONFIRMED | |
| Amortisman | Depreciation | — | — | amortization | CONFIRMED | |
| Vinç | Crane | — | — | — | CONFIRMED | |
| Kalıp | Mold | Panel döküm kalıbı | formwork | — | CONFIRMED | |
| Atıl kaynak | Idle Resource | — | — | unused | CONFIRMED | |
| Personel | Employee | — | — | staff, personnel, worker | CONFIRMED | Kullanıcı hesabından (User) ayrıdır |
| Bordro | Payroll | — | — | salary_slip | CONFIRMED | |
| İzin | Leave | — | — | vacation | CONFIRMED | |
| Uygunsuzluk | Nonconformity | — | — | defect, error | CONFIRMED | |
| DÖF | Corrective and Preventive Action (CAPA) | — | CAPA | dof | CONFIRMED | |
| Ramak kala | Near Miss | — | — | — | CONFIRMED | |
| İSG | Occupational Health and Safety (OHS) | — | OHS | isg | CONFIRMED | |
| KKD | Personal Protective Equipment (PPE) | — | PPE | kkd | CONFIRMED | |
| Toplantı kararı | Meeting Decision | — | — | resolution | CONFIRMED | |
| Destek talebi | Support Ticket | İç destek talebi | — | request, issue | CONFIRMED | |
| Kurum onayı öncesi döküm | Pre-Approval Casting | — | — | — | CONFIRMED | |
| Fazla döküm | Over-Casting | Hedef üstü döküm | — | — | CONFIRMED | |
| Çift döküm | Double Casting Day | Aynı gün birden fazla döküm seansı | — | — | CONFIRMED | |
| Bugün (giriş ekranı) | Today Screen | Her rolün girişte açılan, role göre kurulan ekranı | — | dashboard, home | CONFIRMED | D-056. Kodda hâlâ `/dashboard` ve `dashboard-widget-registry` adları var — TASK-0043 |
| Gösterge | Indicator | "Bugün"de ve raporlarda gösterilen tek sayı | — | widget (kavram adı olarak), metric | CONFIRMED | Kodda şimdilik `widget` — TASK-0043 |
| Dikkat öğesi | Attention Item | Gizlenemeyen, yalnızca sebebi çözülünce kapanan kritik uyarı | — | alert, alarm | CONFIRMED | D-126 |
| Zarar tanısı | Loss Diagnosis | Şantiye maliyetini etkenlerine ayıran kart | — | root_cause (uygunsuzluğun kök nedenine ayrılmış) | CONFIRMED | REQ-RPT-013, D-129 |
| Cockpit | Owner Cockpit | Sahip yönetim ekranı | — | dashboard (genel ekranlar için) | CONFIRMED | |
