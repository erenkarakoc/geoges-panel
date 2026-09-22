-- 0011 — tasks and notifications (TASK-0108 step 1, REQ-TSK-001…011, D-130, D-131, D-263).
--
-- A task is given by a person to someone in their scope (D-130), or opened by the system for a
-- problem, at most once per open problem (REQ-TSK-005). The runtime role only reads: every change
-- goes through the functions below, which check who may do it and write the notification in the
-- same transaction. A notification carries its type, a subject (the task's title) and a panel
-- link; its words come from the type's fixed template in `modules/tsk/domain`, never from a free
-- text, so no sensitive field can reach it (REQ-TSK-011).

create schema tsk;
grant usage on schema tsk to geoges_app, geoges_worker;

create table tsk.task (
  id uuid not null default core.uuid_v7(),
  title text not null,
  description text,
  assignee_user_id uuid not null,
  source_type text not null,
  given_by_user_id uuid,
  source_event_code text,
  source_step_run_id uuid,
  problem_key text,
  priority text not null default 'normal',
  due_at timestamptz,
  status text not null default 'open',
  needs_giver_approval boolean not null default false,
  site_id uuid,
  project_id uuid,
  record_schema text,
  record_table text,
  record_id uuid,
  link_path text,
  reported_done_at timestamptz,
  reported_done_by_user_id uuid,
  closed_at timestamptz,
  closed_by_user_id uuid,
  closing_kind text,
  reopened_count integer not null default 0,
  created_at timestamptz not null default now(),
  created_by_user_id uuid default core.current_user_id(),
  created_in_role_id uuid default core.current_role_id(),
  updated_at timestamptz not null default now(),
  updated_by_user_id uuid,
  constraint pk_task primary key (id),
  constraint fk_task__assignee_user foreign key (assignee_user_id) references iam.user (id),
  constraint fk_task__given_by_user foreign key (given_by_user_id) references iam.user (id),
  constraint ck_task__title check (length(btrim(title)) between 1 and 200),
  constraint ck_task__source_type check (source_type in ('manual', 'system', 'workflow')),
  -- A task without a source cannot exist (REQ-TSK-001): the giver, the problem or the flow step.
  constraint ck_task__source check (
    case source_type
      when 'manual' then given_by_user_id is not null
      when 'system' then source_event_code is not null and problem_key is not null
      when 'workflow' then source_step_run_id is not null
    end),
  constraint ck_task__priority check (priority in ('low', 'normal', 'high', 'critical')),
  constraint ck_task__status check (status in ('open', 'reported_done', 'closed')),
  constraint ck_task__approval check (not needs_giver_approval or source_type = 'manual'),
  constraint ck_task__reported check ((status = 'reported_done') = (reported_done_at is not null)),
  constraint ck_task__closed check (
    (status = 'closed') = (closed_at is not null)
    and (status = 'closed') = (closing_kind is not null)),
  constraint ck_task__closing_kind
    check (closing_kind is null or closing_kind in ('completed', 'approved', 'resolved')),
  constraint ck_task__record check (
    (record_id is null) = (record_schema is null) and (record_id is null) = (record_table is null)
    and (record_schema is null or record_schema ~ '^[a-z]{2,3}$')
    and (record_table is null or record_table ~ '^[a-z][a-z0-9_]*$')),
  -- The link leads inside the panel, never elsewhere (REQ-TSK-007).
  constraint ck_task__link_path check (link_path is null or link_path ~ '^/[A-Za-z0-9]')
);
create index ix_task__assignee_user_id on tsk.task (assignee_user_id);
create index ix_task__given_by_user_id on tsk.task (given_by_user_id)
  where given_by_user_id is not null;
create index ix_task__open_due on tsk.task (due_at) where status <> 'closed';
-- The same problem never has two open tasks (REQ-TSK-005, TSK-K2).
create unique index uq_task__problem_key on tsk.task (problem_key)
  where problem_key is not null and status <> 'closed';

comment on table tsk.task is
  'A task given by a person, the system or a flow; never without a source (REQ-TSK-001).';

-- Who a task went up to and when (REQ-TSK-006); the first assignee keeps seeing it (TSK-K3).
create table tsk.escalation (
  id uuid not null default core.uuid_v7(),
  task_id uuid not null,
  from_user_id uuid not null,
  to_user_id uuid not null,
  level integer not null,
  escalated_at timestamptz not null default now(),
  rule_ref text not null,
  constraint pk_escalation primary key (id),
  constraint fk_escalation__task foreign key (task_id) references tsk.task (id),
  constraint fk_escalation__from_user foreign key (from_user_id) references iam.user (id),
  constraint fk_escalation__to_user foreign key (to_user_id) references iam.user (id),
  constraint uq_escalation__task_id_to_user_id unique (task_id, to_user_id),
  constraint ck_escalation__level check (level > 0)
);
create index ix_escalation__to_user_id on tsk.escalation (to_user_id);

create table tsk.notification (
  id uuid not null default core.uuid_v7(),
  user_id uuid not null,
  type text not null,
  subject text,
  link_path text,
  record_schema text,
  record_table text,
  record_id uuid,
  task_id uuid,
  source_key text,
  source_step_run_id uuid,
  is_critical boolean not null default false,
  channels text[] not null default '{panel}',
  read_at timestamptz,
  created_at timestamptz not null default now(),
  constraint pk_notification primary key (id),
  constraint fk_notification__user foreign key (user_id) references iam.user (id),
  constraint fk_notification__task foreign key (task_id) references tsk.task (id),
  constraint ck_notification__type check (type ~ '^[a-z_]+\.[a-z_]+$'),
  constraint ck_notification__subject check (subject is null or length(subject) <= 200),
  constraint ck_notification__link_path check (link_path is null or link_path ~ '^/[A-Za-z0-9]'),
  constraint ck_notification__channels
    check (channels <@ array['panel', 'push', 'email']::text[] and 'panel' = any (channels))
);
create index ix_notification__user_id on tsk.notification (user_id, created_at desc);
create index ix_notification__unread on tsk.notification (user_id) where read_at is null;
create index ix_notification__task_id on tsk.notification (task_id) where task_id is not null;
create index ix_notification__source on tsk.notification (user_id, type, source_key, created_at)
  where source_key is not null;

comment on table tsk.notification is
  'A notification for one person; its text is built from the type''s template (REQ-TSK-011).';

insert into core.table_layer (schema_name, table_name, layer, history) values
  ('tsk', 'task', 'business', 'tracked'),
  ('tsk', 'escalation', 'business', 'none'),
  ('tsk', 'notification', 'business', 'none');

-- ---------------------------------------------------------------------------------------------
-- Who may give and who sees (D-130, D-263)
-- ---------------------------------------------------------------------------------------------

-- Whether the signed-in person may give a task to this person (REQ-TSK-003): to themselves, and
-- to anyone active whose role assignment meets one of their own assignments' scope. A company
-- scope reaches everyone; a person working company-wide is reachable from any scope.
create function tsk.can_assign(p_assignee uuid) returns boolean
language sql stable security definer
set search_path = ''
as $$
  select iam.is_active_user(p_assignee)
     and exists (select from iam.active_assignments(core.current_user_id()))
     and (p_assignee = core.current_user_id()
          or exists (
            select from iam.active_assignments(core.current_user_id()) g,
                        iam.active_assignments(p_assignee) a
             where g.scope_type = 'company' or a.scope_type = 'company'
                or (a.scope_type = g.scope_type and a.scope_ids && g.scope_ids)))
$$;

-- The people the signed-in person may give a task to, for the "Görev ver" picker.
create function tsk.assignable_people() returns table (id uuid, display_name text)
language sql stable security definer
set search_path = ''
as $$
  select u.id, u.display_name
    from iam.user u
   where u.status = 'active' and tsk.can_assign(u.id)
   order by u.display_name, u.id
$$;

-- Whether the signed-in person stands in for the task's assignee today: a delegation covering
-- the task's place, or any active delegation when the task has no place (REQ-IAM-018).
create function tsk.is_delegate_for(p_task tsk.task) returns boolean
language sql stable security definer
set search_path = ''
as $$
  select case
    when p_task.site_id is null and p_task.project_id is null then exists (
      select from iam.role_assignment x
       where x.is_delegation and x.delegated_by_user_id = p_task.assignee_user_id
         and x.user_id = core.current_user_id()
         and x.starts_on <= iam.today() and x.ends_on >= iam.today()
         and exists (select from iam.active_assignments(x.user_id)))
    else core.current_user_id() in (
      select iam.active_delegates(p_task.assignee_user_id,
        case when p_task.site_id is not null then 'site' else 'project' end,
        coalesce(p_task.site_id, p_task.project_id)))
  end
$$;

-- Whether the signed-in person may act for the assignee: the assignee or an active delegate.
create function tsk.acts_for_assignee(p_task tsk.task) returns boolean
language sql stable security definer
set search_path = ''
as $$
  select p_task.assignee_user_id = core.current_user_id() or tsk.is_delegate_for(p_task)
$$;

-- Whether the signed-in person sees a task: its assignee, its giver, anyone it went up to, the
-- assignee's active delegates, and the owner layer (D-263).
create function tsk.can_see(p_task tsk.task) returns boolean
language sql stable security definer
set search_path = ''
as $$
  select core.current_user_id() is not null
     and (tsk.acts_for_assignee(p_task)
          or p_task.given_by_user_id = core.current_user_id()
          or exists (select from tsk.escalation e
                      where e.task_id = p_task.id and e.to_user_id = core.current_user_id())
          or iam.is_owner_layer())
$$;

-- Tasks the signed-in person sees, with the names of assignee and giver (people's rows are not
-- readable to everyone). `mine`: theirs as assignee, delegate or escalation target; `given`:
-- those they gave; `all`: everything they may see (the owner layer sees every task). With a
-- task id, that one task, whatever the view.
create function tsk.visible_tasks(p_view text, p_include_closed boolean default false,
                                  p_task_id uuid default null)
returns table (id uuid, title text, description text, priority text, status text,
               due_at timestamptz, assignee_user_id uuid, assignee_name text,
               given_by_user_id uuid, given_by_name text, source_type text,
               source_event_code text, needs_giver_approval boolean, link_path text,
               reported_done_at timestamptz, closed_at timestamptz, closing_kind text,
               reopened_count integer, created_at timestamptz)
language sql stable security definer
set search_path = ''
as $$
  select t.id, t.title, t.description, t.priority, t.status, t.due_at, t.assignee_user_id,
         a.display_name, t.given_by_user_id, g.display_name, t.source_type,
         t.source_event_code, t.needs_giver_approval, t.link_path, t.reported_done_at,
         t.closed_at, t.closing_kind, t.reopened_count, t.created_at
    from tsk.task t
    join iam.user a on a.id = t.assignee_user_id
    left join iam.user g on g.id = t.given_by_user_id
   where core.current_user_id() is not null
     and tsk.can_see(t)
     and case when p_task_id is not null then t.id = p_task_id
              else (p_include_closed or t.status <> 'closed')
                   and case p_view
                         when 'mine' then tsk.acts_for_assignee(t)
                           or exists (select from tsk.escalation e where e.task_id = t.id
                                         and e.to_user_id = core.current_user_id())
                         when 'given' then t.given_by_user_id = core.current_user_id()
                         when 'all' then true
                         else false end end
   order by t.created_at desc
   limit 500
$$;

-- The history of a task the signed-in person sees (REQ-TSK-004, REQ-TSK-006): giving, status
-- changes, reassignment and due date, with person, time and reason. Read here rather than with
-- aud.history_of, because who sees a task is TSK's rule, not the module-wide view permission.
create function tsk.task_history(p_task_id uuid)
returns table (operation text, field text, old_value jsonb, new_value jsonb, reason text,
               changed_by_user_id uuid, changed_by_name text, changed_at timestamptz)
language sql stable security definer
set search_path = ''
as $$
  select r.operation, r.field, r.old_value, r.new_value, r.reason, r.changed_by_user_id,
         u.display_name, r.changed_at
    from aud.record_history r
    left join iam.user u on u.id = r.changed_by_user_id
   where r.record_schema = 'tsk' and r.record_table = 'task' and r.record_id = p_task_id
     and (r.operation = 'insert'
          or r.field in ('status', 'assignee_user_id', 'due_at', 'priority'))
     and exists (select from tsk.task t where t.id = p_task_id and tsk.can_see(t))
   order by r.changed_at, r.id
$$;

-- ---------------------------------------------------------------------------------------------
-- Notifications (REQ-TSK-009…011)
-- ---------------------------------------------------------------------------------------------

-- Writes one notification. The same source, person and type within ten minutes is not sent
-- again (`notification.send`, "iki kez çalışırsa"); returns null then. Critical alerts and the
-- phone-worthy types (new task, approval request) also go to the phone (D-132).
create function tsk.notify(p_user uuid, p_type text, p_subject text, p_link_path text,
                           p_source_key text, p_task_id uuid default null,
                           p_record_schema text default null, p_record_table text default null,
                           p_record_id uuid default null, p_is_critical boolean default false)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  new_id uuid;
begin
  if not iam.is_active_user(p_user) then
    return null;
  end if;
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtext('tsk.notify:' || p_user || ':' || p_type || ':' || coalesce(p_source_key, '')));
  if p_source_key is not null and exists (
       select from tsk.notification n
        where n.user_id = p_user and n.type = p_type and n.source_key = p_source_key
          and n.created_at > pg_catalog.now() - interval '10 minutes') then
    return null;
  end if;
  insert into tsk.notification (user_id, type, subject, link_path, record_schema, record_table,
                                record_id, task_id, source_key, is_critical, channels)
  values (p_user, p_type, pg_catalog.left(p_subject, 200), p_link_path, p_record_schema,
          p_record_table, p_record_id, p_task_id, p_source_key, p_is_critical,
          case when p_is_critical or p_type in ('task.assigned', 'approval.requested')
               then array['panel', 'push'] else array['panel'] end)
  returning id into new_id;
  return new_id;
