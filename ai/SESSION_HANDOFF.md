# SESSION HANDOFF

Session date: 2026-09-15 · Model: Claude Opus 5 (Claude Code desktop) · Focus: Phase 00 closure, claude-mem fixes, Phase 01 glossary rounds

## Completed
- Phase 00 DONE (`c65495d` on `main`).
- Branch `docs/phase-01-kickoff` created and pushed; commit `c49489c` (D-026 "Şantiye" UI label, TASK-0019 record).
- TASK-0019: process trace root-caused console flashes (claude-mem worker `git` spawns without `windowsHide` → Windows Terminal); owner-approved local patch on 4 calls in 3 plugin scripts, backups in `~/.claude-mem/backups/worker-service-pre-windowsHide-2026-09-15/`.
- Phase 01 glossary rounds 1–2 (OQ-007): D-027…D-034 recorded; all OPEN glossary terms closed.

## Partially Completed
- TASK-0018 (long-lived token) and TASK-0019 (window flash patch): both need a Windows restart, then verification (new worker PID, observations stored, 0 auth errors, no flashes). Windows not restarted as of 21:05.
- TASK-0020: PROPOSED glossary terms still reviewed per module.

## Current State
PHASE 01 · DISCOVER / QUESTION · branch `docs/phase-01-kickoff`

## Next Task
1. Commit round 1–2 records on `docs/phase-01-kickoff` (owner approval needed).
2. Plan Phase 01 requirement rounds per module (start with Slice 1 modules: Core/IAM, SIT, WFL approvals, RPT site detail + cockpit), raise OQ-021 (pilot site/users), OQ-022 (dates), OQ-023 (backup approver), OQ-024 (KVKK legal review).
3. After Windows restart: verify TASK-0018 and TASK-0019.

## Open Questions
OQ-007 (PROPOSED terms per module); OQ-010…OQ-017, OQ-020…OQ-024.

## New Decisions
D-026 … D-034 (see `ai/DECISIONS.md`). D-030 extends scope §15.1/§16.4 (three subcontractor payment methods).

## Deferred Items
DEF-001…DEF-005.

## Technical Debt
None (no application code). Line-ending policy (`.gitattributes`) to define at Phase 07 scaffold.

## Known Bugs
- Out of scope: `Desktop\test\app` still pins claude-mem v12.3.6 and will reproduce schema errors if used.

## Files Changed (uncommitted, branch `docs/phase-01-kickoff`)
`ai/DECISIONS.md`, `docs/domain/GLOSSARY.md`, `ai/OPEN_QUESTIONS.md`, `ai/CURRENT_STATE.md`, `ai/TASKS.md`, `ai/CHANGELOG.md`, `ai/SESSION_HANDOFF.md`.

## Tests Run
Process trace of new processes during tool use; `node --check` on patched plugin scripts; worker health and boot-time checks.

## Important Context
- Owner is not a developer; explain choices in plain Turkish; **never take an action without asking** (owner instruction 2026-09-15).
- Branches are mandatory from Phase 01 (`docs/standards/GIT_WORKFLOW.md`).
- Old code in `../eski/` must not be reused (ADR-007).
- UI: COSS + Tailwind only; ask before any custom element. UI label for sites: "Şantiye".
- Never enable claude-mem Cloud Sync; never invoke the plugin's `cloud-sync` skill. Never commit the Tailwind docs snapshot.
- Never force-stop the claude-mem worker; restart the Claude app or Windows instead. claude-mem cache carries a local patch (TASK-0019) that a plugin update overwrites.
- Never read or handle the `CLAUDE_CODE_OAUTH_TOKEN` value.
