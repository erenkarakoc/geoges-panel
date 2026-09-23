# CHANGELOG

## 2026-09-23 — Product MCP server added to the plan (Phase 15M)

- The owner asked for an MCP server for the finished product and answered its two open questions: panel data may reach a cloud model, and the channel is open to everything the asking person is authorised for. Recorded as ADR-019 (Önerildi) and D-267, with Phase 15M in the master roadmap, TASK-0114 in the task register and a row in the root roadmap.
- The server runs inside the panel with no authority of its own: every call runs as the person through runAsUser and the same row level security, so the channel sees exactly what they see on screen. The tool surface is collected from each module's own registration, like search projections, which is why it comes after the slices.
- Two records that said the opposite were corrected rather than left to contradict it: REQ-INT-002's ban is narrowed to recommendation generation (rules only, no model, D-195 unchanged), and RISK-001 keeps covering development sessions while the product channel becomes its own item.
- Still open: D-268 (a write surface limited to tasks, notes, revision requests and drafts) awaits the owner's approval, and OQ-035 asks for the KVKK cross-border basis, tied to OQ-024. No Phase 07 work is affected.

## 2026-09-23 — Search helpers carry their normalizer version

- TASK-0110: 0029 adds `normalization_version` to `core.search_word` and `core.search_word_bucket` and extends both primary keys with it, so two normalizer generations can sit side by side instead of sharing a bucket or a count. Partial indexes for foreign versions stay empty in a healthy index, as in 0027.
- Maintenance writes only the version in force, evicts a record from a foreign generation's bucket and recounts within one version; the read path (bucket narrowing, posting join, spelling suggestion) reads only the version in force, so another generation's bucket can never narrow a record out of an answer. `core.search_integrity()` compares buckets and vocabulary per version. No permission, HTTP API, business rule or interface change.
- Verification: 56 search DB tests (5 new version cases), 198 database tests across 15 files, 273 unit tests, format and build pass locally; the 0029 down/up round trip leaves bucket contents and the integrity report identical. CI 35862720223 green: 196 DB tests including all 56 search tests before and after a full rollback and reapply.
- Review: the down migration restores the previous function bodies first and refuses rather than deleting rows left from another generation. Read-time helper consistency limited to visible records, production-scale acceptance and OQ-034 remain open.

## 2026-09-23 — Independent search helper integrity

- TASK-0110: 0028 adds a worker-only invoker integrity function, deriving expected words and helpers directly from indexed text. It detects mutually consistent corruption across helpers, posting visibility/version drift, exact bucket differences, vocabulary counts and row normalization drift. No application permission or search-query change.
- Publication refuses any mismatch before updating version/audit; the read-only CLI shares the same SQL and reports only bigint counts under a 60-second limit. No business data or helper table is removed by the down migration.
- Verification: 51 search DB tests including 19 new fault/permission/rollback cases, 273 unit tests and production build pass. CLI after cleanup: zero indexed rows and zero mismatches. Warm small-fixture p95 263 ms/max 264 ms. Code 7490e1c passed CI 35857129525: 191 DB tests including 51 search tests, before/after full rollback/reapply; two live R2 tests skipped without credentials.
- Review: operational full scan, not user-visible global diagnostics; no definer privilege escalation or raw records logged. Bucket/vocabulary version partition, visible-only read-time checks, production-scale acceptance and OQ-034 remain open.

## 2026-09-23 — Search pre-publication catch-up

- TASK-0110: capture newly visible source events after scanning, refresh staged projections and publish atomically. Compare visible ID sets rather than relying on max(id), so an earlier allocated event that commits late is included. Copy historical IDs only; fetch payloads only for changed events.
- Finite statement cut, READ COMMITTED guard, exact addition/removal counts and shared live/rebuild record-id parsing. Catch-up does not replay subscribers or acknowledge deliveries; failures roll back. Audit adds only event count and watermark. No migration or visibility rule change.
- Validation: 30 search tests passed together, then the added deletion case and related races passed (4); final SQL optimization passed late-commit/post-cut tests (2). Total 32 search tests defined; quality gate 273 unit tests and build passed. CI pending. Remote small-fixture p95 274 ms/max 278 ms; production-scale acceptance remains open.
- CI 35832296803 caught a pagination defect after rollback/reapply: ORDER BY id selected the text output alias. The fix orders by the qualified bigint column; a new passing regression covers digit boundaries and adjacent IDs above JavaScript safe integer precision (32 search tests now). Fix 73116da passed CI 35832578935: 273 unit tests and 172 DB tests (32 search), before and after full rollback/reapply; two live R2 tests skipped without credentials.
- Self-review preserved transaction atomicity, RLS readers, late low-ID events and ordinary post-cut delivery. OQ-034 is still pending; roadmap and source/rebuild contracts updated.

## 2026-09-23 — Search rebuild concurrency tests

- TASK-0110: three integration scenarios use real source/outbox transactions and separate PostgreSQL connections. Lock contention is observed with pg_blocking_pids; readers retain the old full index while the rebuild is uncommitted.
- Update/scope move, delete and insertion behind the scan cursor converge after delivery on both rebuild commit and rollback; duplicate delivery keeps ids/results stable; a rolled-back source write publishes nothing. Assertions compare all three helpers and row versions.
- Validation: all three new DB scenarios and 273 unit tests passed locally; commit 9b6a9f9 passed CI 35830079315, including all 26 search tests and full apply/down/up. Cleanup verified zero test schema/index rows/events/roles.
- No runtime code, permission rule or migration changed. The marked synthetic schema and test rows are cleaned; genuine rebuild metadata/audit remains. Large-scale performance and pre-publication high-watermark catch-up remain acceptance gaps. OQ-034 still awaits an explicit visibility choice.

## 2026-09-23 — Search normalization metadata

- TASK-0110: migration 0027 adds explicit row/posting normalization versions and backfills posting projection versions from each row. Atomic indexing and source rebuild keep them aligned; older events leave metadata intact.
- RLS-protected reads reject stale visible requested types with a fixed error; hidden stale records produce no error signal. Partial mismatch indexes keep the healthy path small. Rebuild comparison and CLI diagnostics include version agreement.
- Validation: apply/down preflight, 22 search DB tests plus new rollback/backfill regression, 273 unit tests, production build and clean diagnostics pass. Latest 56-row/20-warm-sample p95/max 255 ms. Production-scale acceptance remains open. Code commit 3d493bd passed CI 35811145952, including clean apply/down/up and all 23 search tests.
- OQ-034 records the pending owner decision on ANY/ALL coverage for one multi-scope record; no visibility expansion assumed. Root roadmap refreshed.

## 2026-09-23 — Search palette completion work and clean-install repair

- TASK-0110: owning list destinations, five per type, partial failure handling, permission-revalidated recent paths, quick task action, archive target and fullscreen phone palette with the existing COSS footer.
- Source rebuild now stages projections, compares and publishes the new version atomically; existing internal search ids remain stable. Migrations 0022/0023 also protect mixed view/own scopes and consolidate palette queries into one database call.
- Migration 0024 removes repeated IAM expansion from search RLS using statement-local snapshots; 18 search tests pass. SQL time fell from 629 to 45 ms; warm service p95 from 936 to 348 ms, still above the 300 ms acceptance limit.
- Fixed the clean-database extension prerequisite and rollback grants (ff5cfcb); CI 35805349980 green. Task is not DONE: browser acceptance, multi-scope/normalization metadata parity and production-scale/concurrency acceptance remain.

## 2026-09-23 — Search palette API integration

- TASK-0110 continues: permission-filtered record groups connected to the existing COSS palette, with cancellable requests, offline/loading/error states and retry. Footer preserved. Four async request tests added; browser acceptance and remaining step-4 scope are open.

## 2026-09-23 — Panel telefonun ana ekranına çıkıyor

- Panel artık kendisini ana ekrana ekletiyor: ilk girişte "Bugün" ekranında bir kez pencere, sonrasında ekleyene kadar telefonda küçük bir şerit. Android'de tek tuşla kuruluyor; iPhone'da Apple izin vermediği için pencere paylaş simgesiyle iki adımı gösteriyor (D-264).
- Ana ekran simgesi marka işaretinden üretildi (mavi zemin, beyaz işaret); iPhone artık sayfanın ekran görüntüsünü değil gerçek simgeyi koyuyor.
- Telefonda alt çubuğun düğmeleri 44 pikselden 56 piksele çıktı, Görevler listesi tablo yerine kart basıyor.
- Telefonla yerel ağdan girildiğinde ekranın betiksiz davranmasının sebebi bulundu ve giderildi: geliştirme sunucusu, başka bir adresten gelen istekleri reddediyordu.

## 2026-09-22 — Tasks can be given

- TASK-0108 step 1 (plan approved, D-263). "Görev ver" in the header opens a form listing only the people in your scope; the database refuses anyone outside it (D-130). A task closes when the assignee says it is done and the giver is told, or, with "onayım gereksin", only after the giver approves; the giver can send it back or reopen it, and every step shows in the task's history with person, time and reason (D-131).
- "Görev ver" opens over the page you are on: a dialog on a computer, a drawer from the bottom on a phone; the back button closes it.
- "Görevler" lists late tasks first, then today's, those waiting for approval and the rest; tabs for tasks given to you and by you, and "Tümü" for owners. Each task has its own screen saying who gave it or which problem opened it.
- The system opens at most one task per open problem and closes it with "sebebi çözüldü" when the cause goes away (REQ-TSK-005). Notifications are written for new, completed, approved and reopened tasks, visible only to their recipient; the bell shows them in the next step.

## 2026-09-22 — Two resets, a lock and portable configuration

- TASK-0076 DONE (D-246). `npm run db:reset:data` clears sample business data and keeps your flows and definitions; `npm run db:reset:config` first saves your configuration to a file, asks you to type SIFIRLA, then returns everything to factory state. `npm run config:export` / `config:import` carry configuration to another environment; if even one row differs, nothing is written and the differences are listed. Once the environment is marked as holding real data, both resets are locked.
- The commands never keep a list of tables: every table states its layer when it is created, and a migration that forgets to is rolled back.
- Owner decision D-255: while we are testing, migrations no longer need a backup first; the requirement returns automatically once real data is marked.

## 2026-09-22 — The panel has its own database door

- TASK-0101 DONE (T1; CI run 35655520185 green). The application now reaches the database only as a restricted login role that cannot bypass row level security, create roles or delete rows, and only over TLS verified against Supabase's own root certificate, which the operating system does not trust by default (measured). Every request runs in one transaction that first writes the signed-in user as transaction-local settings; after commit or rollback nothing is left on the pooled connection, and a connection whose rollback fails is destroyed rather than reused. Driver, query builder and database door can only be imported from a module's data layer, and SQL statements may only live there.
- Schema changes are plain SQL migrations with a down file each and a checksum ledger; the first one is applied to the test project. A dump is required before every later migration. A new CI job applies all migrations to an empty PostgreSQL 17, tests, rolls them back, applies them again and tests again (CI.md section 4).
- Tooling decision D-254: `pg` with Kysely, an in-repo migration runner, the pinned root certificate.

## 2026-09-21 — Light-theme focus indicators reach 6.8:1; the sidebar speaks Turkish

- TASK-0054 DONE without editing any COSS file. The light theme's focus colour is neutral-600 (D-225). Measuring on the dev server showed that COSS draws the outline of elements without their own focus style, such as plain links, at half strength, which stayed at 2.27:1 even with the darker colour; the light theme's base outline now uses the full colour. Input borders, button rings and link outlines all measure 6.8:1, and the dark theme is unchanged.
- The sidebar rail is now announced and tooltipped as "Menüyü aç veya kapat". COSS's own mobile sheet, whose title is fixed in English and which duplicated the phone navigation, can no longer be opened with Ctrl/Cmd+B at phone widths. Both deviations are logged in DESIGN_SYSTEM_RULES section 4.1.

## 2026-09-21 — The entry screen is `/today` in code, as in the glossary

- TASK-0043 DONE. The glossary calls the entry screen "Bugün" (Today Screen) and each figure an Indicator, and forbids `dashboard` and `widget`; the code now agrees. The route moved from `/dashboard` to `/today` with a permanent redirect so old links keep working, the route constant became `todayRoute`, and the figure registry became `platform/today/indicator-registry.ts`. Files moved with their history; behaviour is unchanged. On the dev server `/dashboard` answers 308 to `/today`, which sends a signed-out visitor to sign-in as before.

## 2026-09-21 — GitHub CI is live

- TASK-0100 DONE. Every push to `main` and every pull request now runs the same gate as the local hook on GitHub (`npm ci`, then `npm run check:commit`, Node 24), so a commit made with the hook bypassed cannot stay green. The job checks out the full history, because the records gate compares stamps with commit dates and looks up deleted paths; actions are pinned to commit SHAs and the token is read-only. The first run passed and its log confirms the records, schema-access, lint, test and formatting steps ran on the server. The remaining CI.md steps arrive with the tables, catalogs and screens they test.

## 2026-09-21 — Phase 07 starts: the module boundary rule now comes from MODULE_MAP

- The owner approved the Phase 07 plan. TASK-0099 DONE: ESLint no longer carries a hand-written boundary rule; `scripts/module-graph.mjs` reads MODULE_MAP and generates it. A module may use another only along a solid arrow and only through its `index.ts`; dashed arrows are events; every business module may use the six platform modules; platform modules never depend on business modules, and dependencies among platform modules need an arrow in the map first. A cycle or an unreadable map stops the lint instead of loosening it.
- Routes may use a module's `index.ts` and `ui/` screens but not its internal folders. IAM gained an `index.ts`, the routes use it, and the password-reset confirmation route no longer reaches IAM's infrastructure; behaviour is unchanged and the production build passes.
- `npm run boundaries` (in both check gates) finds module SQL naming another module's schema, scanning only SQL-looking strings so file names are not mistaken for schemas. Fifteen probe tests lint real snippets through the actual configuration, proving the rule blocks deep, relative, type-only, dynamic and re-export bypasses and against-graph dependencies while allowing the legitimate paths.

## 2026-09-21 — Phase 07 discovery: plan, three owner answers, thirteen tasks

- Every still-owed foundation item already had a design from Phases 03–05; the plan in `docs/features/phase-07-foundation-plan.md` links each one to its sources, the spike carry-forwards and a task, in dependency order.
- Discovery found two scheduling gaps and one piece of news for an owner decision. CHG-009: the owner decided the self-hosted Supabase move at the very end, in Phase 19 before real data (D-250); put the confirmed site-wide search into the Phase 07 foundation, which no build phase held (D-251); and accepted that iPhone push needs the panel on the Home Screen (D-252). npm 11 and Node 24 became final as a technical default (D-253, closes OQ-017). Phase 07's stale "deployment to staging" wording was corrected, and its estimate rises to about 10–13 working days.
- Opened TASK-0099…TASK-0111 under a new Phase 07 heading. No code yet: each T1/T2 task writes its implementation plan first, and the plan awaits the owner's approval.

## 2026-09-21 — Phase 06 closed with owner approval; Phase 07 begins

- The owner approved the Phase 06 exit. Seventeen spikes are complete and every roadmap candidate is covered: SPIKE-01–11 and 13–17 passed, SPIKE-12 passed under the cold-start exception (D-248). No architecture decision had to change; each report lists what it hands to Phase 07.
- Phase 07 (Foundation Build) is now the single IN_PROGRESS phase. It starts with discovery: the still-owed foundation items, the mandatory question round and the phase decision summary come before any product code, as the project rules require.
- Carried open: the public r2.dev URL (owner action, ADR-003), the cold first request re-measure at hosting (D-248), the EU bucket jurisdiction before real personnel files (D-249) and the QTE-to-PRJ sync-versus-event inconsistency.

## 2026-09-21 — SPIKE-17 closes the last roadmap candidate; Phase 06 ready for exit

- TASK-0098 DONE. The roadmap listed "architecture boundary enforcement tooling" as a Phase 06 candidate, but it had never become a spike and had no waiver; the owner chose to test it. Using the repo's own ESLint 9 and the already installed eslint-plugin-boundaries 7.2.0 on a throwaway fixture, 14/14: 34 module edges were generated from MODULE_MAP, the graph is acyclic, another module is reachable only through its `index.ts` along a graph edge, and deep, relative, type-only, dynamic-import and re-export bypasses plus against-graph dependencies are all blocked, failing CI. A static SQL scan caught a module reading another module's schema without false alarms, and the real repo is clean under today's rule.
- Found a record inconsistency: MODULE_BOUNDARIES section 3 says QTE calls PRJ's `createDraftProject` synchronously, while MODULE_MAP draws that edge dashed as an event; to settle when QTE is designed. The SQL scan sees only literal strings, so per-module database grants are recommended as the stronger complement.
- Seventeen spikes are complete and every roadmap candidate is covered. Phase 06 now waits for the owner's exit decision.

## 2026-09-21 — SPIKE-16 passes; all sixteen listed spikes complete, one candidate unaccounted for

