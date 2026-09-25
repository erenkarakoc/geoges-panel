-- 0063 — the platform's own event subscriber may be named under `core` (TASK-0122).
--
-- 0006 let a scheduled job be named `core.…` but held subscribers to a module's code. The search
-- index keeps records up to date for every module and belongs to none of them; its subscriber has
-- been `core.search-index` since Phase 07. It first registered when firms became searchable, and
-- the worker could not write its subscription. The two subscriber checks now read like the job one.

alter table core.event_subscription drop constraint ck_event_subscription__subscriber;
alter table core.event_subscription add constraint ck_event_subscription__subscriber
  check (subscriber ~ '^([a-z]{2,3}|core)\.[a-z0-9_.-]+$');

alter table core.outbox_delivery drop constraint ck_outbox_delivery__subscriber;
alter table core.outbox_delivery add constraint ck_outbox_delivery__subscriber
  check (subscriber ~ '^([a-z]{2,3}|core)\.[a-z0-9_.-]+$');
