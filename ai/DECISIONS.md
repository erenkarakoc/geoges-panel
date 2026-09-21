# DECISIONS

Last updated: 2026-09-21

## Storage decisions after SPIKE-09 (2026-09-21)

| ID | Decision | Ref |
|---|---|---|
| D-249 | **The current R2 bucket stays outside the EU jurisdiction for now.** It holds only synthetic spike data. Whether real personnel files (payroll, medical-report dates, identity documents) require an EU-jurisdiction bucket is decided before any real personnel file is uploaded; jurisdiction is fixed when a bucket is created, so a change then means a new bucket and a copy. | Owner 2026-09-21 ("kalsın"); RISK-001, ADR-003, TASK-0094 |

**Open ADR-003 compliance item (not a decision):** on 2026-09-21 the owner enabled the bucket's public r2.dev development URL, after being asked to confirm it was disabled. Cloudflare documents that this makes every object in the bucket readable without a signature, which bypasses the permission-checked signed links ADR-003 requires. From this machine the r2.dev host resets TLS within 26 ms (it appears blocked on this network), so exposure could not be demonstrated here; the probe object was deleted and the bucket is empty. Recommendation given: disable it (R2 → bucket → Settings → Public Development URL). No real file may be uploaded while it is enabled.

## CHG-008 — Cold-start exception for search latency (D-248, OQ-029, TASK-0091)

Owner decision on 2026-09-21, chosen from four presented options: a keep-warm experiment, a larger compute tier, a cold-start exception, or checking the Supabase memory graph first. The owner chose the exception.

| ID | Decision | Ref |
|---|---|---|
| D-248 | **Cold-start exception to the 300 ms search target.** A search request that exceeds 300 ms because data pages are being touched for the first time after the database instance has been idle is exempt from the SPIKE-12 latency criterion. Warm requests stay bound by 300 ms, and any warm request above it is a failure. Cold observations are kept and reported separately, never deleted. The cold first request is re-measured on the chosen compute when hosting is decided (DEF-008). D-239, RLS and every correctness criterion are unchanged. | Owner 2026-09-21; CHG-008, OQ-029, ADR-017, TASK-0091 |

- **Change and reason:** the 2026-09-21 cold triage, after about ten hours of idle, found no penalty on connection wake-up or pure CPU but a ~9x penalty on the first touch of data pages PostgreSQL counts as shared-buffer hits with zero reads (scan 517 vs 58 ms, search 383 vs 40 ms). Index, plan mode, range rewrite and the one-call wrapper were all measured and none changes it, so query engineering cannot meet the target for the first request after idle.
- **Requirements/features/tasks:** REQ-NFR-012's text is unchanged; its acceptance criteria carry no latency figure. The 300 ms figure lives in the owner-confirmed SPIKE-12 pass criterion and in ADR-017, both amended by this exception. TASK-0090 and TASK-0091 close, SPIKE-14 is unblocked, TASK-0029 is unaffected.
- **Scope of the evidence:** six of the seven cold observations (529, 540, 554, 571, 636 and 462 ms) were the first request of a run after idle. The 392 ms case was the second request of a fresh-connection series and plausibly the first touch of relations the first request did not use, which the triage showed each pay the penalty; consistent, not individually proven.
- **Database/backend/APIs/UI/permissions:** none. No schema change and no product code. The exact-match range rewrite stays a measured recommendation for the Phase 07 search adapter and is not adopted here.
- **Tests:** the speed replay gate is reclassified: the 18 warm series must stay under 300 ms (current maximum 190 ms) and the seven cold observations are listed as excepted. A read-only post-maintenance check passed 19/19 (data totals, index state, scope isolation in three profiles, function privileges, identity cleanup).
- **Risks:** the first user after a quiet period, typically at the start of the day, may wait roughly 0.4–0.6 s for the first search. The mechanism (host memory reclaim during idle) is the most likely explanation but is not proven, and a smaller production instance could make it worse. The keep-warm and compute options remain available later without changing this decision's scope.
- **Rollback:** withdraw the exception and reopen OQ-029; all evidence and the previous gate version (`search12r-speed-gate-pre-d248.mjs`) are preserved.

## CHG-007 — Search helper model (D-247, OQ-029, TASK-0091)

The owner instructed "devam" after the two concrete recommended choices on 2026-09-20; proceed with the recommended helper model and word semantics. This approval does not waive latency validation. The analysis below was recorded before approval (commit 70d63e1); its proposed/pending wording is historical. D-239, RLS and 300 ms stand.

| ID | Decision | Ref |
|---|---|---|
| D-247 | Adopt three scoped derived search structures in PostgreSQL: word/record postings, vocabulary and record-id buckets. All query words must match the same record, order-independent; spelling correction applies only to words absent from the authorized vocabulary. Accept the measured extra storage/write/rebuild cost; use a bounded internal search identifier while keeping UUID business identities. No latency waiver and no product implementation in Phase 06. | Owner continuation 2026-09-20 after the recommended choices; CHG-007, ADR-017, TASK-0091 |

- **Change and reason:** add three scope-protected derived search structures (word/record postings, scoped vocabulary, sorted record-id buckets). The prototype passed 73 checks and 18 warm scenarios at p95 220–258 ms on 500k rows; simpler tested index shapes failed. First executions at 461/371 ms remain unresolved, so SPIKE-12 is not complete.
- **Requirements/features/tasks:** preserve REQ-NFR-012, REQ-IAM-011 and D-227; affects global search, ADR-017 and TASK-0090/0091. Proposed semantics require every query word in the same record, regardless of order; spelling correction applies only when an exact word is absent from the authorized vocabulary. This is not silently adopted as a business rule.
- **Database/dependencies:** retain the search row; propose the three projections plus pg_trgm/btree_gist/intarray. About 481 MiB extra including indexes in this fixture. RUM was rejected and removed. Product UUIDs need a capacity-checked search-id mapping rather than an int4 cast; scalar fixture scopes must become the approved generic scope model. The confirmed 211-table inventory is unchanged pending approval and design.
- **Backend/APIs/UI/permissions:** keep the existing search port and grouped results, no new UI element or external service. Every helper must share scope RLS, source rows recheck permission, changes take effect next request. No privileged user-query path. Total counts/pagination must use identical filters separately.
- **Tests/migration:** validate first execution, concurrency, real scope kinds, UUID mapping, normalization, changing records/permissions, more record types and ambiguous spelling candidates. Build projections deterministically from search rows and compare before switching reads. Search row and projection updates must be atomic and repeat-safe; SPIKE-14 must verify rebuild without business effects.
- **Backward compatibility/rollback/risks:** business sources unchanged; retain a reversible read-path switch, but the old slow path cannot satisfy acceptance. Added storage/write/rebuild cost and unbounded candidate work remain risks. Warm timing is not an all-requests SLA or a waiver of cold latency.
- **Recommendation:** approve this architecture direction and word semantics, then fold the precise schema/dependency plan and resolve first-execution performance before closing search and proceeding to SPIKE-14. Approval alone does not pass the outstanding tests. Report: `docs/architecture/spikes/SPIKE-12-search-retry.md`.

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
| Protocol §7 Definition of Done | Applied per risk tier (T1/T2/T3) |
| Protocol §42 Independent review | Replaced by a documented self-review step by the implementing model |
| Protocol §57 Roadmap | Replaced by design-first + spikes + vertical slices roadmap |
| Protocol §70–71 Glossary examples | Public-tender examples (poz, rayiç, pursantaj, yaklaşık maliyet) removed; GEOGES domain terms used |
| Protocol §26 Tenant isolation, Protocol §29 payments | Not applicable to a single-company system unless reintroduced by change request |
| Protocol §73 Localization | No i18n framework; Turkish text inside components |
| Protocol §45 Skill set | Tailwind CSS added (no official skill exists → Tier C audit); Next.js via version-matched bundled docs |

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
- **Affected requirements:** REQ-AUD-006, REQ-IAM-001, REQ-IAM-003…006, REQ-IAM-008…015, REQ-IAM-018, REQ-IAM-022…024, REQ-IAM-026…027 (login, 2FA, role onboarding), REQ-NFR-006…011, REQ-NFR-013…015 (navigation, top bar, list/detail/form standards, light/dark, brand).
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
- **Affected requirements:** REQ-AUD-006, REQ-IAM-001, REQ-IAM-003…006, REQ-IAM-008, REQ-IAM-027 (sign-in, 2FA, password reset), REQ-INV-026, REQ-RPT-002…004, REQ-RPT-006…009 (cockpit), REQ-NFR-007…011 (left navigation, top bar, mobile, light/dark, brand).
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
- **Owner decision (2026-09-15):** **Option B approved** — real Supabase Auth on a dev project, local preview (no online link). Dashboard: empty card skeleton (no sample numbers; content defined in Phase 02). Auth screens: email + password sign-in, 2FA, password reset, new-role onboarding (REQ-IAM-027).
- **Implications recorded:** auth work is T1 (owner approval of auth rules, tests, documented self-review). No domain tables are created; only Supabase Auth is used. Public sign-up is disabled (accounts are created by authorized admins). The owner creates the Supabase account/project and places keys in the local env file (AI never handles secrets). Onboarding content is static until roles are designed (Phase 01/04). Provisional choices (package manager, folder layout, data-access for auth via `@supabase/ssr`) are re-reviewed in Phase 03/07 (OQ-017, OQ-020).
- **Status:** APPROVED — Milestone M0 track (TASK-0022…TASK-0026).

### CHG-003 — Development-only structure presentation page (APPROVED)

- **Requested change (owner, 2026-09-16):** a presentation page, reachable from the account menu, that summarizes the whole application structure and its connections, visualization first, not detailed.
- **Conflicts (stated explicitly):** code is closed after M0 (ADR-007); UI is COSS-only with owner approval for custom elements (ADR-009).
- **Owner decisions:** approved in parallel with Phase 01; content = module map and connections, end-to-end flows, roles and visibility, daily log approval cycle; visible to all signed-in users; COSS-style cards with SVG connector lines; built as an isolated sandbox with its own styles and scripts, used only during development (D-052).
- **Affected:** no requirements, database, APIs or permissions. New route `/presentation`, account menu (development only), ESLint boundaries.
- **Risks:** content drifting from the docs — data is sourced from `docs/architecture/MODULE_MAP.md`, REQ-AUD-006, REQ-FIN-015, REQ-IAM-001, REQ-IAM-003…006, REQ-IAM-008…015, REQ-IAM-018, REQ-IAM-022…024, REQ-IAM-026…027, REQ-SIT-001…004, REQ-SIT-006…008, REQ-SIT-013, REQ-SIT-030…032, REQ-WFL-011, REQ-WFL-015…016, REQ-WFL-028 and decisions, and must be updated when those change; roles show scope facts only.
- **Rollback:** delete `src/sandbox/presentation`, `src/app/(sandbox)`, the menu item and the sandbox ESLint element.
- **Status:** APPROVED — TASK-0030.

### CHG-004 — Compact navigation: header as a toolbar, work layer on the sidebar rail (APPROVED)

- **Requested change (owner, 2026-09-16):** the left navigation must become compact instead of listing every module underneath one another; the panel must move away from the standard dashboard look; each role should get a flowing UX of its own on top of the same skeleton.
- **Analysis:** the menu lists **nouns** (Stok, Finans, Arşiv) while users think in **verbs** (onayla, kaydet, bak). Three different realities collide in one structure: the owner/general manager see all 6 groups and 28 modules (the list overflows), field roles see 3–4 rows after permission filtering (the menu is nearly empty and the day is spent on one screen), and coordinator/technical office/accounting do not browse modules at all — they drain queues. The header is at the same time almost empty (`app-shell.tsx`: sidebar trigger on the left, theme toggle and user menu on the right).
- **Patterns evaluated (2026-09-16 research round):** (A) command-palette-first nav-light, (B) icon rail with a second panel, (C) role workspace switcher, (D) object-first navigation. The rail (B) was chosen as the skeleton; its second panel was then evaluated in four variants (B1 permanent module panel, B2 flyout, B3 context panel, B4 full-screen launcher). The owner chose to move the second panel's job into the header instead of opening a second sidebar column, which keeps the existing shell untouched.
- **Approved structure:**
  - **Header = three-zone toolbar with a conditional context row (T2).** Zone rule, identical in every module: **left = where you are** (context selector), **middle = where you go** (⌘K search/command, D-044), **right = what you do** (role-specific primary action, notification and queue badges, theme, user menu). A second row renders **only when an object is open** (breadcrumb/tabs of that object plus a date strip) and is not rendered at all otherwise, so screens without context keep today's layout exactly.
 - **Work layer stays on the sidebar rail (option a).** Its top region holds "Bugün", "Onaylar" and "Görevler" as badged entries; the module groups sit below a separator. This maps directly to a mobile bottom bar (REQ-NFR-008) and keeps the header free for context and action.
 - **"Bugün" is the entry screen for every role**, composed per role: cockpit + "Dikkat" for the owner (REQ-INV-026, REQ-RPT-002…004, REQ-RPT-006…009), the approval queue for the coordinator (REQ-SIT-013, REQ-SIT-031…032, REQ-WFL-012…016), today's site log for the site engineer (REQ-FIN-015, REQ-SIT-002…003, REQ-SIT-006…008, REQ-SIT-030, REQ-SIT-032), a single flow for the subcontractor crew lead (REQ-IAM-011…012).