- TASK-0097 DONE. Local Tesseract (downloaded with the owner's permission) read synthetic scans without any document leaving the machine. Measured as searchability with the search normalisation: on a realistic scan the dispatch note matched all 10 search terms and the weighing slip all 9, with Turkish diacritics exact and the net weight extractable, at about one second per page. A poor, faded 100 dpi scan lost some terms (6/10, 8/9), which becomes a low-confidence flag and rescan prompt rather than a reason to send documents out.
- The harness changed three times after failures were seen, each applied uniformly with raw results kept: a dark default page background that hid all text, a second sparse-text pass because bordered table rows were skipped, and a spacing cleanup between digits and punctuation. Real anonymised scans must confirm it in Phase 07.
- All sixteen listed spikes are complete. Before the Phase 06 exit, one gap was found: the roadmap's candidate "architecture boundary enforcement tooling" was never turned into a spike and has no waiver; it has been put to the owner.

## 2026-09-21 — SPIKE-15 passes: resumable photo upload and a draft that survives the drop

- TASK-0096 DONE. Online-only frame (DEF-002). A synthetic 4032x3024 phone photo was resized in the browser to 1600x1200 (5.86 MB to 238 KB) and uploaded in 64 KB offset-checked chunks through the app server to R2 over a simulated 256 kbit/s link, with an 8 s offline window while the user changed the form. 11/11: the upload resumed from the server-reported offset with no byte resent, the stored object matched the resized photo byte for byte, the draft autosave retried and kept the offline change, and a reload restored the form and the attached photo.
- From the log: the chunk in flight at the cut had actually reached the server, which is why the resume offset must be asked of the server; the deliberate server-side drop was absorbed by Chrome's own retry of a reused connection, so it did not test our logic; and the `online` event should cut the retry backoff short, since the upload waited 7.5 s after reconnecting.
- Limits: closing the tab while offline loses unsaved input and a pending photo, which is the deferred offline-entry boundary; EXIF, HEIC and a real camera were not tested. Fifteen spikes are complete; SPIKE-16 remains.

## 2026-09-21 — SPIKE-13 finds and fixes a stale-counter defect

- TASK-0095 DONE. A local SSE server and real headless Chrome with two differently scoped users. The first run failed: during a 10 s offline window the still-open stream delivered three signals, but every follow-up count request failed, and without a reconnect the counter stayed wrong for about 18 s. Fixed by retrying failed count requests with backoff and refreshing on the browser `online` event; the failing evidence is kept.
- After the fix, 12/12: the counter follows signals, no signal crosses scopes, and the screen recovers silently from a server drop (0.8 s), an offline window (62 ms after coming back), a network-error outage (2.8 s) and a slow 400 ms link. A 503 closes the native EventSource for good, so a backoff wrapper is required (4.3 s). Reload always shows the source count and every frame carries only the signal type.
- Limits recorded for Phase 07 and the hosting decision: proxy/CDN buffering and idle timeouts, the HTTP/1.1 six-connection cap across tabs (HTTP/2 or one shared stream), wiring signals to the outbox worker, and real mobile networks. Fourteen spikes are complete.

## 2026-09-21 — R2 public URL flagged against ADR-003; bucket jurisdiction kept for now

- D-249: the owner kept the non-EU R2 bucket for synthetic data; EU jurisdiction is decided before real personnel files, since jurisdiction is fixed at bucket creation.
- The owner enabled the bucket's public r2.dev URL after being asked to confirm it was off. Recorded as an open ADR-003 compliance item with a recommendation to disable it: Cloudflare documents that it makes every object readable without a signature. A probe could not demonstrate it from this machine because the r2.dev host resets TLS within 26 ms here; the probe object was deleted and the bucket is empty. No real file may be uploaded while it is enabled.

## 2026-09-21 — SPIKE-09 passes against the R2 bucket

- TASK-0094 DONE. The owner created the `geoges-panel` R2 bucket with a key limited to object read/write on it; the variables use the `R2_` prefix from the naming convention and are now listed in `.env.example`. 17/17 checks: links are issued only for documents the caller can see under their own RLS scope; unsigned object and list requests, a signed link with a changed key or a stretched expiry, and an expired link are all refused; a 50 MB file downloads intact with its Turkish filename.
- Design finding: R2 checks expiry at the start of a request, so a slow download outlived its 20 s link and completed, while resuming a cut download needed a fresh, re-authorised link plus a Range request. Links can stay short-lived; the exact lifetime remains a product setting.
- Limits recorded: the field network was simulated by client throttling; public r2.dev access must be confirmed off in the dashboard; the bucket is not EU-jurisdiction, which needs an owner decision under RISK-001 before real personnel files. Metadata lived in a never-committed transaction and the test objects were deleted, so nothing remains in R2 or the database. Thirteen spikes are complete.

## 2026-09-21 — SPIKE-14 passes; spike schema removed from the Free Plan project

- TASK-0093 DONE (SPIKE-14). One year of 500,000 events rebuilt the site summary and stock balance read models from scratch in 19.3 s with 0 differences against the source records, 0.15% of the 4 h RTO that bounds a post-recovery rebuild. The non-replayable notification subscriber was never called and 30,952 notifications stayed unchanged; a negative control showed the probe would have caught a call. Drift in the live model was detected and audited; the shadow rebuild kept readers on the old complete version until an atomic switch; re-delivering 100,000 events and an older approval changed nothing; 325 later events caught up in 588 ms; scope RLS and write/execute denials held. 21/21 checks.
- Honest limits: yearly volume is an assumption (none is recorded). A first 1.5M-event attempt filled the test disk and rolled back cleanly; flat 50k-event chunk times support linear estimates of ~58 s for 1.5M and ~4.8 min for five years, which are estimates. Fixture tables were unlogged, measured read-model tables were not. A task-producing subscriber was not modelled separately.
- The Supabase test project turned out to be on the Free Plan (500 MB database, 500 MB shared RAM, no backups) and was already over the limit before this session. With the owner's approval the whole `spike` schema was dropped: 1,042 → 12 MB, 50 tables and 14 functions, auth and every other schema unchanged, inventory saved first. Recorded hosting-decision inputs: Pro daily backups do not meet D-209's one-hour RPO without PITR or self-hosted WAL archiving, and the small shared memory is the likely source of the D-248 cold-start penalty.

## 2026-09-21 — Search validation closed under an owner cold-start exception

- D-248 / CHG-008: presented four options after the cold triage; the owner chose a cold-start exception. The first search after the database instance has been idle is exempt from the 300 ms SPIKE-12 target; warm searches stay bound by it, and any warm search above 300 ms is a failure. The cold first request is re-measured on the chosen compute at the hosting decision. REQ-NFR-012's text is unchanged; the figure lives in the SPIKE-12 criterion and ADR-017, both amended and registered in the roadmap.
- TASK-0090 and TASK-0091 DONE. Self-review: a read-only post-maintenance check passed 19/19 (500,000 source rows, 500,411 vocabulary rows, equal projection totals, only the GiST and primary key indexes left, scope isolation in three profiles, invoker/private functions, identity cleanup). The speed gate was reclassified rather than rewritten: the 18 warm series pass with a 190 ms maximum and all seven cold observations stay listed as excepted; the earlier gate version is kept.
- Honest scope note: six of the seven cold observations were first requests after idle; the 392 ms case was a second request, plausibly the first touch of relations the first did not use. Eleven spikes are complete and SPIKE-14 is unblocked.

## 2026-09-21 — Cold triage puts first-request cost outside the query

- TASK-0091: ran the prepared triage as the first database action after about ten hours of idle. Connection wake-up (`select 1`, 0.08 ms) and pure CPU (219 ms first, 216–219 after) showed no cold penalty. A scan of 2705 blocks, counted as shared-buffer hits with zero reads on every run, took 517 ms first against 58 ms after, about 170 µs per block; the search then took 383 ms first against 40 ms. Ten result/role/identity checks passed.
- The cost attaches to the first touch of data pages PostgreSQL believes are cached, consistent with every earlier observation. The most likely mechanism is host memory reclaim during idle; it cannot be observed from inside PostgreSQL and is not claimed as proven. Suggested owner check: the Supabase memory/swap graph.
- Query engineering is exhausted, so OQ-029 is now an owner decision between a keep-warm job (to be validated by a multi-hour experiment), a larger compute tier under the hosting decision, or an explicit recorded exception. The speed replay gate reads the triage and fails with seven preserved observations. No target waiver, no product code, no region change.

## 2026-09-21 — SPIKE-10 passes with the production font; two findings retracted

- TASK-0080 DONE. The old fallback to Times New Roman was not "subsets don't work". next/font emits one woff2 per subset with a unicode-range, the app already requests `latin` + `latin-ext`, and the spike had embedded only the preloaded `latin` file. Predicted and confirmed 6/6: c-cedilla, o-umlaut and u-umlaut render from that file, while g-breve, s-cedilla and dotted capital I fall back. With both files and their ranges, full Turkish text embeds no fallback at all.
- Regenerated the quote and the daily report with the project's own Geist and no system or proprietary font, headers and footers included (Chrome's header/footer templates do not inherit page fonts and need their own @font-face). All four pages inspected. Geist moves the daily report's page break from 25 to 23 rows; continuity and the repeated header hold.
- RETRACTED the earlier same-day claim that the text layer shatters and defeats archive search. Joining extracted runs by position finds every probe word in all four PDFs; my extractor, which joined runs with spaces, was the defect. The real rule is that the archive indexer must join by position, which matters more with Geist because g-breve, s-cedilla and dotted I come from a separate subset and form separate runs.
- Also retracted the original report's "a full TTF must be embedded" condition; no full file or proprietary Arial is needed. Carried notes: Geist embeds as Type3 because it is a variable font, so test a static instance if an archival format is ever required; Linux Chromium size stays a hosting input under DEF-008. Ten spikes are now complete.

## 2026-09-21 — TCMB missing-rate chain tested; SPIKE-11 closed

- TASK-0081 DONE. The three reopened behaviours — the `exchange_rate.missing` event, "kur bekliyor" amounts and next-day automatic completion — are now covered by 30 automated checks, all passing.
- Live against the real service: the dated file's `Tarih` matches the requested business day, `Tarih` (dd.mm.yyyy) and `Date` (mm/dd/yyyy) coexist, JPY is published with `Unit=100`, and a weekend dated file returns 404. Trap 1 was caught live rather than argued: at 02:30 on Monday 21.09 `today.xml` served the 18.09 bulletin while the 21.09 dated file returned 404, so trusting the current-bulletin file would have labelled Friday's rate as Monday's.
- Simulated with an injected provider, calendar and clock: four attempts at 10/30/60-minute intervals, exactly one missing event per day and none on retry, pending amounts marked and approved records left with their own rates (REQ-ADM-015), automatic completion with correct USD conversion and Unit-divided JPY, and no double conversion on a second run.
- Two corrections recorded rather than quietly fixed. The test's first version computed dates with `toISOString()`, so at 02:30 local it evaluated the previous day and a green check was verifying the wrong date; business-day maths must never use UTC, which applies to the product adapter too. The documented retry wording is ambiguous between attempts at 0/10/30/60 and intervals of 10/30/60 minutes; the interval reading was implemented and left as an operations parameter, since both satisfy the requirement and finish long before end of day.
- LIMIT: the state machine runs in memory. Real persistence, the job queue, the event bus and concurrency are Phase 07 adapter work, and a prolonged TCMB outage was still not exercised.

## 2026-09-21 — PDF pages actually inspected; two defects the earlier review missed

- TASK-0080: rasterised all four pages of both test documents and inspected them. The visual gap is closed: A4 geometry, margins, column alignment, the repeated table header on page two, page numbering, page-break continuity (34 rows, nothing lost or duplicated at the break) and Turkish typography including m², °C and × all pass. The quote's line items, subtotal, 20% VAT and grand total are internally consistent.
- Found that neither measured document used a font the product could ship. The quote embedded Windows Segoe UI and Arial with no @font-face at all; the daily report embedded `test-full.ttf`, whose name table identifies it as Arial Regular 7.06, © Monotype Corporation. The recommended OFL Geist was only ever tried as the `next/font` woff2 subset — precisely the case that failed. The production configuration, a bundleable font with no system fallback, remains untested, and no full font file exists in the project.
- Found that the daily report's text layer is not as searchable as claimed: extraction yields `Panel t i p i`, `B i t i ş` and `Ek i p`, so an archive search for `tipi`, `Bitiş` or `Ekip` would miss the document. This contradicts the report's REQ-DOC-004 claim. The pages render correctly; only the text layer is affected, and the cause was not isolated.
- TASK-0080 therefore stays REVIEW with three named exit conditions. The DocumentRenderer direction is unchanged; no requirement was relaxed and no product code was written.

## 2026-09-21 — Candidate fails cold acceptance; new-backend explanation ruled out

- TASK-0091: the first database action was the prepared candidate wait sampler. After roughly six hours of natural idle the range candidate's first call took 554 ms total / 469 ms server, against the original's 571/487 ms. The candidate does not reduce the cold cost and fails its acceptance criterion. Zero physical reads, 89 of 300 samples `active` with no wait event, 211 ClientRead; the query stayed continuously active for 460 ms.
- Ruled out new-backend startup as the cause. Six concurrently held backends aged 0.084–0.165 s answered the same search in 40–48 ms server time; a control arm with no warm-up at all was as fast as arms that touched relations or made a cheap call first. Twenty-four result/role/identity checks passed. Backend age is neither necessary nor sufficient; the remaining discriminator is instance-level idleness, which is not proven to be any single mechanism.
- Controlled warm A/B over two backends with alternating order gave the candidate only 0.5–1 ms and nothing on the heavy case, while the single-call total stayed network-bound at 77–117 ms.
- Plan probes taken under the restricted role showed the covering index and the range rewrite fix the same planner choice: without the index, equality picks trigram GiST while the range form reaches the existing `s12r_words_pkey`. With the index present both use it and the original is marginally faster, so the candidate earns nothing alongside it. The index costs 15.05 MiB and, measured with transactional drops, about 8% more on inserts and 45% more on `record_count` updates because the INCLUDE column blocks HOT. It is not recommended; only the range rewrite is.
- The write-cost test left dead tuples and index bloat despite being rolled back. Repaired with VACUUM (ANALYZE) and REINDEX: dead tuples zero, 500,411 rows intact, candidate and primary key restored byte for byte, GiST rebuilt within 0.4%. The resulting fresh statistics are recorded as a baseline change — every earlier measurement was taken with stale statistics, which changed the original's exact-word plan from GiST to index-only.
- Rolled the candidate back, deliberately in part. `s12r_words_exact_cover` was dropped so the next cold measurement runs on the product-equivalent baseline rather than a rejected configuration; nine checks confirmed the primary key, the GiST index, all four functions and 500,411 rows survived. The two private range functions were kept on purpose: with the covering index gone the range rewrite becomes a free, measurable win (rare term 0.905 ms / 20 blocks against 1.092 ms / 79 blocks) and is the only recommendation worth carrying into design. It is not adopted and does not touch OQ-029.
- Prepared `search12r-cold-triage.mjs` as the next session's first database action, separating connection wake-up, catalog reads, pure CPU, buffer scanning and the search path. Extended the speed replay gate to read timestamped cold evidence; it still exits nonzero with six preserved failures (392, 529, 540, 554, 571, 636 ms). No target waiver, no product code, no region change, no reset, and no session terminated. The rejected candidate objects remain in the spike schema pending owner approval to drop them.

## 2026-09-20 — Cold wait captured; exact-word index candidate prepared

- TASK-0091: original cold request 571/487 ms, no PG wait sampled while active. Transaction-local nested stats showed exact-word execution cost rather than plan cost in a subsequent rare-number case. Exact equality sometimes uses trigram GiST. No definitive CPU/IO root cause claimed.
- Added a disposable 15.05 MiB covering B-tree and private same-bound range lookup copies; originals/RLS unchanged. Index-only path demonstrated; 54 covering-index candidate timings and 24 range-candidate parity/security checks passed. Cold candidate and independent source reference still pending; no product adoption. Next first DB action is the prepared candidate wait sampler.
- Fixed evidence overwriting by timestamping future wait outputs. Old warm raw trace was overwritten, explicitly acknowledged; cold 571 ms preserved separately and added to failing baseline replay. All diagnostic settings remained transaction-local, statistics not reset.

## 2026-09-20 — Equivalent search profiling reproduces distributed first-call delay

- TASK-0091: eight equivalent-wrapper observations; first profile 432 ms total / 354 ms server, with setup, exact-word lookup and bucket work all slower. Other new backends were fast. Private profile copies removed; result/role/savepoint identity checks passed. No root cause or fix claimed.
- Twenty-four plan-mode count/role checks found no accepted fix; force-custom worsened warm no-match work. Separate 300-sample wait trace caught only a warm 126 ms call and cannot explain cold latency. All settings remained transaction-local, original functions/data unchanged. Next first DB action on resume is the prepared wait sampler, to avoid warming before observation.

## 2026-09-20 — Pinned-backend diagnosis and region postponement

- TASK-0091: transaction-local role/timeout setup captured the actual backend start. A 0.157-second-old backend took 540 ms (465 ms inside server), then 112 ms. All 12 count/role/PID/savepoint-cleanup checks passed. Replay preserves the new failure.
- A separate direct profile on another new backend took 125/48 ms. It was not an equivalent wrapper/cold-cache comparison; no root cause or fix claimed. Private diagnostic copy removed, original functions/data unchanged. Updated active status pointers and recorded owner-postponed region migration as DEF-009.

## 2026-09-20 — Ireland endpoint and backend reuse measured

