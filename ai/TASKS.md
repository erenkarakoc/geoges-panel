# TASKS

Last updated: 2026-09-15 · Format: `docs/standards/ID_STANDARDS.md`

## PHASE 00 — Project Bootstrap & AI Infrastructure

| ID | Title | Tier | Status | Depends on | Notes |
|---|---|---|---|---|---|
| TASK-0001 | Initialize local Git repository (`main`) and add GitHub remote | T3 | DONE | — | Remote: `github.com/erenkarakoc/geoges-panel` (private) |
| TASK-0002 | Create `AGENTS.md`, `CLAUDE.md`, `README.md`, `.gitignore` | T3 | DONE | TASK-0001 | Owner approved 2026-09-15 |
| TASK-0003 | Create `/ai` state system | T2 | DONE | TASK-0001 | Owner approved 2026-09-15 |
| TASK-0004 | MASTER_ROADMAP with phase gates | T2 | DONE | TASK-0003 | Approved 2026-09-15; Milestone M1 added (CHG-001) |
| TASK-0005 | Standards: ID, naming, quality gates, git workflow | T2 | DONE | TASK-0003 | Owner approved 2026-09-15; `GIT_WORKFLOW.md` records Phase 00 direct-to-`main` exception, branches from Phase 01 |
| TASK-0006 | ADR-001…ADR-013 | T2 | DONE | TASK-0003 | Owner approved 2026-09-15; ADR-013 stale status corrected |
| TASK-0007 | Skill audit: sources, commits, scripts, licenses, risks | T2 | DONE | TASK-0003 | Results in `ai/AI_SKILLS.md` |
| TASK-0008 | Vendor approved skills into `.claude/skills/` at pinned commits | T1 | DONE | TASK-0007 | 8 skills; no executable content except Tailwind sync script (not run) |
| TASK-0009 | Disable `ui-ux-pro-max` for this project | T3 | DONE | TASK-0003 | `.claude/settings.json` |
| TASK-0010 | Enable claude-mem for this project (local-only) | T1 | DONE | TASK-0007 | 2026-09-15: first verification FAILED (plugin not installed for this project path). Installed v13.11.0 (`f5633c1`) at project scope with owner approval; DB backed up first. Observation generation failed (`OAuth session expired and could not be refreshed`; CLI refresh token expired 2026-08-02); owner re-logged in the Claude Code CLI. Fresh-session verification PASSED (session 68): SessionStart context injected, worker healthy (v13.11.0, PID 9652), observations #325–#328 stored, 0 errors/auth errors, telemetry `false`, Chroma local, no cloud sync. Follow-up: login expiry (see TASK-0018) |
| TASK-0018 | Prevent silent claude-mem stop when the Claude login expires (2026-10-15) | T2 | TESTING | TASK-0010 | Owner chose option 1 (long-lived `claude setup-token`). 2026-09-15: owner set user env var `CLAUDE_CODE_OAUTH_TOKEN` (presence/format checked, value never read). Worker (PID 9652, started 17:30) not yet respawned, so the token is unused until Windows restart. Owner deferred verification; pending: after restart confirm new worker PID, observations stored, 0 auth errors. Scheduled reminder (option 2) not chosen |
| TASK-0019 | Stop console window flashes caused by claude-mem on Windows | T2 | TESTING | TASK-0010 | Root cause (process trace 2026-09-15): detached worker `bun.exe` spawns `git` without `windowsHide`, so Windows opens Windows Terminal briefly. Owner chose a local patch: added `windowsHide:!0` to 2 git calls in `worker-service.cjs` and 1 each in `context-generator.cjs`, `transcript-watcher.cjs` (v13.11.0 cache); `node --check` OK; originals in `~/.claude-mem/backups/worker-service-pre-windowsHide-2026-09-15/`. Takes effect after Windows restart; lost on plugin update. Pending: verify no flashes after restart |
| TASK-0011 | Initial commit and push to GitHub | T3 | DONE | TASK-0002…TASK-0010 | Commit `deb14ef` |
| TASK-0012 | Module map & dependency graph | T2 | DONE | TASK-0003 | Owner approved 2026-09-15 (draft; finalized in Phase 03) |
| TASK-0013 | UI/UX design-system, COSS and devl.dev rules | T2 | DONE | TASK-0003 | Owner approved 2026-09-15 |
| TASK-0014 | Glossary skeleton with proposed canonical terms | T2 | QUESTIONS_PENDING | TASK-0003 | Skeleton delivered (Phase 00 exit criterion met); term confirmation carried into Phase 01 via OQ-007 |
| TASK-0015 | Identify project-specific skill needs | T3 | DONE | TASK-0007 | `ai/AI_SKILLS.md` |
| TASK-0016 | Initialize Tailwind docs snapshot locally (git-ignored) | T2 | DONE | TASK-0008 | Owner consent D-024; tailwindcss.com @ `7f92c22` |
| TASK-0017 | Impact analysis and decision for CHG-001 (early preview of auth + app shell) | T2 | DONE | TASK-0004 | Resolved: Milestone M1 in Phase 07 |
