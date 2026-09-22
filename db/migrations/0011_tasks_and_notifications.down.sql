-- Reverses 0011_tasks_and_notifications.sql: the tsk schema and its layer rows.
drop schema tsk cascade;
delete from core.table_layer where schema_name = 'tsk';
