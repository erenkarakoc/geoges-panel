# CURRENT STATE

Last updated: 2026-09-16

```text
PROJECT STATUS:      BOOTSTRAP
CURRENT PHASE:       PHASE 01 — Requirements & Domain Analysis
CURRENT SUBPHASE:    DISCOVER / QUESTION
CURRENT FEATURE:     —
CURRENT TASK:        TASK-0020 Glossary confirmation rounds (OQ-007)
STATUS:              QUESTIONS_PENDING
BRANCH:              docs/phase-01-requirements (M0 merged into main via PR #1, 2026-09-16)
PARALLEL TRACK:      Milestone M0 early first screen (CHG-002) — DONE 2026-09-16 (TASK-0022…TASK-0026, owner approved)
CODE ALLOWED:        None — M0 closed; product code resumes in Phase 07 (ADR-007) or via an approved change request
```

## LAST COMPLETED TASK
Phase 00 DONE (2026-09-15): owner approved TASK-0002, 0003, 0005, 0006, 0012, 0013; stale records corrected (ADR-013 status, AI_SKILLS claude-mem/Next.js notes, GIT_WORKFLOW Phase 00 direct-to-`main` exception, OQ-018/019 numbering note). Completion report in `ai/MASTER_ROADMAP.md`.

## NEXT TASK
1. Phase 01 per-module requirement rounds (TASK-0020 PROPOSED glossary terms per module, TASK-0021 slice 1 REQ extraction). OQ-021…OQ-025 answered (D-048…D-051).
2. M0 merged into `main` (PR #1, 2026-09-16).
3. TASK-0018: re-check after 2026-10-15 that the worker keeps storing observations via the `CLAUDE_CODE_OAUTH_TOKEN` fallback (restart verified 2026-09-15; fallback not yet exercised). TASK-0019 DONE.

## BLOCKED BY
None.

## OPEN QUESTIONS
See `ai/OPEN_QUESTIONS.md` (OQ-007 for Phase 01; OQ-010…OQ-024 later phases).

## RECENT DECISIONS
- D-048…D-051 (2026-09-16): pilot on sample data, no target date, no KVKK legal review (RISK-001 open), Projects and CRM added to the menu
- Owner rule (2026-09-16): a primary logo is never used in dark mode (`docs/ui-ux/DESIGN_SYSTEM_RULES.md` §4)
- D-046, D-047 (2026-09-16): devl.dev auth design adopted as the actual design and rebuilt with COSS; `ParticleField` approved as the first custom element
- ADR-001…ADR-013 (2026-09-15)
- D-019…D-025: skill vendoring, skill set, Next.js guidance, plugin settings, roadmap approval with Milestone M1, Tailwind docs local-only, claude-mem telemetry off

## DEFERRED ITEMS
DEF-001 Data import · DEF-002 Offline entry · DEF-003 Native mobile app · DEF-004 Self-hosted Supabase migration · DEF-005 Cloud Run workers

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
| RISK-001 | KVKK: sensitive employee data in Supabase Cloud EU region; no field-level encryption chosen | High (legal/financial) | EU region; strict RLS & data classification; minimize sensitive fields; legal review before real HR data | Owner |
| RISK-002 | Very large first-release scope | High (schedule) | Design-first with traceability; vertical slices with pilots; re-evaluate after Phase 01 sizing | Owner + AI |
| RISK-003 | Process overhead vs. single non-developer owner | Medium | Risk-tiered gates (ADR-008); batched question rounds | AI |
| RISK-004 | Third-party skill / plugin supply chain | Medium | Vendored at audited commits; no installer CLI; claude-mem cloud sync forbidden | AI |
| RISK-005 | Visual workflow designer complexity | Medium | Fixed node palette, engine-first, validation spike | AI |
| RISK-006 | Provider lock-in to Supabase Cloud | Medium | Portability rules (ADR-002) | AI |
| RISK-007 | claude-mem stores prompts/observations locally, shared across projects | Low–Medium | Local-only, telemetry off, no real personal data in sessions, `<private>` tags | AI |
| RISK-008 | Tailwind docs license (source-available, educational) for local AI use | Low | Owner-accepted local use only; never committed or redistributed (D-024) | Owner |
