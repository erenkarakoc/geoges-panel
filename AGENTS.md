# GEOGES Panel — Agent Instructions

This repository is developed under a strict engineering protocol. These instructions apply to every AI agent, model, IDE and session.

## Mandatory bootstrap order

Before doing any work, read in this order:

1. `ai/PROJECT_RULES.md`
2. `ai/PROJECT_CONTEXT.md`
3. `ai/CURRENT_STATE.md`
4. `ai/MASTER_ROADMAP.md`
5. `ai/SESSION_HANDOFF.md`
6. Active feature specification (`docs/features/`)
7. Relevant ADRs (`docs/decisions/`)
8. Relevant requirements (`ai/REQUIREMENTS.md`, `docs/requirements/`)
9. Relevant tasks (`ai/TASKS.md`)
10. Relevant skills (`ai/AI_SKILLS.md`)
11. Existing code
12. Implementation

Never change source code without this context.

## Non-negotiables (summary — full text in `ai/PROJECT_RULES.md`)

- Do not write application code in a phase that does not allow it (see `ai/CURRENT_STATE.md`).
- No previously agreed feature may be silently removed, simplified, changed, deferred or substituted.
- Critical ambiguity becomes a question in `ai/OPEN_QUESTIONS.md`, never a silent assumption.
- Nothing is `DONE` until its quality gate passes (`docs/standards/QUALITY_GATES.md`).
- Update `ai/CURRENT_STATE.md` and `ai/SESSION_HANDOFF.md` at the end of every session.
- Code, database, API and infrastructure names are English. `/ai` is English, `/docs` is Turkish, UI text is Turkish.
- UI uses COSS UI + Tailwind CSS only. Ask the user before creating any custom UI element.
- The previous codebases under `../eski/` are out of scope and must not be used as a source of code.

<!-- Framework-managed blocks (e.g. Next.js version-matched docs pointer) may be appended below this line. -->

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

