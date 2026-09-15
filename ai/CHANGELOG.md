# CHANGELOG

## 2026-09-15 — Phase 00 bootstrap (uncommitted)

- Scope documents updated with 21 previously missed requirements from legacy analysis; "no external dependency" clarified (records never outside the panel; tech providers and APIs allowed).
- Phase 00 decision round (4 rounds) completed; ADR-001…ADR-013 accepted.
- Git repository initialized; remote added.
- Created `AGENTS.md`, `CLAUDE.md`, `README.md`, `.gitignore`.
- Created `/ai` state system and `/docs` structure (standards, decisions, architecture module map, UI/UX rules, glossary skeleton, requirement index).
- Skill audit performed; 8 skills vendored at pinned commits into `.claude/skills/` (supabase, supabase-postgres-best-practices, coss, coss-particles, react-best-practices, composition-patterns, cloudflare, tailwind-4-docs).
- `.claude/settings.json`: `ui-ux-pro-max` disabled, `claude-mem` enabled for this project.
- CHG-001 proposed (early preview of auth screens and app shell).
