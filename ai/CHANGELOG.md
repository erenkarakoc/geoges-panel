# CHANGELOG

## 2026-09-16 — Larger app card margins; COSS deviation register

- Owner request (compact interface): app card outer margin 1rem from `md`, 1.5rem from `xl` (COSS inset default 0.5rem); sidebar side stays 0, collapsed state uses the same margin. Browser-measured at 1024px (16px) and 1440px (24px), expanded and collapsed.
- Owner request: always report departures from COSS/Tailwind defaults. Added deviation register `docs/ui-ux/DESIGN_SYSTEM_RULES.md` §4.1 listing all deviations so far (brand tokens, logo color, card border, card margins, header corners, `latin-ext`, removed `radix-ui`/`cn`, Turkish trigger label).

## 2026-09-16 — Inline SVG logos, larger header logo, `.agents` safety

- Owner request: logos rendered as inline SVG instead of `<img>`, header logo `h-12`. `@svgr/webpack` 8.1.0 (listed as tested with Turbopack in Next.js docs) turns `*.svg?svgr` imports into components; brand blue fill becomes `currentColor`, color from `--brand-logo` (brand blue light, `#EFEFEF` dark), so only `*_primary.svg` files are used. `dimensions: false` keeps `viewBox`. Favicon still uses the files via metadata.
- Browser-verified: no `<img>` tags, sidebar long logo 48px tall, light color `#0F4C81`, dark color `#EFEFEF`, no console errors; check + build pass.
- Found an untracked `.agents/skills/` copy of `.claude/skills` (created 2026-09-16 12:07, not by this session, never committed). Tailwind docs snapshot under it is now git-ignored (D-024); `.agents/**` excluded from ESLint and Prettier. Owner to confirm what created it. Commits now stage explicit paths instead of `git add -A`.

## 2026-09-16 — Inset app layout (TASK-0026)

- Owner request: app no longer fills the screen edge to edge. Uses the COSS Sidebar `inset` variant: on desktop the main area is a bordered, rounded card with a margin on the sidebar background; header corners follow the card. Mobile stays full width. Browser-verified expanded and collapsed.

## 2026-09-16 — GEOGES brand logos (TASK-0026)

- `platform/ui/brand/brand-logo.tsx`: single component for owner-provided assets in `public/assets/brand` (`primary` in light mode, `light` in dark mode). Owner placement: long logo in headers (sidebar header, auth header), stacked logo in footers (new `BrandFooter` in app shell and auth layout), icon in collapsed sidebar and favicon.
- Favicon via metadata `icons` (primary + dark-scheme light variant) instead of duplicating files; removed default `src/app/favicon.ico` and unused create-next-app images in `public/`.
- Verified: check + build pass; server-rendered HTML contains the expected logos and icon links. Browser pane visual check not possible at the time (pane not drawn, width 0). No apple-touch icon yet (needs PNG).

## 2026-09-16 — M0 app shell, cockpit skeleton, onboarding (TASK-0026, REVIEW)

- Registries: navigation (§40.1, D-026 "Şantiye" labels, permission per item), dashboard widgets (§3.1–§3.3); `AccessPolicy` with M0 preview policy so real IAM plugs in without UI changes.
- App shell on COSS Sidebar (collapsible icon mode, mobile drawer closes on navigation), top bar with Açık/Koyu/Sistem theme menu (`next-themes` 0.4.6), GEOGES brand tokens in a separate `brand.css`.
- 25 module placeholder pages generated from the registry; cockpit empty card skeleton; static new-role onboarding with step indicator.
- Root layout: `lang="tr"`, Inter/Geist Mono with `latin-ext` (Turkish characters), noindex metadata.
- 9 unit tests; typecheck, lint (boundaries), format, build pass; browser-verified in light/dark and desktop/mobile with no console errors.
- OQ-025 raised: §40.1 menu has no Projects (PRJ) or CRM entries.

## 2026-09-16 — Source documents moved out of repo root

- Owner request (clean root): `Geoges Panel Özellik Yapısı.md` → `docs/sources/functional-scope.md`, `Geoges Panel Mimari.md` → `docs/sources/architecture-principles.md`, `AI_Destekli_Proje_Gelistirme_Ana_Promptu.md` → `docs/sources/ai-development-protocol.md` (`git mv`, history kept). Added `docs/sources/README.md` (old-name mapping, deletion conditions).
- References updated in `README.md`, `ai/PROJECT_RULES.md`, `ai/PROJECT_CONTEXT.md`, `ai/REQUIREMENTS.md`, `docs/requirements/README.md`, `docs/README.md`. Historical changelog entries keep the old names. TASK-0027 tracks deletion at Phase 01 exit.

