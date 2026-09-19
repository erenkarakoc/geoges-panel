# PROJECT RULES

Status: ACTIVE · Owner: project owner · Last updated: 2026-09-20

These rules are a working protocol, not advice. Source: the original engineering protocol (`AI_Destekli_Proje_Gelistirme_Ana_Promptu.md`, later `docs/sources/ai-development-protocol.md`, removed 2026-09-19; Git tag `scope-archive`), revised by the Phase 00 decision round (see `ai/DECISIONS.md`). Where this file and the original prompt differ, this file wins.

---

## 1. Scope protection

- Everything agreed in the original functional scope and architecture principles (removed from the repository 2026-09-19, Git tag `scope-archive`) and in recorded decisions is in scope. After these sources are removed (TASK-0027), the REQ records, ADRs and `docs/` are the scope of record.
- No agreed feature may be silently removed, simplified, changed, deferred or substituted.
- Deferral is allowed only as a recorded `DEFERRED` item (`ai/DEFERRED.md`) with reason, revisit phase and dependencies.
- "Let's do it this way for now / we'll fix it later" is not allowed without a `DEFERRED` or `OPEN_QUESTIONS` record.

## 2. Work breakdown and lifecycle

Breakdown: `Project → Phase → Subphase → Feature → Task → Implementation → Verification`

Lifecycle of every phase/feature:
`DISCOVER → QUESTION → DECIDE → DESIGN → PLAN → IMPLEMENT → TEST → REVIEW → DOCUMENT → VERIFY → DONE`

A step is not skipped. A phase does not start before its entry criteria pass and does not finish before its exit criteria pass (`ai/MASTER_ROADMAP.md`).

**Delivery strategy (ADR-007):** all modules are designed before product code is written. Risky assumptions are validated with throwaway spikes (spike code is never merged as product code). Implementation then proceeds as vertical module slices, each piloted with real users.

## 3. Mandatory question round

Before any significant phase or feature, the AI identifies missing decisions across these categories and asks them grouped by category:

business requirements · user roles · user scenarios · user flows · UI/UX · data model · permissions · authentication · authorization · security · edge cases · error handling · integrations · performance · scalability · logging · audit · monitoring · data lifecycle · backup/recovery · migration · testing · accessibility · KVKK / sensitive data

After answers: write a `PHASE DECISION SUMMARY` or `FEATURE DECISION SUMMARY` into the relevant doc and `ai/DECISIONS.md`. No implementation while a critical decision is open.

## 4. Task statuses

`NOT_STARTED · DISCOVERY · QUESTIONS_PENDING · DESIGNING · READY_FOR_IMPLEMENTATION · IMPLEMENTING · TESTING · REVIEW · BLOCKED · DEFERRED · DONE`

Statuses must reflect reality. `DONE` requires the quality gate.

## 5. Quality gates (ADR-008)

Quality effort is tiered by risk. Full definitions: `docs/standards/QUALITY_GATES.md`.

| Tier | Applies to | Gate |
|---|---|---|
| **T1 — Critical** | authentication, authorization/RLS, audit, data model & migrations, financial calculations, stock/ledger logic, workflow engine, sensitive personal data, infrastructure & deploy | Full Definition of Done + explicit self-review step + tests + owner approval of business rules |
| **T2 — Standard** | normal feature screens and business logic | Full Definition of Done + self-review checklist |
| **T3 — Light** | copy, styling, non-behavioral UI tweaks, docs | Light checklist |

The tier of each task is stated in `ai/TASKS.md`. When in doubt, use the higher tier.

**Review (ADR-008):** no separate reviewer agent is required. The implementing model performs a distinct, documented review step after implementation using the review checklist, before marking a task `REVIEW → DONE`. Automated tests remain mandatory for T1/T2.

## 6. Invariant AI rules

