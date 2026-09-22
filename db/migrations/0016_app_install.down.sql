-- Reverses 0016_app_install.sql: the install state table and its three functions.
drop function tsk.note_app_state(boolean, boolean, text);
drop function tsk.my_app_state();
drop table tsk.app_install;
delete from core.table_layer where schema_name = 'tsk' and table_name = 'app_install';
