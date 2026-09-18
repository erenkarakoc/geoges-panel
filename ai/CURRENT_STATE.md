# CURRENT STATE

Last updated: 2026-09-18

```text
PROJECT STATUS:      BOOTSTRAP
CURRENT PHASE:       PHASE 01 — Requirements & Domain Analysis
CURRENT SUBPHASE:    DISCOVER / QUESTION
CURRENT FEATURE:     —
CURRENT TASK:        Phase 01 requirement work — TSK and AUD rounds, with their capability catalogs (TASK-0041)
STATUS:              QUESTIONS_PENDING
BRANCH:              main — single branch, direct commits (D-109, 2026-09-18)
PARALLEL TRACK:      none — CHG-003/CHG-004 shell work and CHG-005 approved and DONE 2026-09-18 (TASK-0030, TASK-0032…TASK-0038)
CODE ALLOWED:        The owner's freeze (2026-09-17) ENDED 2026-09-18: CHG-005 and CHG-006 are both folded. Normal ADR-007 rule applies again — Phase 01 is a design phase; product code resumes in Phase 07 or via an approved change request.
                     Tooling code that enforces the records (scripts/, .githooks/) is always allowed.
                     Already-shipped exceptions that remain valid: development-only sandboxes (D-052) and the CHG-004 shell transfer (TASK-0032…TASK-0037, owner approved).
                     Note: TASK-0034 and TASK-0037 also shipped module-namespaced sample screens (modules/sit/ui, modules/wfl/ui, modules/tsk/ui). They are sample data behind the shell, approved as part of CHG-004, and are re-wired when SIT and the workflow engine exist.
```

## LAST COMPLETED TASK
Phase 00 DONE (2026-09-15): owner approved TASK-0002, 0003, 0005, 0006, 0012, 0013; stale records corrected (ADR-013 status, AI_SKILLS claude-mem/Next.js notes, GIT_WORKFLOW Phase 00 direct-to-`main` exception, OQ-018/019 numbering note). Completion report in `ai/MASTER_ROADMAP.md`.

## NEXT TASK
1. Phase 01 continues module by module, each with its question round and capability catalog (TASK-0041): TSK and AUD now, then PRJ and ADM, then the rest; RPT §34 gets its own round.
2. OQ-027 items 3 and 4 (flow methods) still open (Phase 02).
3. TASK-0043: rename `dashboard`/`widget` in code to match the glossary.
4. TASK-0018: re-check after 2026-10-15 that the worker keeps storing observations via the `CLAUDE_CODE_OAUTH_TOKEN` fallback.

## BLOCKED BY
None.

## OPEN QUESTIONS
See `ai/OPEN_QUESTIONS.md`. OQ-028 (workflow platform direction) **answered and folded 2026-09-18** → CHG-006, D-077…D-105. Also open: OQ-007 (glossary), OQ-027 items 3–4 (flow methods), OQ-010…OQ-017, OQ-020, OQ-026 (later phases).

## RECENT DECISIONS
- D-181 (2026-09-18, layer scan): every requirement tagged Sabit / Akış / Tanım with the configurable part named; enforced by the validator
- D-177…D-180 (2026-09-18, CMP round): client, subcontractor and supplier contracts; extension of time as request → decision → new date; notice-letter draft on client delay; guarantee commission charged to the project
- D-173…D-176 (2026-09-18, QTE round): no general-expense share in quote estimates (changes §6.3); estimated cost proposed from actual cost; sales orders reserve stock; each shipment invoiced separately
- D-169…D-172 (2026-09-18, CRM round): e-mail and WhatsApp requests entered by hand; client scorecard from records plus reasoned notes; a won request opens a pre-filled draft project
- D-163…D-168 (2026-09-18, HR round): the panel calculates payroll itself (RISK-011); salary cost to the registered unit; salary advance deducted from payroll; leave entitlement entered by HR; official filings stay with the accountant; bank bulk payment file
- D-155…D-162 (2026-09-18, EQP round): depreciation to a site only on working days; idle days to a company-wide idle equipment expense; write-off to the site where the asset was; low-value items by count; no service-vehicle savings; custody record confirmed by both parties on the phone; any asset can be rented; working day marked in the daily site log
- D-147…D-154 (2026-09-18, FIN round): unapproved quantity carries over; subcontractor paid on our approved production; no overhead allocation to projects (changes §15.1/§22.4 wording); client advance deducted from progress payments; collection date from the contract term; first expense entry wins; monthly accounting export; period close per site
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
- D-072…D-076 (2026-09-17, CHG-005): roadmap is the single authority and is updated in the same session a CHG is approved; phase status vocabulary gains `PARTIALLY_DONE`; Milestone M1 redefined as the staging review; TASK-0027 (`docs/sources/` deletion) blocked until § references are remapped; record consistency is machine-checked (`npm run records`) and session continuity is hook-written, not model-remembered
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
