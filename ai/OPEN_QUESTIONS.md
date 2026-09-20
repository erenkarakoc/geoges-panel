# OPEN QUESTIONS

Last updated: 2026-09-20 · Format: `OQ-NNN` · Blocking = blocks the stated phase

IDs are never reused. OQ-018 and OQ-019 were never assigned (numbering gap, no missing records).

## Phase 06 — search validation

| ID | Category | Question | Proposed answer | Blocks |
|---|---|---|---|---|
| OQ-029 | Architecture validation | OPEN: which first-execution cost causes the remaining 300 ms failure? D-247 model and semantics remain adopted. | Latest same-request measurement: 529 ms total / 445 ms server work; no JIT contribution. Set-based alternative slower and removed. Next capture actual backend startup versus pool reuse. Earlier 392 ms retained; replay FAIL. See `docs/architecture/spikes/SPIKE-12-search-retry.md`. No waiver. | Product search implementation and Phase 06 exit until validated resolution |

## Phase 00 — answered domain question

| ID | Category | Question | Proposed answer | Blocks |
|---|---|---|---|---|
| OQ-007 | Domain | **ANSWERED 2026-09-19:** the owner confirmed all remaining PROPOSED terms (219) in grouped rounds; the glossary holds 234 CONFIRMED terms. Rounds 1–2 (2026-09-15) gave D-027…D-034. | Continue in Phase 01 question rounds | Phase 01 exit |

## Phase 01/03 — workflow platform direction (ANSWERED 2026-09-18 → CHG-006, D-077…D-104)

| ID | Category | Question | Proposed answer | Blocks |
|---|---|---|---|---|
| OQ-028 | Architecture / business requirements | **ANSWERED 2026-09-18 in seven rounds → CHG-006, D-077…D-104.** Should the end-to-end flows (REQ-WFL-011, REQ-WFL-028) be built as ready-made coded flows, or on an infrastructure where authorised users compose their own flows from module capabilities? 21 sub-questions asked 2026-09-17 (14 on direction, 7 from the REQ-WFL-011, REQ-WFL-028 palette test): (1) three-layer split core/flow/catalog, (2) unit — 25 code modules publishing "capabilities" vs. fine-grained modules, (3) may the designer create new record types, (4) may a flow finalise a record or only draft + task, (5) who designs vs. publishes a flow, (6) what authority does a running flow have, (7) who may override a dependency lock, (8) canvas vs. step wizard, (9) REQ-WFL-011, REQ-WFL-028 flows as editable templates and how template updates propagate, (10) "why was this created" traceability, (11) when the engine is built (roadmap options a/b/c), (12) how REQ-WFL-011, REQ-WFL-028 is specified in Phase 02, (13) effect on CHG-004 tasks in REVIEW, (14) does the explicit "the designer may not do this" list go into ADR-006. From the palette test (REQ-PRJ-002 of the direction file): (19) add a record create/update node, (20) add an iterate-over-list node, (21) define the approval node's reject and send-back outputs, (22) let conditions read windowed counts, (23) external-party approval as a node or a sub-flow template, (24) write the five trigger types into ADR-006, (25) record the rule that an end-to-end flow is several short flows chained by events. Full reasoning, options and recommendations: `WORKFLOW_PLATFORM_DIRECTION.md` (repository root) | Per-question recommendations are in that file; summary — keep the three layers, keep 25 modules with a capability catalog, no record-type builder, flows never finalise ledger entries, engine **core** moves into Phase 07 while the visual designer stays in Phase 08, capability catalog becomes a Phase 01/03 deliverable | Phase 01 exit, Phase 03 start, and all product code (owner froze product code 2026-09-17 until this is answered) |

## Phase 00 — answered (2026-09-15)