1. No silent assumptions on critical topics.
2. Ambiguous requirements become questions.
3. Understand the existing architecture before creating new architecture.
4. Business logic lives in exactly one place.
5. Reuse existing abstractions.
6. Analyze the impact of every change on other areas.
7. Short-term hacks are never the default solution.
8. Untested systems are not assumed to work.
9. Critical decisions are never left only in chat.
10. Important decisions are recorded in the repository.
11. Unfinished work is never marked `DONE`.
12. Major architectural changes require an impact analysis first.
13. Conflicts with existing decisions are stated explicitly.
14. No unused or unnecessary abstractions.
15. No over-engineering.
16. Consider known near-future needs.
17. Do not add complexity for hypothetical needs.
18. Say "not verified" instead of "probably fine". Verification is checklist-based.

## 7. Flexibility principle (ADR-005)

Flexibility is placed where change is known to happen, and everything else is kept simple and safe to change:
- business rules, approval chains, thresholds → versioned data, effective-dated
- roles, delegation, visibility → dynamic IAM
- business types (work items, material types, product groups, templates) → catalogs, not enums
- extra fields → typed custom fields; new record types → the record-type builder (D-079), bound by the normal permission model (D-092) and never touching ledger logic (D-077)
- process connections between modules → user-composed workflows on published module capabilities, verified by contract tests (ADR-006, D-078)
- providers (DB host, storage, jobs, notifications, exchange rates, weather) → ports & adapters
- cross-module reactions → domain events via transactional outbox
- stock, money, equipment movements → immutable ledgers; balances and reports are derived

Hard-coded enums are used only for system states. Every architectural decision is reversible through a superseding ADR.

## 8. Architecture rules

- Modular monolith with enforced boundaries (ADR-001). A module may not read or write another module's tables directly; it uses the other module's public application API or subscribes to its events. Boundaries are enforced by lint/architecture tests, not by convention.
- Layering inside a module: `ui → application → domain → data access → infrastructure`. Business logic never lives in React components, route handlers or database triggers without an ADR.
- Provider-specific code (Supabase, R2, Cloud Run, exchange-rate APIs) lives only in infrastructure adapters.
- Use the framework version actually installed. For Next.js, read the version-matched docs in `node_modules/next/dist/docs/` before writing framework code.

## 9. Change management

A change request is never implemented directly. First record in `ai/DECISIONS.md` (or a `CHG-NNN` section) an analysis of: requested change · reason · affected requirements · features · tasks · database · APIs · UI · permissions · tests · migration requirement · backward compatibility · risks · recommended approach. Implement only after approval.

**Roadmap rule (D-072, CHG-005):** `ai/MASTER_ROADMAP.md` is the single authority for the plan. An approved change request is written into its change register **in the same session it is approved**, together with the phases it moves. A change request that is not in the roadmap may not be implemented. This is checked by `npm run records`, which fails when a `CHG-NNN` exists in `ai/DECISIONS.md` but not in `ai/MASTER_ROADMAP.md`.

**Phase status vocabulary (D-073):** `NOT_STARTED · DISCOVER · QUESTIONS_PENDING · DESIGNING · PARTIALLY_DONE · IN_PROGRESS · DONE`. When a change request delivers part of a later phase early, that phase becomes `PARTIALLY_DONE` and its section lists item by item what was delivered and what it still owes. Early work is never parked in a parallel milestone track, because a second plan is exactly the failure this rule exists to prevent.

## 10. Implementation plan (T1/T2 tasks)

Before coding: Task · Goal · Dependencies · Affected files · Database changes · Backend changes · Frontend changes · Security · Tests · Migration · Rollback strategy · Acceptance criteria.

## 11. Dependencies

Tasks declare `depends_on`. A task does not start before its mandatory dependencies are `DONE`.

## 12. Traceability

`Requirement → Feature → Task → Database → Backend → Frontend → Tests → Deployment` must be traceable through IDs (`docs/standards/ID_STANDARDS.md`).

## 13. Session continuity