- TASK-0091: 32 requests across 16 clients reused one backend through the Ireland transaction pooler. First 636 ms request spent 533 ms inside the server; region distance alone does not explain it. No region move or session termination. Corrected PROJECT_CONTEXT to separate actual test endpoint from original Frankfurt direction.
- Corrected unavailable backend age mistakenly rendered as zero by Number(null); later owner lookup could not recover the departed PID. Preserved evidence provenance, extended failing speed replay, and required transaction-local setup for the next diagnostic. No root cause, performance PASS or product implementation claimed.

## 2026-09-20 — First-request latency attributed to server work in a reproduced failure

- TASK-0091: 24 first-call observations with server/client times from the same request. One 529 ms call spent 444.701 ms executing on the server, disproving a purely network explanation. All sample result counts, restricted role and identity cleanup checks passed. Root cause remains open; no fix or PASS claimed.
- Stage profiling did not reproduce the cold peak; JIT is off with zero measured compilation. A separate recursive set-query variant regressed common search to 7555 ms (139 ms after removing unnecessary tie sorting); rejected and removed along with its profiling copy. Original functions/data unchanged; cleanup control passed. Replay gate includes the new failure. Next: actual backend startup versus client/pool reuse.

## 2026-09-20 — Schema count drift found and guarded

- TASK-0092: the original schema definitions contained 212 tables, while COVERAGE said 211; the platform task claimed 34 while defining 45. With three new search helpers the correct totals are 215 and 48. Corrected current records and added an automatic definition-to-inventory check, including duplicate/missing schema and total checks. The real stale total was rejected before correction. Historical changelog entries remain historical.
- Self-review: definition rows are counted once, duplicate declarations fail, coverage cannot hide a schema move behind an unchanged total. Six regression cases and full quality gate passed (69 tests); no product code changed.

## 2026-09-20 — Search model adopted; request overhead reduced, first-request gate still fails

- D-247 / CHG-007: proceeded with the recommended model and word semantics after the owner’s continuation. Folded ADR, UX, three schema helpers (215 planned tables), glossary, scope/UUID/rebuild rules and operations inventory. No product source or migration.
- TASK-0091: diagnosed both server startup and outside-query overhead; a single-call invoker wrapper reduced 18 x 20 no-warmup samples to max 190 ms. Added 14 request checks and five security checks, including real cancellation/identity cleanup. Fixed a negative test that assumed pooled role state reset automatically; restricted runtime login remains mandatory.
- Twelve new-connection first requests still include 392 ms. Preserved all observations, including the aborted review’s console output, and added a replay speed gate that exits nonzero for that failure. TASK-0090/0091 remain REVIEW, OQ-029 open; eight spikes complete. Next: isolate remaining startup/transport overhead before SPIKE-14.

## 2026-09-20 — Search retry passes warm measurements; adoption and cold latency remain open

- TASK-0091 / SPIKE-12: 73 correctness/review checks passed on 500k synthetic rows. After removing rejected RUM/GiST alternatives, 18 scenarios with 20 timed samples each gave warm p95 220–258 ms, maximum 258 ms. First executions after cleanup reached 461/371 ms; neither task is DONE and no performance waiver is recorded.
- Proposed three scoped helper projections and all-words matching with scoped spelling correction; about 481 MiB extra storage in this fixture. Recorded impact analysis and owner approval point in DECISIONS/OQ-029; confirmed Phase 04 tables and D-239 remain unchanged. Reports preserve failed variants, cold observations, UUID/scope adaptation needs and atomic update/rollback evidence. Updated all active search status pointers; eight spikes remain complete. No product source or UI changes.

## 2026-09-20 — Turkish search passed correctness but failed performance

- TASK-0090 / SPIKE-12 remains REVIEW, not DONE: 36 correctness/integrity checks passed on 500,000 synthetic rows. Existing-match p95 was 219–225 ms, but no-match full-text/fuzzy p95 was 398/2846 ms. The query-plan comparison exposed unused GIN indexes under RLS; the combined alternative also failed and was reverted. The report preserves failed measurements and untested scope.
- Corrected the claim that pg_trgm itself folds Turkish letters. ADR-017 is under technical review; ports/schema notes, the spike index and roadmap record the failed assumption. TASK-0091 and OQ-029 carry the RLS-preserving retry before SPIKE-14. No business requirement, provider choice or performance target changed. No product code written; pg_trgm and isolated synthetic fixtures were the only retained database additions.

## 2026-09-20 — Custom record data spike passed after two fixture repairs

- TASK-0089: SPIKE-08 completed its definition/input/RLS/search/report/retirement chain with 48 checks and 50,001 synthetic records. List and numeric filtering p95 were 240 and 270 ms. The report distinguishes data feasibility from the future builder UI, full IAM and workflow integration.
- Negative review found read-only-user writes to helper tables and stale search vectors after field retirement. Both were reproduced, repaired in the throwaway schema and verified; source values and old definition snapshots remained intact. Product records/source were unchanged. Next: SPIKE-12, then SPIKE-14.


## 2026-09-20 — Workflow execution spikes passed in their measured scope

- TASK-0086…TASK-0088: completed SPIKE-04/05/06 with 26 assertions plus 13 independent reference checks. Existing instances keep their version across publication and process restart. Dry runs preserve state and match real paths/owners for four scenarios. Indexed historical count/sum queries over 500k rows stay below two seconds, and genuine PostgreSQL timeout stops the instance with a recorded reason and notification intent.
- Reports distinguish the disposable model from the future product engine: synthetic owners/effects, selected node types, no full IAM or concurrent-publication guarantee. No product source or production schema changed. Next: SPIKE-08, SPIKE-12 and SPIKE-14; PDF and TCMB checks remain REVIEW.


## 2026-09-20 — Revalidated database spikes and repaired resume records

- TASK-0082…TASK-0084: corrected a self-grant weakness in the throwaway RLS fixture; 12 assertions now pass. Parameterized transactions meet the 300 ms target at p95 239–240 ms. The outbox selection initially violated record order; corrected selection passes atomic rollback, abrupt process exit, 10,000 ordered events and 500 duplicate deliveries. Reports preserve both failures and verification limits. No product code or product tables changed.
- TASK-0085: replaced stale phase pointers and handoff, added deterministic roadmap/state/handoff comparison, and corrected the obsolete staging acceptance wording under D-245.
- TASK-0080 and TASK-0081 reopened to REVIEW: prior PDF text extraction did not prove visual quality; TCMB response timing did not prove missing-rate/recovery behavior. Earlier changelog entries describe the conclusions at that time and are superseded by this audit.


## 2026-09-20 — SPIKE-11 passed: the exchange rate is reachable and fast

- Fifteen requests to the central bank, fifteen answers, thirty milliseconds each. Weekends simply have no bulletin, which the panel must read as "no rate today" rather than as a failure. Three traps were found and written down: the "current" bulletin is not always yesterday's (it changes when the bank publishes in the afternoon, so the panel must ask for a specific date and check the date it gets back), the file carries the date twice in two different formats, and some currencies are quoted per hundred units (TASK-0081).


## 2026-09-20 — SPIKE-10 passed: the documents print correctly

- A price quote and an official daily site report were generated as real PDFs. Both came out at exact A4, with Turkish characters intact everywhere, right-aligned money columns, repeating table headers across pages, page numbers, and text that can still be selected and searched — in about half a second each. Two conditions came out of it: the document font must be shipped with the application (the runtime font subsets silently fell back to Times New Roman and broke text extraction), and the server will need a headless browser, which now belongs to the hosting decision. The SPIKE-07 canvas code was deleted as planned; it stays in git history (TASK-0080).


## 2026-09-20 — SPIKE-07 passed: the flow canvas holds up

- A throwaway 40-step flow was built and measured. It paints in about a quarter of a second, stays at roughly 80 frames a second while being zoomed and dragged, fits a phone screen without sideways scrolling, and every step can be reached from the keyboard. The diagram library already in the project (MIT, ~88 KB compressed) does the heavy lifting; the boxes, panels and buttons around it are COSS. Three things were noted for Phase 08: the canvas should be one tab stop with arrow-key movement instead of forty, the mini-map should be off on phones, and the library should load only when the designer is opened (TASK-0079).


## 2026-09-20 — Phase 05 DONE, Phase 06 starts

- The owner approved the Phase 05 exit. How the panel runs, how it is checked before every commit, how the owner installs it themselves, what happens when something breaks and what must exist before real data are all written down. Phase 06 begins: sixteen throwaway experiments against the riskiest decisions, starting with the three that hold the architecture up — row-level security on a direct connection, its speed, and the outbox under load. The owner chose to run them against the existing Supabase project.


## 2026-09-20 — Backup plan and runbooks

- `docs/infrastructure/BACKUP_AND_RECOVERY.md` states plainly what would be lost and how fast it comes back: a dump before every migration now, and five things that must exist before any real company data is entered — including a restore actually rehearsed and timed, because an untested backup is not a backup. When live, the date of the last backup and the last drill will be visible on the administration page.
- `docs/infrastructure/RUNBOOKS.md` writes down what to do when something breaks: the queue stopped, a migration went wrong, a flow instance failed, the exchange rate did not arrive, a key leaked, or nobody can sign in as owner (TASK-0077, TASK-0078).


## 2026-09-20 — Resetting sample data no longer throws away your work

- The owner asked whether the reset command would also wipe the workflows. It would have, which was wrong: a morning spent in the flow designer is not sample data. There are now two commands — one clears sample business records and keeps configuration, the other returns configuration itself to factory state and asks first. Configuration can also be exported and loaded into another environment, so the flows built locally move to the live project instead of being rebuilt by hand (D-246, TASK-0076).


## 2026-09-20 — Phase 05: local-first, hosting deferred

- The owner chose to run without a staging environment, on a single Supabase project, with the server decision left for later (D-245). Three consequences are now written down rather than discovered later: acceptance happens on the owner's own machine, with a Turkish setup guide; the pilot with real field users waits until there is an address, which the Phase 09 exit now asks for; and the sample-data reset command is locked the day real data arrives, when a second Supabase project is opened. Milestone M1 becomes the local acceptance milestone instead of the staging gate (TASK-0073…TASK-0075).


## 2026-09-20 — Phase 04 DONE

- The owner approved the Phase 04 exit. The panel now has a database design: 211 tables, ledgers that only gain rows, closed periods that refuse new ones, sensitive personnel data sitting apart from the everyday personnel list, and three things every table must prove before its migration is accepted. Phase 05 — infrastructure, environments and operations — starts, and it needs the owner's answers on the server, backups and e-mail (OQ-010…OQ-016).


## 2026-09-20 — Data coverage check

- `docs/database/COVERAGE.md` counts what Phase 04 produced — 211 tables — and names the requirements that correctly have no table of their own, so a gap can be told apart from a principle. Every table must prove three things before a migration is accepted: it has a scope column, a security policy and a history channel (TASK-0072).


## 2026-09-20 — Analytics and user-defined record schemas

- `docs/database/SCHEMA-ANALYTICS.md` separates what reporting derives from what it owns: indicator and summary tables carry a rebuild marker and can be thrown away, while KPI definitions, bonuses, recommendations and budgets are real records. A month that cannot be calculated says so instead of showing zero.
- `docs/database/SCHEMA-CUSTOM-RECORDS.md` turns ADR-016 into six tables. Every type a user invents shares one security policy and needs no migration; fields retire instead of vanishing, and each record remembers which version of the definition it was written under (TASK-0070, TASK-0071).


## 2026-09-20 — Corporate schema

- `docs/database/SCHEMA-CORPORATE.md` covers people, contracts, quality and safety, meetings and support. Sensitive personnel columns — identity number, IBAN, salary — live in a separate table, so the ordinary personnel list never touches them. A medical report keeps only its existence and dates, never a diagnosis. A nonconformity cannot close without a root cause and an action, and a safety check cannot record "not compliant" without saying why (TASK-0069).


## 2026-09-20 — Commercial and finance schema

- `docs/database/SCHEMA-COMMERCIAL-FINANCE.md` covers leads, quotes and the money. A sent quote version is immutable; income, expense and party ledgers only gain rows; a closed period refuses new rows outright instead of trusting the application to remember; and "the person who prepared a payment cannot approve it" is a check constraint, not a policy someone can forget. An amount with no exchange rate is simply waiting for one, so there is never a second source of truth about whether it was converted (TASK-0068).


## 2026-09-20 — Operations schema

- `docs/database/SCHEMA-OPERATIONS.md` gives projects, sites, stock, purchasing, the factory and equipment their tables. The daily site log becomes one parent row plus a table per section, so two people can fill different sections of the same day without overwriting each other. Stock is a ledger: rows are only ever added, a correction is a reversing row, and the balance is rebuildable. Targets hang off a project revision, so a new revision never rewrites the old numbers (TASK-0067).


## 2026-09-20 — Platform schema

- `docs/database/SCHEMA-PLATFORM.md` lays out the tables the whole panel stands on: users, dynamic roles and scoped assignments (a delegation is simply a dated assignment), append-only audit, documents that always belong to a record, versioned flow definitions with their running instances and approvals, tasks that cannot duplicate themselves for the same problem, dated rules and catalogs, and the shared outbox, job and search tables. The full-visibility flag sits on the role itself, so the rule that only a fully visible role may design flows is a database constraint rather than a promise (TASK-0066).


## 2026-09-20 — Phase 04 opens with the database conventions

- `docs/database/CONVENTIONS.md` settles the rules every table will follow: nothing is ever deleted, every table carries its scope column and a row-level-security policy, ledgers only ever gain rows, and history goes through one channel instead of each module inventing its own. The owner chose rounding at the line so screen, invoice and accountant agree, and foreign-currency amounts keep the rate and date that produced their lira value (D-243, D-244). Phase 04 work is filed as TASK-0065…TASK-0072.


## 2026-09-20 — Phase 03 DONE

- The owner approved the Phase 03 exit. The panel now has an architecture: what a module owns and how two of them talk, how an event survives a crash, how a flow definition and a running instance stay apart, how permission is decided in three places, how a rule changed today leaves last March alone, where data comes from and how it is searched, and how a record type someone invents next year is stored without changing the schema. Sixteen spikes will test the risky half before anything is built on it. Phase 04 — database architecture — starts.


## 2026-09-20 — Five new ADRs

- The Phase 03 decisions that cut across every module are now ADRs of their own: ADR-014 (events written with the change that caused them), ADR-015 (direct database access without giving up row-level security), ADR-016 (how a user-defined record is stored), ADR-017 (search stays in PostgreSQL) and ADR-018 (live updates carry a signal, not data). Each records what was refused and which spike will confirm it (D-242).


## 2026-09-20 — Phase 06 spike list

- `docs/architecture/spikes/README.md` turns every risky Phase 03 decision into a question with a pass mark: does row-level security hold for a multi-role user, does the outbox lose nothing when the queue restarts, does a dry run behave exactly like a real one, can a user-defined record type survive fifty thousand rows, does Turkish search find "Söğüt" when someone types "sogut", does a photo finish uploading after the connection drops. A spike that fails sends its decision back to Phase 03 before anything is built on it (TASK-0064).


## 2026-09-20 — Storage direction for user-defined record types

- The hardest question CHG-006 raised now has an answer: a user-defined record is one row whose fields live in JSONB, with scope and status as real columns, so a single security policy covers every type and nobody is changing the database schema by filling in a form. Fields retire instead of disappearing, so old records keep their meaning (D-241, TASK-0063). Schema in Phase 04, spike in Phase 06, screens after the pilot.


## 2026-09-20 — Ports, data access, search and live updates

- `docs/architecture/PORTS_AND_SERVICES.md` names every outside dependency and puts it behind a port, so a provider can be swapped without touching a module. Data access becomes a direct PostgreSQL connection so a record and its event are written together, with row-level security kept per transaction (D-238, closing OQ-020). Search stays inside PostgreSQL with Turkish spelling tolerance and the same permission filtering (D-239). Live updates carry a signal, never data — the screen fetches with the viewer's own rights (D-240).


## 2026-09-20 — Configuration architecture

- `docs/architecture/CONFIGURATION.md` fixes how the adjustable half of the panel behaves: a price or threshold changed in June never disturbs a March progress payment, because rules carry validity dates and approved records keep the version they used. Custom fields are allowed on reference records and refused on ledger records, so no free-text field can blur a cost or a payroll figure (D-237, TASK-0061).


## 2026-09-20 — Permission architecture

- `docs/architecture/PERMISSIONS.md` sets how the panel decides who may do what: roles combine instead of forcing a person to switch hats, every assignment carries its scope, and the check runs in three places so a missed check in one cannot leak data. Commercial and sensitive fields leave the query entirely for those without the right. A lost phone is recoverable two ways — one-time codes and a manager reset, both audited (D-236, TASK-0060).


## 2026-09-20 — Workflow engine architecture

- `docs/architecture/WORKFLOW_ENGINE.md` turns ADR-006 and the CHG-006 decisions into a buildable design: versioned JSON definitions, instances that finish on the version they started with, waits that survive a restart, a dry trial run that still evaluates conditions against real data, and limits that stop a badly built flow from opening five thousand tasks (D-235, TASK-0059).


## 2026-09-20 — Event backbone

