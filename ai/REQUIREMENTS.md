# REQUIREMENTS INDEX

Status: IN PROGRESS — requirement extraction in Phase 01; first file REQ-WFL (2026-09-18) · Last updated: 2026-09-18

ID format: `REQ-<MODULE>-<NNN>` (see `docs/standards/ID_STANDARDS.md`). Requirement bodies are written in Turkish under `docs/requirements/`.

## Source → module mapping (to be decomposed into REQs in Phase 01)

| Module | Source sections (`docs/sources/functional-scope.md`; "Mimari §" = `docs/sources/architecture-principles.md`) | REQ file | REQ count |
|---|---|---|---|
| IAM | §2 | `docs/requirements/REQ-IAM.md` | 27 (CONFIRMED) |
| RPT (cockpit, reports) | §3, §14, §34 | `docs/requirements/REQ-RPT.md` | 14 (CONFIRMED; §34 pending) |
| WFL (approvals, rules, workflow, end-to-end flows, capability catalog, record-type builder) | §4, §13, §37, §45, Mimari §6, §13; CHG-006 (D-077…D-105) | `docs/requirements/REQ-WFL.md` | 39 (CONFIRMED) |
| CRM | §5 | `docs/requirements/REQ-CRM.md` | — |
| QTE | §6 | `docs/requirements/REQ-QTE.md` | — |
| PRJ | §7, §8, §10.1–10.2 | `docs/requirements/REQ-PRJ.md` | — |
| SIT | §9–§13, §15, §44 | `docs/requirements/REQ-SIT.md` | 35 (CONFIRMED) |
| FIN (incl. progress payments, period close) | §16, §22 | `docs/requirements/REQ-FIN.md` | — |
| FAC | §17 | `docs/requirements/REQ-FAC.md` | — |
| INV | §18.1, §18.4–§18.15, §19, §20.1 | `docs/requirements/REQ-INV.md` | — |
| PUR | §18.2–§18.3, §18.16 | `docs/requirements/REQ-PUR.md` | — |
| FIN / EQP (ancillary income, service vehicle) | §20.2–§20.4 | `docs/requirements/REQ-FIN.md`, `REQ-EQP.md` | — |
| EQP | §21 | `docs/requirements/REQ-EQP.md` | — |
| HR | §23 | `docs/requirements/REQ-HR.md` | — |
| CMP | §24, §31 | `docs/requirements/REQ-CMP.md` | — |
| TSK (tasks, notifications, escalation) | §25.1–§25.6 | `docs/requirements/REQ-TSK.md` | — |
| SUP | §25.7 | `docs/requirements/REQ-SUP.md` | — |
| INT | §26, §27, §8.3 | `docs/requirements/REQ-INT.md` | — |
| PRF | §28 | `docs/requirements/REQ-PRF.md` | — |
| QHS | §29, §30 | `docs/requirements/REQ-QHS.md` | — |
| MTG | §32 | `docs/requirements/REQ-MTG.md` | — |
| DOC | §33 | `docs/requirements/REQ-DOC.md` | — |
| STR | §35 | `docs/requirements/REQ-STR.md` | — |
| ADM (master data, calendar) | §36.1–§36.4, §23.9 | `docs/requirements/REQ-ADM.md` | — |
| AUD (audit, revision requests) | §38, §37.1 | `docs/requirements/REQ-AUD.md` | — |
| MIG (data import — DEFERRED) | §36.5, §33.4 import part | `docs/requirements/REQ-MIG.md` | — |
| NFR (UI standards, alerts, platform) | §1, §39–§43, §40.2, §46 | `docs/requirements/REQ-NFR.md` | — |
| NFR / platform — site-wide search (owner decision, no scope section) | D-044 | `docs/requirements/REQ-NFR.md` | — |

## §45 moved (CHG-006, 2026-09-18)

§45 (end-to-end flows) moved from `REQ-NFR` to `REQ-WFL`: the flows are workflow-engine templates (D-086, D-089). This closes CHG-005 finding 9. The record-type builder (D-079) is also filed under WFL until Phase 03 names its owner module.

## Coverage rule

Phase 01 exit requires every section above to be fully decomposed; each REQ records: ID, title, description, source section, priority, tier (T1/T2/T3), acceptance criteria, owner module, linked features/tasks.
