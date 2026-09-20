# CURRENT STATE

Last updated: 2026-09-20

```text
PROJECT STATUS:      DESIGN
CURRENT PHASE:       PHASE 06 — Validation Spikes (Phase 05 DONE 2026-09-20, owner approved)
CURRENT SUBPHASE:    TESTING
CURRENT FEATURE:     —
CURRENT TASK:        TASK-0090/0091 REVIEW: latest 636 ms request includes 533 ms server work; 32 calls reused one backend through the Ireland transaction pooler. Backend age unavailable. Next use transaction-local diagnostic setup (OQ-029); eight spikes complete.
STATUS:              TESTING
BRANCH:              main — single branch, direct commits (D-109, 2026-09-18)
PARALLEL TRACK:      none — CHG-003/CHG-004 shell work and CHG-005 approved and DONE 2026-09-18 (TASK-0030, TASK-0032…TASK-0038)
CODE ALLOWED:        The owner's freeze (2026-09-17) ENDED 2026-09-18: CHG-005 and CHG-006 are both folded. Normal ADR-007 rule applies — Phase 06 writes **throwaway spike code only** (never shipped); product code resumes in Phase 07 or via an approved change request.
                     Tooling code that enforces the records (scripts/, .githooks/) is always allowed.
                     Already-shipped exceptions that remain valid: development-only sandboxes (D-052) and the CHG-004 shell transfer (TASK-0032…TASK-0037, owner approved).
                     Note: TASK-0034 and TASK-0037 also shipped module-namespaced sample screens (modules/sit/ui, modules/wfl/ui, modules/tsk/ui). They are sample data behind the shell, approved as part of CHG-004, and are re-wired when SIT and the workflow engine exist.
```

## LAST COMPLETED TASK
2026-09-20: TASK-0092: corrected schema inventory totals (212 original definitions, now 215 after D-247; platform 48). Added deterministic per-schema/total and duplicate/missing-row checks to the records gate. Six regression cases and full check with 69 tests passed. Search validation TASK-0091 remains REVIEW.

2026-09-20: SPIKE-08 (TASK-0089): custom record data pipeline, 48 checks, 50,001 records; list/filter p95 240/270 ms. Fixed read-only-user writes to helper tables and stale search content after field retirement in the throwaway setup. No product UI or source changes.

2026-09-20: SPIKE-04/05/06 (TASK-0086…TASK-0088): database-backed version pinning with fresh-process resume; dry/real parity and read-only protection; 500k-row conditions with real timeout recovery. 26 primary assertions plus 13 independent path/owner assertions passed; no product code.

2026-09-20: SPIKE-01/02/03 reports (TASK-0082…TASK-0084): restricted grants and 12 RLS assertions; parameterized list/detail/stock transactions at p95 239–240 ms; 10,000 ordered events with process-exit rollback and duplicate suppression. Resume pointers repaired and machine-checked (TASK-0085).

Phase 05 DONE (2026-09-20, owner approved): local-first operation with no staging and hosting deferred (D-245), two reset commands and portable configuration (D-246), CI gate, owner setup guide, backup and recovery plan, eleven runbooks (TASK-0073…TASK-0078).

Earlier: Phase 04 DONE (2026-09-20, owner approved): 212 original table definitions (previous total 211 corrected by TASK-0092), now 215 after D-247, in six schema documents plus conventions and the coverage check (TASK-0065…TASK-0072, D-243, D-244).

Earlier: Phase 03 DONE (2026-09-20, owner approved): module boundaries and contracts, event backbone, workflow engine architecture, permission architecture, configuration and custom fields, ports and data access, storage direction for user-defined record types, and the 16 Phase 06 spikes (TASK-0057…TASK-0064, D-230…D-242, ADR-014…018; OQ-020 and OQ-026 closed).

