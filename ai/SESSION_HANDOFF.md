# SESSION HANDOFF

Session date: 2026-09-16 · Model: Claude Opus 5 (Claude Code desktop) · Focus: navigation and toolbar rethink (CHG-004), prototype in the sandbox (TASK-0031)

## Completed

- **CHG-004 recorded and approved.** Analysis: the left menu lists nouns (28 modules in 6 groups) while people work in verbs, and one structure serves an owner who sees everything, field roles who see three rows after permission filtering, and coordinators who drain queues rather than browse. Four patterns were weighed (command-palette-first, icon rail, role workspace, object-first), then four variants of the rail's second panel. The owner removed the second panel from the sidebar: its job goes into the header.
- **D-054** two-region icon rail: work layer ("Bugün", "Onaylar", "Görevler") with count badges on top, module groups (§40.1, unchanged labels and order) below a separator; a group icon opens its modules as a flyout, so no module list occupies a column. Maps to a mobile bottom bar (§40.2).
- **D-055** header as a three-zone toolbar, one rule in every module: left = where you are, middle = where you go (⌘K, D-044), right = what you do (role-specific primary action, notification badge, theme, user). Second row renders **only** while an object is open (its tabs plus a date strip); absent otherwise, so the current layout is unchanged on screens without context.
- **D-056** "Bugün" is every role's entry screen, composed per role; the cockpit is the owner's variant of it, not a competing entry. An empty screen means finished work.
- **TASK-0031 implemented (status REVIEW):** `/navigation` prototype in the development-only sandbox, linked from the account menu in development. Role switcher (Sahip, Koordinatör, Saha Mühendisi, Taşeron Ekip Başı), rail, toolbar, conditional context row, "Bugün" per role, approval queue in queue mode, module flyouts, ⌘K palette.
- Verified in the browser from all four role seats: the owner keeps 9 rail entries, the crew lead 3, the frame never changes. `npm run check` (30 tests) and `npm run build` pass; signed-out visitors are redirected to sign-in; production returns 404.

## Partially Completed

- **OQ-027 open:** which flow methods are adopted — queue mode, persistent primary action, stepped daily-log entry with a date strip, notification-driven navigation. Queue mode and the "bugün temiz" empty state are shown in the prototype as demonstrations, not as decisions.
- Product implementation of D-054…D-056 is **not** started: `app-shell.tsx`, `app-sidebar.tsx` and `navigation-registry.ts` are untouched apart from one development-only menu entry. That work belongs to Phase 02 design and Phase 07.
- TASK-0030 (presentation sandbox) still REVIEW.

## Current State

PHASE 01 (QUESTIONS_PENDING) on branch `feature/presentation-sandbox`; nothing committed this session. The working tree holds the presentation sandbox, the navigation prototype and the `/ai` records.

## Next Task

1. Owner opens `/navigation`, tries the four roles, and says whether the skeleton is right.
2. Owner answers OQ-027 (flow methods).
3. Then: write the Phase 02 screen-design task for the toolbar's context row per screen, or return to Phase 01 requirement rounds (TASK-0020, TASK-0021).

## Open Questions

OQ-007, OQ-010…OQ-017, OQ-020, OQ-026, **OQ-027 (new)**.

## New Decisions

D-054, D-055, D-056 (CHG-004).

## Deferred Items

DEF-001…DEF-005.

## Technical Debt

- Everything from the previous handoff still stands (ESLint deprecation warning, vendored COSS sidebar English strings, M0 `previewAccessPolicy`, no lockout / 2FA recovery / audit log yet).
- The prototype mirrors navigation labels from `navigation-registry.ts` by hand, because the sandbox may not import the platform layer. If the registry changes before the prototype is retired, the copy drifts.

## Known Bugs

- None open in the prototype. Two were found and fixed while verifying: Base UI's Autocomplete reports the input value on every keystroke (a typed fragment navigated on its own), and the toolbar kept the previous role's context because it holds that choice in local state (now keyed by role).

## Tests Run

`npm run check` (typecheck, lint with boundaries, 30 unit tests, Prettier) and `npm run build` pass. Browser: all four roles, queue mode, module flyout, context row, ⌘K palette with keyboard and mouse selection, no console errors; signed-out `/navigation` redirects to `/sign-in`.

## Important Context

- Owner is not a developer; explain choices in plain Turkish; never take an action without asking.
- Do not re-ask answered questions; admin-configurable settings need no default values (D-040).
- The navigation decision changes §40.1's presentation, not its content: group names, order and D-051's two added modules stay exactly as recorded.
- The sandbox may import the COSS UI layer but nothing from `modules` or `platform`, and nothing may import it (ESLint boundaries). It must stay deletable as one folder.
- `src/components/ui`, `src/lib`, `src/hooks` are COSS CLI-managed; do not edit by hand.
- Before writing Next.js code, read the relevant guide in `node_modules/next/dist/docs/`. Next 16 renamed middleware to `proxy.ts`.
- Never handle secrets. Never enable claude-mem Cloud Sync. Never force-stop the claude-mem worker.
