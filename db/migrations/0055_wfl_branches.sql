-- 0055 — parallel branches as child runs (TASK-0117, REQ-WFL-006, REQ-WFL-009, REQ-WFL-011).
--
-- A flow run walks one step at a time and sits inside the step it waits on. "Paralel dal",
-- "birleşme", "her biri için" and "alt akış" all need several things to be under way at once, and
-- the honest way to have that here is to let a run have children: each branch is an ordinary run
-- of the same flow that starts at its own step, waits on its own approvals and keeps its own log.
-- Nothing about a single run changes, and everything already built for a run — the step limit,
-- the log, the waiting, the dry run — is what a branch gets.
--
-- The parent sits inside the step that opened the branches until the last one ends; the engine
-- then leaves that step and carries on. A branch that failed fails the parent with its own reason:
-- a process where half the work silently disappeared is worse than one that stops and says so.

alter table wfl.instance
  add column parent_instance_id uuid references wfl.instance,
  add column parent_step_state_id uuid references wfl.step_state,
  -- Which path or which item this branch is: the designer's own word, shown in the log.
  add column branch_label text,
  -- Where the branch begins; a parent run begins at the definition's start.
  add column start_step_id text,
  -- 0 for a run somebody or something triggered; a branch is one deeper than its parent.
  add column depth integer not null default 0;

alter table wfl.instance
  add constraint ck_instance__branch check (
    (parent_instance_id is null) = (parent_step_state_id is null)
    and (parent_instance_id is null or start_step_id is not null)
    and (parent_instance_id is not null or depth = 0)
    and depth between 0 and 3);

create index ix_instance__parent on wfl.instance (parent_instance_id)
  where parent_instance_id is not null;
create index ix_instance__branch_running on wfl.instance (parent_step_state_id)
  where status = 'running';

comment on column wfl.instance.parent_step_state_id is
  'The step of the parent run that opened this branch; the parent waits in it until all are done.';

-- The log gains two words of its own: a branch opening and the branches joining again.
alter table wfl.run_log drop constraint ck_run_log__kind;
alter table wfl.run_log add constraint ck_run_log__kind
  check (kind in ('started', 'entered', 'left', 'waiting', 'failed', 'limit', 'ended',
                  'branch_opened', 'branch_joined'));

-- A branch is not triggered by anything of its own.
alter table wfl.instance drop constraint ck_instance__trigger;
alter table wfl.instance add constraint ck_instance__trigger
  check (trigger_kind in ('event', 'clock', 'threshold', 'manual', 'branch'));

/**
 * Opens one branch of a run (REQ-WFL-006). It is the same flow, the same version and the same
 * record: only the step it starts at, the label it carries and its own context differ. Three
 * levels deep is the limit — a flow nobody can picture is a flow nobody can fix.
 */
create function wfl.start_branch(p_parent_instance_id uuid, p_parent_step_state_id uuid,
                                 p_start_step_id text, p_branch_label text,
                                 p_context jsonb default '{}')
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  parent wfl.instance;
  new_id uuid;
begin
  select * into parent from wfl.instance where id = p_parent_instance_id;
  if parent.id is null or parent.status <> 'running' then
    return null;
  end if;
  if parent.depth >= 3 then
    raise exception 'a flow may not branch more than three levels deep'
      using errcode = 'P0001', hint = 'wfl.branch_too_deep';
  end if;

  insert into wfl.instance (flow_version_id, flow_id, flow_key, version, trigger_kind,
                            record_schema, record_table, record_id, context,
                            parent_instance_id, parent_step_state_id, branch_label,
                            start_step_id, depth, started_by_user_id)
  values (parent.flow_version_id, parent.flow_id, parent.flow_key, parent.version, 'branch',
          parent.record_schema, parent.record_table, parent.record_id,
          coalesce(p_context, '{}'::jsonb),
          parent.id, p_parent_step_state_id, p_branch_label, p_start_step_id, parent.depth + 1,
          parent.started_by_user_id)
  returning id into new_id;

  insert into wfl.run_log (instance_id, step_id, kind, detail)
  values (parent.id, p_start_step_id, 'branch_opened',
          pg_catalog.jsonb_build_object('branch', p_branch_label, 'instance_id', new_id));
  return new_id;
end
$$;

revoke all on function wfl.start_branch(uuid, uuid, text, text, jsonb) from public;
grant execute on function wfl.start_branch(uuid, uuid, text, text, jsonb) to geoges_worker;

/**
 * How the branches of one step stand: how many were opened, how many are still running, and the
 * first failure among them, which is what the parent reports when it stops.
 */
create function wfl.branch_state(p_parent_step_state_id uuid)
returns table (opened integer, running integer, failed integer, first_failure text)
language sql stable security definer
set search_path = ''
as $$
  select pg_catalog.count(*)::integer,
         pg_catalog.count(*) filter (where i.status = 'running')::integer,
         pg_catalog.count(*) filter (where i.status = 'failed')::integer,
         (select f.failure from wfl.instance f
           where f.parent_step_state_id = p_parent_step_state_id and f.status = 'failed'
           order by f.ended_at limit 1)
    from wfl.instance i
   where i.parent_step_state_id = p_parent_step_state_id
$$;

revoke all on function wfl.branch_state(uuid) from public;
grant execute on function wfl.branch_state(uuid) to geoges_worker;

/** The run this one is a branch of, and the step it is waiting in; null for a run of its own. */
create function wfl.branch_parent(p_instance_id uuid)
returns table (parent_instance_id uuid, parent_step_state_id uuid, branch_label text)
language sql stable security definer
set search_path = ''
as $$
  select i.parent_instance_id, i.parent_step_state_id, i.branch_label
    from wfl.instance i
   where i.id = p_instance_id and i.parent_instance_id is not null
$$;

revoke all on function wfl.branch_parent(uuid) from public;
grant execute on function wfl.branch_parent(uuid) to geoges_worker;