end
$$;

-- Marks the signed-in person's notifications read: the given ones, or all when null.
create function tsk.mark_read(p_ids uuid[] default null) returns integer
language plpgsql security definer
set search_path = ''
as $$
declare
  changed integer;
begin
  update tsk.notification set read_at = pg_catalog.now()
   where user_id = core.current_user_id() and read_at is null
     and (p_ids is null or id = any (p_ids));
  get diagnostics changed = row_count;
  return changed;
end
$$;

-- ---------------------------------------------------------------------------------------------
-- Guards
-- ---------------------------------------------------------------------------------------------

-- A task is never deleted and keeps its source, assignee's first giver and its record.
create function tsk.guard_task() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    if pg_catalog.current_setting('aud.reset_purge', true) = 'on'
       and session_user::text <> 'geoges_app' then
      return old;
    end if;
    raise exception 'a task is never deleted' using errcode = 'P0001', hint = 'tsk.no_delete';
  end if;
  if (new.source_type, new.given_by_user_id, new.source_event_code, new.source_step_run_id,
      new.problem_key, new.needs_giver_approval, new.record_schema, new.record_table,
      new.record_id)
     is distinct from
     (old.source_type, old.given_by_user_id, old.source_event_code, old.source_step_run_id,
      old.problem_key, old.needs_giver_approval, old.record_schema, old.record_table,
      old.record_id) then
    raise exception 'a task keeps its source and record' using errcode = 'P0001',
      hint = 'tsk.source_fixed';
  end if;
  return new;