- `docs/architecture/EVENT_BACKBONE.md` settles how modules react to each other: the event is written with the change itself, so an approved daily log can never fail to reach stock; repeats are harmless; failures retry, then land in a dead-letter list that raises a critical notification instead of showing anyone an error; replays rebuild reports without re-sending old notifications (D-234, TASK-0058).


## 2026-09-20 — Module boundaries

- `docs/architecture/MODULE_BOUNDARIES.md` fixes what a module owns and how two modules may talk: queries and commands for what the user must see at once, events for everything else, and never another module's tables. Reporting, intelligence and strategy read a rebuildable read model fed by events instead of querying fifteen modules per screen (D-233). Capability declarations become contract tests that break CI when code and declaration drift (TASK-0057).


## 2026-09-20 — Phase 03 opens

- Four owner decisions start the architecture: passwords stay at eight characters with a complexity rule (the owner chose this over the longer-but-simpler rule the AI recommended, objection recorded), sessions last 30 days and end after three days of inactivity (D-230, closing OQ-026); nothing is deleted by time (D-231); and only the approval counter, the bell and the approval queue update live, everything else on refresh (D-232). Phase 03 work is filed as TASK-0057…TASK-0064.


## 2026-09-20 — Ten slices become seven

- The owner asked whether the plan had been overcomplicated. The answer given: the record keeping is heavy but cheap (six days for every requirement, screen and flow), while the real weight sits in the product scope — the workflow engine with its designer, and the record-type builder, which doubles the product (D-079). Of three simplifications offered, the owner took one: merge the ten module slices into seven (D-229). Equipment joins HR, meetings and support join compliance and quality, and the reporting, performance, intelligence and strategy work becomes one last slice. The roadmap also gained an effort estimate measured from the first six days.


## 2026-09-20 — Phase 02 DONE

- The owner approved the Phase 02 exit. Every screen of the panel now has its place, its states, its components and, where it needed one, its own design; the eight end-to-end processes are written as flow definitions the engine will be tested against; the custom elements are limited to three and all approved. Carried forward by decision: the record-type builder after the pilot, search architecture in Phase 03, and the code changes (menu move, focus ring, bottom-band slot, renames) in Phase 07. Phase 03 — system architecture — starts.


## 2026-09-20 — Last Phase 02 designs confirmed

- The owner confirmed the special screens, the search design and the bottom band. Next: the Phase 02 exit summary.


## 2026-09-20 — Last Phase 02 designs: special screens, search, bottom band

- The owner confirmed the custom-element list (TASK-0055).
- `docs/ui-ux/SPECIAL_SCREENS.md` gives every screen that fits no list, detail or form pattern its layout and COSS components; nothing new outside COSS was needed (TASK-0056).
- `docs/ui-ux/SEARCH.md` designs the search box: grouped results, quick actions by permission, document contents left to the archive (D-227, TASK-0029).
- The bottom band now carries the actions of forms, the daily log, the approval queue, bulk selection and — at the owner's choice — detail screens; on phones it replaces the navigation bar while shown (D-228, TASK-0028).
- All three await owner review; then the Phase 02 exit summary.


## 2026-09-19 — Accessibility confirmed; custom-element list

- The owner confirmed the accessibility targets (TASK-0053).
- `docs/ui-ux/CUSTOM_ELEMENTS.md` lists every element the screen designs need beyond COSS: the particle figure, charts, and the flow diagram canvas. The owner wants charts everywhere, the "Bugün" screen included, which brings back what was removed on 2026-09-17 (D-226). Every chart keeps its numbers readable without the picture. Awaiting owner review (TASK-0055).


## 2026-09-19 — Accessibility targets

- `docs/ui-ux/ACCESSIBILITY.md` says what WCAG 2.2 AA means for this panel: touch targets of 44 px, at least 24 px with a mouse, every screen usable by keyboard, colour never the only signal. The owner chose automatic testing only. Checking the theme found one real problem: in the light theme the keyboard focus ring is too faint (2.25:1). It becomes a darker grey in Phase 07 (D-225, TASK-0054). The flow diagram canvas is approved as a custom element (D-224). Awaiting owner review (TASK-0053).


## 2026-09-19 — Administration page confirmed

- The owner confirmed the administration page and flow designer design. Next: WCAG 2.2 AA targets, then the custom-element list (which will carry the flow diagram canvas).


## 2026-09-19 — Administration page and flow designer

- The "Yönetim" group leaves the menu rail: it becomes one page opened from the user menu, with its own left sub-menu for users and roles, master data, workflows, record types and the audit log. Revision requests move into Onaylar as a tab. The flow designer puts the diagram first with each step's questions in a side panel, and works fully on phones too. The run log stays inside the administration page; everyone else sees in plain words which flow and step gave them a task (D-223, `docs/ui-ux/ADMINISTRATION.md`). Awaiting owner review (TASK-0052).


## 2026-09-19 — End-to-end flows confirmed

- The owner confirmed the eight flow definitions; they become the engine's acceptance tests in Phase 08. Next: the flow designer round (D-108).


## 2026-09-19 — The eight end-to-end processes as real flows

- `docs/workflows/END_TO_END_FLOWS.md` writes each of the eight processes as short flows that trigger one another, step by step, naming the exact event, action and node each step uses. The step palette covered everything. Four places lacked an event or action a module should publish (quote, payment and stock count sent for approval; opening the leaving checklist); the owner had them added. A client wait beyond the contract's allowed time now counts against that client obligation automatically, the daily site log can be returned but not rejected, and a "for each" step works over records linked to the one that started the flow (D-222). Next: the owner reviews the definitions, then the flow designer round (D-108).


## 2026-09-19 — Screen states confirmed

- The owner confirmed the state matrix. Opening a record you may not see by link now says so plainly ("Bu kaydı görme yetkiniz yok") instead of pretending it does not exist; search and lists still never show it (D-221). Typed input survives a dropped connection. Next: the eight end-to-end flows with the flow designer.


## 2026-09-19 — Per-screen states (draft)

- `docs/ui-ux/SCREEN_STATES.md` writes down, for every screen, what it says when it is empty and what it offers to do, and the states only that screen has (a record already decided by someone else, a period that cannot close yet, a price still waiting for its exchange rate). Common rules cover loading, errors, missing permission and a lost connection once for all screens. Awaiting owner review (TASK-0051).


## 2026-09-19 — Daily site log screen confirmed

- The owner confirmed SCR-021 with its four added details (a "no work in this section today" option, skipping the rest on a no-work day, showing who is editing a section, remembering the chosen view). Next: the per-screen state matrix.


## 2026-09-19 — Daily site log screen

- The owner chose stepped entry by default, with a section list for those who want it, and a day strip across the top coloured by each day's state (D-220). `docs/ui-ux/screens/SCR-021-daily-site-log.md` lays out the fifteen sections with the rules each carries, how two people enter one day, recall and correction, and every state — built from installed COSS components. This answers the last open item of OQ-027, which is now closed. One derived rule awaits confirmation: the view a person chose is remembered.


## 2026-09-19 — Screen patterns confirmed

- The owner confirmed `docs/ui-ux/SCREEN_PATTERNS.md` (TASK-0049). Next: the daily site log screen, including OQ-027 item 3.


## 2026-09-19 — Standard screen patterns

- `docs/ui-ux/SCREEN_PATTERNS.md` defines the list, detail and form patterns every module uses, each mapped to COSS components already installed — no custom component was needed. The owner chose section tabs with collapsible parts for detail screens, pages on desktop and "Daha fazla göster" on phones, and short forms in a dialog with long ones as full pages under a fixed save bar (D-219).


## 2026-09-19 — Screen inventory confirmed

- The owner confirmed the inventory and asked for a separate "Raporlar" entry instead of reports opening only from module screens; it sits in the work layer below "Görevler" (SCR-017, D-218). Next: the list, detail and form standards.


## 2026-09-19 — Screen inventory (Phase 02 starts)

- `docs/ui-ux/SCREEN_INVENTORY.md` lists every screen of the panel inside the menu CHG-004 already built: what kind of screen it is, its address, the requirements it carries and who sees it by default. A script confirmed that all 438 requirements land on a screen, apart from eight platform rules listed as screen-less, and each of the 26 management questions now points at the screen that answers it. The owner placed the strategy screen under Finans and made "Sistem gözü" a second tab of the owner's "Bugün" (D-217); the flow designer and the record-type builder keep their own round (D-108). Screens get `SCR-<NNN>` ids.


## 2026-09-19 — Phase 01 closed

- The owner approved the exit of Phase 01. What it leaves behind: 438 confirmed requirements in 26 files, each with its layer and its capability catalog; every scope section mapped to them and the source folder removed; a confirmed glossary of 266 terms; the permission matrix; a domain model of 24 modules; the architecture principles; and the slice order with a sample-data pilot plan. The KVKK data inventory waits for the real-data gate (DEF-007). Phase 02 — screens, information architecture and user flows — is now the current phase.


## 2026-09-19 — Slice order and pilots

- The owner kept the slice order as planned and chose to pilot every slice on sample data only, against the recommendation of a real site after the sample run: real company data first enters at the Phase 19 rollout, after the KVKK check (D-216). The pilot site and people are named before slice 1's build ends, now an exit condition of Phase 09. With this every Phase 01 deliverable is in; the phase awaits the owner's exit approval.


## 2026-09-19 — Domain model complete

- The owner confirmed batch 4. `docs/domain/DOMAIN_MODEL.md` now covers 24 modules — main records, relations and the rules that must never break, each tied to its requirement — and the glossary gained 32 structural record names along the way, all confirmed (TASK-0046). One Phase 01 item remains: slice order and pilot users (TASK-0047).


## 2026-09-19 — Domain model, batch 4

- The owner confirmed batch 3 and its six record names. Batch 4 — meetings, support, performance, recommendations and strategy — completes `docs/domain/DOMAIN_MODEL.md`, with three new record names proposed in the glossary.


## 2026-09-19 — Domain model, batch 3

- The owner confirmed batch 2 and its six record names. Batch 3 adds equipment, HR, CRM, quotes, contracts and quality/OHS to `docs/domain/DOMAIN_MODEL.md`, with six new record names proposed in the glossary.


## 2026-09-19 — Domain model, batch 2

- The owner confirmed batch 1 and its seventeen record names. Batch 2 adds inventory, purchasing, factory and finance to `docs/domain/DOMAIN_MODEL.md`, with six new record names proposed in the glossary.


## 2026-09-19 — Domain model, batch 1

- `docs/domain/DOMAIN_MODEL.md` starts with six rules common to every module and the platform and first-slice modules (IAM, AUD, DOC, WFL, TSK, ADM, PRJ, SIT, RPT): their main records, how they relate, and the rules that must never break, each tied to the requirement it comes from. Seventeen structural record names were added to the glossary first, as PROPOSED.


## 2026-09-19 — Permission matrix confirmed

- The owner confirmed the default role templates in `docs/domain/PERMISSION_MATRIX.md` (TASK-0045). Next: the domain model per module (TASK-0046).


## 2026-09-19 — Permission matrix draft; KVKK inventory deferred

- The owner asked not to get stuck on KVKK now. The KVKK data inventory, a Phase 01 deliverable, is deferred rather than dropped (D-214, DEF-007): it becomes part of the check before the first real personal data is entered, where RISK-001 already returns to the owner.
- `docs/domain/PERMISSION_MATRIX.md` drafts the default role templates — fifteen roles against every module, with what each sees, enters and whether it sees commercial or sensitive data. The requirements settled most cells; the owner answered the four they did not (D-215): the general manager sees salaries by default (REQ-HR-002 reworded), coordinators see their own sites' costs, the technical office sees quote prices and margins, purchasing sees order prices and the supplier account. The whole matrix awaits the owner's confirmation (TASK-0045); the domain model (TASK-0046) and pilot users (TASK-0047) are the other two open exit items.


## 2026-09-19 — `docs/sources/` removed

- With the owner's approval the three starting documents — the functional scope, the architecture principles and the original engineering protocol — were removed from the repository (TASK-0027). Nothing is lost: their text is at Git tag `scope-archive`, the scope's sections are mapped to requirements at the end of `docs/requirements/README.md`, the principles live in `docs/architecture/PRINCIPLES.md`, and the protocol in `ai/PROJECT_RULES.md`. Every record that named one of the files now says where it went.
- The validator was wrong about removed paths in two ways, both fixed: a line that describes a removal was still listed as a "forward reference to a file not written yet", and a citation of a deleted folder (`docs/sources/`) was not recognised as deleted at all. A deliberate bad line now fails for both a deleted file and a deleted folder.


## 2026-09-19 — Architecture principles have a permanent home

- Before the source folder goes, its fifteen architecture principles were checked one by one against the records. Twelve are already carried by an ADR, a decision or requirements. Three were only implied — one master record per fact, people enter facts and the system computes results, reports read from summary views — so `docs/architecture/PRINCIPLES.md` now states all fifteen and the layer model, each with where it is decided, and binds the three open ones to the phase that must honour them (Phase 04 data model, Phase 02 forms, Phase 03 read models).


## 2026-09-19 — Glossary confirmed

- The owner confirmed the 219 proposed glossary terms in four rounds of grouped questions (15 groups, shown by their Turkish name and meaning). A script checked that the terms shown were exactly the terms pending — none left out, none extra — before marking them. The glossary now holds 234 CONFIRMED terms and no PROPOSED or OPEN ones; OQ-007, TASK-0020 and TASK-0014 are closed. A new term still starts PROPOSED and is confirmed with the module that introduces it.


## 2026-09-19 — The records cite requirements, not scope sections (TASK-0039)

- Before the functional scope leaves the repository, every citation of it was replaced by the requirements that now carry it: 835 citation chains in 41 files. A tool did it, not a hand: it built the map of all 243 scope headings from the requirement files' source lines first, and kept that map at the end of `docs/requirements/README.md` as the one record allowed to hold section numbers. The scope itself stays readable at Git tag `scope-archive`.
- Section signs that belong to other documents were left alone and, where they did not say so, now name their document (DESIGN_SYSTEM_RULES, PROJECT_RULES, ADRs, the original protocol). The requirements index and the module map lost their section columns, which the map replaces.
- The owner chose this over keeping the citations with a map (D-213). The validator now fails on any § that does not name its document. TASK-0039 is done and TASK-0027 is unblocked; what it still needs is a check that the architecture principles are all carried by ADRs, and owner approval.


## 2026-09-19 — Every module has confirmed requirements

- The owner confirmed REQ-NFR. With it the module rounds of Phase 01 are finished: 26 requirement files, 438 requirements, all CONFIRMED, each with its layer and its capability catalog. TASK-0044 and TASK-0041 are done. Only data import (MIG) waits, deferred by DEF-001.
- What still stands between Phase 01 and its exit: remapping § references to requirement ids (TASK-0039), which then lets `docs/sources/` be removed (TASK-0027); glossary confirmation (OQ-007, TASK-0020); OQ-027 item 3 (Phase 02) and OQ-026 (Phase 03).


## 2026-09-19 — NFR requirements, the last module round

- Four platform decisions (D-209…D-212): at most one hour of data may be lost in a major failure (the owner accepted an hour against the recommended fifteen minutes) and the panel is back within four hours; the interface stays Turkish only; and the system is sized for 50–150 signed-in users.
- `REQ-NFR.md` (20) gathers the cross-cutting rules: no record means not done; the panel is the only official record; the panel keeps working when an outside source fails, except that the exchange rate follows REQ-ADM-013 and never silently falls back; every REQ-NFR-005 alert maps to a catalog event; the REQ-NFR-004 management questions must each have a screen in the Phase 02 inventory; the standard list, detail and form screens; accessibility; and the four platform decisions.


## 2026-09-19 — RPT REQ-RPT-015 confirmed

- The owner confirmed REQ-RPT-015…023: REQ-RPT is complete (23), 418 requirements CONFIRMED in all. Next: NFR, the last module round.


## 2026-09-19 — RPT REQ-RPT-015 requirements

- Three reporting decisions (D-206…D-208), all as recommended. The official daily site report is produced as soon as the log is approved but goes to the client only when a person sends it, so no workflow ever mails data out; reports are ready-made with filters and saved views rather than a report designer; and scheduled reports reach internal users only, each copy filtered by its reader's permissions. Scheduling is a workflow with a new catalog action, `report.send_to_users`, in keeping with D-181.
- REQ-RPT gains REQ-RPT-015…023, DRAFT, layer-tagged; the first fourteen stay confirmed.


## 2026-09-19 — STR confirmed

- The owner confirmed REQ-STR with both derived rules: 8 more requirements CONFIRMED, 409 in all. Next: RPT REQ-RPT-015, then NFR.


## 2026-09-19 — STR requirements

- Four strategy decisions (D-202…D-205), all as recommended: a budget at the same detail as the books (month, cost center, expense type); nominal TL with an optional CPI-adjusted view that never changes a record; investment payback shown both simple and discounted, fed by rent paid, idle days and utilisation; and a health scorecard of colours per area with every colour explainable, and no single company score.
- `REQ-STR.md` (8) is written, DRAFT, layer-tagged, with its catalog; eight proposed glossary terms were added first. Two derived rules await confirmation: an approved budget changes only by a revision that keeps the first, and annual targets double as the company target in performance.


## 2026-09-19 — MTG, DOC, SUP confirmed

