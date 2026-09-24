-- 0054 — dependency locks (TASK-0117, REQ-WFL-029, REQ-WFL-030, D-084).
--
-- A lock does not delete a record or hide it. It stops one transition and says why: "the handover
-- cannot be finished until the custody is closed". The record stays where it is, readable by
-- whoever could read it before.
--
-- Two rules are the database's, not a screen's:
--
-- Only the owner layer and the general manager may pass a lock, and only with a reason
-- (REQ-WFL-030). The reason is written into the audit log with the lock it passed, because a lock
-- that can be stepped over quietly is not a lock.
--
-- A lock is released by the flow that wrote it, or by somebody passing it; either way the row
-- stays, with when and by whom. The history of a blocked record is what people argue about later.

create table wfl.record_lock (
  id uuid not null default core.uuid_v7(),
  -- The record it holds, named the way every module names one.
  record_schema text not null,
  record_table text not null,
  record_id uuid not null,
  /** The transition it stops; `*` when the record may not move at all. */
  transition text not null default '*',
  reason text not null,
  -- Where it came from, so a screen can say more than "locked" (D-087).
  instance_id uuid references wfl.instance on delete set null,
  step_id text,
  flow_key text,
  status text not null default 'held',
  released_at timestamptz,
  released_by_user_id uuid,
  override_reason text,
  created_at timestamptz not null default now(),
  created_by_user_id uuid,
  constraint pk_record_lock primary key (id),
  constraint ck_record_lock__status check (status in ('held', 'released', 'overridden')),
  constraint ck_record_lock__reason check (pg_catalog.length(pg_catalog.btrim(reason)) >= 3),
  constraint ck_record_lock__released check ((status = 'held') = (released_at is null)),
  -- Passing a lock says why; releasing it does not have to (REQ-WFL-030).
  constraint ck_record_lock__override check (
    status <> 'overridden'
    or (override_reason is not null
        and pg_catalog.length(pg_catalog.btrim(override_reason)) >= 3))
);

-- One held lock per record and transition: a second flow asking for the same one finds it held.
create unique index uq_record_lock__held
  on wfl.record_lock (record_schema, record_table, record_id, transition)
  where status = 'held';
create index ix_record_lock__record on wfl.record_lock (record_schema, record_table, record_id);

comment on table wfl.record_lock is
  'A transition a flow is holding shut, with the reason a screen shows (REQ-WFL-029).';

insert into core.table_layer (schema_name, table_name, layer, history, portable, scope_source)
values ('wfl', 'record_lock', 'business', 'tracked', false, 'parent');

create trigger record_history after insert or update on wfl.record_lock
  for each row execute function aud.capture_history();

alter table wfl.record_lock enable row level security;

-- A lock is the reason somebody cannot do something, so anybody who can reach the record needs to
-- be able to read it. Which records a person may reach is the owning module's answer, and no module
-- owns one yet; until then a lock is visible to whoever may design flows or manage the panel.
create policy record_lock_read on wfl.record_lock for select to geoges_app
  using (
    (select iam.has_permission('wfl.workflow.design'))
    or (select iam.has_permission('wfl.approval.view'))
  );

revoke all on wfl.record_lock from public;
grant select on wfl.record_lock to geoges_app;
grant select, insert, update on wfl.record_lock to geoges_worker;

/** Holds a transition shut. The engine's; a second call for the same one finds the first. */
create function wfl.hold_lock(p_record_schema text, p_record_table text, p_record_id uuid,
                              p_transition text, p_reason text, p_instance_id uuid default null,
                              p_step_id text default null)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  held uuid;
  flow text;
begin
  select i.flow_key into flow from wfl.instance i where i.id = p_instance_id;

  insert into wfl.record_lock (record_schema, record_table, record_id, transition, reason,
                               instance_id, step_id, flow_key, created_by_user_id)
  values (p_record_schema, p_record_table, p_record_id, coalesce(p_transition, '*'), p_reason,
          p_instance_id, p_step_id, flow, core.current_user_id())
  on conflict do nothing
  returning id into held;

  if held is null then
    select l.id into held from wfl.record_lock l
     where l.record_schema = p_record_schema and l.record_table = p_record_table
       and l.record_id = p_record_id and l.transition = coalesce(p_transition, '*')
       and l.status = 'held';
  end if;
  return held;
