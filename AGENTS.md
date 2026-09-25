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

## Working with the owner

These preferences were first kept in one machine's private assistant memory; they live here so every session — local, cloud or another tool — follows them.

- **Talk to the owner in Turkish**, plainly and without metaphors, including question boxes and after a context summary. The owner is not a developer.
- **Do not re-ask what is answered.** Check the records before asking. When the owner says a behaviour is "configured by management", treat that as final and do not ask for a default value (D-040).
- **A linked design is replicated, then adapted** to COSS, the project's tokens and Turkish copy — not treated as loose inspiration. Say which parts were taken, adapted and dropped (D-046).
- **Every departure from COSS UI / Tailwind defaults is told to the owner** in the reply and written into `docs/ui-ux/DESIGN_SYSTEM_RULES.md` §4.1. `src/components/ui` is never edited.
- **No AI attribution** in commits or pull requests: no `Co-Authored-By` trailer, no "Generated with" line (`ai/PROJECT_RULES.md` §17).

## Working from a cloud session

The repository is the whole project memory; a cloud session starts with nothing else. What it has and what it lacks:

- **Only `main`.** Commit and push to `main`, never to a side branch (D-109; the owner restated it on 2026-09-25 after a cloud session left its work on `claude/…`). If the environment hands you a branch, move the work onto `main` before pushing.
- **Fetch the full history first:** `git fetch --unshallow` (or `git fetch --depth=1000000`). The records check compares each record's `Last updated:` with its last commit date, and a shallow clone reports false stamp errors.
- **No database, no secrets.** `.env.local` is never committed, so `npm run test:db`, `npm run db:migrate` and the browser checks happen on the owner's machine or in CI. Say what could not be run; never claim it passed.
- **Not in the repository, on purpose:** `.env.local`, `.claude/launch.json` (a local port choice), database dumps under `backups/`, spike evidence in the local scratchpad, the claude-mem helper memory. Nothing a session needs to decide or continue work may live only in those places (`ai/PROJECT_RULES.md` §13).
- **Do not work on the same files as a local session at the same time.** Before starting, `git pull`; before ending, commit and push, and write `ai/SESSION_HANDOFF.md` so the next session — on either side — can resume.

<!-- Framework-managed blocks (e.g. Next.js version-matched docs pointer) may be appended below this line. -->

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

