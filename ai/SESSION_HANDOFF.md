# SESSION HANDOFF

Last updated: 2026-09-20

CURRENT PHASE: PHASE 06 — Validation Spikes

## Verified state

- SPIKE-12 (TASK-0090) FAILED performance and remains REVIEW. Thirty main checks and six independent integrity checks passed, but 500k-row no-match full-text/fuzzy transactions reached p95 398/2846 ms (maximum 398/3181 ms). Existing-match cases p95 219–225 ms. RLS prevented GIN use in the initial query shape; a combined search-in-policy prototype also failed and was reverted. ADR-017 technical assumptions are under review, with D-239, RLS and the 300 ms target preserved. Eight spikes have passed; this is not the ninth.

- SPIKE-08 (TASK-0089) passed its data-pipeline criteria: 48 checks on 50,001 synthetic records, shared RLS across two types, input validation, SQL field projection, links, search/report, retirement and old-definition reconstruction. List/filter p95 240/270 ms. Initial helper-table policies permitted a read-only user to append history; corrected and regression-tested. Retiring a searchable field left old vectors until rebuilt; definition retirement and search refresh were made atomic in the experiment.

- SPIKE-04/05/06 are complete in the stated spike scope (TASK-0086…TASK-0088). Seven versioning checks, ten dry-run checks, nine historical-condition checks, plus thirteen independent trace/owner checks passed. Report details and limitations are in the spike index. Twenty samples per historical query gave p95 238–241 ms on 500,006 synthetic rows. Real PostgreSQL cancellation produced a failed instance, an error trace and a queued notification intent; total failure handling was 2,796 ms including network and writes.

- Phases 00–05 are DONE. Phase 06 is active; product code resumes in Phase 07. The roadmap is authoritative.
- SPIKE-01/02/03: TASK-0082…TASK-0084, reports in the spike index. The first RLS fixture allowed self-grant through broad table privileges; demonstrated and repaired only in the throwaway schema. Twelve assertions pass on the optimized policies. Twenty timed samples per query give p95 239–240 ms for parameterized list/detail/stock transactions including three network round trips.
- Outbox: the old SKIP LOCKED selection permitted a later event from a locked record. Corrected head-per-record selection verified with 100 records × 100 events, three workers, process exit before commit, pause/resume and 500 duplicates. All ten checks pass. ADR-014 is unchanged; these are implementation constraints needed to satisfy it.
- SPIKE-07 retains its existing report. SPIKE-10 and SPIKE-11 are REVIEW, not DONE: PDF rendering and missing-rate/recovery behavior were not verified by their earlier evidence. No requirement is removed or waived.
- Resume phase pointers now have a deterministic consistency check (TASK-0085). The journal is append-only; do not rewrite it.

## Next work

1. TASK-0091 revises and retests the PostgreSQL/RLS query/index design for SPIKE-12 (OQ-029), before SPIKE-14. The report records failed variants; do not repeat them blindly or replace RLS with a privileged user-query path. Include best-five-per-group ranking performance, which the first experiment tested for correctness only. No owner answer is needed for ordinary query optimization within existing requirements.
2. Finish the other experiments, including the reopened PDF/TCMB acceptance checks. Do not call Phase 06 complete until every exit criterion is met or explicitly waived by the owner.
3. Phase 07 adapter tests must preserve the restricted DB role, parameter binding, transaction-local identity, identity cleanup on failure, verified TLS, ordered event selection, atomic effect/delivery and duplicate suppression.

## Local experiment evidence

The scratchpad/spikes directory contains search12-setup.mjs, search12-probe.mjs, search12-review-plan.mjs, search12.mjs and search12-evidence.json (30 assertions and seven sets of 20 timings). The database retains s12_search with 500,000 synthetic rows, s12_access and s12_fold. pg_trgm was added to extensions. search12-policy-probe.mjs tested a transaction-rolled-back single-mode alternative; search12-policy.mjs installed a combined alternative that still scanned on empty results. search12-final-review.mjs restored the initial scope-only policy, removed the alternative lookup helper and passed six integrity checks. The one-scope user has 5,000 visible rows and 48 exact sogut matches; its access was restored. Setup refuses existing tables. Do not rerun policy alternatives without restoring the fixture afterward. Final user queries still have the known speed failure; no fix is claimed. Product source/tables are untouched.

The scratchpad also contains custom8.mjs, custom8-review.mjs and custom8-regression.mjs. The spike schema retains c8_ tables and 50,001 records. The review retired the title field and rebuilt its search vectors; fixtures are not in their initial state. Do not blindly rerun: CREATE refuses existing tables, and defect-reproduction assertions expect pre-repair policies. Only the regression script is designed to roll back its new records. No product UI was written; real IAM, other scope/relation kinds and workflow integration remain Phase 09R acceptance work.

The same scratchpad now contains workflow456.mjs and workflow456-review.mjs. The first refuses existing wf_ tables and must not be blindly rerun. The second only reads completed experiment instances and compares them with independently specified paths/owners. The spike schema retains wf_ workflow/version/instance/effect/history fixture tables; these are sample data, not product schemas. Main execution uses one transition evaluator for real and dry modes. Dry mode uses READ ONLY; real mode records synthetic effects. Full IAM, all 14 node types, external sending, schema migrations and concurrent publication were not implemented.

Scripts remain outside the repository in the previous Claude session scratchpad, session id 6c9e96a0-f93a-4199-9423-9c176e20ea35, under scratchpad/spikes: resume-verify.mjs and resume-outbox.mjs. They are disposable and must never become product code. Re-running resume-outbox.mjs refuses existing review tables; inspect before reusing. The spike schema still contains synthetic data and review_* test tables. No production table was touched. Test users/assignments and the two order-counterexample events were cleaned up; no schema reset was performed.

The helper reads .env.local without printing it. Its TLS certificate verification is disabled and must not be copied into product code. Use bounded statements and sanitized error codes. Never print a URL, password or full connection exception. The current pooler host indicates eu-west-1, while PROJECT_CONTEXT describes Frankfurt; verify the actual project region before rollout instead of assuming those are identical.

## Standing rules

Turkish chat and docs, English ai records. Main only, frequent commits, full commit gate and automatic push. No real personal data. No custom UI without owner approval. No legacy-code access, no claude-mem worker stop and no cloud-sync. Do not change owner business decisions to make a spike pass.
