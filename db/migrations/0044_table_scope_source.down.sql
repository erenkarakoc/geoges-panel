-- Reverses 0044_table_scope_source.sql.

alter table core.table_layer drop constraint ck_table_layer__scope_source;
alter table core.table_layer drop column scope_source;
