# PROJECT CONTEXT

Last updated: 2026-09-15

## Company

GEOGES Geosentetik ve Donatılı Duvar Sistemleri İnş. San. ve Dış Tic. A.Ş. — founded 2024, Ankara.

- **Business lines:** mechanically stabilized earth (reinforced earth / "toprakarme") walls with galvanized steel strips (core), geosynthetics, gabion walls, vehicle/pedestrian guardrails, material sales (geogrid, geomembrane, geocell, geonet, steel strip).
- **Organization:** head office (general manager, site coordinators, technical office, HR, accounting), a rented factory (strip punching/processing, lug production, repairs), and multiple project sites across Türkiye. 50+ staff.
- **Operating models per site:** labor subcontractor paid per m² (company provides cranes, operators, molds, materials, food, lodging) or in-house crews.
- **Core production loop:** panels are always cast on site; installation alternates with backfill by the client; steel strips flow haddeci (rolling mill) → factory → galvanizer → site.
- **Current pain:** work tracked in Excel and WhatsApp, verbal and person-dependent; no reliable profit/loss, stock or accountability picture.

## Product goal

A single company operating system where:
- no work counts as done without a record (quantity, time, photo/document, owner, approval),
- data is entered once at its source and derived everywhere else,
- the owner can see and audit the entire company remotely, including the general manager,
- the system detects delays, waste, idle resources, risks and upcoming obligations and pushes people to act,
- the company can later be handed to professional management without loss of control.

Excel, WhatsApp and Drive are not used as record systems; the panel replaces the Drive archive.

## Source inputs (Phase 00)

| File | Role |
|---|---|
| `Geoges Panel Özellik Yapısı.md` | Functional scope (46 sections) — primary requirement source |
| `Geoges Panel Mimari.md` | Architectural principles (single source of truth, event-centric, workflow engine, audit, permissions) |
| `AI_Destekli_Proje_Gelistirme_Ana_Promptu.md` | Engineering protocol, revised into `ai/PROJECT_RULES.md` |

Older attempts in `../eski/` were analyzed to extract missed requirements (already merged into the functional scope). **Their code is out of scope and must not be reused** (ADR-007).

## Users

Owner (full visibility, cannot be restricted by anyone), general manager, coordinators, site engineers, foremen/crew leads, subcontractor crew leads (limited operational view), technical office, HR, accounting, factory staff, crane operators, sales/business development, OHS, and future roles created dynamically. Users may hold multiple roles and time-bound delegated roles.

## Technology direction (decided, details designed in Phase 03–05)

| Area | Choice |
|---|---|
| App | Next.js (current: 16.x) + TypeScript, React 19 |
| UI | COSS UI (Base UI) + Tailwind CSS v4 |
| Database/Auth | Supabase Cloud, EU (Frankfurt) region; portable toward self-hosted Supabase |
| Files | Cloudflare R2 behind a storage port |
| Hosting | Own VPS (Docker, reverse proxy); Google Cloud Run only for heavy workloads if needed |
| Source control | GitHub `erenkarakoc/geoges-panel` (private) |
| Domains | `geogespanel.com` (app, not indexed by search engines); `geoges.com` available where needed |
| External data | Free/public APIs allowed (e.g. CBRT exchange rates, weather) with manual fallback |

## Delivery strategy

1. Design all modules (requirements, domain, UX, architecture, database, infrastructure).
2. Validate risky assumptions with throwaway spikes.
3. Build the foundation, then vertical module slices; pilot each slice with real users.
4. First slice: Core + Site daily log + Approvals + Site detail + Owner cockpit.
5. First release is online-only web; offline entry and native mobile are deferred.

## Constraints

- Owner is not a software developer: business decisions come from the owner, engineering decisions must be explained and recorded.
- KVKK: sensitive employee data will be stored in an EU cloud region (accepted active risk).
- Search engines must not index the application.