- Start: follow the bootstrap order in `AGENTS.md`, then read `ai/SESSION_HANDOFF.md` and the tail of `ai/SESSION_JOURNAL.md` (see §21).
- End: update `ai/CURRENT_STATE.md`, `ai/TASKS.md`, `ai/CHANGELOG.md` and overwrite `ai/SESSION_HANDOFF.md`.
- **A session that is cut off is not a lost session (§21).** The journal is written by a harness hook after every file change, not by the model at the end, so the next agent — Claude Code, Codex or any other — can resume from the repository alone.
- Source of truth: **Git + `/ai` + `/docs` + ADRs**. AI memory tools (claude-mem, built-in memory) are helper layers only; the project must survive their loss.

Context priority: current user instruction → project rules → recorded decisions → current state → existing code → official documentation → official skills → trusted third-party skills → general AI knowledge.

Skill precedence on conflict: project rules > ADRs > project docs > official framework guidance > installed skills > pretrained knowledge. A skill never changes project architecture.

## 14. UI rules (ADR-009)

- UI components come from **COSS UI** (built on Base UI) styled with **Tailwind CSS**. Before building anything, check COSS for a component, primitive, pattern or particle.
- **Custom UI elements are forbidden unless the user explicitly approves them.** Ask first, with the reason COSS is insufficient.
- devl.dev is inspiration only: inspect → understand → adapt → standardize (never copy blindly).
- Full rules: `docs/ui-ux/DESIGN_SYSTEM_RULES.md`.
- UI text is Turkish and written inside components (no i18n framework, ADR-011).

## 15. Naming (ADR-010)

Code, database, API, events, env vars, storage keys, logs, tests and infrastructure use English names. Database: `snake_case`, plural tables. TypeScript: ecosystem conventions. Domain terms come from `docs/domain/GLOSSARY.md`; if a term is missing, run the naming decision process and add it before using it. Full rules: `docs/standards/NAMING_CONVENTIONS.md`.

## 16. Documentation language (ADR-011)

- `/ai/*` and `AGENTS.md`: English.
- `/docs/*`: Turkish. Technical identifiers inside them stay English.

## 17. Git

- Default branch `main`; remote `github.com/erenkarakoc/geoges-panel` (private).
- **Single branch (D-109):** all work is committed directly to `main` in small, frequent commits; no feature branches, no pull requests. `main` stays green: `npm run check` passes before every commit. The only other branch is a throwaway `spike/` branch, never merged (ADR-007).
- Commits are made as work progresses, in small steps (D-109); every commit on `main` is pushed automatically by the `post-commit` hook (D-110).
- Never add AI attribution to commit messages or PR descriptions: no `Co-Authored-By: Claude …` trailer and no "Generated with …" line, from any AI tool (owner decision 2026-09-16; history cleaned on all branches the same day).
- Never commit secrets, `.env` files or real personal data.
- Details: `docs/standards/GIT_WORKFLOW.md`.

## 18. Environments and production safety

- Environments: `development`, `staging`, `production`. No experimental work on production.
- AI tools and MCP servers get least privilege; no default write access to production. Destructive or production operations require human approval.

## 19. Security and sensitive data

- Security is evaluated inside every feature (authn, authz, RLS, roles, validation, rate limiting, secrets, signed URLs, audit, sensitive data, dependency security).
- Sensitive personal data (national ID, IBAN, social security, health reports, salary) is classified and access-restricted by design. KVKK exposure is tracked as an active risk (RISK-001).
- Real personal data is never used in development, tests, spikes or AI prompts.

## 20. Skills

Skills are installed only after audit and approval, recorded in `ai/AI_SKILLS.md`, pinned to a version/commit and updated through a reviewed flow. Skills are activated only when relevant to the task.

## 21. Record consistency and session continuity are machine-enforced (D-076, CHG-005)

Rules written only as prose depend on a model remembering them at the right moment. The rules below are enforced by programs, so a session that forgets them fails loudly instead of drifting.

### 21.1 The validator

`scripts/check-records.mjs`, run by `npm run records`, by `npm run check` and by the pre-commit hook. It asserts:

