-- Reverses 0063_core_subscriber_name.sql. Refuses while a `core.` subscription or delivery exists,
-- which is the point: rolling back must not strand the search index's rows.
alter table core.outbox_delivery drop constraint ck_outbox_delivery__subscriber;
alter table core.outbox_delivery add constraint ck_outbox_delivery__subscriber
  check (subscriber ~ '^[a-z]{2,3}\.[a-z0-9_.-]+$');

alter table core.event_subscription drop constraint ck_event_subscription__subscriber;
alter table core.event_subscription add constraint ck_event_subscription__subscriber
  check (subscriber ~ '^[a-z]{2,3}\.[a-z0-9_.-]+$');
