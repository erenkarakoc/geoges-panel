# CHANGELOG

## 2026-09-18 — The shell work is approved

- The owner approved the eight tasks that were waiting: the presentation sandbox, the five steps of the navigation transfer, the emptied approval and task screens, and the CHG-005 record machinery. CHG-003, CHG-004 and CHG-005 are closed in the roadmap register, and nothing runs in parallel with Phase 01 any more.


## 2026-09-18 — One branch (D-109)

- The owner removed the separate-branch rule: work goes straight to `main` in small, frequent commits. The two direct-to-`main` exceptions written down earlier the same day are now simply the rule.
- What keeps that safe is that `main` must be green on every commit — `npm run check` before committing, the pre-commit gate for the records, and, once CI exists, no new work on top of a red build. Spike branches stay, and stay unmerged, because spike code never becomes product code (ADR-007).


## 2026-09-18 — The work layer stops pretending (TASK-0040)

- The five shell tasks awaiting review were checked against the CHG-006 decisions. Three were untouched by them (context row, "Bugün", phone bar). The rest carried sample content that now contradicted the decisions: an approval queue with two outcomes where there are three, and tasks and notifications that could not say what produced them.
- The owner chose to remove the samples rather than dress them up (D-106). "Onaylar" and "Görevler" show their empty states, the bell says "Bildirim yok." with no count, the badges show nothing, and the "Bugün" figures that mirrored those lists read zero — an empty list next to "3 bekleyen onay" would have been the same contradiction D-070 once fixed. An empty work block also stopped wearing the "Örnek veri" label, which only makes sense on sample rows.
- What the real screens must do is recorded instead: three outcomes, a mandatory reason on reject and send-back (D-107), and a visible source on every approval, task and notification. The "İş Akışları" entry waits for its own question-and-brainstorm round (D-108).
- `app-sidebar.tsx` is Prettier-clean again, so `npm run check` passes on the whole tree for the first time since TASK-0032.


## 2026-09-18 — CHG-006 folded into the plan

- The owner read the impact analysis and approved it. The record-type builder gets its own step, **09R**, after the Slice 1 pilot (D-105): no slice depends on it, so no module screen waits for it, and it is shaped by real use.
- ADR-006 now carries the whole ruleset — the two new nodes, three-outcome approvals, free windowed conditions with their safeguards, the trigger list, the four ways to address a step, the authority model with its one hard rule (flow design only for full-visibility roles, enforced in code), publish controls, templates as copies, traceability, chained short flows, and the list of what the designer can never do. ADR-005 records, in so many words, that the record-type builder is a deliberate step toward what it once rejected, and names D-077 as the line that keeps the panel from becoming a low-code platform.
- The roadmap gained CHG-006 scope in Phases 01, 02, 03, 04, 06, 07 and 08 and a new Phase 09R. TASK-0041 (capability catalog) and TASK-0042 (§45 as real flow definitions) were opened. §45 moved from `REQ-NFR` to `REQ-WFL`, closing the last open CHG-005 finding.
- The palette test moved to `docs/workflows/README.md` with how each gap was closed; the root direction file was deleted, as it had said it would be.
- A new validator check — every task row must have six columns — found three malformed rows on its first run (TASK-0025, TASK-0026, and TASK-0038 from this session), all fixed.
- The owner's product-code freeze ended with this fold. ADR-007 applies as before: Phase 01 is still design.


## 2026-09-18 — The workflow platform is decided, question by question (OQ-028 → CHG-006)

- The owner answered all of OQ-028 in seven rounds: 28 questions, recorded as D-077…D-104 with a CHG-006 impact analysis. Plain-language question boxes, three or four at a time, each with a recommendation; where the owner went another way the AI's objection is written next to the decision rather than argued again.
- Where it landed: calculations stay fixed and processes become configurable; code may be split finely but the controlled boundary stays at the 25 modules, with contract tests so a module can never silently break a flow built on it; a flow never writes the ledger; a running flow acts with system authority, made safe by allowing only full-visibility roles to build flows; approvals have three outcomes; conditions may look back over time freely; an end-to-end process is short flows triggering each other.
- The owner chose the **free record-type builder** — people define their own record types with fields, relations, screens and reports — after being told twice what it costs. RISK-002 grows and RISK-010 is new.
- The owner's note mid-round — the designer decides which roles and permission types touch each step, and roles are made of permission types — became D-097, D-098 and D-101: steps can be addressed by permission type, role, relationship or person; there is no temporary permission; the designer defines and assigns roles while designing.
- A correction, recorded where it was made: two of the options in round 3 described the same phase order, so the owner's choice keeps the roadmap order unchanged, and the first note that it made RISK-005 worse was wrong.
- E-mail as a flow trigger is deferred (DEF-006). The five shell tasks awaiting review are to be re-reviewed against these decisions (TASK-0040) before approval.
- Nothing in the roadmap has moved yet: the fold waits for the owner's approval of the impact analysis and one open choice — where the record-type builder is built.