- The owner confirmed REQ-MTG, REQ-DOC and REQ-SUP with both derived rules: 23 more requirements CONFIRMED, 401 in all. Next: STR.
- Commit `b750f52` carried only half of this (MTG and DOC marked, SUP and the records not): the confirmation script stopped on an unexpected suffix and the commit ran anyway. This entry completes it.


## 2026-09-19 — MTG, DOC and SUP requirements

- Three decisions (D-199…D-201), all beyond the recommendation. Meetings are visible by role scope — a site meeting to everyone who sees the site; minutes are final as soon as they are saved, with no approval or objection window; and archive search reads document contents, including text recognition of scanned papers and photos. Whether recognition may send documents to an outside service is left as an owner question for Phase 03.
- `REQ-MTG.md` (8), `REQ-DOC.md` (10) and `REQ-SUP.md` (5) are written, DRAFT, layer-tagged, with catalogs; seven proposed glossary terms were added first. Two derived rules await confirmation: a new meeting on the same project brings the earlier meetings' open decisions onto its agenda, and a resolved support ticket closes by itself if its opener does nothing.


## 2026-09-19 — INT confirmed

- The owner confirmed REQ-INT: 14 more requirements CONFIRMED, 378 in all. Next: MTG.


## 2026-09-19 — INT requirements

- Four decisions (D-195…D-198), all as recommended. Recommendations come from defined rules with their reasoning and figures always visible — no AI model, no data leaving the panel. An acceleration scenario that crosses a defined limit (legal overtime, casting per mold count, an open critical OHS finding) is marked "not recommended" and cannot be chosen; an approved scenario becomes the project's management target and flows into daily targets, tasks and a bonus rule; a recommendation not acted on is closed with a reason and returns only if things change markedly.
- `REQ-INT.md` (14) is written, DRAFT, layer-tagged, with its catalog; six proposed glossary terms were added first. REQ-PRF-001 now points to the catalog requirement REQ-PRF-008 (it pointed to -009 by mistake).


## 2026-09-19 — PRF confirmed

- The owner confirmed REQ-PRF with both derived rules (a mid-month position change blends the score by days; subcontractor crews are compared but get no score or bonus): 20 more requirements CONFIRMED, 364 in all. Next: INT.


## 2026-09-19 — PRF requirements

- Eight performance decisions (D-187…D-194), four against the recommendation. The KPI catalog starts empty in the panel instead of importing the Excel guide; scores and bonuses are both monthly; there is no objection process; and site profit never enters a coordinator's score. Two of these changed the scope's wording (REQ-PRF-001…002, REQ-PRF-006, REQ-PRF-008…011, REQ-PRF-013), corrected in place with notes.
- The bonus is paid outside payroll — but because a bonus is wages in law, every payment enters the accountant's monthly file; a percentage bonus runs on base salary and is as sensitive as the salary. A KPI the panel cannot compute is scored by the direct manager with a reason; a critical score opens a development meeting that only the person, their managers and HR can see.
- `REQ-PRF.md` (20) is written, DRAFT, layer-tagged, with its catalog; eight proposed glossary terms were added first. Two derived rules await confirmation: a mid-month position change blends the score by days, and subcontractor crews are compared but get no score or bonus.


## 2026-09-19 — QHS confirmed; medical reports leave the panel

- The owner confirmed REQ-QHS with its derived PPE paper-record rule: 16 more requirements CONFIRMED, 344 in all.
- D-183 kept health information out of accident records, which left REQ-HR relying on medical reports. The owner settled it (D-186): the panel keeps only that a report exists and its dates — for the personnel file, periodic health reports and sick leave alike — and never the document. REQ-HR-002, -003 and -014 were reworded to say so. Next: PRF.


## 2026-09-19 — QHS requirements

- Four quality and safety decisions (D-182…D-185). A lot that fails a test stays usable and raises a decision task rather than a quarantine; no health information is kept for accidents — which leaves a question for REQ-HR, where medical reports still appear; PPE is handed out by count and confirmed by the person on the phone; and a serious accident or an open critical OHS finding voids a site's speed and bonus target for the period, while reporting a near miss never counts against anyone.
- `REQ-QHS.md` (16) is written, DRAFT, layer-tagged from the start, with its catalog; eleven proposed glossary terms were added first. One derived rule awaits confirmation: a person without an account signs a paper PPE record.


## 2026-09-19 — CMP and the layer scan confirmed

- The owner confirmed REQ-CMP with both derived rules (framework price proposed on orders; a contract amendment is a new dated version) and the layer scan of D-181 with its three rewordings: 17 more requirements CONFIRMED, 328 in all. Next: QHS.


## 2026-09-18 — Every requirement says which layer it is in

- The owner asked why the module questions were not workflow design. The answer is the three layers of D-077: records and calculations are fixed, processes are workflows, catalog values are settings. To make that visible, all 328 requirements now carry a layer line; 101 have a configurable part, named in its own line ("Akışla ayarlanan", "Tanımla ayarlanan"), so the owner can read what is in their hands without guessing.
- Three descriptions that read like fixed behaviour were reworded as default workflows (REQ-TSK-006, REQ-CRM-007, REQ-CMP-013); the meaning is unchanged. REQ-CMP-013 now publishes `notice_letter.create_draft`, so a workflow can produce the notice letter.
- The records validator refuses a requirement without a layer, or with a configurable layer that does not say what is configurable (D-181, PROJECT_RULES §21.1 item 12).


## 2026-09-18 — CMP requirements

- Four contract decisions (D-177…D-180). Contracts cover clients, subcontractors and — beyond the recommendation — long-term supplier agreements, all as trackable terms rather than PDFs. An extension of time runs from request to the client's decision and only then moves the end date and the penalty; a late client obligation produces a draft notice letter that someone decides to send; a guarantee letter's bank commission is charged to its project.
- `REQ-CMP.md` (17) is written, DRAFT, with its catalog; eight proposed glossary terms were added first. Two derived rules await confirmation: a supplier framework price is proposed on new orders, and a contract amendment is a new dated version.


## 2026-09-18 — QTE requirements confirmed

- The owner confirmed REQ-QTE, including the derived rule that a won quote cancels the request's other open quotes: 18 more requirements CONFIRMED, 311 in all. Next: CMP.


## 2026-09-18 — QTE requirements

- Four quote decisions (D-173…D-176). Quote estimates, like project results, carry no share of general expenses — against the recommendation of a separate line — so REQ-QTE-005…006 was corrected in place, and covering general costs is left to the target margin. Estimated costs are proposed from what the item actually cost last time; a sales order reserves its stock; each shipment of a product order gets its own invoice.
- `REQ-QTE.md` (18) is written, DRAFT, with its catalog; seven proposed glossary terms were added first. REQ-CRM-014 now says outright that a won product quote becomes a sales order, not a project (REQ-QTE-014…015, REQ-QTE-018). One derived rule awaits confirmation: when one of a request's quotes is won, its other open quotes are cancelled.


## 2026-09-18 — CRM requirements confirmed

- The owner confirmed REQ-CRM, including the derived rule that a project opened from a won request starts at the contract stage: 14 more requirements CONFIRMED, 293 in all. Next: QTE.


## 2026-09-18 — CRM requirements

- Four CRM decisions (D-169…D-172), all as recommended. Requests from e-mail and WhatsApp are typed in on a quick-entry screen with the message attached — no mailbox reading, no WhatsApp link. The client scorecard is worked out from the records, with dated notes but no manual score. A won request opens a draft project already filled from the request and the accepted quote; the project starts at the contract stage and takes its earlier stages from the request (a derived rule, to be confirmed, that keeps REQ-PRJ-003 consistent).
- `REQ-CRM.md` (14) is written, DRAFT, with its catalog; five proposed glossary terms were added first.


## 2026-09-18 — HR requirements confirmed

- The owner confirmed REQ-HR, including the derived rule that a mid-month unit change splits the salary cost by date: 16 more requirements CONFIRMED, 279 in all. Next: CRM.


## 2026-09-18 — HR requirements

- Six HR decisions (D-163…D-168). The panel will calculate payroll itself, from gross to net, with tax brackets, SGK rates and the minimum wage kept as dated definitions — against the recommendation to take the figures from the accountant; the accountant still files the official returns and the two sets of figures are reconciled every month. This opens RISK-011: a payroll engine must keep up with the law and is proven against the accountant's sample payrolls. Salary cost stays with the unit a person is registered to, leave entitlement is typed in by HR, advances come off later payrolls, and salaries go out as a bank bulk payment file.
- `REQ-HR.md` (16) is written, DRAFT, with its catalog; seven proposed glossary terms were added first. One derived rule awaits confirmation: a mid-month unit change splits the salary cost by date.


## 2026-09-18 — EQP requirements confirmed

- The owner confirmed REQ-EQP, including the derived rule that grouped items are expensed on purchase and not depreciated, and the added equipment section in REQ-SIT-003: 21 more requirements CONFIRMED, 263 in all. Next: HR.


## 2026-09-18 — EQP requirements

- Eight equipment decisions (D-155…D-162). A crane or mold charges its daily depreciation to a site only on the days it works there — marked by the engineer in the daily site log, or taken from the crane log — and every other day lands in a company-wide idle equipment expense, never on a project. An asset that breaks is written off to the site it was on; hand tools are counted per location instead of carded; any asset can be rented; a vehicle changes hands only when both people confirm on their phones.
- Two answers went against the recommendation and changed the scope, corrected in place with notes: depreciation by working day instead of every day on site (REQ-EQP-010, REQ-EQP-012), and no savings figure for the service vehicle (REQ-EQP-021). REQ-SIT-003 gains the equipment section the first one needs.
- `REQ-EQP.md` (21) is written, DRAFT, with its catalog; nine proposed glossary terms were added first. One derived rule awaits confirmation: grouped items are expensed on purchase and not depreciated.


## 2026-09-18 — FIN requirements confirmed

- The owner confirmed REQ-FIN, including the derived rule that the factory and the office close their own month: 30 more requirements CONFIRMED, 242 in all.
- The contradiction D-149 left in the scope is fixed at its source: REQ-FIN-013, REQ-FIN-017 no longer lists an overhead share among a site's costs, and the REQ-FIN-017 formula counts only costs recorded directly on the project. Both places carry a note naming D-149. The overhead markup in quote estimates (REQ-QTE-005…006) is a different question and goes to the QTE round.


## 2026-09-18 — FIN requirements

- Eight finance decisions (D-147…D-154). A quantity the client refuses carries over to the next month; subcontractors are paid on the production we approved, without waiting for the client; a client advance is recovered from progress payments; the expected collection date comes from the contract's term; when one spending arrives twice, the first entry books it and the second is linked; the accountant gets a monthly export file. Two answers went against the recommendation: general expenses are not spread over projects — which changes the scope's "overhead share" wording in REQ-FIN-013, REQ-FIN-017 and REQ-FIN-017 — and each site closes its own month, with the factory and the office as units of their own (a derived rule marked for confirmation).
- `REQ-FIN.md` (30) is written, DRAFT, with its catalog; ten proposed glossary terms were added first.


## 2026-09-18 — Slice 2 requirements confirmed

- The owner confirmed REQ-INV, REQ-PUR and REQ-FAC, including the derived transfer rule (a transfer leaves at the source average; its transport is added at the destination): 48 more requirements CONFIRMED, 212 in all. Next: FIN.

## 2026-09-18 — Slice 2 requirements: INV, PUR, FAC

- The scope already fixes most of inventory — the costing order, freezing cost at consumption, negative stock with a critical warning, counts posted as adjustments, the locked opening stock. Five cost decisions remained (D-142…D-146): galvanising and inbound transport belong to a strip's cost; the average cost is kept per location (against the recommendation of one company-wide average), with transfers leaving at the source's average and their transport added at the destination — a derived rule marked for confirmation; over-delivery within tolerance is simply accepted; factory overhead is spread by labour hours; and the factory log, like the site log, counts only once approved.
- `REQ-INV.md` (27), `REQ-PUR.md` (11) and `REQ-FAC.md` (10) are written, DRAFT, with their catalogs; fourteen proposed glossary terms were added first.


## 2026-09-18 — TSK, AUD, PRJ and ADM confirmed

- The owner confirmed REQ-TSK, REQ-AUD, REQ-PRJ and REQ-ADM: 49 more requirements are CONFIRMED, 164 in all. Next come the Slice 2 modules — inventory, purchasing and the factory.

## 2026-09-18 — The gate checks what is actually committed

- `REQ-ADM.md` was left out of its own commit: `git commit -a` does not pick up new files, and the gate passed because its checks read the working tree, where the file was. It was committed straight after. The gate now refuses a commit while untracked files sit in the tracked folders, so the same slip cannot recur.

## 2026-09-18 — REQ-ADM

- Master data: a new list item is usable the moment it is added — after the similar ones are shown — and duplicates are merged later without losing their history; the exchange rate is the previous business day's CBRT buying rate, and a missing rate stops dollar transactions from being quietly priced at an old one; a price may be back-dated, but only unapproved transactions feel it.
- `REQ-ADM.md` holds 15 requirements. With TSK, AUD, PRJ and ADM, the modules Slice 1 leans on now have requirement files too.


## 2026-09-18 — REQ-PRJ

- Projects: targets never change in place — the technical office enters a new project revision, it becomes valid on approval, earlier revisions stay with their dates, and over-casting is always judged against the revision valid that day, so nobody can raise a target to make an over-cast disappear. Daily targets are calculated from the chosen duration, the remaining work and the calendar, and can be corrected by an authorised person. Every site belongs to exactly one project.
- `REQ-PRJ.md` holds 11 requirements. On the way, the requirement index was corrected: panel and strip type definitions are catalogs and belong to ADM, as REQ-SIT had already said; only the project targets stay with PRJ.


## 2026-09-18 — REQ-TSK and REQ-AUD

- Tasks and notifications: a manual task can go to anyone in the giver's scope; whoever gives it decides whether it needs their approval to close; everything shows in the panel, while new tasks, approval requests and critical alerts also reach the phone as a browser notification, and e-mail carries only the morning digest — which every user now gets for their own work, the owners also for the company. That answers OQ-016.
- Audit: nothing is ever deleted, and — the owner's choice against the recommendation — personal data is never anonymised either. That leaves KVKK erasure requests unanswerable; it is written into RISK-001 and REQ-AUD-003 makes sure it returns to the owner before real HR data is entered. The company-wide audit screen is for the owners alone, and an audit entry can be changed by no one, owners included.
- `REQ-TSK.md` (13) and `REQ-AUD.md` (10) are written, DRAFT. TASK-0044 now tracks the remaining modules.


## 2026-09-18 — Slice 1 requirements confirmed

- The owner confirmed REQ-WFL, REQ-IAM, REQ-SIT and REQ-RPT: 115 requirements move from DRAFT to CONFIRMED and TASK-0021 is done. Phase 01 continues with TSK and AUD, the two modules Slice 1 leans on.

## 2026-09-18 — REQ-RPT; Slice 1 has its requirements

- One round, four decisions, all as recommended (D-126…D-129): an attention item closes only when its cause is gone — nobody can dismiss it, only mark it seen; indicators come from a per-role default that each person can adjust; the "company through the system" view is for the owners and the general manager; the loss diagnosis card is always there and jumps to the top when a site is losing money.
- `docs/requirements/REQ-RPT.md` holds 14 requirements. Reports and exports (REQ-RPT-015) are left for their own round.
- With it, the four modules of Slice 1 — WFL, IAM, SIT, RPT — have requirement files: 115 requirements, all DRAFT until the owner confirms them.
- The glossary gained the entry screen, indicator, attention item and loss diagnosis. It forbids `dashboard` for general screens, which the code still uses for "Bugün"; that rename is TASK-0043 rather than a silent change.


## 2026-09-18 — REQ-SIT, and the event names follow the glossary

- The site module got its round: seven decisions (D-119…D-125). Several people fill the same day's log section by section and one person submits it; the sender can recall it until the approver decides; over-casting can be entered but not submitted without an explanation; a missed day can still be entered, marked late for good; the suggested consumption can be corrected and the difference is shown to the approver.
- Two answers went against the recommendation and are recorded with their cost: client handover times rest on our own record alone, which weakens the evidence in a dispute; and subcontractor workers are recorded by name, which is personal data of people who are not our employees and is tracked under RISK-001.
- `docs/requirements/REQ-SIT.md` holds 35 requirements and a capability catalog.
- The glossary names the daily log `Daily Site Log` and forbids `waste` because it is ambiguous (loss, damaged unit and scrap are three different things here). The naming standard, the module map, the catalog template and the presentation sandbox all still said `daily_log` or `waste`; they now say `daily_site_log` and `damaged_unit`. The module map also stopped promising an event catalog in `docs/domain/` — the catalogs live in the REQ files, one source.


## 2026-09-18 — REQ-IAM, and a banned word caught

- IAM got its round: two sets of four plain-language questions, eight decisions (D-111…D-118). Roles are handed out with a scope — a site engineer for Kavaklı only — and the hierarchy runs between roles with a per-person override. Someone with two roles uses both at once and every action records which role it was taken under. The owner layer may be held by several partners, any one of whom completes an "owner approval". Commercial and sensitive visibility is granted module by module, delegation can come from the person or the manager, and access closes by itself on the leaving date.
- `docs/requirements/REQ-IAM.md` holds 27 requirements and a capability catalog that deliberately publishes no action: nothing a workflow runs may grant or remove access.
- Writing the catalog meant checking the glossary, which showed that REQ-WFL had used `flow` in its event codes — a word the glossary forbids in code (the term is `workflow`). Fixed, and thirteen proposed terms were added to the glossary before being used.


