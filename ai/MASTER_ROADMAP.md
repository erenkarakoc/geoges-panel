# MASTER ROADMAP

Status: APPROVED by owner (2026-09-15, incl. CHG-001 resolution) · Last updated: 2026-09-19

**This file is the single authority for the plan.** Every other record derives from it and may not contradict it:
`ai/TASKS.md` says who does what and in which state, `ai/DECISIONS.md` + ADRs say why, `ai/CURRENT_STATE.md` says where we are right now, `ai/REQUIREMENTS.md` says what is wanted. An approved change request is written into this file **in the same session it is approved** (`ai/PROJECT_RULES.md` §9); a change request that is not in this file may not be implemented. Consistency is machine-checked by `npm run records` (`scripts/check-records.mjs`), not by memory.

**Phase status vocabulary:** `NOT_STARTED · DISCOVER · QUESTIONS_PENDING · DESIGNING · PARTIALLY_DONE · IN_PROGRESS · DONE`.
`PARTIALLY_DONE` means some of the phase's scope was delivered early through an approved change request; the phase section lists exactly which items and which remain.

Strategy (ADR-007): **design everything first → validate risky assumptions with spikes → build foundation → deliver vertical module slices, each piloted.**
Security, tests, accessibility and documentation are part of every phase's Definition of Done; there is no separate "add security later" phase.

Module codes: see `docs/architecture/MODULE_MAP.md`.

## Overview

| Phase | Name | Stage | Status |
|---|---|---|---|
| 00 | Project Bootstrap & AI Infrastructure | Setup | DONE |
| 01 | Requirements & Domain Analysis | Design | QUESTIONS_PENDING |
| 02 | UX, Information Architecture & User Flows | Design | PARTIALLY_DONE |
| 03 | System Architecture | Design | NOT_STARTED |
| 04 | Database Architecture | Design | NOT_STARTED |
| 05 | Infrastructure, Environments & Operations Design | Design | NOT_STARTED |
| 06 | Validation Spikes | Validate | NOT_STARTED |
| 07 | Foundation Build | Build | PARTIALLY_DONE |
| 08 | Workflow Engine & Visual Designer | Build | NOT_STARTED |
| 09 | Slice 1 — Projects, Sites, Daily Log, Approvals, Cockpit | Build + Pilot | NOT_STARTED |
| 09R | Record-Type Builder (after the Slice 1 pilot, D-105) | Build + Pilot | NOT_STARTED |
| 10 | Slice 2 — Inventory, Weighing, Purchasing, Factory | Build + Pilot | NOT_STARTED |
| 11 | Slice 3 — Progress Payments, Finance, Period Close | Build + Pilot | NOT_STARTED |
| 12 | Slice 4 — Equipment, Vehicles, Cranes | Build + Pilot | NOT_STARTED |
| 13 | Slice 5 — HR, Timesheets, Payroll | Build + Pilot | NOT_STARTED |
| 14 | Slice 6 — CRM, Quotes, Quote Documents, Product Sales | Build + Pilot | NOT_STARTED |
| 15 | Slice 7 — Contracts & Compliance, Quality, OHS, CAPA | Build + Pilot | NOT_STARTED |
| 16 | Slice 8 — Meetings, Support, Archive, Reporting | Build + Pilot | NOT_STARTED |
| 17 | Slice 9 — Performance, KPI, Bonus | Build + Pilot | NOT_STARTED |
| 18 | Slice 10 — Intelligence, Optimization, Strategy | Build + Pilot | NOT_STARTED |
| 19 | Production Readiness & Company-wide Rollout | Release | NOT_STARTED |

**Milestone M0 — early first screen (CHG-002, approved 2026-09-15) — DONE 2026-09-16, owner approved:** runs in parallel with Phase 01. Real Supabase Auth (sign-in, 2FA, password reset), new-role onboarding, app shell and empty dashboard skeleton, local only. Built as the first part of the Phase 07 foundation, not throwaway. Plan: `docs/features/m0-early-first-screen-plan.md`; tasks TASK-0022…TASK-0026.

## Change request register

Every approved change request must appear here, with the phase it changed. Analyses live in `ai/DECISIONS.md`.

