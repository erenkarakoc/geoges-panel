-- Reverses 0046_wfl_instances.sql.

drop function wfl.note_waiting(uuid, text, jsonb);
drop function wfl.leave_step(uuid, text, text, jsonb);
drop function wfl.enter_step(uuid, text, text, uuid, integer);
drop function wfl.end_instance(uuid, text, text, text);
drop function wfl.start_instance_by_hand(text, text, text, uuid, jsonb);
drop function wfl.start_instance(text, text, text, text, uuid, jsonb, uuid);
drop function wfl.single_key(text, text, uuid);
-- The instance's own policy reads the step states, so the policies go before the tables.
drop policy instance_read on wfl.instance;
drop policy step_state_read on wfl.step_state;
drop policy run_log_read on wfl.run_log;
drop table wfl.run_log;
drop table wfl.step_state;
drop table wfl.instance;
drop function wfl.guard_run_log_append_only();
delete from core.table_layer
 where schema_name = 'wfl' and table_name in ('instance', 'step_state', 'run_log');
