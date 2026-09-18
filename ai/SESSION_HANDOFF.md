# SESSION HANDOFF

Session date: 2026-09-17/18 · Model: Claude Opus 5 (Claude Code desktop) · Focus: CHG-005 (records made consistent and machine-checked) and CHG-006 (composition-first workflow platform — decided in seven question rounds and folded into the plan)

> Read this **after** `git status`, `git diff` and the tail of `ai/SESSION_JOURNAL.md`. Those are facts the harness recorded; this file is a claim a model made. When they disagree, they win (`ai/PROJECT_RULES.md` §21.2). The journal records Edit/Write tool calls only; edits made through scripts show in `git diff`.

## Completed

- **CHG-005** on `main` and pushed (`ab0f477`…`f4aac58`): nine record contradictions fixed, validator + pre-commit gate, hook-written journal and resume block. TASK-0038 in REVIEW.
- **OQ-028** answered in seven rounds (28 questions) → **D-077…D-105**, CHG-006 analysis in `ai/DECISIONS.md`, approved by the owner 2026-09-18.
- **CHG-006 folded:** ADR-006 amended with the full workflow ruleset; ADR-005 amended for the record-type builder (conflict with its original rejection of "everything configurable" stated explicitly); ADR-007 noted; PROJECT_RULES §7 updated; roadmap gained CHG-006 scope in Phases 01–04, 06–08 and a new **Phase 09R — Record-Type Builder** after the Slice 1 pilot; TASK-0041 (capability catalog) and TASK-0042 (§45 flow definitions) opened; §45 moved to `REQ-WFL`; palette test moved to `docs/workflows/README.md`; `WORKFLOW_PLATFORM_DIRECTION.md` deleted.
- The owner's product-code freeze ended with the fold; ADR-007 (design first) applies again.

## Not done / open

- **TASK-0040:** re-review the CHG-004 shell work against CHG-006 — blocks the approval of TASK-0030 and TASK-0032…TASK-0037.
- `npm run check` fails on committed `main` because of a pre-existing Prettier issue in `src/platform/ui/app-shell/app-sidebar.tsx` (KNOWN ISSUES) — raise with the owner.
- Phase 01 requirement work: no REQ file written yet (TASK-0020, TASK-0021, TASK-0041).
- DEF-006 e-mail triggers deferred.

## Next session

1. TASK-0040.
2. Prettier issue decision.
3. Phase 01 requirement rounds with the capability catalog.