Earlier: Phase 02 DONE (2026-09-20, owner approved): screen inventory, list/detail/form patterns with the bottom band, the daily site log screen, the per-screen state matrix, the eight end-to-end flows as real definitions, the administration page and flow designer, WCAG 2.2 AA targets, the custom-element list, the special screens and the search UX (TASK-0042, TASK-0048…TASK-0056, D-217…D-228).

Earlier: Phase 01 DONE (2026-09-19, owner approved): 438 CONFIRMED requirements in 26 files with layers and capability catalogs; scope mapped and `docs/sources/` removed (tag `scope-archive`); glossary 266 CONFIRMED terms; permission matrix; domain model for 24 modules; architecture principles; slice order and pilot approach (D-216). KVKK data inventory deferred (D-214, DEF-007).

Earlier: Phase 00 DONE (2026-09-15): owner approved TASK-0002, 0003, 0005, 0006, 0012, 0013; stale records corrected (ADR-013 status, AI_SKILLS claude-mem/Next.js notes, GIT_WORKFLOW Phase 00 direct-to-`main` exception, OQ-018/019 numbering note). Completion report in `ai/MASTER_ROADMAP.md`.

## NEXT TASK
1. TASK-0091: capture backend startup and first execution within transaction-local diagnostic setup. Ireland transaction pooler confirmed; 32 calls reused one PID, but age was unavailable. Latest 636 ms total / 533 ms server work cannot be explained by geographic network latency alone. Preserve all failed samples; OQ-029 remains open before SPIKE-14.
2. Remaining Phase 06 experiments follow the order in `docs/architecture/spikes/README.md`. SPIKE-10 needs rendered PDF inspection; SPIKE-11 needs missing-rate/recovery assertions. Neither is waived or complete.
3. Phase 07 carries TASK-0043, TASK-0054, TASK-0028 and TASK-0076; no product code in Phase 06.
4. TASK-0018: re-check memory-worker authentication after 2026-10-15; do not stop the worker or invoke cloud-sync.

## BLOCKED BY
No owner input is currently needed. The search model and word semantics were adopted with the owner’s continuation (D-247). Product search and Phase 06 exit remain gated by first-request performance: 392, 529 and 636 ms versus 300 ms (OQ-029). Further disposable diagnosis is authorized; no target waiver or product code.

## OPEN QUESTIONS
See `ai/OPEN_QUESTIONS.md`. OQ-029 tracks remaining first-request validation after D-247 adoption. OQ-020 (data access) and OQ-026 (password policy) are answered; OQ-013…015 and OQ-017 remain infrastructure/runtime follow-ups. Hosting is deferred under DEF-008; KVKK inventory under DEF-007.

