-- Reverses 0013_push_subscriptions.sql.
drop function tsk.expire_push_subscription(text);
drop function tsk.save_push_subscription(text, text, text, text);
drop table tsk.push_subscription;
delete from core.table_layer where schema_name = 'tsk' and table_name = 'push_subscription';
