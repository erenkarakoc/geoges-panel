-- Reverses 0008_calendar_and_rates.sql: calendar, holidays, exchange rates and their functions.
drop function adm.note_rate_attempt(date, text, boolean, timestamptz);
drop function adm.enter_manual_rate(text, date, numeric, text);
drop function adm.record_tcmb_rates(date, jsonb);
drop function adm.rate_for(text, date);
drop function adm.add_business_days(date, integer, uuid, uuid);
drop function adm.previous_business_day(date, uuid, uuid);
drop function adm.is_business_day(date, uuid, uuid);
drop function adm.calendar_on(date, uuid, uuid);
drop table adm.exchange_rate_fetch;
drop table adm.exchange_rate;
drop table adm.holiday;
drop table adm.working_calendar;
drop function adm.guard_exchange_rate();
drop function adm.guard_calendar();
delete from core.table_layer where schema_name = 'adm'
   and table_name in ('working_calendar', 'holiday', 'exchange_rate', 'exchange_rate_fetch');
