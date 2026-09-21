# SPIKE-17 — Mimari sınır denetiminin CI'da uygulanması

Durum: GEÇTİ · Tarih: 2026-09-21 · Görev: TASK-0098 · Bağlı: ADR-001, `docs/architecture/MODULE_BOUNDARIES.md`, `docs/architecture/MODULE_MAP.md`

**Neden var.** Yol haritası Phase 06'nın aday listesinde "mimari sınır denetim araçları"nı sayıyordu, ama bu aday onaylanan 16 denemelik listeye girmemiş ve feragat kaydı da yoktu. Faz çıkışından önce fark edildi; sahip 2026-09-21'de sınanmasına karar verdi.

**Soru.** Modüller arası sınırlar CI'da güvenilir biçimde denetlenebiliyor mu? Alt sorular: izin verilen bağımlılıklar MODULE_MAP'ten otomatik türetilebilir mi ve grafik döngüsüz mü; başka modül yalnız `index.ts` üzerinden kullanılabilir mi; bilinen kaçak yolları yakalanıyor mu; bir modülün başka modülün tablosuna erişimi yakalanıyor mu?

## Yöntem

Deney kodu geçicidir (`spike17.mjs`); repoya hiçbir şey eklenmedi. Scratchpad'de küçük bir sahte modül projesi kuruldu (SIT, PRJ, INV, QTE, FIN) ve **reponun kendi kurulumuyla** denetlendi: ESLint 9 ve projede zaten kurulu `eslint-plugin-boundaries` 7.2.0. Yeni paket indirilmedi.

- İzin verilen modül kenarları MODULE_MAP'teki Mermaid grafiğinin düz oklarından (`FIN --> SIT`) okunup ESLint politikasına dönüştürüldü. Kesikli oklar (olaylar) kod bağımlılığı sayılmadı.
- Eklentinin 7.2.0 sürümünde `entry-point` kuralı kullanımdan kalkmış; "yalnız `index.ts`" şartı `dependencies` politikasındaki `fileInternalPath` ile ifade edildi.
- Tablo sahipliği için şema öneki = modül kodu kuralı kullanıldı (şema belgelerinde `sit.`, `fin.`, `inv.` …). Her modülün kaynak kodundaki dizge ve şablon dizgeleri TypeScript ayrıştırıcısıyla çıkarılıp başka modül şemasına başvuru arandı.

## Sonuçlar — 14/14 kontrol geçti

| # | Kontrol | Sonuç |
|---|---|---|
| G1 | Modül bağımlılıkları MODULE_MAP'ten otomatik okundu | 34 düz kenar |
| G2 | Bağımlılık grafiği döngüsüz | döngü yok |
| E1 | Grafikte izinli kenar yalnız `index.ts` üzerinden kullanılabilir | FIN→SIT, SIT→PRJ izinli |
| E2 | Modül kendi iç dosyalarını serbestçe kullanır | izinli |
| E3 | Başka modülün `domain/` ve `data/` klasörüne erişim | engellendi |
| E4 | Göreli yolla kaçak (`../../sit/domain/…`) | engellendi |
| E5 | Grafik yönüne aykırı bağımlılık (SIT→FIN, PRJ→QTE) | engellendi |
| E6 | Yalnız tip içeren iç erişim (`import type`) | engellendi |
| E7 | Dinamik `import()` ile iç erişim | engellendi |
| E8 | Yeniden dışa aktarma (`export * from`) ile iç erişim | engellendi |
| E9 | İhlal varsa CI kırılır | 8 hata, çıkış kodu 1 |
| T1 | FIN'in SQL'inde SIT şemasına erişim (şablon dizgesi dahil) | yakalandı |
| T2 | Kendi şemasına erişim ve yorumdaki benzer metin ihlal sayılmaz | yanlış alarm yok |
| R1 | Gerçek repo bugünkü sınır kuralıyla temiz | 62 dosya, 0 ihlal |

Hem izin verilen hem engellenen durumlar beklendiği gibi sonuçlandı; yani kural her şeyi körlemesine engellemiyor, doğru nedenle engelliyor.

## Tasarım için bulgular

1. **Grafik tek kaynak olabilir.** İzin verilen modül bağımlılıkları MODULE_MAP'ten otomatik üretilebiliyor; belge ile lint kuralı birbirinden kopamaz. Grafiğe yeni bir ok eklenmeden yeni bir bağımlılık kurulamaz.
2. **Eklenti bilinen kaçakları kapatıyor:** göreli yol, yalnız tip içe aktarımı, dinamik içe aktarım ve yeniden dışa aktarma.
3. **Belge tutarsızlığı bulundu.** MODULE_BOUNDARIES bölüm 3, QTE'nin kazanılan teklifte PRJ'nin `createDraftProject` komutunu **senkron** çağırdığını söylüyor; MODULE_MAP ise bu kenarı **kesikli** (olay) çiziyor. Üretilen kural kesikli okları kod bağımlılığı saymadığı için bu komut çağrısı bugün engellenir. İki belgeden hangisinin geçerli olduğu, QTE modülü tasarlanırken (Slice 5) netleştirilmelidir.

## Sınırlar

1. Tablo sahipliği denetimi yalnız kaynak koddaki sabit SQL dizgelerini görür. Çalışma anında birleştirilen tablo adları veya bir ORM katmanı bunu atlatabilir. Daha güçlü tamamlayıcı veritabanı tarafındadır: her modülün veri katmanı yalnız kendi şemasına yetkili bir rolle bağlanır. Bu Phase 07'de tasarlanmalıdır.
2. Yetenek kataloğu ile kodun karşılaştırılması (MODULE_BOUNDARIES bölüm 5'in birinci ve ikinci sözleşme testi) bu denemenin kapsamında değildir; katalog kodu Phase 07'de yazılınca eklenir.
3. Denetim sahte bir modül projesinde yapıldı; gerçek 25 modülün kuralı Phase 07'de yazılacak.

## Phase 07'ye taşınanlar

1. `eslint.config.mjs` içindeki bugünkü "modüller arası tamamen yasak" kuralı, MODULE_MAP'ten üretilen "grafikte izinli kenar + yalnız `index.ts`" kuralıyla değiştirilir (MODULE_BOUNDARIES bölüm 2'nin öngördüğü gevşetme).
2. Kural MODULE_MAP'ten üretilir ve CI'da, grafiğin döngüsüz olduğu da ayrıca denetlenir.
3. Tablo sahipliği için hem statik SQL denetimi hem modül başına veritabanı yetkisi.
4. QTE→PRJ kenarının senkron komut mu olay mı olduğu netleştirilir.

Kanıt: dış scratchpad'de `spike17-evidence-*.json`.
