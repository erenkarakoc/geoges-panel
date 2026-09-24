-- 0048 — the approval step (TASK-0117, REQ-WFL-012…016, D-099).
--
-- An approval is the one step where a flow stops and a person decides. Three things about it are
-- the database's, not a screen's:
--
-- The three outcomes are all there is (D-099): approve, reject, send back for correction. There is
-- no fourth and no "partially".
--
-- A refusal or a send-back without a reason is not a decision (REQ-WFL-015). The check refuses it,
-- so no path — screen, action, import — can leave one behind.
--
-- And a decision is made once. The second attempt changes nothing and says so, because an approval
-- arriving twice through a retried delivery must not decide twice.
--
-- The flow is not resumed here. Deciding publishes `approval.decided`, the engine hears it like
-- any other event and takes the next step in its own transaction — so a decision is never lost to
-- a half-finished run, and a run is never lost to a half-finished decision.

create table wfl.approval (
  id uuid not null default core.uuid_v7(),
  instance_id uuid not null references wfl.instance on delete cascade,
  step_state_id uuid not null references wfl.step_state on delete cascade,
  step_id text not null,
  title text not null,
  -- Who must decide. The engine works this out from the step's owner rule (D-097).
  owner_user_id uuid not null,
  -- What it is about, carried from the instance so the queue can show it without the definition.
  record_schema text,
  record_table text,
  record_id uuid,
  status text not null default 'waiting',
  decision text,
  reason text,
  decided_by_user_id uuid,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  constraint pk_approval primary key (id),
  constraint ck_approval__status check (status in ('waiting', 'decided')),
  constraint ck_approval__decision check (decision in ('approve', 'reject', 'return')),
  constraint ck_approval__decided check (
    (status = 'decided') = (decision is not null)
    and (status = 'decided') = (decided_at is not null)),
  -- A refusal or a send-back says why; an approval need not (REQ-WFL-015).
  constraint ck_approval__reason check (
    decision is null or decision = 'approve'
    or (reason is not null and pg_catalog.length(pg_catalog.btrim(reason)) >= 3))
);

create index ix_approval__waiting on wfl.approval (owner_user_id, created_at)
  where status = 'waiting';
-- One open approval per step visit; a retried delivery cannot open a second one.
create unique index uq_approval__step_state on wfl.approval (step_state_id);

comment on table wfl.approval is
  'A flow waiting on a person''s decision; three outcomes and a reason where one is owed (D-099).';

insert into core.table_layer (schema_name, table_name, layer, history, portable, scope_source)
values ('wfl', 'approval', 'business', 'tracked', false, 'parent');

create trigger record_history after insert or update on wfl.approval
  for each row execute function aud.capture_history();

alter table wfl.approval enable row level security;

-- The person who must decide sees it; so does whoever may design flows, because they are the ones
-- who answer for what the queue is doing. Seeing an approval because you may see the record it is
-- about arrives with the modules that own records.
create policy approval_read on wfl.approval for select to geoges_app
  using (owner_user_id = (select core.current_user_id())
         or (select iam.has_permission('wfl.workflow.design')));

revoke all on wfl.approval from public;
grant select on wfl.approval to geoges_app;
grant select, insert, update on wfl.approval to geoges_worker;

/** Opens the approval a step is waiting on. The engine's, not a person's. */
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

/**
 * The decision (REQ-WFL-013…016). Made by the person it belongs to, once, with a reason when the
 * answer is no or not yet. What happens next is the engine's: this publishes `approval.decided`
 * and stops.
 */
create function wfl.decide_approval(p_approval_id uuid, p_decision text, p_reason text default null)
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

revoke all on function wfl.decide_approval(uuid, text, text) from public;
grant execute on function wfl.decide_approval(uuid, text, text) to geoges_app;

-- The engine hears its own approvals, like any other event.
insert into core.event_subscription (subscriber, event_code, replayable)
values ('wfl.engine', 'approval.decided', false)
on conflict (subscriber, event_code) do nothing;
