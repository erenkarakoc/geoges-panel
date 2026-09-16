# SESSION HANDOFF

Session date: 2026-09-16/17 · Model: Claude Opus 5 (Claude Code desktop) · Focus: transferring the CHG-004 navigation skeleton into the product shell, steps 1–2 (TASK-0032, TASK-0033)

## Completed

- **Owner approved the transfer** of the sandbox navigation skeleton into the product layout, step by step, each step decided by question and answer, without breaking the existing layout. CHG-004 status amended. Five steps opened as T2 tasks TASK-0032…TASK-0036 (rail, header zones, context row, "Bugün" screen, mobile bottom bar). Rollback point before the transfer: `3a83586`.
- **Step 1 decisions:** D-057 (existing COSS sidebar, collapsed by default; group icons with flyout menus when collapsed; several groups open and remembered when expanded; logo at the head; `/dashboard` = "Bugün"), D-058 ("Onay"/"Görevler" only in the work layer; "Genel Bakış" group disappeared because its only item became "Bugün", so 5 group icons, not the 6 said during Q&A), D-059 (sample badge counts marked "örnek veri", AI objection recorded), D-060 (owner requirements for later steps: dev role switcher under the account menu, ⌘K exactly in COSS's documented Command design, COSS `Frame` where needed).
- **TASK-0032 implemented (REVIEW):** `navigation-registry.ts` (work layer, group icons, `sampleWorkCounts`, `allNavigationItems`), `app-sidebar.tsx` (rail with COSS `Menu` flyouts, COSS `Collapsible` groups, badge dot in icon state), `sidebar-group-preference.ts` (open-groups cookie), `app-shell.tsx` (reads `sidebar_state` and `sidebar_groups` on the server), `[moduleSlug]/page.tsx` (static params from all items). Deviation rows 13a–13d in `docs/ui-ux/DESIGN_SYSTEM_RULES.md` §4.1.
- Fixed while verifying: chevron never rotated (`group-data-[panel-open]/collapsible` matched no group; the trigger itself carries `data-panel-open`, now `in-data-[panel-open]:rotate-90`). A temporary signed-out probe page used for browser checks was deleted.
- **Step 1 committed and pushed** (`8a14cb1`).
- **Step 2 decisions:** D-061 (dev-only role switcher with four sample seats under the account menu), D-062 (bold page name + muted path; site selector only on pages declaring `scope: "site"`, remembered; wide centred search opening COSS Command in COSS's documented layout; primary action = page's own or the seat's, toast until forms exist), D-063 (sample notifications behind the bell).
- **TASK-0033 implemented (REVIEW):** `app-header.tsx`, `command-palette.tsx`, `search-text.ts` (Turkish-insensitive search), `preview-roles.ts`, `site-scope-preference.ts`, `sample-notifications.ts`; registry `scope`/`primaryAction`; layout reads the seat cookie in development only; account menu "Rol olarak görüntüle". Deviation rows 14a–14c. The owner's Command screenshot was not available; the layout follows COSS's own example code from coss.com (Command docs page).

## Partially Completed

- Steps 3–5 (TASK-0034…TASK-0036) not started.
- TASK-0029 site-wide search: navigation palette done; record-level search still open.
- OQ-027 (flow methods) still open. TASK-0030 and TASK-0031 still REVIEW.

## Current State

PHASE 01 (QUESTIONS_PENDING) on branch `feature/presentation-sandbox`. Step 1 pushed; step 2 in the working tree awaiting the owner's commit approval.

## Next Task

1. Owner reviews the rail and header in the real panel (TASK-0032, TASK-0033), including the role switcher.
2. Step 3 Q&A (TASK-0034): the conditional context row — which pages get one and what it holds.

## Open Questions

OQ-007, OQ-010…OQ-017, OQ-020, OQ-026, OQ-027.

## New Decisions

D-057…D-063 (CHG-004 product transfer).

## Deferred Items

DEF-001…DEF-005.

## Technical Debt

- Everything from the previous handoff still stands (ESLint deprecation warning, vendored COSS sidebar English strings, M0 `previewAccessPolicy`, no lockout / 2FA recovery / audit log yet).
- Sample data to replace later: badge counts (`sampleWorkCounts`), seats (`preview-roles.ts`), sites, notifications (`sample-notifications.ts`). The "Bugün" page still renders the M0 cockpit with its own "Cockpit" heading (step 4).
- The sandbox prototype still mirrors navigation labels by hand; the registry changed in this step (no "Genel Bakış" group, no "Onay"/"Görevler" in groups), so the copy has drifted until the sandbox is retired.

## Known Bugs

None open.

## Tests Run

`npm run check` (typecheck, lint with boundaries, 45 unit tests, Prettier) and `npm run build` pass. Step 2 browser (temporary signed-out probe, deleted): 1440px and 375px without horizontal scroll, palette search incl. "gorev"/"musteri" and Enter navigation, site choice remembered across pages, toast, notification list, role switch narrows rail, bell and sites. Step 1 browser: collapsed rail (3 work icons with dots, separator, 5 group icons), flyout contents, expanded view with badges 3/7, two groups open together, open set survives reload, chevrons rotate, no console errors.

## Important Context

- Owner is not a developer; explain choices in plain Turkish; never take an action without asking.
- Do not re-ask answered questions; admin-configurable settings need no default values (D-040).
- The existing layout (inset frame, `--layout-gap`, 56px header, drag rail) must not break during the transfer.
- `src/components/ui`, `src/lib`, `src/hooks` are COSS CLI-managed; do not edit by hand. Report and log every COSS/Tailwind default deviation.
- Before writing Next.js code, read the relevant guide in `node_modules/next/dist/docs/`. Next 16 renamed middleware to `proxy.ts`.
- Never handle secrets. Never enable claude-mem Cloud Sync. Never force-stop the claude-mem worker. No AI attribution in commits.
