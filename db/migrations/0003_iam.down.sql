-- Reverses 0003_iam.sql: the iam schema with its tables, functions and policies, their layer
-- registrations and the portable column. Accounts in iam.user are lost with it; the Supabase
-- Auth accounts stay, and `npm run iam:bootstrap-owner` links the owner again after re-applying.
drop schema iam cascade;
delete from core.table_layer where schema_name = 'iam';
alter table core.table_layer drop column portable;
