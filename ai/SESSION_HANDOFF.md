# SESSION HANDOFF

Session date: 2026-09-16/17 · Model: Claude Opus 5 (Claude Code desktop) · Focus: transferring the CHG-004 navigation skeleton into the product shell, all five steps (TASK-0032…TASK-0036)

## Completed

- **Owner approved the transfer** of the sandbox navigation skeleton into the product layout, step by step, each step decided by question and answer, without breaking the existing layout. CHG-004 status amended. Five steps opened as T2 tasks TASK-0032…TASK-0036 (rail, header zones, context row, "Bugün" screen, mobile bottom bar). Rollback point before the transfer: `3a83586`.
- **Step 1 decisions:** D-057 (existing COSS sidebar, collapsed by default; group icons with flyout menus when collapsed; several groups open and remembered when expanded; logo at the head; `/dashboard` = "Bugün"), D-058 ("Onay"/"Görevler" only in the work layer; "Genel Bakış" disappeared because its only item became "Bugün", so 5 group icons), D-059 (sample badge counts marked "örnek veri", AI objection recorded), D-060 (owner requirements for later steps: dev role switcher, ⌘K in COSS's documented Command design, COSS `Frame` where needed).
- **TASK-0032 (REVIEW), committed `8a14cb1`:** `navigation-registry.ts` (work layer, group icons, `sampleWorkCounts`, `allNavigationItems`), `app-sidebar.tsx` (rail with COSS `Menu` flyouts, COSS `Collapsible` groups, badge dot in icon state), `sidebar-group-preference.ts`, `app-shell.tsx` reads `sidebar_state`/`sidebar_groups` on the server. Deviations 13a–13d.
- **Step 2 decisions:** D-061 (dev-only role switcher, four sample seats), D-062 (bold page name + muted path; site selector only on `scope: "site"` pages, remembered; wide centred search opening COSS Command in COSS's documented layout; primary action = page's own or the seat's, toast until forms exist), D-063 (sample notifications behind the bell).
- **TASK-0033 (REVIEW), committed `d780d5a`:** `app-header.tsx`, `command-palette.tsx`, `search-text.ts` (Turkish-insensitive search), `preview-roles.ts`, `site-scope-preference.ts`, `sample-notifications.ts`; registry `scope`/`primaryAction`; account menu "Rol olarak görüntüle" in development only. Deviations 14a–14c.
- **Step 3 decisions (D-064):** the context row is delivered by the Next.js `@context` parallel route slot, judged on a sample site detail until SIT exists; each section is its own address with a Turkish slug; the day is chosen with a five-day strip plus a COSS `Calendar` popover and travels in `?gun=`, today leaving the address clean; the day selector belongs to every context row.
- **TASK-0034 implemented (REVIEW), not yet committed:** `context-bar.tsx` (generic row), `modules/sit/ui/*` (sample sites, site context row, section placeholder, `Frame` list), `platform/date/day.ts` (+ tests), `(app)/@context/*` slot pages, `/sites` and `/sites/[siteId]/[[...section]]`, `contextBar` prop on the shell. Deviations 15a–15c.
- **Step 4 decisions (D-065…D-068):** "Bugün" on `/dashboard` — work first, figures second, work block and six key indicators side by side, nine more behind a fold, sample figures marked "Örnek veri"; charts as an approved custom element with no library; only the number is mono (units and ₺ in the body font, one shared `Figure`); rail refinements (first group open for a fresh user, labels clipped not wrapped, logo cross-fade, card margin animated with the rail, separator margins removed).
- **TASK-0035 implemented (REVIEW), not yet committed:** `today-overview.tsx`, `today-work.ts`, `platform/ui/chart/bar-chart.tsx`, `platform/ui/format/figure.tsx`, widget registry (`critical`, `sampleValue`, `sampleUnit`), `dashboard/page.tsx`; `cockpit-overview.tsx` deleted. Deviations 16a–16d, and §4 of the design rules now says only the digits are mono.
- **Step 5 decisions (D-069):** below `md` the rail becomes a bottom bar (work layer, primary action in the middle, "Modüller" opening a searchable drawer of grouped module tiles); the header's menu button and action are desktop-only; refines scope §40.2.
- **TASK-0036 implemented (REVIEW), not yet committed:** `mobile-bottom-bar.tsx`, `primary-action.tsx` (shared by header and bottom bar), header changes, context row scrolls the active section into view. Deviations 17a–17c.
- Fixed while verifying step 5: the section you were in could start off screen in the scrolling strip on a phone.
- Fixed while verifying step 4: Geist Mono has no ₺ glyph (the symbol fell back to another font and sat wrong beside the digits); indicator panels did not stretch to the tallest card in their row; a zero-production day drew a sliver that read as "a little"; the menu's separator carried margins that gave the sidebar a horizontal scrollbar.
- Fixed while verifying step 3: the section strip was 53px inside the 44px row because `overflow-x-auto` also turns the vertical axis to `auto` and the reserved scrollbars grew the nav; both axes are pinned and the scrollbar is hidden.

## Partially Completed

- TASK-0029 site-wide search: navigation palette done; record-level search still open.
- OQ-027 (flow methods) still open. TASK-0030 and TASK-0031 still REVIEW.

## Current State

PHASE 01 (QUESTIONS_PENDING) on branch `feature/presentation-sandbox`. Steps 1–2 pushed; steps 3, 4 and 5 sit in the working tree with their records, awaiting the owner's commit approval. The transfer is functionally complete.

## Next Task

1. Owner reviews the whole shell in the real panel (TASK-0032…TASK-0036), including the role switcher and the phone width.
2. Commit and push steps 3–5 once approved.
3. Then either answer OQ-027 (flow methods) or return to Phase 01 requirement rounds (TASK-0020, TASK-0021). The navigation sandbox (TASK-0031) can be retired once the product shell is accepted.

## Open Questions

OQ-007, OQ-010…OQ-017, OQ-020, OQ-026, OQ-027.

## New Decisions

D-057…D-069 (CHG-004 product transfer).

## Deferred Items

DEF-001…DEF-005.

## Technical Debt

- Everything from the previous handoff still stands (ESLint deprecation warning, vendored COSS sidebar English strings, M0 `previewAccessPolicy`, no lockout / 2FA recovery / audit log yet).
- Sample data to replace later: badge counts (`sampleWorkCounts`), seats (`preview-roles.ts`), notifications (`sample-notifications.ts`), sites and site sections (`modules/sit/ui/site-context.ts`, `/sites` routes), every figure on "Bugün" (`dashboard-widget-registry.ts` sample fields, `today-work.ts`). The `/sites` route now has its own page, so it is excluded from the generated module placeholders.
- The sandbox prototype still mirrors navigation labels by hand and has drifted from the registry; it goes away when the transfer is accepted.

## Known Bugs

None open.

## Tests Run

`npm run check` (typecheck, lint with boundaries, 64 unit tests, Prettier) and `npm run build` pass. Step 3 browser (temporary signed-out probes, deleted): row at 44px with no scrollbars, correct section and day addresses, next-day disabled on today, Turkish calendar with future days disabled and the chosen day selected, 375px without horizontal scroll, no console errors; a mirror probe proved the slot shows the row on a site address and nothing on `/dashboard` or `/sites`, on both full load and client-side navigation. Step 4 browser (same kind of probe, deleted): all four seats — the owner's nine rail rows down to the crew lead's three — work block, folded indicators (6 → 15), both charts in light and dark, site rows leading into the context row, equal card heights, 375px without horizontal scroll, no console errors. Step 5 browser (the owner's own session was open in the pane, so the real panel this time): bottom bar at 375px with badges and the centred action, module drawer with Turkish-insensitive search, navigation closing the drawer, site detail with header + context row + bottom bar, desktop unaffected.

## Verification note

The Browser pane in this session runs hidden, so CSS transitions do not advance while it is not painting: width and position readings taken during an animation are meaningless there, and a "the sidebar no longer opens" measurement turned out to be that artifact. Static layout, hrefs, classes and text are reliable; anything about motion needs the owner's own eyes.

## Important Context

- Owner is not a developer; explain choices in plain Turkish; never take an action without asking.
- Do not re-ask answered questions; admin-configurable settings need no default values (D-040).
- The existing layout (inset frame, `--layout-gap`, 56px header, drag rail) must not break during the transfer.
- `src/components/ui`, `src/lib`, `src/hooks` are COSS CLI-managed; do not edit by hand. Report and log every COSS/Tailwind default deviation.
- Before writing Next.js code, read the relevant guide in `node_modules/next/dist/docs/`. Next 16 renamed middleware to `proxy.ts`.
- Never handle secrets. Never enable claude-mem Cloud Sync. Never force-stop the claude-mem worker. No AI attribution in commits.
