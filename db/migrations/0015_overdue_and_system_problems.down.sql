-- Reverses 0015_overdue_and_system_problems.sql.
drop function tsk.system_health();
drop function tsk.tasks_needing_attention(numeric, integer);
drop function tsk.escalate_task(uuid);
drop function tsk.next_escalation_target(tsk.task);
drop function tsk.mark_overdue(uuid);
drop function tsk.people_with_permission(text);
drop function tsk.owner_people();
drop function tsk.delegates_of(uuid, uuid);