end
$$;

create trigger task_guard before update or delete on tsk.task
  for each row execute function tsk.guard_task();
create trigger task_stamp before update on tsk.task
  for each row execute function iam.stamp_update();
-- Closing, reopening and escalation show in the task's history with person and time (REQ-TSK-004).
create trigger record_history after insert or update on tsk.task
  for each row execute function aud.capture_history();

-- ---------------------------------------------------------------------------------------------
-- Giving, completing, approving, reopening (REQ-TSK-003, REQ-TSK-004)
-- ---------------------------------------------------------------------------------------------

create function tsk.task_path(p_task_id uuid) returns text
language sql immutable parallel safe
as $$ select '/tasks/' || p_task_id $$;

-- Gives a task as the signed-in person. Refused outside their scope (D-130).
create function tsk.assign_task(p_title text, p_description text, p_assignee uuid,
                                p_priority text, p_due_at timestamptz,
                                p_needs_giver_approval boolean) returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  me uuid := core.current_user_id();
  new_id uuid := core.uuid_v7();
  t tsk.task;
begin
  if me is null or not tsk.can_assign(p_assignee) then
    raise exception 'this person is outside your scope' using errcode = '42501',
      hint = 'tsk.outside_scope';
  end if;
  insert into tsk.task (id, title, description, assignee_user_id, source_type,
                        given_by_user_id, priority, due_at, needs_giver_approval, link_path)
  values (new_id, pg_catalog.btrim(p_title), nullif(pg_catalog.btrim(p_description), ''),
          p_assignee, 'manual', me, coalesce(p_priority, 'normal'), p_due_at,
          coalesce(p_needs_giver_approval, false) and p_assignee <> me, tsk.task_path(new_id))
  returning * into t;
  perform core.publish_event('task.created', 'tsk', 'tsk', 'task', t.id,
    pg_catalog.jsonb_build_object('task_id', t.id, 'assignee_user_id', t.assignee_user_id,
      'source_type', 'manual', 'given_by_user_id', me, 'due_at', t.due_at,
      'priority', t.priority));
  if p_assignee <> me then
    perform tsk.notify(p_assignee, 'task.assigned', t.title, tsk.task_path(t.id),
                       'task:' || t.id || ':assigned', t.id, p_is_critical => t.priority = 'critical');
  end if;
  return t.id;
