-- Reverses 0019: `aud.mark_revision_stale` as 0018 wrote it, whose event names only the request.
create or replace function aud.mark_revision_stale(p_id uuid, p_note text) returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  update aud.revision_request
     set status = 'stale', apply_note = pg_catalog.left(p_note, 500)
   where id = p_id and status = 'approved' and applied_at is null;
  perform core.publish_event('revision_request.rejected', 'aud', 'aud', 'revision_request', p_id,
    pg_catalog.jsonb_build_object('revision_request_id', p_id, 'stale', true));
end
$$;
