-- 0019 — a stale revision says whose request went stale (TASK-0109 step 4, D-265).
--
-- The task and notification subscriber writes to the person who asked for the change. The
-- approval and the refusal already carry them; a request that went stale carried only its id,
-- so nobody could be told. The event now says the same as the other two.

create or replace function aud.mark_revision_stale(p_id uuid, p_note text) returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  request aud.revision_request;
begin
  update aud.revision_request
     set status = 'stale', apply_note = pg_catalog.left(p_note, 500)
   where id = p_id and status = 'approved' and applied_at is null
  returning * into request;
  if request.id is null then
    return;
  end if;
  perform core.publish_event('revision_request.rejected', 'aud', 'aud', 'revision_request', p_id,
    pg_catalog.jsonb_build_object('revision_request_id', p_id, 'stale', true,
      'record_schema', request.record_schema, 'record_table', request.record_table,
      'record_id', request.record_id,
      'requested_by_user_id', request.requested_by_user_id,
      'note', pg_catalog.left(p_note, 200)));
end
$$;
