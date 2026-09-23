-- 0021 — the third search helper: each word's records, by scope (TASK-0110 step 3, D-247,
-- D-266, OQ-033 answered by the owner 2026-09-23).
--
-- A bucket holds the internal numbers of the records that carry one word, kept apart by record
-- type, place and data class — exactly the four things that decide who may see a record. A
-- person reads only the buckets of places and classes they may see, so neither a word's
-- existence nor how many records hold it leaks (D-247).
--
-- The bucket is kept up to date as records are written, not rebuilt from time to time, so the
-- search may lean on it: the records that hold every word are found by intersecting buckets
-- before a single row is read. `npm run search:rebuild` builds them all again after a restore
-- or a change of projection.

create table core.search_word_bucket (
  word text not null,
  record_type text not null,
  -- 'site:<id>', 'project:<id>' or 'company': the place whose readers may see these records.
  scope_key text not null,
  data_class text not null,
  search_document_ids integer[] not null default '{}',
  updated_at timestamptz not null default now(),
  constraint pk_search_word_bucket primary key (word, record_type, scope_key, data_class),
  constraint ck_search_word_bucket__word check (word ~ '^[a-z0-9]+$'),
  constraint ck_search_word_bucket__scope check (
    scope_key = 'company' or scope_key ~ '^(site|project):[0-9a-f-]{36}$'),
  constraint ck_search_word_bucket__data_class
    check (data_class in ('general', 'internal', 'commercial', 'sensitive')),
  constraint ck_search_word_bucket__ids check (
    array_position(search_document_ids, null) is null)
);
create index ix_search_word_bucket__word on core.search_word_bucket (word, record_type);

comment on table core.search_word_bucket is
  'Records holding a word, per type, place and data class; sorted internal numbers (D-247).';

insert into core.table_layer (schema_name, table_name, layer, history) values
  ('core', 'search_word_bucket', 'system', 'none');

-- The place a search row belongs to, written the way a bucket names it.
create function core.search_scope_key(p_site_id uuid, p_project_id uuid) returns text
language sql immutable parallel safe
set search_path = ''
as $$
  select case when p_site_id is not null then 'site:' || p_site_id
              when p_project_id is not null then 'project:' || p_project_id
              else 'company' end
$$;

-- Puts one record into the buckets of its words, and takes it out of the buckets it left.
create function core.set_search_buckets(p_search_document_id integer, p_record_type text,
                                        p_scope_key text, p_data_class text,
                                        p_words text[]) returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  -- Out of every bucket this record is in but should not be (a word it lost, or a move to
  -- another place or class).
  update core.search_word_bucket b
     set search_document_ids =
           b.search_document_ids operator(extensions.-) p_search_document_id,
         updated_at = pg_catalog.now()
   where b.search_document_ids operator(extensions.@>) array[p_search_document_id]
     and (b.record_type <> p_record_type or b.scope_key <> p_scope_key
          or b.data_class <> p_data_class or not (b.word = any (p_words)));

  -- Into the bucket of each word it holds now.
  insert into core.search_word_bucket (word, record_type, scope_key, data_class,
                                       search_document_ids)
  select w, p_record_type, p_scope_key, p_data_class, array[p_search_document_id]
    from pg_catalog.unnest(p_words) as w
  on conflict (word, record_type, scope_key, data_class) do update
     set search_document_ids = extensions.sort(
           extensions.uniq(core.search_word_bucket.search_document_ids
                           operator(extensions.|) p_search_document_id)),
         updated_at = pg_catalog.now();

  delete from core.search_word_bucket where search_document_ids = '{}';
end
$$;

-- Same as above for a record that is gone: out of every bucket, with no new home.
create function core.clear_search_buckets(p_search_document_id integer) returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  update core.search_word_bucket b
     set search_document_ids =
           b.search_document_ids operator(extensions.-) p_search_document_id,
         updated_at = pg_catalog.now()
   where b.search_document_ids operator(extensions.@>) array[p_search_document_id];
  delete from core.search_word_bucket where search_document_ids = '{}';
end
$$;

-- ---------------------------------------------------------------------------------------------
-- Writing: the index keeps the buckets with it
-- ---------------------------------------------------------------------------------------------