## 2026-09-18 — The first requirement file: REQ-WFL

- Phase 01 produced its first requirement file. `docs/requirements/REQ-WFL.md` holds 39 requirements — layers, the capability catalog and its contract tests, the node palette and what the designer may never do, triggers and conditions, the approval centre with its three outcomes and mandatory reasons, authority and publishing, templates, locks and exceptions, central rules, traceability and the record-type builder — each with acceptance criteria and its source. No new questions were needed; OQ-028 was this module's round.
- The capability catalog now has a template (`docs/requirements/README.md`), and REQ-WFL carries the first catalog.
- The validator learned to check decision and requirement ids: a `D-NNN` or `REQ-XXX-NNN` that nothing defines now fails the check. `PROJECT_RULES` §21.1 claimed this already and also claimed that every decision is cited by an ADR, CHG or task — neither was implemented. The first is now true; the second was removed from the rule rather than left as a promise the tool does not keep.


## 2026-09-18 — The shell work is approved

- The owner approved the eight tasks that were waiting: the presentation sandbox, the five steps of the navigation transfer, the emptied approval and task screens, and the CHG-005 record machinery. CHG-003, CHG-004 and CHG-005 are closed in the roadmap register, and nothing runs in parallel with Phase 01 any more.


## 2026-09-18 — main guarded and pushed by machine (D-110)

- The single-branch rule said `main` stays green; now a hook makes sure of it. Every commit runs the whole check first — records in strict mode, types, lint, tests, formatting, about twenty seconds — and a red commit is refused. It would have stopped the formatting error that sat unnoticed on `main` for days.
- Every commit on `main` is then pushed automatically, so the local copy and GitHub never drift apart. A failed push never loses the commit; it says so and the next one catches up.

## 2026-09-18 — One branch (D-109)

- The owner removed the separate-branch rule: work goes straight to `main` in small, frequent commits. The two direct-to-`main` exceptions written down earlier the same day are now simply the rule.
- What keeps that safe is that `main` must be green on every commit — `npm run check` before committing, the pre-commit gate for the records, and, once CI exists, no new work on top of a red build. Spike branches stay, and stay unmerged, because spike code never becomes product code (ADR-007).


## 2026-09-18 — The work layer stops pretending (TASK-0040)

- The five shell tasks awaiting review were checked against the CHG-006 decisions. Three were untouched by them (context row, "Bugün", phone bar). The rest carried sample content that now contradicted the decisions: an approval queue with two outcomes where there are three, and tasks and notifications that could not say what produced them.
- The owner chose to remove the samples rather than dress them up (D-106). "Onaylar" and "Görevler" show their empty states, the bell says "Bildirim yok." with no count, the badges show nothing, and the "Bugün" figures that mirrored those lists read zero — an empty list next to "3 bekleyen onay" would have been the same contradiction D-070 once fixed. An empty work block also stopped wearing the "Örnek veri" label, which only makes sense on sample rows.
- What the real screens must do is recorded instead: three outcomes, a mandatory reason on reject and send-back (D-107), and a visible source on every approval, task and notification. The "İş Akışları" entry waits for its own question-and-brainstorm round (D-108).
- `app-sidebar.tsx` is Prettier-clean again, so `npm run check` passes on the whole tree for the first time since TASK-0032.


## 2026-09-18 — CHG-006 folded into the plan

- The owner read the impact analysis and approved it. The record-type builder gets its own step, **09R**, after the Slice 1 pilot (D-105): no slice depends on it, so no module screen waits for it, and it is shaped by real use.
- ADR-006 now carries the whole ruleset — the two new nodes, three-outcome approvals, free windowed conditions with their safeguards, the trigger list, the four ways to address a step, the authority model with its one hard rule (flow design only for full-visibility roles, enforced in code), publish controls, templates as copies, traceability, chained short flows, and the list of what the designer can never do. ADR-005 records, in so many words, that the record-type builder is a deliberate step toward what it once rejected, and names D-077 as the line that keeps the panel from becoming a low-code platform.
- The roadmap gained CHG-006 scope in Phases 01, 02, 03, 04, 06, 07 and 08 and a new Phase 09R. TASK-0041 (capability catalog) and TASK-0042 (REQ-WFL-011, REQ-WFL-028 as real flow definitions) were opened. REQ-WFL-011, REQ-WFL-028 moved from `REQ-NFR` to `REQ-WFL`, closing the last open CHG-005 finding.
- The palette test moved to `docs/workflows/README.md` with how each gap was closed; the root direction file was deleted, as it had said it would be.
- A new validator check — every task row must have six columns — found three malformed rows on its first run (TASK-0025, TASK-0026, and TASK-0038 from this session), all fixed.
- The owner's product-code freeze ended with this fold. ADR-007 applies as before: Phase 01 is still design.


## 2026-09-18 — The workflow platform is decided, question by question (OQ-028 → CHG-006)

- The owner answered all of OQ-028 in seven rounds: 28 questions, recorded as D-077…D-104 with a CHG-006 impact analysis. Plain-language question boxes, three or four at a time, each with a recommendation; where the owner went another way the AI's objection is written next to the decision rather than argued again.
- Where it landed: calculations stay fixed and processes become configurable; code may be split finely but the controlled boundary stays at the 25 modules, with contract tests so a module can never silently break a flow built on it; a flow never writes the ledger; a running flow acts with system authority, made safe by allowing only full-visibility roles to build flows; approvals have three outcomes; conditions may look back over time freely; an end-to-end process is short flows triggering each other.
- The owner chose the **free record-type builder** — people define their own record types with fields, relations, screens and reports — after being told twice what it costs. RISK-002 grows and RISK-010 is new.
- The owner's note mid-round — the designer decides which roles and permission types touch each step, and roles are made of permission types — became D-097, D-098 and D-101: steps can be addressed by permission type, role, relationship or person; there is no temporary permission; the designer defines and assigns roles while designing.
- A correction, recorded where it was made: two of the options in round 3 described the same phase order, so the owner's choice keeps the roadmap order unchanged, and the first note that it made RISK-005 worse was wrong.
- E-mail as a flow trigger is deferred (DEF-006). The five shell tasks awaiting review are to be re-reviewed against these decisions (TASK-0040) before approval.
- Nothing in the roadmap has moved yet: the fold waits for the owner's approval of the impact analysis and one open choice — where the record-type builder is built.


## 2026-09-17/18 — The records now check themselves (CHG-005)

- An audit of the state system found **nine contradictions**. The roadmap was two days stale and did not contain CHG-003 or CHG-004 at all, although both were approved and largely built; `CODE ALLOWED` forbade code that had already shipped; Milestone M1 still promised a first screen that M0 had already delivered; Phase 02 was marked `NOT_STARTED` while D-054…D-070 decided most of it; Phase 07's scope listed finished work; ten tasks sat under the wrong heading; six "Last updated" stamps were wrong; hundreds of `§` citations pointed at a directory scheduled for deletion; and the REQ-WFL-011, REQ-WFL-028 flows were filed under `REQ-NFR`. All are fixed or explicitly recorded.
- **The roadmap is now the single authority** and says so in its own header. It gained a change-request register (CHG-001…CHG-006, each with the phases it moved) and a "work delivered ahead of its phase" table, so no phase is entered believing its scope is untouched. Phases 02 and 07 are `PARTIALLY_DONE`, each listing what was delivered and what it still owes.
- **Milestone M1 was redefined rather than cancelled** (D-074): its original content was consumed locally by M0 and CHG-004, so it becomes the staging milestone — the same screens plus foundation services on a deployed environment, with proven deploy and rollback. What local review never proved: environment configuration, secrets handling, session behaviour behind the proxy, restore and rollback.
- **`docs/sources/` may no longer be deleted on schedule** (D-075). TASK-0027 is `BLOCKED` behind a new TASK-0039 that remaps every `§` citation to a REQ id. Deleting first would have stripped the reasoning out of the decision record.
- Rules alone were not the answer, because the rules already existed — what was missing was anything that checks them. So: `scripts/check-records.mjs` (`npm run records`, also inside `npm run check`) asserts ten invariants — unique ids, known statuses, every CHG present in the roadmap, every referenced id and path resolvable, stamps not older than the file's last commit. It found two real faults while being written: a duplicate `D-071` and three stale stamps.
- `.githooks/pre-commit` runs it in strict mode and refuses an inconsistent commit; strict mode also requires that a record changed in the commit carries today's stamp. Enabled once per clone with `git config core.hooksPath .githooks`, recorded in `docs/standards/GIT_WORKFLOW.md`.
- **Session continuity stopped depending on a model remembering to write a handoff.** `ai/SESSION_JOURNAL.md` is append-only and written by a `PostToolUse` hook after every file change, so a session that is cut off still leaves an accurate record; a `SessionStart` hook prints a resume block — uncommitted diff, journal tail, unfinished tasks, records verdict — in that order, because the first two are facts the harness recorded and the handoff is only a claim the previous model made.
- Product code is **frozen** by owner instruction until CHG-005 and CHG-006 are closed. The workflow-platform direction is written up in `WORKFLOW_PLATFORM_DIRECTION.md` at the repository root with 21 open questions (OQ-028); it is a proposal, not a decision, and the file deletes itself into the roadmap once answered.
- **The REQ-WFL-011, REQ-WFL-028 flows were walked against the engine's node palette** at the owner's request, step by step, before anything is built on it. Two of the eight (toplantı kararı, sertifika/İSG) are fully expressible with ADR-006's twelve nodes; the other six exposed **six gaps** — no node creates or updates a record, no node iterates a list ("her zimmet için"), the approval node's reject and send-back outputs are undefined, conditions cannot read a windowed count ("son 30 günde 3 gecikme"), there is no way to wait on an approval from someone who is not a system user (the client, a public authority), and the trigger types are not written down. It also produced a design rule worth more than the gaps: an end-to-end flow is **several short flows chained by events**, not one long definition — 45.1 spans months and eight modules, and modelling it as a single running instance would create process instances that stay open for months and break on every version change.


## 2026-09-17 — The app wears one mark, and the name is text

- The wordmark logos left the product. The square tile is the only logo the application shows now, and the only full logo left anywhere is the particle figure on the sign-in screens, which samples the file directly.
- In the expanded rail the name sits next to the tile as text — GEOGES over PANEL — so the head leaves with the menu labels rather than being a second image to cross-fade. The tile keeps the same place in both states: it had been centring itself in the icon rail, which made it slide sideways as the menu closed, and it now sits on the same centre line as the icons below it.
- `BrandLogo`, its `tone` prop and `BrandFooter` went with the wordmark; `BrandFooter` had no callers anyway.


## 2026-09-17 — Group rows became one element, so their titles animate too

- The work-layer rows animated when the rail opened and closed, but the group titles did not. They were two different components — a collapsible row when the menu was open, a flyout trigger when it was a rail — and swapping components replaces the DOM, so there was nothing for a transition to hold on to.
- The row is one element now and only its behaviour changes: it folds the group open when there is room for the list, and opens the flyout when there is not. Fewer branches, and the titles slide, blur and fade like everything else.


## 2026-09-17 — "Bugün" keeps the work and the figures, and nothing else

- The owner took the two charts and the site summary off the entry screen. What is left is the seat's work block, the six key figures and the fold — which is closer to what the screen is for.
- Nothing was left behind to rot: the bar chart component, its two sample series, the site summaries and the two wide widgets in the registry went with them, and the registry's `size` field with those. The chart is in git history if a screen needs one later.


## 2026-09-17 — Work screens get their own content, and the menu its gutter (D-070)

- "Onaylar" and "Görevler" stopped being generated placeholders. The approval centre runs as a queue: one record fills the screen, a decision brings in the next, and the last one leaves "Bugün temiz" behind — which settles the first question of OQ-027 by building it rather than debating it. "Görevler" lists what is late, what is due today and what is coming, each task naming where it came from and linking to the screen where it is done.
- Sample data stays small on purpose: three approvals, one task per state. Every figure that also appears on "Bugün" was pulled into line with its list, so the badge, the card and the screen can no longer disagree — the approvals card said 12 while the badge said 3.
- The navigation sandbox was deleted: `src/sandbox/navigation`, its route and the account-menu entry. The product shell has replaced it. The presentation sandbox is untouched.
- The menu now sits in an even gutter: 8px to the frame on its left and 8px to the card on its right, in both states. That turned out to remove work rather than add it — with even side padding the custom sidebar width formulas were no longer needed, so the shell is back on COSS's own widths, with a 2px nudge in the collapsed state where the rail is 2px wider than the space it reserves.
- The logo transition became directional: the long logo leaves to the left and blurs, the square one arrives from the right and sharpens, 12px and 2px over 200ms, and nothing at all when the visitor asks for reduced motion. Three things had to be fixed to get there — Tailwind writes `translate-x-*` to the `translate` property, so a transition listing only `transform` left the slide instant; `blur-0` inside a variant did not clear a plain `blur-[2px]`, so the square mark stayed permanently blurred; and the mark, centred in a head that was itself narrowing, drifted left with the closing rail on top of its own animation. It now sits in a box its own size, pinned to the start.


## 2026-09-17 — Phone navigation: the rail becomes a bottom bar (CHG-004 step 5, TASK-0036)

- Below `md` the shell now carries its own bottom bar: Bugün and Onaylar, the seat's primary action in the middle where a thumb reaches, then Görevler and Modüller. Entries are permission-filtered exactly like the rail, so a subcontractor crew lead sees two of them and the owner four.
- "Modüller" opens a full-height drawer with a search box and a grouped icon grid — big targets, no keyboard needed, and the search folds Turkish letters so "santiye" finds the whole Şantiye & Günlük group. Picking a module navigates and closes the drawer.
- The header's menu button and its primary action are desktop-only now, so a phone has one way to navigate instead of two. The top bar keeps the page name, the search icon, notifications, theme and the account.
- The primary action moved into one component that both the header and the bottom bar render, so its behaviour has a single implementation. On a phone it is the plus alone — a round 44px button, its name kept as the accessible label — which gives the four navigation entries their room back.
- Found on the phone: on a site detail the section you were in could start off screen in the scrolling strip. The active section now scrolls itself into view whenever it changes.
- This refines REQ-NFR-008, which describes a hamburger drawer on phones. The drawer survives as the module grid; what changed is that the screens people use every day no longer live behind it.


## 2026-09-17 — "Bugün" replaces the cockpit, and the rail stops jumping (CHG-004 step 4, TASK-0035)

- `/dashboard` is now "Bugün": the seat's own work on the left, its six key figures on the right, the other nine behind a fold, then two charts and the site list. The M0 "Cockpit" heading is gone — the header already names the page, so the body opens with the date.
- Work first, figures second, and every work row reaches its own source: the owner's "Dikkat" rows lead to the pour, the site, the finance screen; the coordinator's lead into the approval queue; the site engineer's into today's log.
- Charts arrived as an approved custom element (COSS has none) without adding a charting library: at this size a bar is a box, so the chart is built from plain elements that keep their rounded ends crisp, take theme tokens directly and carry their own hover text. One series, no legend, only the last value labelled; a day with no work draws no bar, because a sliver would read as "a little"; profit is green and loss red, as those colours mean everywhere else (REQ-NFR-011).
- Found on screen and fixed everywhere: Geist Mono has no ₺ glyph, so the symbol was falling back to another font and sitting badly against the digits. DESIGN_SYSTEM_RULES §4 now reads "only the number is mono" — units and symbols are set in the body font by one shared `Figure` component, which the money component of DESIGN_SYSTEM_RULES §4 will build on. As a side effect "318 panel" no longer reads as code.
- Rail refinements from the owner's review: a user who has never touched the menu finds the first group open (a remembered choice still wins, including leaving everything closed); labels are clipped and fade instead of wrapping onto a second line during the 200ms animation; the two logos cross-fade inside a head of fixed height; the app card animates its margin with the rail instead of snapping; and the separator no longer carries its own margins, which had been giving the menu a horizontal scrollbar.
- The sidebar head also gave up COSS's own 8px padding: the logo now occupies the same 56px band as the app header, so it starts level with the card's top edge instead of 8px below it, in both the expanded and the icon state. The square mark grew from 32px to 40px along the way — 48px, which matched the long logo exactly, turned out to be too heavy for the rail.
- Sample data is still sample data, and says so: every figure block carries an "Örnek veri" badge. The objection stands on the record — a panel that shows invented numbers can be mistaken for a real one.


## 2026-09-17 — Context row: the second header line that appears only with an open record (CHG-004 step 3, TASK-0034)

