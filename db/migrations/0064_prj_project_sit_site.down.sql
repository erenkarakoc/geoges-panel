-- Reverses 0064_prj_project_sit_site.sql. Nothing points at a project or a site yet (walls arrive
-- in the next migration, the daily log in TASK-0127), so both schemas go with their tables.
drop table sit.site;
drop function sit.may_manage_site(uuid, uuid);
drop function sit.may_see_site(uuid, uuid, uuid, uuid);
drop function sit.publish_site_event();
drop function sit.guard_site_project();
drop table prj.project_stage_change;
drop table prj.project_contract;
drop table prj.project;
drop function prj.may_see_contract_value(uuid);
drop function prj.may_manage_project(uuid);
drop function prj.may_see_project(uuid, uuid);
drop function prj.grant_covers(text[], uuid, uuid);
drop function prj.record_project_stage();
drop function prj.guard_project_stage();
drop schema sit;
drop schema prj;
delete from core.table_layer
 where (schema_name = 'prj' and table_name in ('project', 'project_contract', 'project_stage_change'))
    or (schema_name = 'sit' and table_name = 'site');
