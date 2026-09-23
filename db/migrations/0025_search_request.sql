-- TASK-0110: bind identity and execute the palette in the same network request.
-- The application opens a READ ONLY transaction with a timeout before calling this function.
create function core.search_request(p_user uuid, p_role uuid, p_query text, p_types text[])
returns jsonb language plpgsql volatile security invoker set search_path = '' as $$
begin
  if current_user <> 'geoges_app' or p_user is null then
    raise exception 'Search requires the restricted application identity' using errcode = '42501';
  end if;
  perform set_config('app.user_id', p_user::text, true);
  perform set_config('app.role_id', coalesce(p_role::text, ''), true);
  return core.search_palette(p_query, p_types);
end
$$;
revoke all on function core.search_request(uuid, uuid, text, text[]) from public;
grant execute on function core.search_request(uuid, uuid, text, text[]) to geoges_app;
