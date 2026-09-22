-- Reverses 0018_revision_requests.sql: the three revision tables and their functions. The
-- policies go first: they use functions that take the table's row type, and the functions cannot
-- be dropped while a policy holds them, nor the table while the functions take its type.
drop policy revision_effect_read on aud.revision_effect;
drop policy revision_request_read on aud.revision_request;
drop policy revisable_record_change on aud.revisable_record;
drop policy revisable_record_add on aud.revisable_record;
drop policy revisable_record_read on aud.revisable_record;
drop trigger revision_request_guard on aud.revision_request;

drop function aud.revision_page(text, text, text, uuid, integer, uuid);
drop function aud.record_revision_effect(uuid, text, text, uuid, text);
drop function aud.mark_revision_stale(uuid, text);
drop function aud.mark_revision_applied(uuid, text, boolean);
drop function aud.decide_revision(uuid, boolean, text);
drop function aud.submit_revision(text, text, uuid, jsonb, text, uuid, uuid, uuid, text);
drop function aud.can_see_revision(aud.revision_request);
drop function aud.can_decide_revision(aud.revision_request);
drop function aud.revision_approvers(aud.revision_request);
drop function aud.guard_revision_request();
drop function aud.may_request(text, uuid, uuid, uuid, text);
drop function aud.revisable(text, text);

-- The stamp trigger goes with its table, so its function is free only afterwards.
drop table aud.revision_effect;
drop table aud.revision_request;
drop table aud.revisable_record;
drop function aud.stamp_revision_update();
delete from core.table_layer where schema_name = 'aud'
  and table_name in ('revisable_record', 'revision_request', 'revision_effect');
