-- Reverses 0069_adm_bank_days.sql: the rate of a day follows the company calendar again.
create or replace function adm.rate_for(p_currency text, p_on date)
returns table (rate_id uuid, buying_rate numeric, source text, bulletin_on date)
language sql stable
set search_path = ''
as $$
  select r.id, r.buying_rate, r.source, r.bulletin_on
    from adm.exchange_rate r
   where r.currency = pg_catalog.upper(p_currency)
     and r.bulletin_on = adm.previous_business_day(p_on)
   order by (r.source = 'manual') desc, r.created_at desc, r.id desc
   limit 1
$$;
drop function adm.previous_bank_day(date);
drop function adm.is_bank_day(date);