- The row is delivered by Next.js' `@context` parallel route slot rather than by a prop each page has to remember to set. A page with no open record matches a slot page that renders nothing, so the shell is byte-for-byte what it was before: no row, same 56px header, same card.
- Judged on a sample site detail, because SIT does not exist yet: `/sites` lists three sample sites in a COSS `Frame`, and opening one shows the row. Each section is its own address with a Turkish slug (`/sites/kavakli/dokum`), so a section can be shared or bookmarked; the day travels in `?gun=`, and today leaves the address clean.
- Days are chosen with a strip of five plus a calendar popover; future days are disabled on both, and "today" is decided in the company's time zone rather than the server's (`platform/date/day.ts`, calendar days as plain `YYYY-MM-DD` strings so they survive URLs and the server/browser boundary).
- Found while verifying: the section strip was 53px inside a 44px row, because `overflow-x-auto` also makes the vertical axis `auto` and the reserved scrollbars grew the nav. Both axes are pinned now and the scrollbar is hidden.
- Slot behaviour was proven with a mirror probe (deleted): the row appears on a site address and is absent on `/dashboard` and `/sites`, both on a full load and on client-side navigation — the case where a slot otherwise keeps showing the previous page's row.
- Deviations logged as 15a–15c: a conditional second header row, COSS `Tabs` used as navigation links, and a hidden scrollbar on the section strip.


## 2026-09-17 — CHG-004 transfer, step 2: three-zone header (TASK-0033)

