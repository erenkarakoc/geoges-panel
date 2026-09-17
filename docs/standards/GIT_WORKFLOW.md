# Git Çalışma Kuralları

Durum: Kabul edildi · 2026-09-15 · Son güncelleme: 2026-09-17 (CHG-005)

## Klon başına tek seferlik kurulum

Depoyu her klonlayan, kayıt tutarlılık kapısını açmak için bir kez şunu çalıştırır:

```
git config core.hooksPath .githooks
```

Bu, `.githooks/pre-commit` kancasını devreye alır; kanca `scripts/check-records.mjs --strict` çalıştırır ve kayıtları birbiriyle çelişen bir commit'i reddeder (`ai/PROJECT_RULES.md` §21.3). Kurulmadıysa `npm run records` uyarı basar. Gerçek bir acil durumda `git commit --no-verify` ile aşılabilir; aşıldığında sebebi `ai/CHANGELOG.md`'ye yazılır — sessiz atlama, kayıtların en baştan bozulma biçimidir.

- Uzak repo: `github.com/erenkarakoc/geoges-panel` (private). Varsayılan dal: `main`.
- `main` her zaman dağıtılabilir durumdadır; doğrudan geliştirme `main` üzerinde yapılmaz. İstisna: Phase 00 kurulum ve doküman commit'leri (`deb14ef`, `50492e9`, `15902fb` ve Phase 00 kapanış commit'i) sahip onayıyla doğrudan `main`'e yazılmıştır. Phase 01'den itibaren her iş kendi dalında yapılır (sahip kararı, 2026-09-15).
- Dal önekleri: `feature/`, `fix/`, `refactor/`, `infra/`, `docs/`, `test/`, `spike/`. Örnek: `feature/sit-daily-log-casting`.
- `spike/` dalları hiçbir zaman `main`'e birleştirilmez; bulgular `docs/architecture/spikes/` altına yazılır.
- Commit mesajı: Conventional Commits + ilgili ID. Örnek: `feat(inv): record weighbridge ticket (TASK-0214)`. Türler: `feat, fix, refactor, docs, test, chore, infra, spike`.
- **Yapay zekâ imzası yasak (sahip kararı, 2026-09-16):** commit mesajlarına ve PR açıklamalarına `Co-Authored-By: Claude …` veya başka bir yapay zekâ aracının imza/tanıtım satırı (ör. "Generated with …") eklenmez. Bu kural tüm yapay zekâ araçları için geçerlidir (Claude Code, Codex vb.). Geçmişteki bu satırlar 2026-09-16'da tüm dallardan temizlenmiştir.
- Birleştirme pull request ile yapılır; CI (lint, type-check, test, build, güvenlik kontrolleri) geçmeden birleşmez.
- Commit ve push, kullanıcı istediğinde veya görev kaydı açıkça içeriyorsa yapılır.
- Sırlar, `.env` dosyaları ve gerçek kişisel veri asla commit edilmez.
- Sürüm etiketleri: `vMAJOR.MINOR.PATCH`; production deploy'ları etiketlenir.