end
$$;

-- Closes a task and tells whoever should know. Shared by the paths below.
create function tsk.close_task(p_task tsk.task, p_kind text, p_note text default null)
returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  if p_note is not null then
    perform pg_catalog.set_config('app.change_reason', p_note, true);
  end if;
  update tsk.task
     set status = 'closed', closing_kind = p_kind, closed_at = pg_catalog.now(),
         closed_by_user_id = core.current_user_id(), reported_done_at = null,
         reported_done_by_user_id = null
   where id = p_task.id;
  perform core.publish_event('task.completed', 'tsk', 'tsk', 'task', p_task.id,
    pg_catalog.jsonb_build_object('task_id', p_task.id, 'closed_by_user_id',
      core.current_user_id(), 'closing_kind', p_kind));
end
$$;

-- The assignee (or their active delegate) says the task is done (REQ-TSK-004). Without
-- "onayım gereksin" it closes and the giver is told; with it, it waits for the giver.
create function tsk.complete_task(p_task_id uuid) returns text
language plpgsql security definer
set search_path = ''
as $$
declare
  t tsk.task;
begin
  select * into t from tsk.task where id = p_task_id for update;
  if t.id is null or not tsk.can_see(t) then
    raise exception 'no such task' using errcode = '42501', hint = 'tsk.not_found';
  end if;
  if not tsk.acts_for_assignee(t) then
    raise exception 'only the assignee completes a task' using errcode = '42501',
      hint = 'tsk.not_assignee';
  end if;
  if t.status <> 'open' then
    return t.status;
  end if;
  if t.needs_giver_approval then
    update tsk.task
       set status = 'reported_done', reported_done_at = pg_catalog.now(),
           reported_done_by_user_id = core.current_user_id()
     where id = t.id;
    perform tsk.notify(t.given_by_user_id, 'task.done_reported', t.title, tsk.task_path(t.id),
                       'task:' || t.id || ':reported:' || t.reopened_count, t.id);
    return 'reported_done';
  end if;
  perform tsk.close_task(t, 'completed');
  if t.given_by_user_id is not null and t.given_by_user_id <> core.current_user_id() then
    perform tsk.notify(t.given_by_user_id, 'task.completed', t.title, tsk.task_path(t.id),
                       'task:' || t.id || ':completed:' || t.reopened_count, t.id);
  end if;
  return 'closed';