| ID | Change | Effect on this roadmap | Status |
|---|---|---|---|
| CHG-001 | Early preview of authentication screens and app shell | Rejected as an early preview; became Milestone M1 in Phase 07 | RESOLVED |
| CHG-002 | Early first screen now (auth + dashboard, built to keep) | Added Milestone M0 in parallel with Phase 01; amended ADR-007 | DONE 2026-09-16 |
| CHG-003 | Development-only structure presentation page | Added TASK-0030; sandbox code only, never ships (production 404). No phase moved | DONE 2026-09-18 |
| CHG-004 | Compact navigation: header as a toolbar, work layer on the sidebar rail | Delivered part of **Phase 02** (navigation/IA, role home screen, top bar, mobile) and part of **Phase 07** (app shell) early, in five steps: TASK-0032…TASK-0037. Both phases are therefore `PARTIALLY_DONE` | DONE 2026-09-18 |
| CHG-005 | Record consistency and deterministic guards | Rewrote the stale parts of this file, refiled `ai/TASKS.md`, redefined Milestone M1, blocked TASK-0027 behind TASK-0039, added `npm run records`, the pre-commit gate and the hook-written session journal | DONE 2026-09-18 |
| CHG-006 | Composition-first workflow platform | **Approved and folded 2026-09-18 (D-077…D-105).** Phase order unchanged (engine + designer stay in Phase 08, before the slices — D-088). Adds a per-module capability catalog to Phase 01, contract tests to Phase 03, a free record-type builder (D-079), built after the Slice 1 pilot (D-105), new spikes to Phase 06. Analysis in `ai/DECISIONS.md` | DONE 2026-09-18 |

## Work delivered ahead of its phase

Recorded so that no phase is entered believing its scope is untouched.

| Delivered | Phase it belongs to | Tasks | Still owed by that phase |
|---|---|---|---|
| Next.js scaffold, lint/boundary rules, test setup, CI-less local checks | 07 | TASK-0023 | CI pipeline, staging deploy, environments |
| Real Supabase authentication (sign-in, TOTP 2FA, password reset, session guard) | 07 | TASK-0024, TASK-0025 | Dynamic roles, delegation, acting role, visibility rules, audit |
| App shell, navigation registry, theme, brand tokens, role onboarding | 07 | TASK-0026 | Audit & history, documents/storage, outbox & jobs, catalogs, custom fields, currency & calendar |
| Icon rail, three-zone header, context row, "Bugün" screen, mobile bottom bar | 02 | TASK-0032…TASK-0036 | Screen inventory, per-screen state matrix, list/detail/form standards, end-to-end flow specs, accessibility targets |
| Sample "Onaylar" queue and "Görevler" list screens | 02 | TASK-0037 | Same as above; these screens are sample data and must be re-wired to the workflow engine in Phase 08 |

Deferred (not in this roadmap until reactivated): data import, offline entry, native mobile, self-hosted Supabase migration — see `ai/DEFERRED.md`.

Slice order is a proposal based on data dependencies (`docs/architecture/MODULE_MAP.md`) and is confirmed at the end of Phase 01.

---

## PHASE 00 — Project Bootstrap & AI Infrastructure

- **Purpose:** create a controlled, AI-transferable engineering environment before any product work.
- **Scope:** repository, `/ai` state system, `/docs` structure, rules, roadmap, ID/ADR/naming/quality standards, UI rules, glossary skeleton, skill audit and installation, AI memory setup.
- **Questions:** `ai/OPEN_QUESTIONS.md` (Phase 00 section).
- **Dependencies:** none.
- **Deliverables:** `AGENTS.md`, `ai/*`, `docs/standards/*`, `docs/decisions/ADR-001…013`, `docs/architecture/MODULE_MAP.md`, `docs/ui-ux/DESIGN_SYSTEM_RULES.md`, `docs/domain/GLOSSARY.md`, installed & registered skills, first push to GitHub.
- **Risks:** skill supply-chain risk (RISK-004); process overhead for a single owner (RISK-003).
- **Status:** DONE (2026-09-15, owner approved)

**ENTRY CRITERIA**
- [x] Initial scope documents available
- [x] Engineering protocol available
- [x] Phase 00 decision round completed

