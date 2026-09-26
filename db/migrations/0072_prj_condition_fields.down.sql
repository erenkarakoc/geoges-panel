-- Reverts 0072: the project's and the wall's events carry what 0064 and 0065 gave them.

create or replace function prj.record_project_stage() returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into prj.project_stage_change (project_id, from_stage, to_stage)
    values (new.id, null, new.stage);
    perform core.publish_event('project.created', 'prj', 'prj', 'project', new.id,
      pg_catalog.jsonb_build_object('id', new.id, 'name', new.name,
                                    'client_party_id', new.client_party_id,
                                    'coordinator_user_id', new.coordinator_user_id,
                                    'stage', new.stage));
  elsif new.stage is distinct from old.stage then
    insert into prj.project_stage_change (project_id, from_stage, to_stage)
    values (new.id, old.stage, new.stage);
    perform core.publish_event('project.stage_changed', 'prj', 'prj', 'project', new.id,
      pg_catalog.jsonb_build_object('id', new.id, 'name', new.name,
                                    'from_stage', old.stage, 'stage', new.stage));
  elsif (pg_catalog.to_jsonb(new) - array['updated_at', 'updated_by_user_id'])
        is distinct from (pg_catalog.to_jsonb(old) - array['updated_at', 'updated_by_user_id'])
  then
    perform core.publish_event('project.changed', 'prj', 'prj', 'project', new.id,
      pg_catalog.jsonb_build_object('id', new.id, 'name', new.name));
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
                                    'site_id', new.site_id, 'name', new.name));
  end if;
  return null;
end
$$;
