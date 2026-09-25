-- Reverses 0062_crm_party.sql. Nothing outside CRM points at a firm yet (projects arrive in
-- TASK-0123), so the schema goes with its tables.
drop table crm.party_contact;
drop table crm.party;
drop function crm.publish_party_event();
drop function crm.may_see_party_cards();
drop function crm.may_register_parties();
drop function crm.similar_parties(text, uuid);
drop function crm.name_key(text);
drop function crm.name_words(text);
drop schema crm;
delete from core.table_layer where schema_name = 'crm' and table_name in ('party', 'party_contact');
