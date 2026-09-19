# SESSION HANDOFF

Session date: 2026-09-17/18 · Model: Claude Opus 5 (Claude Code desktop) · Focus: CHG-005 (records), CHG-006 (workflow platform), shell approval, single-branch workflow, and the first Phase 01 requirement files

> Read this **after** `git status`, `git diff` and the tail of `ai/SESSION_JOURNAL.md`. Those are facts the harness recorded; this file is a claim a model made. When they disagree, they win (`ai/PROJECT_RULES.md` §21.2). The journal records Edit/Write tool calls only; edits made through scripts show in `git diff`.

## Completed

- **CHG-005, CHG-006** decided, folded and closed; product-code freeze ended. ADR-005/006/007 amended.
- **TASK-0040** done: sample data removed from approvals, tasks, notifications and badges (D-106…D-108).
- **Owner approved** TASK-0030, TASK-0032…TASK-0038; CHG-003/004/005 closed.
- **Git (D-109, D-110):** single branch `main`, no feature branches or PRs; `.githooks/pre-commit` runs `npm run check:commit` (records strict + typecheck + lint + tests + format, ~20 s) and refuses a red commit — proven with a deliberately bad commit; `.githooks/post-commit` pushes every commit on `main`. Commit as work progresses.
- **Phase 01 requirement files for Slice 1**, each with its question round, decisions and capability catalog:
  - `REQ-WFL` — 39 requirements, from OQ-028/CHG-006 (no new round)
  - `REQ-IAM` — 27 requirements, D-111…D-118
  - `REQ-SIT` — 35 requirements, D-119…D-125
 - `REQ-RPT` — 14 requirements, D-126…D-129 (REQ-RPT-015 reports still to come)
  - Capability catalog template in `docs/requirements/README.md` (TASK-0041 IMPLEMENTING).
- **Slice 1 and later files confirmed by the owner:** WFL, IAM, SIT, RPT, TSK (D-130…D-133), AUD (D-134, D-135), PRJ (D-136…D-138), ADM (D-139…D-141), INV, PUR, FAC (D-142…D-146) — 212 requirements CONFIRMED.
- **REQ-FIN** — 30 requirements, D-147…D-154, CONFIRMED; REQ-FIN-013, REQ-FIN-017 corrected for D-149.
- **REQ-EQP** — 21 requirements, D-155…D-162, CONFIRMED; REQ-EQP-010, REQ-EQP-012, REQ-EQP-021 corrected in place; REQ-SIT-003 gains an equipment section (D-162). Two answers went against the recommendation: no overhead allocation to projects (D-149, changes REQ-FIN-013, REQ-FIN-017 wording) and period close per site (D-154, with a derived rule for factory and office marked for confirmation).
- **REQ-HR** — 16 requirements, D-163…D-168, CONFIRMED; RISK-011 (payroll engine) opened.
- **REQ-CRM** — 14 requirements, D-169…D-172, CONFIRMED.
- **REQ-QTE** — 18 requirements, D-173…D-176, CONFIRMED; REQ-QTE-005…006 corrected (D-173); REQ-CRM-014 clarified.
- **REQ-CMP** — 17 requirements, D-177…D-180, CONFIRMED 2026-09-19.
- **REQ-QHS** — 16 requirements, D-182…D-186, CONFIRMED 2026-09-19; REQ-HR-002/-003/-014 reworded (D-186: only existence and dates of medical reports).
- **REQ-PRF** — 20 requirements, D-187…D-194, CONFIRMED 2026-09-19; REQ-PRF-001…002, REQ-PRF-006, REQ-PRF-008…011, REQ-PRF-013 corrected.
- **REQ-INT** — 14 requirements, D-195…D-198, CONFIRMED 2026-09-19.
- **REQ-MTG (8), REQ-DOC (10), REQ-SUP (5)** — D-199…D-201, CONFIRMED 2026-09-19.
- **REQ-STR** — 8 requirements, D-202…D-205, CONFIRMED 2026-09-19.
- **REQ-RPT REQ-RPT-015** — REQ-RPT-015…023, D-206…D-208, CONFIRMED 2026-09-19.
- **REQ-NFR** — 20 requirements, D-209…D-212, CONFIRMED 2026-09-19. All module rounds done: 26 files, 438 requirements CONFIRMED; TASK-0044 and TASK-0041 DONE.
- **Layer scan (D-181)** — all 328 requirements tagged Sabit / Akış / Tanım; 101 name a configurable part; three descriptions reworded (REQ-TSK-006, REQ-CRM-007, REQ-CMP-013); validator enforces the tag. New modules must carry the tag from the start. Derived rules awaiting confirmation: framework price proposed on orders (REQ-CMP-004); contract amendment as a new version (REQ-CMP-005).
- Validator gained checks for decision and requirement ids and six-column task rows; the rule text in PROJECT_RULES §21.1 now matches what the tool does.
- Glossary: ~25 proposed terms added before use; non-canonical names fixed (`flow` → `workflow`, `daily_log` → `daily_site_log`, `waste` → `damaged_unit`).

## Not done / open

- Remaining Phase 01 modules: CRM, QTE, CMP, QHS, MTG, SUP, DOC, PRF, INT, STR, NFR, and RPT REQ-RPT-015 — each needs a round and a catalog (TASK-0044, TASK-0041).
- TASK-0043: rename `dashboard`/`widget` in code to match the glossary.
- TASK-0039 (§ → REQ remap), which unblocks TASK-0027.
- OQ-026 (password policy), OQ-027 items 3–4, OQ-007 (glossary confirmation) still open.

## Next session

0. **Roadmap changed 2026-09-20 (D-229):** the ten module slices are now seven (phases 09–15; 16–18 retired, 19 unchanged). The roadmap also carries an effort estimate measured from the first six days (~72–101 working days left).

1. **Phase 02 is DONE** (owner approved 2026-09-20); **Phase 03 — System Architecture is the current phase.** Product code stays frozen until Phase 07 (ADR-007).
2. Phase 03 scope: module public APIs and boundary specs; event backbone (outbox, dispatch, idempotency, retries); workflow engine architecture (ADR-006 + CHG-006 decisions D-077…D-105); rules and configuration model with effective dating; custom fields; search architecture (TASK-0029); storage direction for user-defined record types; ports and adapters; the Phase 06 spike list. OQ-026 (password policy) is answered here.
3. Work the same way as in Phase 01 and 02: read the scope, ask only genuinely open business questions (3-4 per box, plain Turkish, recommended option first), record answers as D-NNN, write the document, update the records, commit, then ask the owner to confirm.
4. Phase 02 items carried into later phases: the record-type builder's detailed screen after the Slice 1 pilot (D-105); TASK-0054 (light-theme focus ring, Turkish sidebar labels), TASK-0028 (bottom-band slot), TASK-0043 (`dashboard`/`widget` rename) and the `/admin` menu move (D-223) in Phase 07.
5. Still open elsewhere: TASK-0018 (claude-mem re-check after 2026-10-15), DEF-007 (KVKK inventory before the Phase 19 real-data gate), DEF-001 (data import), DEF-002 (offline), DEF-006 (start a flow by e-mail).
