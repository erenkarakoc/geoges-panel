# TASKS

Last updated: 2026-09-15 · Format: `docs/standards/ID_STANDARDS.md`

## PHASE 00 — Project Bootstrap & AI Infrastructure

| ID | Title | Tier | Status | Depends on | Notes |
|---|---|---|---|---|---|
| TASK-0001 | Initialize local Git repository (`main`) and add GitHub remote | T3 | DONE | — | Remote: `github.com/erenkarakoc/geoges-panel` (private) |
| TASK-0002 | Create `AGENTS.md`, `CLAUDE.md`, `README.md`, `.gitignore` | T3 | DONE | TASK-0001 | Owner approved 2026-09-15 |
| TASK-0003 | Create `/ai` state system | T2 | DONE | TASK-0001 | Owner approved 2026-09-15 |
| TASK-0004 | MASTER_ROADMAP with phase gates | T2 | DONE | TASK-0003 | Approved 2026-09-15; Milestone M1 added (CHG-001) |
| TASK-0005 | Standards: ID, naming, quality gates, git workflow | T2 | DONE | TASK-0003 | Owner approved 2026-09-15; `GIT_WORKFLOW.md` records Phase 00 direct-to-`main` exception, branches from Phase 01 |
| TASK-0006 | ADR-001…ADR-013 | T2 | DONE | TASK-0003 | Owner approved 2026-09-15; ADR-013 stale status corrected |
| TASK-0007 | Skill audit: sources, commits, scripts, licenses, risks | T2 | DONE | TASK-0003 | Results in `ai/AI_SKILLS.md` |
| TASK-0008 | Vendor approved skills into `.claude/skills/` at pinned commits | T1 | DONE | TASK-0007 | 8 skills; no executable content except Tailwind sync script (not run) |
| TASK-0009 | Disable `ui-ux-pro-max` for this project | T3 | DONE | TASK-0003 | `.claude/settings.json` |
| TASK-0010 | Enable claude-mem for this project (local-only) | T1 | DONE | TASK-0007 | 2026-09-15: first verification FAILED (plugin not installed for this project path). Installed v13.11.0 (`f5633c1`) at project scope with owner approval; DB backed up first. Observation generation failed (`OAuth session expired and could not be refreshed`; CLI refresh token expired 2026-08-02); owner re-logged in the Claude Code CLI. Fresh-session verification PASSED (session 68): SessionStart context injected, worker healthy (v13.11.0, PID 9652), observations #325–#328 stored, 0 errors/auth errors, telemetry `false`, Chroma local, no cloud sync. Follow-up: login expiry (see TASK-0018) |
| TASK-0018 | Prevent silent claude-mem stop when the Claude login expires (2026-10-15) | T2 | TESTING | TASK-0010 | Owner chose option 1 (long-lived `claude setup-token`). 2026-09-15: owner set user env var `CLAUDE_CODE_OAUTH_TOKEN` (presence/format checked, value never read). Worker (PID 9652, started 17:30) not yet respawned, so the token is unused until Windows restart. Owner deferred verification; pending: after restart confirm new worker PID, observations stored, 0 auth errors. Scheduled reminder (option 2) not chosen. 2026-09-15 23:25 Windows restart: new worker PID 19196 (23:27), env var present, 0 error/auth lines, observations #403–#405 stored. Limitation: `~/.claude/.credentials.json` is still valid, so the env-var fallback path is not yet exercised; re-check after 2026-10-15 |
| TASK-0019 | Stop console window flashes caused by claude-mem on Windows | T2 | DONE | TASK-0010 | Root cause (process trace 2026-09-15): detached worker `bun.exe` spawns `git` without `windowsHide`, so Windows opens Windows Terminal briefly. Owner chose a local patch: added `windowsHide:!0` to 2 git calls in `worker-service.cjs` and 1 each in `context-generator.cjs`, `transcript-watcher.cjs` (v13.11.0 cache); `node --check` OK; originals in `~/.claude-mem/backups/worker-service-pre-windowsHide-2026-09-15/`. Takes effect after Windows restart; lost on plugin update. Verified 2026-09-15 23:42 after restart: patch present, worker (PID 19196) spawned `git` twice with 0 Windows Terminal/OpenConsole launches (before: one per git call) |

## PHASE 01 — Requirements & Domain Analysis

