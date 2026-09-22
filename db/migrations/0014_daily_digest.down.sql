-- Reverses 0014_daily_digest.sql.
drop function tsk.record_digest(uuid, date, jsonb, boolean, boolean);
drop function tsk.people_without_digest(date, integer);
drop function tsk.digest_for(uuid, date);
drop table tsk.daily_digest;
delete from core.table_layer where schema_name = 'tsk' and table_name = 'daily_digest';
