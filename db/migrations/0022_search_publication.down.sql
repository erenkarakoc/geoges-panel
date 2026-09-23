-- Revert only publication wrappers and the type/schema constraint.
delete from core.read_model where name = 'core.search';
drop function core.index_search_row(text, text, uuid, text, text, text, text, text, uuid, uuid, uuid, text, timestamptz, integer);
alter function core.index_search_row_unlocked(text, text, uuid, text, text, text, text, text, uuid, uuid, uuid, text, timestamptz, integer) rename to index_search_row;
grant execute on function core.index_search_row(text, text, uuid, text, text, text, text, text, uuid, uuid, uuid, text, timestamptz, integer) to geoges_worker;
drop function core.remove_search_row(text, text, uuid);
alter function core.remove_search_row_unlocked(text, text, uuid) rename to remove_search_row;
grant execute on function core.remove_search_row(text, text, uuid) to geoges_worker;
drop function core.rebuild_search_buckets();
alter function core.rebuild_search_buckets_unlocked() rename to rebuild_search_buckets;
grant execute on function core.rebuild_search_buckets() to geoges_worker;
alter table core.search_row drop constraint ck_search_row__type_module;

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

alter table core.read_model drop constraint ck_read_model__name;
alter table core.read_model add constraint ck_read_model__name check (name ~ '^[a-z]{2,3}\.[a-z0-9_]+$');

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