**EXIT CRITERIA (Definition of Done)**
- [x] Git repository initialized with remote
- [x] `AGENTS.md` / `CLAUDE.md` bootstrap instructions
- [x] `ai/` state system files created
- [x] Rules revised per decisions (`ai/PROJECT_RULES.md`)
- [x] ID, naming, quality-gate and git standards documented
- [x] ADRs for all Phase 00 decisions
- [x] Module map and dependency graph
- [x] UI/UX design-system, COSS and devl.dev rules
- [x] Glossary skeleton with proposed terms
- [x] Skill audit (sources identified, risks noted)
- [x] Owner approval of roadmap (OQ-001)
- [x] Skills vendored at pinned commits and registered in `ai/AI_SKILLS.md` (TASK-0008)
- [x] `ui-ux-pro-max` disabled for this project (TASK-0009)
- [x] claude-mem enabled for this project in local-only mode, telemetry declined, verified in a new session (TASK-0010)
- [x] Tailwind docs snapshot initialized locally, excluded from Git (TASK-0016)
- [x] Initial commit pushed to GitHub (`deb14ef`)
- [x] Session handoff updated after final Phase 00 tasks

**PHASE COMPLETION REPORT (2026-09-15)**

```text
PHASE COMPLETION REPORT — PHASE 00
Requirements             N/A (Phase 01)
Architecture             PASS (module map, ADR-001…ADR-013)
Database                 N/A (Phase 04)
Backend                  N/A (no application code)
Frontend                 N/A (no application code)
UI/UX                    PASS (design-system, COSS and devl.dev rules documented)
Accessibility            N/A
Responsive               N/A
Security                 PASS (skill audit, pinned vendoring, claude-mem local-only, telemetry off)
Edge Cases               N/A
Tests                    PASS (claude-mem fresh-session verification, TASK-0010)
Documentation            PASS
Project State Updated    PASS

Remaining Issues (carried forward, non-blocking for Phase 00):
- TASK-0014 glossary term confirmation in Phase 01 (OQ-007)
- TASK-0018 long-lived token set by owner; verification after Windows restart
Owner approved all REVIEW tasks on 2026-09-15; stale records corrected (ADR-013, AI_SKILLS, GIT_WORKFLOW exception, OQ numbering note).
STATUS: DONE
```

---

## PHASE 01 — Requirements & Domain Analysis

- **Purpose:** turn the scope documents into atomic, traceable requirements and a domain model.
- **Scope:** REQ extraction for all modules; business rules catalog; role/permission matrix (roles × modules × data classes); data classification (public / internal / commercial / sensitive personal); domain model per module (entities, events, invariants); glossary confirmation; KVKK data inventory; confirmation of slice order and pilot users.
- **Questions:** per-module question rounds (business rules, edge cases, calculations such as P&L, depreciation, costing, KPI).
- **Dependencies:** Phase 00.
- **Deliverables:** `docs/requirements/REQ-*.md`, `ai/REQUIREMENTS.md` index, `docs/domain/*` (domain model, events catalog, business rules), confirmed `GLOSSARY.md`, permission matrix.
- **Acceptance:** every section of the functional scope maps to ≥1 REQ; no REQ without owner module; owner has approved business rules marked T1.
- **Risks:** scope size (RISK-002); hidden calculation rules.
- **Status:** `QUESTIONS_PENDING` (2026-09-19). **Done:** REQ extraction for every module — 26 files, 438 requirements, all CONFIRMED, each layer-tagged (D-181) with its capability catalog (TASK-0041, TASK-0044; MIG deferred, DEF-001); data classification (general / internal / commercial / sensitive personal) applied in every requirement and catalog; glossary confirmed (234 terms, OQ-007); every scope section mapped to requirements and `docs/sources/` removed (TASK-0039, TASK-0027, D-213); architecture principles in `docs/architecture/PRINCIPLES.md`. **Still open before exit:** (1) the role × module × data-class permission matrix — done, `docs/domain/PERMISSION_MATRIX.md` confirmed 2026-09-19 (TASK-0045); (2) a domain model per module — done, `docs/domain/DOMAIN_MODEL.md` confirmed 2026-09-19 (TASK-0046); (3) slice order and pilot users — done: order confirmed, pilots on sample data, pilot people named before slice 1 ends (D-216, TASK-0047). The KVKK personal-data inventory is deferred to the real-data gate (D-214, DEF-007).
- **Exit blocker (resolved 2026-09-19):** TASK-0027 could not run until every `§` reference was remapped to a REQ id (CHG-005). TASK-0039 remapped them (D-213) and `docs/sources/` was removed on 2026-09-19; Git tag `scope-archive` keeps the text.
- **CHG-006 deliverable:** every module's **capability catalog** — events it publishes, actions it exposes, typed and classified fields conditions may read (TASK-0041). REQ-WFL-011, REQ-WFL-028 is filed under `REQ-WFL`. Record-type builder requirements are written here too (D-079).

