-- Reverses 0061_adm_production_definitions.sql. The definitions go with their tables; nothing else
-- points at them yet (the daily log arrives in TASK-0127).
drop function adm.panel_neighbours(uuid);
drop function adm.recipe_lines(text, uuid, uuid, uuid, date);
drop table adm.consumption_recipe;
drop function adm.guard_recipe_append_only();
drop table adm.strip_type;
drop table adm.panel_type;
drop function adm.guard_strip_type_identity();
drop function adm.guard_panel_type_identity();
delete from core.table_layer
 where schema_name = 'adm' and table_name in ('panel_type', 'strip_type', 'consumption_recipe');
