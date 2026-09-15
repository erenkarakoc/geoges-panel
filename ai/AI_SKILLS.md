# AI SKILL REGISTRY

Last updated: 2026-09-15

## Policy

- Tiers: **A** first party (technology vendor) · **B** established third party · **C** community (full audit mandatory).
- Before install: review repository, maintainer, `SKILL.md` and all bundled scripts, shell commands, network calls, filesystem access, credentials, MCP connections, license, maintenance activity.
- **Installation method (decided 2026-09-15):** skill folders are copied verbatim from an audited commit into `.claude/skills/<name>/` and committed to this repository. No installer CLI is used. Local edits to vendored skills are forbidden; project-specific guidance goes into project rules or `geoges-*` skills.
- Updates follow: current commit → new commit → changelog → breaking changes → security review (diff of the skill folder) → replace folder → update this registry.
- Activation is task-scoped (Supabase task → Supabase skills; UI task → COSS skills; React → Vercel skills; R2 → Cloudflare skill; styling → Tailwind docs skill).
- Precedence on conflict: project rules > ADRs > project docs > official framework guidance > skills > pretrained knowledge.

## Installed skills (project scope, `.claude/skills/`)

| Skill | Provider | Source (repo @ commit : path) | Tier | Purpose | Files | Installed | Scope / triggers | Permissions / side effects | Risk | Last audit | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|
| supabase | Supabase | `supabase/agent-skills` @ `8331f910845103c08d51f6ca1d86ebb7d1f745e3` : `skills/supabase` | A | Auth, RLS, SSR, Realtime, Storage, Edge Functions, Cron, Queues, CLI, security | 4 (md) | 2026-09-15 | any Supabase task | instructions only; repo MIT | Low | 2026-09-15 | INSTALLED |
| supabase-postgres-best-practices | Supabase | `supabase/agent-skills` @ `8331f91…` : `skills/supabase-postgres-best-practices` | A | Schema, indexes, RLS, migrations, query performance | 36 (md) | 2026-09-15 | database design / migrations | instructions only; MIT | Low | 2026-09-15 | INSTALLED |
| coss | COSS | `cosscom/coss` @ `e937becd2d5ffb5c621eed6f8b1f223cbb6051e7` : `apps/ui/skills/coss` | A | Correct COSS UI primitives, composition, styling, migration | 63 (md) | 2026-09-15 | any UI task | instructions only; `apps/ui` is MIT (rest of repo AGPLv3 — not vendored) | Low | 2026-09-15 | INSTALLED |
| coss-particles | COSS | `cosscom/coss` @ `e937bec…` : `apps/ui/skills/coss-particles` | A | COSS particle (pattern) catalog | 1 (md) | 2026-09-15 | UI composition | instructions only; MIT | Low | 2026-09-15 | INSTALLED |
| react-best-practices | Vercel | `vercel-labs/agent-skills` @ `063bee94c3f4df8453406c830b0a7df0f2860278` : `skills/react-best-practices` | A | React/Next.js performance: waterfalls, bundle size, re-renders, server/client boundaries | 76 (md + metadata.json) | 2026-09-15 | React/Next.js implementation & review | instructions only; **no license file in repo** (noted) | Low | 2026-09-15 | INSTALLED |
| composition-patterns | Vercel | `vercel-labs/agent-skills` @ `063bee9…` : `skills/composition-patterns` | A | React composition: compound components, explicit variants, React 19 patterns | 14 (md + metadata.json) | 2026-09-15 | wrapping COSS components, component APIs | instructions only; no license file | Low | 2026-09-15 | INSTALLED |
| cloudflare | Cloudflare | `cloudflare/skills` @ `b052c32bab7dd493513260228a36c88294f343f1` : `skills/cloudflare` | A | R2, platform conventions, security | 289 (md) | 2026-09-15 | R2 / Cloudflare tasks | instructions only; Apache-2.0; plugin/MCP form **not** installed | Low | 2026-09-15 | INSTALLED |
| tailwind-4-docs | Lombiq | `Lombiq/Tailwind-Agent-Skills` @ `634ec184c36e495fae1d8cf7975df7e6969e3a89` : `skills/tailwind-4-docs` | C | Local, version-matched Tailwind CSS v4 documentation snapshot | 5 (md, txt, 1 Python script) | 2026-09-15 | styling tasks | `scripts/sync_tailwind_docs.py` clones `tailwindlabs/tailwindcss.com` (network, git, Python 3.8+) and copies docs into the skill folder; **requires accepting the Tailwind docs license** (source-available, not open source). Skill is BSD-3-Clause. | Medium | 2026-09-15 (script reviewed) | INSTALLED — docs snapshot initialized locally on 2026-09-15 from `tailwindlabs/tailwindcss.com` @ `7f92c2213315c195dae583d68752da4042da3ade` (237 files). Owner accepted the docs license for local use only (D-024). Snapshot is git-ignored; `references/docs-source.txt` is marked `skip-worktree` so local snapshot metadata is never committed. Refresh: re-run the script with `--accept-docs-license` (weekly or when upgrading Tailwind). |

## Framework guidance without a skill

| Guidance | Source | Status |
|---|---|---|
| Next.js version-matched docs | Bundled in the `next` package at `node_modules/next/dist/docs/`; `next dev` maintains a pointer block in `AGENTS.md`. The former `next-best-practices` skill (`vercel/nextjs-skills`) has been emptied upstream in favor of this. | PLANNED — active when the app is scaffolded (Phase 07 or CHG-001) |

## Plugins (Claude Code)

| Plugin | Scope | Setting | Notes | Status |
|---|---|---|---|---|
| claude-mem@thedotmack | project (`.claude/settings.json`) | enabled | Helper memory only (ADR-013). Existing `~/.claude-mem/settings.json`: local Chroma, worker on 127.0.0.1, provider via Claude CLI auth, no cloud sync token. **Cloud Sync (cmem.ai) must never be enabled** — it uploads prompts and observation narratives. Telemetry disabled (D-025) via `CLAUDE_MEM_TELEMETRY=false` in project `.claude/settings.json` env and in `~/.claude-mem/settings.json` (the worker is shared across projects). Worker and database are shared across all projects on this machine. | ENABLED (takes effect next session) |
| ui-ux-pro-max@ui-ux-pro-max-skill | project (`.claude/settings.json`) | disabled | Conflicts with COSS-only design authority (ADR-009). Remains enabled for other projects at user scope. | DISABLED for this project |

## Project-specific skills (to create as the project matures)

| Skill | Content | Earliest phase |
|---|---|---|
| geoges-architecture | Module boundaries, layering, ports, outbox usage, ADR summaries | Phase 03 |
| geoges-database-conventions | Naming, RLS patterns, audit columns, ledgers, effective dating, migrations | Phase 04 |
| geoges-ui-patterns | COSS usage, list/detail/form standards, state matrix, Turkish copy rules | Phase 02 |
| geoges-feature-development | Question round → decision summary → plan → implement → self-review → docs flow | Phase 07 |
| geoges-testing | Test pyramid, fixtures without real personal data, RLS tests | Phase 07 |
| geoges-security | Data classification, sensitive fields, KVKK rules, authz checklist | Phase 03 |
| geoges-domain | Glossary, business rules (casting, installation, strips, progress payments, costing) | Phase 01 |
| geoges-deployment | Environments, CI/CD, rollback, backup restore | Phase 05 |
