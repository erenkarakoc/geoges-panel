# SESSION HANDOFF

Session date: 2026-09-16 · Model: Claude Opus 5 (Claude Code desktop) · Focus: TASK-0024 verification and TASK-0025 auth screens in the devl.dev design

## Completed
- TASK-0024 DONE: owner created the Supabase dev project (EU Frankfurt) and `.env.local`. Verified without reading key values — both variables set, key is `sb_publishable_`, file git-ignored, public sign-up disabled, TOTP MFA enabled.
- TASK-0025 implemented (status REVIEW):
  - `AuthProvider` port + Supabase adapter; provider error codes mapped to stable failure codes with Turkish messages.
  - Server actions for sign-in, sign-out, password reset request, new password, TOTP enrollment and verification.
  - `src/proxy.ts` refreshes session cookies and redirects signed-out visitors; `getClaims` for access decisions; `aal2` gate re-checked in `(app)/layout.tsx` and `/onboarding`; `/auth/confirm` with in-app-only redirect target.
  - Screens: sign-in, two-factor (verify + setup with QR), reset-password, update-password, header user menu with sign-out; onboarding restyled to the same design.
  - 19 new unit tests; `npm run check` and `npm run build` pass.
- D-046 (devl.dev auth design adopted as the actual design, rebuilt with COSS) and D-047 (`ParticleField` approved as the first custom element) recorded; DESIGN_SYSTEM_RULES §3.2 and deviation rows 9–11 added.

## Partially Completed
- TASK-0025 verification: real sign-in, TOTP setup/verification, password reset e-mail and the onboarding screen's new look are **not verified** — they need the owner's own account. Everything reachable without credentials was verified in the browser.
- TASK-0026 still REVIEW: awaiting the owner's visual approval of the app shell.
- TASK-0021 remaining questions: OQ-021 pilot, OQ-022 dates, OQ-024 KVKK legal review, OQ-025 menu entries.

## Current State
PHASE 01 (QUESTIONS_PENDING) + Milestone M0 on branch `feature/m0-early-first-screen`. Nothing committed this session; the working tree holds the auth work.

## Next Task
1. Owner signs in with their own account and checks: sign-in → TOTP → dashboard → sign-out, password reset e-mail, onboarding screen.
2. Owner approves the auth rules (T1 gate) and the app shell (TASK-0026).
3. Answer OQ-021, OQ-022, OQ-024, OQ-025; OQ-026 (password policy) waits for Phase 03.

## Open Questions
OQ-007, OQ-010…OQ-017, OQ-020…OQ-022, OQ-024, OQ-025, OQ-026.

## New Decisions
D-046, D-047.

## Deferred Items
DEF-001…DEF-005.

## Technical Debt
- ESLint 9.39.5 deprecation warning (tied to `eslint-config-next` 16.3.5) — revisit Phase 07.
- Vendored COSS sidebar: English screen-reader strings; Cookie Store API browser support not verified.
- M0 `previewAccessPolicy` allows everything — must be replaced by the IAM policy before real data.
- No account lockout, no 2FA recovery method, no audit log yet (Phase 03/07; OQ-026).

## Known Bugs
- Out of scope: `Desktop\test\app` still pins claude-mem v12.3.6.

## Tests Run
`npm run check` (typecheck, lint with boundaries, 28 unit tests, format) and `npm run build` pass. Browser: signed-out redirect to `/sign-in`, wrong-credentials error with preserved e-mail, light/dark, mobile, no page-load console errors.

## Important Context
- Owner is not a developer; explain choices in plain Turkish; never take an action without asking.
- Do not re-ask answered questions; admin-configurable settings need no default values (D-040).
- Auth screens follow the devl.dev design 1:1 but are rebuilt with COSS in the project's own layers (D-046). `npx shadcn add` must not be run for devl.dev registry items.
- `ParticleField` is the only approved custom element (D-047); any further custom element needs a new owner approval.
- `src/components/ui`, `src/lib`, `src/hooks` are COSS CLI-managed; do not edit by hand.
- Before writing Next.js code, read the relevant guide in `node_modules/next/dist/docs/`. Next 16 renamed middleware to `proxy.ts`.
- Never handle secrets (Supabase keys, `CLAUDE_CODE_OAUTH_TOKEN`). Never enable claude-mem Cloud Sync. Never force-stop the claude-mem worker.
