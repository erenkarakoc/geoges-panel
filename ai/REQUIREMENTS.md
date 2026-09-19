# REQUIREMENTS INDEX

Status: COMPLETE for Phase 01 — 438 requirements in 26 files, all CONFIRMED; MIG deferred (DEF-001) · Last updated: 2026-09-19

ID format: `REQ-<MODULE>-<NNN>` (see `docs/standards/ID_STANDARDS.md`). Requirement bodies are written in Turkish under `docs/requirements/`.

## Module → requirement files

| Module | REQ file | REQ count |
|---|---|---|
| IAM | `docs/requirements/REQ-IAM.md` | 27 (CONFIRMED) |
| RPT (cockpit, reports) | `docs/requirements/REQ-RPT.md` | 23 (CONFIRMED) |
| WFL (approvals, rules, workflow, end-to-end flows, capability catalog, record-type builder) | `docs/requirements/REQ-WFL.md` | 39 (CONFIRMED) |
| CRM | `docs/requirements/REQ-CRM.md` | 14 (CONFIRMED) |
| QTE | `docs/requirements/REQ-QTE.md` | 18 (CONFIRMED) |
| PRJ | `docs/requirements/REQ-PRJ.md` | 11 (CONFIRMED) |
| SIT | `docs/requirements/REQ-SIT.md` | 35 (CONFIRMED) |
| FIN (incl. progress payments, period close) | `docs/requirements/REQ-FIN.md` | 30 (CONFIRMED) |
| FAC | `docs/requirements/REQ-FAC.md` | 10 (CONFIRMED) |
| INV | `docs/requirements/REQ-INV.md` | 27 (CONFIRMED) |
| PUR | `docs/requirements/REQ-PUR.md` | 11 (CONFIRMED) |
| FIN / EQP (ancillary income, service vehicle) | `docs/requirements/REQ-FIN.md`, `REQ-EQP.md` | FIN-012, EQP-017, EQP-021 |
| EQP | `docs/requirements/REQ-EQP.md` | 21 (CONFIRMED) |
| HR | `docs/requirements/REQ-HR.md` | 16 (CONFIRMED) |
| CMP | `docs/requirements/REQ-CMP.md` | 17 (CONFIRMED) |
| TSK (tasks, notifications, escalation) | `docs/requirements/REQ-TSK.md` | 13 (CONFIRMED) |
| SUP | `docs/requirements/REQ-SUP.md` | 5 (CONFIRMED) |
| INT | `docs/requirements/REQ-INT.md` | 14 (CONFIRMED) |
| PRF | `docs/requirements/REQ-PRF.md` | 20 (CONFIRMED) |
| QHS | `docs/requirements/REQ-QHS.md` | 16 (CONFIRMED) |
| MTG | `docs/requirements/REQ-MTG.md` | 8 (CONFIRMED) |
| DOC | `docs/requirements/REQ-DOC.md` | 10 (CONFIRMED) |
| STR | `docs/requirements/REQ-STR.md` | 8 (CONFIRMED) |
| ADM (master data, calendar, panel and strip type catalogs, exchange rate) | `docs/requirements/REQ-ADM.md` | 15 (CONFIRMED) |
| AUD (audit, revision requests) | `docs/requirements/REQ-AUD.md` | 10 (CONFIRMED) |
| MIG (data import — DEFERRED) | `docs/requirements/REQ-MIG.md` | — |
| NFR (UI standards, alerts, platform) | `docs/requirements/REQ-NFR.md` | 20 (CONFIRMED) |
| NFR / platform — site-wide search (owner decision, no scope section) | `docs/requirements/REQ-NFR.md` | NFR-012 |

## Scope mapping (TASK-0039, 2026-09-19)

Which scope section each requirement came from is no longer cited by section number in the records. The permanent section → requirement map is the table at the end of `docs/requirements/README.md`: all 243 headings of the functional scope are mapped (219 directly, 14 through their subsections, 10 through their parent). The scope text itself is kept in Git at tag `scope-archive`. Earlier remaps (panel and strip type definitions to ADM, the quality/OHS limit on acceleration to INT, the end-to-end flows to WFL under CHG-006) are reflected in that map.

## Coverage rule

Phase 01 exit requires every scope section to be mapped to requirements (done, see the map); each REQ records: ID, title, description, source, layer, priority, tier (T1/T2/T3), acceptance criteria, owner module, linked features/tasks.
