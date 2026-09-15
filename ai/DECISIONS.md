# DECISIONS

Last updated: 2026-09-15

## PHASE DECISION SUMMARY — PHASE 00 (2026-09-15)

Decided by the owner in a four-round question session.

| ID | Decision | ADR |
|---|---|---|
| D-001 | Modular monolith with enforced module boundaries | ADR-001 |
| D-002 | Supabase Cloud (EU Frankfurt), portable toward self-hosted Supabase | ADR-002 |
| D-003 | Cloudflare R2 behind a storage port | ADR-003 |
| D-004 | Next.js hosted on own VPS; Cloud Run only for heavy workloads | ADR-004 |
| D-005 | Targeted flexibility: versioned rules as data, dynamic IAM, catalogs, typed custom fields, ports & adapters, outbox events, immutable ledgers, feature flags | ADR-005 |
| D-006 | Visual workflow designer with fixed node palette, versioned definitions, test-run before publish, no custom-code nodes; included in first release | ADR-006 |
| D-007 | Old codebases fully ignored; build from scratch | ADR-007 |
| D-008 | Design all modules first; validate risky assumptions with spikes; then vertical slices piloted module by module; first slice = Core + Site + Approvals + Cockpit | ADR-007 |
| D-009 | Risk-tiered quality gates; no separate reviewer agent — implementing model performs a distinct self-review step | ADR-008 |
| D-010 | UI exclusively COSS UI + Tailwind CSS; custom elements only after explicit owner approval; devl.dev as inspiration | ADR-009 |
| D-011 | English technical naming; Turkish UI | ADR-010 |
| D-012 | `/ai` English, `/docs` Turkish; UI texts inside components, Turkish only, no i18n framework | ADR-011 |
| D-013 | Excel/WhatsApp/Drive are not record systems; panel replaces Drive archive; tech providers and external APIs are allowed | ADR-012 |
| D-014 | Domains: `geogespanel.com` (no search indexing), `geoges.com` where needed; repo `github.com/erenkarakoc/geoges-panel` | ADR-012 |
| D-015 | Source of truth = Git + `/ai` + `/docs` + ADRs; claude-mem as helper memory for this project; `ui-ux-pro-max` disabled for this project; official skills audited then installed (Supabase, COSS, Vercel React, Cloudflare, Next.js version-matched docs, Tailwind CSS) | ADR-013 |
| D-016 | First release: online-only web. Deferred: data import, offline entry, native mobile | ADR-007, `ai/DEFERRED.md` |
| D-017 | KVKK: EU region only, no additional field encryption; recorded as RISK-001 | ADR-002 |
| D-018 | Flexibility is a primary quality attribute: architecture may be reshaped later through superseding ADRs | ADR-005 |

## Revisions to the original protocol prompt

| Prompt section | Revision |
|---|---|
| §7 Definition of Done | Applied per risk tier (T1/T2/T3) |
| §42 Independent review | Replaced by a documented self-review step by the implementing model |
| §57 Roadmap | Replaced by design-first + spikes + vertical slices roadmap |
| §70–71 Glossary examples | Public-tender examples (poz, rayiç, pursantaj, yaklaşık maliyet) removed; GEOGES domain terms used |
| §26 Tenant isolation, §29 payments | Not applicable to a single-company system unless reintroduced by change request |
| §73 Localization | No i18n framework; Turkish text inside components |
| §45 Skill set | Tailwind CSS added (no official skill exists → Tier C audit); Next.js via version-matched bundled docs |

## Skill decisions (2026-09-15)

| ID | Decision | Ref |
|---|---|---|
| D-019 | Skills are vendored into `.claude/skills/` from audited, pinned commits; no installer CLI | `ai/AI_SKILLS.md` |
| D-020 | Installed: supabase, supabase-postgres-best-practices, coss, coss-particles, react-best-practices, composition-patterns, cloudflare (no MCP), tailwind-4-docs (Lombiq) | ADR-013 |
| D-021 | Next.js guidance = version-matched bundled docs + `AGENTS.md` pointer (upstream skill discontinued) | ADR-013 |
| D-022 | claude-mem enabled at project scope, local-only; `ui-ux-pro-max` disabled at project scope | ADR-013, ADR-009 |

## Change requests

### CHG-001 — Early preview of authentication screens and application shell (RESOLVED)