## PHASE 02 — UX, Information Architecture & User Flows

- **Purpose:** design how every role works with the system before building it.
- **Scope:** navigation/IA, role home screens, end-to-end flows (REQ-WFL-011, REQ-WFL-028 of scope), screen inventory, per-screen state matrix (initial, loading, empty, partial, error, permission denied, retry, destructive confirmation), COSS component mapping, list/detail/form standards, daily site log table UX, cockpit, notification and approval center UX, responsive behavior (desktop/tablet/mobile), accessibility targets (WCAG 2.2 AA), brand tokens.
- **Dependencies:** Phase 01.
- **Deliverables:** `docs/ui-ux/*` flows and screen specs; list of required custom elements with owner approval.
- **Acceptance:** every REQ with UI has a screen spec; every screen lists states and COSS components; owner approved key flows.
- **Status:** `PARTIALLY_DONE`. CHG-004 delivered the navigation skeleton, the three-zone header, the conditional context row, the per-role "Bugün" entry screen and the phone bottom bar ahead of this phase (D-054…D-070, TASK-0032…TASK-0037). Those decisions stand and are not re-opened here. **Still owed:** screen inventory, the per-screen state matrix (initial, loading, empty, partial, error, permission denied, retry, destructive confirmation), list/detail/form standards (REQ-NFR-013…015), the daily site log table UX, the end-to-end flow specifications (REQ-WFL-011, REQ-WFL-028) and the WCAG 2.2 AA targets.
- **CHG-006 deliverables:** the eight REQ-WFL-011, REQ-WFL-028 flows as **real flow definitions**, step by step, each tested against the node palette (D-089, TASK-0042); UX of the flow designer (wizard + diagram, both editable — D-085), the trace view (D-087), the "new flows" 7-day list (D-081) and the record-type builder (D-079); the CHG-004 re-review (TASK-0040).

## PHASE 03 — System Architecture

- **Purpose:** define module boundaries, contracts and cross-cutting mechanisms.
- **Scope:** module public APIs; event backbone (outbox, dispatch, idempotency, retries); workflow engine architecture (ADR-006); rules/configuration model with effective dating; custom fields; feature flags; ports & adapters (auth, storage, jobs, notifications, exchange rate, weather, email, PDF); authentication & authorization design (multi-role, delegation, acting role, owner layer, visibility of commercial/sensitive data, immediate session revocation, 2FA); background jobs; search; notifications (in-app, web push); PDF/Excel generation; observability; architecture fitness tests; data access approach (supabase-js vs direct Postgres client — OQ-020).
- **Dependencies:** Phase 01, Phase 02 (in parallel with late Phase 02 allowed).
- **Deliverables:** ADRs, `docs/architecture/*`, feature specs skeletons per module.
- **Acceptance:** all cross-cutting concerns have an ADR; each module has a boundary spec; spike list for Phase 06 defined.
- **CHG-006 scope:** capability contract format and contract tests (D-078); engine architecture — triggers (D-103), approval outcomes (D-099), for-each (D-096), record node (D-095), windowed-condition safeguards (D-100), traceability (D-087), versioning and templates (D-086), authority model (D-082, D-083 enforced in code, D-097, D-098, D-101); record-type builder architecture and its owner module (ADM or a new platform module, via ADR-010 naming).

## PHASE 04 — Database Architecture

- **Purpose:** design the full domain schema before implementation.
- **Scope:** entities for all modules (purpose, ownership, relationships, constraints, indexes, permissions, RLS, audit, history, soft delete, retention); ledgers; effective-dated configuration tables; outbox; audit tables; RLS policy model; migration strategy (expand/contract, additive-first); seed/reference data; sensitive data columns.
- **Dependencies:** Phase 03.
- **Deliverables:** `docs/database/*` (ERD per module, table specs, RLS matrix, migration conventions).
- **Acceptance:** every REQ with data maps to tables; RLS defined for every table; naming review passed.
- **CHG-006 scope:** versioned flow definitions, running instances and their trace; capability registry; the **storage model for user-defined record types** with RLS (D-092) and non-destructive history (D-094) — the hardest data question of CHG-006 (RISK-010).

