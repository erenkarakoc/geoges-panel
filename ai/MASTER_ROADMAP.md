# MASTER ROADMAP

Status: APPROVED by owner (2026-09-15, incl. CHG-001 resolution) · Last updated: 2026-09-15

Strategy (ADR-007): **design everything first → validate risky assumptions with spikes → build foundation → deliver vertical module slices, each piloted.**
Security, tests, accessibility and documentation are part of every phase's Definition of Done; there is no separate "add security later" phase.

Module codes: see `docs/architecture/MODULE_MAP.md`.

## Overview

| Phase | Name | Stage | Status |
|---|---|---|---|
| 00 | Project Bootstrap & AI Infrastructure | Setup | QUESTIONS_PENDING |
| 01 | Requirements & Domain Analysis | Design | NOT_STARTED |
| 02 | UX, Information Architecture & User Flows | Design | NOT_STARTED |
| 03 | System Architecture | Design | NOT_STARTED |
| 04 | Database Architecture | Design | NOT_STARTED |
| 05 | Infrastructure, Environments & Operations Design | Design | NOT_STARTED |
| 06 | Validation Spikes | Validate | NOT_STARTED |
| 07 | Foundation Build | Build | NOT_STARTED |
| 08 | Workflow Engine & Visual Designer | Build | NOT_STARTED |
| 09 | Slice 1 — Projects, Sites, Daily Log, Approvals, Cockpit | Build + Pilot | NOT_STARTED |
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
- **Status:** REVIEW (all exit criteria met; owner review of REVIEW tasks pending)

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

Remaining Issues:
- Owner review pending: TASK-0002, TASK-0003, TASK-0005, TASK-0006, TASK-0012, TASK-0013 (status REVIEW)
- TASK-0014 glossary terms confirmed in Phase 01 (OQ-007)
- TASK-0018 claude-mem login expiry safeguard awaiting owner choice (login valid until 2026-10-15)
STATUS: NOT COMPLETE (exit criteria met; becomes DONE after owner review of REVIEW tasks)
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

## PHASE 02 — UX, Information Architecture & User Flows

- **Purpose:** design how every role works with the system before building it.
- **Scope:** navigation/IA, role home screens, end-to-end flows (§45 of scope), screen inventory, per-screen state matrix (initial, loading, empty, partial, error, permission denied, retry, destructive confirmation), COSS component mapping, list/detail/form standards, daily site log table UX, cockpit, notification and approval center UX, responsive behavior (desktop/tablet/mobile), accessibility targets (WCAG 2.2 AA), brand tokens.
- **Dependencies:** Phase 01.
- **Deliverables:** `docs/ui-ux/*` flows and screen specs; list of required custom elements with owner approval.
- **Acceptance:** every REQ with UI has a screen spec; every screen lists states and COSS components; owner approved key flows.

## PHASE 03 — System Architecture

- **Purpose:** define module boundaries, contracts and cross-cutting mechanisms.
- **Scope:** module public APIs; event backbone (outbox, dispatch, idempotency, retries); workflow engine architecture (ADR-006); rules/configuration model with effective dating; custom fields; feature flags; ports & adapters (auth, storage, jobs, notifications, exchange rate, weather, email, PDF); authentication & authorization design (multi-role, delegation, acting role, owner layer, visibility of commercial/sensitive data, immediate session revocation, 2FA); background jobs; search; notifications (in-app, web push); PDF/Excel generation; observability; architecture fitness tests; data access approach (supabase-js vs direct Postgres client — OQ-020).
- **Dependencies:** Phase 01, Phase 02 (in parallel with late Phase 02 allowed).
- **Deliverables:** ADRs, `docs/architecture/*`, feature specs skeletons per module.
- **Acceptance:** all cross-cutting concerns have an ADR; each module has a boundary spec; spike list for Phase 06 defined.

## PHASE 04 — Database Architecture

- **Purpose:** design the full domain schema before implementation.
- **Scope:** entities for all modules (purpose, ownership, relationships, constraints, indexes, permissions, RLS, audit, history, soft delete, retention); ledgers; effective-dated configuration tables; outbox; audit tables; RLS policy model; migration strategy (expand/contract, additive-first); seed/reference data; sensitive data columns.
- **Dependencies:** Phase 03.
- **Deliverables:** `docs/database/*` (ERD per module, table specs, RLS matrix, migration conventions).
- **Acceptance:** every REQ with data maps to tables; RLS defined for every table; naming review passed.

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

## PHASE 07 — Foundation Build

- **Scope:** repository scaffold (Next.js, TypeScript, COSS, Tailwind, lint/format/boundary rules, test setup), CI pipeline, environments, design tokens and app shell, IAM (auth, 2FA, roles, delegation, visibility), audit & history, revision request mechanism core, documents/storage, outbox & jobs, notifications & tasks core, catalogs & custom fields, currency & calendar, deployment to staging.
- **Dependencies:** Phase 06.
- **Milestone M1 — first visible screen (CHG-001):** once the critical foundation (IAM with real authentication, audit, design tokens, app shell) passes its gates, the owner reviews the authentication pages and the application shell (left navigation, top bar, light/dark mode, empty module pages) on staging.
- **Acceptance:** foundation features pass T1 gates; staging deploy with rollback proven; M1 review done with owner feedback recorded.

## PHASE 08 — Workflow Engine & Visual Designer

- **Scope:** workflow definitions (fixed node palette), versioning, execution engine, test-run, publish permissions, approval center integration, visual designer UI.
- **Dependencies:** Phase 07.
- **Acceptance:** default company flows (daily log approval, material issue, payment approval) defined and executed through the engine; T1 gate.

## PHASES 09–18 — Module Slices

Each slice follows the same pattern:
1. Feature decision summary per feature (question round if gaps remain from Phase 01–04).
2. Implementation plans for T1/T2 tasks.
3. Build → test → self-review → documentation.
4. Staging acceptance by owner.
5. Pilot with real users; feedback recorded as change requests.

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

## PHASE 19 — Production Readiness & Company-wide Rollout

- **Scope:** security review of the whole system, performance & load review, backup restore drill, runbooks, user training material, rollout plan, go-live checklist, hypercare.
- **Acceptance:** all slices DONE; restore drill passed; owner sign-off.
