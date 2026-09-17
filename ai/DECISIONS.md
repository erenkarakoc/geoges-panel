# DECISIONS

Last updated: 2026-09-15

## PHASE DECISION SUMMARY — PHASE 00 (2026-09-15)

Decided by the owner in a four-round question session.

| ID | Decision | ADR |
|---|---|---|
| D-001 | Modular monolith with enforced module boundaries | ADR-001 |
| D-002 | Supabase Cloud (EU Frankfurt), portable toward self-hosted Supabase | ADR-002 |
| D-003 | Cloudflare R2 behind a storage port | ADR-003 |
| D-004 | Next.js hosted on own VPS; Cloud Run only for heavy workloads | ADR-004 |
| D-005 | Targeted flexibility: versioned rules as data, dynamic IAM, catalogs, typed custom fields, ports & adapters, outbox events, immutable ledgers, feature flags | ADR-005 |
| D-006 | Visual workflow designer with fixed node palette, versioned definitions, test-run before publish, no custom-code nodes; included in first release | ADR-006 |
| D-007 | Old codebases fully ignored; build from scratch | ADR-007 |
| D-008 | Design all modules first; validate risky assumptions with spikes; then vertical slices piloted module by module; first slice = Core + Site + Approvals + Cockpit | ADR-007 |
| D-009 | Risk-tiered quality gates; no separate reviewer agent — implementing model performs a distinct self-review step | ADR-008 |
| D-010 | UI exclusively COSS UI + Tailwind CSS; custom elements only after explicit owner approval; devl.dev as inspiration | ADR-009 |
| D-011 | English technical naming; Turkish UI | ADR-010 |
| D-012 | `/ai` English, `/docs` Turkish; UI texts inside components, Turkish only, no i18n framework | ADR-011 |
| D-013 | Excel/WhatsApp/Drive are not record systems; panel replaces Drive archive; tech providers and external APIs are allowed | ADR-012 |
| D-014 | Domains: `geogespanel.com` (no search indexing), `geoges.com` where needed; repo `github.com/erenkarakoc/geoges-panel` | ADR-012 |
| D-015 | Source of truth = Git + `/ai` + `/docs` + ADRs; claude-mem as helper memory for this project; `ui-ux-pro-max` disabled for this project; official skills audited then installed (Supabase, COSS, Vercel React, Cloudflare, Next.js version-matched docs, Tailwind CSS) | ADR-013 |
| D-016 | First release: online-only web. Deferred: data import, offline entry, native mobile | ADR-007, `ai/DEFERRED.md` |
| D-017 | KVKK: EU region only, no additional field encryption; recorded as RISK-001 | ADR-002 |
| D-018 | Flexibility is a primary quality attribute: architecture may be reshaped later through superseding ADRs | ADR-005 |

## Revisions to the original protocol prompt

| Prompt section | Revision |
|---|---|
| §7 Definition of Done | Applied per risk tier (T1/T2/T3) |
| §42 Independent review | Replaced by a documented self-review step by the implementing model |
| §57 Roadmap | Replaced by design-first + spikes + vertical slices roadmap |
| §70–71 Glossary examples | Public-tender examples (poz, rayiç, pursantaj, yaklaşık maliyet) removed; GEOGES domain terms used |
| §26 Tenant isolation, §29 payments | Not applicable to a single-company system unless reintroduced by change request |
| §73 Localization | No i18n framework; Turkish text inside components |
| §45 Skill set | Tailwind CSS added (no official skill exists → Tier C audit); Next.js via version-matched bundled docs |

## Skill decisions (2026-09-15)

| ID | Decision | Ref |
|---|---|---|
| D-019 | Skills are vendored into `.claude/skills/` from audited, pinned commits; no installer CLI | `ai/AI_SKILLS.md` |
| D-020 | Installed: supabase, supabase-postgres-best-practices, coss, coss-particles, react-best-practices, composition-patterns, cloudflare (no MCP), tailwind-4-docs (Lombiq) | ADR-013 |
| D-021 | Next.js guidance = version-matched bundled docs + `AGENTS.md` pointer (upstream skill discontinued) | ADR-013 |
| D-022 | claude-mem enabled at project scope, local-only; `ui-ux-pro-max` disabled at project scope | ADR-013, ADR-009 |

## Change requests

### CHG-001 — Early preview of authentication screens and application shell (RESOLVED)

