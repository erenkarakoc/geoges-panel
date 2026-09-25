-- Reverses 0065_prj_revisions_walls_targets.sql. Nothing outside PRJ points at a wall or a
-- revision yet (the daily log arrives in TASK-0127).
drop function prj.panel_targets(uuid, date, uuid);
drop function prj.revision_on(uuid, date);
drop trigger publish_event on prj.project_revision;
drop function prj.publish_revision_event();
drop function prj.revision_diff(uuid, uuid);
drop function prj.start_revision(uuid, text);
drop table prj.wall_target;
drop table prj.revision_wall;
drop function prj.guard_revision_content();
drop table prj.wall;
drop function prj.publish_wall_event();
drop table prj.project_revision;
drop function prj.guard_revision_status();
delete from core.table_layer
 where schema_name = 'prj'
   and table_name in ('project_revision', 'wall', 'revision_wall', 'wall_target');
