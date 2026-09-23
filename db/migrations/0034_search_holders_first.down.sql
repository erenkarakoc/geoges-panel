-- Back to the shape that joined the archive and let the planner walk it. No data changes.

CREATE OR REPLACE FUNCTION core.search_palette_rows(p_query text, p_types text[] DEFAULT NULL::text[], p_per_type integer DEFAULT 6)
 RETURNS TABLE(record_schema text, record_table text, record_id uuid, record_type text, title text, secondary text, link_path text, rank real, search_document_id integer, site_id uuid, project_id uuid, data_class text)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO ''
AS $function$
begin
  perform core.assert_search_normalization(p_types);
  return query
  with words as (select w from core.search_words(p_query) as w),
  asked as (select count(*)::int as n from words),
  -- The records that hold every word, from the buckets this person may read (D-247, OQ-033).
  seen_words as (
    select b.word, pg_catalog.unnest(b.search_document_ids) as doc
      from core.search_word_bucket b join words on words.w = b.word
     where (p_types is null or b.record_type = any (p_types))
       and b.normalization_version = core.search_normalization_version()
  ),
  covered as (select count(distinct word)::int as n from seen_words),
  candidates as (
    select doc from seen_words group by doc
    having count(distinct word) = (select n from asked)
  ),
  matched as (
    select r.record_schema, r.record_table, r.record_id, r.record_type, r.title, r.secondary,
           r.link_path, r.search_document_id, r.site_id, r.project_id, r.data_class, r.updated_at,
           (count(*)::real
            + case when core.fold_tr(r.title) like (select min(w) from words) || '%' then 0.5
                   else 0 end)::real as rank
      from core.search_row r
      join core.search_posting p on p.search_row_id = r.id
       and p.normalization_version = core.search_normalization_version()
      join words on words.w = p.word
     where (p_types is null or r.record_type = any (p_types))
       and r.normalization_version = core.search_normalization_version()
       and ((select n from covered) < (select n from asked)
            or not core.search_access_allows((select core.search_access_snapshot()),
                                             r.record_schema, r.site_id, r.project_id, null,
                                             r.data_class)
            or r.search_document_id in (select doc from candidates))
     group by r.id, r.record_schema, r.record_table, r.record_id, r.record_type, r.title,
              r.secondary, r.link_path, r.search_document_id, r.site_id, r.project_id,
              r.data_class, r.updated_at
    having count(*) = (select n from asked) and (select n from asked) > 0
  ),
  ranked as (
    select m.*, pg_catalog.row_number() over (partition by m.record_type
                                              order by m.rank desc, m.updated_at desc) as n
      from matched m
  )
  select x.record_schema, x.record_table, x.record_id, x.record_type, x.title, x.secondary,
         x.link_path, x.rank, x.search_document_id, x.site_id, x.project_id, x.data_class
    from ranked x
   where x.n <= least(coalesce(p_per_type, 6), 20)
   order by x.record_type, x.rank desc;
end
$function$
;

CREATE OR REPLACE FUNCTION core.search_records(p_query text, p_types text[] DEFAULT NULL::text[], p_limit integer DEFAULT 20)
 RETURNS TABLE(record_schema text, record_table text, record_id uuid, record_type text, title text, secondary text, link_path text, rank real)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO ''
AS $function$
begin
  perform core.assert_search_normalization(p_types);
  return query
  with words as (select w from core.search_words(p_query) as w),
  asked as (select count(*)::int as n from words),
  -- The records that hold every word, from the buckets this person may read, written by the
  -- normalizer in force. A word with no such bucket leaves the narrowing out entirely, and the
  -- postings below still decide, so a missing bucket can never hide a record.
  seen_words as (
    select b.word, pg_catalog.unnest(b.search_document_ids) as doc
      from core.search_word_bucket b join words on words.w = b.word
     where (p_types is null or b.record_type = any (p_types))
       and b.normalization_version = core.search_normalization_version()
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
     and p.normalization_version = core.search_normalization_version()
    join words on words.w = p.word
   where (p_types is null or r.record_type = any (p_types))
     and r.normalization_version = core.search_normalization_version()
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
$function$
;
