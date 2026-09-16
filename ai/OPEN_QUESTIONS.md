# OPEN QUESTIONS

Last updated: 2026-09-15 · Format: `OQ-NNN` · Blocking = blocks the stated phase

IDs are never reused. OQ-018 and OQ-019 were never assigned (numbering gap, no missing records).

## Phase 00 — open

| ID | Category | Question | Proposed answer | Blocks |
|---|---|---|---|---|
| OQ-007 | Domain | Confirm or correct proposed canonical English terms in `docs/domain/GLOSSARY.md`. Rounds 1–2 answered 2026-09-15 (D-027…D-034); no OPEN terms remain. Remaining PROPOSED terms are reviewed per module during Phase 01 requirement rounds. | Continue in Phase 01 question rounds | Phase 01 exit |

## Phase 00 — answered (2026-09-15)

| ID | Answer |
|---|---|
| OQ-001 | Roadmap approved. CHG-001 resolved: first screen after critical infrastructure (Milestone M1, Phase 07). |
| OQ-008 | Download Tailwind docs snapshot on this machine only, accepting the license for local use; never commit (D-024). |
| OQ-009 | Decline claude-mem telemetry (D-025). |
| OQ-002 | Commit + push approved. |
| OQ-003 | Supabase, COSS, Vercel React, Cloudflare (without MCP) approved. |
| OQ-004 | claude-mem local-only approved. |
| OQ-005 | Tailwind: Lombiq `tailwind-4-docs` (best available; no official skill). |
| OQ-006 | Next.js: no separate skill exists anymore; version-matched bundled docs + `AGENTS.md` pointer used when app is scaffolded. Vercel `composition-patterns` added. Skills vendored from pinned commits (no CLI). |

## Phase 01/02 — UI structure

| ID | Category | Question | Proposed answer | Blocks |
|---|---|---|---|---|
| OQ-025 | UI/UX | ANSWERED 2026-09-16 → D-051: "Projeler" above "Şantiyeler" in "Şantiye & Günlük"; "Talepler & Müşteriler" first in "Ticari". Implemented in the navigation registry. | — | — |
| OQ-027 | UI/UX | Which flow methods are adopted on top of the navigation skeleton (CHG-004, D-054…D-056): (1) queue mode — approving a record pulls the next one in automatically instead of returning to a list; (2) persistent role-specific primary action in the toolbar; (3) stepped entry for the daily site log (§9.4 has 15 sections) plus a date strip instead of module tabs inside a site; (4) notification-driven navigation, where a task or notification drops the user straight into the work (§25.4–§25.5). Shown as demonstrations in the TASK-0031 prototype so the owner can judge them in context. | Adopt 1, 2 and 4 now; 3 with the site module design in Phase 02 | Phase 02 screen design |

## Infrastructure & operations — non-blocking until Phase 05

| ID | Question |
|---|---|
| OQ-010 | VPS: provider, location (Türkiye/EU), CPU/RAM/disk; already purchased? |
| OQ-011 | Staging: same VPS (separate containers) or separate server? |
| OQ-012 | Supabase plan per environment; separate Supabase projects for dev/staging/prod? |
| OQ-013 | Offsite backup target for database and R2 files. |
| OQ-014 | Error tracking & monitoring tool. |
| OQ-015 | Email: provider of `info@` mailbox and transactional sender; which domain (`geoges.com` vs `geogespanel.com`)? |
| OQ-016 | Web push notifications in the first (online-only) release? |
| OQ-017 | Package manager and runtime: npm (installed) vs pnpm/bun; Node 24 LTS? — Provisional for M0 (2026-09-16): npm 11 + Node 24 (`engines.node >=24`), exact-pinned versions and committed lockfile; final decision in Phase 05/07. |

## Product — non-blocking until Phase 01/02

| ID | Question |
|---|---|
| OQ-020 | Data access approach: supabase-js/PostgREST vs direct Postgres client/ORM — decided in Phase 03 after spike. |
| OQ-021 | ANSWERED 2026-09-16 → D-048: first pilot runs on sample data; no pilot site or user group named yet. |
| OQ-022 | ANSWERED 2026-09-16 → D-049: no target date; not schedule-driven. |
| OQ-023 | ANSWERED 2026-09-15 → D-041: owner-designated delegate for an owner-defined period; all actions reported to the owner. |
| OQ-024 | ANSWERED 2026-09-16 → D-050: no legal review commissioned; RISK-001 stays open and is raised again before real HR data is entered. |
| OQ-026 | Password policy (minimum length, complexity, expiry) and account lockout after repeated failures (scope §2.8). M0 uses a provisional 8-character minimum in `auth-schemas.ts`; Supabase enforces its own project policy on top. Decide in Phase 03 security design and align the Supabase project setting with it. |