end
$$;

-- The giver approves a task reported done; only then it shows as closed (REQ-TSK-004).
create function tsk.approve_task(p_task_id uuid) returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  t tsk.task;
begin
  select * into t from tsk.task where id = p_task_id for update;
  if t.id is null or not tsk.can_see(t) then
    raise exception 'no such task' using errcode = '42501', hint = 'tsk.not_found';
  end if;
  if t.given_by_user_id is distinct from core.current_user_id() then
    raise exception 'only the giver approves a task' using errcode = '42501',
      hint = 'tsk.not_giver';
  end if;
  if t.status <> 'reported_done' then
    raise exception 'the task is not waiting for approval' using errcode = 'P0001',
      hint = 'tsk.not_reported';
  end if;
  perform tsk.close_task(t, 'approved');
  perform tsk.notify(t.assignee_user_id, 'task.approved', t.title, tsk.task_path(t.id),
                     'task:' || t.id || ':approved:' || t.reopened_count, t.id);
end
$$;

-- The giver reopens a closed task or sends a reported one back (REQ-TSK-004); the reason, if
-- given, goes to the history with the change.
create function tsk.reopen_task(p_task_id uuid, p_reason text default null) returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  t tsk.task;
begin
  select * into t from tsk.task where id = p_task_id for update;
  if t.id is null or not tsk.can_see(t) then
    raise exception 'no such task' using errcode = '42501', hint = 'tsk.not_found';
  end if;
  if t.given_by_user_id is distinct from core.current_user_id() then
    raise exception 'only the giver reopens a task' using errcode = '42501',
      hint = 'tsk.not_giver';
  end if;
  if t.status = 'open' then
    return;
  end if;
  if nullif(pg_catalog.btrim(p_reason), '') is not null then
    perform pg_catalog.set_config('app.change_reason', pg_catalog.btrim(p_reason), true);
  end if;
  update tsk.task
     set status = 'open', closed_at = null, closed_by_user_id = null, closing_kind = null,
         reported_done_at = null, reported_done_by_user_id = null,
         reopened_count = t.reopened_count + 1
   where id = t.id;
  if t.assignee_user_id <> core.current_user_id() then
    perform tsk.notify(t.assignee_user_id, 'task.reopened', t.title, tsk.task_path(t.id),
                       'task:' || t.id || ':reopened:' || (t.reopened_count + 1), t.id);
  end if;