1. Every `TASK-NNNN` in `ai/TASKS.md` is unique and sits under a recognised phase/milestone heading.
2. Every task status is in the §4 vocabulary; every phase status in the §9 vocabulary.
3. Every `CHG-NNN` in `ai/DECISIONS.md` appears in the roadmap's change register.
4. Every `D-NNN` is unique.
5. Every `OQ-NNN` in `ai/CURRENT_STATE.md` exists in `ai/OPEN_QUESTIONS.md`.
6. Every `ADR-NNN` referenced anywhere exists as a file in `docs/decisions/`.
7. Every `TASK-NNNN`, `D-NNN`, `ADR-NNN` and `REQ-XXX-NNN` referenced in a record is defined (tasks in `ai/TASKS.md`, decisions in `ai/DECISIONS.md`, ADRs as files, requirements as `### REQ-…` headings in `docs/requirements/REQ-*.md`); every `OQ-NNN` named in `ai/CURRENT_STATE.md` exists in `ai/OPEN_QUESTIONS.md`. The ID standard and the REQ template are exempt, because they show example ids.
8. `Last updated:` in each `/ai` record is not older than that file's last commit date.
9. Task ids referenced in `depends_on` exist.
10. Every task row in `ai/TASKS.md` has exactly six columns (added 2026-09-18 after it found three malformed rows).
11. No record cites a path that does not exist, and no record cites a section (`§N`) without naming the document it belongs to (PROJECT_RULES, DESIGN_SYSTEM_RULES, an ADR, GIT_WORKFLOW, the original protocol, or "bu belgenin"); functional-scope sections are cited by REQ id, and the only place that keeps scope section numbers is the map in `docs/requirements/README.md` (TASK-0039, D-213).
12. Every requirement in `docs/requirements/REQ-*.md` carries a `- Katman:` line (`Sabit`, `Akış`, `Tanım`, joined by `+`), and states the configurable part in `- Akışla ayarlanan:` / `- Tanımla ayarlanan:` exactly when its layer includes Akış / Tanım (D-181).

A failure prints the file, the line and what to fix. Forward references — records citing files the roadmap has not produced yet, such as `docs/requirements/REQ-*.md` — are counted on one line rather than listed; `npm run records -- --verbose` lists them. A gate that prints forty lines on every commit stops being read. The validator is amended whenever a new class of contradiction is found; a contradiction found twice is a missing check.

### 21.2 The session journal

`ai/SESSION_JOURNAL.md` is append-only and written by a `PostToolUse` hook in `.claude/settings.json`, not by the model. Every file-modifying tool call appends one line: timestamp, session id, tool, path. The model never edits it; the file is committed with the work.

Resuming after an interrupted session, from any agent:

1. `git status` and `git diff` — what is uncommitted.
2. Tail of `ai/SESSION_JOURNAL.md` — what the previous session touched, in order, including work it never got to describe.
3. `ai/SESSION_HANDOFF.md` — what the previous session meant to do, if it lived long enough to say so.
4. `ai/TASKS.md` — any task in `IMPLEMENTING`, `TESTING` or `REVIEW` is unfinished business.
5. `npm run records` and `npm run check` — whether the tree it left behind is consistent.

Order matters: 1 and 2 are facts the harness recorded, 3 is a claim the model made. When they disagree, 1 and 2 win.

### 21.3 The commit gate

`.githooks/pre-commit` runs `npm run check:commit` — the validator in strict mode plus type check, lint, tests and formatting — and refuses the commit if any of it fails, so `main` never goes red (D-110). It also refuses a commit while untracked files exist in `ai/`, `docs/`, `scripts/`, `src/` or `.githooks/`, because the checks read the working tree and a file never added would pass them while missing from the commit. `.githooks/post-commit` then pushes the commit to `origin/main`; a failed push leaves the commit intact and says so. It is versioned in the repository and enabled once per clone:

```
git config core.hooksPath .githooks
```

`npm run records` prints a reminder when the hook path is not configured.