| ID | Answer |
|---|---|
| OQ-001 | Roadmap approved. CHG-001 resolved: first screen after critical infrastructure (Milestone M1, Phase 07). |
| OQ-008 | Download Tailwind docs snapshot on this machine only, accepting the license for local use; never commit (D-024). |
| OQ-009 | Decline claude-mem telemetry (D-025). |
| OQ-002 | Commit + push approved. |
| OQ-003 | Supabase, COSS, Vercel React, Cloudflare (without MCP) approved. |
| OQ-004 | claude-mem local-only approved. |
| OQ-005 | Tailwind: Lombiq `tailwind-4-docs` (best available; no official skill). |
| OQ-006 | Next.js: no separate skill exists anymore; version-matched bundled docs + `AGENTS.md` pointer used when app is scaffolded. Vercel `composition-patterns` added. Skills vendored from pinned commits (no CLI). |

## Phase 01/02 — UI structure

| ID | Category | Question | Proposed answer | Blocks |
|---|---|---|---|---|
| OQ-025 | UI/UX | ANSWERED 2026-09-16 → D-051: "Projeler" above "Şantiyeler" in "Şantiye & Günlük"; "Talepler & Müşteriler" first in "Ticari". Implemented in the navigation registry. | — | — |
| OQ-027 | UI/UX | **ANSWERED 2026-09-19.** Which flow methods are adopted on top of the navigation skeleton (CHG-004, D-054…D-056): (1) queue mode for approvals — adopted (D-070); (2) persistent role-specific primary action — adopted (D-069); (3) stepped entry for the 15-section daily site log (REQ-SIT-003) plus a date strip — adopted as stepped by default with a section list on request and a day strip (D-220); (4) notification-driven navigation — carried by REQ-TSK-007 and REQ-TSK-008. | Adopt 1, 2 and 4 now; 3 with the site module design in Phase 02 | Phase 02 screen design |

## Infrastructure & operations — non-blocking until Phase 05

| ID | Question |
|---|---|
| OQ-010 | **DEFERRED 2026-09-20 → D-245:** no server for now; provider and location are decided before the Slice 1 pilot. |
| OQ-011 | **ANSWERED 2026-09-20 → D-245:** no staging environment; acceptance runs on the owner's own machine. Live and staging are separated when hosting is decided. |
| OQ-012 | **ANSWERED 2026-09-20 → D-245:** one Supabase project for now, sample data resettable; a second project is opened when real data arrives. |
| OQ-013 | Offsite backup target for database and R2 files. |
| OQ-014 | Error tracking & monitoring tool. |
| OQ-015 | Email: provider of `info@` mailbox and transactional sender; which domain (`geoges.com` vs `geogespanel.com`)? |
| OQ-016 | ANSWERED 2026-09-18 → D-132: yes — new task, approval request and critical alert go to the phone as browser push; e-mail only for the daily digest. |
| OQ-017 | Package manager and runtime: npm (installed) vs pnpm/bun; Node 24 LTS? — Provisional for M0 (2026-09-16): npm 11 + Node 24 (`engines.node >=24`), exact-pinned versions and committed lockfile; final decision in Phase 05/07. |

## Product — non-blocking until Phase 01/02

| ID | Question |
|---|---|
| OQ-020 | **ANSWERED 2026-09-20 → D-238:** direct PostgreSQL connection with a typed query builder, RLS kept through per-transaction session identity; PostgREST not used for data access. Provisional until the Phase 06 spike confirms correctness and speed. |
| OQ-021 | ANSWERED 2026-09-16 → D-048: first pilot runs on sample data; no pilot site or user group named yet. |
| OQ-022 | ANSWERED 2026-09-16 → D-049: no target date; not schedule-driven. |
| OQ-023 | ANSWERED 2026-09-15 → D-041: owner-designated delegate for an owner-defined period; all actions reported to the owner. |
| OQ-024 | ANSWERED 2026-09-16 → D-050: no legal review commissioned; RISK-001 stays open and is raised again before real HR data is entered. |
| OQ-026 | **ANSWERED 2026-09-20 → D-230:** at least 8 characters with a complexity requirement, no expiry, common passwords refused; session 30 days, 3 days of inactivity ends it; temporary lockout after repeated failures stays as REQ-IAM-005 with admin-set numbers. | — | — |
