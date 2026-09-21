-- Reverses 0002_table_layers.sql. Only possible before any later migration registers a table.
drop table core.environment;
drop table core.table_layer;
