# PROJECT RULES

Status: ACTIVE · Owner: project owner · Last updated: 2026-09-15

These rules are a working protocol, not advice. Source: `docs/sources/ai-development-protocol.md` (originally `AI_Destekli_Proje_Gelistirme_Ana_Promptu.md`), revised by the Phase 00 decision round (see `ai/DECISIONS.md`). Where this file and the original prompt differ, this file wins.

---

## 1. Scope protection

- Everything agreed in `docs/sources/functional-scope.md`, `docs/sources/architecture-principles.md` and recorded decisions is in scope. After these sources are removed (TASK-0027), the REQ records, ADRs and `docs/` are the scope of record.
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
- extra fields → typed custom fields on designated entities only
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

## 10. Implementation plan (T1/T2 tasks)

Before coding: Task · Goal · Dependencies · Affected files · Database changes · Backend changes · Frontend changes · Security · Tests · Migration · Rollback strategy · Acceptance criteria.

## 11. Dependencies

Tasks declare `depends_on`. A task does not start before its mandatory dependencies are `DONE`.

## 12. Traceability

`Requirement → Feature → Task → Database → Backend → Frontend → Tests → Deployment` must be traceable through IDs (`docs/standards/ID_STANDARDS.md`).

## 13. Session continuity

- Start: follow the bootstrap order in `AGENTS.md`.
- End: update `ai/CURRENT_STATE.md`, `ai/TASKS.md`, `ai/CHANGELOG.md` and overwrite `ai/SESSION_HANDOFF.md`.
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
- Branch prefixes: `feature/ fix/ refactor/ infra/ docs/ test/ spike/`.
- Commits and pushes happen only when the user asks or a recorded task explicitly includes them.
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
