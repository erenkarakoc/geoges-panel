# OPEN QUESTIONS

Last updated: 2026-09-15 · Format: `OQ-NNN` · Blocking = blocks the stated phase

## Phase 00 — open

| ID | Category | Question | Proposed answer | Blocks |
|---|---|---|---|---|
| OQ-007 | Domain | Confirm or correct proposed canonical English terms in `docs/domain/GLOSSARY.md` (işveren, hakediş, zayi vs fire vs hurda, götürü, cari hesap, teminat). | Review at Phase 01 kickoff | Phase 01 exit |

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
| OQ-017 | Package manager and runtime: npm (installed) vs pnpm/bun; Node 24 LTS? |

## Product — non-blocking until Phase 01/02

| ID | Question |
|---|---|
| OQ-020 | Data access approach: supabase-js/PostgREST vs direct Postgres client/ORM — decided in Phase 03 after spike. |
| OQ-021 | Pilot: which site and which users for Slice 1? |
| OQ-022 | Target dates or constraints for design completion and first pilot? |
| OQ-023 | Who approves business rules when owner is unavailable? |
| OQ-024 | Legal review of KVKK obligations before entering real HR data (RISK-001)? |
