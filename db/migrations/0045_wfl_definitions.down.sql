-- Reverses 0045_wfl_definitions.sql.

delete from core.table_layer where schema_name = 'wfl';
drop schema wfl cascade;