- **Requested change:** Owner wants to see a first usable screen early — authentication pages and the general panel structure (navigation, layout) — without breaking the roadmap.
- **Reason:** Visibility and early feedback on look & feel before the long design phases finish.
- **Conflict:** ADR-007 (all design before product code).
- **Affected requirements:** Scope §2 (login, 2FA, role onboarding), §40–§43 (navigation, top bar, list/detail/form standards, light/dark, brand).
- **Affected features/tasks:** Phase 02 (UX), Phase 07 (foundation: scaffold, design tokens, app shell, IAM).
- **Affected database/APIs/permissions:** Depends on option — none for a UI-only preview.
- **Affected tests:** Preview must be excluded from product quality gates if throwaway, or meet T2 if kept.
- **Migration requirement / backward compatibility:** None for UI-only preview.
- **Risks:** Look & feel decided before UX analysis (rework); preview mistaken for real system; premature auth/data decisions if backend is included.
- **Options (to be decided by owner):**
  1. **UI preview right after Phase 00 (recommended):** Next.js + COSS + Tailwind scaffold with brand tokens, login / 2FA / password-reset / onboarding screens (devl.dev inspiration), app shell with role-filtered left navigation, top bar, light/dark mode and empty module pages. Mock login and mock data only — no Supabase, no real data, no deploy. Reviewed again in Phase 02; kept only if it passes Phase 02/07 standards.
  2. **Clickable prototype after Phase 02:** same scope, but built after UX flows are designed (less rework, later visibility).
  3. **Walking skeleton after Phase 00:** real Supabase Auth login + app shell on staging. Earliest real system, highest risk of premature auth/infra decisions.
- **Recommended approach:** Option 1, recorded as a new Phase 00B ("Early UI Preview") with its own exit criteria; ADR-007 amended rather than replaced.
- **Owner decision (2026-09-15):** No early preview. The first screen is shown after the critical infrastructure is complete — "no rush". Implemented as Milestone M1 at the end of Phase 07 (real authentication + application shell on staging). ADR-007 unchanged; roadmap approved with this milestone.
- **Status:** RESOLVED

### CHG-002 — Early first screen now: authentication + dashboard, built to be extended (PROPOSED)

- **Requested change (owner, 2026-09-15):** see a simple first screen now — authentication pages and a dashboard — built so later work goes on top of it without rework. Flexibility and ease of change remain primary (ADR-005).
- **Reason:** early visibility; owner re-evaluated after the time estimate for Milestone M1 (≈11–16 weeks).
- **Conflicts (stated explicitly):** CHG-001 owner decision "no early preview, first screen at M1 (Phase 07)"; ADR-007 design-first; `ai/CURRENT_STATE.md` Phase 01 does not allow application code. Resolution requires owner approval of this CHG; ADR-007 is amended (not replaced) with a Milestone M0 track.
- **Affected requirements:** scope §2.7–§2.8 (sign-in, 2FA, password reset), §3.1–§3.3 (cockpit), §40.1–§40.5 (left navigation, top bar, mobile, light/dark, brand).
- **Affected features/tasks:** new Milestone M0 track running in parallel with Phase 01; part of Phase 07 scope (scaffold, lint/format/boundary rules, design tokens, app shell) pulled forward; Phase 07 M1 still delivers real auth, 2FA, audit and staging.
- **Database / APIs / permissions:** none in option A (mock data, mock auth). Option B needs a Supabase dev project (OQ-012) and touches OQ-020 early.
- **Tests:** code that is kept meets T2 gates: type-check, lint, boundary rules, unit tests for the auth port and navigation/dashboard configuration, accessibility checks (WCAG 2.2 AA), responsive review.
- **Migration / backward compatibility:** none for data. The mock auth adapter is replaced by the Supabase adapter in Phase 07 behind the same port, without UI changes.
- **Design for extension (owner requirement):**
  - Next.js App Router with route groups `(auth)` and `(app)`; module folders by owner module (`modules/iam`, `modules/rpt`), shared platform layer (`platform/ui`, `platform/config`); no generic `utils/`.
  - `AuthProvider` port (sign in, sign out, current session, 2FA challenge, password reset) with a mock adapter; screens depend only on the port.
  - Navigation and dashboard widgets are data-driven registries (module, label, icon, route, required permission), so modules and role filtering are added by configuration, not by editing the shell.
  - COSS UI components wrapped in the project composition layer; design tokens central (`#0F4C81`, `#DDDBDB`, status colors, light/dark); Origin examples as design reference (D-042).
  - Architecture boundary lint from day one; Turkish UI text inside components (ADR-011); mock data clearly labeled "örnek veri".
- **Risks:** look & feel decided before Phase 02 UX (rework of screens, not structure); preview mistaken for a real system (mock label, local only); provisional technical choices (package manager, folder layout) recorded as provisional and re-reviewed in Phase 03/07.
- **Options:**
  - **A (recommended):** local UI preview on the owner's computer with mock auth and sample data; production-quality structure. Estimate with AI: ≈3–5 working days including owner review rounds.
  - **B:** A + real Supabase Auth on a dev project. ≈1 extra week; requires the owner to open a Supabase account; data-access decision (OQ-020) pulled forward.
  - **C:** A or B + online private preview link. Requires hosting decision (OQ-010/OQ-011) or a temporary host; noindex mandatory (ADR-012).
