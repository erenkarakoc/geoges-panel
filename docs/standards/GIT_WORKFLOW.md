# Git Çalışma Kuralları

Durum: Kabul edildi · 2026-09-15 · Son güncelleme: 2026-09-18 (D-109)

## Klon başına tek seferlik kurulum

Depoyu her klonlayan, kayıt tutarlılık kapısını açmak için bir kez şunu çalıştırır:

```
git config core.hooksPath .githooks
```

Bu, `.githooks/` altındaki iki kancayı devreye alır: `pre-commit` tam kontrolü çalıştırıp kırmızı commit'i reddeder, `post-commit` commit'i otomatik push eder (`ai/PROJECT_RULES.md` §21.3, D-110). Kurulmadıysa `npm run records` uyarı basar. Gerçek bir acil durumda `git commit --no-verify` ile aşılabilir; aşıldığında sebebi `ai/CHANGELOG.md`'ye yazılır — sessiz atlama, kayıtların en baştan bozulma biçimidir.

- Uzak repo: `github.com/erenkarakoc/geoges-panel` (private). Varsayılan dal: `main`.
- **Tek dal: `main` (sahip kararı D-109, 2026-09-18).** Tüm iş doğrudan `main` üzerinde, küçük ve sık commit'lerle yapılır; özellik dalı ve pull request kullanılmaz. `main` her commit'te yeşil kalır: commit'ten önce `npm run check` geçer, pre-commit kapısı kayıt tutarlılığını zorlar. Bir commit `main`'i kırarsa, yeni iş eklenmeden önce o düzeltilir.
- **Tek istisna — spike:** spike kodu ürüne alınmaz (ADR-007). Spike gerekiyorsa geçici bir `spike/` dalında yapılır, `main`'e hiçbir zaman birleştirilmez; bulgular `docs/architecture/spikes/` altına yazılır ve dal silinir.
- Commit mesajı: Conventional Commits + ilgili ID. Örnek: `feat(inv): record weighbridge ticket (TASK-0214)`. Türler: `feat, fix, refactor, docs, test, chore, infra, spike`.
- **Yapay zekâ imzası yasak (sahip kararı, 2026-09-16):** commit mesajlarına ve PR açıklamalarına `Co-Authored-By: Claude …` veya başka bir yapay zekâ aracının imza/tanıtım satırı (ör. "Generated with …") eklenmez. Bu kural tüm yapay zekâ araçları için geçerlidir (Claude Code, Codex vb.). Geçmişteki bu satırlar 2026-09-16'da tüm dallardan temizlenmiştir.
- CI kurulduğunda (Phase 07) `main`'e her push'ta çalışır; kırmızı CI düzeltilmeden yeni iş commit edilmez.
- Geçmiş: Phase 00'da ve 2026-09-18'deki CHG-005/CHG-006 işlerinde `main`'e doğrudan yazılması istisna olarak kaydedilmişti; D-109 ile bu artık kuraldır.
- **Commit ve push (D-110):** commit'ler iş ilerledikçe küçük adımlarla atılır. `pre-commit` kancası her commit'ten önce tam kontrolü çalıştırır (`npm run check:commit`: kayıtlar katı modda, tip, lint, test, biçim) ve kırmızıysa commit'i reddeder. `post-commit` kancası `main`'deki her commit'i otomatik olarak `origin/main`'e gönderir; push başarısız olursa commit yerelde durur ve uyarı basılır.
- Sırlar, `.env` dosyaları ve gerçek kişisel veri asla commit edilmez.
- Sürüm etiketleri: `vMAJOR.MINOR.PATCH`; production deploy'ları etiketlenir.