## PHASE 05 — Infrastructure, Environments & Operations Design

- **Purpose:** design how the system runs, deploys, is observed and recovered.
- **Scope:** Supabase projects per environment; R2 buckets and access; VPS layout (Docker, reverse proxy, SSL); domains (`geogespanel.com` noindex); CI/CD pipeline (lint → type-check → unit → integration → build → security checks → deploy → health check → rollback); secrets management; logging, error tracking, monitoring; backup & disaster recovery (DB, files, offsite); email sending; web push; cost estimate.
- **Dependencies:** Phase 03; OQ-010…OQ-016.
- **Deliverables:** `docs/infrastructure/*`, runbooks drafts, ADRs.
- **Acceptance:** RPO/RTO defined; restore procedure designed; environment matrix complete.

## PHASE 06 — Validation Spikes

- **Purpose:** prove risky assumptions before committing to them. Spike code is thrown away.
- **Candidate spikes:** Supabase Auth + RLS with multi-role, delegation and acting role; transactional outbox + job processing on the chosen stack; workflow engine definition model + versioned execution; visual flow editor feasibility with COSS/Base UI; R2 signed URLs + permission-checked downloads; Turkish-quality PDF generation (quote documents, daily report); CBRT exchange-rate fetch with fallback; architecture boundary enforcement tooling.
- **Dependencies:** Phases 03–05 drafts.
- **Deliverables:** spike reports in `docs/architecture/spikes/`, ADR updates.
- **Acceptance:** every candidate spike is PASS, FAIL (with ADR change) or explicitly waived by owner.
- **CHG-006 spikes:** user-defined record types end to end (definition → storage → RLS → search → report); free-form windowed conditions under load.

## PHASE 07 — Foundation Build

- **Scope:** repository scaffold (Next.js, TypeScript, COSS, Tailwind, lint/format/boundary rules, test setup), CI pipeline, environments, design tokens and app shell, IAM (auth, 2FA, roles, delegation, visibility), audit & history, revision request mechanism core, documents/storage, outbox & jobs, notifications & tasks core, catalogs & custom fields, currency & calendar, deployment to staging.
- **Dependencies:** Phase 06.
- **Status:** `PARTIALLY_DONE`. Delivered ahead of the phase by M0 and CHG-004: scaffold, lint/boundary rules and test setup (TASK-0023), real Supabase authentication with TOTP 2FA and session guard (TASK-0024, TASK-0025), app shell with navigation registry, theme and brand tokens, role onboarding (TASK-0026, TASK-0032…TASK-0036). **Still owed:** CI pipeline, environments and staging deploy, dynamic roles / delegation / acting role / visibility, audit & history, revision-request core, documents & storage, outbox & jobs, notifications & tasks core, catalogs & custom fields, currency & calendar.
- **Milestone M1 — first review on a real environment (CHG-001, redefined by CHG-005 2026-09-17):** the original M1 ("owner sees the authentication pages and the shell for the first time") was consumed by M0 and CHG-004, which the owner reviewed locally. M1 is now the **staging** milestone: the same screens plus the foundation services running on the deployed environment, with a proven deploy and rollback. What M1 still proves that local review did not: real environment configuration, secrets handling, session behaviour behind the reverse proxy, backup/restore path and rollback.
- **Acceptance:** foundation features pass T1 gates; staging deploy with rollback proven; M1 review done on staging with owner feedback recorded.
- **CHG-006:** dynamic IAM must support permission types and roles defined, and assigned, from the flow designer (D-098, D-101), and must refuse the flow-design permission to any role without full visibility (D-083).

## PHASE 08 — Workflow Engine & Visual Designer

