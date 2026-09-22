-- 0020 — site-wide search (TASK-0110, REQ-NFR-012, ADR-017, D-044, D-227, D-247, D-266).
--
-- One search row per record, carrying what the panel shows in a result and the scope that
-- decides who may see it. The text is built by the module that owns the record, from fields the
-- reader may see: commercial and sensitive fields never enter it, and document content is the
-- archive's own search (D-227).
--
-- Three derived helpers make the search fast without giving anything away (D-247): which words a
-- record holds, how many records a word appears in, and the sorted internal ids of those
-- records. All four carry the same scope columns, so row level security hides an unauthorised
-- record from the results, from the counts and from the vocabulary alike.

create table core.search_row (
  id uuid not null default core.uuid_v7(),
  -- A small, dense number used only inside the helpers; the record's identity stays its UUID.
  search_document_id integer generated always as identity,
  record_schema text not null,
  record_table text not null,
  record_id uuid not null,
  record_type text not null,
  title text not null,
  secondary text,
  -- Folded words of the record, space separated, built by the owning module's projection.
  search_text text not null,
  link_path text not null,
  site_id uuid,
  project_id uuid,
  record_owner_user_id uuid,
  data_class text not null default 'internal',
  -- Which projection wrote this row, and which event it came from: an older or repeated event
  -- never overwrites a newer index (D-247, SPIKE-14).
  projection_version integer not null default 1,
  source_event_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint pk_search_row primary key (id),
  constraint uq_search_row__record unique (record_schema, record_table, record_id),
  constraint uq_search_row__search_document_id unique (search_document_id),
  constraint ck_search_row__record check (
    record_schema ~ '^[a-z]{2,3}$' and record_table ~ '^[a-z][a-z0-9_]*$'),
  constraint ck_search_row__type check (record_type ~ '^[a-z][a-z0-9_.]*$'),
  constraint ck_search_row__title check (length(btrim(title)) > 0),
  constraint ck_search_row__link check (link_path ~ '^/[A-Za-z0-9]'),
  constraint ck_search_row__data_class
    check (data_class in ('general', 'internal', 'commercial', 'sensitive'))
);
create index ix_search_row__type on core.search_row (record_type);
create index ix_search_row__site on core.search_row (site_id) where site_id is not null;
create index ix_search_row__project on core.search_row (project_id) where project_id is not null;
-- Spelling closeness on the whole text, for a query word nobody has written before.
create index ix_search_row__text_trgm on core.search_row
  using gin (search_text extensions.gin_trgm_ops);

comment on table core.search_row is
  'What a record looks like in search, with the scope that decides who may see it (ADR-017).';

create table core.search_posting (
  search_row_id uuid not null,
  word text not null,
  record_type text not null,
  site_id uuid,
  project_id uuid,
  record_owner_user_id uuid,
  data_class text not null default 'internal',
  constraint pk_search_posting primary key (search_row_id, word),
  constraint fk_search_posting__search_row foreign key (search_row_id)
    references core.search_row (id) on delete cascade,
  constraint ck_search_posting__word check (word ~ '^[a-z0-9]+$')
);
create index ix_search_posting__word on core.search_posting (word, record_type);

comment on table core.search_posting is
  'Which words a search row holds; one row per word, carrying the same scope (D-247).';

create table core.search_word (
  word text not null,
  record_type text not null,
  record_count integer not null default 0,
  constraint pk_search_word primary key (word, record_type),
  constraint ck_search_word__count check (record_count >= 0)
);
create index ix_search_word__word_trgm on core.search_word
  using gin (word extensions.gin_trgm_ops);

comment on table core.search_word is
  'How many records hold a word, per record type; read only through a scoped function (D-247).';

insert into core.table_layer (schema_name, table_name, layer, history) values
  ('core', 'search_row', 'system', 'none'),
  ('core', 'search_posting', 'system', 'none'),
  ('core', 'search_word', 'system', 'none');

-- ---------------------------------------------------------------------------------------------
-- Words and visibility
-- ---------------------------------------------------------------------------------------------

-- The words of a text: folded, split on anything that is not a letter or a digit, and short
-- noise dropped. The same function runs over the record's text and over the query, so "sogut"
-- and "Söğüt" end up as the same word (ADR-017).
create function core.search_words(p_text text) returns setof text
language sql immutable parallel safe
set search_path = ''
as $$
  select distinct w
    from pg_catalog.regexp_split_to_table(core.fold_tr(coalesce(p_text, '')), '[^a-z0-9]+') as w
   where length(w) >= 2
$$;

-- Whether the signed-in person may see a record with this module, scope, owner and data class.
-- The same rule as record history and documents (DOC-K2), so search shows nothing extra.
create function core.can_see_record(p_module text, p_site_id uuid, p_project_id uuid,
                                    p_owner uuid, p_data_class text) returns boolean