## RECENT DECISIONS
- D-247 / CHG-007 (2026-09-20): scoped search helpers and all-words matching adopted; three tables added to the design, 215 total. No speed waiver.
- 2026-09-20: Phases 01–05 are owner-approved DONE; Phase 06 is current. Local-first operation D-245 and separate reset/configuration tools D-246 remain in force.
- 2026-09-19: glossary confirmed by the owner — 234 terms CONFIRMED, OQ-007 closed
- D-213 (2026-09-19, TASK-0039): every scope § citation replaced by REQ ids; section map in `docs/requirements/README.md`; scope at Git tag `scope-archive`; validator rejects an unnamed §
- D-209…D-212 (2026-09-19, NFR round): RPO ≤ 1 h, RTO ≤ 4 h, Turkish-only interface, sizing for 50–150 users
- D-206…D-208 (2026-09-19, RPT REQ-RPT-015 round): daily site report produced on approval, sent to the client by a person; ready-made reports with filters and saved views; scheduled reports to internal users only, as a workflow
- D-202…D-205 (2026-09-19, STR round): budget per month × cost center × expense type; nominal TL with an inflation-adjusted view; simple and discounted payback; health scorecard as colours per area with no overall score
- D-199…D-201 (2026-09-19, MTG/DOC/SUP round): meeting visibility by role scope; minutes final when saved; archive search includes contents and text recognition of scans (outside-service question deferred to Phase 03)
- D-195…D-198 (2026-09-19, INT round): rule-based recommendations only, no AI model and no data leaving the panel; scenario limits mark a scenario "not recommended"; an approved scenario flows into targets, tasks and bonus rules; a dismissed recommendation is closed with a reason
- D-187…D-194 (2026-09-19, PRF round): KPI catalog defined from scratch (changes REQ-PRF-002, REQ-PRF-008…011, REQ-PRF-013); bonus paid outside payroll but always in the accounting export; score and bonus monthly; manual KPIs by the direct manager; no objection process; coordinator never scored on profit (changes REQ-PRF-001, REQ-PRF-006); critical score opens a development meeting; bonus on base salary
- D-182…D-185 (2026-09-19, QHS round): failed lot only warns; no health data for OHS incidents (REQ-HR consequence open); PPE issued by count with the person's confirmation; D-186: HR keeps only the existence and dates of medical reports; serious accident or open critical OHS finding voids the period's speed/bonus target, near misses never count against anyone
- D-181 (2026-09-18, layer scan): every requirement tagged Sabit / Akış / Tanım with the configurable part named; enforced by the validator
- D-177…D-180 (2026-09-18, CMP round): client, subcontractor and supplier contracts; extension of time as request → decision → new date; notice-letter draft on client delay; guarantee commission charged to the project
- D-173…D-176 (2026-09-18, QTE round): no general-expense share in quote estimates (changes REQ-QTE-005…006); estimated cost proposed from actual cost; sales orders reserve stock; each shipment invoiced separately
- D-169…D-172 (2026-09-18, CRM round): e-mail and WhatsApp requests entered by hand; client scorecard from records plus reasoned notes; a won request opens a pre-filled draft project
- D-163…D-168 (2026-09-18, HR round): the panel calculates payroll itself (RISK-011); salary cost to the registered unit; salary advance deducted from payroll; leave entitlement entered by HR; official filings stay with the accountant; bank bulk payment file
- D-155…D-162 (2026-09-18, EQP round): depreciation to a site only on working days; idle days to a company-wide idle equipment expense; write-off to the site where the asset was; low-value items by count; no service-vehicle savings; custody record confirmed by both parties on the phone; any asset can be rented; working day marked in the daily site log
- D-147…D-154 (2026-09-18, FIN round): unapproved quantity carries over; subcontractor paid on our approved production; no overhead allocation to projects (changes REQ-FIN-013, REQ-FIN-017 wording); client advance deducted from progress payments; collection date from the contract term; first expense entry wins; monthly accounting export; period close per site
- D-142…D-146 (2026-09-18, Slice 2 rounds): landed cost for strips; weighted average per location; over-delivery tolerance; factory overhead by labour hours; factory log approval mandatory
- D-139…D-141 (2026-09-18, ADM round): new list items usable at once, merged later; CBRT buying rate of the previous business day; past effective dates reach only unapproved transactions
- D-136…D-138 (2026-09-18, PRJ round): targets change only through an approved project revision; daily targets calculated and correctable; a site belongs to one project
- D-130…D-135 (2026-09-18, TSK and AUD rounds): manual tasks to anyone in scope; closing mode chosen per task; panel + phone push, e-mail only for the digest (OQ-016); personal digests plus a company digest for owners; nothing ever deleted or anonymised (KVKK risk, RISK-001); audit log screen for owners only
- D-126…D-129 (2026-09-18, RPT round): attention items close only when resolved; indicators per role, adjustable per person; the system view for owners and GM; loss diagnosis always shown, on top when in loss
- D-119…D-125 (2026-09-18, SIT round): several people fill a log section by section; recall before decision; over-casting needs an explanation; late entry allowed and marked; consumption editable with the difference flagged; client handover rests on our own record; subcontractor workers recorded by name (KVKK note)
- D-111…D-118 (2026-09-18, IAM round): role assignments carry a scope; role hierarchy with per-person override; several roles combine and the acting role is recorded; several owners possible, any one completes an owner approval; commercial/sensitive visibility per module; delegation by the person or the manager; access closes by itself on the leaving date
- D-110 (2026-09-18): full check before every commit, automatic push after every commit on `main`
- D-109 (2026-09-18): single branch — all work committed directly to `main`, no feature branches or PRs; `main` stays green on every commit
- D-106…D-108 (2026-09-18, TASK-0040): sample data removed from approvals, tasks, notifications and badges; reason required on reject and send-back; no "İş Akışları" menu entry until its own UX round
- D-105 (2026-09-18): record-type builder built after the Slice 1 pilot (roadmap step 09R); CHG-006 approved and folded, product-code freeze ended
- D-077…D-104 (2026-09-18, CHG-006, OQ-028): calculations fixed, processes configurable; 25 controlled module boundaries with contract tests; free record-type builder; flows never write the ledger; flows run with system authority, flow design only for full-visibility roles; three-outcome approvals; free windowed conditions; steps addressed by permission type/role/relationship/person; no temporary permission, designer defines and assigns roles; triggers event/calendar/threshold (e-mail deferred, DEF-006); end-to-end = chained short flows; phase order unchanged
- D-072…D-076 (2026-09-17, CHG-005): roadmap is the single authority and is updated in the same session a CHG is approved; phase status vocabulary gains `PARTIALLY_DONE`; Milestone M1 redefined as the staging review; TASK-0027 (`docs/sources/` deletion) blocked until § references are remapped — both done and the folder removed 2026-09-19; record consistency is machine-checked (`npm run records`) and session continuity is hook-written, not model-remembered
- D-070 (2026-09-17): approvals run as a queue and tasks list late/today/next with sample content; navigation sandbox deleted
- D-069 (2026-09-17, CHG-004 step 5): phone navigation — bottom bar with the work layer and the primary action, modules in a searchable drawer
- D-065…D-068 (2026-09-17, CHG-004 step 4): "Bugün" screen, charts as an approved custom element, only the number is mono, rail refinements
- D-064 (2026-09-17, CHG-004 step 3): context row from the `@context` slot, sample site detail, one address per section, day strip + calendar in `?gun=`
- D-057…D-063 (2026-09-16/17, CHG-004 transfer): rail, sample badges, dev role switcher, header zones, sample notifications
- D-054…D-056 (2026-09-16, CHG-004): icon rail with a work layer, header as a three-zone toolbar with a conditional context row, "Bugün" as every role's entry screen
- D-048…D-051 (2026-09-16): pilot on sample data, no target date, no KVKK legal review (RISK-001 open), Projects and CRM added to the menu
- Owner rule (2026-09-16): a primary logo is never used in dark mode (`docs/ui-ux/DESIGN_SYSTEM_RULES.md` §4)
- D-046, D-047 (2026-09-16): devl.dev auth design adopted as the actual design and rebuilt with COSS; `ParticleField` approved as the first custom element
- ADR-001…ADR-013 (2026-09-15)
- D-019…D-025: skill vendoring, skill set, Next.js guidance, plugin settings, roadmap approval with Milestone M1, Tailwind docs local-only, claude-mem telemetry off

