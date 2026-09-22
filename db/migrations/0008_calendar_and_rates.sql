-- 0008 — working calendar and exchange rates (TASK-0106, REQ-ADM-010…015, D-140, D-261,
-- SPIKE-11).
--
-- A calendar row is a dated rule (CONFIGURATION section 3): scoped to the company, a unit or a
-- site, valid from a date, never updated, so a calendar change never rewrites a deadline worked
-- out before it. Exchange rates are append-only: the rate of a day is the previous business
-- day's CBRT (TCMB) buying rate, a manual rate for the same bulletin day comes before it, and a
-- record stores the rate row it used (REQ-ADM-015).

-- ---------------------------------------------------------------------------------------------
-- Calendar
-- ---------------------------------------------------------------------------------------------

create table adm.working_calendar (
  id uuid not null default core.uuid_v7(),
  scope_type text not null default 'company',
  scope_id uuid,
  valid_from date not null,
  office_start time not null,
  office_end time not null,
  field_start time not null,
  field_end time not null,
  -- ISO weekday numbers: 1 Monday … 7 Sunday.
  weekend_days smallint[] not null default '{6,7}',
  overtime_rules jsonb not null default '{}',
  salary_day smallint not null default 1,
  reason text not null,
  created_at timestamptz not null default now(),
  created_by_user_id uuid default core.current_user_id(),
  created_in_role_id uuid default core.current_role_id(),
  constraint pk_working_calendar primary key (id),
  constraint ck_working_calendar__scope check (
    scope_type in ('company', 'unit', 'site') and (scope_type = 'company') = (scope_id is null)),
  constraint ck_working_calendar__hours check (office_start < office_end and field_start < field_end),
  -- pg_catalog's operator by name: an installed intarray extension makes a bare <@ ambiguous.
  constraint ck_working_calendar__weekend
    check (weekend_days operator(pg_catalog.<@) '{1,2,3,4,5,6,7}'::smallint[]),
  constraint ck_working_calendar__salary_day check (salary_day between 1 and 31),
  constraint ck_working_calendar__overtime check (jsonb_typeof(overtime_rules) = 'object'),
  constraint ck_working_calendar__reason check (length(btrim(reason)) > 0)
);
create index ix_working_calendar__lookup on adm.working_calendar
  (scope_type, scope_id, valid_from desc);

comment on table adm.working_calendar is
  'Working hours, weekend, pay day by scope and validity date (REQ-ADM-010/011); never updated.';

create table adm.holiday (
  id uuid not null default core.uuid_v7(),
  scope_type text not null default 'company',
  scope_id uuid,
  holiday_on date not null,
  name text not null,
  is_half_day boolean not null default false,
  revoked_at timestamptz,
  revoked_by_user_id uuid,
  created_at timestamptz not null default now(),
  created_by_user_id uuid default core.current_user_id(),
  created_in_role_id uuid default core.current_role_id(),
  updated_at timestamptz not null default now(),
  updated_by_user_id uuid,
  constraint pk_holiday primary key (id),
  constraint ck_holiday__scope check (
    scope_type in ('company', 'unit', 'site') and (scope_type = 'company') = (scope_id is null)),
  constraint ck_holiday__name check (length(btrim(name)) > 0)
);
create unique index uq_holiday__active on adm.holiday
  (scope_type, coalesce(scope_id, '00000000-0000-0000-0000-000000000000'::uuid), holiday_on)
  where revoked_at is null;
create index ix_holiday__holiday_on on adm.holiday (holiday_on) where revoked_at is null;

comment on table adm.holiday is
  'Public and local holidays, entered year by year (REQ-ADM-010); a half day (eve) is a business day.';

-- ---------------------------------------------------------------------------------------------
-- Exchange rates
-- ---------------------------------------------------------------------------------------------

create table adm.exchange_rate (
  id uuid not null default core.uuid_v7(),
  currency text not null,
  bulletin_on date not null,
  buying_rate numeric(18, 6) not null,
  source text not null,
  reason text,
  entered_by_user_id uuid default core.current_user_id(),
  created_at timestamptz not null default now(),
  constraint pk_exchange_rate primary key (id),
  constraint ck_exchange_rate__currency check (currency ~ '^[A-Z]{3}$' and currency <> 'TRY'),
  constraint ck_exchange_rate__rate check (buying_rate > 0),
  constraint ck_exchange_rate__source check (source in ('tcmb', 'manual')),
  constraint ck_exchange_rate__manual_reason check (
    source = 'tcmb' or (reason is not null and length(btrim(reason)) > 0))
);
create unique index uq_exchange_rate__tcmb on adm.exchange_rate (currency, bulletin_on)
  where source = 'tcmb';
