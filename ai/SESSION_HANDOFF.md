# SESSION HANDOFF

Session date: 2026-09-17/18 · Model: Claude Opus 5 (Claude Code desktop) · Focus: CHG-005 — fixing the contradictions in the state system and making the rules machine-enforced; recording the workflow-platform direction as input for CHG-006

> Read this **after** `git status`, `git diff` and the tail of `ai/SESSION_JOURNAL.md`. Those are facts the harness recorded; this file is a claim a model made. When they disagree, they win (`ai/PROJECT_RULES.md` §21.2).

## Completed

- **Audit.** Nine contradictions found across the state system and listed in the CHG-005 record in `ai/DECISIONS.md`. Every one is fixed or explicitly recorded with the reason it cannot be fixed yet.
- **`ai/MASTER_ROADMAP.md` rewritten where it was wrong:** declared the single authority; gained a change-request register (CHG-001…CHG-006) and a "work delivered ahead of its phase" table; Phase 01 given an honest status (no REQ file exists yet); Phases 02 and 07 set to `PARTIALLY_DONE` with item-by-item delivered/owed lists; Milestone M1 redefined as the staging milestone; Phase 08 annotated with the pending CHG-006 split.
- **Decisions D-072…D-076** written (the first free id was D-072 — the validator caught a collision with the existing D-071 logo decision).
- **`ai/PROJECT_RULES.md`:** §9 gained the roadmap rule and the phase status vocabulary; §13 now points at the journal; new **§21** documents the validator, the journal and the commit gate.
- **`ai/TASKS.md`** refiled: TASK-0028 and TASK-0030…TASK-0037 moved under a CHG-003/CHG-004 heading, TASK-0011…TASK-0017 under Phase 00, TASK-0038 under CHG-005. New TASK-0038 (this work) and TASK-0039 (§ → REQ remap). TASK-0027 set to `BLOCKED`.
- **`ai/CURRENT_STATE.md`:** branch corrected to `main`, `CODE ALLOWED` rewritten as the owner's freeze, RISK-009 added, next-task list reordered behind OQ-028.
- **OQ-028** opened in `ai/OPEN_QUESTIONS.md` — blocking, with the reasoning in the root direction file.
- **§45 palette test run** (owner asked for it, 2026-09-17): all eight end-to-end flows walked step by step against ADR-006's 12-node palette. 45.6 and 45.7 are fully expressible; the other six produced **six gaps** (B-1 record create/update node, B-2 iterate-over-list, B-3 approval reject / send-back edge, B-4 windowed conditions, B-5 external-party approval, B-6 undefined trigger types) plus one design rule: an end-to-end flow is several short flows chained by events, not one long definition. Written up as §7.1 of the direction file; questions 19–25 added to OQ-028.
- **`WORKFLOW_PLATFORM_DIRECTION.md`** written at the repository root: three-layer model, capability catalog, the designer's out-of-scope list, §45 as templates and as a validation set, roadmap options, risks, and the 14 unanswered questions. It is a **proposal**; it becomes CHG-006 and then deletes itself.
- **Guards built and proven:** `scripts/check-records.mjs` (+ `npm run records`, wired into `npm run check`) passes on 51 files / 39 tasks / 76 decisions; `.githooks/pre-commit` written and `core.hooksPath` set; `scripts/session-journal.mjs` on a `PostToolUse` hook — **verified firing live**, it recorded this session's own edit to `docs/standards/GIT_WORKFLOW.md`; `scripts/session-resume.mjs` on a `SessionStart` hook, pipe-tested.
- `ai/CHANGELOG.md`, `docs/standards/GIT_WORKFLOW.md`, `docs/sources/README.md` and ADR-007 updated to match.

## Not done / open

- **OQ-028 is unanswered.** Questions 1–14 and 19–25. Nothing in the plan moves until the owner answers them.
- **Product code is frozen** by owner instruction until CHG-005 and CHG-006 are both closed.
- Three judgment calls were applied on the AI's recommendation and are **reversible if the owner disagrees**: M1 redefined rather than cancelled (D-074), early work recorded as `PARTIALLY_DONE` phases rather than a separate milestone track (D-073), TASK-0027 blocked rather than merely scheduled (D-075).
- The validator reports **notes** (not failures) for ~30 forward references — `docs/requirements/REQ-*.md` and `docs/architecture/spikes/` do not exist yet. That is expected in a design-first project; the notes disappear as Phase 01 and Phase 06 produce those files.
- Nothing has been committed. The whole change sits in the working tree.
- Still in `REVIEW` from earlier sessions: TASK-0030, TASK-0032…TASK-0037. TASK-0018 still `TESTING` (re-check after 2026-10-15).

## Current state

PHASE 01, branch `main`, working tree dirty with the CHG-005 change. `npm run records` passes. Product code frozen.

## Next session

1. Take the owner's answers to OQ-028 (the 14 questions).
2. Write them as `D-077…` in `ai/DECISIONS.md`, then the **CHG-006** analysis.
3. Revise ADR-006 (out-of-scope list, trigger types, traceability, authority model); amend ADR-005 and ADR-007 if the answers require it.
4. Fold the direction into `ai/MASTER_ROADMAP.md` — capability catalog as a Phase 01/03 deliverable, engine core position in Phase 07/08.
5. Move §45 from `REQ-NFR` to `REQ-WFL` in `ai/REQUIREMENTS.md`.
6. Delete `WORKFLOW_PLATFORM_DIRECTION.md`.
7. Only then does the product-code freeze lift.