## DEFERRED ITEMS
DEF-001 Data import · DEF-002 Offline entry · DEF-003 Native mobile app · DEF-004 Self-hosted Supabase migration · DEF-005 Cloud Run workers · DEF-006 E-mail workflow triggers

## KNOWN ISSUES
- claude-mem summarization depends on the Claude Code CLI login in `~/.claude/.credentials.json` (refresh token valid until 2026-10-15). If it lapses, observations silently stop with `OAuth session expired`; fix = owner re-login via CLI. On Windows the worker reads Windows Credential Manager first (absent, expected WARN), then falls back to the `CLAUDE_CODE_OAUTH_TOKEN` environment variable (v13.11.0 source). Safeguard tracked in TASK-0018.
- Do not force-stop the claude-mem worker: its uvx/chroma-mcp children inherit and hold port 37777, blocking respawn. Prefer fully restarting the Claude app or Windows.
- `Desktop\test\app` (out of scope) still pins claude-mem v12.3.6; running it against the shared DB reproduces `no such column: failed_at_epoch` errors.
- claude-mem v13.11.0 ships a `cloud-sync` skill; it must never be invoked (ADR-013).
- The owner also uses Codex. `.agents/skills/` (Codex mirror of `.claude/skills/`) and `.codex/` are git-ignored local state. Keep skills and instructions single-sourced (`ai/AI_SKILLS.md` policy); stage explicit paths when committing.
- claude-mem v13.11.0 cache is locally patched (`windowsHide` on git calls, TASK-0019) to stop console window flashes. A plugin update overwrites the patch; re-check for flashes after any update and re-apply or drop the patch if upstream fixed it.
- `~/.claude-mem/telemetry.json` has an empty `decidedAt`; telemetry stays off via settings, but the plugin may prompt again.