| ID | Title | Tier | Status | Depends on | Notes |
|---|---|---|---|---|---|
| TASK-0020 | Glossary confirmation rounds (OQ-007) | T2 | QUESTIONS_PENDING | TASK-0014 | Round 1 (2026-09-15): D-027 Party with roles, D-028 fire/zayi/hurda, D-029 guarantee types, D-030 subcontractor payment methods. Round 2: D-031 panel course, D-032 single lug type, D-033 one net party balance, D-034 per-currency balances. All OPEN terms closed; PROPOSED terms continue per module |
| TASK-0027 | Remove `docs/sources/` at Phase 01 exit | T3 | NOT_STARTED | Phase 01 REQ coverage complete | Sources moved from repo root to `docs/sources/` on 2026-09-16 (owner request). Delete only after `ai/REQUIREMENTS.md` coverage is complete, architecture principles are captured in ADRs/`docs/architecture/`, and owner approves |
| TASK-0021 | Slice 1 requirement question rounds (IAM, SIT daily log, WFL approvals, RPT site detail + cockpit) and general OQ-021…OQ-024 | T1 | QUESTIONS_PENDING | TASK-0020 | Scope §2, §3, §4, §9, §13, §14 reviewed 2026-09-15; Round 1 answered (D-035 entry fallback order, D-036 email + password, D-037 deadline setting, D-038 holidays exempt / no-work log). Round 2 answered: no fixed default deadline (D-037 clarified), D-039 company vs personal email, D-040 delegate then escalation, all configurable by admins, D-041 owner delegate (OQ-023). Next: OQ-021 pilot, OQ-022 dates, OQ-024 KVKK legal review |

## MILESTONE M0 — Early first screen (CHG-002, parallel to Phase 01)

| ID | Title | Tier | Status | Depends on | Notes |
|---|---|---|---|---|---|
| TASK-0022 | Implementation plan for M0 (structure, auth port, Supabase setup, tests, rollback) | T1 | DONE | CHG-002 | Plan written: `docs/features/m0-early-first-screen-plan.md` (Supabase docs checked 2026-09-16: `getClaims`, publishable key, PKCE `auth/confirm`, TOTP MFA, default email only to team + 2/hour). D-043 TOTP. Owner approved 2026-09-16 → DONE |
| TASK-0023 | Scaffold: Next.js 16 + TypeScript + Tailwind v4 + COSS UI, module folders, lint/format/boundary rules, test setup | T2 | DONE | TASK-0022 | 2026-09-16 on `feature/m0-early-first-screen`: Next.js 16.3.5 (create-next-app, merged into repo; Next agent block appended to `AGENTS.md`), React 19.2.8, Tailwind 4.3.3, `@coss/style` init (54 primitives in `src/components/ui`, CLI-managed), exact-pinned versions + lockfile, npm (provisional, OQ-017). Removed unused `radix-ui` and `cn` added by the init template (Base UI only, ADR-009). ESLint `boundaries/dependencies` (module→own module/platform/COSS; platform↛module) verified with probe files (2 expected errors, probes deleted). Vitest 5, Prettier + Tailwind plugin, scripts `typecheck/lint/test/format:check/check`. noindex via `robots.ts` + `X-Robots-Tag` verified at runtime. `.env.example` (names only). Self-review: vendored sidebar `react-hooks/purity` disabled for that file only (documented); ESLint 9.39.5 reports deprecation (tied to `eslint-config-next` 16.3.5) — revisit at Phase 07. All checks + build pass |
| TASK-0024 | Supabase dev project (EU Frankfurt) created by owner; public sign-up disabled; keys in local env by owner | T1 | NOT_STARTED | TASK-0022 | AI never handles secrets |
| TASK-0025 | Auth: sign-in, 2FA, password reset, session handling behind `AuthProvider` port with Supabase adapter | T1 | NOT_STARTED | TASK-0023, TASK-0024 | Owner approves auth rules; tests + self-review |
| TASK-0026 | App shell (left navigation, top bar, light/dark, mobile) from registries + empty dashboard card skeleton + new-role onboarding screens | T2 | NOT_STARTED | TASK-0023 | Origin as reference (D-042); Turkish UI text |
| TASK-0011 | Initial commit and push to GitHub | T3 | DONE | TASK-0002…TASK-0010 | Commit `deb14ef` |
| TASK-0012 | Module map & dependency graph | T2 | DONE | TASK-0003 | Owner approved 2026-09-15 (draft; finalized in Phase 03) |
| TASK-0013 | UI/UX design-system, COSS and devl.dev rules | T2 | DONE | TASK-0003 | Owner approved 2026-09-15 |
| TASK-0014 | Glossary skeleton with proposed canonical terms | T2 | QUESTIONS_PENDING | TASK-0003 | Skeleton delivered (Phase 00 exit criterion met); term confirmation carried into Phase 01 via OQ-007 |
| TASK-0015 | Identify project-specific skill needs | T3 | DONE | TASK-0007 | `ai/AI_SKILLS.md` |
| TASK-0016 | Initialize Tailwind docs snapshot locally (git-ignored) | T2 | DONE | TASK-0008 | Owner consent D-024; tailwindcss.com @ `7f92c22` |
| TASK-0017 | Impact analysis and decision for CHG-001 (early preview of auth + app shell) | T2 | DONE | TASK-0004 | Resolved: Milestone M1 in Phase 07 |
