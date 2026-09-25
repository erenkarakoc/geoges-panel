-- Reverses 0059_wfl_templates.sql. The copies stay flows — they always were — and lose only the
-- note saying where they came from.
drop function wfl.copies_behind_template();
drop function wfl.reset_to_template(text);
drop function wfl.use_template(text, text, text);

alter table wfl.flow drop constraint ck_flow__template;
alter table wfl.flow drop column source_template_version;
alter table wfl.flow drop column source_template_key;

drop policy template_read on wfl.template;
drop trigger record_history on wfl.template;
drop table wfl.template;
delete from core.table_layer where schema_name = 'wfl' and table_name = 'template';