- **Scope:** workflow definitions (fixed node palette), versioning, execution engine, test-run, publish permissions, approval center integration, visual designer UI.
- **Dependencies:** Phase 07.
- **Acceptance:** default company flows (daily log approval, material issue, payment approval) defined and executed through the engine; the sample "Onaylar" screen delivered by TASK-0037 re-wired to the engine's real queue; T1 gate.
- **CHG-006 (approved 2026-09-18):** position unchanged (D-088). Scope grows: two-way editor (D-085), record node (D-095), for-each (D-096), three-outcome approvals (D-099), external-approval sub-flow template (D-102), publish controls (D-081), templates as copies (D-086), traceability (D-087). All eight REQ-WFL-011, REQ-WFL-028 flows run as executable acceptance tests. The record-type builder is **not** here — see 09R.

## PHASES 09–18 — Module Slices

Each slice follows the same pattern:
1. Feature decision summary per feature (question round if gaps remain from Phase 01–04).
2. Implementation plans for T1/T2 tasks.
3. Build → test → self-review → documentation.
4. Staging acceptance by owner.
5. Pilot with real users on sample data (D-216); feedback recorded as change requests. Real company data enters only at the Phase 19 rollout, after the KVKK check (D-214, DEF-007).

Phase 09 exit adds one condition (D-216): the pilot site and pilot users (roles and people) are named by the owner before slice 1's build ends.

| Phase | Slice | Main modules | Depends on |
|---|---|---|---|
| 09 | Projects, sites, walls, master data, daily site log (casting, installation, strips, handover times, activity & timesheet entries, waste, expenses, photos), approvals & corrections, site detail & "why are we losing money", owner cockpit, official daily report | PRJ, SIT, ADM, RPT (partial) | 07, 08 |
| 10 | Material catalog, weighing & truck shipments, stock ledger, stock counts, opening stock, strip combination, consumption costing, suppliers & purchase orders, purchase requests, factory daily log & unit cost, scrap & ancillary income | INV, PUR, FAC | 09 |
| 11 | Client & subcontractor progress payments, income/expense, party ledgers, cash-flow projection, multi-currency, invoices/receipts tracking, period close | FIN | 09, 10 |
| 12 | Asset register, locations & transfers, depreciation, maintenance & periodic inspections, crane daily log & operator screen, vehicle assignment & handover, idle resources | EQP | 09, 11 |
| 13 | Personnel file, timesheets, payroll, leave, onboarding/offboarding checklists, custody warnings, activity reports, work calendar | HR | 09, 11, 12 |
| 14 | Leads & communication log, client scorecard, tenders, quotes & margin, quote documents (PDF templates), cost feedback, product sales orders | CRM, QTE | 09, 10, 11 |
| 15 | Contract terms, obligations, conditional triggers, dependency locks, client delay evidence, certificates, OHS incidents & trainings, nonconformity/CAPA, periodic document expiry | CMP, QHS | 09, 13 |
| 16 | Meetings & decisions, internal support tickets, archive (single-window search), reporting & exports | MTG, SUP, DOC, RPT | 09–15 |
| 17 | Performance metrics, KPI catalog (existing KPI guide v2.0), rankings, bonus rules & approval | PRF | 09–16 |
| 18 | Recommendations, acceleration scenarios, resource optimization, annual plans, budget vs actual, investment analysis, company health scorecard | INT, STR | 09–17 |

## PHASE 09R — Record-Type Builder (CHG-006, D-105)

- **Purpose:** let authorised users define new record types — fields, relations to other records, screen layout, reports — without code (D-079).
- **Position:** after the Slice 1 pilot. Module slices do not depend on it, so the first module screens are not delayed, and the builder is shaped by real use.
- **Dependencies:** Phase 03 architecture, Phase 04 storage model, Phase 06 spike (all already in scope), Phase 07 dynamic IAM, Phase 08 engine, Phase 09 pilot.
- **Rules:** normal permission model (D-092); search/report/entry-screen inclusion chosen per type (D-093); structure changes never destroy history (D-094); user-defined records never write the ledger (D-077).
- **Acceptance:** a type defined through the builder works end to end under RLS, appears where its definition says, survives a field removal with its history intact, and can be used by a flow; T1 gate.
- **Risks:** RISK-010, RISK-002.

## PHASE 19 — Production Readiness & Company-wide Rollout

- **Scope:** security review of the whole system, performance & load review, backup restore drill, runbooks, user training material, rollout plan, go-live checklist, hypercare.
- **Acceptance:** all slices DONE; restore drill passed; owner sign-off.
