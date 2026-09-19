# Kullanıcı Tanımlı Kayıt Türleri — Saklama Yönü

Durum: CONFIRMED (sahip, 2026-09-20) · Son güncelleme: 2026-09-20

D-079 ile kabul edilen serbest kayıt türü oluşturucunun veri tarafı. CHG-006'nın en zor sorusu ve RISK-010'un konusu. Bu belge yönü belirler; şema Phase 04'te, deneme Phase 06'da, ekran ve yapım Phase 09R'de (pilot sonrası, D-105). Gereksinimler: REQ-WFL-035…039. Görev: TASK-0063. Kararlar: D-241.

## 1. Üç seçenek ve seçim

| Seçenek | Nasıl | Neden seçilmedi / seçildi |
|---|---|---|
| Alan-değer tabloları (EAV) | Her alan değeri ayrı satır | Tek kayıt için onlarca satır; rapor ve sıralama pahalı; yetki ve geçmiş karmaşıklaşır. **Seçilmedi** |
| **Tür başına JSONB satırı** | Ortak `custom_record` tablosunda tür kimliği + alanlar JSONB sütununda; kapsam ve yetki sütunları JSONB dışında | Kayıt başına tek satır; alan başına dizin kurulabilir; RLS normal sütunlarla çalışır; tür değişimi göç istemez. **Seçildi (D-241)** |
| Tür başına gerçek tablo (dinamik DDL) | Kullanıcı tür tanımlayınca tablo yaratılır | Kullanıcı eliyle şema değişikliği; her tablo için ayrı RLS ve göç; yedek ve sürüm yönetimi kırılganlaşır. **Seçilmedi** |

## 2. Yapı

- **Tür tanımı:** ad, menüdeki modül grubu (D-223), alanlar (kod, tip, zorunluluk, veri sınıfı, aranabilir mi), ilişkiler, ekran düzeni, rapor ve "Bugün" katılımı (REQ-WFL-037). Tanım sürümlüdür.
- **Kayıt satırı:** tür kimliği · **kapsam sütunları** (şirket/proje/şantiye, sahip kullanıcı) · durum · JSONB alanlar · oluşturan, zaman, sürüm. Kapsam ve durum JSONB'nin **dışındadır**: yetki ve listeleme bunlarla çalışır.
- **İlişkiler:** ayrı bir bağ tablosunda tutulur (kayıt ↔ hedef kayıt türü ve kimliği). Böylece "bu projeye bağlı özel kayıtlar" sorgusu dizinli çalışır ve çekirdek kayıt silinmeden bağ kopmaz.
- **Alan dizinleri:** aranabilir veya süzülebilir işaretlenen her alan için ifade dizini kurulur; dizinler tür tanımından üretilir, elle yazılmaz.

## 3. Yetki (REQ-WFL-036, D-092)

- Yetki, panelin kendi modelini kullanır: rol bazlı okuma-yazma, kapsam sütunlarıyla satır görünürlüğü, alan başına veri sınıfı.
- RLS politikası ortak tabloda **tek kez** yazılır; her yeni tür yeni politika gerektirmez. Bu, dinamik DDL'e göre en büyük kazanç.
- Hassas işaretli alan, izni olmayanın sorgusundan çıkarılır (`docs/architecture/PERMISSIONS.md` bölüm 3).
- Yetkisi olmayan kullanıcı kullanıcı tanımlı bir kaydı listede, aramada ve raporda göremez (REQ-WFL-036).

## 4. Değişiklik ve geçmiş (REQ-WFL-038, D-094)

- Alan **kaldırılmaz, emekliye ayrılır**: tanımda "kullanımdan kalktı" işaretlenir, JSONB'deki değerler yerinde kalır, ekranlarda görünmez, geçmişte görünür.
- Alan tipi değiştirilemez; yeni alan açılır, eskisi emekliye ayrılır. Böylece geçmiş değerler hiçbir zaman yeniden yorumlanmaz.
- Her değişiklik denetim kaydına yazılır; bu kayıtlar için de "kim neyi değiştirdi" tutulur (D-094).
- Tür silinmez; pasifleşir.

## 5. Sınırlar

| Sınır | Varsayılan | Neden |
|---|---|---|
| Tür sayısı | 50 | Menü ve rapor listesi kullanılabilir kalsın |
| Tür başına alan | 60 | Satır boyutu ve dizin sayısı |
| Aranabilir alan | 10 | Dizin maliyeti |
| İlişki türü | 10 | Sorgu karmaşıklığı |

Sınırlar mühendislik ayarıdır; aşılmak istenirse o ihtiyaç muhtemelen gerçek bir modüldür.

## 6. Yapamayacakları (REQ-WFL-039)

- Deftere yazmaz: para, stok, puantaj ve maliyet hesaplarına girmez.
- Çekirdek kayıtların alanlarını değiştirmez; yalnız onlara bağ kurar.
- Kendi hesaplama dili yoktur; toplam ve sayım gibi türetilmiş değerler rapor tarafında üretilir.
- Akışlarda kullanılabilir: kendi olaylarını (`custom_record.created`, `.status_changed`) yayımlar ve alanları koşul alanı olarak açılır. Aksiyon olarak yalnız "taslak oluştur" ve "durum değiştir" verilir (D-095).

## 7. Arama ve rapor

- Aranabilir alanlar, çekirdek kayıtlarla aynı arama satırına yazılır (D-239); tür adı sonuçlarda grup olur.
- Raporlar, türün kendi tanımından üretilen basit liste ve özet raporlarıdır (REQ-WFL-035); yeni rapor türü geliştirmek gerekmez (D-207).
- "Bugün" ekranına katılması seçilirse yalnız sayı gösterilir.

## 8. Devredilenler

- **Phase 04:** `custom_record`, tanım, bağ ve dizin tablolarının şeması; JSONB alanlarının doğrulanması; ortak RLS politikası.
- **Phase 06 denemesi (RISK-010):** bir türün uçtan uca sınanması — tanım, veri girişi, RLS, arama, rapor, alan emekliye ayırma — ve on binlerce kayıtta sorgu süresi.
- **Phase 09R:** ekranlar ve oluşturucu deneyimi, pilot sonrası gerçek kullanımla.
