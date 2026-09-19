# Terim Sözlüğü (Glossary)

Durum: TASLAK — önerilen terimler Phase 01'de sahiple kesinleşir (OQ-007) · Son güncelleme: 2026-09-19

Kod, veritabanı, API ve event isimlerinde yalnızca **Canonical English Term** kullanılır. Durum sütunu: `PROPOSED` (önerildi), `CONFIRMED` (kesinleşti), `OPEN` (tartışmalı).

| Türkçe terim | Canonical English Term | Tanım | İzinli alternatif | Yasak alternatif | Durum | Not |
|---|---|---|---|---|---|---|
| Sahip | Owner | Şirket sahibi; hiçbir rol tarafından kısıtlanamayan en üst görünürlük | — | admin, boss | PROPOSED | Sistem yöneticisi rolünden ayrıdır |
| Rol | Role | Yetki ve sorumluluk seti | — | position (farklı kavram) | PROPOSED | |
| Vekâlet | Role Delegation | Belirli süreli rol ataması | — | proxy, deputy | PROPOSED | |
| Kullanıcı | User | Panele giriş yapan hesap | — | account, member | PROPOSED | Personelden (Employee) ayrıdır; taşeron ekip başı da kullanıcıdır |
| Yetki | Permission | Bir rolün taşıdığı tek bir izin (ör. `wfl.approval.view`) | Yetki tipi (UI) | right, privilege | PROPOSED | Roller yetkilerin bir araya gelmesidir (D-098) |
| Rol ataması | Role Assignment | Bir rolün bir kişiye bir kapsamla verilmesi | — | user_role | PROPOSED | D-111 |
| Kapsam | Scope | Rol atamasının geçerli olduğu alan: tüm şirket, şantiyeler veya projeler | — | area, region | PROPOSED | D-111 |
| Veri sınıfı | Data Class | Verinin gizlilik sınıfı: genel, iç, ticari, hassas kişisel | — | sensitivity_level | PROPOSED | Görme izni modül bazında (D-115) |
| Tam görünürlük | Full Visibility | Tüm modüllerde tüm veri sınıflarını tüm kapsamlarda görebilmek | — | superuser, admin | PROPOSED | Akış tasarlama yetkisinin şartı (D-083) |
| Görev ayrılığı | Separation of Duties | Hazırlayanın kendi işlemini onaylayamaması kuralı | — | four_eyes | PROPOSED | §2.6 |
| İşlem yapılan rol | Acting Role | Çoklu rolü olan kullanıcının işlemi yaptığı rol | — | current_role | PROPOSED | |
| Firma | Party | Şirketin iş yaptığı her firma/kurum için tek kayıt; rolleri olur (işveren, müşteri, tedarikçi…) | — | company, firm, organization | CONFIRMED | D-027; aynı firma için ikinci kart açılmaz |
| İşveren | Client | Bizi uygulama işine alan firma/idare; Party rolü `client` | Employer (sözleşme metinlerinde) | company | CONFIRMED | D-027; FIDIC "Employer" kullanır |
| Müşteri (ürün satışı) | Customer | Ürün satışı yaptığımız firma; Party rolü `customer` | — | client (uygulama işi için ayrılmış) | CONFIRMED | D-027; işverenle aynı firma olabilir |
| Kurum / İdare | Authority | Projeyi onaylayan kamu kurumu | — | institution | PROPOSED | |
| Proje | Project | Sözleşmeli iş; 1..N şantiye | — | job | PROPOSED | |
| Şantiye | Site | Projenin fiziksel uygulama yeri | — | construction_site, workplace | PROPOSED | Arayüzde modül ve menü adı "Şantiye" (D-026) |
| Proje revizyonu | Project Revision | Onaylanınca geçerli olan, hedefleri taşıyan proje sürümü (ör. Rev.2) | — | version, drawing_rev | PROPOSED | D-136 |
| Proje aşaması | Project Stage | Projenin yaşam döngüsündeki yeri | — | phase, status | PROPOSED | §7.2 |
| Teknik ofis işi | Technical Office Item | Teknik ofisin proje altında izlenen işi | — | tech_task | PROPOSED | §7.4 |
| Sözleşme süresi | Contract Duration | İşverene karşı resmî süre | — | deadline | PROPOSED | §8.1 |
| Teorik süre | Theoretical Duration | Mevcut kaynaklarla beklenen süre | — | estimate | PROPOSED | §8.1 |
| Yönetim hedef süresi | Management Target Duration | Yönetimin koyduğu iç hedef süre | — | goal | PROPOSED | §8.1 |
| Günlük hedef | Daily Target | Şantiyenin bir günlük üretim hedefi | — | quota | PROPOSED | D-137 |
| Duvar | Wall | Proje içindeki duvar birimi | — | structure | PROPOSED | |
| Toprakarme | Reinforced Earth (MSE wall) | Çelik şerit donatılı zemin duvarı | mechanically stabilized earth | — | PROPOSED | Kodda `mse` kısaltması kullanılmaz |
| Katalog kalemi | Catalog Item | Ortak listelerdeki tek bir tanım (gider kategorisi, malzeme…) | — | lookup, option | PROPOSED | D-139 |
| Şerit tipi | Strip Type | Genişlik, kalınlık, delik sayısı ve standart boylarıyla tanımlı çelik şerit türü | — | strip_model | PROPOSED | §11.2 |
| Özel alan | Custom Field | Belirlenmiş kayıt türlerine eklenen tipli alan | — | extra_field, meta | PROPOSED | ADR-005 |
| Çalışma takvimi | Working Calendar | Çalışma saatleri, tatiller ve fazla mesai kuralları | — | schedule, shift_plan | PROPOSED | §23.9 |
| Panel tipi | Panel Type | C4, C5… gibi tanımlı panel ölçüsü | — | panel_model | PROPOSED | |
| Kademe (panel sırası) | Panel Course | Panelin duvarda alttan üste yer aldığı sıra/yükseklik (1. kademe, 2. kademe…) | — | level, grade, rank | CONFIRMED | D-031 |
| Panel dökümü | Panel Casting | Sahada panelin kalıpta dökülmesi | — | pouring, production | PROPOSED | |
| Döküm seansı | Casting Session | Aynı gün içindeki ayrı döküm | — | batch | PROPOSED | Çift döküm = birden fazla session |
| Priz | Curing | Betonun sertleşme süreci | — | — | PROPOSED | |
| Montaj | Panel Installation | Panelin duvara yerleştirilmesi | erection | assembly, mounting | PROPOSED | |
| Çelik şerit | Steel Strip | Galvaniz kaplı donatı şeridi | reinforcing strip | band, belt | PROPOSED | |
| Şerit montajı | Strip Installation | Şeritlerin serilip lug'a bağlanması | — | strip_laying | PROPOSED | |
| Lug | Tie Strip Lug | Panele gömülen, şeridin bağlandığı bağlantı elemanı; tek standart tip, adetle izlenir | lug | — | CONFIRMED | D-032 |
| Harpuşta | Coping | Duvar üst başlığı | — | cap | PROPOSED | |
| Dolgu | Backfill | İşverenin serip sıkıştırdığı dolgu | — | fill_material | PROPOSED | |
| Teslim-tesellüm | Handover | Alanın işverene/işverenden teslimi | — | delivery | PROPOSED | `handover_to_client`, `handover_from_client` |
| İşveren bekleme süresi | Client Wait Time | Dolguya teslim ile geri alınma arasında işveren kaynaklı geçen süre | — | delay, idle_time | PROPOSED | §11.5 |
| Saha harcaması | Site Expense | Şantiyede yapılan, belgeyle girilen harcama | — | cost, spending | PROPOSED | §9.4 |
| Geç giriş | Late Entry | Giriş süresi geçtikten sonra girilen günlük kayıt | — | overdue_log | PROPOSED | D-122 |
| Günlük saha kaydı | Daily Site Log | Şantiyenin günlük ana kaydı | — | daily_report (resmi rapor ayrıdır) | PROPOSED | |
| Resmi günlük rapor | Official Daily Report | Onaylı kayıttan üretilen PDF rapor | — | — | PROPOSED | |
| Puantaj | Timesheet | Bordro amaçlı çalışma günü/saat kaydı | attendance | — | PROPOSED | |
| Faaliyet süresi | Activity Time Entry | Performans amaçlı iş başlangıç-bitiş kaydı | — | work_hours | PROPOSED | Puantajdan ayrıdır |
| Taşeron | Subcontractor | Götürü işçilik yapan ekip | — | contractor | PROPOSED | |
| Götürü işçilik | Subcontracted Labor | Taşeron ekibe verilen işçilik işi | — | unit_rate_labor | CONFIRMED | D-030; ödeme yöntemi ayrı alandır |
| Taşeron ödeme yöntemi | Subcontractor Payment Method | `unit_rate` (onaylı miktar × birim fiyat), `lump_sum` (sabit toplam bedel), `day_rate` (gün / kişi-gün) | — | payment_type | CONFIRMED | D-030 |
| Öz kaynak | In-House Crew | Şirket bordrolu ekip | self-performed | own_resource | PROPOSED | |
| İş modeli (şantiye) | Labor Model | `subcontracted` / `in_house` | — | work_model | PROPOSED | |
| Hakediş (işveren) | Client Progress Payment | Dönemsel yapılan iş bedeli talebi | interim payment certificate | invoice | PROPOSED | |
| Taşeron hakedişi | Subcontractor Progress Payment | Taşerona onaylı üretim üzerinden ödeme hesabı | — | — | PROPOSED | |
| Metraj | Quantity | Ölçülen/hesaplanan iş miktarı | quantity take-off (teklif aşaması) | measurement | PROPOSED | |
| İcmal | Summary Sheet | Özet tablo | — | recap | PROPOSED | |
| Birim fiyat | Unit Price | Birim başına fiyat | — | rate | PROPOSED | |
| Kesinti | Deduction | Hakedişten düşülen tutar | — | cut | PROPOSED | |
| Stopaj | Withholding Tax | — | — | — | PROPOSED | |
| Teminat | Guarantee | Sözleşme teminatı; türü `letter_of_guarantee`, `retention`, `cash_guarantee` | performance guarantee | deposit | CONFIRMED | D-029; üç tür de takip edilir |
| Teminat mektubu | Letter of Guarantee | Bankadan alınan teminat mektubu; tutar, süre, iade takibi | — | bank_letter | CONFIRMED | D-029 |
| Teminat kesintisi | Retention | Hakedişten teminat olarak kesilen tutar; iş sonunda iade | — | deduction (genel kesinti ayrıdır) | CONFIRMED | D-029 |
| Nakit teminat | Cash Guarantee | İş başında yatırılan nakit teminat | — | cash_deposit | CONFIRMED | D-029 |
| Teklif | Quote | Fiyat teklifi | — | offer, proposal, bid | PROPOSED | |
| İhale | Tender | — | — | auction | PROPOSED | |
| Talep (satış) | Lead | Gelen iş talebi/fırsat | — | request, opportunity | PROPOSED | |
| Satış siparişi | Sales Order | Ürün satışı siparişi | — | — | PROPOSED | |
| Sözleşme | Contract | — | — | agreement | PROPOSED | |
| Yükümlülük | Obligation | Sözleşmeden doğan iş/tarih | — | duty, requirement | PROPOSED | |
| Tedarik matrisi | Supply Responsibility Matrix | Kim neyi karşılıyor | — | — | PROPOSED | |
| Tedarikçi | Supplier | Tedarikçi rolü taşıyan firma | — | vendor | PROPOSED | D-027 |
| Satın alma siparişi | Purchase Order | Tedarikçiye verilen sipariş | — | po_order | PROPOSED | §18.3 |
| Satın alma talebi | Purchase Request | Katalog içi veya dışı alım için iç talep | — | requisition | PROPOSED | §18.16 |
| Tedarikçi teklifi | Supplier Quote | Bir tedarikçinin fiyat, termin ve koşul teklifi | — | offer | PROPOSED | §18.16 |
| Fazla teslim | Over-Delivery | Siparişten fazla gelen miktar | — | surplus | PROPOSED | D-144 |
| Malzeme çıkış talebi | Material Issue Request | Şantiyenin malzeme sevki için açtığı talep | — | requisition | PROPOSED | §18.7 |
| Tır | Truck Load | Tek bir tırla yapılan sevkiyat parçası | — | vehicle_trip | PROPOSED | §18.11 |
| Şerit kombinasyonu | Strip Combination | Bir uzunluk ihtiyacını karşılayan stok boyları bileşimi | — | cut_plan | PROPOSED | §18.14 |
| Gelene kadarki maliyet | Landed Cost | Alış bedeli + galvaniz + stoğa gelene kadarki nakliye | — | total_cost | PROPOSED | D-142 |
| Ağırlıklı ortalama maliyet | Weighted Average Cost | Lokasyon başına alışların ağırlıklı ortalaması | — | avg_price | PROPOSED | D-143 |
| Düz lama | Flat Bar | Lug hammaddesi | — | plate | PROPOSED | §17.4 |
| Fabrika günlük kaydı | Factory Daily Log | Fabrikanın günlük üretim ve hareket kaydı | — | factory_report | PROPOSED | §17.2 |
| Gider dağıtımı | Overhead Allocation | Fabrika giderinin işlere işçilik saatiyle dağıtılması | — | cost_split | PROPOSED | D-145 |
| Teknik iyileştirme işi | Technical Improvement Work | Fabrikadaki kalıp, aparat, geliştirme işleri | — | rnd_task | PROPOSED | §17.6 |
| Devreden miktar | Carried-Over Quantity | İşverenin onaylamadığı, sonraki hakedişte yeniden önerilen miktar | — | backlog | PROPOSED | D-147 |
| İşveren avansı | Client Advance | İşverenden iş başında alınan, hakedişlerden kesilerek kapanan avans | — | prepayment | PROPOSED | D-150 |
| Gelir | Income | Bir maliyet merkezine yazılan her gelir kaydı | — | revenue_item | PROPOSED | §22.2 |
| Gider | Expense | Bir maliyet merkezine yazılan her gider kaydı | — | cost, spending | PROPOSED | §22.3 |
| Genel gider | General Expense | Hiçbir projeye ait olmayan, projelere dağıtılmayan gider | — | overhead (fabrika gider dağıtımıyla karışır) | PROPOSED | D-149 |
| Maliyet merkezi | Cost Center | Gelir ve giderin yazıldığı birim: proje, şantiye, fabrika, ekipman, genel | — | department | PROPOSED | §22.2 |
| Nakit akışı projeksiyonu | Cash Flow Projection | Önümüzdeki haftaların beklenen giriş, çıkış ve kümülatif nakdi | — | forecast | PROPOSED | §22.7 |
| Ödeme | Payment | Bir firmaya yapılan, onaylı ve dekontla kapanan ödeme | — | transfer | PROPOSED | §22.8 |
| Muhasebe aktarımı | Accounting Export | Muhasebeci/YMM programına verilen aylık dosya | — | sync | PROPOSED | D-153 |
| Kapanış birimi | Closing Unit | Dönemini kendi kapatan birim: her şantiye, fabrika, genel | — | branch | PROPOSED | D-154 |
| Grup halinde izlenen eşya | Asset Group | Lokasyon başına adetle izlenen düşük değerli eşya (ör. el aletleri) | — | bulk_item | PROPOSED | D-158 |
| Kiralık varlık | Rented Asset | Kiralayan firma, bedel ve süreyle kaydedilen, amortismana girmeyen varlık | — | leased_item | PROPOSED | D-161 |
| Devir-teslim tutanağı (varlık) | Asset Custody Record | Aracın veya varlığın el değiştirirken km, yakıt, fotoğraf ve iki taraf onayıyla düzenlenen tutanak | — | handover (işveren teslim-tesellümüne ayrılmış) | PROPOSED | D-160 |
| Ekipman çalışma günü | Equipment Working Day | Ekipmanın bir şantiyede çalıştığı, amortismanın o şantiyeye yazıldığı gün | — | usage_day | PROPOSED | D-155, D-162 |
| Atıl ekipman gideri | Idle Equipment Expense | Ekipmanın çalışmadığı günlerin amortisman payı; projelere yüklenmez | — | idle_cost | PROPOSED | D-156 |
| Demirbaş zayii | Asset Write-Off | Kullanılamaz hale gelen varlığın kalan değerinin gidere yazılması | — | damaged_unit (panel zayiine ayrılmış) | PROPOSED | D-157 |
| Periyodik kontrol | Periodic Inspection | Vinç fenni kontrolü, araç muayenesi, sigorta, bakım gibi zorunlu kontroller | — | check_up | PROPOSED | §21.5 |
| Vinç günlük kaydı | Crane Daily Log | Vincin günlük çalışma saati, yakıt, arıza/bekleme ve iş kaydı | — | crane_report | PROPOSED | §21.7 |
| Vinç operatörü | Crane Operator | Kendisine atanmış vinçlerin kaydını giren kişi | — | driver | PROPOSED | §21.7 |
| Bordro parametresi | Payroll Parameter | Vergi dilimi, SGK oranı ve tavanı, asgari ücret gibi geçerlilik tarihli bordro tanımı | — | tax_setting | PROPOSED | D-163 |
| Maaş avansı | Salary Advance | Personele verilen, sonraki bordrolardan kesilen avans | — | loan | PROPOSED | D-165 |
| Banka toplu ödeme dosyası | Bank Payment File | Onaylı bordrodan bankaya yüklenmek üzere üretilen dosya | — | bank_export | PROPOSED | D-168 |
| İzin bakiyesi | Leave Balance | Hak edilen ve kullanılan izin günlerinin farkı | — | vacation_days | PROPOSED | §23.5 |
| İşe giriş kontrol listesi | Onboarding Checklist | İşe girişte tamamlanması gereken evrak ve işler | — | hire_list | PROPOSED | §23.6 |
| İşten çıkış kontrol listesi | Offboarding Checklist | Ayrılışta evrak, zimmet ve avans tamamlanmadan kapanmayan liste | — | exit_list | PROPOSED | §23.6 |
| Günlük faaliyet raporu | Daily Activity Report | Üretim kaydı olmayan rollerin günlük iş raporu | — | daily_log (günlük saha kaydıyla karışır) | PROPOSED | §23.8 |
| İletişim kaydı | Contact Log | Bir firmayla yapılan görüşmenin tarih, kişi, konu ve sonuç kaydı | — | call_log | PROPOSED | §5.1 |
| Talep kaynağı | Lead Source | Talebin geldiği kanal: e-posta, telefon, WhatsApp, kendi bulduğumuz iş… | — | channel | PROPOSED | §5.1 |
| Kayıp nedeni | Loss Reason | Kaybedilen talebin katalogdan seçilen nedeni | — | lost_cause | PROPOSED | §5 |
| İşveren karnesi | Client Scorecard | İşverenin kayıtlardan hesaplanan ödeme, gecikme ve kârlılık geçmişi | — | rating, score | PROPOSED | D-171 |
| Karne notu | Scorecard Note | Karneye eklenen tarihli, gerekçeli, silinmeyen not | — | comment | PROPOSED | D-171 |
| Teklif sürümü | Quote Version | Gönderilmiş teklifin değişmeyen sürümü (Rev.1, Rev.2…) | — | revision (proje revizyonuna ayrılmış) | PROPOSED | §6.8 |
| Teklif şablonu | Quote Template | Teklif belgesinin sabit metinlerini taşıyan şablon | — | form | PROPOSED | §6.8 |
| Tahmini maliyet | Estimated Cost | Teklif kaleminin geçmiş gerçek maliyetten önerilen veya elle girilen maliyeti | — | budget | PROPOSED | D-174 |
| Hedef marj | Target Margin | Yetkilinin istediği en düşük kâr marjı | — | markup | PROPOSED | §6.4 |
| Maliyet geri beslemesi | Cost Feedback | Tahmini ve gerçekleşen maliyetin karşılaştırılması | — | variance_report | PROPOSED | §6.7 |
| Ders notu | Lesson Note | Tamamlanan işten sonraki tekliflere taşınan not | — | comment | PROPOSED | §6.7 |
| Stok ayırma | Stock Reservation | Satış siparişi için stokta ayrılan, kullanılabilir sayılmayan miktar | — | hold, block | PROPOSED | D-175 |
| Sözleşme değişikliği (zeyilname) | Contract Amendment | Geçerlilik tarihli yeni sözleşme sürümü; öncekiler silinmez | — | revision (proje revizyonuna ayrılmış) | PROPOSED | REQ-CMP-005 |
| Çerçeve anlaşma | Framework Agreement | Tedarikçiyle süreli fiyat ve teslim şartı anlaşması | — | blanket_order | PROPOSED | D-177 |
| Gecikme cezası | Delay Penalty | Sözleşme süresinin aşılmasında günlük cezai tutarla hesaplanan risk | — | fine | PROPOSED | §24.1 |
| Süre uzatımı | Extension of Time | İşverenin sözleşme bitiş tarihini ileri alma kararı | EOT | delay_extension | PROPOSED | D-178 |
| İşveren gecikme dosyası | Client Delay File | İşveren gecikmelerini kayıt ve belgeyle toplayan dosya | — | claim_report | PROPOSED | §24.6 |
| Bildirim yazısı | Notice Letter | İşverene gönderilen resmi gecikme bildirimi | — | warning_letter | PROPOSED | D-179 |
| Teminat mektubu komisyonu | Guarantee Commission | Teminat mektubu için bankaya ödenen, projeye yazılan komisyon | — | bank_fee | PROPOSED | D-180 |
| Uyuşmazlık dosyası | Dispute File | Hak talebi veya uyuşmazlık kaydı ve belgeleri | — | case | PROPOSED | §24.7 |
| Test sertifikası | Test Certificate | Bir partinin laboratuvar/kurum test sonucu ve belgesi | Sertifika (UI) | cert, report | PROPOSED | §29.1 |
| Parti (malzeme) | Material Lot | Aynı üretim veya teslimden gelen, birlikte izlenen malzeme miktarı | Lot (UI) | batch (döküm seansına ayrılmış) | PROPOSED | §29.1 |
| Kalite kontrolü | Quality Check | Sahada yapılan ölçüm veya uygunluk kontrolü kaydı | — | inspection (periyodik kontrole ayrılmış) | PROPOSED | §29.3 |
| Kök neden | Root Cause | Uygunsuzluğun asıl sebebi | — | reason | PROPOSED | §29.4 |
| İç denetim bulgusu | Internal Audit Finding | İç denetimde tespit edilen bulgu; uygunsuzluk kayıt türü | — | audit_log (denetim kaydına ayrılmış) | PROPOSED | §29.4 |
| Müşteri şikâyeti | Customer Complaint | Müşteri veya işveren geri bildirimi; uygunsuzluk kayıt türü | — | ticket | PROPOSED | §29.4 |
| İSG olayı | OHS Incident | Kaza veya ramak kala kaydı | — | accident (tür değeridir) | PROPOSED | §30.1 |
| Eğitim kaydı | Training Record | Personelin aldığı eğitim, tarihi ve geçerliliği | — | course | PROPOSED | §30.2 |
| Günlük İSG kontrol listesi | OHS Checklist | Şantiye/fabrikanın günlük İSG kontrol maddeleri | — | safety_form | PROPOSED | §30.3 |
| Risk değerlendirmesi | Risk Assessment | Şantiye/fabrika İSG risk değerlendirme belgesi | — | risk (uygunsuzluk kayıt türüyle karışır) | PROPOSED | §30.3 |
| KKD teslimi | PPE Issue | KKD'nin kişiye adetle verilmesi ve kişinin onayı | — | ppe_assignment (demirbaş zimmetiyle karışır) | PROPOSED | D-184 |
| KPI (performans göstergesi) | Key Performance Indicator (KPI) | Bir pozisyonun kodlu, ağırlıklı ve hedefli ölçütü (ör. SM-01) | KPI | metric (genel ölçü için) | PROPOSED | §28.11 |
| Performans puanı | Performance Score | Kişinin aylık 0–100 puanı | — | rating | PROPOSED | D-189 |
| Puan bandı | Score Band | Puan aralığı ve karşılığı (Mükemmel, İyi, Geliştirilmeli, Kritik) | — | grade | PROPOSED | §28.11 |
| Performans hedefi | Performance Target | Şirket, rol veya kişi düzeyindeki KPI hedefi | — | goal | PROPOSED | §28.10 |
| Prim kuralı | Bonus Rule | Primi bir koşula ve tutara/orana bağlayan kural | — | incentive | PROPOSED | §28.10 |
| Prim | Bonus | Performansa bağlı, bordro dışı ödenen ek ödeme | — | premium, incentive | PROPOSED | D-188 |
| Gelişim planı | Development Plan | Kritik puandan sonra amirin kişiyle yazdığı plan | — | pip | PROPOSED | D-193 |
| Performans sıralaması | Performance Ranking | Benzer roller arasında olumlu performansın gösterimi | — | leaderboard | PROPOSED | §28.9 |
| Öneri | Recommendation | Tanımlı bir kuraldan üretilen, gerekçeli ve rakamlı tavsiye; karar vermez | — | suggestion (genel), advice | PROPOSED | D-195 |
| Öneri türü | Recommendation Type | Bir öneriyi üreten kural ve hesabı | — | rule (iş akışı kuralıyla karışır) | PROPOSED | §26.2 |
| Kaynak darboğazı | Resource Bottleneck | Bir şantiyede kaynak eksikliğinden yavaşlayan iş | — | shortage | PROPOSED | §27.1 |
| Kaynak transfer önerisi | Resource Transfer Suggestion | Atıl kaynağın darboğaza aktarılması için maliyet-kazanç hesabıyla öneri | — | move_order | PROPOSED | §27.2 |
| Hızlandırma senaryosu | Acceleration Scenario | Projeyi hızlandırma seçeneği ve süre-maliyet hesabı | — | what_if | PROPOSED | §8.3 |
| Senaryo sınırı | Scenario Limit | Aşıldığında senaryoyu "önerilmez" yapan tanımlı sınır | — | cap | PROPOSED | D-196 |
| Toplantı | Meeting | Tarih, katılımcı, gündem ve notlarıyla toplantı kaydı | — | session (döküm seansıyla karışır) | PROPOSED | §32.1 |
| Toplantı tutanağı | Meeting Minutes | Toplantının kaydedilince kesinleşen notları | — | report | PROPOSED | D-200 |
| Belge | Document | Bir kayda bağlı dosya | Evrak (UI) | file (genel dosya için), attachment | PROPOSED | §33 |
| Belge sürümü | Document Version | Aynı belgenin yeni yüklemesi; öncekiler saklanır | — | revision (proje revizyonuna ayrılmış) | PROPOSED | §33.4 |
| Arşiv | Archive | Tüm belgeleri yetkiye göre tek pencerede arayan ekran | — | drive, repository | PROPOSED | §33.2 |
| Sınıflandırılmamış belge | Unclassified Document | Aktarımda kayda bağlanamayan, geçici alanda tutulan belge | — | orphan | PROPOSED | §33.4, DEF-001 |
| Metin tanıma | Text Recognition | Taranmış belge ve fotoğraftaki yazının okunması | OCR | scan_text | PROPOSED | D-201 |
| Yıllık hedef | Annual Target | Şirketin yıllık ciro, kâr, kapasite ve benzeri hedefi | — | goal | PROPOSED | §35.1 |
| Bütçe | Budget | Ay, maliyet merkezi ve gider türü bazında planlanan gelir ve gider | — | plan (genel) | PROPOSED | D-202 |
| Revize bütçe | Budget Revision | Onaylı bütçenin yıl içindeki yeni sürümü; ilk bütçe silinmez | — | revision (proje revizyonuna ayrılmış) | PROPOSED | §35.2 |
| Bütçe sapması | Budget Variance | Bütçe ile gerçekleşen arasındaki fark | — | deviation | PROPOSED | §35.2 |
| Enflasyona göre düzeltilmiş görünüm | Inflation-Adjusted View | Rakamların TÜFE ile bugünün lirasına çevrilmiş gösterimi | — | real_value | PROPOSED | D-203 |
| Yatırım analizi | Investment Analysis | Yeni ekipman alımının maliyet, kazanç ve geri dönüş hesabı | — | roi_report | PROPOSED | §35.3 |
| Geri dönüş süresi | Payback Period | Yatırımın kendini ödediği süre; basit ve indirgenmiş | — | roi | PROPOSED | D-204 |
| Şirket sağlık karnesi | Company Health Scorecard | Şirketin başlık başına renkli genel durumu | — | score (işveren karnesiyle karışır) | PROPOSED | D-205 |
| Malzeme | Material | — | item (katalog satırı) | product | PROPOSED | |
| Sarf malzeme | Consumable | — | — | supply | PROPOSED | |
| Sarf reçetesi | Consumption Recipe | İş birimi başına standart sarf | bill of materials | — | PROPOSED | |
| Stok hareketi | Stock Movement | Stok defterindeki tekil hareket | — | transaction | PROPOSED | |
| Lokasyon | Location | Fabrika, depo, galvanizci, şantiye, sevkiyatta | — | place, warehouse | PROPOSED | |
| Haddeci | Rolling Mill Supplier | Şerit/lama üreten tedarikçi türü | rolling mill | — | PROPOSED | Tedarikçi türü değeri: `rolling_mill` |
| Galvanizci | Galvanizer | Galvaniz kaplama yapan tedarikçi türü | — | — | PROPOSED | `galvanizer` |
| Sevkiyat | Shipment | Tır bazlı malzeme taşıma kaydı | — | dispatch, transfer | PROPOSED | Şantiyeler arası da shipment |
| Kantar fişi | Weighbridge Ticket | Tartım belgesi | — | scale_receipt | PROPOSED | |
| Teorik ağırlık | Theoretical Weight | Ölçülerden hesaplanan ağırlık | — | — | PROPOSED | |
| Stok sayımı | Stock Count | Fiziki sayım | — | inventory_check | PROPOSED | |
| Açılış stoku | Opening Stock | Başlangıç bakiyesi | — | initial_stock | PROPOSED | |
| Fire | Process Loss | Fabrika işleme, galvaniz veya sevkiyatta giren-çıkan miktar farkı; tartılır | — | waste (belirsiz) | CONFIRMED | D-028 |
| Zayi (panel) | Damaged Unit | Kırılan/kullanılamaz hale gelen panel veya ürün; adet + neden + fotoğraf zorunlu | — | waste (belirsiz) | CONFIRMED | D-028 |
| Hurda | Scrap | Fire veya zayiden ayrılıp satılabilen malzeme | — | — | CONFIRMED | D-028 |
| Yan gelir | Ancillary Income | Ana sözleşme dışı gelir | — | side_income, extra | PROPOSED | |
| Cari hesap | Party Account | Firmanın para birimi bazında tek net yürüyen bakiyesi (alacak ve borç netleşir), TL karşılığıyla | account ledger | current_account | CONFIRMED | D-033, D-034 |
| Tahsilat | Collection | — | receipt | — | PROPOSED | |
| Döviz kuru | Exchange Rate | — | — | currency_rate, kur | PROPOSED | |
| Dönem kapanışı | Period Close | Aylık kapanış | — | month_end | PROPOSED | |
| Revizyon talebi | Revision Request | Onaylı kayıt değişiklik talebi | — | edit_request | PROPOSED | |
| Onay | Approval | — | — | confirmation | PROPOSED | |
| Düzeltme isteği | Correction Request | Kaydı düzeltmeye geri gönderme | — | rejection (farklı) | PROPOSED | |
| Akış örneği | Workflow Instance | Bir iş akışının tek bir çalışması | — | run, process, flow | PROPOSED | CHG-006 |
| Akış şablonu | Workflow Template | Varsayılan şirket akışı; kullanılan akış onun kopyasıdır | — | preset | PROPOSED | D-086 |
| Yetenek kataloğu | Capability Catalog | Bir modülün akışlara sunduğu olaylar, aksiyonlar ve koşul alanları | — | api_list | PROPOSED | D-078 |
| Bağımlılık kilidi | Dependency Lock | Bir koşul sağlanmadan durum geçişini engelleyen kural | — | block, freeze | PROPOSED | ADR-006, D-084 |
| Kayıt türü üreteci | Record Type Builder | Kullanıcının yeni kayıt türü tanımladığı araç | — | form_builder | PROPOSED | D-079 |
| Kullanıcı tanımlı kayıt türü | Custom Record Type | Üreteçle tanımlanmış kayıt türü | — | custom_entity | PROPOSED | D-079 |
| İş akışı | Workflow | Tanımlı süreç | — | process, flow (kodda) | PROPOSED | |
| Bildirim | Notification | Kullanıcıya bir olayı haber veren ileti | — | alert, message | PROPOSED | |
| Telefon bildirimi | Push Notification | Tarayıcı üzerinden telefona anında giden bildirim | web push | sms | PROPOSED | D-132 |
| Günlük özet | Daily Digest | Kişiye sabah giden tek özet ileti | — | report, summary_mail | PROPOSED | D-133 |
| Denetim kaydı | Audit Log | Değiştirilemeyen işlem kaydı | — | history_table, log | PROPOSED | D-135 |
| Kayıt geçmişi | Record History | Bir kaydın alan alan değişiklik geçmişi | — | changelog, versions | PROPOSED | §38 |
| Görev | Task | Sorumluya atanan iş | — | job, todo | PROPOSED | Geliştirme görevleri `TASK-NNNN` ID'si ile karışmaması için kodda `work_task` Phase 04'te değerlendirilir |
| Eskalasyon | Escalation | — | — | — | PROPOSED | |
| Demirbaş / Varlık | Asset | Envanter kalemi (makine, araç, laptop…) | — | fixture, inventory_item | PROPOSED | |
| Ekipman | Equipment | Asset alt kategorisi | — | — | PROPOSED | |
| Zimmet | Asset Assignment | Varlığın kişiye teslimi | custody | — | PROPOSED | |
| Amortisman | Depreciation | — | — | amortization | PROPOSED | |
| Vinç | Crane | — | — | — | PROPOSED | |
| Kalıp | Mold | Panel döküm kalıbı | formwork | — | PROPOSED | |
| Atıl kaynak | Idle Resource | — | — | unused | PROPOSED | |
| Personel | Employee | — | — | staff, personnel, worker | PROPOSED | Kullanıcı hesabından (User) ayrıdır |
| Bordro | Payroll | — | — | salary_slip | PROPOSED | |
| İzin | Leave | — | — | vacation | PROPOSED | |
| Uygunsuzluk | Nonconformity | — | — | defect, error | PROPOSED | |
| DÖF | Corrective and Preventive Action (CAPA) | — | CAPA | dof | PROPOSED | |
| Ramak kala | Near Miss | — | — | — | PROPOSED | |
| İSG | Occupational Health and Safety (OHS) | — | OHS | isg | PROPOSED | |
| KKD | Personal Protective Equipment (PPE) | — | PPE | kkd | PROPOSED | |
| Toplantı kararı | Meeting Decision | — | — | resolution | PROPOSED | |
| Destek talebi | Support Ticket | İç destek talebi | — | request, issue | PROPOSED | |
| Kurum onayı öncesi döküm | Pre-Approval Casting | — | — | — | PROPOSED | |
| Fazla döküm | Over-Casting | Hedef üstü döküm | — | — | PROPOSED | |
| Çift döküm | Double Casting Day | Aynı gün birden fazla döküm seansı | — | — | PROPOSED | |
| Bugün (giriş ekranı) | Today Screen | Her rolün girişte açılan, role göre kurulan ekranı | — | dashboard, home | PROPOSED | D-056. Kodda hâlâ `/dashboard` ve `dashboard-widget-registry` adları var — TASK-0043 |
| Gösterge | Indicator | "Bugün"de ve raporlarda gösterilen tek sayı | — | widget (kavram adı olarak), metric | PROPOSED | Kodda şimdilik `widget` — TASK-0043 |
| Dikkat öğesi | Attention Item | Gizlenemeyen, yalnızca sebebi çözülünce kapanan kritik uyarı | — | alert, alarm | PROPOSED | D-126 |
| Zarar tanısı | Loss Diagnosis | Şantiye maliyetini etkenlerine ayıran kart | — | root_cause (uygunsuzluğun kök nedenine ayrılmış) | PROPOSED | §14.2, D-129 |
| Cockpit | Owner Cockpit | Sahip yönetim ekranı | — | dashboard (genel ekranlar için) | PROPOSED | |
