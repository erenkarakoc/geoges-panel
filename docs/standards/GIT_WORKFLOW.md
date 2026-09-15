# Git Çalışma Kuralları

Durum: Kabul edildi · 2026-09-15

- Uzak repo: `github.com/erenkarakoc/geoges-panel` (private). Varsayılan dal: `main`.
- `main` her zaman dağıtılabilir durumdadır; doğrudan geliştirme `main` üzerinde yapılmaz (Phase 00 başlangıç commit'i hariç).
- Dal önekleri: `feature/`, `fix/`, `refactor/`, `infra/`, `docs/`, `test/`, `spike/`. Örnek: `feature/sit-daily-log-casting`.
- `spike/` dalları hiçbir zaman `main`'e birleştirilmez; bulgular `docs/architecture/spikes/` altına yazılır.
- Commit mesajı: Conventional Commits + ilgili ID. Örnek: `feat(inv): record weighbridge ticket (TASK-0214)`. Türler: `feat, fix, refactor, docs, test, chore, infra, spike`.
- Birleştirme pull request ile yapılır; CI (lint, type-check, test, build, güvenlik kontrolleri) geçmeden birleşmez.
- Commit ve push, kullanıcı istediğinde veya görev kaydı açıkça içeriyorsa yapılır.
- Sırlar, `.env` dosyaları ve gerçek kişisel veri asla commit edilmez.
- Sürüm etiketleri: `vMAJOR.MINOR.PATCH`; production deploy'ları etiketlenir.