create index ix_exchange_rate__lookup on adm.exchange_rate (currency, bulletin_on, created_at desc);

comment on table adm.exchange_rate is
  'CBRT buying rate per unit of currency and bulletin day (D-140); manual rows carry a reason.';

-- One row per bulletin day the worker tried to fetch (SPIKE-11): attempts, and whether the
-- missing event was published, so it is published once.
create table adm.exchange_rate_fetch (
  bulletin_on date not null,
  attempts integer not null default 0,
  last_attempt_at timestamptz,
  last_outcome text,
  received_at timestamptz,
  missing_published_at timestamptz,
  constraint pk_exchange_rate_fetch primary key (bulletin_on),
  constraint ck_exchange_rate_fetch__outcome
    check (last_outcome is null or last_outcome in ('received', 'not_published', 'wrong_day', 'failed'))
);

insert into core.table_layer (schema_name, table_name, layer, portable, history) values
  ('adm', 'working_calendar', 'config', true, 'tracked'),
  ('adm', 'holiday', 'config', true, 'tracked'),
  ('adm', 'exchange_rate', 'business', false, 'append_only'),
  ('adm', 'exchange_rate_fetch', 'business', false, 'none');

-- ---------------------------------------------------------------------------------------------
-- Guards
-- ---------------------------------------------------------------------------------------------

-- A calendar row is written once; a change is a new row (REQ-ADM-012).
create function adm.guard_calendar() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'a calendar row is never changed; add a new validity row instead'
    using errcode = 'P0001', hint = 'adm.calendar_immutable';
end
$$;

create trigger calendar_guard before update or delete on adm.working_calendar
  for each row execute function adm.guard_calendar();

-- An exchange rate row is never changed or deleted; a correction is a manual row.
create function adm.guard_exchange_rate() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' and tg_table_name = 'exchange_rate'
     and pg_catalog.current_setting('aud.reset_purge', true) = 'on'
     and session_user::text <> 'geoges_app' then
    return old;
  end if;
  raise exception 'an exchange rate row is never changed; enter a manual rate instead'
    using errcode = 'P0001', hint = 'adm.exchange_rate_immutable';
end
$$;

create trigger append_only_guard before update or delete on adm.exchange_rate
  for each row execute function adm.guard_exchange_rate();

create trigger holiday_stamp before update on adm.holiday
  for each row execute function iam.stamp_update();
create trigger record_history after insert on adm.working_calendar
  for each row execute function aud.capture_history();
create trigger record_history after insert or update on adm.holiday
  for each row execute function aud.capture_history();

-- ---------------------------------------------------------------------------------------------
-- Business days (REQ-ADM-010…012)
-- ---------------------------------------------------------------------------------------------

-- The calendar row in force on a day for a place: site, then unit, then company; the latest
-- validity start not after the day, the last written among equal starts.
create function adm.calendar_on(p_on date, p_site_id uuid default null, p_unit_id uuid default null)
returns adm.working_calendar
language sql stable
set search_path = ''
as $$
  select c.* from adm.working_calendar c
   where c.valid_from <= p_on
     and ((c.scope_type = 'site' and c.scope_id = p_site_id)
          or (c.scope_type = 'unit' and c.scope_id = p_unit_id)
          or c.scope_type = 'company')
   order by case c.scope_type when 'site' then 1 when 'unit' then 2 else 3 end,
            c.valid_from desc, c.created_at desc, c.id desc
   limit 1
$$;

-- A business day: not a weekend day of the calendar in force and not a full-day holiday of the
-- company or of the place. A half-day eve is a business day. No calendar at all: every day from
-- Monday to Friday is, so a missing calendar never stops deadlines.
create function adm.is_business_day(p_on date, p_site_id uuid default null,
                                    p_unit_id uuid default null) returns boolean
language sql stable
set search_path = ''
as $$
  select not (extract(isodow from p_on)::smallint =
              any (coalesce((adm.calendar_on(p_on, p_site_id, p_unit_id)).weekend_days,
                            '{6,7}'::smallint[])))
     and not exists (
       select from adm.holiday h
        where h.holiday_on = p_on and h.revoked_at is null and not h.is_half_day
          and (h.scope_type = 'company'
               or (h.scope_type = 'site' and h.scope_id = p_site_id)
               or (h.scope_type = 'unit' and h.scope_id = p_unit_id)))
