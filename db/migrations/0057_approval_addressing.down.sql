-- Reverses 0057_approval_addressing.sql. An approval addressed to a group has nobody in the column
-- the old rule needs, so those rows are given the person the rule points at today; an approval whose
-- rule points at nobody right now cannot be carried back and is removed with its step visit, which
-- is the same thing the engine would do with a step it cannot address.
-- The policy reads the rule, so it goes before the column it depends on.
drop policy approval_read on wfl.approval;
create policy approval_read on wfl.approval for select to geoges_app
  using (owner_user_id = (select core.current_user_id())
         or (select iam.has_permission('wfl.workflow.design')));

alter table wfl.approval drop constraint ck_approval__addressed;

update wfl.approval a
   set owner_user_id = coalesce(
         a.owner_user_id,
         case a.owner_rule->>'type'
           when 'role' then (select x.user_id
                               from iam.role_assignment x
                               join iam.role r on r.id = x.role_id
                              where r.code = a.owner_rule->>'role'
                                and x.starts_on <= iam.today() and x.ends_on >= iam.today()
                              order by x.starts_on
                              limit 1)
           when 'owner_layer' then (select u from iam.owner_users() u limit 1)
           else null
         end)
 where a.owner_user_id is null;

delete from wfl.approval where owner_user_id is null;

alter table wfl.approval alter column owner_user_id set not null;
alter table wfl.approval drop column owner_rule;

drop index if exists wfl.ix_approval__waiting_owner;
drop index if exists wfl.ix_approval__waiting;
create index ix_approval__waiting on wfl.approval (owner_user_id, created_at)
  where status = 'waiting';

drop function wfl.request_approval(uuid, uuid, text, text, uuid, jsonb);

create function wfl.request_approval(p_instance_id uuid, p_step_state_id uuid, p_step_id text,
                                     p_title text, p_owner_user_id uuid)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  i record;
  new_id uuid;
begin
  select record_schema, record_table, record_id into i
    from wfl.instance where id = p_instance_id and status = 'running';
  if i is null then
    raise exception 'this instance is not running'
      using errcode = 'P0001', hint = 'wfl.not_running';
  end if;

  insert into wfl.approval (instance_id, step_state_id, step_id, title, owner_user_id,
                            record_schema, record_table, record_id)
  values (p_instance_id, p_step_state_id, p_step_id, p_title, p_owner_user_id,
          i.record_schema, i.record_table, i.record_id)
  on conflict (step_state_id) do nothing
  returning id into new_id;

  if new_id is null then
    select id into new_id from wfl.approval where step_state_id = p_step_state_id;
  end if;
  return new_id;
end
$$;

revoke all on function wfl.request_approval(uuid, uuid, text, text, uuid) from public;
grant execute on function wfl.request_approval(uuid, uuid, text, text, uuid) to geoges_worker;

create or replace function wfl.decide_approval(p_approval_id uuid, p_decision text,
                                               p_reason text default null)
returns boolean
language plpgsql security definer
set search_path = ''
as $$
declare
  a record;
begin
  select * into a from wfl.approval where id = p_approval_id;
  if a is null then
    raise exception 'no such approval' using errcode = 'P0001', hint = 'wfl.no_approval';
  end if;
  if a.owner_user_id <> core.current_user_id() then
    raise exception 'this approval belongs to somebody else'
      using errcode = 'P0001', hint = 'wfl.not_your_approval';
  end if;
  if a.status = 'decided' then
    return false;
  end if;
  if p_decision not in ('approve', 'reject', 'return') then
    raise exception 'an approval is approved, rejected or sent back'
      using errcode = 'P0001', hint = 'wfl.bad_decision';
  end if;
  if p_decision <> 'approve'
     and (p_reason is null or pg_catalog.length(pg_catalog.btrim(p_reason)) < 3) then
    raise exception 'a refusal or a send-back says why'
      using errcode = 'P0001', hint = 'wfl.reason_required';
  end if;

  update wfl.approval
     set status = 'decided', decision = p_decision, reason = pg_catalog.btrim(p_reason),
         decided_by_user_id = core.current_user_id(), decided_at = pg_catalog.now()
   where id = p_approval_id;

  insert into aud.audit_log (event_type, actor_user_id, target_schema, target_table, target_id,
                             payload)
  values ('approval.decided', core.current_user_id(), 'wfl', 'approval', p_approval_id,
          pg_catalog.jsonb_build_object('decision', p_decision, 'instance', a.instance_id,
                                        'step', a.step_id));

  perform core.publish_event('approval.decided', 'wfl', 'wfl', 'approval', p_approval_id,
                             pg_catalog.jsonb_build_object('decision', p_decision,
                                                           'instance', a.instance_id,
                                                           'step', a.step_id),
                             1, a.instance_id::text);
  return true;
end
$$;

drop function wfl.my_approval_count();
drop function wfl.my_approvals();
drop function wfl.approval_is_mine(uuid, jsonb);
drop function iam.stands_in_for(uuid);
drop function iam.holds_role_code(text);
