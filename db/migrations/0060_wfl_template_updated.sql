-- 0060 — a template that moves on says so, once (TASK-0120, REQ-WFL-027).
--
-- 0059 gave a copy a badge when its template moved ahead of it. The requirement also asks for the
-- person who made the copy to be told — and telling them belongs to the moment the template changes,
-- not to a daily sweep that would repeat the same news every morning. So the table itself announces
-- the change and a subscriber turns that into notifications for the copies that are now behind.
--
-- Only a version bump announces anything. Fixing a template's wording is not news for anybody.

create function wfl.announce_template_version() returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  if new.version > old.version then
    perform core.publish_event('workflow.template_updated', 'wfl', 'wfl', 'template', new.id,
                               pg_catalog.jsonb_build_object('template', new.key,
                                                             'version', new.version,
                                                             'was', old.version));
  end if;
  return new;
end
$$;

create trigger announce_version after update on wfl.template
  for each row execute function wfl.announce_template_version();

comment on function wfl.announce_template_version() is
  'Publishes workflow.template_updated when a template moves to a newer version (REQ-WFL-027).';
