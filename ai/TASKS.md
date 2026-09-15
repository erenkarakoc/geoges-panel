# TASKS

Last updated: 2026-09-15 · Format: `docs/standards/ID_STANDARDS.md`

## PHASE 00 — Project Bootstrap & AI Infrastructure

| ID | Title | Tier | Status | Depends on | Notes |
|---|---|---|---|---|---|
| TASK-0001 | Initialize local Git repository (`main`) and add GitHub remote | T3 | DONE | — | Remote: `github.com/erenkarakoc/geoges-panel` (private) |
| TASK-0002 | Create `AGENTS.md`, `CLAUDE.md`, `README.md`, `.gitignore` | T3 | REVIEW | TASK-0001 | Awaiting owner review |
| TASK-0003 | Create `/ai` state system | T2 | REVIEW | TASK-0001 | |
| TASK-0004 | MASTER_ROADMAP with phase gates | T2 | QUESTIONS_PENDING | TASK-0003 | OQ-001; change request CHG-001 (early preview screen) |
| TASK-0005 | Standards: ID, naming, quality gates, git workflow | T2 | REVIEW | TASK-0003 | |
| TASK-0006 | ADR-001…ADR-013 | T2 | REVIEW | TASK-0003 | |
| TASK-0007 | Skill audit: sources, commits, scripts, licenses, risks | T2 | DONE | TASK-0003 | Results in `ai/AI_SKILLS.md` |
| TASK-0008 | Vendor approved skills into `.claude/skills/` at pinned commits | T1 | DONE | TASK-0007 | 8 skills; no executable content except Tailwind sync script (not run) |
| TASK-0009 | Disable `ui-ux-pro-max` for this project | T3 | DONE | TASK-0003 | `.claude/settings.json` |
| TASK-0010 | Enable claude-mem for this project (local-only) | T1 | IMPLEMENTING | TASK-0007 | Enabled in `.claude/settings.json`; verify next session; telemetry decline (OQ-009) |
| TASK-0011 | Initial commit and push to GitHub | T3 | READY_FOR_IMPLEMENTATION | TASK-0002…TASK-0010 | Approved by owner (OQ-002) |
| TASK-0012 | Module map & dependency graph | T2 | REVIEW | TASK-0003 | |
| TASK-0013 | UI/UX design-system, COSS and devl.dev rules | T2 | REVIEW | TASK-0003 | |
| TASK-0014 | Glossary skeleton with proposed canonical terms | T2 | QUESTIONS_PENDING | TASK-0003 | OQ-007 |
| TASK-0015 | Identify project-specific skill needs | T3 | DONE | TASK-0007 | `ai/AI_SKILLS.md` |
| TASK-0016 | Initialize Tailwind docs snapshot (`sync_tailwind_docs.py --accept-docs-license`) | T2 | BLOCKED | TASK-0008 | Requires owner consent to Tailwind docs license (OQ-008) |
| TASK-0017 | Impact analysis and decision for CHG-001 (early preview of auth + app shell) | T2 | QUESTIONS_PENDING | TASK-0004 | See `ai/DECISIONS.md` |