create or replace function core.index_search_row(p_schema text, p_table text, p_record_id uuid,
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
  doc_id integer;
  existing core.search_row;
  words text[];
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
  returning id, search_document_id into row_id, doc_id;

  select coalesce(pg_catalog.array_agg(w), '{}') into words from core.search_words(p_search_text) as w;

  with wanted as (select pg_catalog.unnest(words) as w),
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

  perform core.set_search_buckets(doc_id, p_record_type,
                                  core.search_scope_key(p_site_id, p_project_id),
                                  coalesce(p_data_class, 'internal'), words);
  return row_id;
end
$$;

create or replace function core.remove_search_row(p_schema text, p_table text, p_record_id uuid)
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
  perform core.clear_search_buckets(removed.search_document_id);
  delete from core.search_row where id = removed.id;
  delete from core.search_word w
   where w.record_count = 0
     and not exists (select from core.search_posting p
                      where p.word = w.word and p.record_type = w.record_type);
  return true;
end
$$;

-- Builds every bucket again from the rows and their words; used after a restore or when a
-- module changes what it puts into search (`npm run search:rebuild`).
create function core.rebuild_search_buckets() returns integer
language plpgsql security definer
set search_path = ''
as $$
declare
  built integer;
begin
  delete from core.search_word_bucket;
  insert into core.search_word_bucket (word, record_type, scope_key, data_class,
                                       search_document_ids)
  select p.word, r.record_type, core.search_scope_key(r.site_id, r.project_id), r.data_class,
         extensions.sort(pg_catalog.array_agg(distinct r.search_document_id))
    from core.search_posting p
    join core.search_row r on r.id = p.search_row_id
   group by p.word, r.record_type, core.search_scope_key(r.site_id, r.project_id), r.data_class;
  get diagnostics built = row_count;
  return built;
end
$$;

-- ---------------------------------------------------------------------------------------------
-- Reading: the buckets narrow the search before any row is read
-- ---------------------------------------------------------------------------------------------

create or replace function core.search_records(p_query text, p_types text[] default null,
                                    p_limit integer default 20)
returns table (record_schema text, record_table text, record_id uuid, record_type text,
               title text, secondary text, link_path text, rank real)
language sql stable
set search_path = ''
as $$
  with words as (select w from core.search_words(p_query) as w),
  asked as (select count(*)::int as n from words),
  -- The records that hold every word, from the buckets this person may read. A word with no
  -- bucket they may read leaves the narrowing out entirely, and the postings below still
  -- decide, so a missing bucket can never hide a record.
  seen_words as (
    select b.word, pg_catalog.unnest(b.search_document_ids) as doc
      from core.search_word_bucket b join words on words.w = b.word
     where p_types is null or b.record_type = any (p_types)
  ),
  covered as (select count(distinct word)::int as n from seen_words),
  candidates as (
    select doc from seen_words group by doc
    having count(distinct word) = (select n from asked)
  )
  select r.record_schema, r.record_table, r.record_id, r.record_type, r.title, r.secondary,
         r.link_path,
         (count(*)::real
          + case when core.fold_tr(r.title) like (select min(w) from words) || '%' then 0.5
                 else 0 end)::real as rank
    from core.search_row r
    join core.search_posting p on p.search_row_id = r.id
    join words on words.w = p.word
   where (p_types is null or r.record_type = any (p_types))
     and ((select n from covered) < (select n from asked)
          or r.search_document_id in (select doc from candidates))
   group by r.id
  having count(*) = (select n from asked) and (select n from asked) > 0
   order by rank desc, r.updated_at desc
   limit least(coalesce(p_limit, 20), 50)
$$;

-- ---------------------------------------------------------------------------------------------
-- Policies and privileges
-- ---------------------------------------------------------------------------------------------

alter table core.search_word_bucket enable row level security;

-- A bucket is read by whoever may see the records inside it: same module, place and class.
create policy search_word_bucket_read on core.search_word_bucket for select to geoges_app
  using (core.can_see_record(
           split_part(record_type, '.', 1),
           case when scope_key like 'site:%' then substring(scope_key from 6)::uuid end,
           case when scope_key like 'project:%' then substring(scope_key from 9)::uuid end,
           null, data_class));

revoke all on core.search_word_bucket from public;
grant select on core.search_word_bucket to geoges_app;
grant select, insert, update, delete on core.search_word_bucket to geoges_worker;

revoke all on function core.search_scope_key(uuid, uuid),
  core.set_search_buckets(integer, text, text, text, text[]),
  core.clear_search_buckets(integer), core.rebuild_search_buckets() from public;
grant execute on function core.search_scope_key(uuid, uuid) to geoges_app, geoges_worker;
grant execute on function core.set_search_buckets(integer, text, text, text, text[]),
  core.clear_search_buckets(integer), core.rebuild_search_buckets() to geoges_worker;
