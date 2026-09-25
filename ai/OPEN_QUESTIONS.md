# OPEN QUESTIONS

Last updated: 2026-09-25 · Format: `OQ-NNN` · Blocking = blocks the stated phase

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


## Multi-scope search visibility — raised 2026-09-23

| ID | Question | Recommendation | Blocks |
|---|---|---|---|
| OQ-034 | **ANSWERED 2026-09-23 by the owner: one scope is enough.** May a person authorised for site A find a record shared by sites A and B, or must they be authorised for both? The owner chose ANY: authorisation for any one of a record's places makes it visible in search. Written as D-270. Commercial and sensitive class checks stay mandatory and are untouched by it. | The narrower reading (every scope authorised) was the alternative and was not taken. | Nothing; TASK-0110 can now build multi-scope visibility. |

## Phase 08 shape — raised and answered 2026-09-24

| ID | Question | Answer | Blocks |
|---|---|---|---|
| OQ-038 | **ANSWERED 2026-09-24 by the owner: the probe module → D-279.** How is the engine accepted while the modules whose records its default flows act on (daily site log, material issue, payment approval) belong to Phases 09–11? The roadmap's Phase 08 acceptance names those three flows running through the engine | The engine's acceptance runs end to end against a throw-away record type and capability catalog inside the repository — the shape Phase 06's spikes already used and passed with. The eight real templates ship as JSON and each is activated and accepted in the slice that owns its records | Answered; shapes TASK-0117 |
| OQ-039 | **ANSWERED 2026-09-24 by the owner: the mechanism and the five existing modules → D-280.** Does the capability catalog (REQ-WFL-003/004) get written for IAM, ADM, AUD, DOC and TSK in Phase 08, or only defined as a mechanism that each slice fills in later? | Both the mechanism and the existing modules' real capabilities, so the contract test has teeth from the first day and the engine has real actions to call | Answered; shapes TASK-0118 |

## The mandatory trio, measured against the tables that exist — raised 2026-09-24

| ID | Question | Recommendation | Blocks |
|---|---|---|---|
| OQ-037 | **ANSWERED 2026-09-24 by the owner: the recommendation is taken → D-277.** `docs/database/COVERAGE.md` section 3 says every table is checked for three things — a scope column (`scope_type`/`site_id`/`project_id`/`unit`), an RLS policy, and a history channel — with `core.*`, the two audit tables and the named ledgers exempt. The schema test that enforces it was to arrive with the tables; the tables are here, so it was measured first (2026-09-24, 50 tables). The rule as written does not describe them. Of the 14 tables the layer register calls `business`, 11 have no scope column, and they are right not to: an exchange rate is company-wide, a document version and an extracted text hang off a document that carries the scope, and a notification belongs to a person, not a place. Two tables have no RLS policy on purpose — `iam.login_attempt` and `iam.recovery_code`, where the application has no privilege at all, which is stronger than a policy (D-272). Written literally, the test would fail on more than twenty tables, and "fixing" them by adding scope columns would be wrong. So: what is the rule actually meant to be? | Say it in the register's own terms, which already separate `business` (14), `config` (16) and `system` (20). **Scope column:** required on a record's **root** table — the thing a person opens, which is what carries a site or a project — and not on its children, which reach the scope through the root, nor on person-owned rows, which are scoped by their owner. That is one new column in the register (`scope_source`: `own` / `parent` / `person` / `company`), declared by the migration that creates the table, so the test checks a declaration instead of guessing from column names. **RLS:** required on every table the application role may touch at all; a table with no privilege granted is exempt and the test asserts the absence of the grant instead, which is the stronger fact. **History:** required on `business` and `config` roots; `system` is append-only or infrastructure and stays out, as the current exemption list already says. The alternative — narrowing the rule silently in the test, or adding scope columns nobody needs — is what this question exists to avoid | Owner's call; TASK-0116 waits on it |

## CI's browser-side gate — raised 2026-09-24

| ID | Question | Recommendation | Blocks |
|---|---|---|---|
| OQ-036 | **ANSWERED 2026-09-24 by the owner: they travel to Phase 09 → D-276.** Three checks the records promise for Phase 07's CI have never been built: the accessibility scan of every screen in both themes at both widths, the keyboard-path test, and the contrast test (`docs/infrastructure/CI.md` section 2, D-225, REQ-NFR-016). They were written as arriving "when the thing they test arrives", and the screens have now arrived. All three need the same thing and that is why none exists: a browser harness that signs in, which in CI means a test account and its secrets. Does this block the Phase 07 exit, or does it travel with the other acceptance items into Phase 09, where hosting and a test account are decided anyway? | Travel with Phase 09, and say so in the roadmap rather than leaving it as a promise nobody is tracking. The reasoning: the harness is worth building once, against a deployed address and a real test account, instead of twice; the accessibility and contrast work that has been done so far was measured by hand and recorded (TASK-0054, D-225), so nothing is unmeasured today, only unautomated; and the panel is used by one person on one machine until the pilot. The cost of waiting is that a token change can quietly break a contrast threshold until the harness exists — which is why the recommendation is a dated task (TASK-0115), not a silent deferral. The alternative, building it now, delays M1 and Phase 08 by the length of an E2E setup plus the credential decisions, for a gate on screens the owner is about to walk through by hand anyway | Owner's call: Phase 07 exit or Phase 09 |

## Product MCP server — raised 2026-09-23 (not blocking Phase 07)

| ID | Question | Recommendation | Blocks |
|---|---|---|---|
| OQ-035 | **ANSWERED 2026-09-23 by the owner: the KVKK question is not an obstacle and the HR module is on the MCP surface.** Written as D-271; the legal opinion of OQ-024 is still owed before real personnel data enters the panel at all (RISK-001, a Phase 19 gate). The original question follows. The owner decided that panel data may reach a cloud model through the product MCP server, inside each person's own permission (D-267, ADR-019). A cloud model sits outside Türkiye and the EU, so personnel data passing through the channel becomes a cross-border transfer under KVKK article 9. RISK-001 already asks for a legal opinion before real HR data is entered (OQ-024). Two things need an answer before the channel is built: on what basis the transfer rests (employee notice and explicit consent, a data processing agreement with the provider, or keeping HR out of the surface), and whether "the HR module is on the MCP surface" becomes an administrator setting rather than a fixed rule, so the choice stays with the owner. | Recommendation that was not taken: tie the answer to OQ-024's legal opinion and make the HR surface a setting, not a rule, so the decision could change without a code change. | Nothing; TASK-0114 can be built on this answer when its phase comes. |

## Workflow engine — raised 2026-09-25

| ID | Question | Recommendation | Blocks |
|---|---|---|---|
| OQ-040 | The step list of REQ-WFL-006 names "eskalasyon" as a step of its own, and an approval step already carries its own escalation (it moves the approval to the next person when the waiting time passes, migration 0052). What should a *standalone* escalation step do — raise the whole run to somebody above (a notification and a task for the manager, leaving the flow where it is), or something else? | Build it as "tell the person above and carry on": the step asks the owner rule for the manager, opens a task and a notification through the catalog's actions, writes the escalation in the run log, and the flow continues down `next`. Anything that moves an approval belongs to the approval step, which already does it. | TASK-0117's last step; nothing else in Phase 08 waits on it |
