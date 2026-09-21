# Ekran Envanteri

Durum: CONFIRMED (sahip, 2026-09-19) · Son güncelleme: 2026-09-22

Panelin bütün ekranları, her birinin karşıladığı gereksinimler ve varsayılan olarak kimin gördüğü. Menü yapısı CHG-004'te kuruldu (D-054…D-070) ve burada değişmez; iki ekranın yeri ve ayrı "Raporlar" girişi 2026-09-19'da belirlendi (D-217, D-218). Roller `docs/domain/PERMISSION_MATRIX.md` kısaltmalarıyla yazılır; "Herkes" rolün kapsamı kadar demektir. Her ekranın durum matrisi (yükleniyor, boş, hata, yetki yok…) ve COSS bileşenleri bu envanterin sonraki adımında eklenir.

**Tür:** L liste · D detay · F form veya giriş · P pano (özet göstergeler) · Ö özel ekran · Ç çekmece veya pencere · S sekme (bir ekranın içinde).

**Ortak şablonlar.** Her L ekranı standart liste (REQ-NFR-013), her D ekranı standart detay (REQ-NFR-014), her F ekranı standart form (REQ-NFR-015) kalıbını kullanır. Her D ekranında "Belgeler" (REQ-DOC-001…002) ve "İşlem geçmişi" (REQ-AUD-001…004, REQ-WFL-016) bölümleri vardır; kilitli kayıtta düzenleme yerine "Revizyon talep et" (REQ-AUD-007…008) görünür. Bütün ekranlar aynı kullanım dilinde, açık/koyu görünümde, kurumsal renklerle, telefonda yatay kaydırmasız ve WCAG 2.2 AA hedefiyle yapılır (REQ-NFR-006…011, REQ-NFR-016).

## Giriş ve hesap

| ID | Ekran | Tür | Adres | Gereksinimler | Roller |
|---|---|---|---|---|---|
| SCR-001 | Giriş | F | `/sign-in` | REQ-IAM-001, REQ-IAM-002, REQ-IAM-005 | Herkes |
| SCR-002 | İki adımlı doğrulama | F | `/sign-in/verify` | REQ-IAM-003 | Herkes |
| SCR-003 | Parola sıfırlama | F | `/reset-password` | REQ-IAM-004 | Herkes |
| SCR-004 | Rol yönlendirmesi (ilk giriş) | Ö | `/onboarding` | REQ-IAM-027 | Herkes |
| SCR-005 | Hesabım: parola, iki adım, vekâletim, tema | Ç | kullanıcı menüsü | REQ-IAM-004, REQ-IAM-018, REQ-IAM-019, REQ-NFR-010 | Herkes |

## Çalışma katmanı