## 2026-09-17/18 — The records now check themselves (CHG-005)

- An audit of the state system found **nine contradictions**. The roadmap was two days stale and did not contain CHG-003 or CHG-004 at all, although both were approved and largely built; `CODE ALLOWED` forbade code that had already shipped; Milestone M1 still promised a first screen that M0 had already delivered; Phase 02 was marked `NOT_STARTED` while D-054…D-070 decided most of it; Phase 07's scope listed finished work; ten tasks sat under the wrong heading; six "Last updated" stamps were wrong; hundreds of `§` citations pointed at a directory scheduled for deletion; and the §45 flows were filed under `REQ-NFR`. All are fixed or explicitly recorded.
- **The roadmap is now the single authority** and says so in its own header. It gained a change-request register (CHG-001…CHG-006, each with the phases it moved) and a "work delivered ahead of its phase" table, so no phase is entered believing its scope is untouched. Phases 02 and 07 are `PARTIALLY_DONE`, each listing what was delivered and what it still owes.
- **Milestone M1 was redefined rather than cancelled** (D-074): its original content was consumed locally by M0 and CHG-004, so it becomes the staging milestone — the same screens plus foundation services on a deployed environment, with proven deploy and rollback. What local review never proved: environment configuration, secrets handling, session behaviour behind the proxy, restore and rollback.
- **`docs/sources/` may no longer be deleted on schedule** (D-075). TASK-0027 is `BLOCKED` behind a new TASK-0039 that remaps every `§` citation to a REQ id. Deleting first would have stripped the reasoning out of the decision record.
- Rules alone were not the answer, because the rules already existed — what was missing was anything that checks them. So: `scripts/check-records.mjs` (`npm run records`, also inside `npm run check`) asserts ten invariants — unique ids, known statuses, every CHG present in the roadmap, every referenced id and path resolvable, stamps not older than the file's last commit. It found two real faults while being written: a duplicate `D-071` and three stale stamps.
- `.githooks/pre-commit` runs it in strict mode and refuses an inconsistent commit; strict mode also requires that a record changed in the commit carries today's stamp. Enabled once per clone with `git config core.hooksPath .githooks`, recorded in `docs/standards/GIT_WORKFLOW.md`.
- **Session continuity stopped depending on a model remembering to write a handoff.** `ai/SESSION_JOURNAL.md` is append-only and written by a `PostToolUse` hook after every file change, so a session that is cut off still leaves an accurate record; a `SessionStart` hook prints a resume block — uncommitted diff, journal tail, unfinished tasks, records verdict — in that order, because the first two are facts the harness recorded and the handoff is only a claim the previous model made.
- Product code is **frozen** by owner instruction until CHG-005 and CHG-006 are closed. The workflow-platform direction is written up in `WORKFLOW_PLATFORM_DIRECTION.md` at the repository root with 21 open questions (OQ-028); it is a proposal, not a decision, and the file deletes itself into the roadmap once answered.
- **The §45 flows were walked against the engine's node palette** at the owner's request, step by step, before anything is built on it. Two of the eight (toplantı kararı, sertifika/İSG) are fully expressible with ADR-006's twelve nodes; the other six exposed **six gaps** — no node creates or updates a record, no node iterates a list ("her zimmet için"), the approval node's reject and send-back outputs are undefined, conditions cannot read a windowed count ("son 30 günde 3 gecikme"), there is no way to wait on an approval from someone who is not a system user (the client, a public authority), and the trigger types are not written down. It also produced a design rule worth more than the gaps: an end-to-end flow is **several short flows chained by events**, not one long definition — 45.1 spans months and eight modules, and modelling it as a single running instance would create process instances that stay open for months and break on every version change.


## 2026-09-17 — The app wears one mark, and the name is text

