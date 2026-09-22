-- 0016 — the panel on the Home Screen (TASK-0113, D-264, REQ-TSK-010, D-252).
--
-- Instant notifications reach a phone only when the panel sits on its Home Screen, so the panel
-- asks for it: once in a window at the first sign-in, and afterwards in a strip on "Bugün" until
-- it is done. What we keep per person is only that: whether the window was shown, and whether the
-- panel was ever opened from the Home Screen. No device is identified; the browser's own name is
-- kept short for support and never shown to anyone else. Nobody sees anybody else's row (owner
-- decision 2026-09-23: no follow-up list for the owner layer).

create table tsk.app_install (
  user_id uuid not null,
  intro_shown_at timestamptz,
  home_screen_at timestamptz,
  last_home_screen_at timestamptz,
  platform text,
  updated_at timestamptz not null default now(),
  constraint pk_app_install primary key (user_id),
  constraint fk_app_install__user foreign key (user_id) references iam.user (id),
  constraint ck_app_install__platform check (platform is null or platform in ('ios', 'android', 'other')),
  constraint ck_app_install__home_screen check ((home_screen_at is null) = (last_home_screen_at is null))
);

comment on table tsk.app_install is
  'Whether a person was shown the install window and ever opened the panel from the Home Screen.';

insert into core.table_layer (schema_name, table_name, layer, history) values
  ('tsk', 'app_install', 'business', 'none');

-- What the signed-in person's screens need: whether the window was already shown, whether the
-- panel has ever been opened from their Home Screen, and whether a phone of theirs gets
-- notifications today.
create function tsk.my_app_state()
returns table (intro_shown boolean, on_home_screen boolean, push_enabled boolean)
language sql stable security definer
set search_path = ''
as $$
  select coalesce(i.intro_shown_at is not null, false),
         coalesce(i.home_screen_at is not null, false),
         exists (select from tsk.push_subscription p
                  where p.user_id = core.current_user_id() and p.status = 'active')
    from (select core.current_user_id() as id) me
    left join tsk.app_install i on i.user_id = me.id
   where me.id is not null
$$;

-- The screen reports what it knows: that the window was shown, or that the panel is running from
-- the Home Screen right now. Both are safe to repeat.
create function tsk.note_app_state(p_intro_shown boolean default false,
                                   p_on_home_screen boolean default false,
                                   p_platform text default null) returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  me uuid := core.current_user_id();
  now_at timestamptz := pg_catalog.now();
begin
  if me is null then
    raise exception 'no signed-in person' using errcode = '42501';
  end if;
  insert into tsk.app_install (user_id, intro_shown_at, home_screen_at, last_home_screen_at,
                               platform)
  values (me, case when p_intro_shown then now_at end,
          case when p_on_home_screen then now_at end,
          case when p_on_home_screen then now_at end,
          case when p_platform in ('ios', 'android', 'other') then p_platform end)
  on conflict (user_id) do update
     set intro_shown_at = coalesce(tsk.app_install.intro_shown_at,
                                   case when p_intro_shown then now_at end),
         home_screen_at = coalesce(tsk.app_install.home_screen_at,
                                   case when p_on_home_screen then now_at end),
         last_home_screen_at = case when p_on_home_screen then now_at
                                    else tsk.app_install.last_home_screen_at end,
         platform = coalesce(case when p_platform in ('ios', 'android', 'other') then p_platform end,
                             tsk.app_install.platform),
         updated_at = now_at;
end
$$;

alter table tsk.app_install enable row level security;
create policy app_install_read on tsk.app_install for select to geoges_app
  using (user_id = (select core.current_user_id()));

revoke all on tsk.app_install from public;
grant select on tsk.app_install to geoges_app;
revoke all on function tsk.my_app_state(), tsk.note_app_state(boolean, boolean, text) from public;
grant execute on function tsk.my_app_state(), tsk.note_app_state(boolean, boolean, text)
  to geoges_app;