end
$$;

revoke all on function wfl.hold_lock(text, text, uuid, text, text, uuid, text) from public;
grant execute on function wfl.hold_lock(text, text, uuid, text, text, uuid, text) to geoges_worker;

/** Lets go of a lock the flow itself is holding. */
create function wfl.release_lock(p_lock_id uuid) returns boolean
language sql security definer
set search_path = ''
as $$
  update wfl.record_lock
     set status = 'released', released_at = pg_catalog.now(),
         released_by_user_id = core.current_user_id()
   where id = p_lock_id and status = 'held'
  returning true
$$;

revoke all on function wfl.release_lock(uuid) from public;
grant execute on function wfl.release_lock(uuid) to geoges_worker;

/**
 * Passing a lock (REQ-WFL-030, D-084). Only the owner layer and the general manager, only with a
 * reason, always written down: the audit log keeps who passed which lock and why, and the lock
 * itself keeps the reason so the record's own history shows it.
 */
create function wfl.override_lock(p_lock_id uuid, p_reason text) returns boolean
language plpgsql security definer
set search_path = ''
as $$
declare
  l record;
  may boolean;
begin
  select * into l from wfl.record_lock where id = p_lock_id;
  if l is null or l.status <> 'held' then
    return false;
  end if;

  -- The owner layer, or the seat the company calls the general manager (PERMISSION_MATRIX).
  -- IAM answers both: `iam.is_owner_layer()` for the first, and the person's own live
  -- assignments for the second, which is the same list every other permission question uses.
  select iam.is_owner_layer()
      or exists (select from iam.active_assignments(core.current_user_id()) a
                  join iam.role role on role.id = a.role_id
                 where role.code = 'GM')
    into may;
  if not may then
    raise exception 'only the owner layer or the general manager may pass a lock'
      using errcode = 'P0001', hint = 'wfl.override_not_allowed';
  end if;
  if p_reason is null or pg_catalog.length(pg_catalog.btrim(p_reason)) < 3 then
    raise exception 'passing a lock says why'
      using errcode = 'P0001', hint = 'wfl.override_reason_required';
  end if;

  update wfl.record_lock
     set status = 'overridden', released_at = pg_catalog.now(),
         released_by_user_id = core.current_user_id(),
         override_reason = pg_catalog.btrim(p_reason)
   where id = p_lock_id;

  insert into aud.audit_log (event_type, actor_user_id, target_schema, target_table, target_id,
                             payload)
  values ('lock.overridden', core.current_user_id(), 'wfl', 'record_lock', p_lock_id,
          pg_catalog.jsonb_build_object('record', l.record_schema || '.' || l.record_table,
                                        'record_id', l.record_id, 'transition', l.transition,
                                        'reason', pg_catalog.btrim(p_reason),
                                        'flow', l.flow_key));

  perform core.publish_event('lock.overridden', 'wfl', 'wfl', 'record_lock', p_lock_id,
                             pg_catalog.jsonb_build_object('record_id', l.record_id,
                                                           'transition', l.transition,
                                                           'reason', pg_catalog.btrim(p_reason)));
  return true;
end
$$;

revoke all on function wfl.override_lock(uuid, text) from public;
grant execute on function wfl.override_lock(uuid, text) to geoges_app;

/**
 * What is holding a record shut, for the screen that has to explain a refusal. A module asks this
 * before it lets a record move; an empty answer means nothing is in the way.
 */
create function wfl.locks_on(p_record_schema text, p_record_table text, p_record_id uuid)
returns table (id uuid, transition text, reason text, flow_key text, held_since timestamptz)
language sql stable security definer
set search_path = ''
as $$
  select l.id, l.transition, l.reason, l.flow_key, l.created_at
    from wfl.record_lock l
   where l.record_schema = p_record_schema and l.record_table = p_record_table
     and l.record_id = p_record_id and l.status = 'held'
   order by l.created_at
$$;

revoke all on function wfl.locks_on(text, text, uuid) from public;
grant execute on function wfl.locks_on(text, text, uuid) to geoges_app, geoges_worker;
