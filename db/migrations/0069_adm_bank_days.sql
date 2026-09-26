-- 0069 — exchange-rate days are the bank's, not the company's (D-296).
--
-- The Central Bank (TCMB) publishes on weekdays that are not public holidays, whatever the company
-- works. Until now the rate of a day and the daily fetch used the company's working calendar, so a
-- company that works on Saturday (owner 2026-09-26) would look for a Saturday bulletin that never
-- comes: Monday's amounts would wait for ever and the fetch would announce a missing rate every
-- Saturday. A bank day is Monday to Friday and not a full-day company-wide holiday (the public
-- holidays are entered there, REQ-ADM-010); the company's own weekend plays no part.

create function adm.is_bank_day(p_on date) returns boolean
language sql stable
set search_path = ''
as $$
  select extract(isodow from p_on) between 1 and 5
     and not exists (
       select from adm.holiday h
        where h.holiday_on = p_on and h.revoked_at is null and not h.is_half_day
          and h.scope_type = 'company')
$$;

-- The last bank day strictly before a day (searches back at most a month).
create function adm.previous_bank_day(p_on date) returns date
language sql stable
set search_path = ''
as $$
  select d::date from pg_catalog.generate_series(p_on - 1, p_on - 31, interval '-1 day') as d
   where adm.is_bank_day(d::date)
   order by d desc
   limit 1
$$;

-- The rate to use for an amount dated `p_on`: the buying rate of the previous bank day's bulletin,
-- a manual rate for that bulletin day first, the latest written first. No row: no result — the
-- amount waits for its rate, never an older one (ADM-K4).
create or replace function adm.rate_for(p_currency text, p_on date)
returns table (rate_id uuid, buying_rate numeric, source text, bulletin_on date)
language sql stable
set search_path = ''
as $$
  select r.id, r.buying_rate, r.source, r.bulletin_on
    from adm.exchange_rate r
   where r.currency = pg_catalog.upper(p_currency)
     and r.bulletin_on = adm.previous_bank_day(p_on)
   order by (r.source = 'manual') desc, r.created_at desc, r.id desc
   limit 1
$$;

revoke all on function adm.is_bank_day(date), adm.previous_bank_day(date) from public;
grant execute on function adm.is_bank_day(date), adm.previous_bank_day(date)
  to geoges_app, geoges_worker;