| ID | Ekran | Tür | Adres | Gereksinimler | Roller |
|---|---|---|---|---|---|
| SCR-010 | Bugün | P | `/today` (eski `/dashboard` kalıcı yönlendirilir) | REQ-RPT-001…005, REQ-RPT-007…009, REQ-CRM-008, REQ-PRJ-011 | Herkes (role göre kurulur) |
| SCR-011 | Sistem gözü (Bugün içinde ikinci sekme) | S | `/today` | REQ-RPT-010, REQ-RPT-011 | SAH, GM |
| SCR-012 | Onaylar (kuyruk) | Ö | `/approvals` | REQ-WFL-012…016, REQ-WFL-031, REQ-SIT-031, REQ-IAM-020, REQ-IAM-025, REQ-IAM-026 | Önüne onay düşen herkes |
| SCR-192 | Revizyon talepleri (Onaylar'da sekme, D-223) | S | `/approvals/revision-requests` | REQ-AUD-007…010 | Onaylayıcılar; talep eden kendi talebi |
| SCR-013 | Görevler | L | `/tasks` | REQ-TSK-001…008 | Herkes |
| SCR-014 | Görev ver | F | `/tasks/new` | REQ-TSK-003, REQ-TSK-004 | Herkes (kapsamı kadar) |
| SCR-015 | Bildirim çekmecesi | Ç | üst bar | REQ-TSK-009…012, REQ-NFR-009 | Herkes |
| SCR-016 | Arama ve komut paleti | Ç | üst bar, kısayol | REQ-NFR-012 | Herkes |
| SCR-017 | Raporlar (çalışma katmanında, Görevler'in altında) | L | `/reports` | REQ-RPT-015…019, REQ-RPT-023 | Herkes yetkisi olan raporları görür; hiç raporu yoksa öğe görünmez |

Günlük özet e-postası (REQ-TSK-013) ve telefon bildirimleri (REQ-TSK-010, REQ-NFR-008) ekran değil, bildirim kanalıdır.

## Şantiye & Günlük

| ID | Ekran | Tür | Adres | Gereksinimler | Roller |
|---|---|---|---|---|---|
| SCR-020 | Günlük saha kayıtları | L | `/daily-site-logs` | REQ-SIT-002, REQ-SIT-010…012 | SAH, GM, GK, KO, SM, FO |
| SCR-021 | Günlük saha kaydı girişi | Ö | `/daily-site-logs/[id]` | REQ-SIT-003…009, REQ-SIT-013…030, REQ-SIT-033, REQ-SIT-035, REQ-EQP-011, REQ-INV-025 | KO, SM, FO; TEB kendi bölümü |
| SCR-022 | Projeler | L | `/projects` | REQ-PRJ-001, REQ-PRJ-003 | SAH, GM, GK, KO, SM, FO, TO, SAT, MUH, SAL, KIS |
| SCR-023 | Proje detayı | D | `/projects/[id]` | REQ-PRJ-002, REQ-PRJ-003, REQ-PRJ-005, REQ-PRJ-008, REQ-PRJ-010, REQ-PRJ-011, REQ-CMP-010, REQ-CMP-011, REQ-FIN-006, REQ-FIN-007, REQ-INV-008 (kapanış bölümü) | Projeler ile aynı; ticari alanlar "t" izniyle |
| SCR-024 | Proje revizyonu ve duvar hedefleri | F | `/projects/[id]/revisions` | REQ-PRJ-006, REQ-PRJ-007, REQ-PRJ-009, REQ-SIT-017 | TO; onay akışla |
| SCR-025 | Tedarik matrisi | F | `/projects/[id]/supply` | REQ-PRJ-004 | SAH, GM, GK, TO |
| SCR-026 | Şantiyeler (özet tablo) | L | `/sites` | REQ-SIT-001, REQ-RPT-006 | SAH, GM, GK, KO, SM, FO, TO, MUH, IK, SAL, KIS |
| SCR-027 | Şantiye detayı | D | `/sites/[id]` | REQ-SIT-001, REQ-SIT-025, REQ-SIT-034, REQ-RPT-012…014, REQ-EQP-006 | Şantiyeler ile aynı |
| SCR-028 | Öneriler | L | `/insights` | REQ-INT-001…006 | SAH, GM, GK, KO; diğerleri kapsamı kadar |
| SCR-029 | Kaynak eşleştirme ve transfer önerileri | Ö | `/insights/resources` | REQ-INT-007…010 | SAH, GM, GK, KO |
| SCR-030 | Hızlandırma senaryoları | Ö | `/projects/[id]/scenarios` | REQ-INT-011…014 | SAH, GM, GK, KO |
| SCR-031 | Günlük raporlar (resmi günlük saha raporu) | L | `/daily-reports` | REQ-RPT-020…022 | SAH, GM, GK, KO, SM |

## Kaynak & Üretim

| ID | Ekran | Tür | Adres | Gereksinimler | Roller |
|---|---|---|---|---|---|
| SCR-040 | Stok özeti (lokasyon × süreç durumu) | P | `/inventory` | REQ-INV-002, REQ-INV-007, REQ-INV-013, REQ-INV-024, REQ-QTE-016 | SAH, GM, GK, KO, SM, TO, SAT, MUH, SAL, FAB, KIS |
| SCR-041 | Malzeme detayı ve hareket dökümü | D | `/inventory/materials/[id]` | REQ-INV-001, REQ-INV-003, REQ-INV-004, REQ-INV-009, REQ-INV-017…023 | Stok ile aynı; maliyet "t" izniyle |
| SCR-042 | Malzeme çıkış talebi | F | `/inventory/issue-requests` | REQ-INV-005 | SM, FO, KO; onay akışla |
| SCR-043 | Sevkiyat ve tır kaydı | F | `/inventory/shipments` | REQ-INV-006, REQ-INV-010…012 | SAL, FAB, SM |
| SCR-044 | Stok sayımı | F | `/inventory/counts` | REQ-INV-014 | SAL, FAB, SM; onay akışla |
| SCR-045 | Açılış stoku | F | `/inventory/opening` | REQ-INV-015 | SAL; onay akışla |
| SCR-046 | Şerit kombinasyon önerisi | Ö | `/inventory/strip-combination` | REQ-INV-016 | SAL, SM |
| SCR-047 | Sarf ve olağan dışı tüketim | Ö | `/inventory/consumables` | REQ-INV-025, REQ-INV-026 | SM, KO, SAL |
| SCR-048 | Fire ve hurda zinciri | Ö | `/inventory/scrap` | REQ-INV-027, REQ-FIN-012 | SAL, FAB, MUH |
| SCR-050 | Tedarikçiler | L | `/purchasing/suppliers` | REQ-PUR-001 | SAH, GM, GK, MUH, SAL |
| SCR-051 | Siparişler | L | `/purchasing` | REQ-PUR-003, REQ-PUR-004 | SAH, GM, GK, MUH, SAL |
| SCR-052 | Sipariş detayı ve teslim alım | D | `/purchasing/orders/[id]` | REQ-PUR-003…006, REQ-PUR-011, REQ-CMP-004, REQ-EQP-005 | SAL; diğerleri görür |
| SCR-053 | Tedarikçi karşılaştırması | Ö | `/purchasing/compare` | REQ-PUR-002, REQ-PUR-009 | SAL |
| SCR-054 | Satın alma talebi | F | `/purchasing/requests` | REQ-PUR-007, REQ-PUR-008, REQ-PUR-010 | Herkes talep açar; onay akışla |
| SCR-060 | Varlıklar | L | `/equipment` | REQ-EQP-001…004, REQ-EQP-016 | SAH, GM, GK, KO, SM, MUH, IK, SAL, FAB, KIS |
| SCR-061 | Varlık kartı | D | `/equipment/[id]` | REQ-EQP-005…007, REQ-EQP-009, REQ-EQP-010, REQ-EQP-012…014, REQ-EQP-017, REQ-EQP-021 | Varlıklar ile aynı; bedel "t" izniyle |
| SCR-062 | Devir-teslim tutanağı | F | `/equipment/[id]/custody` | REQ-EQP-008 | Teslim eden ve alan |
| SCR-063 | Vinç operatör ekranı ve vinç günlük kaydı | Ö | `/equipment/crane-log` | REQ-EQP-018…020 | VO; onay akışla |
| SCR-064 | Periyodik kontroller | L | `/equipment/inspections` | REQ-EQP-015 | SAL, FAB, KIS, KO |
| SCR-070 | Fabrika ana görünümü | P | `/factory` | REQ-FAC-001, REQ-FAC-002 | SAH, GM, GK, FAB, MUH, TO, SAT, IK, SAL, KIS |
| SCR-071 | Fabrika günlük kaydı | F | `/factory/logs/[id]` | REQ-FAC-003…005 | FAB; onay akışla |
| SCR-072 | Üretim zincirleri (şerit, lug) | Ö | `/factory/chains` | REQ-FAC-006, REQ-FAC-007 | FAB, SAL |
| SCR-073 | Fabrika birim maliyeti dökümü | D | `/factory/unit-cost` | REQ-FAC-008, REQ-FAC-009 | SAH, GM, MUH |
| SCR-074 | Teknik iyileştirme işleri | L | `/factory/improvements` | REQ-FAC-010 | FAB |

## Ticari

| ID | Ekran | Tür | Adres | Gereksinimler | Roller |
|---|---|---|---|---|---|
| SCR-080 | Talepler | L | `/leads-clients` | REQ-CRM-001, REQ-CRM-006, REQ-CRM-007 | SAT, TO, SAH, GM, GK, MUH |
| SCR-081 | Hızlı kayıt (telefon, WhatsApp, e-posta) | F | `/leads-clients/new` | REQ-CRM-002, REQ-CRM-003 | Herkes (kapsamı kadar) |
| SCR-082 | Talep detayı | D | `/leads-clients/leads/[id]` | REQ-CRM-004, REQ-CRM-014, REQ-QTE-002 | Talepler ile aynı |
| SCR-083 | Firma kartı ve işveren karnesi | D | `/leads-clients/parties/[id]` | REQ-CRM-005, REQ-CRM-009, REQ-CRM-010, REQ-CMP-007, REQ-CMP-017 | Talepler ile aynı; ödeme ve kârlılık "t" izniyle |
| SCR-084 | İhaleler | L | `/leads-clients/tenders` | REQ-CRM-012, REQ-CRM-013 | SAT, TO |
| SCR-090 | Teklifler | L | `/quotes` | REQ-QTE-001, REQ-QTE-002 | SAT, TO, SAH, GM, GK, MUH |
| SCR-091 | Teklif hazırlama | F | `/quotes/[id]` | REQ-QTE-001, REQ-QTE-003…009, REQ-QTE-011, REQ-CRM-011 | SAT, TO |
| SCR-092 | Teklif belgesi önizleme ve gönderim | Ç | `/quotes/[id]/document` | REQ-QTE-012 | SAT, TO |
| SCR-093 | Maliyet geri beslemesi | D | `/quotes/[id]/feedback` | REQ-QTE-010 | SAT, TO, SAH, GM |
| SCR-094 | Satış siparişleri | L | `/quotes/sales-orders` | REQ-QTE-014…018 | SAT, SAL, FAB, MUH |
| SCR-100 | Finans ana ekranı | P | `/finance` | REQ-FIN-020 | SAH, GM, GK, MUH |
| SCR-101 | Hakedişler | L | `/finance/progress-payments` | REQ-FIN-001, REQ-FIN-004, REQ-FIN-005 | SAH, GM, GK, KO, MUH |
| SCR-102 | Hakediş hazırlama | F | `/finance/progress-payments/[id]` | REQ-FIN-001…008 | KO, MUH |
| SCR-103 | Taşeron hakedişi | F | `/finance/subcontractor-payments/[id]` | REQ-FIN-009, REQ-FIN-010, REQ-CMP-003 | KO, MUH; TEB kendi hakedişini görür |
| SCR-104 | Gelir ve gider kayıtları | L | `/finance/entries` | REQ-FIN-011…016 | MUH; KO kendi şantiyeleri |
| SCR-105 | Proje kâr-zararı | D | `/finance/projects/[id]` | REQ-FIN-017 | SAH, GM, GK, KO, MUH |
| SCR-106 | Cari kartı | D | `/finance/party-accounts/[id]` | REQ-FIN-018, REQ-FIN-019 | SAH, GM, MUH; SAL tedarikçi carisi |
| SCR-107 | Nakit projeksiyonu | Ö | `/finance/cash-flow` | REQ-FIN-021…023 | SAH, GM, MUH |
| SCR-108 | Fatura ve ödemeler | L | `/finance/payments` | REQ-FIN-024, REQ-FIN-025 | MUH; onay akışla |
| SCR-109 | Muhasebe aktarımı ve mutabakat | Ö | `/finance/accounting-export` | REQ-FIN-026, REQ-HR-013, REQ-PRF-018 | MUH |
| SCR-110 | Dönem kapanışı | Ö | `/period-close` | REQ-FIN-027…030, REQ-AUD-010 | MUH, SAH, GM; birim sorumluları kendi birimi |
| SCR-111 | Strateji: hedefler, bütçe, yatırım, sağlık karnesi | Ö | `/strategy` | REQ-STR-001…008 | SAH, GM, MUH |

## Kurumsal

| ID | Ekran | Tür | Adres | Gereksinimler | Roller |
|---|---|---|---|---|---|
| SCR-120 | Personel | L | `/human-resources` | REQ-HR-001 | IK, SAH, GM, GK, KO |
| SCR-121 | Personel kartı | D | `/human-resources/[id]` | REQ-HR-001…003, REQ-HR-010, REQ-EQP-007, REQ-QHS-012, REQ-QHS-015, REQ-PRF-013 | IK; hassas alanlar "h" izniyle |
| SCR-122 | Puantaj | Ö | `/human-resources/timesheets` | REQ-HR-004, REQ-HR-005 | IK, KO |
| SCR-123 | Bordro | F | `/human-resources/payroll` | REQ-HR-006…009, REQ-HR-011, REQ-HR-012 | IK, MUH; onay akışla |
| SCR-124 | İzinler | L | `/human-resources/leave` | REQ-HR-014 | Herkes kendi izni; IK, amirler |
| SCR-125 | Giriş ve çıkış kontrol listeleri | Ö | `/human-resources/checklists` | REQ-HR-015 | IK |
| SCR-126 | Günlük faaliyet raporu | F | `/human-resources/activity-reports` | REQ-HR-016 | Yükümlü roller; amirler görür |
| SCR-130 | Sözleşmeler | L | `/compliance` | REQ-CMP-001…005 | SAH, GM, GK, KO, MUH, SAT, SAL |
| SCR-131 | Yükümlülükler ve kilitler | L | `/compliance/obligations` | REQ-CMP-006…009 | SAH, GM, GK, KO, MUH |
| SCR-132 | İşveren gecikme dosyası ve bildirim yazısı | Ö | `/compliance/delay-files` | REQ-CMP-012, REQ-CMP-013 | KO, SAH, GM |
| SCR-133 | Teminatlar | L | `/compliance/guarantees` | REQ-CMP-014, REQ-CMP-015 | MUH, SAH, GM |
| SCR-134 | Süreli belgeler | L | `/compliance/documents` | REQ-CMP-016, REQ-HR-003 | Herkes kapsamı kadar |
| SCR-135 | Uyuşmazlık dosyaları | L | `/compliance/disputes` | REQ-CMP-017 | SAH, GM |
| SCR-140 | Test ve sertifikalar | L | `/quality-safety/certificates` | REQ-QHS-001…003 | KIS, SAL, FAB |
| SCR-141 | Saha kalite kontrolü | F | `/quality-safety/checks` | REQ-QHS-004 | KIS, SM, KO |
| SCR-142 | Uygunsuzluk ve DÖF | L | `/quality-safety/nonconformities` | REQ-QHS-005…008 | KIS, KO, SM; herkes kayıt açar |
| SCR-143 | İSG olayları (kaza, ramak kala) | F | `/quality-safety/incidents` | REQ-QHS-009…011 | Herkes bildirir; KIS yönetir |
| SCR-144 | Eğitimler | L | `/quality-safety/trainings` | REQ-QHS-012 | KIS, IK |
| SCR-145 | Günlük İSG kontrol listesi | F | `/quality-safety/checklist` | REQ-QHS-013 | KIS, SM, FAB |
| SCR-146 | Risk değerlendirmeleri | L | `/quality-safety/risk-assessments` | REQ-QHS-014 | KIS |
| SCR-147 | KKD teslimi | F | `/quality-safety/ppe` | REQ-QHS-015 | KIS, SAL |
| SCR-150 | Puanım | D | `/performance` | REQ-PRF-001, REQ-PRF-002, REQ-PRF-004…007, REQ-PRF-011, REQ-PRF-013, REQ-QHS-016 | Herkes kendi puanı |
| SCR-151 | Ekibin puanlaması | F | `/performance/team` | REQ-PRF-003, REQ-PRF-012 | Amirler |
| SCR-152 | Primler | L | `/performance/bonuses` | REQ-PRF-015…018 | SAH, GM, MUH, IK |
| SCR-153 | Sıralama | Ö | `/performance/ranking` | REQ-PRF-019, REQ-PRF-020 | Sahibin görünürlük politikasına göre |
| SCR-160 | Toplantılar | L | `/meetings` | REQ-MTG-001, REQ-MTG-002 | Herkes kapsamı kadar |
| SCR-161 | Toplantı kaydı | F | `/meetings/[id]` | REQ-MTG-001…005, REQ-MTG-008 | Toplantıyı yazan |
| SCR-162 | Kararlar | L | `/meetings/decisions` | REQ-MTG-006, REQ-MTG-007 | Herkes kapsamı kadar |
| SCR-170 | Arşiv | Ö | `/archive` | REQ-DOC-001…010 | Herkes kapsamı kadar |
| SCR-180 | Destek talepleri | L | `/support` | REQ-SUP-001…005 | Herkes |

## Yönetim

Menü şeridinde grup değildir: kullanıcı menüsündeki "Yönetim" girişiyle açılan, solda kendi alt menüsü olan tek sayfadır (D-223, `docs/ui-ux/ADMINISTRATION.md`). Revizyon talepleri Onaylar'ın sekmesidir (SCR-192, yukarıda).

| ID | Ekran | Tür | Adres | Gereksinimler | Roller |
|---|---|---|---|---|---|
| SCR-190 | Tanımlar (panel ve şerit tipleri, reçeteler, kataloglar, özel alanlar, takvim, kur, bordro parametreleri, KPI kataloğu, teklif şablonları, kontrol listeleri, eşikler ve kurallar) | Ö | `/admin/master-data` | REQ-ADM-001…015, REQ-HR-007, REQ-PRF-008…010, REQ-PRF-014, REQ-QTE-013, REQ-WFL-031 (istisna yetkisini açıp kapatma), REQ-WFL-032, REQ-NFR-005 | SAH, GM; TO, MUH, IK kendi katalogları |
| SCR-191 | Kullanıcılar & Roller | Ö | `/admin/users-roles` | REQ-IAM-002, REQ-IAM-006…017, REQ-IAM-020…024 | SAH; GM ve IK görür |
| SCR-193 | Denetim kayıtları | L | `/audit-log` | REQ-AUD-005, REQ-AUD-006, REQ-IAM-008 | SAH |
| SCR-195 | İş akışları: Akışlar, Şablonlar, Yeni akışlar | L | `/admin/workflows` | REQ-WFL-018, REQ-WFL-023, REQ-WFL-027, REQ-WFL-028 | Akış tasarlama yetkisi olanlar |
| SCR-196 | Akış tasarımcısı, deneme çalıştırması, yayın | Ö | `/admin/workflows/[id]` | REQ-WFL-001…011, REQ-WFL-017, REQ-WFL-019…026, REQ-WFL-029, REQ-WFL-030 | Akış tasarlama yetkisi olanlar |
| SCR-197 | Çalışma günlüğü | L | `/admin/workflows/runs` | REQ-WFL-033, REQ-WFL-034 | Akış tasarlama yetkisi olanlar |
| SCR-198 | Kayıt türleri | Ö | `/admin/record-types` | REQ-WFL-035…039 | pilot sonrası (D-105) |
| SCR-194 | Veri aktarımı | — | `/admin/data-import` | ertelendi (DEF-001) | — |

## Yönetimin soruları → ekranlar (REQ-NFR-004)

| Soru | Cevabı veren ekran |
|---|---|
| Bugün hangi şantiyede ne yapıldı? | SCR-010 Bugün, SCR-026 Şantiyeler, SCR-031 Günlük raporlar |
| Hedefe göre neredeyiz? | SCR-026 Şantiyeler, SCR-027 Şantiye detayı, SCR-023 Proje detayı |
| Hangi ekip daha hızlı ve verimli? | SCR-153 Sıralama, SCR-027 Şantiye detayı (hız göstergeleri) |
| Hangi şantiyede işveren yüzünden bekledik? | SCR-027 Şantiye detayı (bekleme analizi), SCR-132 İşveren gecikme dosyası |
| Neden bu proje zararda? | SCR-027 Şantiye detayı ("Niye zarardayız?"), SCR-105 Proje kâr-zararı |
| Hangi malzeme ne kadar kaldı? | SCR-040 Stok özeti |
| Nerede fire oluştu ve hurdaya ne oldu? | SCR-048 Fire ve hurda zinciri, SCR-041 Malzeme detayı |
| Hangi ekipman nerede ve kaç gündür atıl? | SCR-060 Varlıklar, SCR-029 Kaynak eşleştirme |
| Hangi ekipmanın bakım zamanı geçti? | SCR-064 Periyodik kontroller, SCR-010 Bugün ("Dikkat") |
| Hangi işverenden ne kadar alacağımız var? | SCR-100 Finans ana ekranı, SCR-106 Cari kartı |
| Kime ne kadar borcumuz var? | SCR-100 Finans ana ekranı, SCR-106 Cari kartı |
| Önümüzdeki haftalarda nakit açığı olacak mı? | SCR-107 Nakit projeksiyonu |
| Hangi teklif cevap bekliyor? | SCR-090 Teklifler |
| Hangi teklif gerçekten kârlı? | SCR-093 Maliyet geri beslemesi |
| Geçmişte benzer işi kaça mal ettik? | SCR-093 Maliyet geri beslemesi, SCR-091 Teklif hazırlama (tahmini maliyet önerisi) |
| Hangi personelin görevi gecikti? | SCR-013 Görevler, SCR-010 Bugün ("Dikkat") |
| Bordrolar ve evraklar tamam mı? | SCR-123 Bordro, SCR-110 Dönem kapanışı, SCR-134 Süreli belgeler |
| Hangi sözleşme yükümlülüğünün süresi yaklaşıyor? | SCR-131 Yükümlülükler |
| İşveren hangi yükümlülüğünü geciktirdi? | SCR-131 Yükümlülükler, SCR-083 Firma kartı ve karne |
| Hangi sertifika/eğitim sona yaklaşıyor? | SCR-134 Süreli belgeler, SCR-140 Test ve sertifikalar, SCR-144 Eğitimler |
| Açık İSG aksiyonu var mı? | SCR-143 İSG olayları, SCR-142 Uygunsuzluk ve DÖF |
| Toplantıda aldığımız kararlar uygulandı mı? | SCR-162 Kararlar |
| Şu an şirketin en önemli 5 problemi/fırsatı ne? | SCR-011 Sistem gözü, SCR-028 Öneriler |
| Hangi vinç, araç, makine veya personeli başka yere yönlendirirsek daha fazla kâr ederiz? | SCR-029 Kaynak eşleştirme ve transfer önerileri |
| Bir projeyi daha erken bitirmek gerçekten daha kârlı mı? | SCR-030 Hızlandırma senaryoları |
| Şirketin genel sağlığı bugün, bu hafta ve bu ay nasıl? | SCR-011 Sistem gözü, SCR-111 Strateji (sağlık karnesi) |

## Ekranı olmayan gereksinimler

Şu gereksinimler bir ekran değil, sistemin davranışı veya işletim hedefidir; doğrulamaları testlerde ve Phase 05/06'dadır: REQ-NFR-001 (kaydı olmayan iş tamamlanmış sayılmaz), REQ-NFR-002 (tek resmi kayıt), REQ-NFR-003 (dış kaynak kesintisinde çalışmaya devam), REQ-NFR-017 (yalnız Türkçe arayüz), REQ-NFR-018 (en fazla 1 saat veri kaybı), REQ-NFR-019 (en fazla 4 saat kesinti), REQ-NFR-020 (50–150 kullanıcı), REQ-SIT-032 (onaylanan verinin olayla dağılması).

## Raporlar

Hazır raporların hepsi SCR-017 "Raporlar" ekranında toplanır (D-218); her modülün liste ve pano ekranlarından da ilgili rapora doğrudan geçilir. Dışa aktarım ve kayıtlı görünüm bütün L ve P ekranlarında ortaktır.
