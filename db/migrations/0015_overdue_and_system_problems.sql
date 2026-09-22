-- 0015 — overdue tasks, escalation and system problems (TASK-0108 step 5, REQ-TSK-005/006,
-- D-263, EVENT_BACKBONE section 4).
--
-- A task whose due date passed tells its assignee once. If nobody deals with it, it climbs the
-- default chain: the assignee's active delegate, then their manager, and finally the owner
-- layer; every step stays in the task's history and the first assignee keeps seeing it
-- (REQ-TSK-006). The chain and the waiting time move into the escalation flow in Phase 08; the
-- waiting time is already the dated rule `tsk.escalation-wait-hours`.
--
-- The queue's own troubles (dead letters, deliveries running late) and a missing exchange rate
-- open one system-problem task each, and close themselves when the cause goes away.

-- People who hold a permission today, wherever they hold it: a door TSK uses instead of naming
-- IAM's tables in its code (MODULE_BOUNDARIES).
create function tsk.people_with_permission(p_code text) returns setof uuid
language sql stable security definer
set search_path = ''
as $$
  select distinct x.user_id
    from iam.role_assignment x
    join iam.role_permission rp on rp.role_id = x.role_id
    join iam.permission p on p.id = rp.permission_id and p.code = p_code
   where x.starts_on <= iam.today() and (x.ends_on is null or x.ends_on >= iam.today())
     and iam.is_active_user(x.user_id)
$$;

-- The owner layer, as TSK sees it (same door rule as above).
create function tsk.owner_people() returns setof uuid
language sql stable security definer
set search_path = ''
as $$ select iam.owner_users() $$;

-- Who stands in for somebody today. A task tied to a site asks for that site's delegates; one
-- that belongs to no site takes any active delegate of the person (TASK-0108).
create function tsk.delegates_of(p_user uuid, p_site uuid) returns setof uuid
language sql stable security definer
set search_path = ''
as $$
  select iam.active_delegates(p_user, 'site', p_site) where p_site is not null
  union
  select distinct x.user_id
    from iam.role_assignment x
   where p_site is null and x.is_delegation and x.delegated_by_user_id = p_user
     and x.starts_on <= iam.today() and x.ends_on >= iam.today()
     and iam.is_active_user(x.user_id)
$$;

-- Says once that a task is late: the assignee hears it and `task.overdue` is published.
create function tsk.mark_overdue(p_task_id uuid) returns boolean
language plpgsql security definer
set search_path = ''
as $$
declare
  t tsk.task;
begin
  select * into t from tsk.task where id = p_task_id for update;
  if t.id is null or t.status <> 'open' or t.due_at is null or t.due_at >= pg_catalog.now() then
    return false;
  end if;
  if exists (select from tsk.notification n
              where n.task_id = t.id and n.type = 'task.overdue'
                and n.source_key = 'overdue:' || t.id) then
    return false;
  end if;
  perform tsk.notify(t.assignee_user_id, 'task.overdue', t.title, tsk.task_path(t.id),
                     'overdue:' || t.id, t.id,
                     p_is_critical => t.priority = 'critical');
  perform core.publish_event('task.overdue', 'tsk', 'tsk', 'task', t.id,
    pg_catalog.jsonb_build_object('task_id', t.id, 'assignee_user_id', t.assignee_user_id,
                                  'due_at', t.due_at));
  return true;
end
$$;

-- Who the task goes to next: the current holder's active delegate, then their manager, and the
-- owner layer at the end. Nobody who already has it is chosen again.
create function tsk.next_escalation_target(p_task tsk.task) returns uuid
language plpgsql stable security definer
set search_path = ''
as $$
declare
  scope_type text := case when p_task.site_id is not null then 'site' else 'company' end;
  scope_id uuid := p_task.site_id;
  holder uuid;
  had uuid[];
  candidate uuid;
