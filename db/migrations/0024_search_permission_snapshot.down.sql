-- Restore the original policy predicates before removing the snapshot helpers.
alter policy search_row_read on core.search_row using (
  core.can_see_record(record_schema, site_id, project_id, record_owner_user_id, data_class));
alter policy search_posting_read on core.search_posting using (
  core.can_see_record((select r.record_schema from core.search_row r where r.id = search_row_id),
    site_id, project_id, record_owner_user_id, data_class));
alter policy search_word_bucket_read on core.search_word_bucket using (
  core.can_see_record(split_part(record_type, '.', 1),
    case when scope_key like 'site:%' then substring(scope_key from 6)::uuid end,
    case when scope_key like 'project:%' then substring(scope_key from 9)::uuid end,
    null, data_class));
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
          or not core.can_see_record(r.record_schema, r.site_id, r.project_id, null, r.data_class)
          or r.search_document_id in (select doc from candidates))
   group by r.id
  having count(*) = (select n from asked) and (select n from asked) > 0
   order by rank desc, r.updated_at desc
   limit least(coalesce(p_limit, 20), 50)
$$;
drop function core.search_access_allows(jsonb, text, uuid, uuid, uuid, text);
drop function core.search_access_snapshot();