## ACTIVE RISKS

| ID | Risk | Impact | Mitigation | Owner |
|---|---|---|---|---|
| RISK-001 | KVKK: sensitive employee data in Supabase Cloud EU region; no field-level encryption chosen; **no personal data is ever deleted or anonymised (D-134), so erasure requests cannot be met**; subcontractor workers' names kept (D-125) | High (legal/financial) | EU region; strict RLS & data classification; minimize sensitive fields; legal review before real HR data | Owner |
| RISK-002 | Very large first-release scope — **grew 2026-09-18** with the free record-type builder (D-079) | High (schedule) | Design-first with traceability; vertical slices with pilots; re-evaluate after Phase 01 sizing; builder placement decided at CHG-006 approval | Owner + AI |
| RISK-003 | Process overhead vs. single non-developer owner | Medium | Risk-tiered gates (ADR-008); batched question rounds | AI |
| RISK-004 | Third-party skill / plugin supply chain | Medium | Vendored at audited commits; no installer CLI; claude-mem cloud sync forbidden | AI |
| RISK-005 | Visual workflow designer complexity | Medium | Fixed node palette, engine-first, validation spike | AI |
| RISK-006 | Provider lock-in to Supabase Cloud | Medium | Portability rules (ADR-002) | AI |
| RISK-007 | claude-mem stores prompts/observations locally, shared across projects | Low–Medium | Local-only, telemetry off, no real personal data in sessions, `<private>` tags | AI |
| RISK-010 | Free record-type builder (D-079): user-defined fields, relations, screens and reports need a storage model, RLS, search, reporting and a migration path for structures users change at will | High (scope, performance, data integrity) | Phase 03 architecture + Phase 04 storage decision + Phase 06 end-to-end spike before any build; D-092 (normal permission model), D-094 (history never destroyed) | AI |
| RISK-011 | In-house payroll engine (D-163): Turkish tax, SGK and minimum-wage rules change often; a wrong net salary is a legal and trust problem | High | Dated payroll parameters; every calculation shown step by step; automated tests against sample payrolls from the accountant; monthly reconciliation with the accountant's figures (D-167) | Owner + AI |
| RISK-009 | Records drift out of agreement with each other and with reality (9 contradictions found 2026-09-17: stale roadmap, dead milestone, mis-filed tasks, wrong "last updated" stamps, references to a file scheduled for deletion) | High (the plan stops being trustworthy, and an AI session bootstraps from a false picture) | `npm run records` in `npm run check` and in the pre-commit gate; CHG→roadmap rule in PROJECT_RULES §9; hook-written session journal | AI |
| RISK-008 | Tailwind docs license (source-available, educational) for local AI use | Low | Owner-accepted local use only; never committed or redistributed (D-024) | Owner |
