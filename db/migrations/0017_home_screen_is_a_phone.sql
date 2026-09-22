-- 0017 — "on the Home Screen" counts only on a phone (TASK-0113, D-264).
--
-- A page opened inside an embedded browser, or a panel installed on a computer, also answers
-- `display-mode: standalone`. Recording that as "the panel is on their Home Screen" hid the strip
-- for someone whose phone still has nothing, which is exactly the case the strip exists for. The
-- screen now reports the Home Screen only from a phone, and the database ignores the note from
-- anywhere else.

create or replace function tsk.note_app_state(p_intro_shown boolean default false,
                                              p_on_home_screen boolean default false,
                                              p_platform text default null) returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  me uuid := core.current_user_id();
  now_at timestamptz := pg_catalog.now();
  phone text := case when p_platform in ('ios', 'android') then p_platform end;
  home boolean := p_on_home_screen and phone is not null;
begin
  if me is null then
    raise exception 'no signed-in person' using errcode = '42501';
  end if;
  insert into tsk.app_install (user_id, intro_shown_at, home_screen_at, last_home_screen_at,
                               platform)
  values (me, case when p_intro_shown then now_at end,
          case when home then now_at end,
          case when home then now_at end,
          case when p_platform in ('ios', 'android', 'other') then p_platform end)
  on conflict (user_id) do update
     set intro_shown_at = coalesce(tsk.app_install.intro_shown_at,
                                   case when p_intro_shown then now_at end),
         home_screen_at = coalesce(tsk.app_install.home_screen_at, case when home then now_at end),
         last_home_screen_at = case when home then now_at
                                    else tsk.app_install.last_home_screen_at end,
         platform = coalesce(phone, tsk.app_install.platform,
                             case when p_platform = 'other' then 'other' end),
         updated_at = now_at;
end
$$;

-- Every "Home Screen" recorded so far came from that detection (test project only), so they are
-- cleared and the strip comes back for anyone whose phone does not have the panel yet.
update tsk.app_install
   set home_screen_at = null, last_home_screen_at = null, updated_at = now()
 where home_screen_at is not null;
