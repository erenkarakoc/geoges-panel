-- Restore the version-blind helpers before their version column goes away.

create or replace function core.set_search_buckets(p_search_document_id integer,
                                                   p_record_type text, p_scope_key text,
                                                   p_data_class text, p_words text[])
returns void
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

create or replace function core.index_search_row_unlocked(p_schema text, p_table text,
  p_record_id uuid, p_record_type text, p_title text, p_secondary text, p_search_text text,
  p_link_path text, p_site_id uuid default null, p_project_id uuid default null,
  p_owner_user_id uuid default null, p_data_class text default 'internal',
  p_source_event_at timestamptz default null, p_projection_version integer default 1)
returns uuid
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
                               source_event_at, normalization_version)
  values (p_schema, p_table, p_record_id, p_record_type, p_title, p_secondary,
          core.fold_tr(coalesce(p_search_text, '')), p_link_path, p_site_id, p_project_id,
          p_owner_user_id, coalesce(p_data_class, 'internal'), coalesce(p_projection_version, 1),
          p_source_event_at, core.search_normalization_version())
  on conflict (record_schema, record_table, record_id) do update
     set record_type = excluded.record_type, title = excluded.title,
         secondary = excluded.secondary, search_text = excluded.search_text,
         link_path = excluded.link_path, site_id = excluded.site_id,
         project_id = excluded.project_id,
         record_owner_user_id = excluded.record_owner_user_id,
         data_class = excluded.data_class, projection_version = excluded.projection_version,
         normalization_version = excluded.normalization_version,
         source_event_at = excluded.source_event_at, updated_at = pg_catalog.now()
  returning id, search_document_id into row_id, doc_id;

  select coalesce(pg_catalog.array_agg(w), '{}') into words
    from core.search_words(p_search_text) as w;

  -- Recount affected vocabulary entries rather than inserting a negative delta: CHECK
  -- constraints run before ON CONFLICT, and a word/type change must update both old and new.
  delete from core.search_posting where search_row_id = row_id;
  insert into core.search_posting (search_row_id, word, record_type, site_id, project_id,
    record_owner_user_id, data_class, normalization_version, projection_version)
  select row_id, w, p_record_type, p_site_id, p_project_id, p_owner_user_id,
    coalesce(p_data_class, 'internal'), core.search_normalization_version(),
    coalesce(p_projection_version, 1) from pg_catalog.unnest(words) w;

  insert into core.search_word (word, record_type, record_count)
  select p.word, p.record_type, count(*)::int from core.search_posting p
  where p.record_type in (p_record_type, existing.record_type)
    and (p.word = any(words) or p.word in (select core.search_words(existing.search_text)))
  group by p.word, p.record_type
  on conflict (word, record_type) do update set record_count = excluded.record_count;
  delete from core.search_word w
  where w.record_type in (p_record_type, existing.record_type)
    and (w.word = any(words) or w.word in (select core.search_words(existing.search_text)))
    and not exists (select from core.search_posting p
                     where p.word = w.word and p.record_type = w.record_type);

  perform core.set_search_buckets(doc_id, p_record_type,
                                  core.search_scope_key(p_site_id, p_project_id),
                                  coalesce(p_data_class, 'internal'), words);
  return row_id;
end
$$;

create or replace function core.remove_search_row_unlocked(p_schema text, p_table text,
                                                           p_record_id uuid)
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

create or replace function core.rebuild_search_buckets_unlocked() returns integer
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

create or replace function core.search_records(p_query text, p_types text[] default null,
                                               p_limit integer default 20)
returns table (record_schema text, record_table text, record_id uuid, record_type text,
               title text, secondary text, link_path text, rank real)
language plpgsql stable
set search_path = ''
as $$
begin
  perform core.assert_search_normalization(p_types);
  return query
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
          or not core.search_access_allows((select core.search_access_snapshot()),
                                           r.record_schema, r.site_id, r.project_id, null,
                                           r.data_class)
          or r.search_document_id in (select doc from candidates))
   group by r.id
  having count(*) = (select n from asked) and (select n from asked) > 0
   order by rank desc, r.updated_at desc
   limit least(coalesce(p_limit, 20), 50);
