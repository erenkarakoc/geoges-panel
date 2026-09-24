-- Reverses 0054_wfl_locks.sql.

drop function wfl.locks_on(text, text, uuid);
drop function wfl.override_lock(uuid, text);
drop function wfl.release_lock(uuid);
drop function wfl.hold_lock(text, text, uuid, text, text, uuid, text);
drop policy record_lock_read on wfl.record_lock;
drop table wfl.record_lock;
delete from core.table_layer where schema_name = 'wfl' and table_name = 'record_lock';
