# Terim Sözlüğü (Glossary)

Durum: TASLAK — önerilen terimler Phase 01'de sahiple kesinleşir (OQ-007) · Son güncelleme: 2026-09-18

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
| Duvar | Wall | Proje içindeki duvar birimi | — | structure | PROPOSED | |
| Toprakarme | Reinforced Earth (MSE wall) | Çelik şerit donatılı zemin duvarı | mechanically stabilized earth | — | PROPOSED | Kodda `mse` kısaltması kullanılmaz |
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
| Cockpit | Owner Cockpit | Sahip yönetim ekranı | — | dashboard (genel ekranlar için) | PROPOSED | |
