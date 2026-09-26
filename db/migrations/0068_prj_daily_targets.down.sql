-- Reverses 0068_prj_daily_targets.sql. Corrections go with it; the site's chosen end with them.
drop trigger guard_correction on prj.daily_target_correction;
drop function prj.guard_daily_target_correction();
drop function prj.daily_targets(uuid, date);
drop function prj.daily_target_frame(uuid, date);
drop table prj.daily_target_correction;
delete from core.table_layer
 where schema_name = 'prj' and table_name = 'daily_target_correction';
alter table sit.site drop constraint ck_site__target_end_basis;
alter table sit.site drop column target_end_basis;