## 2026-09-16 — Milestone M0: CHG-002 approved, scaffold (branch `feature/m0-early-first-screen`)

- CHG-002 approved (option B: real Supabase Auth, local preview, empty dashboard skeleton, sign-in + 2FA + password reset + onboarding); D-043 TOTP 2FA; plan `docs/features/m0-early-first-screen-plan.md` approved (TASK-0022). ADR-007 amended with Milestone M0.
- TASK-0023 scaffold done: Next.js 16.3.5, React 19.2.8, TypeScript 5.9.3, Tailwind 4.3.3, COSS UI (`@coss/style`, Base UI 1.8.0), Supabase `@supabase/ssr` 0.12.7 + `@supabase/supabase-js` 2.116.0, zod 4.6.5; ESLint module-boundary rules, Vitest 5, Prettier; noindex (`robots.ts`, `X-Robots-Tag`); `.env.example`. Unused `radix-ui`/`cn` removed. All checks and production build pass.

## 2026-09-15 — Phase 01 started: glossary round 1 (uncommitted, branch `docs/phase-01-kickoff`)

- Owner answers recorded as D-027 (single Party record with roles), D-028 (fire / zayi / hurda distinction), D-029 (three guarantee types), D-030 (unit rate, lump sum, day rate subcontractor payment).
- `docs/domain/GLOSSARY.md`: added Party, Customer, Subcontractor Payment Method, Letter of Guarantee, Retention, Cash Guarantee; confirmed Client, Subcontracted Labor, Guarantee, Process Loss, Damaged Unit, Scrap.
- OQ-007 partially answered; TASK-0020 opened.
- Round 2: D-031 Kademe = Panel Course, D-032 lug single standard type, D-033 one net party account balance, D-034 per-currency balances with TRY equivalent. Glossary: Panel Course, Tie Strip Lug, Party Account confirmed; no OPEN terms remain.
- Committed `157c22a`. Slice 1 requirement rounds 1–2 (TASK-0021): D-035 §9.2 chain = entry fallback order, coordinator approves; D-036 email + password login; D-037 deadline configured in panel, no fixed default; D-038 holidays exempt, otherwise "no work" log with reason; D-039 company email for employees, personal allowed for subcontractor crew leads; D-040 delegate → escalation, all role/approval settings admin-configurable; D-041 owner delegate (OQ-023 answered).
- D-042: COSS Origin examples prioritized as design reference for advanced components, rebuilt with COSS UI/Particles (Origin verified Radix-based legacy, MIT). Updated `docs/ui-ux/DESIGN_SYSTEM_RULES.md` (§2 priority, new §3.1) and ADR-009 note.
- After Windows restart (23:25): TASK-0019 verified DONE (no terminal launches on worker `git` calls); TASK-0018 partially verified (new worker, 0 auth errors, observations #403–#405; env fallback untested until 2026-10-15).

## 2026-09-15 — Şantiye label, claude-mem window flash fix (uncommitted)

- D-026: UI label for `SIT` / site concept is "Şantiye"; glossary note added.
- TASK-0019: process trace showed the detached claude-mem worker spawning `git rev-parse` without `windowsHide`, each followed by a Windows Terminal launch (visible flash). Owner-approved local patch adds `windowsHide:!0` to 4 git calls across 3 plugin scripts; backups taken, `node --check` passed. Effective after Windows restart.

## 2026-09-15 — Phase 00 closed

- Owner approved TASK-0002, TASK-0003, TASK-0005, TASK-0006, TASK-0012, TASK-0013 → DONE; added to `ai/COMPLETED.md` (TASK-0010 row added too).
- Phase 00 status DONE; completion report updated.
- Corrections: ADR-013 status and Tailwind note; `ai/AI_SKILLS.md` claude-mem status and Next.js note; `docs/standards/GIT_WORKFLOW.md` records Phase 00 direct-to-`main` commits as an owner-approved exception, branches required from Phase 01; `ai/OPEN_QUESTIONS.md` notes OQ-018/019 were never assigned; README points to Phase 01.
- TASK-0018: owner set long-lived `CLAUDE_CODE_OAUTH_TOKEN` user env var (value never read); worker verification deferred until Windows restart.

## 2026-09-15 — TASK-0010 done, Phase 00 completion report

- Fresh-session verification passed (claude-mem session 68): SessionStart context injected, worker `/api/health` ok (v13.11.0, PID 9652), observations #325–#328 stored for `geoges-panel`, 0 `ERROR`/auth lines after 17:34, `CLAUDE_MEM_TELEMETRY=false`, Chroma mode `local`, no cloud sync configuration. Transient "non-XML idle response" parser warnings and the expected Windows Credential Manager WARN observed; no impact.
- TASK-0010 → DONE; MASTER_ROADMAP Phase 00 exit criteria all checked; Phase 00 completion report added (NOT COMPLETE pending owner review of REVIEW tasks).
- Added TASK-0018: safeguard against silent claude-mem stop at login expiry (2026-10-15); worker supports `CLAUDE_CODE_OAUTH_TOKEN` as fallback.

## 2026-09-15 — TASK-0010 claude-mem verification

- Fresh-session verification failed: `claude-mem@thedotmack` was enabled in `.claude/settings.json` but installed only for another project path (`Desktop\test\app`); worker not running.
- Root cause of `no such column: failed_at_epoch` worker errors (2026-09-14 log): legacy v12.3.6 worker from the other project running against a DB already migrated by v13.11.0 (schema v31 dropped the column). No data corruption found.
- `~/.claude-mem` database backed up to `backups/pre-geoges-install-2026-09-15T16-27-46/` (SHA-256 verified).
- Installed `claude-mem@thedotmack` v13.11.0 (`f5633c1`, already audited cache) at project scope; marketplace not updated. No repository files changed.
- Post-install: worker healthy on `127.0.0.1:37777`, hooks capture this project, no schema errors. New blocker: observation generation fails with `OAuth session expired and could not be refreshed`.
- Auth root cause: Windows Credential Manager has no Claude Code entry (expected); fallback `~/.claude/.credentials.json` had `expiresAt=0` and a refresh token expired on 2026-08-02. Owner re-logged in via the Claude Code CLI (new refresh token valid until 2026-10-15). Observations #308–#313 stored for `geoges-panel`; 0 auth errors since.
- Incident: force-stopping the worker (PID 29840, owner-approved) left its uvx/chroma-mcp children alive holding the inherited listening socket on port 37777; new worker could not bind and hook processes hung. With owner approval, orphan chroma processes and stuck hook processes were stopped; worker (PID 9652) respawned after the 2-minute Windows spawn cooldown. SQLite DB unaffected.
- `ai/MASTER_ROADMAP.md`: TASK-0016 checkbox corrected to match its DONE status.

## 2026-09-15 — Phase 00 closing (uncommitted)

- Roadmap approved; CHG-001 resolved as Milestone M1 (first visible screen at end of Phase 07).
- Tailwind docs snapshot synced locally (tailwindcss.com @ `7f92c22`), git-ignored; `docs-source.txt` set to skip-worktree.
- claude-mem telemetry disabled (project env + `~/.claude-mem/settings.json`).
- Decisions D-023…D-025; open questions OQ-001, OQ-008, OQ-009 answered.

## 2026-09-15 — Phase 00 bootstrap (commit `deb14ef`)

## 2026-09-15 — Phase 00 bootstrap (uncommitted)

- Scope documents updated with 21 previously missed requirements from legacy analysis; "no external dependency" clarified (records never outside the panel; tech providers and APIs allowed).
- Phase 00 decision round (4 rounds) completed; ADR-001…ADR-013 accepted.
- Git repository initialized; remote added.
- Created `AGENTS.md`, `CLAUDE.md`, `README.md`, `.gitignore`.
- Created `/ai` state system and `/docs` structure (standards, decisions, architecture module map, UI/UX rules, glossary skeleton, requirement index).
- Skill audit performed; 8 skills vendored at pinned commits into `.claude/skills/` (supabase, supabase-postgres-best-practices, coss, coss-particles, react-best-practices, composition-patterns, cloudflare, tailwind-4-docs).
- `.claude/settings.json`: `ui-ux-pro-max` disabled, `claude-mem` enabled for this project.
- CHG-001 proposed (early preview of auth screens and app shell).

