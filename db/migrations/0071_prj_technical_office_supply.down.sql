-- Reverses 0071_prj_technical_office_supply.sql. Nothing outside PRJ points at these rows yet.
drop function prj.supply_matrix_on(uuid, date);
drop trigger guard_dates on prj.supply_responsibility;
drop function prj.guard_supply_responsibility();
drop table prj.supply_responsibility;
drop function prj.authority_approvals(uuid);
drop function prj.announce_overdue_technical_items();
drop table prj.technical_office_item;
drop function prj.stamp_technical_office_item();
delete from core.table_layer
 where schema_name = 'prj' and table_name in ('technical_office_item', 'supply_responsibility');