begin
  select coalesce(pg_catalog.array_agg(e.to_user_id order by e.level), '{}') into had
    from tsk.escalation e where e.task_id = p_task.id;
  holder := coalesce(had[pg_catalog.array_length(had, 1)], p_task.assignee_user_id);

  if pg_catalog.array_length(had, 1) is null then
    select d into candidate
      from tsk.delegates_of(p_task.assignee_user_id, p_task.site_id) d
     where d <> p_task.assignee_user_id
     limit 1;
    if candidate is not null then
      return candidate;
    end if;
  end if;

  select m into candidate
    from iam.manager_of(holder, scope_type, scope_id) m
   where m <> holder and m <> p_task.assignee_user_id and not (m = any (had))
   limit 1;
  if candidate is not null then
    return candidate;
  end if;

  select o into candidate
    from iam.owner_users() o
   where o <> holder and o <> p_task.assignee_user_id and not (o = any (had))
   limit 1;
  return candidate;
end
$$;

-- Hands a late task to the next step of the chain; the first assignee keeps it too.
create function tsk.escalate_task(p_task_id uuid) returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  t tsk.task;
  target uuid;
  holder uuid;
begin
  select * into t from tsk.task where id = p_task_id for update;
  if t.id is null or t.status <> 'open' then
    return null;
  end if;
  target := tsk.next_escalation_target(t);
  if target is null then
    return null;
  end if;
  select coalesce((select e.to_user_id from tsk.escalation e
                    where e.task_id = t.id order by e.level desc limit 1), t.assignee_user_id)
    into holder;
  insert into tsk.escalation (task_id, from_user_id, to_user_id, level, rule_ref)
  select t.id, holder, target,
         coalesce((select pg_catalog.max(e.level) from tsk.escalation e where e.task_id = t.id),
                  0) + 1,
         'varsayılan zincir';
  perform tsk.notify(target, 'task.escalated', t.title, tsk.task_path(t.id),
                     'escalated:' || t.id || ':' || target, t.id,
                     p_is_critical => t.priority = 'critical');
  perform core.publish_event('task.escalated', 'tsk', 'tsk', 'task', t.id,
    pg_catalog.jsonb_build_object('task_id', t.id, 'from_user_id', holder,
                                  'to_user_id', target));
  return target;
end
$$;

-- Late tasks the worker should act on: those nobody has been told about yet, and those whose
-- waiting time has passed once more since the last step of the chain.
create function tsk.tasks_needing_attention(p_wait_hours numeric, p_limit integer default 100)
returns table (task_id uuid, action text)
language sql stable security definer
set search_path = ''
as $$
  select t.id,
         case when n.id is null then 'overdue' else 'escalate' end
    from tsk.task t
    left join tsk.notification n
      on n.task_id = t.id and n.type = 'task.overdue' and n.source_key = 'overdue:' || t.id
    left join lateral (select pg_catalog.max(e.escalated_at) as last_at
                         from tsk.escalation e where e.task_id = t.id) e on true
   where t.status = 'open' and t.due_at is not null and t.due_at < pg_catalog.now()
     and (n.id is null
          or pg_catalog.now() >= coalesce(e.last_at, n.created_at)
                                 + pg_catalog.make_interval(hours => p_wait_hours::integer))
   order by t.due_at
   limit p_limit
$$;

-- What the event backbone is struggling with (EVENT_BACKBONE section 4): dead letters nobody
-- has retried, and how far behind the oldest waiting delivery or job is.
create function tsk.system_health()
returns table (dead_letters integer, behind_seconds integer)
language sql stable security definer
set search_path = ''
as $$
  select (select pg_catalog.count(*)::int from core.dead_letter where resolved_at is null),
         (select coalesce(pg_catalog.max(
                   extract(epoch from pg_catalog.now() - d.available_at))::int, 0)
            from core.outbox_delivery d where d.status = 'pending' and d.available_at < pg_catalog.now())
$$;

revoke all on function tsk.people_with_permission(text), tsk.owner_people(),
  tsk.delegates_of(uuid, uuid), tsk.mark_overdue(uuid),
  tsk.next_escalation_target(tsk.task), tsk.escalate_task(uuid),
  tsk.tasks_needing_attention(numeric, integer), tsk.system_health() from public;
grant execute on function tsk.people_with_permission(text), tsk.owner_people(),
  tsk.delegates_of(uuid, uuid), tsk.mark_overdue(uuid),
  tsk.escalate_task(uuid), tsk.tasks_needing_attention(numeric, integer), tsk.system_health()
  to geoges_worker;