- **Requested change:** Owner wants to see a first usable screen early — authentication pages and the general panel structure (navigation, layout) — without breaking the roadmap.
- **Reason:** Visibility and early feedback on look & feel before the long design phases finish.
- **Conflict:** ADR-007 (all design before product code).
- **Affected requirements:** Scope §2 (login, 2FA, role onboarding), §40–§43 (navigation, top bar, list/detail/form standards, light/dark, brand).
- **Affected features/tasks:** Phase 02 (UX), Phase 07 (foundation: scaffold, design tokens, app shell, IAM).
- **Affected database/APIs/permissions:** Depends on option — none for a UI-only preview.
- **Affected tests:** Preview must be excluded from product quality gates if throwaway, or meet T2 if kept.
- **Migration requirement / backward compatibility:** None for UI-only preview.
- **Risks:** Look & feel decided before UX analysis (rework); preview mistaken for real system; premature auth/data decisions if backend is included.
- **Options (to be decided by owner):**
  1. **UI preview right after Phase 00 (recommended):** Next.js + COSS + Tailwind scaffold with brand tokens, login / 2FA / password-reset / onboarding screens (devl.dev inspiration), app shell with role-filtered left navigation, top bar, light/dark mode and empty module pages. Mock login and mock data only — no Supabase, no real data, no deploy. Reviewed again in Phase 02; kept only if it passes Phase 02/07 standards.
  2. **Clickable prototype after Phase 02:** same scope, but built after UX flows are designed (less rework, later visibility).
  3. **Walking skeleton after Phase 00:** real Supabase Auth login + app shell on staging. Earliest real system, highest risk of premature auth/infra decisions.
- **Recommended approach:** Option 1, recorded as a new Phase 00B ("Early UI Preview") with its own exit criteria; ADR-007 amended rather than replaced.
- **Owner decision (2026-09-15):** No early preview. The first screen is shown after the critical infrastructure is complete — "no rush". Implemented as Milestone M1 at the end of Phase 07 (real authentication + application shell on staging). ADR-007 unchanged; roadmap approved with this milestone.
- **Status:** RESOLVED

## Further decisions (2026-09-15)

| ID | Decision | Ref |
|---|---|---|
| D-023 | Roadmap approved, including Milestone M1 in Phase 07 | `ai/MASTER_ROADMAP.md`, CHG-001 |
| D-024 | Tailwind docs snapshot: owner accepts the Tailwind docs license for local use on this machine only; snapshot is never committed or pushed | OQ-008, `ai/AI_SKILLS.md` |
| D-025 | claude-mem telemetry declined | OQ-009 |
| D-026 | UI label for the `SIT` (Site Operations) module and the site concept is "Şantiye" (not "Saha"); code term stays `site` | Owner 2026-09-15, `docs/domain/GLOSSARY.md` |

## PHASE 01 — glossary round 1 (2026-09-15, OQ-007 partial)

| ID | Decision | Ref |
|---|---|---|
| D-027 | One company record (`Party`) per real-world firm with roles (`client`, `customer`, `supplier`, …); client of application work and product-sales customer are the same record when it is the same firm; party account balance is per party | Scope §5.3, §6.9, §22.6 |
| D-028 | Loss concepts confirmed as distinct record types: Process Loss (fire) = measured in/out quantity difference in factory processing, galvanizing or shipment (weighed); Damaged Unit (zayi) = unusable panel/product (quantity + reason + photo mandatory); Scrap (hurda) = sellable material separated from process loss or damaged units | Scope §10.8, §18.6, §20.1 |
| D-029 | Guarantees take three forms, all tracked: letter of guarantee, retention deducted from client progress payments, cash guarantee | Scope §16.1, §24.1, §24.7 |
| D-030 | Subcontractor payment methods: unit rate (approved quantity × unit price), lump sum (fixed agreed total for work or a part), day rate (days or person-days). Extends scope §15.1/§16.4 wording, which described unit rate only; requirements must cover all three | Scope §15.1, §16.4 |

## PHASE 01 — glossary round 2 (2026-09-15, OQ-007 open terms closed)

| ID | Decision | Ref |
|---|---|---|
| D-031 | "Kademe" = the course (horizontal row / height level) a panel sits in on the wall (1st course, 2nd course…); panel type definitions may state which course(s) they are used in | Scope §10.1, §36.1 |
| D-032 | Lug is a single standard item tracked by quantity (no lug types) | Scope §17.4, §18.1 |
| D-033 | A party with several roles (e.g. client and supplier) has one net party account balance; receivables and payables offset automatically | Scope §22.6, D-027 |
| D-034 | Party account balances are kept per currency (e.g. EUR balance), each shown with its current TRY equivalent; exchange differences are calculated separately. Combined with D-033: one net balance per party per currency | Scope §22.5, §22.6 |