$$;

-- The last business day strictly before a day (searches back at most a year).
create function adm.previous_business_day(p_on date, p_site_id uuid default null,
                                          p_unit_id uuid default null) returns date
language sql stable
set search_path = ''
as $$
  select d::date from pg_catalog.generate_series(p_on - 1, p_on - 366, interval '-1 day') as d
   where adm.is_business_day(d::date, p_site_id, p_unit_id)
   order by d desc
   limit 1
$$;

-- The day n business days after (n > 0) or before (n < 0) a day; n = 0 is the day itself.
create function adm.add_business_days(p_on date, p_days integer, p_site_id uuid default null,
                                      p_unit_id uuid default null) returns date
language plpgsql stable
set search_path = ''
as $$
declare
  d date := p_on;
  left_days integer := abs(p_days);
  step integer := case when p_days < 0 then -1 else 1 end;
begin
  while left_days > 0 loop
    d := d + step;
    if adm.is_business_day(d, p_site_id, p_unit_id) then
      left_days := left_days - 1;
    end if;
  end loop;
  return d;
end
$$;

-- ---------------------------------------------------------------------------------------------
-- Exchange rates (D-140, REQ-ADM-013…015)
-- ---------------------------------------------------------------------------------------------

-- The rate to use for an amount dated `p_on`: the buying rate of the previous business day's
-- bulletin (company calendar), a manual rate for that bulletin day first, the latest written
-- first. No row: no result — the amount waits for its rate, never an older one (ADM-K4).
create function adm.rate_for(p_currency text, p_on date)
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

-- Writes one day's TCMB bulletin (the worker, after checking the bulletin's own date) and
-- publishes `exchange_rate.received` once. `p_rates` is [{currency, rate}], rate per one unit.
create function adm.record_tcmb_rates(p_bulletin_on date, p_rates jsonb) returns integer
language plpgsql security definer
set search_path = ''
as $$
declare
  added integer;
begin
  insert into adm.exchange_rate (currency, bulletin_on, buying_rate, source)
  select r ->> 'currency', p_bulletin_on, (r ->> 'rate')::numeric, 'tcmb'
    from pg_catalog.jsonb_array_elements(p_rates) as r
  on conflict (currency, bulletin_on) where source = 'tcmb' do nothing;
  get diagnostics added = row_count;
  insert into adm.exchange_rate_fetch (bulletin_on, received_at, last_outcome)
  values (p_bulletin_on, pg_catalog.now(), 'received')
  on conflict (bulletin_on) do update
    set received_at = coalesce(adm.exchange_rate_fetch.received_at, excluded.received_at),
        last_outcome = 'received';
  if added > 0 then
    perform core.publish_event('exchange_rate.received', 'adm', null, null, null,
      pg_catalog.jsonb_build_object('bulletin_on', p_bulletin_on, 'source', 'tcmb',
                                    'currencies', added),
      1, 'adm:exchange_rate:' || p_bulletin_on);
  end if;
  return added;
end
$$;

-- Records one fetch attempt for a bulletin day. On the final attempt of a day whose bulletin never
-- came, publishes `exchange_rate.missing` — once (SPIKE-11: one missing event per day).
create function adm.note_rate_attempt(p_bulletin_on date, p_outcome text, p_final boolean,
                                      p_at timestamptz default now())
returns table (attempts integer, missing_published boolean)
language plpgsql security definer
set search_path = ''
as $$
declare
  f adm.exchange_rate_fetch;
begin
  insert into adm.exchange_rate_fetch (bulletin_on, attempts, last_attempt_at, last_outcome)
  values (p_bulletin_on, 1, p_at, p_outcome)
  on conflict (bulletin_on) do update
    set attempts = adm.exchange_rate_fetch.attempts + 1, last_attempt_at = p_at,
        last_outcome = excluded.last_outcome
  returning * into f;
  if p_final and f.received_at is null and f.missing_published_at is null then
    update adm.exchange_rate_fetch set missing_published_at = p_at
     where bulletin_on = p_bulletin_on;
    perform core.publish_event('exchange_rate.missing', 'adm', null, null, null,
      pg_catalog.jsonb_build_object('bulletin_on', p_bulletin_on, 'attempts', f.attempts),
      1, 'adm:exchange_rate:' || p_bulletin_on);
    return query select f.attempts, true;
    return;
  end if;
  return query select f.attempts, f.missing_published_at is not null;