- The wordmark logos left the product. The square tile is the only logo the application shows now, and the only full logo left anywhere is the particle figure on the sign-in screens, which samples the file directly.
- In the expanded rail the name sits next to the tile as text — GEOGES over PANEL — so the head leaves with the menu labels rather than being a second image to cross-fade. The tile keeps the same place in both states: it had been centring itself in the icon rail, which made it slide sideways as the menu closed, and it now sits on the same centre line as the icons below it.
- `BrandLogo`, its `tone` prop and `BrandFooter` went with the wordmark; `BrandFooter` had no callers anyway.


## 2026-09-17 — Group rows became one element, so their titles animate too

- The work-layer rows animated when the rail opened and closed, but the group titles did not. They were two different components — a collapsible row when the menu was open, a flyout trigger when it was a rail — and swapping components replaces the DOM, so there was nothing for a transition to hold on to.
- The row is one element now and only its behaviour changes: it folds the group open when there is room for the list, and opens the flyout when there is not. Fewer branches, and the titles slide, blur and fade like everything else.


## 2026-09-17 — "Bugün" keeps the work and the figures, and nothing else

- The owner took the two charts and the site summary off the entry screen. What is left is the seat's work block, the six key figures and the fold — which is closer to what the screen is for.
- Nothing was left behind to rot: the bar chart component, its two sample series, the site summaries and the two wide widgets in the registry went with them, and the registry's `size` field with those. The chart is in git history if a screen needs one later.


## 2026-09-17 — Work screens get their own content, and the menu its gutter (D-070)

- "Onaylar" and "Görevler" stopped being generated placeholders. The approval centre runs as a queue: one record fills the screen, a decision brings in the next, and the last one leaves "Bugün temiz" behind — which settles the first question of OQ-027 by building it rather than debating it. "Görevler" lists what is late, what is due today and what is coming, each task naming where it came from and linking to the screen where it is done.
- Sample data stays small on purpose: three approvals, one task per state. Every figure that also appears on "Bugün" was pulled into line with its list, so the badge, the card and the screen can no longer disagree — the approvals card said 12 while the badge said 3.
- The navigation sandbox was deleted: `src/sandbox/navigation`, its route and the account-menu entry. The product shell has replaced it. The presentation sandbox is untouched.
- The menu now sits in an even gutter: 8px to the frame on its left and 8px to the card on its right, in both states. That turned out to remove work rather than add it — with even side padding the custom sidebar width formulas were no longer needed, so the shell is back on COSS's own widths, with a 2px nudge in the collapsed state where the rail is 2px wider than the space it reserves.
- The logo transition became directional: the long logo leaves to the left and blurs, the square one arrives from the right and sharpens, 12px and 2px over 200ms, and nothing at all when the visitor asks for reduced motion. Three things had to be fixed to get there — Tailwind writes `translate-x-*` to the `translate` property, so a transition listing only `transform` left the slide instant; `blur-0` inside a variant did not clear a plain `blur-[2px]`, so the square mark stayed permanently blurred; and the mark, centred in a head that was itself narrowing, drifted left with the closing rail on top of its own animation. It now sits in a box its own size, pinned to the start.


## 2026-09-17 — Phone navigation: the rail becomes a bottom bar (CHG-004 step 5, TASK-0036)

- Below `md` the shell now carries its own bottom bar: Bugün and Onaylar, the seat's primary action in the middle where a thumb reaches, then Görevler and Modüller. Entries are permission-filtered exactly like the rail, so a subcontractor crew lead sees two of them and the owner four.
- "Modüller" opens a full-height drawer with a search box and a grouped icon grid — big targets, no keyboard needed, and the search folds Turkish letters so "santiye" finds the whole Şantiye & Günlük group. Picking a module navigates and closes the drawer.
- The header's menu button and its primary action are desktop-only now, so a phone has one way to navigate instead of two. The top bar keeps the page name, the search icon, notifications, theme and the account.
- The primary action moved into one component that both the header and the bottom bar render, so its behaviour has a single implementation. On a phone it is the plus alone — a round 44px button, its name kept as the accessible label — which gives the four navigation entries their room back.
- Found on the phone: on a site detail the section you were in could start off screen in the scrolling strip. The active section now scrolls itself into view whenever it changes.
- This refines scope §40.2, which describes a hamburger drawer on phones. The drawer survives as the module grid; what changed is that the screens people use every day no longer live behind it.


## 2026-09-17 — "Bugün" replaces the cockpit, and the rail stops jumping (CHG-004 step 4, TASK-0035)