language sql stable security definer
set search_path = ''
as $$
  with place as (
    select case when p_site_id is not null then 'site'
                when p_project_id is not null then 'project' else 'company' end as q_type,
           coalesce(p_site_id, p_project_id) as q_id
  )
  select exists (
      select from iam.my_grants() g, place p
       where (g.permission_code = p_module || '.module.view'
              or (g.permission_code = p_module || '.module.own'
                  and p_owner = core.current_user_id()))
         and iam.covers(g.scope_type, g.scope_ids, p.q_type, p.q_id))
     and (p_data_class in ('general', 'internal')
          or (select iam.can_see(p_module, p_data_class, p.q_type, p.q_id) from place p))
$$;

-- ---------------------------------------------------------------------------------------------
-- Writing the index (the worker only)
-- ---------------------------------------------------------------------------------------------

-- Writes or replaces one record's search row and its words in one go. An event older than the
-- row that is already there changes nothing, so a repeated or late delivery cannot undo a newer
-- index (D-247).
create function core.index_search_row(p_schema text, p_table text, p_record_id uuid,
                                      p_record_type text, p_title text, p_secondary text,
                                      p_search_text text, p_link_path text,
                                      p_site_id uuid default null,
                                      p_project_id uuid default null,
                                      p_owner_user_id uuid default null,
                                      p_data_class text default 'internal',
                                      p_source_event_at timestamptz default null,
                                      p_projection_version integer default 1) returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  row_id uuid;
  existing core.search_row;
begin
  select * into existing from core.search_row
   where record_schema = p_schema and record_table = p_table and record_id = p_record_id
     for update;
  if existing.id is not null
     and p_source_event_at is not null and existing.source_event_at is not null
     and p_source_event_at < existing.source_event_at then
    return existing.id;
  end if;

  insert into core.search_row (record_schema, record_table, record_id, record_type, title,
                               secondary, search_text, link_path, site_id, project_id,
                               record_owner_user_id, data_class, projection_version,
                               source_event_at)
  values (p_schema, p_table, p_record_id, p_record_type, p_title, p_secondary,
          core.fold_tr(coalesce(p_search_text, '')), p_link_path, p_site_id, p_project_id,
          p_owner_user_id, coalesce(p_data_class, 'internal'), coalesce(p_projection_version, 1),
          p_source_event_at)
  on conflict (record_schema, record_table, record_id) do update
     set record_type = excluded.record_type, title = excluded.title,
         secondary = excluded.secondary, search_text = excluded.search_text,
         link_path = excluded.link_path, site_id = excluded.site_id,
         project_id = excluded.project_id,
         record_owner_user_id = excluded.record_owner_user_id,
         data_class = excluded.data_class, projection_version = excluded.projection_version,
         source_event_at = excluded.source_event_at, updated_at = pg_catalog.now()
  returning id into row_id;

  -- The words of the row, rewritten as a set: what went is taken out of the vocabulary count,
  -- what came is added, so `search_word` always says how many records hold a word.
  with wanted as (select w from core.search_words(p_search_text) as w),
  gone as (
    delete from core.search_posting p
     where p.search_row_id = row_id and p.word not in (select w from wanted)
    returning p.word
  ),
  added as (
    insert into core.search_posting (search_row_id, word, record_type, site_id, project_id,
                                     record_owner_user_id, data_class)
    select row_id, w, p_record_type, p_site_id, p_project_id, p_owner_user_id,
           coalesce(p_data_class, 'internal')
      from wanted
    on conflict (search_row_id, word) do update
       set record_type = excluded.record_type, site_id = excluded.site_id,
           project_id = excluded.project_id,
           record_owner_user_id = excluded.record_owner_user_id,
           data_class = excluded.data_class
    returning core.search_posting.word, (xmax = 0) as is_new
  ),
  counted as (
    select word, 1 as delta from added where is_new
    union all
    select word, -1 from gone
  )
  insert into core.search_word (word, record_type, record_count)
  select word, p_record_type, sum(delta)::int from counted group by word
  on conflict (word, record_type) do update
     set record_count = greatest(0, core.search_word.record_count + excluded.record_count);

  delete from core.search_word w
   where w.record_count = 0 and w.record_type = p_record_type
     and not exists (select from core.search_posting p
                      where p.word = w.word and p.record_type = w.record_type);
  return row_id;
end
$$;

-- A record that went away leaves search with it; its words leave the vocabulary count too.
create function core.remove_search_row(p_schema text, p_table text, p_record_id uuid)
returns boolean
language plpgsql security definer
set search_path = ''
as $$
declare
  removed core.search_row;