end
$$;

-- ---------------------------------------------------------------------------------------------
-- System tasks (REQ-TSK-005, `task.open`)
-- ---------------------------------------------------------------------------------------------

-- Opens the task for a problem, or returns the open one: the same problem never opens a second
-- task. Called by the worker and, from Phase 08, by the flow engine.
create function tsk.open_problem_task(p_problem_key text, p_event_code text, p_title text,
                                      p_assignee uuid, p_priority text default 'normal',
                                      p_due_at timestamptz default null,
                                      p_link_path text default null,
                                      p_record_schema text default null,
                                      p_record_table text default null,
                                      p_record_id uuid default null,
                                      p_site_id uuid default null) returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  new_id uuid := core.uuid_v7();
  t tsk.task;
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('tsk.problem:' || p_problem_key));
  select * into t from tsk.task where problem_key = p_problem_key and status <> 'closed';
  if t.id is not null then
    return t.id;
  end if;
  insert into tsk.task (id, title, assignee_user_id, source_type, source_event_code,
                        problem_key, priority, due_at, link_path, record_schema, record_table,
                        record_id, site_id)
  values (new_id, p_title, p_assignee, 'system', p_event_code, p_problem_key,
          coalesce(p_priority, 'normal'), p_due_at, coalesce(p_link_path, tsk.task_path(new_id)),
          p_record_schema, p_record_table, p_record_id, p_site_id)
  returning * into t;
  perform core.publish_event('task.created', 'tsk', 'tsk', 'task', t.id,
    pg_catalog.jsonb_build_object('task_id', t.id, 'assignee_user_id', t.assignee_user_id,
      'source_type', 'system', 'source_event_code', p_event_code, 'due_at', t.due_at,
      'priority', t.priority));
  perform tsk.notify(p_assignee, 'task.assigned', t.title, tsk.task_path(t.id),
                     'task:' || t.id || ':assigned', t.id,
                     p_is_critical => t.priority = 'critical');
  return t.id;
