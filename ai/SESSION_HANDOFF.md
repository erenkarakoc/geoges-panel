# SESSION HANDOFF

Last updated: 2026-09-20

CURRENT PHASE: PHASE 06 — Validation Spikes

## Verified state

- SPIKE-08 (TASK-0089) passed its data-pipeline criteria: 48 checks on 50,001 synthetic records, shared RLS across two types, input validation, SQL field projection, links, search/report, retirement and old-definition reconstruction. List/filter p95 240/270 ms. Initial helper-table policies permitted a read-only user to append history; corrected and regression-tested. Retiring a searchable field left old vectors until rebuilt; definition retirement and search refresh were made atomic in the experiment.

- SPIKE-04/05/06 are complete in the stated spike scope (TASK-0086…TASK-0088). Seven versioning checks, ten dry-run checks, nine historical-condition checks, plus thirteen independent trace/owner checks passed. Report details and limitations are in the spike index. Twenty samples per historical query gave p95 238–241 ms on 500,006 synthetic rows. Real PostgreSQL cancellation produced a failed instance, an error trace and a queued notification intent; total failure handling was 2,796 ms including network and writes.

- Phases 00–05 are DONE. Phase 06 is active; product code resumes in Phase 07. The roadmap is authoritative.
- SPIKE-01/02/03: TASK-0082…TASK-0084, reports in the spike index. The first RLS fixture allowed self-grant through broad table privileges; demonstrated and repaired only in the throwaway schema. Twelve assertions pass on the optimized policies. Twenty timed samples per query give p95 239–240 ms for parameterized list/detail/stock transactions including three network round trips.
- Outbox: the old SKIP LOCKED selection permitted a later event from a locked record. Corrected head-per-record selection verified with 100 records × 100 events, three workers, process exit before commit, pause/resume and 500 duplicates. All ten checks pass. ADR-014 is unchanged; these are implementation constraints needed to satisfy it.
- SPIKE-07 retains its existing report. SPIKE-10 and SPIKE-11 are REVIEW, not DONE: PDF rendering and missing-rate/recovery behavior were not verified by their earlier evidence. No requirement is removed or waived.
- Resume phase pointers now have a deterministic consistency check (TASK-0085). The journal is append-only; do not rewrite it.

## Next work

1. Continue with SPIKE-12 (Turkish search), then SPIKE-14 (read-model rebuild). Read each architecture/requirement before writing a disposable experiment.
2. Finish the other experiments, including the reopened PDF/TCMB acceptance checks. Do not call Phase 06 complete until every exit criterion is met or explicitly waived by the owner.
3. Phase 07 adapter tests must preserve the restricted DB role, parameter binding, transaction-local identity, identity cleanup on failure, verified TLS, ordered event selection, atomic effect/delivery and duplicate suppression.

## Local experiment evidence

The scratchpad also contains custom8.mjs, custom8-review.mjs and custom8-regression.mjs. The spike schema retains c8_ tables and 50,001 records. The review retired the title field and rebuilt its search vectors; fixtures are not in their initial state. Do not blindly rerun: CREATE refuses existing tables, and defect-reproduction assertions expect pre-repair policies. Only the regression script is designed to roll back its new records. No product UI was written; real IAM, other scope/relation kinds and workflow integration remain Phase 09R acceptance work.

The same scratchpad now contains workflow456.mjs and workflow456-review.mjs. The first refuses existing wf_ tables and must not be blindly rerun. The second only reads completed experiment instances and compares them with independently specified paths/owners. The spike schema retains wf_ workflow/version/instance/effect/history fixture tables; these are sample data, not product schemas. Main execution uses one transition evaluator for real and dry modes. Dry mode uses READ ONLY; real mode records synthetic effects. Full IAM, all 14 node types, external sending, schema migrations and concurrent publication were not implemented.

Scripts remain outside the repository in the previous Claude session scratchpad, session id 6c9e96a0-f93a-4199-9423-9c176e20ea35, under scratchpad/spikes: resume-verify.mjs and resume-outbox.mjs. They are disposable and must never become product code. Re-running resume-outbox.mjs refuses existing review tables; inspect before reusing. The spike schema still contains synthetic data and review_* test tables. No production table was touched. Test users/assignments and the two order-counterexample events were cleaned up; no schema reset was performed.

The helper reads .env.local without printing it. Its TLS certificate verification is disabled and must not be copied into product code. Use bounded statements and sanitized error codes. Never print a URL, password or full connection exception. The current pooler host indicates eu-west-1, while PROJECT_CONTEXT describes Frankfurt; verify the actual project region before rollout instead of assuming those are identical.

## Standing rules

Turkish chat and docs, English ai records. Main only, frequent commits, full commit gate and automatic push. No real personal data. No custom UI without owner approval. No legacy-code access, no claude-mem worker stop and no cloud-sync. Do not change owner business decisions to make a spike pass.
