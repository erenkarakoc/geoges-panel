# TASKS

Last updated: 2026-09-15 · Format: `docs/standards/ID_STANDARDS.md`

## PHASE 00 — Project Bootstrap & AI Infrastructure

| ID | Title | Tier | Status | Depends on | Notes |
|---|---|---|---|---|---|
| TASK-0001 | Initialize local Git repository (`main`) and add GitHub remote | T3 | DONE | — | Remote: `github.com/erenkarakoc/geoges-panel` (private) |
| TASK-0002 | Create `AGENTS.md`, `CLAUDE.md`, `README.md`, `.gitignore` | T3 | REVIEW | TASK-0001 | Awaiting owner review |
| TASK-0003 | Create `/ai` state system | T2 | REVIEW | TASK-0001 | |
| TASK-0004 | MASTER_ROADMAP with phase gates | T2 | DONE | TASK-0003 | Approved 2026-09-15; Milestone M1 added (CHG-001) |
| TASK-0005 | Standards: ID, naming, quality gates, git workflow | T2 | REVIEW | TASK-0003 | |
| TASK-0006 | ADR-001…ADR-013 | T2 | REVIEW | TASK-0003 | |
| TASK-0007 | Skill audit: sources, commits, scripts, licenses, risks | T2 | DONE | TASK-0003 | Results in `ai/AI_SKILLS.md` |
| TASK-0008 | Vendor approved skills into `.claude/skills/` at pinned commits | T1 | DONE | TASK-0007 | 8 skills; no executable content except Tailwind sync script (not run) |
| TASK-0009 | Disable `ui-ux-pro-max` for this project | T3 | DONE | TASK-0003 | `.claude/settings.json` |
| TASK-0010 | Enable claude-mem for this project (local-only) | T1 | DONE | TASK-0007 | 2026-09-15: first verification FAILED (plugin not installed for this project path). Installed v13.11.0 (`f5633c1`) at project scope with owner approval; DB backed up first. Observation generation failed (`OAuth session expired and could not be refreshed`; CLI refresh token expired 2026-08-02); owner re-logged in the Claude Code CLI. Fresh-session verification PASSED (session 68): SessionStart context injected, worker healthy (v13.11.0, PID 9652), observations #325–#328 stored, 0 errors/auth errors, telemetry `false`, Chroma local, no cloud sync. Follow-up: login expiry (see TASK-0018) |
| TASK-0018 | Prevent silent claude-mem stop when the Claude login expires (2026-10-15) | T2 | QUESTIONS_PENDING | TASK-0010 | Options: long-lived `claude setup-token` in `CLAUDE_CODE_OAUTH_TOKEN` (owner sets it; worker reads it as fallback) and/or scheduled expiry reminder. Awaiting owner choice |
| TASK-0011 | Initial commit and push to GitHub | T3 | DONE | TASK-0002…TASK-0010 | Commit `deb14ef` |
| TASK-0012 | Module map & dependency graph | T2 | REVIEW | TASK-0003 | |
| TASK-0013 | UI/UX design-system, COSS and devl.dev rules | T2 | REVIEW | TASK-0003 | |
| TASK-0014 | Glossary skeleton with proposed canonical terms | T2 | QUESTIONS_PENDING | TASK-0003 | OQ-007 |
| TASK-0015 | Identify project-specific skill needs | T3 | DONE | TASK-0007 | `ai/AI_SKILLS.md` |
| TASK-0016 | Initialize Tailwind docs snapshot locally (git-ignored) | T2 | DONE | TASK-0008 | Owner consent D-024; tailwindcss.com @ `7f92c22` |
| TASK-0017 | Impact analysis and decision for CHG-001 (early preview of auth + app shell) | T2 | DONE | TASK-0004 | Resolved: Milestone M1 in Phase 07 |