end
$$;

-- A manual rate (REQ-ADM-014): needs adm.module.manage and a reason; shown apart from TCMB's.
create function adm.enter_manual_rate(p_currency text, p_bulletin_on date, p_rate numeric,
                                      p_reason text) returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  new_id uuid;
begin
  if not iam.has_permission('adm.module.manage') then
    raise exception 'entering a rate needs adm.module.manage' using errcode = '42501';
  end if;
  if coalesce(pg_catalog.btrim(p_reason), '') = '' then
    raise exception 'a manual rate needs a reason' using errcode = 'P0001',
      hint = 'adm.reason_required';
  end if;
  insert into adm.exchange_rate (currency, bulletin_on, buying_rate, source, reason)
  values (pg_catalog.upper(p_currency), p_bulletin_on, p_rate, 'manual', p_reason)
  returning id into new_id;
  perform aud.record_event('exchange_rate.entered', 'adm', 'exchange_rate', new_id,
    pg_catalog.jsonb_build_object('currency', pg_catalog.upper(p_currency),
                                  'bulletin_on', p_bulletin_on));
  perform core.publish_event('exchange_rate.received', 'adm', 'adm', 'exchange_rate', new_id,
    pg_catalog.jsonb_build_object('bulletin_on', p_bulletin_on, 'source', 'manual',
                                  'currency', pg_catalog.upper(p_currency)),
    1, 'adm:exchange_rate:' || p_bulletin_on);
  return new_id;
end
$$;

-- ---------------------------------------------------------------------------------------------
-- Policies and privileges
-- ---------------------------------------------------------------------------------------------

alter table adm.working_calendar enable row level security;
alter table adm.holiday enable row level security;
alter table adm.exchange_rate enable row level security;
alter table adm.exchange_rate_fetch enable row level security;

create policy working_calendar_read on adm.working_calendar for select to geoges_app
  using ((select core.current_user_id()) is not null);
create policy working_calendar_add on adm.working_calendar for insert to geoges_app
  with check ((select iam.has_permission('adm.module.manage')));

create policy holiday_read on adm.holiday for select to geoges_app
  using ((select core.current_user_id()) is not null);
create policy holiday_add on adm.holiday for insert to geoges_app
  with check ((select iam.has_permission('adm.module.manage')));
create policy holiday_change on adm.holiday for update to geoges_app
  using ((select iam.has_permission('adm.module.manage')))
  with check ((select iam.has_permission('adm.module.manage')));

create policy exchange_rate_read on adm.exchange_rate for select to geoges_app
  using ((select core.current_user_id()) is not null);

create policy exchange_rate_fetch_read on adm.exchange_rate_fetch for select to geoges_app
  using ((select core.current_user_id()) is not null);

revoke all on adm.working_calendar, adm.holiday, adm.exchange_rate, adm.exchange_rate_fetch
  from public;
grant select, insert on adm.working_calendar to geoges_app;
grant select, insert, update on adm.holiday to geoges_app;
grant select on adm.exchange_rate, adm.exchange_rate_fetch to geoges_app;

revoke all on function adm.calendar_on(date, uuid, uuid), adm.is_business_day(date, uuid, uuid),
  adm.previous_business_day(date, uuid, uuid), adm.add_business_days(date, integer, uuid, uuid),
  adm.rate_for(text, date), adm.record_tcmb_rates(date, jsonb),
  adm.enter_manual_rate(text, date, numeric, text), adm.guard_calendar(),
  adm.guard_exchange_rate() from public;
grant execute on function adm.calendar_on(date, uuid, uuid), adm.is_business_day(date, uuid, uuid),
  adm.previous_business_day(date, uuid, uuid), adm.add_business_days(date, integer, uuid, uuid),
  adm.rate_for(text, date), adm.enter_manual_rate(text, date, numeric, text)
  to geoges_app, geoges_worker;
revoke all on function adm.note_rate_attempt(date, text, boolean, timestamptz) from public;
grant execute on function adm.record_tcmb_rates(date, jsonb),
  adm.note_rate_attempt(date, text, boolean, timestamptz)
  to geoges_worker;
