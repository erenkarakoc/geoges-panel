-- 0072 — what a flow condition can read about a project and a wall (TASK-0123 step 5,
-- REQ-PRJ catalog: `project.days_to_contract_end`, `wall.status`).
--
-- A flow's condition reads the record's fields from what the event carried (`record.<field>`), so
-- a condition field is only real when the event carries it. The project's events now carry the
-- days left to the contract's end date, counted on the day the event happened; the wall's event
-- carries its status. The contract value (`project.contract_value`, commercial) is deliberately not
-- carried: a run's context is readable by anybody who holds a step of it, a site engineer
-- included, so a commercial figure there would reach people who may not see it (REQ-IAM-011). It
-- waits for a condition that reads the value at evaluation time instead of carrying it.

create or replace function prj.record_project_stage() returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare
  days_left integer := case when new.contract_end_on is null then null
                            else new.contract_end_on - iam.today() end;
begin
  if tg_op = 'INSERT' then
    insert into prj.project_stage_change (project_id, from_stage, to_stage)
    values (new.id, null, new.stage);
    perform core.publish_event('project.created', 'prj', 'prj', 'project', new.id,
      pg_catalog.jsonb_build_object('id', new.id, 'name', new.name,
                                    'client_party_id', new.client_party_id,
                                    'coordinator_user_id', new.coordinator_user_id,
                                    'stage', new.stage,
                                    'days_to_contract_end', days_left));
  elsif new.stage is distinct from old.stage then
    insert into prj.project_stage_change (project_id, from_stage, to_stage)
    values (new.id, old.stage, new.stage);
    perform core.publish_event('project.stage_changed', 'prj', 'prj', 'project', new.id,
      pg_catalog.jsonb_build_object('id', new.id, 'name', new.name,
                                    'from_stage', old.stage, 'stage', new.stage,
                                    'days_to_contract_end', days_left));
  elsif (pg_catalog.to_jsonb(new) - array['updated_at', 'updated_by_user_id'])
        is distinct from (pg_catalog.to_jsonb(old) - array['updated_at', 'updated_by_user_id'])
  then
    perform core.publish_event('project.changed', 'prj', 'prj', 'project', new.id,
      pg_catalog.jsonb_build_object('id', new.id, 'name', new.name, 'stage', new.stage,
                                    'days_to_contract_end', days_left));
  end if;
  return null;
end
$$;

create or replace function prj.publish_wall_event() returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  if new.status = 'completed' and old.status is distinct from 'completed' then
    perform core.publish_event('wall.completed', 'prj', 'prj', 'wall', new.id,
      pg_catalog.jsonb_build_object('id', new.id, 'project_id', new.project_id,
                                    'site_id', new.site_id, 'name', new.name,
                                    'status', new.status));
  end if;
  return null;
end
$$;
