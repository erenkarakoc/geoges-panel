-- 0013 — phone notifications (TASK-0108 step 3, REQ-TSK-010, D-132, D-252).
--
-- A browser that was given permission hands the panel a push address of its own (endpoint and
-- two keys). It belongs to one person and one browser; nobody else may read it. A subscription
-- is never deleted by the panel: a browser that has gone (the push service answers "gone")
-- becomes `expired`, so we can still see that the person once allowed notifications.

create table tsk.push_subscription (
  id uuid not null default core.uuid_v7(),
  user_id uuid not null,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  user_agent text,
  status text not null default 'active',
  last_sent_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pk_push_subscription primary key (id),
  constraint uq_push_subscription__endpoint unique (endpoint),
  constraint fk_push_subscription__user foreign key (user_id) references iam.user (id),
  constraint ck_push_subscription__status check (status in ('active', 'expired')),
  constraint ck_push_subscription__endpoint check (endpoint ~ '^https://' and length(endpoint) <= 2000)
);
create index ix_push_subscription__user_id on tsk.push_subscription (user_id)
  where status = 'active';

comment on table tsk.push_subscription is
  'One browser a person allowed to show notifications (REQ-TSK-010); keys are never shown back.';

insert into core.table_layer (schema_name, table_name, layer, history) values
  ('tsk', 'push_subscription', 'business', 'none');

-- Remembers the browser the signed-in person just allowed. The same browser asking again (a new
-- key after a reset) updates its row instead of adding one.
create function tsk.save_push_subscription(p_endpoint text, p_p256dh text, p_auth text,
                                           p_user_agent text default null)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  saved_id uuid;
begin
  if core.current_user_id() is null then
    raise exception 'no signed-in person' using errcode = '42501';
  end if;
  insert into tsk.push_subscription (user_id, endpoint, p256dh, auth, user_agent)
  values (core.current_user_id(), p_endpoint, p_p256dh, p_auth,
          pg_catalog.left(p_user_agent, 200))
  on conflict (endpoint) do update
     set user_id = core.current_user_id(), p256dh = excluded.p256dh, auth = excluded.auth,
         user_agent = excluded.user_agent, status = 'active', last_error = null,
         updated_at = pg_catalog.now()
  returning id into saved_id;
  return saved_id;
end
$$;

-- The person's own browser stops showing notifications: the row is kept, marked expired.
create function tsk.expire_push_subscription(p_endpoint text) returns boolean
language plpgsql security definer
set search_path = ''
as $$
declare
  changed integer;
begin
  update tsk.push_subscription
     set status = 'expired', updated_at = pg_catalog.now()
   where endpoint = p_endpoint and user_id = core.current_user_id();
  get diagnostics changed = row_count;
  return changed > 0;
end
$$;

alter table tsk.push_subscription enable row level security;

-- A person sees only their own browsers; the keys are read by the worker, never sent back.
create policy push_subscription_own on tsk.push_subscription for select to geoges_app
  using (user_id = (select core.current_user_id()));

revoke all on tsk.push_subscription from public;
grant select on tsk.push_subscription to geoges_app;
grant select, update on tsk.push_subscription to geoges_worker;

revoke all on function tsk.save_push_subscription(text, text, text, text),
  tsk.expire_push_subscription(text) from public;
grant execute on function tsk.save_push_subscription(text, text, text, text),
  tsk.expire_push_subscription(text) to geoges_app;