- **Tooling found (2026-09-15):** Node 24.13.1, npm 11.8.0, Bun 1.3.13, Docker 29.7.2; latest Next.js 16.3.5, `@base-ui/react` 1.8.0, Tailwind CSS 4.3.3.
- **Owner decision (2026-09-15):** **Option B approved** — real Supabase Auth on a dev project, local preview (no online link). Dashboard: empty card skeleton (no sample numbers; content defined in Phase 02). Auth screens: email + password sign-in, 2FA, password reset, new-role onboarding (§2.7).
- **Implications recorded:** auth work is T1 (owner approval of auth rules, tests, documented self-review). No domain tables are created; only Supabase Auth is used. Public sign-up is disabled (accounts are created by authorized admins). The owner creates the Supabase account/project and places keys in the local env file (AI never handles secrets). Onboarding content is static until roles are designed (Phase 01/04). Provisional choices (package manager, folder layout, data-access for auth via `@supabase/ssr`) are re-reviewed in Phase 03/07 (OQ-017, OQ-020).
- **Status:** APPROVED — Milestone M0 track (TASK-0022…TASK-0026).

### CHG-003 — Development-only structure presentation page (APPROVED)

- **Requested change (owner, 2026-09-16):** a presentation page, reachable from the account menu, that summarizes the whole application structure and its connections, visualization first, not detailed.
- **Conflicts (stated explicitly):** code is closed after M0 (ADR-007); UI is COSS-only with owner approval for custom elements (ADR-009).
- **Owner decisions:** approved in parallel with Phase 01; content = module map and connections, end-to-end flows, roles and visibility, daily log approval cycle; visible to all signed-in users; COSS-style cards with SVG connector lines; built as an isolated sandbox with its own styles and scripts, used only during development (D-052).
- **Affected:** no requirements, database, APIs or permissions. New route `/presentation`, account menu (development only), ESLint boundaries.
- **Risks:** content drifting from the docs — data is sourced from `docs/architecture/MODULE_MAP.md`, scope §2/§9/§13/§45 and decisions, and must be updated when those change; roles show scope facts only.
- **Rollback:** delete `src/sandbox/presentation`, `src/app/(sandbox)`, the menu item and the sandbox ESLint element.
- **Status:** APPROVED — TASK-0030.

### CHG-004 — Compact navigation: header as a toolbar, work layer on the sidebar rail (APPROVED)

- **Requested change (owner, 2026-09-16):** the left navigation must become compact instead of listing every module underneath one another; the panel must move away from the standard dashboard look; each role should get a flowing UX of its own on top of the same skeleton.
- **Analysis:** the menu lists **nouns** (Stok, Finans, Arşiv) while users think in **verbs** (onayla, kaydet, bak). Three different realities collide in one structure: the owner/general manager see all 6 groups and 28 modules (the list overflows), field roles see 3–4 rows after permission filtering (the menu is nearly empty and the day is spent on one screen), and coordinator/technical office/accounting do not browse modules at all — they drain queues. The header is at the same time almost empty (`app-shell.tsx`: sidebar trigger on the left, theme toggle and user menu on the right).
- **Patterns evaluated (2026-09-16 research round):** (A) command-palette-first nav-light, (B) icon rail with a second panel, (C) role workspace switcher, (D) object-first navigation. The rail (B) was chosen as the skeleton; its second panel was then evaluated in four variants (B1 permanent module panel, B2 flyout, B3 context panel, B4 full-screen launcher). The owner chose to move the second panel's job into the header instead of opening a second sidebar column, which keeps the existing shell untouched.
- **Approved structure:**
  - **Header = three-zone toolbar with a conditional context row (T2).** Zone rule, identical in every module: **left = where you are** (context selector), **middle = where you go** (⌘K search/command, D-044), **right = what you do** (role-specific primary action, notification and queue badges, theme, user menu). A second row renders **only when an object is open** (breadcrumb/tabs of that object plus a date strip) and is not rendered at all otherwise, so screens without context keep today's layout exactly.
  - **Work layer stays on the sidebar rail (option a).** Its top region holds "Bugün", "Onaylar" and "Görevler" as badged entries; the module groups sit below a separator. This maps directly to a mobile bottom bar (§40.2) and keeps the header free for context and action.
  - **"Bugün" is the entry screen for every role**, composed per role: cockpit + "Dikkat" for the owner (§3.1–§3.3), the approval queue for the coordinator (§4, §13), today's site log for the site engineer (§9.3–§9.6), a single flow for the subcontractor crew lead (§2.5).