end
$$;

create or replace function core.search_suggest(p_word text, p_types text[] default null)
returns text
language plpgsql stable
set search_path = ''
as $$
declare result text;
begin
  perform core.assert_search_normalization(p_types);
  select p.word into result
    from core.search_posting p
   where (p_types is null or p.record_type = any (p_types))
     and p.word operator(extensions.%) core.fold_tr(p_word)
   group by p.word
   order by extensions.similarity(p.word, core.fold_tr(p_word)) desc, count(*) desc
   limit 1;
  return result;
end
$$;

create or replace function core.search_integrity()
returns table (search_rows bigint, row_mismatches bigint, posting_mismatches bigint,
               bucket_mismatches bigint, vocabulary_mismatches bigint)
language sql stable
set search_path = ''
set row_security = 'off'
as $$
  with expected as materialized (
    select r.id, r.search_document_id, r.record_type, r.site_id, r.project_id,
           r.record_owner_user_id, r.data_class, r.projection_version,
           r.normalization_version, w.word
    from core.search_row r cross join lateral core.search_words(r.search_text) w(word)
  ), postings as (
    select count(*) as n from expected e full join core.search_posting p
      on p.search_row_id = e.id and p.word = e.word
    where e.id is null or p.search_row_id is null
      or row(p.record_type, p.site_id, p.project_id, p.record_owner_user_id,
             p.data_class, p.projection_version, p.normalization_version)
         is distinct from
         row(e.record_type, e.site_id, e.project_id, e.record_owner_user_id,
             e.data_class, e.projection_version, e.normalization_version)
  ), expected_buckets as (
    select word, record_type, core.search_scope_key(site_id, project_id) as scope_key,
           data_class,
           pg_catalog.array_agg(search_document_id order by search_document_id) as ids
    from expected group by 1, 2, 3, 4
  ), buckets as (
    select count(*) as n from expected_buckets e full join core.search_word_bucket b
      on b.word = e.word and b.record_type = e.record_type
        and b.scope_key = e.scope_key and b.data_class = e.data_class
    where e.ids is distinct from b.search_document_ids
  ), expected_vocabulary as (
    select word, record_type, count(*) as n from expected group by word, record_type
  ), vocabulary as (
    select count(*) as n from expected_vocabulary e full join core.search_word v
      on v.word = e.word and v.record_type = e.record_type
    where e.n is distinct from v.record_count::bigint
  )
  select (select count(*) from core.search_row),
         (select count(*) from core.search_row
            where normalization_version <> core.search_normalization_version()
               or search_text is distinct from core.fold_tr(search_text)),
         (select n from postings), (select n from buckets), (select n from vocabulary)
$$;

-- Going back means one version again. Rows left from another normalizer are not thrown away
-- quietly: the revert stops and says to finish or undo that upgrade first.
do $$
begin
  if exists (select from core.search_word_bucket
              where normalization_version <> core.search_normalization_version())
     or exists (select from core.search_word
                 where normalization_version <> core.search_normalization_version()) then
    raise exception using errcode = 'P0001',
      message = 'search_helper_versions_present',
      hint = 'Finish or undo the normalizer upgrade before reverting 0029.';
  end if;
end
$$;

drop index core.ix_search_word_bucket__old_normalization;
drop index core.ix_search_word__old_normalization;

alter table core.search_word_bucket drop constraint pk_search_word_bucket;
alter table core.search_word_bucket add constraint pk_search_word_bucket
  primary key (word, record_type, scope_key, data_class);
alter table core.search_word drop constraint pk_search_word;
alter table core.search_word add constraint pk_search_word primary key (word, record_type);

alter table core.search_word_bucket drop column normalization_version;
alter table core.search_word drop column normalization_version;