end
$$;

-- Closes the open task of a problem that went away, with the note "sebebi çözüldü"; returns
-- whether there was one.
create function tsk.resolve_problem(p_problem_key text) returns boolean
language plpgsql security definer
set search_path = ''
as $$
declare
  t tsk.task;
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('tsk.problem:' || p_problem_key));
  select * into t from tsk.task where problem_key = p_problem_key and status <> 'closed'
    for update;
  if t.id is null then
    return false;
  end if;
  perform tsk.close_task(t, 'resolved', 'sebebi çözüldü');
  return true;
end
$$;

-- ---------------------------------------------------------------------------------------------
-- Policies and privileges
-- ---------------------------------------------------------------------------------------------

alter table tsk.task enable row level security;
alter table tsk.escalation enable row level security;
alter table tsk.notification enable row level security;

create policy task_read on tsk.task for select to geoges_app using (tsk.can_see(task));
create policy escalation_read on tsk.escalation for select to geoges_app
  using (exists (select from tsk.task t where t.id = task_id));
-- A notification is seen by its recipient only (D-263).
create policy notification_read on tsk.notification for select to geoges_app
  using (user_id = (select core.current_user_id()));

revoke all on tsk.task, tsk.escalation, tsk.notification from public;
grant select on tsk.task, tsk.escalation, tsk.notification to geoges_app;
grant select on tsk.task, tsk.escalation, tsk.notification to geoges_worker;

revoke all on all functions in schema tsk from public;
grant execute on function tsk.can_assign(uuid), tsk.assignable_people(), tsk.can_see(tsk.task),
  tsk.is_delegate_for(tsk.task),
  tsk.visible_tasks(text, boolean, uuid), tsk.task_history(uuid),
  tsk.acts_for_assignee(tsk.task), tsk.task_path(uuid), tsk.mark_read(uuid[]),
  tsk.assign_task(text, text, uuid, text, timestamptz, boolean), tsk.complete_task(uuid),
  tsk.approve_task(uuid), tsk.reopen_task(uuid, text)
  to geoges_app;
grant execute on function tsk.task_path(uuid),
  tsk.notify(uuid, text, text, text, text, uuid, text, text, uuid, boolean),
  tsk.open_problem_task(text, text, text, uuid, text, timestamptz, text, text, text, uuid, uuid),
  tsk.resolve_problem(text)
  to geoges_worker;
