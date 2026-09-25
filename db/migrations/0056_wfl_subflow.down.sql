-- Reverses 0056_wfl_subflow.sql: subflow children are ordinary runs, so the rows stay; the door
-- that opened them and the loosened rule go away. A child with no starting step of its own is
-- given the flow's own start, so the stricter rule holds again.
drop function wfl.start_subflow(uuid, uuid, text, jsonb);

update wfl.instance i
   set start_step_id = coalesce(i.start_step_id, v.definition ->> 'start')
  from wfl.flow_version v
 where v.id = i.flow_version_id and i.parent_instance_id is not null and i.start_step_id is null;

alter table wfl.instance drop constraint ck_instance__branch;
alter table wfl.instance
  add constraint ck_instance__branch check (
    (parent_instance_id is null) = (parent_step_state_id is null)
    and (parent_instance_id is null or start_step_id is not null)
    and (parent_instance_id is not null or depth = 0)
    and depth between 0 and 3);