- `/dashboard` is now "Bugün": the seat's own work on the left, its six key figures on the right, the other nine behind a fold, then two charts and the site list. The M0 "Cockpit" heading is gone — the header already names the page, so the body opens with the date.
- Work first, figures second, and every work row reaches its own source: the owner's "Dikkat" rows lead to the pour, the site, the finance screen; the coordinator's lead into the approval queue; the site engineer's into today's log.
- Charts arrived as an approved custom element (COSS has none) without adding a charting library: at this size a bar is a box, so the chart is built from plain elements that keep their rounded ends crisp, take theme tokens directly and carry their own hover text. One series, no legend, only the last value labelled; a day with no work draws no bar, because a sliver would read as "a little"; profit is green and loss red, as those colours mean everywhere else (§40.5).
- Found on screen and fixed everywhere: Geist Mono has no ₺ glyph, so the symbol was falling back to another font and sitting badly against the digits. §4 now reads "only the number is mono" — units and symbols are set in the body font by one shared `Figure` component, which the money component of §4 will build on. As a side effect "318 panel" no longer reads as code.
- Rail refinements from the owner's review: a user who has never touched the menu finds the first group open (a remembered choice still wins, including leaving everything closed); labels are clipped and fade instead of wrapping onto a second line during the 200ms animation; the two logos cross-fade inside a head of fixed height; the app card animates its margin with the rail instead of snapping; and the separator no longer carries its own margins, which had been giving the menu a horizontal scrollbar.
- The sidebar head also gave up COSS's own 8px padding: the logo now occupies the same 56px band as the app header, so it starts level with the card's top edge instead of 8px below it, in both the expanded and the icon state. The square mark grew from 32px to 40px along the way — 48px, which matched the long logo exactly, turned out to be too heavy for the rail.
- Sample data is still sample data, and says so: every figure block carries an "Örnek veri" badge. The objection stands on the record — a panel that shows invented numbers can be mistaken for a real one.


## 2026-09-17 — Context row: the second header line that appears only with an open record (CHG-004 step 3, TASK-0034)

- The row is delivered by Next.js' `@context` parallel route slot rather than by a prop each page has to remember to set. A page with no open record matches a slot page that renders nothing, so the shell is byte-for-byte what it was before: no row, same 56px header, same card.
- Judged on a sample site detail, because SIT does not exist yet: `/sites` lists three sample sites in a COSS `Frame`, and opening one shows the row. Each section is its own address with a Turkish slug (`/sites/kavakli/dokum`), so a section can be shared or bookmarked; the day travels in `?gun=`, and today leaves the address clean.
- Days are chosen with a strip of five plus a calendar popover; future days are disabled on both, and "today" is decided in the company's time zone rather than the server's (`platform/date/day.ts`, calendar days as plain `YYYY-MM-DD` strings so they survive URLs and the server/browser boundary).
- Found while verifying: the section strip was 53px inside a 44px row, because `overflow-x-auto` also makes the vertical axis `auto` and the reserved scrollbars grew the nav. Both axes are pinned now and the scrollbar is hidden.
- Slot behaviour was proven with a mirror probe (deleted): the row appears on a site address and is absent on `/dashboard` and `/sites`, both on a full load and on client-side navigation — the case where a slot otherwise keeps showing the previous page's row.
- Deviations logged as 15a–15c: a conditional second header row, COSS `Tabs` used as navigation links, and a hidden scrollbar on the section strip.


## 2026-09-17 — CHG-004 transfer, step 2: three-zone header (TASK-0033)

