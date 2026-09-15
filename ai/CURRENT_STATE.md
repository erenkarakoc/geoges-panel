# CURRENT STATE

Last updated: 2026-09-15

```text
PROJECT STATUS:      BOOTSTRAP
CURRENT PHASE:       PHASE 00 — Project Bootstrap & AI Infrastructure
CURRENT SUBPHASE:    PROJECT BOOTSTRAP (closing)
CURRENT FEATURE:     —
CURRENT TASK:        Phase 00 owner review; TASK-0018 claude-mem login expiry safeguard
STATUS:              REVIEW
```

## LAST COMPLETED TASK
TASK-0010 DONE (2026-09-15): fresh-session verification passed — SessionStart context injected, worker healthy, observations #325–#328 stored, 0 auth errors, telemetry off, no cloud sync. Phase 00 completion report written in `ai/MASTER_ROADMAP.md` (NOT COMPLETE pending owner review only).

## NEXT TASK
1. Owner chooses TASK-0018 safeguard (long-lived token and/or scheduled reminder) before 2026-10-15
2. Owner review of REVIEW tasks (TASK-0002, 0003, 0005, 0006, 0012, 0013) → Phase 00 DONE
3. Phase 01 Requirements & Domain Analysis question round

## BLOCKED BY
Owner review (Phase 00 closure).

## OPEN QUESTIONS
See `ai/OPEN_QUESTIONS.md` (OQ-007 for Phase 01; OQ-010…OQ-024 later phases).

## RECENT DECISIONS
- ADR-001…ADR-013 (2026-09-15)
- D-019…D-025: skill vendoring, skill set, Next.js guidance, plugin settings, roadmap approval with Milestone M1, Tailwind docs local-only, claude-mem telemetry off

## DEFERRED ITEMS
DEF-001 Data import · DEF-002 Offline entry · DEF-003 Native mobile app · DEF-004 Self-hosted Supabase migration · DEF-005 Cloud Run workers

## KNOWN ISSUES
- Git reports LF→CRLF conversion warnings on Windows; a `.gitattributes` policy is not yet defined (propose in Phase 07 scaffold).
- claude-mem summarization depends on the Claude Code CLI login in `~/.claude/.credentials.json` (refresh token valid until 2026-10-15). If it lapses, observations silently stop with `OAuth session expired`; fix = owner re-login via CLI. On Windows the worker reads Windows Credential Manager first (absent, expected WARN), then falls back to the `CLAUDE_CODE_OAUTH_TOKEN` environment variable (v13.11.0 source). Safeguard tracked in TASK-0018.
- Do not force-stop the claude-mem worker: its uvx/chroma-mcp children inherit and hold port 37777, blocking respawn. Prefer fully restarting the Claude app or Windows.
- `Desktop\test\app` (out of scope) still pins claude-mem v12.3.6; running it against the shared DB reproduces `no such column: failed_at_epoch` errors.
- claude-mem v13.11.0 ships a `cloud-sync` skill; it must never be invoked (ADR-013).
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
