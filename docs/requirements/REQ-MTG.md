# REQ-MTG — Toplantı, Aksiyon ve Karar Defteri

Durum: DRAFT · 2026-09-19 · Modül: MTG (Meetings)

Kaynaklar: Özellik Yapısı §32; kararlar D-199, D-200.

**Sınır.** Görevin kendisi ve eskalasyon REQ-TSK'dadır; toplantı kararından açılan iş bir görevdir. "Dikkat" bölümü REQ-RPT-007'dedir. Toplantı belgeleri arşivde de görünür (REQ-DOC).

Terimler (`docs/domain/GLOSSARY.md`): Meeting, Meeting Minutes, Meeting Decision, Task.

---

## A. Toplantı

### REQ-MTG-001 — Toplantı kaydı

- Kaynak: §32, §32.1
- Öncelik: Must · Kademe: T2
- Katman: Sabit
- Açıklama: Toplantılar sözlü hafızada kalmaz. Her toplantıda tarih, başlık, katılımcılar, gündem ve notlar tutulur; toplantı isteğe bağlı olarak bir projeye veya şantiyeye bağlanır.
- Kabul kriterleri:
  - [ ] Katılımcılar panel kullanıcılarından seçilir; panel hesabı olmayan katılımcı adıyla eklenir.
- Durum: DRAFT

### REQ-MTG-002 — Toplantıyı kim görür

- Kaynak: D-199
- Öncelik: Must · Kademe: T1
- Katman: Sabit
- Açıklama: Bir projeye veya şantiyeye bağlı toplantıyı o kapsamı görebilen herkes görür; hiçbir kapsama bağlı olmayan toplantıyı yalnızca katılımcılar görür. Sahipler her toplantıyı görür (REQ-IAM-023). Bir kararın sorumlusu, toplantıyı göremese bile kendi kararını görür.
- Kabul kriterleri:
  - [ ] Kapsamı dışındaki bir toplantı, kullanıcının listesinde, aramada ve arşivde görünmez.
- Durum: DRAFT

### REQ-MTG-003 — Tutanak kaydedilince kesinleşir

- Kaynak: D-200
- Öncelik: Must · Kademe: T2
- Katman: Sabit
- Açıklama: Toplantıyı yazan kişinin kaydı esastır; katılımcı onayı veya itiraz süreci yoktur. Tutanak kaydedilince kesinleşir ve kilitlenir; sonradan değişiklik revizyon talebiyle yapılır (REQ-AUD-008).
- Kabul kriterleri:
  - [ ] Kesinleşmiş tutanağın alanları doğrudan düzenlenemez.
- Durum: DRAFT

## B. Kararlar

### REQ-MTG-004 — Karar kaydı

- Kaynak: §32.2
- Öncelik: Must · Kademe: T1
- Katman: Sabit
- Açıklama: Her kararda ne karar verildiği, sorumlu kişi veya rol, son tarih, durum ve belge/ek bulunur.
- Kabul kriterleri:
  - [ ] Sorumlusu ve son tarihi olmayan karar kaydedilmez.
- Durum: DRAFT

### REQ-MTG-005 — Karar görev açar

- Kaynak: §32.2
- Öncelik: Must · Kademe: T1
- Katman: Sabit + Akış
- Akışla ayarlanan: görevin hatırlatması ve eskalasyonu
- Açıklama: Karar kaydedilince sorumlusuna son tarihli görev açılır; görev karara bağlıdır.
- Kabul kriterleri:
  - [ ] Görevden karara ve karardan toplantıya tek adımda gidilir.
- Durum: DRAFT

### REQ-MTG-006 — Tüm kararlar tek listede

- Kaynak: §32.3
- Öncelik: Must · Kademe: T1
- Katman: Sabit + Akış
- Akışla ayarlanan: geciken kararın uyarısının kime gideceği
- Açıklama: Şirketin bütün kararları tek listede açık, tamamlandı ve gecikti olarak görünür (her kullanıcı kendi görebildiği kadarını görür). Geciken karar "Dikkat" bölümüne çıkar.
- Kabul kriterleri:
  - [ ] Liste toplantı, proje, sorumlu, durum ve tarihe göre süzülür.
- Durum: DRAFT

### REQ-MTG-007 — Karar ve görevi birlikte kapanır

- Kaynak: §32.3
- Öncelik: Must · Kademe: T1
- Katman: Sabit
- Açıklama: Karar tamamlandığında ona bağlı görev de kapanır; görev tamamlandığında karar da tamamlanır. "Geçen toplantıda bunu konuşmuştuk, ne oldu?" sorusunun cevabı kararın geçmişindedir.
- Kabul kriterleri:
  - [ ] Karar ile bağlı görevinin durumu hiçbir zaman ayrışmaz.
- Durum: DRAFT

### REQ-MTG-008 — Önceki toplantının açık kararları gündeme gelir

- Kaynak: §32.3
- Öncelik: Should · Kademe: T2
- Katman: Sabit
- Açıklama: Aynı projeye veya şantiyeye bağlı yeni bir toplantı açılınca, önceki toplantılarda alınmış ve hâlâ açık olan kararlar gündemde ayrı bir bölüm olarak gelir (§32.3'ten türetilen kural, bu dosyanın onayıyla kesinleşir).
- Kabul kriterleri:
  - [ ] Gündeme gelen her açık karar, alındığı toplantıya bağlantı taşır.
- Durum: DRAFT

---

## Yetenek kataloğu — MTG

Biçim: `docs/requirements/README.md`.

### Olaylar

| Kod | Ad | Ne zaman | Taşıdığı alanlar | Veri sınıfı |
|---|---|---|---|---|
| `meeting.recorded` | Toplantı kaydedildi | Tutanak kesinleştiğinde | toplantı, kapsam, karar sayısı | iç |
| `meeting_decision.created` | Karar alındı | Karar kaydedildiğinde | karar, sorumlu, son tarih | iç |
| `meeting_decision.overdue` | Karar gecikti | Son tarih geçtiğinde | karar, sorumlu, gecikme | iç |
| `meeting_decision.completed` | Karar tamamlandı | Tamamlandığında | karar, tamamlayan | iç |

### Aksiyonlar

Yok.

### Koşul alanları

| Kod | Ad | Tip | Veri sınıfı |
|---|---|---|---|
| `meeting_decision.days_overdue` | Karar gecikme günü | sayı | iç |
