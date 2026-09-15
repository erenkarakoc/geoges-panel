# DEFERRED

Last updated: 2026-09-15 · Deferred items are designed (where stated) but not built until reactivated by a recorded decision.

| ID | Item | Source | Reason | Design done in | Revisit at | Depends on |
|---|---|---|---|---|---|---|
| DEF-001 | Data import: Excel tracking files, previous MongoDB panel, Drive archive, bulk master data import | Scope §36.5, §33.4 | Owner decision: design now, build later; initial master data and opening stock entered manually at slice go-live | Phase 01 (REQ-MIG), Phase 04 (import staging tables) | Before Phase 19 rollout | DOC, INV, HR, EQP modules |
| DEF-002 | Offline data entry on site (daily log, photos, waste, crane log) with sync and conflict handling | Scope §40.2 | First release online-only | Phase 03 (keep write paths idempotent and client-ID friendly so offline can be added) | After Slice 1 pilot feedback | SIT, EQP, DOC |
| DEF-003 | Native mobile application | Scope §40.2 | Web app must stabilize first | — | After Phase 19 | All slices |
| DEF-004 | Migration from Supabase Cloud to self-hosted Supabase on own infrastructure | ADR-002 | Start managed; keep portable | Phase 03/05 portability rules | When cost, KVKK or control requires | Infra runbooks |
| DEF-005 | Google Cloud Run workers for heavy processing | ADR-004 | Only if a workload needs it | — | When a job exceeds VPS capacity | Job port (Phase 03) |