begin
  select * into removed from core.search_row
   where record_schema = p_schema and record_table = p_table and record_id = p_record_id
     for update;
  if removed.id is null then
    return false;
  end if;
  with gone as (
    delete from core.search_posting p where p.search_row_id = removed.id returning p.word
  )
  update core.search_word w
     set record_count = greatest(0, w.record_count - 1)
   where w.record_type = removed.record_type and w.word in (select word from gone);
  delete from core.search_row where id = removed.id;
  delete from core.search_word w
   where w.record_count = 0
     and not exists (select from core.search_posting p
                      where p.word = w.word and p.record_type = w.record_type);
  return true;
end
$$;

-- ---------------------------------------------------------------------------------------------
-- Searching (as the person, through row level security)
-- ---------------------------------------------------------------------------------------------

-- The records that hold every word of the query, best first. Only rows the person may see are
-- counted or returned; `p_types` narrows the search to certain record types.
create function core.search_records(p_query text, p_types text[] default null,
                                    p_limit integer default 20)
returns table (record_schema text, record_table text, record_id uuid, record_type text,
               title text, secondary text, link_path text, rank real)
language sql stable
set search_path = ''
as $$
  with words as (select w from core.search_words(p_query) as w),
  asked as (select count(*)::int as n from words)
  select r.record_schema, r.record_table, r.record_id, r.record_type, r.title, r.secondary,
         r.link_path,
         -- A word that starts the title counts for more than one buried in the text.
         (count(*)::real
          + case when core.fold_tr(r.title) like (select min(w) from words) || '%' then 0.5
                 else 0 end)::real as rank
    from core.search_row r
    join core.search_posting p on p.search_row_id = r.id
    join words on words.w = p.word
   where (p_types is null or r.record_type = any (p_types))
   group by r.id
  having count(*) = (select n from asked) and (select n from asked) > 0
   order by rank desc, r.updated_at desc
   limit least(coalesce(p_limit, 20), 50)
$$;

-- The closest word the person's own vocabulary holds, for a query word nobody wrote that way.
-- Words nobody may see are not in the vocabulary they can reach, so nothing leaks (D-247).
create function core.search_suggest(p_word text, p_types text[] default null) returns text
language sql stable
set search_path = ''
as $$
  select p.word
    from core.search_posting p
   where (p_types is null or p.record_type = any (p_types))
     and p.word operator(extensions.%) core.fold_tr(p_word)
   group by p.word
   order by extensions.similarity(p.word, core.fold_tr(p_word)) desc, count(*) desc
   limit 1
$$;

-- ---------------------------------------------------------------------------------------------
-- Policies and privileges
-- ---------------------------------------------------------------------------------------------

alter table core.search_row enable row level security;
alter table core.search_posting enable row level security;
alter table core.search_word enable row level security;

create policy search_row_read on core.search_row for select to geoges_app
  using (core.can_see_record(record_schema, site_id, project_id, record_owner_user_id,
                             data_class));
create policy search_posting_read on core.search_posting for select to geoges_app
  using (core.can_see_record(
           (select r.record_schema from core.search_row r where r.id = search_row_id),
           site_id, project_id, record_owner_user_id, data_class));
-- The vocabulary itself says how many records hold a word across the company, so it is never
-- read directly by a person; `core.search_suggest` answers from what they may see.
create policy search_word_none on core.search_word for select to geoges_app using (false);

-- Spelling closeness comes from pg_trgm, which Supabase installs in its own schema; the runtime
-- and worker roles need to see it to use `%` and `similarity` (ADR-017).
grant usage on schema extensions to geoges_app, geoges_worker;

revoke all on core.search_row, core.search_posting, core.search_word from public;
grant select on core.search_row, core.search_posting to geoges_app;
grant select, insert, update, delete on core.search_row, core.search_posting, core.search_word
  to geoges_worker;

revoke all on function core.search_words(text), core.can_see_record(text, uuid, uuid, uuid, text),
  core.index_search_row(text, text, uuid, text, text, text, text, text, uuid, uuid, uuid, text,
                        timestamptz, integer),
  core.remove_search_row(text, text, uuid),
  core.search_records(text, text[], integer), core.search_suggest(text, text[]) from public;
grant execute on function core.search_words(text),
  core.can_see_record(text, uuid, uuid, uuid, text),
  core.search_records(text, text[], integer), core.search_suggest(text, text[])
  to geoges_app, geoges_worker;
grant execute on function core.index_search_row(text, text, uuid, text, text, text, text, text,
                                                uuid, uuid, uuid, text, timestamptz, integer),
  core.remove_search_row(text, text, uuid) to geoges_worker;