- **Affected requirements:** REQ-NFR-007 (left menu order and grouping — kept, but the list moves behind the rail), REQ-NFR-008 (mobile), REQ-NFR-009 (top bar: this CHG defines its content), REQ-NFR-013…015 (list/detail/form patterns now inherit the toolbar), REQ-RPT-001…002 (cockpit becomes the owner's "Bugün"), REQ-WFL-012…015 (approval centre), REQ-TSK-007, REQ-TSK-009…010 (tasks and notification drawer feed the badges), REQ-IAM-011…012, REQ-IAM-027 (role-specific composition).
- **Affected features/tasks:** Phase 02 screen design (every screen must declare its context row and primary action); TASK-0029 (site-wide search is the toolbar's middle zone); TASK-0031 (this prototype); D-051 stays valid — the two added modules keep their places inside the group list.
- **Database / APIs / permissions:** none for the prototype. For product code later: badge counts need permission-filtered approval and task queries, and pinning/recents would need a user-preference store (Phase 03 IAM).
- **UI / code impact if approved for product code:** `app-shell.tsx` header block plus a new `platform/ui/app-shell/app-toolbar.tsx` composition; an optional `contextBar` prop so pages without context are untouched; `navigation-registry.ts` gains the work-layer entries and a group-icon field; `docs/ui-ux/DESIGN_SYSTEM_RULES.md` §4.1 gains deviation rows (COSS header is a single row; ours is conditionally two).
- **Tests:** prototype is T3 (sandbox, no product code). Product implementation is T2: registry unit tests, keyboard navigation and focus order, WCAG 2.2 AA, desktop/tablet/mobile review, all mandatory screen states (DESIGN_SYSTEM_RULES §6).
- **Migration / backward compatibility:** none. `contextBar` is optional and the shell renders as today when it is absent.
- **Risks:** header height changes between 56px and 92px as context appears and disappears (content must not jump); the context row's content has to be designed screen by screen in Phase 02; icon-only rail entries hurt discoverability for infrequent users (mitigated by tooltips, the ⌘K palette and the expanded rail state); badge counts create live queries on every page load.
- **Owner decision (2026-09-16):** T2 (three-zone toolbar + conditional context row) and option (a) for the work layer approved. "Bugün" is the entry screen for every role. Built first as a sandbox prototype; product code stays closed until the prototype is approved.
- **Status:** APPROVED for the sandbox prototype (TASK-0031). Product implementation waits for Phase 02 design and Phase 07.
- **Owner decision (2026-09-16, amends the status above):** the approved skeleton is transferred into the product shell now, step by step, deciding for each step where it lands in the existing layout by question and answer. The existing layout must not break (shell, `--layout-gap`, frame). Five steps, each a T2 task: (1) rail — work layer + group structure (TASK-0032), (2) header three zones, height stays 56px (TASK-0033), (3) conditional context row via an optional `contextBar` prop (TASK-0034), (4) "Bugün" screen on `/dashboard` (TASK-0035), (5) mobile: rail → bottom bar below `md` (TASK-0036). Rollback point before the transfer: commit `3a83586`. Decisions: D-057…D-060.

### CHG-005 — Record consistency and deterministic guards (APPROVED, implemented 2026-09-17)

- **Requested change (owner, 2026-09-17):** "Mevcut kayıtlardaki çelişkileri ve güncel olmayan durumları düzeltelim; aynı hataların tekrarlanmaması için gerekli kuralları, dil modeli öngörülemezliğine güvenmeyerek determinist şekilde ekleyelim." Plus, in the same session: a deterministic way to resume work when a session is cut off and another agent continues. And: the whole roadmap must be single and free of internal contradictions.
- **Reason:** an audit of the state system on 2026-09-17 found nine contradictions. The records had drifted because keeping them in agreement depended on a model remembering to do it at the end of a session.
- **Findings:** (1) `ai/MASTER_ROADMAP.md` two days stale, CHG-003 and CHG-004 absent from the plan although approved and largely built; (2) `CODE ALLOWED` in `ai/CURRENT_STATE.md` contradicted by shipped `modules/sit/ui`, `modules/wfl/ui`, `modules/tsk/ui`; (3) Milestone M1 still claiming a deliverable M0 and CHG-004 already produced; (4) Phase 02 executed in part while marked `NOT_STARTED`; (5) Phase 07 scope listing finished work; (6) TASK-0028…TASK-0037 filed under the Phase 01 heading and TASK-0011…TASK-0017 under the M0 heading; (7) "Last updated" stamps wrong in six files; (8) hundreds of `§` citations pointing at `docs/sources/`, a directory scheduled for deletion by TASK-0027 (removed 2026-09-19, Git tag `scope-archive`); (9) REQ-WFL-011, REQ-WFL-028 end-to-end flows filed under REQ-NFR instead of REQ-WFL. Also found: `BRANCH` in `ai/CURRENT_STATE.md` still naming a merged branch.
- **Affected requirements:** none (no product requirement changes).
- **Affected features/tasks:** TASK-0027 blocked; TASK-0038 and TASK-0039 opened; TASK-0028…TASK-0037 refiled.
- **Affected database / APIs / UI / permissions:** none.
- **Tests:** `scripts/check-records.mjs` is the test. Wired into `npm run check` as `npm run records` and into the versioned pre-commit hook.
- **Migration / backward compatibility:** records only; no runtime effect. The pre-commit gate needs one local command (`git config core.hooksPath .githooks`), recorded in `docs/standards/GIT_WORKFLOW.md`.
- **Risks:** a validator that is too strict becomes noise and gets bypassed. Mitigated by checking only invariants that have actually been violated, and by failing with the exact file, line and fix.
- **Owner decision (2026-09-17):** approved; product code frozen until CHG-005 and CHG-006 are closed.

| ID | Decision | Ref |
|---|---|---|
| D-072 | `ai/MASTER_ROADMAP.md` is the **single authority** for the plan; every other record derives from it and may not contradict it. An approved change request is written into the roadmap **in the same session it is approved**; a change request absent from the roadmap may not be implemented | `ai/PROJECT_RULES.md` §9, `ai/MASTER_ROADMAP.md` |
| D-073 | Phases get an explicit status vocabulary including `PARTIALLY_DONE`, and a phase delivered early records item by item what was delivered and what it still owes. Applied to Phase 02 and Phase 07 (answers question 16: kalem kalem, not a separate parallel milestone — a second milestone track would recreate the very problem being fixed) | `ai/MASTER_ROADMAP.md` |
| D-074 | **Milestone M1 is redefined**, not cancelled: its original content ("owner sees the auth pages and the shell for the first time") was consumed by M0 and CHG-004 locally, so M1 becomes the **staging** milestone — the same screens plus foundation services on the deployed environment, with proven deploy and rollback (answers question 15) | `ai/MASTER_ROADMAP.md` Phase 07, CHG-001 |
| D-075 | **TASK-0027 is blocked**, not merely scheduled: `docs/sources/` may not be deleted until every `§` reference in the records is remapped to a REQ id (new TASK-0039). Deleting first would strip the reasoning out of hundreds of decisions (answers question 17) | `ai/TASKS.md`, `docs/sources/README.md` |
| D-076 | Record consistency and session continuity are **machine-enforced, not model-remembered** (answers question 18): `scripts/check-records.mjs` (run by `npm run records`, `npm run check` and the pre-commit hook) asserts the invariants, and an append-only session journal written by a `PostToolUse` hook records what each session touched, so an interrupted session can be resumed by any agent from the repository alone | `ai/PROJECT_RULES.md` §21, `scripts/check-records.mjs`, `.githooks/pre-commit` |

> Questions 1–14 of the 2026-09-17 round (workflow platform direction) are **not** answered by this change request. They are tracked as OQ-028 with the reasoning in `WORKFLOW_PLATFORM_DIRECTION.md` at the repository root, and become CHG-006 once answered.

### CHG-006 — Composition-first workflow platform (DECISIONS TAKEN 2026-09-18 — roadmap fold awaiting owner approval)

- **Requested change (owner, 2026-09-17):** instead of building the end-to-end flows (REQ-WFL-011, REQ-WFL-028) as ready-made coded flows, build an infrastructure on which authorised people compose flows themselves: every function is an independent module, and how modules connect and flow is a customisable action. Plus (2026-09-18): the designer decides which roles and permission types touch which point of a flow; roles are compositions of permission types.
- **Reason:** processes change as the company grows; the owner wants to change them without code changes and without each module carrying its own approval logic.
- **Question round:** OQ-028, seven rounds with the owner on 2026-09-17/18, 28 questions (14 on direction, 7 from the REQ-WFL-011, REQ-WFL-028 palette test, 3 raised by the record-type-builder answer, 4 from the owner's note on roles). Reasoning, options and the palette test: `WORKFLOW_PLATFORM_DIRECTION.md` (root; deleted when this CHG is folded into the roadmap).

| ID | Decision | Ref |
|---|---|---|
| D-077 | **Three layers.** Calculations are fixed (ledger logic and derived data: "a collection reduces the party balance", "approved production flows into the progress payment"); processes are configurable (who approves, how many levels, thresholds, escalation, locks, notifications); catalogs stay admin settings (ADR-005) | OQ-028 q1 |
| D-078 | **Two-level decomposition.** Code may be split as finely as wanted, but the **controlled boundary stays at the 25 modules**; parts inside one module call each other freely. Against incompatibility: every part's capability declaration (name, inputs, required permission) is verified against the code by automated contract tests, and CI fails on drift. A published capability is never removed or silently changed, only added or marked deprecated, because user-built flows depend on it | OQ-028 q2; owner asked for "200 parts plus a fix for incompatibility" |
| D-079 | **Free record-type builder.** An authorised user can define a new record type with its own fields, relations to other records, screen layout and reports. Chosen twice by the owner after being told it roughly doubles the product and must shape the architecture from the start. **AI note:** RISK-002 grows; new RISK-010 | OQ-028 q3 |
| D-080 | **A flow never writes the ledger.** No "issue invoice", "post payment" or "write stock movement" action exists in the catalog; the flow opens a task for the responsible person instead. This is not a limit on the designer's authority: the capability does not exist, as "grant permission at run time" does not. Designers are otherwise free on tasks, notifications, status, locks, escalation and drafts | OQ-028 q4 |
| D-081 | **One permission builds and publishes a flow** (AI recommended two). Compensating controls on every publish: the owner is notified, the publish is audited (who, when, which version), and the flow stays flagged "new" for 7 days with its actions listed separately | OQ-028 q5 |
| D-082 | **A running flow acts with system authority**, not the builder's. **AI objection recorded:** on its own this lets anyone who can build a flow read any data through it. Closed by D-083 | OQ-028 q6 |
| D-083 | **The flow-design permission may only be granted to full-visibility roles** (the owner, and roles the owner gives it that already see everything). System authority therefore opens nothing the builder cannot already see, and no output-filtering mechanism is built. **Must be enforced in code** (a restricted role cannot be given the permission), not by policy: relaxing it later re-opens the leak described in D-082 | OQ-028 q6 follow-up |
| D-084 | **Locks can be overridden by the owner and the general manager**, reason mandatory, audited, stakeholders notified | OQ-028 q7 |
| D-085 | **Step-by-step wizard and box-and-arrow diagram together**, both editable, both views of the same definition. **AI note:** two-way editing costs more editor work than a wizard with a read-only diagram | OQ-028 q8 |
| D-086 | **Company flows ship as templates; the flow in use is a copy.** Template updates never change a user's copy; a "new version available" notice appears; a copy can be reset to its template | OQ-028 q9 |
| D-087 | **"Why was this opened" is always traceable.** Every task and notification carries the flow, step and record that produced it and links back to them. T1 | OQ-028 q10 |
| D-088 | **Engine and designer both before the module slices.** This is the order the roadmap already has (Phase 07, then 08, then 09): phase order does not change. The AI's recommendation (pull the engine core into Phase 07) was not taken. **Correction:** two of the options offered in round 3 described the same order; the first recorded note that RISK-005 "grows" was wrong, it stays as it is today | OQ-028 q11 |
| D-089 | **REQ-WFL-011, REQ-WFL-028 flows are specified in Phase 02 as real flow definitions**, step by step, each step tested against the node palette, not as screen flows | OQ-028 q12 |
| D-090 | **The CHG-004 shell work in REVIEW is re-reviewed** against these decisions instead of approved as it stands (TASK-0040). This delays the approval of TASK-0032…TASK-0037 | OQ-028 q13 |
| D-091 | **The designer's out-of-scope list becomes a rule in ADR-006:** no free code, no direct database access, no ledger finalisation (D-080), **no node that grants a permission or role while a flow runs**, no sending data to external systems, no sensitive personal data in notification text. Design-time definition and assignment of permission types and roles is not excluded (D-098, D-101) | OQ-028 q14, refined by q29 |
| D-092 | **User-defined record types use the panel's own permission model:** role-based read and write, site-level row visibility, sensitive-field marking, chosen at definition time | OQ-028 q26 |
| D-093 | **Search, reports and the entry screen:** for each user-defined record type the definer chooses whether it appears in search, in reports and exports, and as a count on "Bugün" | OQ-028 q27 |
| D-094 | **Changing a user-defined record type never destroys history.** A removed field is hidden and its past values are kept; who changed what is recorded for these records too | OQ-028 q28 |
| D-095 | **New node: create a record or change its status**, drafts and status transitions only, never ledger finalisation (D-080). Closes palette gap B-1 | OQ-028 q19 |
| D-096 | **New node: for each.** Iterates a list whose length is not known in advance (each custody item, each missing document). One level, no nesting. Closes gap B-2 | OQ-028 q20 |
| D-097 | **A step's owner can be addressed four ways:** by permission type, by role, by relationship to the record ("the opener's manager", "the site's responsible engineer"), or by a named person | OQ-028 q29a |
| D-098 | **There is no temporary permission.** Holding the required permission type or role is what lets a person act on a step. **The designer may define a new permission type and a new role for a flow while designing it** | OQ-028 q29b |
| D-099 | **An approval has three outcomes:** approve (the flow continues), reject (the flow closes), send back for correction (returns to the submitter and comes back to the same approval once corrected). Backward edges are allowed. Closes gap B-3 | OQ-028 q21 |
| D-100 | **Windowed conditions are free-form** ("this client delayed more than 3 times in 30 days"); the AI recommended predefined counters. No leak risk (D-083). Safeguards that do not restrict the owner: a time limit on condition queries, and the pre-publish test run shows the condition's real result on live data. Closes gap B-4 | OQ-028 q22 |
| D-101 | **The designer can assign people to the roles they define, while designing** (AI recommended the admin screen). Assignments are written to the same record as admin-screen assignments and shown there, so who-sees-what is still read from one place | OQ-028 q29c |
| D-102 | **External-party approval is a ready sub-flow template**, not a new node type: someone of ours takes the task, forwards it, records the answer with its document; reminder and escalation on timeout. No panel login for clients. Closes gap B-5 | OQ-028 q23 |
| D-103 | **Triggers:** an event, a time or calendar rule (including "30 days before expiry"), a value crossing a threshold; manual start always available. **Starting a flow from incoming e-mail is not in the first release** (DEF-006). Closes gap B-6 | OQ-028 q24 |
| D-104 | **An end-to-end process is built from short flows that trigger each other**, not one long definition, so each can be changed without touching work already in progress | OQ-028 q25 |
| D-105 | **The record-type builder is built after the Slice 1 pilot**, not inside Phase 08. Module slices do not depend on it, so the first module screens are not delayed, and the builder is designed against real use. The data model is prepared for it from the start (Phase 03/04) | CHG-006 approval round, 2026-09-18 |

**Impact analysis (PROJECT_RULES §9), proposed and awaiting owner approval before the roadmap is changed:**

- **Requirements:** REQ-WFL-011, REQ-WFL-028 moves from `REQ-NFR` to `REQ-WFL`. New requirement areas: capability catalog (every module), flow designer, trace view, record-type builder. The owner module of the record-type builder (`ADM` as an extension of custom fields, or a new platform module) is decided in Phase 03 through the naming process (ADR-010); it is not assumed here.
- **Phase 01:** new mandatory deliverable per module, the **capability catalog**: events it publishes, actions it exposes, typed and classified fields that conditions may read.
- **Phase 02:** REQ-WFL-011, REQ-WFL-028 as flow definitions (D-089); designer UX with wizard and diagram (D-085); record-type builder UX; trace view; the 7-day "new flow" list; TASK-0040.
- **Phase 03:** capability contract format and contract tests (D-078); engine architecture: triggers (D-103), approval outcomes (D-099), for-each (D-096), record node (D-095), windowed-condition safeguards (D-100), traceability (D-087), versioning and templates (D-086), authority model (D-082, D-083, D-097, D-098, D-101); record-type builder architecture.
- **Phase 04:** schema for versioned flow definitions, running instances and their trace; capability registry; **storage model for user-defined record types** (the hardest data question this CHG raises) with RLS (D-092) and history (D-094).
- **Phase 06:** new spikes: user-defined record types end to end (definition, storage, RLS, search, report); free-form windowed conditions under load.
- **Phase 07:** order unchanged; dynamic IAM must support permission types and roles defined outside the admin screen (D-098, D-101).
- **Phase 08:** order unchanged; scope grows with D-085, D-095, D-096, D-099, D-102.
- **Record-type builder (D-105):** a new build step after the Slice 1 pilot (Phase 09); its architecture (Phase 03), storage model (Phase 04) and spike (Phase 06) still come first, so the data model is ready for it.
- **Database, APIs, UI, permissions, tests:** as above. The engine and the builder are T1; the eight REQ-WFL-011, REQ-WFL-028 flows become executable acceptance tests of the engine.
- **Migration and backward compatibility:** no data exists yet. The sample approval queue (TASK-0037) is re-wired to the engine (TASK-0040).
- **Risks:** RISK-002 grows (D-079); RISK-005 unchanged (D-088); new **RISK-010**, the record-type builder (storage model, performance, reporting and migration of user-defined structures); D-083 must hold in code or D-082 becomes a data leak.
- **Deferred:** DEF-006, e-mail triggers.

## PHASE 01 — Exit deliverables (2026-09-19)

| ID | Decision | Ref |
|---|---|---|
| D-214 | **The KVKK personal-data inventory does not hold up Phase 01** (owner: "KVKK'ye takılmamamız lazım şu aşamada"). It is deferred, not dropped (DEF-007): it must be done before the first real personal data is entered — the same checkpoint where RISK-001 and D-134 go back to the owner (D-050, REQ-AUD-003) | Owner 2026-09-19; D-050; RISK-001 |
| D-246 | **Two reset commands, and configuration is portable.** Resetting sample data must not throw away the owner's own work, so there are two commands: one clears sample business records (sites, daily logs, stock, tasks, notifications, flow instances) and keeps configuration; the other returns configuration itself — flows copied from templates, catalog items, thresholds, custom fields, roles — to factory state. Configuration can also be exported to a file and loaded into another environment, so the flows built locally move to the live project instead of being rebuilt by hand (D-245 opens a second Supabase project at go-live). Built in Phase 07 with the foundation | Owner 2026-09-20; TASK-0076; `docs/infrastructure/ENVIRONMENTS.md` |
| D-245 | **Local-first operation; hosting deferred.** The owner chose no staging environment, a single Supabase project whose sample data is reset when needed, and no server for now — the provider and location are decided later (OQ-010, OQ-011, OQ-012). Consequences recorded rather than assumed: slice acceptance moves to **the owner running the panel on their own machine** (`docs/infrastructure/LOCAL_SETUP.md`); the pilot with real field users cannot happen until an address exists, so it waits for the hosting decision at the Phase 09 exit; and the day real data arrives, the reset command is locked and a second Supabase project is opened, leaving today's project for development. Milestone M1, defined by D-074 as the staging gate, is redefined again as the local acceptance milestone | Owner 2026-09-20; D-074; `docs/infrastructure/ENVIRONMENTS.md` |
| D-244 | **Quantity precision.** Panel, lug and piece counts are integers; square metres and metres carry two decimals; weights three (a weighbridge ticket prints grams); hours two; rates and percentages four. Derived measures such as m² are stored with the rule version that produced them, never recomputed on screen | Owner 2026-09-20; Phase 04, TASK-0065 |
| D-243 | **Money is stored in kuruş with rounding at the line.** Every line is rounded to two decimals and the total is the sum of the lines, so the screen, the invoice and the accountant agree; the alternative (full precision, rounding only the total) was refused because lines would not add up on screen. A foreign-currency amount always keeps three things together: the original amount and currency, the lira value, and the rate with its date — an approved record never changes when a rate is corrected later (REQ-ADM-015). No money column is a float | Owner 2026-09-20; Phase 04, TASK-0065 |
| D-242 | **Phase 03 cross-cutting decisions get their own ADRs:** ADR-014 transactional outbox, ADR-015 direct PostgreSQL with row-level security kept, ADR-016 storage of user-defined record types, ADR-017 search inside PostgreSQL, ADR-018 live updates as signals. Each names the alternatives it refused and the spike that will confirm it | Phase 03, TASK-0057…TASK-0064 |
| D-241 | **User-defined record types are stored as one row per record with its fields in JSONB**, in a shared table, with scope, owner and status kept as real columns outside the JSONB. Attribute-value tables were rejected (a single record would scatter across dozens of rows, making reports and history expensive) and so was creating a real table per type (users would be changing the schema; every type would need its own policies, migrations and backups). One row-level-security policy then covers every type, indexes are generated from the type definition, and relations live in a link table so queries stay indexed. A field is never deleted, only retired: its values stay and history is never reinterpreted (D-094). Limits: 50 types, 60 fields, 10 searchable fields, 10 relation types | Phase 03, TASK-0063; RISK-010; `docs/architecture/RECORD_TYPES.md` |
| D-240 | **Live updates travel as signals, not data.** A one-way server stream tells the browser "this changed" for the approval counter, the bell and the approval queue; the screen then fetches with the viewer's own permission, so the channel cannot leak. Signals come from the outbox worker, after the event is really processed. Supabase Realtime is not used: publishing database changes would move permission filtering into the channel and tie us to the provider (ADR-002) | Phase 03, TASK-0062; D-232 |
| D-239 | **Search runs on PostgreSQL itself** — full-text search plus the similarity extension for Turkish spelling — with no separate search engine in the first release. Each searchable record keeps a search row carrying its scope columns, filtered by the same row-level security, so an unauthorised record does not even reach the result count. Commercial and sensitive fields never enter the search vector. Moving to a dedicated engine later is an adapter change (D-227 keeps document contents in the archive) | Phase 03, TASK-0062; REQ-NFR-012 |
| D-238 | **Data access is a direct PostgreSQL connection with a typed query builder, not PostgREST** (provisional until the Phase 06 spike; closes OQ-020). The record and its outbox row must be written in one transaction, and progress payments, projections and read models need multi-table queries. Row-level security is kept: every request opens its transaction with the user's identity in a session variable. The RLS-bypassing service connection is used only by migrations and the outbox worker, never on a user request path | Phase 03, TASK-0062; OQ-020; `docs/architecture/PORTS_AND_SERVICES.md` |
| D-237 | **Configuration architecture.** Rules are never updated in place: a change adds a new validity row, a calculation picks the rule that was valid on its own date, and an approved record stores the rule version and exchange rate it used, so an old figure is read back rather than recomputed. Missing rule means "could not be calculated", never a silent default. Custom fields (REQ-ADM-009) are allowed on reference records — project, site, company, employee, asset, material, contract, quote, lead — and **not** on ledger or approval records such as the daily site log, progress payments, payroll, stock movements or period close, where free fields would blur the calculation and the audit trail. A custom field joins search, lists, reports and flow conditions, but never a calculation | Phase 03, TASK-0061; `docs/architecture/CONFIGURATION.md` |
| D-236 | **Two-factor recovery: both ways** (the owner took both offered options). Ten one-time recovery codes are issued at setup, shown once and stored only as hashes, **and** an authorised manager can reset a person's second factor; the reset is audited and notified to the owner layer. Permission architecture otherwise: effective permission is the union of role assignments with their scopes plus personal exceptions, enforced in three places — hidden in the UI, checked on the server, filtered by row-level security in the database — with data-class fields removed from the query rather than blanked | Owner 2026-09-20; REQ-IAM-003; TASK-0060; `docs/architecture/PERMISSIONS.md` |
| D-235 | **Workflow engine architecture.** Definition and instance are separate: a running instance finishes on the version it started with, so publishing never breaks work in progress. Step ids are stable across versions so the run log stays readable. The engine is a state machine driven by the outbox; waits live in the database, not in memory. A trial run walks the real definition in dry mode — conditions evaluate against real data, but no action, task, notification or lock is produced. The engine protects itself with limits (500 steps per instance, 500 items per for-each, 2 s per condition query, 50 concurrent instances per event, 180 days per instance); hitting one stops the instance with a reason instead of flooding the company with tasks | Phase 03, TASK-0059; `docs/architecture/WORKFLOW_ENGINE.md` |
| D-234 | **Event backbone: transactional outbox, at-least-once, ordered per record.** An event is written in the same transaction as the change that caused it, so "the record was saved but the event was lost" cannot happen. Subscribers make repeats harmless themselves; events of one record keep their order, different records run in parallel. Failures retry with growing gaps and end in a dead-letter list that raises a critical notification to the owner layer and a task, never a technical error to the user. Event payloads only grow; a breaking change is a new version code published alongside the old. Replay rebuilds read models only — subscribers that create tasks or notifications are skipped, so nobody is notified twice | Phase 03, TASK-0058; `docs/architecture/EVENT_BACKBONE.md` |
| D-233 | **Reporting reads a read model, not other modules' tables.** RPT, INT and STR own derived, event-fed, read-only tables instead of querying fifteen modules per screen. A read model is never a source: it can always be rebuilt from events, it carries the viewer's permissions from the source record, and a figure that disagrees with its source screen is a defect — the model is rebuilt and the difference audited (REQ-NFR-002) | Phase 03, TASK-0057; `docs/architecture/MODULE_BOUNDARIES.md` |
| D-232 | **Live updates are limited.** The approval counter, the notification bell and the approval queue update by themselves; lists, detail screens and reports refresh with the page (AI recommendation accepted). Keeps the realtime channel small and the field data usage low | Owner 2026-09-20; REQ-WFL-012, REQ-TSK-009 |
| D-231 | **Nothing is deleted by time.** Business records, documents and the audit log are kept indefinitely; construction work is questioned years later (progress payments, penalties, guarantees). Personal-data retention is re-opened at the KVKK gate before real data (D-214, DEF-007) | Owner 2026-09-20; REQ-AUD-002 |
| D-230 | **Password policy and session length (closes OQ-026).** At least 8 characters **with a complexity requirement** (upper case, digit, symbol) — the owner chose this over the recommended "at least 10, no composition rule, no expiry", which follows NIST 800-63B and NCSC; recorded objection: composition rules push people to predictable passwords and to writing them down, and the panel already has 2FA. No password expiry. Common passwords are refused. Session: 30 days, ended after **3 days** of inactivity; a deactivated account's session dies at once (REQ-IAM-006). A warning before the session ends, with the option to extend (WCAG 2.2.1) | Owner 2026-09-20; OQ-026; REQ-IAM-001…006 |
| D-229 | **Ten slices become seven.** The owner asked for the plan to be simplified and chose this of three options (the others — splitting the workflow engine from its designer, and lightening the record-keeping ritual — were declined). Equipment merges with HR; meetings and support merge with compliance and quality; archive, reporting, performance, intelligence and strategy become one last slice, since all of them read data the earlier slices create. Phases 16–18 are retired; Phase 19 keeps its number so existing references hold. Saves three acceptance-and-pilot cycles, about 4 days | Owner 2026-09-20; `ai/MASTER_ROADMAP.md` |
| D-228 | **Functional bottom band (TASK-0028).** A band fixed to the bottom of the app card carries the screen's actions on long forms, the daily site log (back/next/submit), the approval queue (approve/return/reject), lists while rows are selected (bulk actions) and **detail screens** — where the primary and secondary actions move from the header to the band and only rare actions stay in the header's "…" menu (AI recommended keeping detail actions in the header). No band when the screen has no action the user may take. On phones the bottom navigation bar hides while a band is shown and returns on leaving | Owner 2026-09-20; REQ-NFR-014, REQ-NFR-015; `docs/ui-ux/SCREEN_PATTERNS.md` section 4 |
| D-227 | **Site-wide search (TASK-0029, Phase 02 part).** The palette does not search document contents: document names and descriptions only, plus an "Arşivde içerikte ara" row that opens the archive with the same words. It offers quick actions the user may perform. Results are grouped by type, best 5 per group with "Tümünü gör" opening that list with the query | Owner 2026-09-20; REQ-NFR-012; `docs/ui-ux/SEARCH.md` |
| D-226 | **Charts everywhere.** Column and line charts are an approved custom element (D-066 extended) and appear in reports, the finance screen and cash projection, the "Bugün" indicators and Sistem gözü, strategy, and site and project details — reversing the 2026-09-17 removal of charts from "Bugün" (AI recommended charts in reports and cash projection only, tables first). Every chart keeps its numbers accessible (table or spoken summary), never separates series by colour alone, uses theme tokens and drills down on click. Whether a charting library is used is decided in Phase 03 | Owner 2026-09-19; ADR-009; `docs/ui-ux/CUSTOM_ELEMENTS.md` |
| D-225 | **Accessibility targets (WCAG 2.2 AA).** Target size: at least 44 px on touch screens (`pointer: coarse`), at least 24 px with a mouse on desktop — the "dense" list density never goes below 24, "comfortable" is 44. Testing is **automatic only** (AI recommended adding manual keyboard checks and screen-reader checks on critical screens): an accessibility scan on every screen in both themes at desktop and phone width, automated keyboard-path tests that satisfy REQ-NFR-016, and a unit test on theme contrast pairs. Finding: the light theme focus ring (COSS `--ring`, neutral-400) is 2.25:1 against the surface; it becomes neutral-600 (6.8:1), dark theme unchanged — applied in Phase 07 (TASK-0054) | Owner 2026-09-19; REQ-NFR-016; `docs/ui-ux/ACCESSIBILITY.md` |
| D-224 | **Custom element approved: the flow diagram canvas** of the flow designer (SCR-196). COSS has no box-and-arrow diagram; the side and bottom panels, menus, dialogs and fields stay COSS. Built in Phase 08 with the designer; whether it uses a diagram library is decided in Phase 03 | Owner 2026-09-19; ADR-009; D-223 |
| D-223 | **Administration page and flow designer placement (closes the D-108 round).** The "Yönetim" rail group is removed; "Yönetim" becomes an entry in the user menu, visible to anyone who may see at least one of its sections, opening one page with its own grouped left sub-menu (a list on phones): users & roles, master data, workflows (flows, templates, new flows, run log), record types (after the pilot), audit log; addresses move under `/admin`. Revision requests become a tab of Onaylar (`/approvals/revision-requests`). The designer is diagram-first: clicking a box opens that step's questions in a side panel, both editable (D-085); phones get full editing with the diagram full screen, a bottom panel per step and "+" between boxes; trial run and publish work on phones too. The run log lives only in the administration page (AI recommended also opening it from records); a user without flow-design permission sees the flow and step names and the rule as text in "why is this mine" and links to the record. User-defined record types appear in the module group chosen at definition. The diagram canvas is a custom UI element, to be approved in the custom-element list (Phase 02 item 8). The navigation registry changes in Phase 07 | Owner 2026-09-19; D-108; `docs/ui-ux/ADMINISTRATION.md` |
| D-222 | **End-to-end flow test results (TASK-0042).** The 14-node palette covered all eight processes; no palette gap remains. Four catalog gaps are closed by additions only: `quote.submitted_for_approval` (REQ-QTE), `payment.submitted_for_approval` (REQ-FIN), `stock_count.submitted` (REQ-INV), action `offboarding_checklist.create_draft` (REQ-HR). A client wait that exceeds a timed client obligation in the contract is linked to it by the panel itself (fixed rule, REQ-CMP-007); what follows is flow. The daily site log approval template has approve and return-for-correction only; "reject" is off. A "for each" list is a query over records linked to the triggering record, same mechanism and time limit as conditions (REQ-WFL-009) | Owner 2026-09-19; TASK-0042; `docs/workflows/END_TO_END_FLOWS.md` |
| D-221 | **Screen states.** (1) A user who opens, by direct link, a record they may not see is told "Bu kaydı görme yetkiniz yok" — the owner chose this over the recommended "record not found". Search results, lists, counts and bulk downloads still never show such records, so REQ-DOC-003 is unchanged; `docs/ui-ux/SCREEN_PATTERNS.md` detail states are updated to match. (2) When the connection drops, what the user has typed is kept on the device and saved once the connection returns; full offline work stays deferred (DEF-002). (3) An inactive account is told "Hesabınız kapalı", only after the correct password. The owner confirmed `docs/ui-ux/SCREEN_STATES.md` | Owner 2026-09-19; TASK-0051; REQ-DOC-003, REQ-IAM-001, REQ-NFR-015 |
| D-220 | **Daily site log entry: stepped by default, section list on request.** The 15 sections come one by one with back/next and a summary step; the user can switch to a section list showing each section's state. A day strip at the top moves between days, coloured by state. Derived consequence, **confirmed by the owner 2026-09-19**: the chosen view is remembered per user; the owner also confirmed the "no work in this section today" option, skipping the rest on a "no work" day, and showing who is editing a section. Closes OQ-027 item 3; item 4 (notification-driven navigation) is carried by REQ-TSK-007 and REQ-TSK-008, so OQ-027 is closed | Owner 2026-09-19; REQ-SIT-003, REQ-SIT-035; OQ-027 |
| D-219 | **Standard screen patterns:** a detail screen puts a record's large areas in section tabs on the context row (D-064) with collapsible sub-sections inside, the most important open; small records have collapsible sections only. Long lists page on desktop and use "Daha fazla göster" on phones, always with the total count. Short forms open in a `Dialog` on desktop and a `Drawer` on phones; long forms are full pages with a fixed save bar (TASK-0028). All patterns use installed COSS components only. `docs/ui-ux/SCREEN_PATTERNS.md` | Owner 2026-09-19; REQ-NFR-013…015 |
| D-218 | **A separate "Raporlar" entry sits in the work layer, below "Görevler"** (AI recommended opening reports only from module screens); each user sees only the reports they may see and the entry hides when there are none. Extends the work layer of D-054; the navigation registry gains `/reports` when Phase 07 builds it | Owner 2026-09-19; REQ-RPT-015…019 |
| D-217 | **Two screen placements:** the strategy screen (targets, budget, investment, health scorecard) sits in the "Ticari" group below Finans; "Sistem gözü" is a second tab on the owner's and GM's "Bugün", with no new menu item. The navigation registry gains `/strategy` when Phase 07 builds it | Owner 2026-09-19; REQ-STR-001…008, REQ-RPT-010, REQ-RPT-011 |
| D-216 | **Slice order confirmed as planned** (phases 09–18, with 09R after the first pilot; merged into phases 09–15 by D-229). **Every slice pilots on sample data only** (AI recommended a real site after the sample run); real use starts with the company-wide rollout in Phase 19, and the KVKK check of D-214 falls before that. **Pilot site and pilot users are named before slice 1's build ends** — an exit condition of Phase 09 | Owner 2026-09-19; D-048; ADR-007 |
| D-215 | **Default role templates, four open cells:** the general manager sees sensitive personnel data (salary, IBAN, SGK) by default (AI recommended HR and owners only; REQ-HR-002 reworded); a coordinator sees the commercial data of their own sites (P&L, income/expense, subcontractor unit prices); the technical office sees quote prices, estimated cost and margin (AI recommended quantities only); purchasing & logistics sees order prices, supplier quotes and the supplier account, not project P&L, client accounts or cash. Matrix: `docs/domain/PERMISSION_MATRIX.md` | Owner 2026-09-19; REQ-IAM-011 |

## PHASE 01 — Scope reference remap (2026-09-19)

| ID | Decision | Ref |
|---|---|---|
| D-213 | **Every functional-scope § citation is replaced in place by the REQ ids that carry it** (owner choice; AI recommended keeping the citations with a permanent map and an archive tag). How: the map of all 243 scope headings to requirements is generated from the requirement files' source lines before they change and kept at the end of `docs/requirements/README.md` — the one record allowed to hold section numbers; the scope text stays readable at Git tag `scope-archive`; requirement files drop their own ids from their source lines; unmarked internal references were rewritten to name their document; the two architecture-principle references went to ADR-006 and REQ-WFL-032. The validator fails on any § that does not name its document | Owner 2026-09-19; D-075; TASK-0039 |

## PHASE 01 — NFR requirement round (2026-09-19)

| ID | Decision | Ref |
|---|---|---|
| D-209 | **At most one hour of data may be lost in a major failure** (RPO ≤ 1 h; AI recommended 15 minutes); backups sit away from the server | Owner 2026-09-19; REQ-DOC-005…010; Phase 05 |
| D-210 | **The panel is back within four hours of a major failure** (RTO ≤ 4 h), with written and rehearsed restore steps | Owner 2026-09-19; Phase 05 |
| D-211 | **The interface, generated documents and notifications are Turkish only**; code, database and API names stay English, so a language can be added later | Owner 2026-09-19; PROJECT_RULES |
| D-212 | **Sizing assumption: 50–150 signed-in users within two years** (management, office, engineers, coordinators, foremen and subcontractor crew leads); used for Phase 05 cost and Phase 06 load tests | Owner 2026-09-19; Phase 05 |

## PHASE 01 — RPT REQ-RPT-015 requirement round (2026-09-19)

| ID | Decision | Ref |
|---|---|---|
| D-206 | **The official daily site report is produced on approval but sent to the client by a person** (download, or "send by e-mail" to the client addresses on the project), and the sending is recorded; no workflow sends it out, keeping REQ-WFL-006 intact | Owner 2026-09-19; REQ-RPT-020…022 |
| D-207 | **Reports are ready-made with filters and saved views**; users do not design new report types (user-defined record types keep their own reports, REQ-WFL-035) | Owner 2026-09-19; REQ-RPT-016 |
| D-208 | **Scheduled reports go to internal users only**, each filtered by the recipient's permissions; scheduling is a workflow (calendar trigger + `report.send_to_users`), per D-181 | Owner 2026-09-19; REQ-RPT-015; D-181 |

## PHASE 01 — STR requirement round (2026-09-19)

| ID | Decision | Ref |
|---|---|---|
| D-202 | **The annual budget is planned per month × cost center × expense type** and compared with actuals at the same detail. Derived consequences, **confirmed by the owner 2026-09-19**: an approved budget is locked and changed only by a new budget revision that keeps the first; annual targets double as the performance module's company target | Owner 2026-09-19; REQ-STR-001…003 |
| D-203 | **Figures are shown in nominal TL with an optional inflation-adjusted view** using the monthly CPI (TÜFE); the view never changes a record | Owner 2026-09-19; REQ-STR-002…003 |
| D-204 | **Investment payback is shown two ways**: simple payback and discounted payback at a catalog rate; inputs come from panel data (rent paid, idle days, utilisation) | Owner 2026-09-19; REQ-STR-005 |
| D-205 | **The company health scorecard is a colour per area from defined thresholds**, each colour explainable down to its indicators; there is no single overall company score | Owner 2026-09-19; REQ-STR-008 |

## PHASE 01 — MTG, DOC, SUP requirement round (2026-09-19)

| ID | Decision | Ref |
|---|---|---|
| D-199 | **Meeting visibility follows role scope** (AI recommended participants plus owners): a meeting tied to a project or site is visible to everyone who sees that scope; an untied meeting only to its participants; owners see all; a decision's owner always sees their own decision | Owner 2026-09-19; REQ-MTG-001 |
| D-200 | **Meeting minutes are final when saved**, with no participant approval or objection period (AI recommended an objection window); later changes go through a revision request | Owner 2026-09-19; REQ-MTG-001 |
| D-201 | **Archive search covers document contents including text recognition of scanned documents and photos** (AI recommended contents without text recognition in the first release). **AI note:** if recognition needs an outside service, sending documents out is a separate owner decision in Phase 03; RISK-002 grows slightly | Owner 2026-09-19; REQ-DOC-002, REQ-DOC-004 |

## PHASE 01 — INT requirement round (2026-09-19)

| ID | Decision | Ref |
|---|---|---|
| D-195 | **Recommendations come from defined rules and calculations only**; every recommendation shows its reasoning and figures, no data leaves the panel, and no AI model is used to produce them. A new recommendation type needs development | Owner 2026-09-19; REQ-INT-001, REQ-INT-006 |
| D-196 | **An acceleration scenario is "not recommended" when it crosses a defined limit** — legal overtime, daily working hours per person, daily casting per mold count, an open critical OHS finding and similar — and the crossed limit is named; limit values are catalog settings | Owner 2026-09-19; REQ-INT-013…014; D-185 |
| D-197 | **An approved scenario flows into the targets**: it becomes the project's management target duration, daily targets are recalculated, extra crane or staff needs open as tasks and its bonus pool becomes a bonus rule; no resource moves by itself | Owner 2026-09-19; REQ-INT-013…014 |
| D-198 | **A recommendation not acted on is closed with a reason** and kept; it comes back if the situation changes markedly; the same issue stays in "Dikkat" if it is there | Owner 2026-09-19; REQ-INT-001, REQ-INT-006 |

## PHASE 01 — PRF requirement round (2026-09-19)

| ID | Decision | Ref |
|---|---|---|
| D-187 | **The KPI catalog is defined from scratch in the panel**; the existing Excel KPI guide v2.0 is not imported (AI recommended importing it). **Changes scope wording:** the scope text behind REQ-PRF-002, REQ-PRF-008…011, REQ-PRF-013 said the guide is transferred as the starting catalog; corrected in place with a note | Owner 2026-09-19; REQ-PRF-002, REQ-PRF-008…011, REQ-PRF-013 |
| D-188 | **The bonus is paid outside payroll**, as a separate payment closed by a receipt (AI recommended paying it through payroll). **AI note:** a bonus is wages in law; so every bonus payment enters the monthly accounting export (D-153) as its own line and the accountant handles tax and SGK — confirmed by the owner in the same round. The expense goes to the person's registered unit | Owner 2026-09-19; REQ-PRF-014…015, REQ-PRF-017 |
| D-189 | **Score and bonus are both monthly** (AI recommended a monthly score with a quarterly bonus). Derived consequence, **confirmed by the owner 2026-09-19**: a person who changes position within a month gets a score blended by days in each position | Owner 2026-09-19; REQ-PRF-014…015, REQ-PRF-017 |
| D-190 | **A KPI the panel cannot calculate is scored by the direct manager with a reason**; the manager's manager sees it; people without accounts are scored the same way | Owner 2026-09-19; REQ-PRF-002, REQ-PRF-008…011, REQ-PRF-013 |
| D-191 | **There is no objection process for scores** (AI recommended a reasoned objection decided by the manager's manager); scores are finalised by the manager and management and change only by revision request | Owner 2026-09-19; REQ-PRF-001 |
| D-192 | **Site profit and loss never enters the coordinator's score** (AI recommended including it with client-caused factors removed); the coordinator is scored only on what they control. **Changes scope wording:** the scope text behind REQ-PRF-001, REQ-PRF-006 listed "sorumlu şantiyelerin kârlılığına etkisi"; corrected in place with a note | Owner 2026-09-19; REQ-PRF-001, REQ-PRF-006 |
| D-193 | **A critical score (< 70) opens a development-meeting task** for the manager; the plan stays on the person's card and is visible only to the person, their managers and HR | Owner 2026-09-19; REQ-PRF-002, REQ-PRF-008…011, REQ-PRF-013 |
| D-194 | **A percentage bonus is calculated on the person's monthly base salary**; the bonus amount is sensitive data like the salary | Owner 2026-09-19; REQ-PRF-002, REQ-PRF-008…011, REQ-PRF-013…015, REQ-PRF-017 |

## PHASE 01 — QHS requirement round (2026-09-19)

| ID | Decision | Ref |
|---|---|---|
| D-182 | **A material lot that fails a test only raises a warning and a decision task** (AI recommended a quarantine); the lot stays usable and the authorised decision is written to it with a reason | Owner 2026-09-19; REQ-QHS-001, REQ-QHS-003 |
| D-183 | **No health information is kept for OHS incidents** (AI recommended a separate sensitive field): injury type, medical report, treatment and lost days stay outside the panel; names and the account of the event are internal data. Consequence for HR settled by D-186 | Owner 2026-09-19; REQ-QHS-009…010; RISK-001 |
| D-184 | **PPE is issued to a person by count**: it leaves stock like a consumable, the person's card records what and when, and the person confirms on the phone; PPE needing periodic inspection (e.g. harness) is carded as an asset. Derived consequence, **confirmed by the owner 2026-09-19**: a person without an account signs a paper record whose photo is uploaded, as in D-160 | Owner 2026-09-19; REQ-QHS-013…015 |
| D-186 | **HR keeps only the existence and dates of a medical report, never the document itself** — for the personnel file, periodic health reports and sick leave alike; a sick leave is approved on the report's dates; the document stays outside the panel. Makes HR consistent with D-183; REQ-HR-002, -003 and -014 reworded | Owner 2026-09-19; D-183; RISK-001 |
| D-185 | **Safety over speed and bonus:** a serious accident or an open critical OHS finding in a period means the site's speed and bonus target for that period is not met; near misses and minor events do not affect it, and reporting a near miss never counts against anyone | Owner 2026-09-19; REQ-INT-013…014, REQ-QHS-011, REQ-QHS-016 |

## PHASE 01 — Layer scan of the requirement files (2026-09-18)

| ID | Decision | Ref |
|---|---|---|
| D-181 | **Every requirement states its layer** — Sabit (fixed records and calculations), Akış (a default workflow the designer can change) or Tanım (a catalog value) — and names the configurable part in its own line. A process step is never written as fixed module behaviour; it is named as a default workflow and the module's catalog publishes what that workflow needs. Enforced by the records validator. Asked for by the owner after noticing that module questions were not workflow design; the scan of all 328 requirements found 101 with a configurable part, and three descriptions (REQ-TSK-006, REQ-CRM-007, REQ-CMP-013) were reworded without change of meaning; REQ-CMP-013 gained the catalog action `notice_letter.create_draft`. Scan and rewordings confirmed by the owner 2026-09-19 | Owner 2026-09-18; D-077 |

## PHASE 01 — CMP requirement round (2026-09-18)

| ID | Decision | Ref |
|---|---|---|
| D-177 | **The contracts module holds client contracts, subcontractor contracts and long-term supplier agreements** (AI recommended client and subcontractor only), each with trackable terms and obligations. Derived consequences, **confirmed by the owner 2026-09-19**: a supplier framework price is proposed when an order is opened, and a contract amendment is a new dated version that keeps the earlier ones | Owner 2026-09-18; REQ-CMP-001 |
| D-178 | **An extension of time is tracked as request → client decision → new date**; the contract end date and the delay penalty follow the decision, earlier dates stay in history | Owner 2026-09-18; REQ-CMP-002, REQ-CMP-005, REQ-CMP-010 |
| D-179 | **When a client obligation is late, the panel drafts a formal notice letter (PDF)** documented from the records; an authorised person decides whether to send it and the sending is recorded | Owner 2026-09-18; REQ-CMP-007, REQ-CMP-012 |
| D-180 | **A letter of guarantee's bank commission is an expense of the project it was taken for**, charged period by period while the letter runs | Owner 2026-09-18; REQ-CMP-014, REQ-CMP-016…017 |

## PHASE 01 — QTE requirement round (2026-09-18)

| ID | Decision | Ref |
|---|---|---|
| D-173 | **Quote cost estimates carry no general-expense share** (AI recommended a separate line excluded from feedback); covering general expenses is the target margin's job, the same logic as D-149. **Changes scope wording:** the scope text behind REQ-QTE-005…006 listed "genel gider payı"; corrected in place with a note | Owner 2026-09-18; REQ-QTE-005…006; D-149 |
| D-174 | **A quote item's estimated cost is proposed from the company's latest actual unit cost** for that item; the preparer may change it and both values stay visible; with no data it is entered by hand | Owner 2026-09-18; REQ-QTE-005…006, REQ-QTE-010…011 |
| D-175 | **A sales order reserves its quantity in stock**; reserved stock is not available to sites or other orders; the reservation lifts on shipment or cancellation | Owner 2026-09-18; REQ-QTE-014…015, REQ-QTE-018 |
| D-176 | **Each shipment of a sales order is invoiced separately**; shipped, invoiced and remaining quantities are shown | Owner 2026-09-18; REQ-QTE-014…015, REQ-QTE-018 |

## PHASE 01 — CRM requirement round (2026-09-18)

| ID | Decision | Ref |
|---|---|---|
| D-169 | **A request arriving by e-mail is opened by hand** from the quick-entry screen and the e-mail is attached with its files; the panel does not read the mailbox (consistent with D-103) | Owner 2026-09-18; REQ-CRM-001…003, REQ-CRM-005 |
| D-170 | **WhatsApp requests are entered by hand** on the quick-entry screen, with a screenshot if needed; no WhatsApp connection | Owner 2026-09-18; REQ-CRM-001…003, REQ-CRM-005 |
| D-171 | **The client scorecard is calculated from records, plus dated notes with a reason** from authorised people; no manual score | Owner 2026-09-18; REQ-CRM-004, REQ-CRM-009…011 |
| D-172 | **A won request opens a pre-filled draft project** from the request and the accepted quote; the technical office completes it. Derived consequence, **confirmed by the owner 2026-09-18**: the project starts at the contract stage and the earlier stages of REQ-PRJ-003 come from the request's history | Owner 2026-09-18; REQ-CRM-001, REQ-CRM-006; REQ-PRJ-003 |

## PHASE 01 — HR requirement round (2026-09-18)

| ID | Decision | Ref |
|---|---|---|
| D-163 | **The panel calculates payroll itself**, gross to net: SGK, income and stamp tax, minimum-wage exemption, other deductions (AI recommended taking the figures from the accountant). Tax brackets, SGK rates and ceiling and minimum wage are dated definitions. **AI note:** a payroll engine must follow every legal change and be proven against the accountant's figures; RISK-002 grows and RISK-011 is new | Owner 2026-09-18; REQ-HR-006, REQ-HR-008…009 |
| D-164 | **Salary cost goes to the unit the employee is registered to**, even when they worked on another site that month (AI recommended splitting by timesheet days). Derived consequence, **confirmed by the owner 2026-09-18**: if the unit changes within a month, the cost is split between the two units by the effective dates | Owner 2026-09-18; REQ-HR-006, REQ-HR-008…009 |
| D-165 | **A salary advance is deducted from the next payroll or spread over several**; it passes an approval and the remaining advance shows on the employee card | Owner 2026-09-18; REQ-HR-006, REQ-HR-008…009 |
| D-166 | **Annual leave entitlement is entered by HR for each employee** (AI recommended calculating it from seniority) | Owner 2026-09-18; REQ-HR-014 |
| D-167 | **Official payroll filings (SGK declaration, withholding return) stay with the accountant**; the panel's payroll goes into the monthly accounting export (D-153) and is reconciled | Owner 2026-09-18; REQ-FIN-026, REQ-HR-006, REQ-HR-008…009 |
| D-168 | **Salaries are paid through a bank bulk payment file** produced from the approved payroll; a receipt marks the payroll paid | Owner 2026-09-18; REQ-HR-006, REQ-HR-008…009 |

## PHASE 01 — EQP requirement round (2026-09-18)

| ID | Decision | Ref |
|---|---|---|
| D-155 | **Depreciation is charged to a site only for the days the equipment works there** (AI recommended every day on site); every other day goes to idle equipment expense. **Changes scope wording:** the scope text behind REQ-EQP-010, REQ-EQP-012 said the daily share is charged from the day the equipment is sent to the site; corrected in place with a note | Owner 2026-09-18; REQ-EQP-010, REQ-EQP-012 |
| D-156 | **Depreciation of days not worked is a separate company-wide "idle equipment expense"**, never loaded onto a project, readable per asset and location | Owner 2026-09-18; REQ-EQP-010, REQ-EQP-012 |
| D-157 | **The remaining value of an asset that becomes unusable is charged to the site where it was**; an authorised person may move it elsewhere with a reason | Owner 2026-09-18; REQ-EQP-013…014 |
| D-158 | **Low-value items (e.g. hand tools) are tracked by count per location**, not one card each; assigned items (laptop, phone, SIM card) always get their own card. Derived consequence, **confirmed by the owner 2026-09-18**: a grouped item is expensed to the receiving cost center on purchase and is not depreciated | Owner 2026-09-18; REQ-EQP-001…002, REQ-EQP-007 |
| D-159 | **The service vehicle's transport savings on our own jobs are not calculated** (AI recommended a defined market rate); its fuel, depreciation, maintenance and outside transport income are shown. **Changes scope wording:** the scope text behind REQ-EQP-021 listed the savings; corrected in place with a note | Owner 2026-09-18; REQ-EQP-021 |
| D-160 | **A vehicle custody record is confirmed by both parties from their own accounts on the phone**, with time stamps; for a person without an account, a photo of the signed paper record | Owner 2026-09-18; REQ-EQP-007…009, REQ-EQP-015 |
| D-161 | **Any asset can be owned or rented**, not only cranes; for a rented asset the lessor, rent and period are kept and the rent is charged to the site where it is | Owner 2026-09-18; REQ-EQP-004, REQ-EQP-018…020 |
| D-162 | **The working day of equipment without a meter (e.g. molds) is marked in the daily site log**: the site engineer selects the equipment used that day; for cranes it comes from the crane daily log. Adds an equipment section to REQ-SIT-003 | Owner 2026-09-18; REQ-EQP-010, REQ-EQP-012; D-155 |

## PHASE 01 — FIN requirement round (2026-09-18)

| ID | Decision | Ref |
|---|---|---|
| D-147 | **A quantity the client does not approve carries over** to the next progress payment and is proposed again; how many months it has waited is shown | Owner 2026-09-18; REQ-FIN-001…002, REQ-FIN-004…006 |
| D-148 | **The subcontractor progress payment uses the production we approved**, not the quantity the client approved; the subcontractor does not wait for the client | Owner 2026-09-18; REQ-FIN-009…010; D-030 |
| D-149 | **General expenses (office rent, head office) are not allocated to projects** (AI recommended allocation by revenue share); project profit shows direct costs only and general expenses appear company-wide. **Changes scope wording:** the scope text behind REQ-FIN-013, REQ-FIN-017 "genel gider payı" and REQ-FIN-017 "proje payına düşen diğer giderler" no longer mean an overhead share; costs recorded directly on a project still count. The scope text of REQ-FIN-013, REQ-FIN-017 and REQ-FIN-017 was corrected in place with a note (owner request 2026-09-18). Extended to quote estimates by D-173 | Owner 2026-09-18; REQ-FIN-013, REQ-FIN-017 |
| D-150 | **A client advance is recovered by deducting it from progress payments** at the contract's rate; the remaining advance is shown | Owner 2026-09-18; REQ-FIN-001…002, REQ-FIN-006 |
| D-151 | **The expected collection date is the contract's payment term** counted from client approval or invoice date as the contract states; an authorised person may change it with a reason | Owner 2026-09-18; REQ-FIN-021, REQ-FIN-023 |
| D-152 | **Duplicate expenses: the first entry books the expense**; a later receipt or invoice for the same spending is linked to it and books nothing; a difference in amount stays visible | Owner 2026-09-18; REQ-FIN-013…014, REQ-FIN-016 |
| D-153 | **Official accounting gets a monthly export file** in a format the accountant's program imports (e.g. Excel); the reconciliation result is marked in the panel. No direct integration in the first release | Owner 2026-09-18; REQ-FIN-026 |
| D-154 | **Each site closes its own period** (AI recommended one company-wide close). Derived consequence, **confirmed by the owner 2026-09-18**: the factory and the general (office) cost center close as their own units, and the company month is final when the last unit closes | Owner 2026-09-18; REQ-FIN-027…030 |

## PHASE 01 — Slice 2 requirement rounds: INV, PUR, FAC (2026-09-18)

| ID | Decision | Ref |
|---|---|---|
| D-142 | **Landed cost: galvanising and inbound transport are part of the strip's unit cost**, so a site's consumption carries the real cost into the project result | Owner 2026-09-18; REQ-INV-017…018, REQ-INV-021…024 |
| D-143 | **Weighted average cost per location** (AI recommended company-wide per material). Derived consequence, **confirmed by the owner 2026-09-18**: a transfer leaves at the source location's average and its transport cost is added at the destination | Owner 2026-09-18; REQ-INV-017…018, REQ-INV-021…024; D-142 |
| D-144 | **Over-delivery within tolerance is accepted automatically; above tolerance it needs approval or is returned**, and is held apart meanwhile | Owner 2026-09-18; REQ-INV-009…013, REQ-PUR-003…005 |
| D-145 | **Factory overhead is allocated to jobs by the labour hours spent on them**, then divided by each job's output to give the unit cost | Owner 2026-09-18; REQ-FAC-008…009 |
| D-146 | **The factory daily log must be approved, under the same rules as the site log**; nothing reaches stock or cost before approval | Owner 2026-09-18; REQ-FAC-003…004 |

## PHASE 01 — ADM requirement round (2026-09-18)

| ID | Decision | Ref |
|---|---|---|
| D-139 | **A new item in a shared list is added and usable at once, after the similar ones are shown**; authorised staff merge duplicates later, and history keeps the old name | Owner 2026-09-18; REQ-ADM-006 |
| D-140 | **The daily exchange rate is the previous business day's CBRT (TCMB) buying rate** — the rate used for valuing foreign-currency receivables and payables | Owner 2026-09-18; REQ-ADM-007, REQ-ADM-013…015 |
| D-141 | **A price or definition may be entered with a past effective date, but it applies only to transactions not yet approved**; approved records and closed periods are untouched and need a revision request | Owner 2026-09-18; REQ-ADM-007 |

## PHASE 01 — PRJ requirement round (2026-09-18)

| ID | Decision | Ref |
|---|---|---|
| D-136 | **Targets change only through a new project revision**, entered by the technical office and valid once approved; earlier revisions are kept with their dates, and over-casting is always judged against the revision valid on that day, so targets cannot be raised to hide over-casting | Owner 2026-09-18; REQ-PRJ-005…009, REQ-RPT-008, REQ-SIT-018 |
| D-137 | **Daily targets are calculated from the chosen duration, the remaining work and the working calendar; an authorised person may correct them**, the correction is recorded, and the remaining days are recalculated as production falls behind | Owner 2026-09-18; REQ-PRJ-011 |
| D-138 | **A site belongs to exactly one project**; a project may be split into several sites. Two contracts on the same ground are two sites | Owner 2026-09-18; REQ-PRJ-001 |

## PHASE 01 — TSK and AUD requirement rounds (2026-09-18)

One round each; the answers are written into `docs/requirements/REQ-TSK.md` and `docs/requirements/REQ-AUD.md`.

| ID | Decision | Ref |
|---|---|---|
| D-130 | **A manual task can be given to anyone within the giver's own scope**, regardless of level (AI recommended: subordinates and self, owners and GM to anyone). A site engineer can therefore assign a task to their coordinator | Owner 2026-09-18; REQ-TSK-001…002 |
| D-131 | **How a manual task closes is chosen when it is given**: with "my approval required" the giver closes it; without, the assignee closes it and the giver is notified | Owner 2026-09-18; REQ-TSK-001…002 |
| D-132 | **Channels: everything in the panel; new task, approval request and critical alert also as an instant phone notification (browser push, no app); e-mail only for the daily digest.** Answers OQ-016 | Owner 2026-09-18; REQ-TSK-009…010; OQ-016 |
| D-133 | **Daily digest: every user gets their own; owners also get the company's** | Owner 2026-09-18; REQ-TSK-012…013 |
| D-134 | **Nothing is ever deleted or anonymised, personal data included**, even on request or at the end of a retention period (AI recommended anonymising the identifying fields). **Legal risk:** KVKK erasure and anonymisation rights cannot be met; recorded under RISK-001 and brought back to the owner with it before real HR data is entered (D-050) | Owner 2026-09-18; REQ-AUD-001…002, REQ-AUD-004…005, REQ-WFL-016; KVKK |
| D-135 | **The company-wide audit log screen is for the owners only.** A record's own history stays visible to whoever can see the record, filtered by data class | Owner 2026-09-18; REQ-AUD-001…002, REQ-AUD-004…006, REQ-IAM-022…024, REQ-WFL-016 |

## PHASE 01 — RPT requirement round (2026-09-18, TASK-0021)

One round with the owner; the answers are written into `docs/requirements/REQ-RPT.md`. REQ-RPT-015 (reports and exports) gets its own round later in Phase 01.

| ID | Decision | Ref |
|---|---|---|
| D-126 | **An attention item closes only when its cause is resolved.** Nobody can close, delete or hide it; a user may mark it "seen", and it stays | Owner 2026-09-18; REQ-INV-026, REQ-RPT-002, REQ-RPT-007…009, REQ-SIT-018 |
| D-127 | **Indicators: a default per role, adjusted by each person.** Authorised staff set each role's defaults; users reorder, add and remove on their own screen and can reset; nobody adds an indicator outside their permissions | Owner 2026-09-18; REQ-RPT-003…004 |
| D-128 | **"See the company through the system" is visible to the owners and the general manager** | Owner 2026-09-18; REQ-RPT-010 |
| D-129 | **The loss diagnosis card is always shown and moves to the top when the site is in loss or its profitability is falling**, with the largest drivers highlighted | Owner 2026-09-18; REQ-RPT-013 |

## PHASE 01 — SIT requirement round (2026-09-18, TASK-0021)

Two rounds with the owner; the answers are written into `docs/requirements/REQ-SIT.md`.

| ID | Decision | Ref |
|---|---|---|
| D-119 | **Several people fill the same day's log, section by section**; only the day's responsible person submits it; every row records who entered it | Owner 2026-09-18; REQ-SIT-002, REQ-SIT-004, REQ-SIT-032 |
| D-120 | **A submitted log can be recalled by its sender until the approver decides**; the recall is recorded | Owner 2026-09-18; REQ-SIT-007…008 |
| D-121 | **Over-casting can be entered but not submitted without an explanation**; the row turns red and the warning reaches the engineer, the coordinator and the owners, who cannot have it hidden from them | Owner 2026-09-18; REQ-RPT-008, REQ-SIT-018 |
| D-122 | **A missed day can be entered later**, permanently marked "late entry", visible to coordinator and management and counted in performance | Owner 2026-09-18; D-037 |
| D-123 | **Consumption is suggested from the recipe and can be changed**; the difference is flagged and shown on the approval screen; stock moves by the entered amount | Owner 2026-09-18; REQ-ADM-004, REQ-SIT-015, REQ-SIT-029…030, REQ-SIT-035 |
| D-124 | **Client handover times rest on our own record** (entered by our team, approved by the coordinator); no signature or approval is taken from the client. AI note: this limits the evidence if the client disputes a delay | Owner 2026-09-18; REQ-SIT-024…025, REQ-WFL-018 |
| D-125 | **Subcontractor workers are recorded by name in the daily log.** KVKK note: personal data of non-employees, tracked under RISK-001 (no legal review, D-050); no sensitive fields (ID number, IBAN) are kept there | Owner 2026-09-18; REQ-SIT-026…027, REQ-SIT-034 |

## PHASE 01 — IAM requirement round (2026-09-18, TASK-0021)

Two rounds with the owner; the answers are written into `docs/requirements/REQ-IAM.md`.

| ID | Decision | Ref |
|---|---|---|
| D-111 | **A role assignment carries a scope**: the whole company, specific sites or specific projects. One role is defined once and given to different people with different scopes | Owner 2026-09-18; REQ-IAM-009…012, REQ-IAM-014…015 |
| D-112 | **Hierarchy is defined between roles and can be overridden per person.** A person's manager is whoever holds the next role up in the same scope; a manually set manager takes precedence | Owner 2026-09-18; REQ-IAM-009…010, REQ-IAM-014…015; D-040, D-097 |
| D-113 | **Several roles: permissions combine.** The user never switches roles; every action records the role it was taken under, and the user is asked once when two roles both allow it. Single-role users never see a role choice | Owner 2026-09-18; REQ-IAM-013 |
| D-114 | **The owner layer can be held by several people (partners).** None can hide data from another; each can audit the others | Owner 2026-09-18; REQ-AUD-006, REQ-IAM-022…024 |
| D-115 | **Commercial and sensitive-personal visibility is granted module by module**, not by one company-wide switch | Owner 2026-09-18; REQ-IAM-011…012 |
| D-116 | **Delegation can be given by the person (planned absence, manager notified) and by the manager or an authorised person (unplanned)** | Owner 2026-09-18; REQ-IAM-018 |
| D-117 | **Access closes by itself on the leaving date** set by HR: account deactivated, sessions ended, owners and the manager notified. This is IAM's own behaviour, not a workflow action | Owner 2026-09-18; REQ-AUD-006, REQ-IAM-001, REQ-IAM-003…008, REQ-WFL-029; D-091 |
| D-118 | **"Owner approval" is completed by any one owner** | Owner 2026-09-18; D-114 |

## CHG-004 follow-up after CHG-006 (2026-09-18, TASK-0040)

The owner reviewed the TASK-0040 findings and decided:

| ID | Decision | Ref |
|---|---|---|
| D-106 | **Sample data removed from the work layer.** "Onaylar" and "Görevler" show their empty states instead of sample records; the notification bell shows "Bildirim yok." with no count; the rail and phone badges show no numbers (`sampleWorkCounts` became an empty `workCounts`); the "Bugün" figures that mirrored those lists (coordinator's queue rows, "Bekleyen onay", "Geciken görev") are empty or zero, and an empty work block no longer carries the "Örnek veri" label. Supersedes D-059 and D-063, and the sample-screen part of D-070. The other "Bugün" sample figures (D-065) and the sample sites (D-064) are unchanged | Owner 2026-09-18; TASK-0040 |
| D-107 | **Rejecting and sending back both require a reason.** Applies to the approval screen built with the engine (D-099) | Owner 2026-09-18; TASK-0040 |
| D-108 | **No "İş Akışları" menu entry now.** Where the flow designer, templates and the "new flows" list live, and how they flow, is decided later in its own question-and-brainstorm round when Phase 02/08 reaches it; the owner asked for a clean UX flow rather than a placeholder | Owner 2026-09-18; TASK-0040 |

## Git workflow (2026-09-18)

| ID | Decision | Ref |
|---|---|---|
| D-110 | **`main` is kept green and in sync by machine.** The pre-commit hook runs the full check (`npm run check:commit`: records in strict mode, type check, lint, tests, formatting, about 20 s) and refuses a red commit; the post-commit hook pushes every commit on `main` to `origin` automatically. Commits are made as work progresses, without waiting to be asked | Owner 2026-09-18 |
| D-109 | **Single branch.** Work is committed directly to `main` in small, frequent commits; the separate-branch and pull-request rule is removed. `main` must stay green on every commit (`npm run check` before committing; the pre-commit gate enforces record consistency). The only other branch allowed is a throwaway `spike/` branch that is never merged, because spike code never becomes product code (ADR-007). Supersedes the branching part of `docs/standards/GIT_WORKFLOW.md` and the direct-to-`main` exceptions recorded on 2026-09-18 | Owner 2026-09-18 |

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
| D-027 | One company record (`Party`) per real-world firm with roles (`client`, `customer`, `supplier`, …); client of application work and product-sales customer are the same record when it is the same firm; party account balance is per party | REQ-CRM-004, REQ-CRM-009…011, REQ-FIN-018…019, REQ-QTE-014…015, REQ-QTE-018 |
| D-028 | Loss concepts confirmed as distinct record types: Process Loss (fire) = measured in/out quantity difference in factory processing, galvanizing or shipment (weighed); Damaged Unit (zayi) = unusable panel/product (quantity + reason + photo mandatory); Scrap (hurda) = sellable material separated from process loss or damaged units | REQ-INV-004, REQ-INV-027, REQ-SIT-013, REQ-SIT-020 |
| D-029 | Guarantees take three forms, all tracked: letter of guarantee, retention deducted from client progress payments, cash guarantee | REQ-CMP-002, REQ-CMP-005, REQ-CMP-010, REQ-CMP-014, REQ-CMP-016…017, REQ-FIN-001…002, REQ-FIN-006 |
| D-030 | Subcontractor payment methods: unit rate (approved quantity × unit price), lump sum (fixed agreed total for work or a part), day rate (days or person-days). Extends REQ-FIN-009…010, REQ-FIN-013, REQ-FIN-017 wording, which described unit rate only; requirements must cover all three | REQ-FIN-009…010, REQ-FIN-013, REQ-FIN-017 |

## PHASE 01 — glossary round 2 (2026-09-15, OQ-007 open terms closed)

| ID | Decision | Ref |
|---|---|---|
| D-031 | "Kademe" = the course (horizontal row / height level) a panel sits in on the wall (1st course, 2nd course…); panel type definitions may state which course(s) they are used in | REQ-ADM-001…004, REQ-SIT-014 |
| D-032 | Lug is a single standard item tracked by quantity (no lug types) | REQ-FAC-007, REQ-INV-001 |
| D-033 | A party with several roles (e.g. client and supplier) has one net party account balance; receivables and payables offset automatically | REQ-FIN-018…019, D-027 |
| D-034 | Party account balances are kept per currency (e.g. EUR balance), each shown with its current TRY equivalent; exchange differences are calculated separately. Combined with D-033: one net balance per party per currency | REQ-ADM-007, REQ-ADM-013…015, REQ-FIN-018…019 |

## PHASE 01 — Slice 1 requirement round 1 (2026-09-15, TASK-0021)

| ID | Decision | Ref |
|---|---|---|
| D-035 | REQ-SIT-004 chain "site engineer → coordinator → technical office → HR" is the **entry responsibility fallback order** for the daily site log (next role enters when the previous is unavailable), not an approval chain. Approval of the daily site log is given by the coordinator (REQ-SIT-013, REQ-SIT-031…032, REQ-WFL-015…016); management can reassign entry per site or period | REQ-SIT-004, REQ-SIT-013, REQ-SIT-031…032, REQ-WFL-015…016 |
| D-036 | All users, including field staff and subcontractor crew leads, sign in with email + password (2FA rules per REQ-AUD-006, REQ-IAM-001, REQ-IAM-003…006, REQ-IAM-008 still apply) | REQ-AUD-006, REQ-IAM-001, REQ-IAM-003…006, REQ-IAM-008 |
| D-037 | Daily site log submission deadline is configured in the panel by authorized management (per site or project); no default value is fixed in requirements. Missing the deadline raises a warning | REQ-FIN-015, REQ-INV-026, REQ-RPT-002, REQ-RPT-007…009, REQ-SIT-001…004, REQ-SIT-006…008, REQ-SIT-030, REQ-SIT-032; owner clarification 2026-09-15 |
| D-038 | Days marked as holidays in the working calendar require no daily site log; on any other day without work a short "no work" log with a selected reason (weather, client waiting, …) is mandatory | REQ-ADM-010…012, REQ-RPT-014, REQ-SIT-002, REQ-SIT-032 |
| D-039 | Email addresses: company employees get a company-domain address; subcontractor crew leads may use a personal email. Panel access is revoked in the panel regardless of mailbox ownership | REQ-AUD-006, REQ-IAM-001, REQ-IAM-003…006, REQ-IAM-008, D-036 |
| D-040 | Approval fallback: the approver's active delegate approves first; if there is no delegate or the configured waiting time passes, the approval escalates to the approver's superior role. Roles, their permitted actions, approval assignments, delegation and escalation times are all configurable in detail by authorized administrators (general principle, not specific to daily logs) | REQ-IAM-009…010, REQ-IAM-014…015, REQ-IAM-018, REQ-TSK-006, REQ-WFL-012…015; ADR-005, ADR-006 |
| D-041 | Owner-only approvals while the owner is unavailable: an owner-designated delegate may give them for an owner-defined period; every action taken is reported to the owner (answers OQ-023) | REQ-AUD-006, REQ-IAM-018, REQ-IAM-022…024 |

## UI decisions (2026-09-15)

| ID | Decision | Ref |
|---|---|---|
| D-042 | For advanced components, COSS Origin (https://coss.com/origin) examples are the first design reference. Origin is a Radix-based legacy snapshot (verified in `cosscom/coss` `apps/origin`: `radix-ui` imports, no Base UI; README "Legacy snapshot"; MIT), so its code is not copied; the design/behavior is rebuilt with COSS UI primitives and Particles. Owner chose this over copying Origin code (which would mix Radix and Base UI and need a superseding ADR) | ADR-009, `docs/ui-ux/DESIGN_SYSTEM_RULES.md` §3.1 |
| D-043 | Second factor for 2FA is an authenticator app (TOTP, Supabase Auth MFA); SMS is not used. Which roles must use 2FA stays admin-configurable (REQ-AUD-006, REQ-IAM-001, REQ-IAM-003…006, REQ-IAM-008, D-040). Recovery method for a lost device to be designed in Phase 03 | CHG-002, REQ-AUD-006, REQ-IAM-001, REQ-IAM-003…006, REQ-IAM-008 |
| D-044 | Comprehensive in-app (site-wide) search across modules, opened as a command palette built with the COSS `Command` component (top bar + keyboard shortcut). Results must respect permissions and data classification (no commercial/sensitive data leak). Extends scope: functional scope only defines archive search (REQ-DOC-002, REQ-DOC-004) and per-list search (REQ-NFR-013) | Owner 2026-09-16; TASK-0029 |
| D-045 | COSS `Frame`, `Drawer`, `Dialog`, `Menu` and `Sheet` are used wherever the need arises instead of custom surfaces; desktop–mobile pairing decided per screen in Phase 02 | Owner 2026-09-16; `docs/ui-ux/DESIGN_SYSTEM_RULES.md` §1.1 |
| D-046 | The devl.dev auth screens (`/c/auth/login`, `/c/auth/onboarding`) are adopted as the **actual design** of the GEOGES auth screens, not only as inspiration: split layout, particle figure on the left, one form column on the right, mono uppercase eyebrow + heading + description, step indicator. Adaptation is mandatory: their registry items are rebuilt in the project's own layers with COSS components (they already depend on `@coss/button`, `@coss/input`, `@coss/label`, `@coss/kbd`, `@coss/separator`), Turkish text, brand tokens, the project's own theme provider. Not taken over: their dual theme system (`lib/themes`), their figure PNGs (unavailable and unlicensed), magic-link + Google/Apple sign-in (we use e-mail + password + TOTP, D-036/D-043). `npx shadcn add` was deliberately not run, so no foreign file layout or duplicate theme stack enters the repo | Owner 2026-09-16; ADR-009, `docs/ui-ux/DESIGN_SYSTEM_RULES.md` §3 |
| D-047 | Custom element approved (the first one, per ADR-009 §1): `ParticleField`, a canvas that samples an image and paints it as spring-held dots reacting to pointer and typing. COSS has no decorative canvas primitive, so this cannot be built from COSS. Adapted to the project: the source image is the GEOGES stacked logo, dot colour follows `--brand-logo`, `prefers-reduced-motion` paints the figure once without animation, and the morph/multi-figure machinery of the original was dropped as unused. Used only in the auth shell | Owner 2026-09-16; `src/platform/ui/auth/particle-field.tsx` |

## PHASE 01 — Pilot, schedule and KVKK (2026-09-16, OQ-021/022/024)

| ID | Decision | Ref |
|---|---|---|
| D-048 | The first pilot runs on **sample data**, not a real site with real staff. No pilot site or pilot user group is named yet (answers OQ-021) | Owner 2026-09-16; ADR-007 vertical slices |
| D-049 | No target date is set for design completion or the pilot; the project is not schedule-driven (answers OQ-022). Sizing and sequencing still come from the roadmap | Owner 2026-09-16 |
| D-050 | No KVKK legal review is commissioned (answers OQ-024). Combined with D-048 the pilot processes no real personal data, so the exposure starts only when real HR records are entered. RISK-001 stays open and must be raised again before that point | Owner 2026-09-16; RISK-001 |
| D-052 | Development-only presentation page (CHG-003): a self-contained sandbox in `src/sandbox/presentation/` with its own CSS Modules styles, data and scripts, exempt from the COSS-only UI rule because it never ships (production returns 404). Its palette, radius and fonts read the app's global CSS custom properties so the page speaks the product's visual language (owner 2026-09-16); that is inheritance, not an import, so the code isolation stands. It visualizes the module map and connections, end-to-end flows (REQ-WFL-011, REQ-WFL-028), roles and visibility (scope facts only), and the daily log approval cycle. Visible to every signed-in user in development, linked from the account menu in development only. Diagram shapes and SVG connector lines approved as sandbox-only custom elements. The sandbox may import the COSS UI layer (owner 2026-09-16: shared elements are the product's, not hand-made) but nothing from modules or platform, and nothing may import it (ESLint boundaries) | Owner 2026-09-16; CHG-003; TASK-0030 |
| D-053 | The presentation sandbox draws its map with `@xyflow/react` 12.11.6 (MIT, exact-pinned). Only its engine is used — viewport, pan/zoom, node and edge plumbing; every node and link is our own component and stylesheet, so none of the library's default look reaches the screen. Chosen over Mermaid, which owns its rendering and would have fixed the visual style. Scoped to the development-only sandbox (D-052), so it never ships to production | Owner 2026-09-16; CHG-003; TASK-0030 |
| D-051 | Left menu adds two scope modules missing from REQ-NFR-007: "Projeler" (PRJ) directly above "Şantiyeler" in "Şantiye & Günlük" (sites belong to a project), and "Talepler & Müşteriler" (CRM) first in "Ticari" (sales flow lead → quote → finance). Answers OQ-025 | Owner 2026-09-16; REQ-CRM-001, REQ-CRM-006, REQ-INT-011…014, REQ-NFR-007, REQ-PRJ-001…011 |

## PHASE 01 — Navigation and toolbar (2026-09-16, CHG-004)

| ID | Decision | Ref |
|---|---|---|
| D-054 | Navigation skeleton is an **icon rail**, not a full-height module list. The rail has two regions: the top holds the work layer ("Bugün", "Onaylar", "Görevler") with count badges, a separator follows, and the module groups (REQ-NFR-007, six groups) sit below. Group labels and module names stay exactly as recorded — only their presentation changes. A second sidebar column was rejected: the context navigation it would have carried moves into the header instead (D-055), so the existing shell, `--layout-gap`, `--frame-inset` and the 16:9 frame are untouched. The rail maps to a bottom bar on phones (REQ-NFR-008) | Owner 2026-09-16; CHG-004; REQ-NFR-007…008 |
| D-055 | The header becomes a **three-zone toolbar** with one rule repeated in every module: left = where you are (context selector), middle = where you go (⌘K search and command palette, D-044), right = what you do (role-specific primary action, notification and queue badges, theme toggle, user menu). A **second row renders only when an object is open** — that object's tabs and date strip — and is absent otherwise, so screens without context keep the current layout. This fulfils REQ-NFR-009 (top bar contents) and replaces the second sidebar panel | Owner 2026-09-16; CHG-004; REQ-NFR-009, D-044, D-045 |
| D-056 | **"Bugün" is the entry screen of every role**, composed per role instead of a single shared dashboard: cockpit + "Dikkat" for the owner and general manager (REQ-INV-026, REQ-RPT-002…004, REQ-RPT-006…009), the approval queue for the coordinator (REQ-SIT-013, REQ-SIT-031…032, REQ-WFL-012…016), today's site log for the site engineer (REQ-FIN-015, REQ-SIT-002…003, REQ-SIT-006…008, REQ-SIT-030, REQ-SIT-032), a single narrow flow for the subcontractor crew lead (REQ-IAM-011…012). The cockpit is therefore the owner's variant of "Bugün", not a competing entry point. An empty screen means finished work ("bugün temiz"), the opposite of a filled dashboard | Owner 2026-09-16; CHG-004; REQ-FIN-015, REQ-IAM-011…012, REQ-IAM-027, REQ-RPT-001…002, REQ-SIT-001…004, REQ-SIT-006…008, REQ-SIT-030, REQ-SIT-032, REQ-TSK-007, REQ-WFL-012…015 |
| D-057 | **Product transfer of CHG-004, step 1 (rail).** The existing COSS sidebar is kept, **collapsed by default** (the user's last choice is remembered by COSS's `sidebar_state` cookie). Collapsed: work layer on top, then **one icon per module group**; a group icon opens its modules as a flyout menu. Expanded: groups unfold in place, **several may stay open**, and the open set is remembered (`sidebar_groups` cookie, rendered on the server so nothing flashes). Logo stays at the sidebar head. `/dashboard` is "Bugün" | Owner 2026-09-16; CHG-004; TASK-0032 |
| D-058 | "Onay" and "Görevler" are **removed from the module list**; they live only in the work layer ("Onaylar", "Görevler"). The "Genel Bakış" group held only "Cockpit", which became "Bugün" in the work layer, so the group no longer exists: the rail shows **5** group icons, not 6. All other REQ-NFR-007 group names, order and D-051's two modules are unchanged | Owner 2026-09-16; CHG-004; REQ-NFR-007, D-051 |
| D-059 | Work-layer badges show **sample numbers** until approval and task data exist, kept in one place (`sampleWorkCounts` in `navigation-registry.ts`) and marked "örnek veri" in the tooltip and badge title; switching to real permission-filtered counts is a one-line change. Recorded objection (AI): M0 deliberately avoided fake numbers on the cockpit because a number on the panel is read as real | Owner 2026-09-16; CHG-004; TASK-0032 |
| D-060 | Owner requirements for the next steps: (a) a **development-only role switcher** under the account menu, to view the shell as different roles; (b) the ⌘K palette uses COSS UI's `Command` **exactly in COSS's own documented design** (owner screenshot); (c) COSS `Frame` is used wherever a bordered surface is needed (D-045) | Owner 2026-09-16; CHG-004; TASK-0033, TASK-0034 |
| D-061 | **Development role switcher.** Four sample seats from the prototype (Sahip, Koordinatör, Saha Mühendisi, Taşeron Ekip Başı) in `platform/access/preview-roles.ts`, each with sample permissions, a primary action, sites and a notification count. The account menu offers "Rol olarak görüntüle" **only in development**; the choice is a cookie read by the app layout and switching returns to "Bugün". Every other environment renders the owner seat, which sees everything (same as `previewAccessPolicy`). Deleted when IAM delivers real roles | Owner 2026-09-17; CHG-004; TASK-0033 |
| D-062 | **Header zones (step 2).** Left: bold page name, then a muted path "Grup › Sayfa" (path hidden below `lg`, shortens before the name). A **site selector** appears only on pages that declare `scope: "site"` in the registry (now Şantiye Kaydı, Günlük Raporlar); the choice is remembered across those pages (cookie); a seat with one site sees the name as text. Middle: **wide search bar** opening the COSS Command palette in COSS's documented layout (grouped results, key-hint footer), Ctrl/⌘+K; search ignores Turkish letters ("gorev" finds "Görevler"). Right: a **primary action** that is the page's own (`primaryAction` in the registry) or else the seat's; until forms exist it shows the toast "Bu işlem henüz hazır değil" | Owner 2026-09-17; CHG-004; TASK-0033 |
| D-063 | The notification bell is shown with **sample notifications** and a sample count per seat, marked "Örnek veri" in the list (`sample-notifications.ts`), replaced when a notification service exists | Owner 2026-09-17; CHG-004; TASK-0033 |
| D-064 | **Context row (step 3).** The row exists only while an object is open and is delivered by the `@context` parallel route slot, so a page without an object renders no row at all and the layout is untouched. Until the SIT module exists it is judged on a **sample site detail** (`/sites`, three sample sites, `site-context.ts`). Each section is **its own address** — `/sites/kavakli` is "Gün", `/sites/kavakli/dokum` is "Döküm" — with Turkish slugs, because the address is what people see and share. The day is chosen with a **strip plus a calendar** (‹ ›, five days, COSS `Calendar` in a popover, future days disabled) and travels in `?gun=YYYY-MM-DD`; today leaves the address clean. The day selector is part of **every** context row (owner: "her zaman"), so its place never moves. Sample site data is marked "Örnek veri" | Owner 2026-09-17; CHG-004; TASK-0034 |
| D-065 | **"Bugün" screen (step 4).** `/dashboard` is "Bugün", every role's entry screen; the M0 cockpit heading is gone because the header already names the page, and the body opens with the date instead. Work first, figures second: the seat's own block (owner "Dikkat", coordinator approval queue, site engineer today's log, crew lead their one job) and the indicators share the width half and half from `lg` up. Six indicators stand unfolded — production, monthly profit and loss, cash, pending approvals, overdue tasks, critical alerts — and the remaining nine wait behind "Tüm göstergeler". Every figure is **sample data** marked "Örnek veri" (owner's choice over empty skeletons; the AI's objection that a panel showing invented numbers can be mistaken for real is recorded). Each work row reaches its own source (REQ-INV-026, REQ-RPT-002, REQ-RPT-007…009). Revised the same day by the owner: the two charts and the site summary (REQ-RPT-006) are off this screen, so "Bugün" is the work block, the six figures and the fold — the site summary belongs with the SIT screens | Owner 2026-09-17; CHG-004; TASK-0035 |
| D-066 | **Charts.** COSS has no chart component, so charts are an approved custom element (ADR-009 §1; owner asked for them on 2026-09-17). No charting library is added: at this size a bar is a box, so `platform/ui/chart/bar-chart.tsx` draws plain elements that keep their rounded ends crisp at any width, take the theme tokens directly and carry their own hover text. One series needs no legend, only the last value is labelled, a day with no work draws no bar, and a negative value turns the chart diverging — green for profit, red for loss, which is what those colours mean throughout the panel (REQ-NFR-011). "Bugün" used two — fourteen days of production and six months of profit and loss — until the owner took both charts off that screen on 2026-09-17. The component was deleted with them rather than left unused; it returns from git history when a screen needs a chart | Owner 2026-09-17; ADR-009; TASK-0035 |
| D-067 | **Only the number is mono.** DESIGN_SYSTEM_RULES §4 puts financial figures in Geist Mono with equal-width digits; that now means the digits alone. Units and currency symbols are set in the body font by the shared `platform/ui/format/figure.tsx`. Reason found on screen: Geist Mono has no ₺ glyph, so a symbol left inside the mono run falls back to another font and sits wrong against the digits — and "318 panel" in mono reads as code. The money component DESIGN_SYSTEM_RULES §4 asks for will build on this | Owner 2026-09-17; `docs/ui-ux/DESIGN_SYSTEM_RULES.md` §4 |
| D-068 | **Rail refinements.** A user who has never touched the menu finds the first group open; once they have opened or closed anything their choice wins, including leaving everything closed. Labels never wrap — they are clipped and fade with the rail — because a long title breaking onto a second line during the 200ms animation made the menu jump. The two logos cross-fade in a head of fixed height, the app card animates its margin with the rail instead of snapping, and the separator no longer carries its own margins, which had given the menu a horizontal scrollbar. The sidebar head drops COSS's own 8px padding so the logo occupies the same 56px band as the app header and sits level with the card's top edge instead of 8px below it; the square mark in the icon state is 40px (32px looked lost in the band, 48px too heavy) | Owner 2026-09-17; CHG-004; TASK-0032 |
| D-069 | **Phone navigation (step 5).** Below `md` the rail becomes a bottom bar: the work layer with its badges, the seat's primary action in the middle where the thumb reaches (the plus alone on a phone, its name kept as the accessible label), and "Modüller" opening a full-height COSS `Drawer` with a search box and a grouped icon grid. The header's menu button and its primary action are desktop-only, so a phone has one way to navigate instead of two; the top bar keeps the page name, the search icon, notifications, theme and the account. This refines REQ-NFR-008, which describes a hamburger drawer: the drawer survives as the module grid, but the screens people use daily are one thumb-reach away. Entries are permission-filtered like the rail, so a subcontractor crew lead sees two of them | Owner 2026-09-17; CHG-004; REQ-NFR-008; TASK-0036 |
| D-070 | **Sample screens for the work layer.** "Onaylar" and "Görevler" stop being generated placeholders and get sample screens of their own, as the prototype had them. The approval centre runs in **queue mode** (REQ-WFL-012…015): one record fills the screen, a decision brings in the next, and the queue ends in "Bugün temiz" — which answers the first item of OQ-027 by building it. "Görevler" lists what is late, what is due today and what is coming (REQ-TSK-007), each task naming its source and linking to the screen where it is done. Sample data stays small — one task per state, three approvals — and every figure that also appears on "Bugün" is kept equal to its list, so no two numbers on screen contradict each other (owner 2026-09-17). The sandbox navigation prototype was deleted the same day: the product shell replaced it | Owner 2026-09-17; CHG-004; REQ-TSK-007, REQ-WFL-012…015; OQ-027 |
| D-071 | **Only the square mark in the product.** The wordmark logos (long, stacked, panel) are out of the application; the one place a full logo still appears is the particle figure on the authentication screens, which samples `logo_light.svg`. The expanded rail shows the square tile with the name set as **text** beside it (GEOGES / PANEL), so the head moves with the menu labels instead of swapping a second image. The tile keeps one position in both states — on the centre line of the icon column — because centring it in the rail made it slide sideways while the menu closed. `BrandLogo`, its `tone` prop and the unused `BrandFooter` were deleted with the wordmark | Owner 2026-09-17; ADR-009; `docs/ui-ux/DESIGN_SYSTEM_RULES.md` §4 |