- Owner decisions D-061 (development role switcher with four sample seats), D-062 (page name + path, page-declared site selector, wide centred search in COSS's Command layout, page-or-seat primary action), D-063 (sample notifications behind the bell).
- New: `app-header.tsx`, `command-palette.tsx`, `preview-roles.ts`, `site-scope-preference.ts`, `search-text.ts`, `sample-notifications.ts`; registry items may declare `scope` and `primaryAction`; the app layout reads the seat cookie in development only; the account menu gained "Rol olarak görüntüle".
- Found while verifying: the left zone collapsed under the search at narrower widths (now the search gives way first, grid only from `xl`); "gorev" did not find "Görevler" (Turkish-insensitive filter added); the chosen site would reset after visiting a page without a selector (state lifted into the header). Deviation rows 14a–14c. 45 tests.

## 2026-09-16/17 — CHG-004 transfer, step 1: rail in the product sidebar (TASK-0032)

- Owner decision: transfer the approved navigation skeleton into the product shell in five steps without breaking the layout (TASK-0032…TASK-0036). CHG-004 status amended; decisions D-057 (collapsed rail, group flyouts, multiple open groups remembered, logo at head, `/dashboard` = "Bugün"), D-058 ("Onay"/"Görevler" out of the module list; "Genel Bakış" group gone → 5 groups), D-059 (sample badge counts in one place, marked "örnek veri", with a recorded objection), D-060 (next steps: dev role switcher under the account menu, ⌘K in COSS's own Command design, COSS `Frame` where needed).
- Step 1 code: work layer and group icons in `navigation-registry.ts`; rail with flyouts and collapsible groups in `app-sidebar.tsx`; open groups cookie in `sidebar-group-preference.ts`; `app-shell.tsx` reads both cookies on the server. Registry tests extended (35 tests).
- Session interrupted by a usage limit mid-verification; resumed: chevron rotation bug fixed (`group-data-[panel-open]/collapsible` never matched; the trigger itself carries `data-panel-open`), "örnek veri" added to badge tooltip and title, temporary signed-out probe page deleted. Verified in the browser: collapsed rail, flyout, two groups open, open set survives reload. Deviation rows 13a–13d added.

## 2026-09-16 — Navigation rethought: icon rail, header as a toolbar (CHG-004, TASK-0031)

- Owner direction: the left menu must stop being a list of 28 modules stacked underneath one another, the panel must not look like a standard dashboard, and each role should get a flowing path of its own. The diagnosis that drove the design: the menu holds nouns while people work in verbs, and the same structure is asked to serve an owner who sees everything, field roles who see three rows, and coordinators who do not browse at all — they drain queues.
- Four patterns were weighed (command-palette-first, icon rail, role workspace, object-first) and the rail was chosen; then four rail variants were weighed for what its second panel should hold. The owner took the second panel out of the sidebar entirely: its job moves into the header, so the existing shell, `--layout-gap`, `--frame-inset` and the 16:9 frame stay untouched.
- Decided (D-054…D-056): a two-region rail (work layer with badges on top, module groups below a separator); a three-zone toolbar — left is where you are, middle is where you go, right is what you do — with a second row that renders only while an object is open; and "Bugün" as every role's entry screen, composed per role, with the cockpit as the owner's variant rather than a competing entry.
- Prototype built in the development-only sandbox, reachable from the account menu in development. A role switcher shows the same skeleton from four seats: the owner keeps nine rail entries, the subcontractor crew lead keeps three, and nothing about the frame changes between them. Queue mode (approve pulls in the next record) and the empty state that means finished work are shown as demonstrations — those flow methods are still open (OQ-027).
- Module lists never occupy a column: a rail group icon opens its modules as a flyout, and the same entries are reachable from the ⌘K palette.
- Found while verifying: Base UI's Autocomplete reports the input value on every keystroke, so a typed fragment was navigating on its own; selection now requires a value that names an entry, compared without case. The toolbar keeps its context selection in local state, so it is keyed by role and starts fresh when the role changes.
- No product code beyond one development-only menu entry. The real route redirects signed-out visitors to sign-in and returns 404 in production.


## 2026-09-16 — Presentation redesigned as one cross-section

- The first build stacked five sections and read as clutter. Owner direction: simplifying means conveying the same information legibly, not showing less. So the page became a single pan/zoom cross-section with a reading panel beside it: one horizontal band per group, stacked so the stack itself carries the architecture — platform at the bottom because everything rests on it, analysis at the top because it summarises what happens below. A constellation version was built first and dropped: on a flat sky the layering that MODULE_MAP.md describes was not visible.
- Legibility comes from deferral, not omission: with nothing selected the links stay faint, and touching a module lights only its own connections while the rest dim. Picking a flow traces just that path. Each plate carries its connection count, so hubs stand out without a legend.
- `@xyflow/react` 12.11.6 added (MIT, exact-pinned, D-053) for the viewport and edge plumbing only; the nodes and links are our own components and stylesheet, so none of its default look survives. Mermaid was rejected because it owns its rendering and would have dictated the visual style.
- Code shrank from 2351 to 1949 lines with no content lost — the 496-line data file is untouched; the five section components and 942 lines of hand-written layout CSS were replaced.
- Owner request: the page speaks the product's visual language. The sandbox palette, radius and fonts now read the app's global custom properties instead of carrying their own hex values, and its dark-mode block is gone because those tokens already switch. Inheriting a CSS variable is not an import, so the code isolation (D-052) is untouched.
- Group colours stay five distinct hues: they carry which layer a module belongs to, so collapsing them lost information. Four of the five are app tokens (`--muted-foreground`, `--primary`, `--success`, `--warning`); the fifth has no equivalent and is the page's only literal colour, with a dark value of its own. Noted for later: green and amber also mean status elsewhere in the product (§4), so a module is never coloured by state here.
- Icons sit on the plates themselves — a plate has room for one, where a dot did not.
- A roles sidebar was added on the left, opposite the module detail on the right. The records hold no role-to-module link, so rather than inventing one the panel derives it: each module now states which classes of data it carries, and who may see which class is already recorded (§2.4, §2.5). Selecting FIN therefore answers "Saha Mühendisi görmez" from the decisions, not from a guess. A module carrying mixed classes reports "kısmen görür". Picking a flow answers the same question for the flow: the classes its modules carry together are judged as one, so the left panel follows the flow tabs as well as the map. The data-class field is the one inference on the page and is labelled as a proposal; the permission matrix is settled in Phase 01.
- Roles, the visibility matrix and the role rules moved out of the right panel into the new one; with nothing selected it lists all six roles. Roles gained icons, and visibility is shown with eye / eye-off / question icons rather than words alone.
- Each flow gained a sentence saying what it actually achieves, replacing a lead that only described the screen ("Kesitte aydınlanan 2 modül bu akışta sırayla devreye giriyor"). The sentences summarise each flow's own recorded steps (§45), so "Yeni işten tahsilata" now reads as turning a customer request into contracted work, production, a progress payment and finally collected money. The module count moved to a secondary line.
- Technical event ids (`daily_log.approved` and the like) no longer appear on screen; the human label and the modules it sets off are enough for a presentation. They stay in the data as the record link.
- Shared elements are COSS components rather than hand-made ones (owner request): `Badge`, `Button`, `Toggle` for the flow selector, `Table` for the visibility matrix and `ScrollArea` for the reading panel. The ESLint boundary was widened for this — a sandbox may now import the COSS UI layer, still nothing from modules or platform, and still nothing may import a sandbox. Only the section itself (bands, plates, links) stays custom, which is what D-052 approved.

## 2026-09-16 — Development-only structure presentation (CHG-003, TASK-0030)

- New page at `/presentation`, linked from the account menu, summarising the whole application: module map with connections, cross-module events, the end-to-end flows of scope §45, roles and visibility, and the daily log approval cycle. Visualisation first, no detail.
- Built as a sandbox (D-052): `src/sandbox/presentation/` holds its own data, CSS Modules styles and components. ESLint boundaries enforce the isolation in both directions — the sandbox imports nothing from the app (not even COSS UI), and nothing may import the sandbox. Removing the folder, the route, the menu item and the lint element removes the feature completely.
- Production returns 404 for the route and the menu entry is hidden there, so the page never ships. In development it still requires a signed-in session.
- The custom shapes and SVG connector lines are approved for this sandbox only; the COSS-only rule (ADR-009) continues to apply to the product itself.
- Content is sourced from `docs/architecture/MODULE_MAP.md`, scope §2/§9/§13/§45 and decisions D-035…D-040; roles show only what the scope states and mark the rest as decided in Phase 01. It has to be updated when those records change.

## 2026-09-16 — AI attribution removed from history

- Owner request: `Co-Authored-By: Claude …` trailers removed from all commit messages on `main`, `docs/phase-01-kickoff` and `feature/m0-early-first-screen` (18 commits) with `git filter-branch --msg-filter`. Verified per branch: file trees identical, commit count, authors and dates unchanged, 0 trailers left; force-pushed with lease. All commit IDs changed; other clones must re-fetch. Full pre-rewrite backup kept locally as a git bundle.
- Rule added (`ai/PROJECT_RULES.md` §17, `docs/standards/GIT_WORKFLOW.md`): no AI attribution in commits or PRs, for every AI tool.
- Uncommitted formatting change in `src/app/(auth)/two-factor/page.tsx` committed first (owner: leave nothing uncommitted).

## 2026-09-16 — Milestone M0 closed; Projects and CRM in the menu

- Owner approved TASK-0025 (real sign-in, password reset, two-factor) and TASK-0026 (app shell) → DONE. Milestone M0 closed. TASK-0022…TASK-0026 added to `ai/COMPLETED.md`. Code track closed until Phase 07 or an approved change request.
- D-051 (OQ-025): "Projeler" added above "Şantiyeler", "Talepler & Müşteriler" added first in "Ticari"; their placeholder pages are generated from the registry.
- Owner rule: a primary logo is never used in dark mode. Auth screens showed the brand-blue tile in dark mode (`BrandTile` defaulted to `primary`); default is now `theme`, auth shell passes it explicitly, favicon gains a dark-scheme light tile. Rule added to `docs/ui-ux/DESIGN_SYSTEM_RULES.md` §4. Verified in rendered `/sign-in` HTML: no primary tile without `dark:hidden`.
- `ai/CURRENT_STATE.md` stale lines refreshed (branch, next tasks, recent decisions, resolved `.gitattributes` note).

## 2026-09-16 — Pilot, schedule and KVKK answers

- D-048 pilot on sample data (OQ-021), D-049 no target date (OQ-022), D-050 no KVKK legal review with RISK-001 kept open (OQ-024). `ai/OPEN_QUESTIONS.md` rows marked answered; TASK-0021 notes updated. OQ-025 (menu placement of Projects and CRM) re-explained to the owner.

## 2026-09-16 — Two-factor removal, onboarding entry in the account menu

- The second factor can now be removed. Supabase only allows this from an `aal2` session, so the action checks the level itself before calling and gives a plain reason when it is not met. `/two-factor` gained a third mode: a verified session now lands on a management view instead of being redirected to the dashboard (sign-in still goes straight there). Removal is confirmed in an `AlertDialog` (§1.1) and reported as a toast (§13); the screen falls back to the setup view afterwards.
- Two contract tests added: removal is refused before the factor has been cleared, and accepted once the session is at `aal2`.
- The account menu links to the role onboarding screen.

## 2026-09-16 — Brand tiles, no pure white, collapsed-menu click fix

- Square brand tiles (`icon_rectangle_light/dark/primary`) added by the owner. They carry two colours of their own, so they must not go through the `currentColor` swap that serves the monochrome logos: `BrandTile` renders them as images. Used for the favicon, on the auth screens (decoration panel and mobile) and as the collapsed sidebar mark.
- Logo colour is no longer baked into the component: `BrandLogo` takes a `tone` (`theme`, `brand`, `light`, `dark`, `inherit`), default unchanged.
- Owner rule: the panel never paints pure white. `--brand-light` (`#EFEFEF`) replaces it on the light surfaces COSS paints white and on the button label; in dark mode the whole primary ink family uses it too, keeping COSS's own token relationships (`--muted-foreground` stays its own grey).
- Fixed while doing that: the first version wrote the surface tokens on a plain `:root`. Because `brand.css` loads after `globals.css` and both selectors have the same specificity, it also won inside the dark theme, leaving dark mode with light surfaces. The rule is now scoped to `:root:not(.dark)`.
- Fixed: with the sidebar collapsed, the first item of every group could not be clicked. COSS hides the group label with `-mt-8 opacity-0`, which leaves an invisible element sitting exactly on that item and swallowing the click. The label now ignores the pointer while collapsed.
- The auth particle figure is painted heavier in the light theme (dots and opacity ×1.6): brand blue on a light surface reads far weaker than light ink on a dark one. Applied while drawing, so switching theme does not rebuild the field.

## 2026-09-16 — Auth screens and real Supabase sign-in (TASK-0024, TASK-0025)

- TASK-0024 DONE: owner created the Supabase dev project and `.env.local`. Verified without reading key values — both variables set, publishable (not secret) key, file git-ignored, public sign-up disabled, TOTP MFA enabled.
- `AuthProvider` port (`modules/iam/domain`) with a Supabase adapter; provider error codes are mapped to stable failure codes and Turkish messages in the application layer. Screens depend on the port only, so replacing Supabase does not touch the UI (ADR-002).
- Server actions: sign-in, sign-out, password reset request, new password, TOTP enrollment and verification. `src/proxy.ts` (Next 16's renamed middleware) refreshes session cookies and redirects signed-out visitors; access decisions use `getClaims`, never `getSession`. The `aal2` step is enforced again in `(app)/layout.tsx` and on `/onboarding`, because proxy checks are optimistic only.
- `/auth/confirm` exchanges the password-reset `token_hash` for a session; the `next` target is restricted to in-app paths so the link cannot redirect elsewhere.
- D-046: the devl.dev auth design is adopted as the actual design, rebuilt with COSS in the project's own layers — `npx shadcn add` was deliberately not run, so no foreign file layout or second theme stack entered the repo. Their magic-link and Google/Apple sign-in were not taken over (we use e-mail + password + TOTP).
- D-047: `ParticleField` approved as the first custom element (COSS has no decorative canvas). Source image is the GEOGES logo, dot colour follows `--brand-logo`, and `prefers-reduced-motion` paints it once without animation. Deviation register rows 9, 9a, 9b, 10, 11 added.
- 19 new unit tests (port contract with a fake adapter, routing rules, form validation). `npm run check` and `npm run build` pass.
- Browser-verified: signed-out visitor redirected to `/sign-in`, wrong credentials show "E-posta veya parola hatalı." with the e-mail preserved, light/dark and mobile layouts, no page-load console errors. Real sign-in, TOTP and the reset e-mail still need the owner's own account.
- OQ-026 opened: password policy and account lockout (M0 uses a provisional 8-character minimum).
- Feedback rule (owner, 2026-09-16): errors, warnings and success messages are never rendered inside a component — they go to a COSS `Toast`. Field-level validation under an input stays. `ToastProvider` sits in the root layout; `useActionToast` turns a server-action result into a toast. Inline `Alert`s removed from the auth forms. Rules written to `docs/ui-ux/DESIGN_SYSTEM_RULES.md` §13.
- Fixed: the 2FA QR code rendered as a broken image. The running Supabase API returns `totp.qr_code` as a complete data URL while the typings describe a bare SVG, so the code prefixed it twice. The adapter now normalises both shapes and the screen gets a ready-to-use URL.
- Theme control (owner, 2026-09-16): switches light/dark straight on click instead of opening a menu. This drops the explicit "Sistem" option — the first visit still follows the operating system, but after one manual switch the choice is remembered. Say so if the option should come back (e.g. as a long-press or a settings entry).
- Security correction: assurance levels no longer come from `getAuthenticatorAssuranceLevel()`, which reads the user object out of the cookie (Supabase logs a warning that this must not drive access decisions). `currentLevel` now comes from the verified `aal` claim and `nextLevel` from `listFactors()`. An `aal2` session skips the factor call.

## 2026-09-16 — Owner notes: COSS surfaces, site-wide search

- D-045: COSS `Frame`, `Drawer`, `Dialog`, `Menu`, `Sheet` used wherever needed; usage table in `docs/ui-ux/DESIGN_SYSTEM_RULES.md` §1.1.
- D-044: comprehensive site-wide search as a COSS `Command` palette, permission-aware; not in the functional scope (only archive §33.2 and list §41 search), recorded as scope extension. `ai/REQUIREMENTS.md` NFR row added; TASK-0029 (T1) planned across Phases 01–03.

## 2026-09-16 — Fixed-height shell, drag rail, Geist, footer rework

- Sidebar–card distance back to COSS defaults (8px expanded, 14px collapsed); outer layout gap unchanged (1.5rem md, 2.5rem xl). Browser-measured.
- Fixed viewport height: shell `h-svh`, window never scrolls; app card keeps a fixed height and content scrolls inside COSS `ScrollArea`; header pinned at the card top.
- `SidebarDragRail` wraps COSS `SidebarRail`: drag left ≥32px collapses, drag right expands, plain click still toggles. Verified with real pointer drags.
- Logo/copyright footer removed from the app card. A transparent bottom brand strip was added and then removed at owner request. TASK-0028 records the planned functional page footer (fixed to the card bottom, layered above content, bottom-navigation style; Phase 02).
- Font: Geist for body and headings, Geist Mono for code (COSS default Inter), `latin-ext` kept. Rule added: all financial numbers use Geist Mono + `tabular-nums` via one shared formatter (built with the first financial screen).
- Deviation register rows 4, 4a, 5, 5a, 6 updated.

## 2026-09-16 — Wider layout gap around sidebar and app card

- Owner request: wider margins around the whole layout, sidebar included. Single `--layout-gap` token (0.5rem base, 1.5rem from `md`, 2.5rem from `xl`) drives sidebar padding, card margins and the sidebar–card gap. Sidebar width becomes `15rem + 2 × gap` so menu content keeps the COSS width; collapsed width and card offset adjusted accordingly. Deviation register rows 4/4a updated.
- Browser-measured with transitions disabled at 1024px (24px everywhere) and 1440px (40px everywhere), expanded and collapsed. Note: the Browser pane does not advance CSS transitions while in the background, so screenshots can show a frozen mid-animation state.

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

