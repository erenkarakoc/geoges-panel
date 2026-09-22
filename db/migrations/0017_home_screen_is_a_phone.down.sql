-- Reverses 0017_home_screen_is_a_phone.sql: the note function as 0016 wrote it. The rows it
-- cleared are not written back; a phone reports its Home Screen again on the next visit.

-- The screen reports what it knows: that the window was shown, or that the panel is running from
-- the Home Screen right now. Both are safe to repeat.
create or replace function tsk.note_app_state(p_intro_shown boolean default false,
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
