# OPEN QUESTIONS

Last updated: 2026-09-23 · Format: `OQ-NNN` · Blocking = blocks the stated phase

IDs are never reused. OQ-018 and OQ-019 were never assigned (numbering gap, no missing records).

## Phase 06 — search validation

| ID | Category | Question | Proposed answer | Blocks |
|---|---|---|---|---|
| OQ-029 | Architecture validation | **ANSWERED 2026-09-21 → D-248 / CHG-008.** How should the 300 ms first-request target be met when the cost is outside the query? The owner chose a cold-start exception: the first search after instance idle is exempt, warm searches stay under 300 ms. | Cold triage after ~10 h idle: no penalty on connection or pure CPU, ~9x on the first touch of cached-looking data pages (scan 517 vs 58 ms, search 383 vs 40 ms). Query design cannot fix it. All seven cold observations (392, 462, 529, 540, 554, 571, 636 ms) are kept as excepted; warm maximum 190 ms. Re-measure on the chosen compute at the hosting decision (DEF-008). See `docs/architecture/spikes/SPIKE-12-search-retry.md`. | — |

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
| OQ-017 | **ANSWERED 2026-09-21 → D-253:** npm 11 and Node 24 LTS, exact-pinned versions and a committed lockfile — the provisional M0 choice, kept. |

## Product — non-blocking until Phase 01/02

| ID | Question |
|---|---|
| OQ-020 | **ANSWERED 2026-09-20 → D-238:** direct PostgreSQL connection with a typed query builder, RLS kept through per-transaction session identity; PostgREST not used for data access. Provisional until the Phase 06 spike confirms correctness and speed. |
| OQ-021 | ANSWERED 2026-09-16 → D-048: first pilot runs on sample data; no pilot site or user group named yet. |
| OQ-022 | ANSWERED 2026-09-16 → D-049: no target date; not schedule-driven. |
| OQ-023 | ANSWERED 2026-09-15 → D-041: owner-designated delegate for an owner-defined period; all actions reported to the owner. |
| OQ-024 | ANSWERED 2026-09-16 → D-050: no legal review commissioned; RISK-001 stays open and is raised again before real HR data is entered. |
| OQ-026 | **ANSWERED 2026-09-20 → D-230:** at least 8 characters with a complexity requirement, no expiry, common passwords refused; session 30 days, 3 days of inactivity ends it; temporary lockout after repeated failures stays as REQ-IAM-005 with admin-set numbers. | — | — |

## Customer scope confirmations — raised 2026-09-22 (not blocking Phase 07)

The customer described what they expect from the panel: "everything is data — every step in the
company, every person by day and by hour is a cost, all of it tied to revenue, with profit and
loss, delay and collection tables in front of me; materials tracked properly, with their
galvanising differences and waste rates". Most of that is already confirmed scope (REQ-SIT-003,
REQ-SIT-024…027, REQ-HR-004…009, REQ-FAC-008/009, REQ-INV-003/004/012, REQ-FIN-013…017/021/022,
REQ-RPT-013/015/016). Below are three points where the customer's wording could be read as more
than the agreed scope.

**ANSWERED 2026-09-22 by the owner: the scope does not change.** The customer is not a software
person and may phrase things in a way that sounds like a wider promise; the decisions below stand
as they are, and none of the three is reopened. They are kept here as the words to use when
talking to the customer, not as pending questions.

| ID | Point raised | The answer that stands | Where |
|---|---|---|---|
| OQ-030 | Should general expenses (office rent, head office) be shared out onto projects, since "everything ties back to revenue"? | No. D-149 keeps project profit to direct costs and shows general expenses company-wide only; D-173 does the same for quotes. Owner confirmed again 2026-09-22. | Phase 11 (FIN slice) |
| OQ-031 | Should an own employee's wage follow the site they actually worked at that day, instead of the unit they are registered to? | No. D-164 / REQ-HR-009 writes the wage to the registered unit's cost centre, split by days only when the unit itself changes mid-month. Owner confirmed again 2026-09-22. | Phase 12 (HR slice) |
| OQ-032 | Is an hourly cost rate per activity expected (cost per casting or installation hour)? | No. Hours are recorded to the minute (REQ-SIT-024, REQ-SIT-027) and used for output per hour; cost comes from monthly payroll on the cost centre. Owner confirmed again 2026-09-22. | Phase 12 (HR slice), Phase 15 (performance) |

## Search — raised 2026-09-23 (not blocking Phase 07)

| ID | Question | Recommendation | Blocks |
|---|---|---|---|
| OQ-033 | **ANSWERED 2026-09-23 by the owner: build it now.** D-247 adopted three derived search structures. Two are built and answer correctly (word postings and the vocabulary). The third, `core.search_word_bucket` (each word's sorted internal record ids, partitioned by scope and data class), is a **speed** structure: it narrows the candidate set before the rows are read. Should it be built now, or when the first slice brings real records? Owner's answer: build the bucket now, with the rest of TASK-0110. Recommendation that was not taken: build it with the first slice (Phase 09), not now. With zero records nothing can be measured, and a bucket has to be invalidated or rebuilt on every write, so building it blind risks a structure that is either stale or expensive. SPIKE-12 measured it at 500,000 rows; that is the moment to bring it back and measure again. The plan and the task row both say it is owed. | Nothing today; the search answers correctly without it |

