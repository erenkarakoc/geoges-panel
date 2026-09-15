# Modül Haritası ve Bağımlılık Grafiği

Durum: Taslak (Phase 03'te kesinleşir) · 2026-09-15

Mimari: modüler monolit (ADR-001). Bir modül başka modülün tablosuna doğrudan erişemez; açık uygulama arayüzünü kullanır veya olayına abone olur.

## Modüller

| Kod | Modül | Sorumluluk | Kaynak (Özellik Yapısı) |
|---|---|---|---|
| **Platform** | | | |
| IAM | Identity & Access | Kullanıcı, dinamik rol, çoklu/vekâleten rol, görünürlük, 2FA, oturum | §2 |
| AUD | Audit & History | Değişiklik geçmişi, denetim kayıtları, revizyon talepleri | §37, §37.1, §38 |
| DOC | Documents & Archive | Belge depolama, sürüm, kayda bağlı belgeler, tek pencere arşiv | §33 |
| WFL | Workflow & Rules | Görsel iş akışı motoru, onay merkezi, merkezi kurallar, bağımlılık kilitleri | §4, §13, §24.3–§24.4, Mimari §6, §13 |
| TSK | Tasks & Notifications | Görevler, bildirim merkezi, eskalasyon, günlük özet | §25.1–§25.6 |
| ADM | Master Data & Settings | Merkezi tanımlar, kataloglar, özel alanlar, çalışma takvimi, döviz kuru | §36.1–§36.4, §23.9, §22.5 |
| **Operasyon** | | | |
| PRJ | Projects | Proje kartı, duvarlar, hedefler, iş programı, tedarik matrisi, teknik ofis | §7, §8.1–§8.2, §10.1–§10.2 |
| SIT | Site Operations | Günlük saha kaydı, döküm, montaj, şerit, teslim-tesellüm, faaliyet süreleri, zayi, saha harcaması, onay/düzeltme, taşeron/öz kaynak modeli | §9–§13, §15, §44 |
| INV | Inventory | Malzeme kataloğu, lokasyonlu stok defteri, kantar/tır, sayım, açılış, kombinasyon, tüketim maliyeti, sarf reçetesi, fire/hurda | §18.1, §18.4–§18.15, §19, §20.1 |
| PUR | Purchasing | Tedarikçiler, siparişler, genel satın alma talepleri | §18.2–§18.3, §18.16 |
| FAC | Factory | Fabrika günlük kaydı, şerit/lug üretim zinciri, birim maliyet, teknik iyileştirme işleri | §17 |
| EQP | Equipment & Vehicles | Envanter kartı, transfer, amortisman, bakım, vinç günlük kaydı, araç zimmet/devir, atıl kaynak | §21, §20.3–§20.4 |
| **Ticari & Finans** | | | |
| CRM | Leads & Clients | Talep/iletişim günlüğü, işveren kartı ve karnesi, ihale takibi | §5 |
| QTE | Quotes & Sales | Teklif, marj, çoklu kur, teklif belgesi, maliyet geri beslemesi, ürün satışı | §6 |
| FIN | Finance | Hakediş (işveren/taşeron), gelir/gider, yan gelir, cari, nakit projeksiyonu, fatura/ödeme takibi, dönem kapanışı | §16, §20.2, §22 |
| **Kurumsal** | | | |
| HR | Human Resources | Personel kartı, puantaj, bordro, izin, giriş/çıkış checklist, zimmet uyarısı, faaliyet raporu | §23.1–§23.8 |
| CMP | Contracts & Compliance | Sözleşme şartları, yükümlülükler, tetikleyiciler, işveren gecikme kanıtı, teminat, süreli belgeler | §24, §31 |
| QHS | Quality & OHS | Sertifikalar, saha kalite kontrolleri, uygunsuzluk/DÖF, İSG olayları, eğitimler | §29, §30 |
| MTG | Meetings & Decisions | Toplantı kaydı, kararlar, karar takibi | §32 |
| SUP | Internal Support | İç destek talepleri, mesajlaşma, sevk | §25.7 |
| **Analiz & Yönetim** | | | |
| RPT | Reporting & Cockpit | Sahip cockpit'i, dikkat bölümü, şantiye detayı/tanı, resmi günlük rapor, raporlar, dışa aktarım | §3, §14, §34 |
| PRF | Performance | Metrikler, KPI kataloğu, sıralama, hedef ve prim | §28 |
| INT | Intelligence | Öneriler, hızlandırma senaryoları, kaynak optimizasyonu | §8.3–§8.4, §26, §27 |
| STR | Strategy & Planning | Yıllık hedefler, bütçe-gerçekleşen, yatırım analizi, what-if, şirket sağlık karnesi | §35 |
| **Ertelenen** | | | |
| MIG | Data Import | Excel / eski panel / Drive aktarımı (DEF-001) | §36.5, §33.4 |

## Bağımlılık grafiği

Oklar "şuna bağımlıdır / şunu okur" anlamındadır. Tüm iş modülleri platform modüllerine (IAM, AUD, DOC, WFL, TSK, ADM) bağımlıdır; grafik okunabilirlik için bunu tek kutuda gösterir.

```mermaid
flowchart TB
  subgraph PLATFORM[Platform]
    IAM --- AUD --- DOC --- WFL --- TSK --- ADM
  end

  PRJ --> PLATFORM
  SIT --> PRJ
  PUR --> ADM
  INV --> PRJ
  INV --> PUR
  SIT -. "events: daily_log.approved" .-> INV
  FAC --> INV
  EQP --> PRJ
  FIN --> SIT
  FIN --> INV
  FIN --> EQP
  FIN --> PUR
  HR --> SIT
  HR --> EQP
  FIN --> HR
  CRM --> PLATFORM
  QTE --> CRM
  QTE --> FAC
  QTE -. "won quote → project" .-> PRJ
  CMP --> PRJ
  CMP --> SIT
  CMP --> HR
  QHS --> INV
  QHS --> HR
  MTG --> TSK
  SUP --> TSK
  RPT --> SIT
  RPT --> FIN
  RPT --> INV
  RPT --> EQP
  PRF --> SIT
  PRF --> FIN
  PRF --> QTE
  PRF --> QHS
  INT --> RPT
  INT --> PRF
  STR --> FIN
  STR --> INT
  MIG -.-> INV
  MIG -.-> HR
  MIG -.-> DOC
```

## Temel olay akışları (taslak)

| Olay | Yayınlayan | Tepki veren |
|---|---|---|
| `daily_log.approved` | SIT | INV (tüketim), FIN (hakediş önerisi, taşeron hakedişi, maliyet), HR (puantaj), PRF (metrikler), RPT (özetler) |
| `stock_movement.recorded` | INV | FIN (maliyet), RPT, INT (kritik stok) |
| `progress_payment.approved_by_client` | FIN | TSK/WFL (fatura görevi) |
| `employee.offboarding_started` | HR | CMP (tetikleyici checklist), EQP (zimmet kontrolü) |
| `quote.won` | QTE | PRJ (proje başlangıcı), CMP (sözleşme kaydı) |
| `meeting_decision.created` | MTG | TSK (görev) |
| `certificate.expiring` | QHS | TSK (yenileme görevi) |
| `period.closed` | FIN | RPT (kesinleşmiş raporlar) |

Olay kataloğu Phase 01'de `docs/domain/` altında tamamlanır.
