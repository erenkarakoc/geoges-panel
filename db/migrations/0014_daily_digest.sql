-- 0014 — the daily digest (TASK-0108 step 4, REQ-TSK-013, D-133, D-263).
--
-- Every morning each person gets one summary of their own work; owners also get the company's.
-- A person with nothing to do gets none. One row per person and day says what was summed up and
-- when it went out, so a restarted worker never sends the same morning twice.

create table tsk.daily_digest (
  id uuid not null default core.uuid_v7(),
  user_id uuid not null,
  for_date date not null,
  payload jsonb not null default '{}',
  is_empty boolean not null default false,
  sent_at timestamptz,
  email_sent_at timestamptz,
  created_at timestamptz not null default now(),
  constraint pk_daily_digest primary key (id),
  constraint uq_daily_digest__user_id_for_date unique (user_id, for_date),
  constraint fk_daily_digest__user foreign key (user_id) references iam.user (id),
  constraint ck_daily_digest__payload check (jsonb_typeof(payload) = 'object')
);

comment on table tsk.daily_digest is
  'One morning summary per person and day (REQ-TSK-013); an empty one is recorded, not sent.';

insert into core.table_layer (schema_name, table_name, layer, history) values
  ('tsk', 'daily_digest', 'business', 'none');

-- What one person's morning looks like: their own work, and for the owner layer the company's
-- yesterday as well. Counts only; the words are built by the panel from this (REQ-TSK-011).
create function tsk.digest_for(p_user uuid, p_for_date date) returns jsonb
language sql stable security definer
set search_path = ''
as $$
  with mine as (
    select t.*
      from tsk.task t
     where t.status in ('open', 'reported_done')
       and (t.assignee_user_id = p_user or t.given_by_user_id = p_user)
  ),
  counts as (
    select
      pg_catalog.count(*) filter (
        where assignee_user_id = p_user and status = 'open'
          and due_at is not null and due_at < pg_catalog.now())::int as overdue,
      pg_catalog.count(*) filter (
        where assignee_user_id = p_user and status = 'open'
          and due_at is not null
          and (due_at at time zone 'Europe/Istanbul')::date = p_for_date)::int as due_today,
      pg_catalog.count(*) filter (
        where assignee_user_id = p_user and status = 'open')::int as open_tasks,
      pg_catalog.count(*) filter (
        where given_by_user_id = p_user and status = 'reported_done')::int as waiting_my_approval
    from mine
  ),
  unread as (
    select pg_catalog.count(*)::int as unread
      from tsk.notification n where n.user_id = p_user and n.read_at is null
  ),
  company as (
    select pg_catalog.jsonb_build_object(
             'opened', pg_catalog.count(*) filter (
               where (created_at at time zone 'Europe/Istanbul')::date = p_for_date - 1),
             'closed', pg_catalog.count(*) filter (
               where status = 'closed'
                 and (closed_at at time zone 'Europe/Istanbul')::date = p_for_date - 1),
             'overdue', pg_catalog.count(*) filter (
               where status = 'open' and due_at is not null and due_at < pg_catalog.now()),
             'system_problems', pg_catalog.count(*) filter (
               where status = 'open' and problem_key is not null)) as summary
      from tsk.task
  )
  select pg_catalog.jsonb_build_object(
           'overdue', c.overdue, 'due_today', c.due_today, 'open_tasks', c.open_tasks,
           'waiting_my_approval', c.waiting_my_approval, 'unread', u.unread)
         || case when p_user in (select iam.owner_users())
                 then pg_catalog.jsonb_build_object('company', (select summary from company))
                 else '{}'::jsonb end
    from counts c, unread u
$$;

-- People who may get a digest tomorrow morning: active accounts with no row for that day yet.
create function tsk.people_without_digest(p_for_date date, p_limit integer default 200)
returns setof record
language sql stable security definer
set search_path = ''
as $$
  select u.id, u.email, u.display_name
    from iam.user u
   where u.status = 'active'
     and not exists (select from tsk.daily_digest d
                      where d.user_id = u.id and d.for_date = p_for_date)
   order by u.id
   limit p_limit
$$;

-- Records what one person's morning held; `is_empty` means nothing was sent (REQ-TSK-013).
create function tsk.record_digest(p_user uuid, p_for_date date, p_payload jsonb,
                                  p_is_empty boolean, p_email_sent boolean default false)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  new_id uuid;
begin
  insert into tsk.daily_digest (user_id, for_date, payload, is_empty, sent_at, email_sent_at)
  values (p_user, p_for_date, p_payload, p_is_empty,
          case when p_is_empty then null else pg_catalog.now() end,
          case when p_email_sent then pg_catalog.now() else null end)
  on conflict (user_id, for_date) do nothing
  returning id into new_id;
  return new_id;
end
$$;

alter table tsk.daily_digest enable row level security;

create policy daily_digest_own on tsk.daily_digest for select to geoges_app
  using (user_id = (select core.current_user_id()));

revoke all on tsk.daily_digest from public;
grant select on tsk.daily_digest to geoges_app;
grant select on tsk.daily_digest to geoges_worker;

revoke all on function tsk.digest_for(uuid, date), tsk.people_without_digest(date, integer),
  tsk.record_digest(uuid, date, jsonb, boolean, boolean) from public;
grant execute on function tsk.digest_for(uuid, date) to geoges_app, geoges_worker;
grant execute on function tsk.people_without_digest(date, integer),
  tsk.record_digest(uuid, date, jsonb, boolean, boolean) to geoges_worker;
