# SESSION HANDOFF

Session date: 2026-09-15/16 · Model: Claude Opus 5 (Claude Code desktop) · Focus: Phase 01 rounds, CHG-002 Milestone M0 (early first screen)

## Completed
- Phase 01 decisions D-027…D-043 (glossary, slice 1 rules, Origin as design reference, TOTP 2FA). OQ-023 answered.
- CHG-002 approved (option B): real Supabase Auth, local preview, empty dashboard skeleton, sign-in + 2FA + password reset + onboarding. Plan: `docs/features/m0-early-first-screen-plan.md` (TASK-0022 DONE). ADR-007 amended.
- TASK-0023 DONE: Next.js 16.3.5 scaffold, COSS UI, pinned deps, ESLint module boundaries, Vitest, Prettier, noindex, `.env.example`, `.gitattributes` (LF).
- TASK-0026 REVIEW: registries (navigation, dashboard widgets), `AccessPolicy`, app shell, theme, 25 module placeholders, cockpit skeleton, onboarding. Browser-verified.
- Source documents moved to `docs/sources/` (owner request; TASK-0027 deletes them at Phase 01 exit).
- TASK-0018 partially verified after restart; TASK-0019 DONE.

## Partially Completed
- TASK-0024 (owner creates Supabase dev project, EU Frankfurt, sign-up disabled, own user) — waiting on owner.
- TASK-0025 auth (sign-in, 2FA TOTP, password reset, `proxy.ts` session refresh, `getClaims`, header user menu/sign-out) — blocked by TASK-0024. Supabase docs checked 2026-09-16; Next.js `proxy.ts` and auth guide read from `node_modules/next/dist/docs`.
- TASK-0021 remaining questions: OQ-021 pilot, OQ-022 dates, OQ-024 KVKK legal review.

## Current State
PHASE 01 (QUESTIONS_PENDING) + Milestone M0 in progress on branch `feature/m0-early-first-screen`.

## Next Task
1. Owner visual review of TASK-0026 (`npm run dev`, http://localhost:3000).
2. Owner completes TASK-0024; then implement TASK-0025 behind `AuthProvider` port.
3. Answer OQ-021, OQ-022, OQ-024, OQ-025.

## Open Questions
OQ-007 (PROPOSED terms per module), OQ-010…OQ-017, OQ-020…OQ-022, OQ-024, OQ-025.

## New Decisions
D-026…D-043; CHG-002 approved.

## Deferred Items
DEF-001…DEF-005.

## Technical Debt
- ESLint 9.39.5 deprecation warning (tied to `eslint-config-next` 16.3.5) — revisit Phase 07.
- Vendored COSS sidebar: English screen-reader strings; Cookie Store API browser support not verified.
- M0 `previewAccessPolicy` allows everything — must be replaced by IAM policy before real data.

## Known Bugs
- Out of scope: `Desktop\test\app` still pins claude-mem v12.3.6.

## Tests Run
`npm run check` (typecheck, lint with boundaries, 9 unit tests, format) and `npm run build` pass; boundary rules verified with probe files; runtime noindex verified; browser checks (light/dark, desktop/mobile, 0 console errors).

## Important Context
- Owner is not a developer; explain choices in plain Turkish; never take an action without asking.
- Do not re-ask answered questions; admin-configurable settings need no default values (D-040).
- Branches mandatory from Phase 01. UI: COSS + Tailwind only; Origin as design reference, rebuilt with COSS (D-042). UI label "Şantiye" (D-026).
- `src/components/ui`, `src/lib`, `src/hooks` are COSS CLI-managed; do not edit by hand.
- Before writing Next.js code, read the relevant guide in `node_modules/next/dist/docs/`.
- Never handle secrets (Supabase keys, `CLAUDE_CODE_OAUTH_TOKEN`). Never enable claude-mem Cloud Sync. Never force-stop the claude-mem worker.