- **Affected requirements:** §40.1 (left menu order and grouping — kept, but the list moves behind the rail), §40.2 (mobile), §40.3 (top bar: this CHG defines its content), §41–§43 (list/detail/form patterns now inherit the toolbar), §3 (cockpit becomes the owner's "Bugün"), §4 (approval centre), §25.4–§25.5 (tasks and notification drawer feed the badges), §2.5/§2.7 (role-specific composition).
- **Affected features/tasks:** Phase 02 screen design (every screen must declare its context row and primary action); TASK-0029 (site-wide search is the toolbar's middle zone); TASK-0031 (this prototype); D-051 stays valid — the two added modules keep their places inside the group list.
- **Database / APIs / permissions:** none for the prototype. For product code later: badge counts need permission-filtered approval and task queries, and pinning/recents would need a user-preference store (Phase 03 IAM).
- **UI / code impact if approved for product code:** `app-shell.tsx` header block plus a new `platform/ui/app-shell/app-toolbar.tsx` composition; an optional `contextBar` prop so pages without context are untouched; `navigation-registry.ts` gains the work-layer entries and a group-icon field; `docs/ui-ux/DESIGN_SYSTEM_RULES.md` §4.1 gains deviation rows (COSS header is a single row; ours is conditionally two).
- **Tests:** prototype is T3 (sandbox, no product code). Product implementation is T2: registry unit tests, keyboard navigation and focus order, WCAG 2.2 AA, desktop/tablet/mobile review, all mandatory screen states (§6 of the design rules).
- **Migration / backward compatibility:** none. `contextBar` is optional and the shell renders as today when it is absent.
- **Risks:** header height changes between 56px and 92px as context appears and disappears (content must not jump); the context row's content has to be designed screen by screen in Phase 02; icon-only rail entries hurt discoverability for infrequent users (mitigated by tooltips, the ⌘K palette and the expanded rail state); badge counts create live queries on every page load.
- **Owner decision (2026-09-16):** T2 (three-zone toolbar + conditional context row) and option (a) for the work layer approved. "Bugün" is the entry screen for every role. Built first as a sandbox prototype; product code stays closed until the prototype is approved.
- **Status:** APPROVED for the sandbox prototype (TASK-0031). Product implementation waits for Phase 02 design and Phase 07.
- **Owner decision (2026-09-16, amends the status above):** the approved skeleton is transferred into the product shell now, step by step, deciding for each step where it lands in the existing layout by question and answer. The existing layout must not break (shell, `--layout-gap`, frame). Five steps, each a T2 task: (1) rail — work layer + group structure (TASK-0032), (2) header three zones, height stays 56px (TASK-0033), (3) conditional context row via an optional `contextBar` prop (TASK-0034), (4) "Bugün" screen on `/dashboard` (TASK-0035), (5) mobile: rail → bottom bar below `md` (TASK-0036). Rollback point before the transfer: commit `3a83586`. Decisions: D-057…D-060.

## Further decisions (2026-09-15)

| ID | Decision | Ref |
|---|---|---|
| D-023 | Roadmap approved, including Milestone M1 in Phase 07 | `ai/MASTER_ROADMAP.md`, CHG-001 |
| D-024 | Tailwind docs snapshot: owner accepts the Tailwind docs license for local use on this machine only; snapshot is never committed or pushed | OQ-008, `ai/AI_SKILLS.md` |
| D-025 | claude-mem telemetry declined | OQ-009 |
| D-026 | UI label for the `SIT` (Site Operations) module and the site concept is "Şantiye" (not "Saha"); code term stays `site` | Owner 2026-09-15, `docs/domain/GLOSSARY.md` |

## PHASE 01 — glossary round 1 (2026-09-15, OQ-007 partial)

| ID | Decision | Ref |
|---|---|---|
| D-027 | One company record (`Party`) per real-world firm with roles (`client`, `customer`, `supplier`, …); client of application work and product-sales customer are the same record when it is the same firm; party account balance is per party | Scope §5.3, §6.9, §22.6 |
| D-028 | Loss concepts confirmed as distinct record types: Process Loss (fire) = measured in/out quantity difference in factory processing, galvanizing or shipment (weighed); Damaged Unit (zayi) = unusable panel/product (quantity + reason + photo mandatory); Scrap (hurda) = sellable material separated from process loss or damaged units | Scope §10.8, §18.6, §20.1 |
| D-029 | Guarantees take three forms, all tracked: letter of guarantee, retention deducted from client progress payments, cash guarantee | Scope §16.1, §24.1, §24.7 |
| D-030 | Subcontractor payment methods: unit rate (approved quantity × unit price), lump sum (fixed agreed total for work or a part), day rate (days or person-days). Extends scope §15.1/§16.4 wording, which described unit rate only; requirements must cover all three | Scope §15.1, §16.4 |

## PHASE 01 — glossary round 2 (2026-09-15, OQ-007 open terms closed)

| ID | Decision | Ref |
|---|---|---|
| D-031 | "Kademe" = the course (horizontal row / height level) a panel sits in on the wall (1st course, 2nd course…); panel type definitions may state which course(s) they are used in | Scope §10.1, §36.1 |
| D-032 | Lug is a single standard item tracked by quantity (no lug types) | Scope §17.4, §18.1 |
| D-033 | A party with several roles (e.g. client and supplier) has one net party account balance; receivables and payables offset automatically | Scope §22.6, D-027 |
| D-034 | Party account balances are kept per currency (e.g. EUR balance), each shown with its current TRY equivalent; exchange differences are calculated separately. Combined with D-033: one net balance per party per currency | Scope §22.5, §22.6 |

## PHASE 01 — Slice 1 requirement round 1 (2026-09-15, TASK-0021)

| ID | Decision | Ref |
|---|---|---|
| D-035 | Scope §9.2 chain "site engineer → coordinator → technical office → HR" is the **entry responsibility fallback order** for the daily site log (next role enters when the previous is unavailable), not an approval chain. Approval of the daily site log is given by the coordinator (§13); management can reassign entry per site or period | Scope §9.2, §13 |
| D-036 | All users, including field staff and subcontractor crew leads, sign in with email + password (2FA rules per §2.8 still apply) | Scope §2.8 |
| D-037 | Daily site log submission deadline is configured in the panel by authorized management (per site or project); no default value is fixed in requirements. Missing the deadline raises a warning | Scope §3.3, §9; owner clarification 2026-09-15 |
| D-038 | Days marked as holidays in the working calendar require no daily site log; on any other day without work a short "no work" log with a selected reason (weather, client waiting, …) is mandatory | Scope §9.3, §14.3, §23.9 |
| D-039 | Email addresses: company employees get a company-domain address; subcontractor crew leads may use a personal email. Panel access is revoked in the panel regardless of mailbox ownership | Scope §2.8, D-036 |
| D-040 | Approval fallback: the approver's active delegate approves first; if there is no delegate or the configured waiting time passes, the approval escalates to the approver's superior role. Roles, their permitted actions, approval assignments, delegation and escalation times are all configurable in detail by authorized administrators (general principle, not specific to daily logs) | Scope §2.1, §2.3, §4, §25.3; ADR-005, ADR-006 |
| D-041 | Owner-only approvals while the owner is unavailable: an owner-designated delegate may give them for an owner-defined period; every action taken is reported to the owner (answers OQ-023) | Scope §2.3, §2.4 |

## UI decisions (2026-09-15)

| ID | Decision | Ref |
|---|---|---|
| D-042 | For advanced components, COSS Origin (https://coss.com/origin) examples are the first design reference. Origin is a Radix-based legacy snapshot (verified in `cosscom/coss` `apps/origin`: `radix-ui` imports, no Base UI; README "Legacy snapshot"; MIT), so its code is not copied; the design/behavior is rebuilt with COSS UI primitives and Particles. Owner chose this over copying Origin code (which would mix Radix and Base UI and need a superseding ADR) | ADR-009, `docs/ui-ux/DESIGN_SYSTEM_RULES.md` §3.1 |
| D-043 | Second factor for 2FA is an authenticator app (TOTP, Supabase Auth MFA); SMS is not used. Which roles must use 2FA stays admin-configurable (§2.8, D-040). Recovery method for a lost device to be designed in Phase 03 | CHG-002, scope §2.8 |
| D-044 | Comprehensive in-app (site-wide) search across modules, opened as a command palette built with the COSS `Command` component (top bar + keyboard shortcut). Results must respect permissions and data classification (no commercial/sensitive data leak). Extends scope: functional scope only defines archive search (§33.2) and per-list search (§41) | Owner 2026-09-16; TASK-0029 |
| D-045 | COSS `Frame`, `Drawer`, `Dialog`, `Menu` and `Sheet` are used wherever the need arises instead of custom surfaces; desktop–mobile pairing decided per screen in Phase 02 | Owner 2026-09-16; `docs/ui-ux/DESIGN_SYSTEM_RULES.md` §1.1 |
| D-046 | The devl.dev auth screens (`/c/auth/login`, `/c/auth/onboarding`) are adopted as the **actual design** of the GEOGES auth screens, not only as inspiration: split layout, particle figure on the left, one form column on the right, mono uppercase eyebrow + heading + description, step indicator. Adaptation is mandatory: their registry items are rebuilt in the project's own layers with COSS components (they already depend on `@coss/button`, `@coss/input`, `@coss/label`, `@coss/kbd`, `@coss/separator`), Turkish text, brand tokens, the project's own theme provider. Not taken over: their dual theme system (`lib/themes`), their figure PNGs (unavailable and unlicensed), magic-link + Google/Apple sign-in (we use e-mail + password + TOTP, D-036/D-043). `npx shadcn add` was deliberately not run, so no foreign file layout or duplicate theme stack enters the repo | Owner 2026-09-16; ADR-009, `docs/ui-ux/DESIGN_SYSTEM_RULES.md` §3 |
| D-047 | Custom element approved (the first one, per ADR-009 §1): `ParticleField`, a canvas that samples an image and paints it as spring-held dots reacting to pointer and typing. COSS has no decorative canvas primitive, so this cannot be built from COSS. Adapted to the project: the source image is the GEOGES stacked logo, dot colour follows `--brand-logo`, `prefers-reduced-motion` paints the figure once without animation, and the morph/multi-figure machinery of the original was dropped as unused. Used only in the auth shell | Owner 2026-09-16; `src/platform/ui/auth/particle-field.tsx` |

## PHASE 01 — Pilot, schedule and KVKK (2026-09-16, OQ-021/022/024)

| ID | Decision | Ref |
|---|---|---|
| D-048 | The first pilot runs on **sample data**, not a real site with real staff. No pilot site or pilot user group is named yet (answers OQ-021) | Owner 2026-09-16; ADR-007 vertical slices |
| D-049 | No target date is set for design completion or the pilot; the project is not schedule-driven (answers OQ-022). Sizing and sequencing still come from the roadmap | Owner 2026-09-16 |
| D-050 | No KVKK legal review is commissioned (answers OQ-024). Combined with D-048 the pilot processes no real personal data, so the exposure starts only when real HR records are entered. RISK-001 stays open and must be raised again before that point | Owner 2026-09-16; RISK-001 |
| D-052 | Development-only presentation page (CHG-003): a self-contained sandbox in `src/sandbox/presentation/` with its own CSS Modules styles, data and scripts, exempt from the COSS-only UI rule because it never ships (production returns 404). Its palette, radius and fonts read the app's global CSS custom properties so the page speaks the product's visual language (owner 2026-09-16); that is inheritance, not an import, so the code isolation stands. It visualizes the module map and connections, end-to-end flows (§45), roles and visibility (scope facts only), and the daily log approval cycle. Visible to every signed-in user in development, linked from the account menu in development only. Diagram shapes and SVG connector lines approved as sandbox-only custom elements. The sandbox may import the COSS UI layer (owner 2026-09-16: shared elements are the product's, not hand-made) but nothing from modules or platform, and nothing may import it (ESLint boundaries) | Owner 2026-09-16; CHG-003; TASK-0030 |
| D-053 | The presentation sandbox draws its map with `@xyflow/react` 12.11.6 (MIT, exact-pinned). Only its engine is used — viewport, pan/zoom, node and edge plumbing; every node and link is our own component and stylesheet, so none of the library's default look reaches the screen. Chosen over Mermaid, which owns its rendering and would have fixed the visual style. Scoped to the development-only sandbox (D-052), so it never ships to production | Owner 2026-09-16; CHG-003; TASK-0030 |
| D-051 | Left menu adds two scope modules missing from §40.1: "Projeler" (PRJ) directly above "Şantiyeler" in "Şantiye & Günlük" (sites belong to a project), and "Talepler & Müşteriler" (CRM) first in "Ticari" (sales flow lead → quote → finance). Answers OQ-025 | Owner 2026-09-16; scope §5, §7–§8, §40.1 |

## PHASE 01 — Navigation and toolbar (2026-09-16, CHG-004)

| ID | Decision | Ref |
|---|---|---|
| D-054 | Navigation skeleton is an **icon rail**, not a full-height module list. The rail has two regions: the top holds the work layer ("Bugün", "Onaylar", "Görevler") with count badges, a separator follows, and the module groups (§40.1, six groups) sit below. Group labels and module names stay exactly as recorded — only their presentation changes. A second sidebar column was rejected: the context navigation it would have carried moves into the header instead (D-055), so the existing shell, `--layout-gap`, `--frame-inset` and the 16:9 frame are untouched. The rail maps to a bottom bar on phones (§40.2) | Owner 2026-09-16; CHG-004; scope §40.1–§40.2 |
| D-055 | The header becomes a **three-zone toolbar** with one rule repeated in every module: left = where you are (context selector), middle = where you go (⌘K search and command palette, D-044), right = what you do (role-specific primary action, notification and queue badges, theme toggle, user menu). A **second row renders only when an object is open** — that object's tabs and date strip — and is absent otherwise, so screens without context keep the current layout. This fulfils §40.3 (top bar contents) and replaces the second sidebar panel | Owner 2026-09-16; CHG-004; scope §40.3, D-044, D-045 |
| D-056 | **"Bugün" is the entry screen of every role**, composed per role instead of a single shared dashboard: cockpit + "Dikkat" for the owner and general manager (§3.1–§3.3), the approval queue for the coordinator (§4, §13), today's site log for the site engineer (§9.3–§9.6), a single narrow flow for the subcontractor crew lead (§2.5). The cockpit is therefore the owner's variant of "Bugün", not a competing entry point. An empty screen means finished work ("bugün temiz"), the opposite of a filled dashboard | Owner 2026-09-16; CHG-004; scope §2.5, §2.7, §3, §4, §9, §25.4 |
| D-057 | **Product transfer of CHG-004, step 1 (rail).** The existing COSS sidebar is kept, **collapsed by default** (the user's last choice is remembered by COSS's `sidebar_state` cookie). Collapsed: work layer on top, then **one icon per module group**; a group icon opens its modules as a flyout menu. Expanded: groups unfold in place, **several may stay open**, and the open set is remembered (`sidebar_groups` cookie, rendered on the server so nothing flashes). Logo stays at the sidebar head. `/dashboard` is "Bugün" | Owner 2026-09-16; CHG-004; TASK-0032 |
| D-058 | "Onay" and "Görevler" are **removed from the module list**; they live only in the work layer ("Onaylar", "Görevler"). The "Genel Bakış" group held only "Cockpit", which became "Bugün" in the work layer, so the group no longer exists: the rail shows **5** group icons, not 6. All other §40.1 group names, order and D-051's two modules are unchanged | Owner 2026-09-16; CHG-004; scope §40.1, D-051 |
| D-059 | Work-layer badges show **sample numbers** until approval and task data exist, kept in one place (`sampleWorkCounts` in `navigation-registry.ts`) and marked "örnek veri" in the tooltip and badge title; switching to real permission-filtered counts is a one-line change. Recorded objection (AI): M0 deliberately avoided fake numbers on the cockpit because a number on the panel is read as real | Owner 2026-09-16; CHG-004; TASK-0032 |
| D-060 | Owner requirements for the next steps: (a) a **development-only role switcher** under the account menu, to view the shell as different roles; (b) the ⌘K palette uses COSS UI's `Command` **exactly in COSS's own documented design** (owner screenshot); (c) COSS `Frame` is used wherever a bordered surface is needed (D-045) | Owner 2026-09-16; CHG-004; TASK-0033, TASK-0034 |
| D-061 | **Development role switcher.** Four sample seats from the prototype (Sahip, Koordinatör, Saha Mühendisi, Taşeron Ekip Başı) in `platform/access/preview-roles.ts`, each with sample permissions, a primary action, sites and a notification count. The account menu offers "Rol olarak görüntüle" **only in development**; the choice is a cookie read by the app layout and switching returns to "Bugün". Every other environment renders the owner seat, which sees everything (same as `previewAccessPolicy`). Deleted when IAM delivers real roles | Owner 2026-09-17; CHG-004; TASK-0033 |
| D-062 | **Header zones (step 2).** Left: bold page name, then a muted path "Grup › Sayfa" (path hidden below `lg`, shortens before the name). A **site selector** appears only on pages that declare `scope: "site"` in the registry (now Şantiye Kaydı, Günlük Raporlar); the choice is remembered across those pages (cookie); a seat with one site sees the name as text. Middle: **wide search bar** opening the COSS Command palette in COSS's documented layout (grouped results, key-hint footer), Ctrl/⌘+K; search ignores Turkish letters ("gorev" finds "Görevler"). Right: a **primary action** that is the page's own (`primaryAction` in the registry) or else the seat's; until forms exist it shows the toast "Bu işlem henüz hazır değil" | Owner 2026-09-17; CHG-004; TASK-0033 |
| D-063 | The notification bell is shown with **sample notifications** and a sample count per seat, marked "Örnek veri" in the list (`sample-notifications.ts`), replaced when a notification service exists | Owner 2026-09-17; CHG-004; TASK-0033 |
| D-064 | **Context row (step 3).** The row exists only while an object is open and is delivered by the `@context` parallel route slot, so a page without an object renders no row at all and the layout is untouched. Until the SIT module exists it is judged on a **sample site detail** (`/sites`, three sample sites, `site-context.ts`). Each section is **its own address** — `/sites/kavakli` is "Gün", `/sites/kavakli/dokum` is "Döküm" — with Turkish slugs, because the address is what people see and share. The day is chosen with a **strip plus a calendar** (‹ ›, five days, COSS `Calendar` in a popover, future days disabled) and travels in `?gun=YYYY-MM-DD`; today leaves the address clean. The day selector is part of **every** context row (owner: "her zaman"), so its place never moves. Sample site data is marked "Örnek veri" | Owner 2026-09-17; CHG-004; TASK-0034 |
| D-065 | **"Bugün" screen (step 4).** `/dashboard` is "Bugün", every role's entry screen; the M0 cockpit heading is gone because the header already names the page, and the body opens with the date instead. Work first, figures second: the seat's own block (owner "Dikkat", coordinator approval queue, site engineer today's log, crew lead their one job) and the indicators share the width half and half from `lg` up. Six indicators stand unfolded — production, monthly profit and loss, cash, pending approvals, overdue tasks, critical alerts — and the remaining nine wait behind "Tüm göstergeler". Every figure is **sample data** marked "Örnek veri" (owner's choice over empty skeletons; the AI's objection that a panel showing invented numbers can be mistaken for real is recorded). Each work row reaches its own source (§3.3). Revised the same day by the owner: the two charts and the site summary (§3.2) are off this screen, so "Bugün" is the work block, the six figures and the fold — the site summary belongs with the SIT screens | Owner 2026-09-17; CHG-004; TASK-0035 |
| D-066 | **Charts.** COSS has no chart component, so charts are an approved custom element (ADR-009 §1; owner asked for them on 2026-09-17). No charting library is added: at this size a bar is a box, so `platform/ui/chart/bar-chart.tsx` draws plain elements that keep their rounded ends crisp at any width, take the theme tokens directly and carry their own hover text. One series needs no legend, only the last value is labelled, a day with no work draws no bar, and a negative value turns the chart diverging — green for profit, red for loss, which is what those colours mean throughout the panel (§40.5). "Bugün" used two — fourteen days of production and six months of profit and loss — until the owner took both charts off that screen on 2026-09-17. The component was deleted with them rather than left unused; it returns from git history when a screen needs a chart | Owner 2026-09-17; ADR-009; TASK-0035 |
| D-067 | **Only the number is mono.** §4 puts financial figures in Geist Mono with equal-width digits; that now means the digits alone. Units and currency symbols are set in the body font by the shared `platform/ui/format/figure.tsx`. Reason found on screen: Geist Mono has no ₺ glyph, so a symbol left inside the mono run falls back to another font and sits wrong against the digits — and "318 panel" in mono reads as code. The money component §4 asks for will build on this | Owner 2026-09-17; `docs/ui-ux/DESIGN_SYSTEM_RULES.md` §4 |
| D-068 | **Rail refinements.** A user who has never touched the menu finds the first group open; once they have opened or closed anything their choice wins, including leaving everything closed. Labels never wrap — they are clipped and fade with the rail — because a long title breaking onto a second line during the 200ms animation made the menu jump. The two logos cross-fade in a head of fixed height, the app card animates its margin with the rail instead of snapping, and the separator no longer carries its own margins, which had given the menu a horizontal scrollbar. The sidebar head drops COSS's own 8px padding so the logo occupies the same 56px band as the app header and sits level with the card's top edge instead of 8px below it; the square mark in the icon state is 40px (32px looked lost in the band, 48px too heavy) | Owner 2026-09-17; CHG-004; TASK-0032 |
| D-069 | **Phone navigation (step 5).** Below `md` the rail becomes a bottom bar: the work layer with its badges, the seat's primary action in the middle where the thumb reaches (the plus alone on a phone, its name kept as the accessible label), and "Modüller" opening a full-height COSS `Drawer` with a search box and a grouped icon grid. The header's menu button and its primary action are desktop-only, so a phone has one way to navigate instead of two; the top bar keeps the page name, the search icon, notifications, theme and the account. This refines scope §40.2, which describes a hamburger drawer: the drawer survives as the module grid, but the screens people use daily are one thumb-reach away. Entries are permission-filtered like the rail, so a subcontractor crew lead sees two of them | Owner 2026-09-17; CHG-004; scope §40.2; TASK-0036 |
| D-070 | **Sample screens for the work layer.** "Onaylar" and "Görevler" stop being generated placeholders and get sample screens of their own, as the prototype had them. The approval centre runs in **queue mode** (§4): one record fills the screen, a decision brings in the next, and the queue ends in "Bugün temiz" — which answers the first item of OQ-027 by building it. "Görevler" lists what is late, what is due today and what is coming (§25.4), each task naming its source and linking to the screen where it is done. Sample data stays small — one task per state, three approvals — and every figure that also appears on "Bugün" is kept equal to its list, so no two numbers on screen contradict each other (owner 2026-09-17). The sandbox navigation prototype was deleted the same day: the product shell replaced it | Owner 2026-09-17; CHG-004; scope §4, §25.4; OQ-027 |
| D-071 | **Only the square mark in the product.** The wordmark logos (long, stacked, panel) are out of the application; the one place a full logo still appears is the particle figure on the authentication screens, which samples `logo_light.svg`. The expanded rail shows the square tile with the name set as **text** beside it (GEOGES / PANEL), so the head moves with the menu labels instead of swapping a second image. `BrandLogo`, its `tone` prop and the unused `BrandFooter` were deleted with the wordmark | Owner 2026-09-17; ADR-009; `docs/ui-ux/DESIGN_SYSTEM_RULES.md` §4 |
