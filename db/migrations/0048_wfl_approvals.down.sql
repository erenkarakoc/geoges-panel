-- Reverses 0048_wfl_approvals.sql.

delete from core.event_subscription
 where subscriber = 'wfl.engine' and event_code = 'approval.decided';
drop function wfl.decide_approval(uuid, text, text);
drop function wfl.request_approval(uuid, uuid, text, text, uuid);
drop policy approval_read on wfl.approval;
drop table wfl.approval;
delete from core.table_layer where schema_name = 'wfl' and table_name = 'approval';
