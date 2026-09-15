# Terim Sözlüğü (Glossary)

Durum: TASLAK — önerilen terimler Phase 01'de sahiple kesinleşir (OQ-007) · 2026-09-15

Kod, veritabanı, API ve event isimlerinde yalnızca **Canonical English Term** kullanılır. Durum sütunu: `PROPOSED` (önerildi), `CONFIRMED` (kesinleşti), `OPEN` (tartışmalı).

| Türkçe terim | Canonical English Term | Tanım | İzinli alternatif | Yasak alternatif | Durum | Not |
|---|---|---|---|---|---|---|
| Sahip | Owner | Şirket sahibi; hiçbir rol tarafından kısıtlanamayan en üst görünürlük | — | admin, boss | PROPOSED | Sistem yöneticisi rolünden ayrıdır |
| Rol | Role | Yetki ve sorumluluk seti | — | position (farklı kavram) | PROPOSED | |
| Vekâlet | Role Delegation | Belirli süreli rol ataması | — | proxy, deputy | PROPOSED | |
| İşlem yapılan rol | Acting Role | Çoklu rolü olan kullanıcının işlemi yaptığı rol | — | current_role | PROPOSED | |
| İşveren | Client | Bizi işe alan ana firma/idare | Employer (sözleşme metinlerinde) | customer, company | OPEN | FIDIC "Employer" kullanır; ürün satışı müşterisiyle aynı varlık mı ayrı mı Phase 01'de netleşir |
| Kurum / İdare | Authority | Projeyi onaylayan kamu kurumu | — | institution | PROPOSED | |
| Proje | Project | Sözleşmeli iş; 1..N şantiye | — | job | PROPOSED | |
| Şantiye | Site | Projenin fiziksel uygulama yeri | — | construction_site, workplace | PROPOSED | |
| Duvar | Wall | Proje içindeki duvar birimi | — | structure | PROPOSED | |
| Toprakarme | Reinforced Earth (MSE wall) | Çelik şerit donatılı zemin duvarı | mechanically stabilized earth | — | PROPOSED | Kodda `mse` kısaltması kullanılmaz |
| Panel tipi | Panel Type | C4, C5… gibi tanımlı panel ölçüsü | — | panel_model | PROPOSED | |
| Kademe (panel sırası) | Panel Rank | Komşu panel tipi sırası | — | level, grade | OPEN | |
| Panel dökümü | Panel Casting | Sahada panelin kalıpta dökülmesi | — | pouring, production | PROPOSED | |
| Döküm seansı | Casting Session | Aynı gün içindeki ayrı döküm | — | batch | PROPOSED | Çift döküm = birden fazla session |
| Priz | Curing | Betonun sertleşme süreci | — | — | PROPOSED | |
| Montaj | Panel Installation | Panelin duvara yerleştirilmesi | erection | assembly, mounting | PROPOSED | |
| Çelik şerit | Steel Strip | Galvaniz kaplı donatı şeridi | reinforcing strip | band, belt | PROPOSED | |
| Şerit montajı | Strip Installation | Şeritlerin serilip lug'a bağlanması | — | strip_laying | PROPOSED | |
| Lug | Tie Strip Lug | Panele gömülen bağlantı elemanı | lug | — | OPEN | Sektörde "lug / tie strip" |
| Harpuşta | Coping | Duvar üst başlığı | — | cap | PROPOSED | |
| Dolgu | Backfill | İşverenin serip sıkıştırdığı dolgu | — | fill_material | PROPOSED | |
| Teslim-tesellüm | Handover | Alanın işverene/işverenden teslimi | — | delivery | PROPOSED | `handover_to_client`, `handover_from_client` |
| Günlük saha kaydı | Daily Site Log | Şantiyenin günlük ana kaydı | — | daily_report (resmi rapor ayrıdır) | PROPOSED | |
| Resmi günlük rapor | Official Daily Report | Onaylı kayıttan üretilen PDF rapor | — | — | PROPOSED | |
| Puantaj | Timesheet | Bordro amaçlı çalışma günü/saat kaydı | attendance | — | PROPOSED | |
| Faaliyet süresi | Activity Time Entry | Performans amaçlı iş başlangıç-bitiş kaydı | — | work_hours | PROPOSED | Puantajdan ayrıdır |
| Taşeron | Subcontractor | Götürü işçilik yapan ekip | — | contractor | PROPOSED | |
| Götürü işçilik | Unit-Rate Labor | m² vb. birim fiyatla verilen işçilik | — | lump_sum (farklı anlam) | OPEN | |
| Öz kaynak | In-House Crew | Şirket bordrolu ekip | self-performed | own_resource | PROPOSED | |
| İş modeli (şantiye) | Labor Model | `subcontracted` / `in_house` | — | work_model | PROPOSED | |
| Hakediş (işveren) | Client Progress Payment | Dönemsel yapılan iş bedeli talebi | interim payment certificate | invoice | PROPOSED | |
| Taşeron hakedişi | Subcontractor Progress Payment | Taşerona onaylı üretim üzerinden ödeme hesabı | — | — | PROPOSED | |
| Metraj | Quantity | Ölçülen/hesaplanan iş miktarı | quantity take-off (teklif aşaması) | measurement | PROPOSED | |
| İcmal | Summary Sheet | Özet tablo | — | recap | PROPOSED | |
| Birim fiyat | Unit Price | Birim başına fiyat | — | rate | PROPOSED | |
| Kesinti | Deduction | Hakedişten düşülen tutar | — | cut | PROPOSED | |
| Stopaj | Withholding Tax | — | — | — | PROPOSED | |
| Teminat | Performance Guarantee | Sözleşme teminatı | retention (kesinti şeklindeyse) | deposit | OPEN | Teminat mektubu vs nakit kesinti ayrımı |
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
| Fire | Process Loss | İşleme/sevkiyat sırasında oluşan malzeme kaybı | — | waste (belirsiz) | OPEN | Zayi ve hurdadan ayrılmalı |
| Zayi (panel) | Damaged Unit | Kullanılamaz hale gelen panel/ürün | — | waste (belirsiz) | OPEN | Foto + neden zorunlu |
| Hurda | Scrap | Satılabilir hurda malzeme | — | — | PROPOSED | |
| Yan gelir | Ancillary Income | Ana sözleşme dışı gelir | — | side_income, extra | PROPOSED | |
| Cari hesap | Party Account | İşveren/tedarikçi yürüyen bakiyesi | account ledger | current_account | OPEN | |
| Tahsilat | Collection | — | receipt | — | PROPOSED | |
| Döviz kuru | Exchange Rate | — | — | currency_rate, kur | PROPOSED | |
| Dönem kapanışı | Period Close | Aylık kapanış | — | month_end | PROPOSED | |
| Revizyon talebi | Revision Request | Onaylı kayıt değişiklik talebi | — | edit_request | PROPOSED | |
| Onay | Approval | — | — | confirmation | PROPOSED | |
| Düzeltme isteği | Correction Request | Kaydı düzeltmeye geri gönderme | — | rejection (farklı) | PROPOSED | |
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