- Owner decisions D-061 (development role switcher with four sample seats), D-062 (page name + path, page-declared site selector, wide centred search in COSS's Command layout, page-or-seat primary action), D-063 (sample notifications behind the bell).
- New: `app-header.tsx`, `command-palette.tsx`, `preview-roles.ts`, `site-scope-preference.ts`, `search-text.ts`, `sample-notifications.ts`; registry items may declare `scope` and `primaryAction`; the app layout reads the seat cookie in development only; the account menu gained "Rol olarak görüntüle".
- Found while verifying: the left zone collapsed under the search at narrower widths (now the search gives way first, grid only from `xl`); "gorev" did not find "Görevler" (Turkish-insensitive filter added); the chosen site would reset after visiting a page without a selector (state lifted into the header). Deviation rows 14a–14c. 45 tests.

## 2026-09-16/17 — CHG-004 transfer, step 1: rail in the product sidebar (TASK-0032)

- Owner decision: transfer the approved navigation skeleton into the product shell in five steps without breaking the layout (TASK-0032…TASK-0036). CHG-004 status amended; decisions D-057 (collapsed rail, group flyouts, multiple open groups remembered, logo at head, `/dashboard` = "Bugün"), D-058 ("Onay"/"Görevler" out of the module list; "Genel Bakış" group gone → 5 groups), D-059 (sample badge counts in one place, marked "örnek veri", with a recorded objection), D-060 (next steps: dev role switcher under the account menu, ⌘K in COSS's own Command design, COSS `Frame` where needed).
- Step 1 code: work layer and group icons in `navigation-registry.ts`; rail with flyouts and collapsible groups in `app-sidebar.tsx`; open groups cookie in `sidebar-group-preference.ts`; `app-shell.tsx` reads both cookies on the server. Registry tests extended (35 tests).
- Session interrupted by a usage limit mid-verification; resumed: chevron rotation bug fixed (`group-data-[panel-open]/collapsible` never matched; the trigger itself carries `data-panel-open`), "örnek veri" added to badge tooltip and title, temporary signed-out probe page deleted. Verified in the browser: collapsed rail, flyout, two groups open, open set survives reload. Deviation rows 13a–13d added.

## 2026-09-16 — Navigation rethought: icon rail, header as a toolbar (CHG-004, TASK-0031)

- Owner direction: the left menu must stop being a list of 28 modules stacked underneath one another, the panel must not look like a standard dashboard, and each role should get a flowing path of its own. The diagnosis that drove the design: the menu holds nouns while people work in verbs, and the same structure is asked to serve an owner who sees everything, field roles who see three rows, and coordinators who do not browse at all — they drain queues.
- Four patterns were weighed (command-palette-first, icon rail, role workspace, object-first) and the rail was chosen; then four rail variants were weighed for what its second panel should hold. The owner took the second panel out of the sidebar entirely: its job moves into the header, so the existing shell, `--layout-gap`, `--frame-inset` and the 16:9 frame stay untouched.
- Decided (D-054…D-056): a two-region rail (work layer with badges on top, module groups below a separator); a three-zone toolbar — left is where you are, middle is where you go, right is what you do — with a second row that renders only while an object is open; and "Bugün" as every role's entry screen, composed per role, with the cockpit as the owner's variant rather than a competing entry.
- Prototype built in the development-only sandbox, reachable from the account menu in development. A role switcher shows the same skeleton from four seats: the owner keeps nine rail entries, the subcontractor crew lead keeps three, and nothing about the frame changes between them. Queue mode (approve pulls in the next record) and the empty state that means finished work are shown as demonstrations — those flow methods are still open (OQ-027).
- Module lists never occupy a column: a rail group icon opens its modules as a flyout, and the same entries are reachable from the ⌘K palette.
- Found while verifying: Base UI's Autocomplete reports the input value on every keystroke, so a typed fragment was navigating on its own; selection now requires a value that names an entry, compared without case. The toolbar keeps its context selection in local state, so it is keyed by role and starts fresh when the role changes.
- No product code beyond one development-only menu entry. The real route redirects signed-out visitors to sign-in and returns 404 in production.


## 2026-09-16 — Presentation redesigned as one cross-section

- The first build stacked five sections and read as clutter. Owner direction: simplifying means conveying the same information legibly, not showing less. So the page became a single pan/zoom cross-section with a reading panel beside it: one horizontal band per group, stacked so the stack itself carries the architecture — platform at the bottom because everything rests on it, analysis at the top because it summarises what happens below. A constellation version was built first and dropped: on a flat sky the layering that MODULE_MAP.md describes was not visible.
- Legibility comes from deferral, not omission: with nothing selected the links stay faint, and touching a module lights only its own connections while the rest dim. Picking a flow traces just that path. Each plate carries its connection count, so hubs stand out without a legend.
- `@xyflow/react` 12.11.6 added (MIT, exact-pinned, D-053) for the viewport and edge plumbing only; the nodes and links are our own components and stylesheet, so none of its default look survives. Mermaid was rejected because it owns its rendering and would have dictated the visual style.
- Code shrank from 2351 to 1949 lines with no content lost — the 496-line data file is untouched; the five section components and 942 lines of hand-written layout CSS were replaced.
- Owner request: the page speaks the product's visual language. The sandbox palette, radius and fonts now read the app's global custom properties instead of carrying their own hex values, and its dark-mode block is gone because those tokens already switch. Inheriting a CSS variable is not an import, so the code isolation (D-052) is untouched.
- Group colours stay five distinct hues: they carry which layer a module belongs to, so collapsing them lost information. Four of the five are app tokens (`--muted-foreground`, `--primary`, `--success`, `--warning`); the fifth has no equivalent and is the page's only literal colour, with a dark value of its own. Noted for later: green and amber also mean status elsewhere in the product (DESIGN_SYSTEM_RULES §4), so a module is never coloured by state here.
- Icons sit on the plates themselves — a plate has room for one, where a dot did not.
- A roles sidebar was added on the left, opposite the module detail on the right. The records hold no role-to-module link, so rather than inventing one the panel derives it: each module now states which classes of data it carries, and who may see which class is already recorded (REQ-AUD-006, REQ-IAM-011…012, REQ-IAM-022…024). Selecting FIN therefore answers "Saha Mühendisi görmez" from the decisions, not from a guess. A module carrying mixed classes reports "kısmen görür". Picking a flow answers the same question for the flow: the classes its modules carry together are judged as one, so the left panel follows the flow tabs as well as the map. The data-class field is the one inference on the page and is labelled as a proposal; the permission matrix is settled in Phase 01.
- Roles, the visibility matrix and the role rules moved out of the right panel into the new one; with nothing selected it lists all six roles. Roles gained icons, and visibility is shown with eye / eye-off / question icons rather than words alone.
- Each flow gained a sentence saying what it actually achieves, replacing a lead that only described the screen ("Kesitte aydınlanan 2 modül bu akışta sırayla devreye giriyor"). The sentences summarise each flow's own recorded steps (REQ-WFL-011, REQ-WFL-028), so "Yeni işten tahsilata" now reads as turning a customer request into contracted work, production, a progress payment and finally collected money. The module count moved to a secondary line.
- Technical event ids (`daily_log.approved` and the like) no longer appear on screen; the human label and the modules it sets off are enough for a presentation. They stay in the data as the record link.
- Shared elements are COSS components rather than hand-made ones (owner request): `Badge`, `Button`, `Toggle` for the flow selector, `Table` for the visibility matrix and `ScrollArea` for the reading panel. The ESLint boundary was widened for this — a sandbox may now import the COSS UI layer, still nothing from modules or platform, and still nothing may import a sandbox. Only the section itself (bands, plates, links) stays custom, which is what D-052 approved.

## 2026-09-16 — Development-only structure presentation (CHG-003, TASK-0030)

- New page at `/presentation`, linked from the account menu, summarising the whole application: module map with connections, cross-module events, the end-to-end flows of REQ-WFL-011, REQ-WFL-028, roles and visibility, and the daily log approval cycle. Visualisation first, no detail.
- Built as a sandbox (D-052): `src/sandbox/presentation/` holds its own data, CSS Modules styles and components. ESLint boundaries enforce the isolation in both directions — the sandbox imports nothing from the app (not even COSS UI), and nothing may import the sandbox. Removing the folder, the route, the menu item and the lint element removes the feature completely.
- Production returns 404 for the route and the menu entry is hidden there, so the page never ships. In development it still requires a signed-in session.
- The custom shapes and SVG connector lines are approved for this sandbox only; the COSS-only rule (ADR-009) continues to apply to the product itself.
- Content is sourced from `docs/architecture/MODULE_MAP.md`, REQ-AUD-006, REQ-FIN-015, REQ-IAM-001, REQ-IAM-003…006, REQ-IAM-008…015, REQ-IAM-018, REQ-IAM-022…024, REQ-IAM-026…027, REQ-SIT-001…004, REQ-SIT-006…008, REQ-SIT-013, REQ-SIT-030…032, REQ-WFL-011, REQ-WFL-015…016, REQ-WFL-028 and decisions D-035…D-040; roles show only what the scope states and mark the rest as decided in Phase 01. It has to be updated when those records change.

## 2026-09-16 — AI attribution removed from history

- Owner request: `Co-Authored-By: Claude …` trailers removed from all commit messages on `main`, `docs/phase-01-kickoff` and `feature/m0-early-first-screen` (18 commits) with `git filter-branch --msg-filter`. Verified per branch: file trees identical, commit count, authors and dates unchanged, 0 trailers left; force-pushed with lease. All commit IDs changed; other clones must re-fetch. Full pre-rewrite backup kept locally as a git bundle.
- Rule added (`ai/PROJECT_RULES.md` §17, `docs/standards/GIT_WORKFLOW.md`): no AI attribution in commits or PRs, for every AI tool.
- Uncommitted formatting change in `src/app/(auth)/two-factor/page.tsx` committed first (owner: leave nothing uncommitted).

## 2026-09-16 — Milestone M0 closed; Projects and CRM in the menu

- Owner approved TASK-0025 (real sign-in, password reset, two-factor) and TASK-0026 (app shell) → DONE. Milestone M0 closed. TASK-0022…TASK-0026 added to `ai/COMPLETED.md`. Code track closed until Phase 07 or an approved change request.
- D-051 (OQ-025): "Projeler" added above "Şantiyeler", "Talepler & Müşteriler" added first in "Ticari"; their placeholder pages are generated from the registry.
- Owner rule: a primary logo is never used in dark mode. Auth screens showed the brand-blue tile in dark mode (`BrandTile` defaulted to `primary`); default is now `theme`, auth shell passes it explicitly, favicon gains a dark-scheme light tile. Rule added to `docs/ui-ux/DESIGN_SYSTEM_RULES.md` §4. Verified in rendered `/sign-in` HTML: no primary tile without `dark:hidden`.
- `ai/CURRENT_STATE.md` stale lines refreshed (branch, next tasks, recent decisions, resolved `.gitattributes` note).

## 2026-09-16 — Pilot, schedule and KVKK answers

- D-048 pilot on sample data (OQ-021), D-049 no target date (OQ-022), D-050 no KVKK legal review with RISK-001 kept open (OQ-024). `ai/OPEN_QUESTIONS.md` rows marked answered; TASK-0021 notes updated. OQ-025 (menu placement of Projects and CRM) re-explained to the owner.

## 2026-09-16 — Two-factor removal, onboarding entry in the account menu

- The second factor can now be removed. Supabase only allows this from an `aal2` session, so the action checks the level itself before calling and gives a plain reason when it is not met. `/two-factor` gained a third mode: a verified session now lands on a management view instead of being redirected to the dashboard (sign-in still goes straight there). Removal is confirmed in an `AlertDialog` (DESIGN_SYSTEM_RULES §1.1) and reported as a toast (DESIGN_SYSTEM_RULES §13); the screen falls back to the setup view afterwards.
- Two contract tests added: removal is refused before the factor has been cleared, and accepted once the session is at `aal2`.
- The account menu links to the role onboarding screen.

## 2026-09-16 — Brand tiles, no pure white, collapsed-menu click fix

- Square brand tiles (`icon_rectangle_light/dark/primary`) added by the owner. They carry two colours of their own, so they must not go through the `currentColor` swap that serves the monochrome logos: `BrandTile` renders them as images. Used for the favicon, on the auth screens (decoration panel and mobile) and as the collapsed sidebar mark.
- Logo colour is no longer baked into the component: `BrandLogo` takes a `tone` (`theme`, `brand`, `light`, `dark`, `inherit`), default unchanged.
- Owner rule: the panel never paints pure white. `--brand-light` (`#EFEFEF`) replaces it on the light surfaces COSS paints white and on the button label; in dark mode the whole primary ink family uses it too, keeping COSS's own token relationships (`--muted-foreground` stays its own grey).
- Fixed while doing that: the first version wrote the surface tokens on a plain `:root`. Because `brand.css` loads after `globals.css` and both selectors have the same specificity, it also won inside the dark theme, leaving dark mode with light surfaces. The rule is now scoped to `:root:not(.dark)`.
- Fixed: with the sidebar collapsed, the first item of every group could not be clicked. COSS hides the group label with `-mt-8 opacity-0`, which leaves an invisible element sitting exactly on that item and swallowing the click. The label now ignores the pointer while collapsed.
- The auth particle figure is painted heavier in the light theme (dots and opacity ×1.6): brand blue on a light surface reads far weaker than light ink on a dark one. Applied while drawing, so switching theme does not rebuild the field.

## 2026-09-16 — Auth screens and real Supabase sign-in (TASK-0024, TASK-0025)

- TASK-0024 DONE: owner created the Supabase dev project and `.env.local`. Verified without reading key values — both variables set, publishable (not secret) key, file git-ignored, public sign-up disabled, TOTP MFA enabled.
- `AuthProvider` port (`modules/iam/domain`) with a Supabase adapter; provider error codes are mapped to stable failure codes and Turkish messages in the application layer. Screens depend on the port only, so replacing Supabase does not touch the UI (ADR-002).
- Server actions: sign-in, sign-out, password reset request, new password, TOTP enrollment and verification. `src/proxy.ts` (Next 16's renamed middleware) refreshes session cookies and redirects signed-out visitors; access decisions use `getClaims`, never `getSession`. The `aal2` step is enforced again in `(app)/layout.tsx` and on `/onboarding`, because proxy checks are optimistic only.
- `/auth/confirm` exchanges the password-reset `token_hash` for a session; the `next` target is restricted to in-app paths so the link cannot redirect elsewhere.
- D-046: the devl.dev auth design is adopted as the actual design, rebuilt with COSS in the project's own layers — `npx shadcn add` was deliberately not run, so no foreign file layout or second theme stack entered the repo. Their magic-link and Google/Apple sign-in were not taken over (we use e-mail + password + TOTP).
- D-047: `ParticleField` approved as the first custom element (COSS has no decorative canvas). Source image is the GEOGES logo, dot colour follows `--brand-logo`, and `prefers-reduced-motion` paints it once without animation. Deviation register rows 9, 9a, 9b, 10, 11 added.
- 19 new unit tests (port contract with a fake adapter, routing rules, form validation). `npm run check` and `npm run build` pass.
- Browser-verified: signed-out visitor redirected to `/sign-in`, wrong credentials show "E-posta veya parola hatalı." with the e-mail preserved, light/dark and mobile layouts, no page-load console errors. Real sign-in, TOTP and the reset e-mail still need the owner's own account.
- OQ-026 opened: password policy and account lockout (M0 uses a provisional 8-character minimum).
- Feedback rule (owner, 2026-09-16): errors, warnings and success messages are never rendered inside a component — they go to a COSS `Toast`. Field-level validation under an input stays. `ToastProvider` sits in the root layout; `useActionToast` turns a server-action result into a toast. Inline `Alert`s removed from the auth forms. Rules written to `docs/ui-ux/DESIGN_SYSTEM_RULES.md` §13.
- Fixed: the 2FA QR code rendered as a broken image. The running Supabase API returns `totp.qr_code` as a complete data URL while the typings describe a bare SVG, so the code prefixed it twice. The adapter now normalises both shapes and the screen gets a ready-to-use URL.
- Theme control (owner, 2026-09-16): switches light/dark straight on click instead of opening a menu. This drops the explicit "Sistem" option — the first visit still follows the operating system, but after one manual switch the choice is remembered. Say so if the option should come back (e.g. as a long-press or a settings entry).
- Security correction: assurance levels no longer come from `getAuthenticatorAssuranceLevel()`, which reads the user object out of the cookie (Supabase logs a warning that this must not drive access decisions). `currentLevel` now comes from the verified `aal` claim and `nextLevel` from `listFactors()`. An `aal2` session skips the factor call.

## 2026-09-16 — Owner notes: COSS surfaces, site-wide search

- D-045: COSS `Frame`, `Drawer`, `Dialog`, `Menu`, `Sheet` used wherever needed; usage table in `docs/ui-ux/DESIGN_SYSTEM_RULES.md` §1.1.
- D-044: comprehensive site-wide search as a COSS `Command` palette, permission-aware; not in the functional scope (only archive REQ-DOC-002, REQ-DOC-004 and list REQ-NFR-013 search), recorded as scope extension. `ai/REQUIREMENTS.md` NFR row added; TASK-0029 (T1) planned across Phases 01–03.

## 2026-09-16 — Fixed-height shell, drag rail, Geist, footer rework

- Sidebar–card distance back to COSS defaults (8px expanded, 14px collapsed); outer layout gap unchanged (1.5rem md, 2.5rem xl). Browser-measured.
- Fixed viewport height: shell `h-svh`, window never scrolls; app card keeps a fixed height and content scrolls inside COSS `ScrollArea`; header pinned at the card top.
- `SidebarDragRail` wraps COSS `SidebarRail`: drag left ≥32px collapses, drag right expands, plain click still toggles. Verified with real pointer drags.
- Logo/copyright footer removed from the app card. A transparent bottom brand strip was added and then removed at owner request. TASK-0028 records the planned functional page footer (fixed to the card bottom, layered above content, bottom-navigation style; Phase 02).
- Font: Geist for body and headings, Geist Mono for code (COSS default Inter), `latin-ext` kept. Rule added: all financial numbers use Geist Mono + `tabular-nums` via one shared formatter (built with the first financial screen).
- Deviation register rows 4, 4a, 5, 5a, 6 updated.

## 2026-09-16 — Wider layout gap around sidebar and app card

- Owner request: wider margins around the whole layout, sidebar included. Single `--layout-gap` token (0.5rem base, 1.5rem from `md`, 2.5rem from `xl`) drives sidebar padding, card margins and the sidebar–card gap. Sidebar width becomes `15rem + 2 × gap` so menu content keeps the COSS width; collapsed width and card offset adjusted accordingly. Deviation register rows 4/4a updated.
- Browser-measured with transitions disabled at 1024px (24px everywhere) and 1440px (40px everywhere), expanded and collapsed. Note: the Browser pane does not advance CSS transitions while in the background, so screenshots can show a frozen mid-animation state.

## 2026-09-16 — Larger app card margins; COSS deviation register

- Owner request (compact interface): app card outer margin 1rem from `md`, 1.5rem from `xl` (COSS inset default 0.5rem); sidebar side stays 0, collapsed state uses the same margin. Browser-measured at 1024px (16px) and 1440px (24px), expanded and collapsed.
- Owner request: always report departures from COSS/Tailwind defaults. Added deviation register `docs/ui-ux/DESIGN_SYSTEM_RULES.md` §4.1 listing all deviations so far (brand tokens, logo color, card border, card margins, header corners, `latin-ext`, removed `radix-ui`/`cn`, Turkish trigger label).

## 2026-09-16 — Inline SVG logos, larger header logo, `.agents` safety

- Owner request: logos rendered as inline SVG instead of `<img>`, header logo `h-12`. `@svgr/webpack` 8.1.0 (listed as tested with Turbopack in Next.js docs) turns `*.svg?svgr` imports into components; brand blue fill becomes `currentColor`, color from `--brand-logo` (brand blue light, `#EFEFEF` dark), so only `*_primary.svg` files are used. `dimensions: false` keeps `viewBox`. Favicon still uses the files via metadata.
- Browser-verified: no `<img>` tags, sidebar long logo 48px tall, light color `#0F4C81`, dark color `#EFEFEF`, no console errors; check + build pass.
- Found an untracked `.agents/skills/` copy of `.claude/skills` (created 2026-09-16 12:07, not by this session, never committed). Tailwind docs snapshot under it is now git-ignored (D-024); `.agents/**` excluded from ESLint and Prettier. Owner to confirm what created it. Commits now stage explicit paths instead of `git add -A`.

## 2026-09-16 — Inset app layout (TASK-0026)

- Owner request: app no longer fills the screen edge to edge. Uses the COSS Sidebar `inset` variant: on desktop the main area is a bordered, rounded card with a margin on the sidebar background; header corners follow the card. Mobile stays full width. Browser-verified expanded and collapsed.

## 2026-09-16 — GEOGES brand logos (TASK-0026)

- `platform/ui/brand/brand-logo.tsx`: single component for owner-provided assets in `public/assets/brand` (`primary` in light mode, `light` in dark mode). Owner placement: long logo in headers (sidebar header, auth header), stacked logo in footers (new `BrandFooter` in app shell and auth layout), icon in collapsed sidebar and favicon.
- Favicon via metadata `icons` (primary + dark-scheme light variant) instead of duplicating files; removed default `src/app/favicon.ico` and unused create-next-app images in `public/`.
- Verified: check + build pass; server-rendered HTML contains the expected logos and icon links. Browser pane visual check not possible at the time (pane not drawn, width 0). No apple-touch icon yet (needs PNG).

## 2026-09-16 — M0 app shell, cockpit skeleton, onboarding (TASK-0026, REVIEW)

- Registries: navigation (REQ-NFR-007, D-026 "Şantiye" labels, permission per item), dashboard widgets (REQ-INV-026, REQ-RPT-002…004, REQ-RPT-006…009); `AccessPolicy` with M0 preview policy so real IAM plugs in without UI changes.
- App shell on COSS Sidebar (collapsible icon mode, mobile drawer closes on navigation), top bar with Açık/Koyu/Sistem theme menu (`next-themes` 0.4.6), GEOGES brand tokens in a separate `brand.css`.
- 25 module placeholder pages generated from the registry; cockpit empty card skeleton; static new-role onboarding with step indicator.
- Root layout: `lang="tr"`, Inter/Geist Mono with `latin-ext` (Turkish characters), noindex metadata.
- 9 unit tests; typecheck, lint (boundaries), format, build pass; browser-verified in light/dark and desktop/mobile with no console errors.
- OQ-025 raised: REQ-NFR-007 menu has no Projects (PRJ) or CRM entries.

## 2026-09-16 — Source documents moved out of repo root

- Owner request (clean root): `Geoges Panel Özellik Yapısı.md` → `docs/sources/functional-scope.md`, `Geoges Panel Mimari.md` → `docs/sources/architecture-principles.md` (all three removed 2026-09-19, Git tag `scope-archive`), `AI_Destekli_Proje_Gelistirme_Ana_Promptu.md` → `docs/sources/ai-development-protocol.md` (`git mv`, history kept). Added `docs/sources/README.md` (old-name mapping, deletion conditions).
- References updated in `README.md`, `ai/PROJECT_RULES.md`, `ai/PROJECT_CONTEXT.md`, `ai/REQUIREMENTS.md`, `docs/requirements/README.md`, `docs/README.md`. Historical changelog entries keep the old names. TASK-0027 tracks deletion at Phase 01 exit.

## 2026-09-16 — Milestone M0: CHG-002 approved, scaffold (branch `feature/m0-early-first-screen`)

- CHG-002 approved (option B: real Supabase Auth, local preview, empty dashboard skeleton, sign-in + 2FA + password reset + onboarding); D-043 TOTP 2FA; plan `docs/features/m0-early-first-screen-plan.md` approved (TASK-0022). ADR-007 amended with Milestone M0.
- TASK-0023 scaffold done: Next.js 16.3.5, React 19.2.8, TypeScript 5.9.3, Tailwind 4.3.3, COSS UI (`@coss/style`, Base UI 1.8.0), Supabase `@supabase/ssr` 0.12.7 + `@supabase/supabase-js` 2.116.0, zod 4.6.5; ESLint module-boundary rules, Vitest 5, Prettier; noindex (`robots.ts`, `X-Robots-Tag`); `.env.example`. Unused `radix-ui`/`cn` removed. All checks and production build pass.

## 2026-09-15 — Phase 01 started: glossary round 1 (uncommitted, branch `docs/phase-01-kickoff`)

- Owner answers recorded as D-027 (single Party record with roles), D-028 (fire / zayi / hurda distinction), D-029 (three guarantee types), D-030 (unit rate, lump sum, day rate subcontractor payment).
- `docs/domain/GLOSSARY.md`: added Party, Customer, Subcontractor Payment Method, Letter of Guarantee, Retention, Cash Guarantee; confirmed Client, Subcontracted Labor, Guarantee, Process Loss, Damaged Unit, Scrap.
- OQ-007 partially answered; TASK-0020 opened.
- Round 2: D-031 Kademe = Panel Course, D-032 lug single standard type, D-033 one net party account balance, D-034 per-currency balances with TRY equivalent. Glossary: Panel Course, Tie Strip Lug, Party Account confirmed; no OPEN terms remain.
- Committed `157c22a`. Slice 1 requirement rounds 1–2 (TASK-0021): D-035 REQ-SIT-004 chain = entry fallback order, coordinator approves; D-036 email + password login; D-037 deadline configured in panel, no fixed default; D-038 holidays exempt, otherwise "no work" log with reason; D-039 company email for employees, personal allowed for subcontractor crew leads; D-040 delegate → escalation, all role/approval settings admin-configurable; D-041 owner delegate (OQ-023 answered).
- D-042: COSS Origin examples prioritized as design reference for advanced components, rebuilt with COSS UI/Particles (Origin verified Radix-based legacy, MIT). Updated `docs/ui-ux/DESIGN_SYSTEM_RULES.md` (DESIGN_SYSTEM_RULES §2 priority, new DESIGN_SYSTEM_RULES §3.1) and ADR-009 note.
- After Windows restart (23:25): TASK-0019 verified DONE (no terminal launches on worker `git` calls); TASK-0018 partially verified (new worker, 0 auth errors, observations #403–#405; env fallback untested until 2026-10-15).

## 2026-09-15 — Şantiye label, claude-mem window flash fix (uncommitted)

- D-026: UI label for `SIT` / site concept is "Şantiye"; glossary note added.
- TASK-0019: process trace showed the detached claude-mem worker spawning `git rev-parse` without `windowsHide`, each followed by a Windows Terminal launch (visible flash). Owner-approved local patch adds `windowsHide:!0` to 4 git calls across 3 plugin scripts; backups taken, `node --check` passed. Effective after Windows restart.

## 2026-09-15 — Phase 00 closed

- Owner approved TASK-0002, TASK-0003, TASK-0005, TASK-0006, TASK-0012, TASK-0013 → DONE; added to `ai/COMPLETED.md` (TASK-0010 row added too).
- Phase 00 status DONE; completion report updated.
- Corrections: ADR-013 status and Tailwind note; `ai/AI_SKILLS.md` claude-mem status and Next.js note; `docs/standards/GIT_WORKFLOW.md` records Phase 00 direct-to-`main` commits as an owner-approved exception, branches required from Phase 01; `ai/OPEN_QUESTIONS.md` notes OQ-018/019 were never assigned; README points to Phase 01.
- TASK-0018: owner set long-lived `CLAUDE_CODE_OAUTH_TOKEN` user env var (value never read); worker verification deferred until Windows restart.

## 2026-09-15 — TASK-0010 done, Phase 00 completion report

- Fresh-session verification passed (claude-mem session 68): SessionStart context injected, worker `/api/health` ok (v13.11.0, PID 9652), observations #325–#328 stored for `geoges-panel`, 0 `ERROR`/auth lines after 17:34, `CLAUDE_MEM_TELEMETRY=false`, Chroma mode `local`, no cloud sync configuration. Transient "non-XML idle response" parser warnings and the expected Windows Credential Manager WARN observed; no impact.
- TASK-0010 → DONE; MASTER_ROADMAP Phase 00 exit criteria all checked; Phase 00 completion report added (NOT COMPLETE pending owner review of REVIEW tasks).
- Added TASK-0018: safeguard against silent claude-mem stop at login expiry (2026-10-15); worker supports `CLAUDE_CODE_OAUTH_TOKEN` as fallback.

## 2026-09-15 — TASK-0010 claude-mem verification

- Fresh-session verification failed: `claude-mem@thedotmack` was enabled in `.claude/settings.json` but installed only for another project path (`Desktop\test\app`); worker not running.
- Root cause of `no such column: failed_at_epoch` worker errors (2026-09-14 log): legacy v12.3.6 worker from the other project running against a DB already migrated by v13.11.0 (schema v31 dropped the column). No data corruption found.
- `~/.claude-mem` database backed up to `backups/pre-geoges-install-2026-09-15T16-27-46/` (SHA-256 verified).
- Installed `claude-mem@thedotmack` v13.11.0 (`f5633c1`, already audited cache) at project scope; marketplace not updated. No repository files changed.
- Post-install: worker healthy on `127.0.0.1:37777`, hooks capture this project, no schema errors. New blocker: observation generation fails with `OAuth session expired and could not be refreshed`.
- Auth root cause: Windows Credential Manager has no Claude Code entry (expected); fallback `~/.claude/.credentials.json` had `expiresAt=0` and a refresh token expired on 2026-08-02. Owner re-logged in via the Claude Code CLI (new refresh token valid until 2026-10-15). Observations #308–#313 stored for `geoges-panel`; 0 auth errors since.
- Incident: force-stopping the worker (PID 29840, owner-approved) left its uvx/chroma-mcp children alive holding the inherited listening socket on port 37777; new worker could not bind and hook processes hung. With owner approval, orphan chroma processes and stuck hook processes were stopped; worker (PID 9652) respawned after the 2-minute Windows spawn cooldown. SQLite DB unaffected.
- `ai/MASTER_ROADMAP.md`: TASK-0016 checkbox corrected to match its DONE status.

## 2026-09-15 — Phase 00 closing (uncommitted)

- Roadmap approved; CHG-001 resolved as Milestone M1 (first visible screen at end of Phase 07).
- Tailwind docs snapshot synced locally (tailwindcss.com @ `7f92c22`), git-ignored; `docs-source.txt` set to skip-worktree.
- claude-mem telemetry disabled (project env + `~/.claude-mem/settings.json`).
- Decisions D-023…D-025; open questions OQ-001, OQ-008, OQ-009 answered.

## 2026-09-15 — Phase 00 bootstrap (commit `deb14ef`)

## 2026-09-15 — Phase 00 bootstrap (uncommitted)

- Scope documents updated with 21 previously missed requirements from legacy analysis; "no external dependency" clarified (records never outside the panel; tech providers and APIs allowed).
- Phase 00 decision round (4 rounds) completed; ADR-001…ADR-013 accepted.
- Git repository initialized; remote added.
- Created `AGENTS.md`, `CLAUDE.md`, `README.md`, `.gitignore`.
- Created `/ai` state system and `/docs` structure (standards, decisions, architecture module map, UI/UX rules, glossary skeleton, requirement index).
- Skill audit performed; 8 skills vendored at pinned commits into `.claude/skills/` (supabase, supabase-postgres-best-practices, coss, coss-particles, react-best-practices, composition-patterns, cloudflare, tailwind-4-docs).
- `.claude/settings.json`: `ui-ux-pro-max` disabled, `claude-mem` enabled for this project.
- CHG-001 proposed (early preview of auth screens and app shell).

## 2026-09-23 — Task overlay dismissal across screen sizes

- Keep the closing Drawer/Dialog mounted when the screen crosses the mobile breakpoint, so its completion callback can return from the intercepted route. Verified mobile dismissal with and without immediate desktop resize; no task created. Search continuation ad35f0b passed CI 35808126517, including the full database rollback/reapply cycle.

## 2026-09-23 — Search request network overhead

- TASK-0110, migration 0025: fixed SECURITY INVOKER search request binds identity inside the palette call. A read-only transaction and 15s timeout are established first; commit/rollback identity cleanup remains mandatory. Network trips reduced from four to three; general write access unchanged.
- Same 56 synthetic rows / 20 warm requests: p95 258 ms, max 259 ms (previously 348/355). This is not production-scale acceptance. Search DB suite 19/19 and 273 unit tests passed; explicit connection reuse, cancellation cleanup and wrong-role rejection covered.

## 2026-09-23 — Deterministic rule corrections

- Search CI 35809458042 exposed a pre-existing ADM failure after rollback/reapply: same-transaction rule timestamps tie, and UUIDv7 random bits can select the older correction.
- Migration 0026 gives new rule rows an owned insertion sequence used after effective/creation dates. Legacy rows keep NULL and their previous UUID tie order. Configuration transfer already preserves columns and advances owned sequences. Ten ADM DB tests pass, including deliberately reversed UUIDs at one transaction timestamp; no sleeps or retries hide the failure.

## 2026-09-23 — Owner-facing roadmap refresh

- Updated root YOL-HARITASI.md from MASTER_ROADMAP/TASKS: all phases including 09R in the correct position, complete Phase 07 foundation list, search implementation vs. outstanding acceptance, mobile hosting dependency, and latest 258ms small-fixture latency evidence. TASK-0110 remains IMPLEMENTING. Code fix c62f80e passed CI 35809769758 including full rollback/reapply.
