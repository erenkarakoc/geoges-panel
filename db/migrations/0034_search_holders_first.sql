-- 0034 — read the records the words point at, not the whole archive (TASK-0110, D-248, D-266).
--
-- Measured at 20,000 records: one common word took 942 ms end to end, two words 1,250 ms, far
-- over the 300 ms REQ-NFR-012 asks for. The plan showed why. The match was written as a join
-- between `core.search_row` and `core.search_posting` grouped by the row, and the planner chose
-- to merge-join them by id: it walked all 20,000 rows of `core.search_row` and ran the row level
-- security check on every one of them, throwing 19,091 away. 718 of the 790 ms were that walk.
--
-- The words already know which rows they are in. The postings are counted first, in a CTE the
-- planner must materialize, and only the rows that hold every word are then read by primary key
-- — 909 key lookups instead of 20,000 checked rows. The answer, its order and its visibility
-- rules are unchanged: the postings carry the same scope, owner and class as their row, so the
-- count is made over exactly the postings this person may read, and the row is checked again by
-- its own policy when it is read.
--
-- Bounded by construction for a rare word. A word that a hundred thousand records share is a
-- different question — ranking still has to see every match before it can keep six — and that
-- one stays open for the production-volume gate.

create or replace function core.search_palette_rows(p_query text, p_types text[] default null,
                                         p_per_type integer default 6)
returns table (record_schema text, record_table text, record_id uuid, record_type text,
               title text, secondary text, link_path text, rank real,
               search_document_id integer, site_id uuid, project_id uuid, data_class text)
language plpgsql stable
set search_path = ''
as $$
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
  -- Which rows hold every word, counted over the postings alone. Materialized on purpose: it is
  -- what keeps the row read below a key lookup per holder instead of a walk of the archive.
  holders as materialized (
    select p.search_row_id, count(*)::int as held
      from core.search_posting p join words on words.w = p.word
     where p.normalization_version = core.search_normalization_version()
       and (p_types is null or p.record_type = any (p_types))
     group by p.search_row_id
    having count(*) = (select n from asked) and (select n from asked) > 0
  ),
  matched as (
    select r.record_schema, r.record_table, r.record_id, r.record_type, r.title, r.secondary,
           r.link_path, r.search_document_id, r.site_id, r.project_id, r.data_class, r.updated_at,
           (h.held::real
            + case when core.fold_tr(r.title) like (select min(w) from words) || '%' then 0.5
                   else 0 end)::real as rank
      from holders h
      join core.search_row r on r.id = h.search_row_id
     where (p_types is null or r.record_type = any (p_types))
       and r.normalization_version = core.search_normalization_version()
       and ((select n from covered) < (select n from asked)
            or not core.search_access_allows((select core.search_access_snapshot()),
                                             r.record_schema, r.site_id, r.project_id, null,
                                             r.data_class)
            or r.search_document_id in (select doc from candidates))
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
$$;

-- The same correction for the per-record answer: the fallback path and the direct reader.
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
  holders as materialized (
    select p.search_row_id, count(*)::int as held
      from core.search_posting p join words on words.w = p.word
     where p.normalization_version = core.search_normalization_version()
       and (p_types is null or p.record_type = any (p_types))
     group by p.search_row_id
    having count(*) = (select n from asked) and (select n from asked) > 0
  )
  select r.record_schema, r.record_table, r.record_id, r.record_type, r.title, r.secondary,
         r.link_path,
         (h.held::real
          + case when core.fold_tr(r.title) like (select min(w) from words) || '%' then 0.5
                 else 0 end)::real as rank
    from holders h
    join core.search_row r on r.id = h.search_row_id
   where (p_types is null or r.record_type = any (p_types))
     and r.normalization_version = core.search_normalization_version()
     and ((select n from covered) < (select n from asked)
          or not core.search_access_allows((select core.search_access_snapshot()),
                                           r.record_schema, r.site_id, r.project_id, null,
                                           r.data_class)
          or r.search_document_id in (select doc from candidates))
   order by rank desc, r.updated_at desc
   limit least(coalesce(p_limit, 20), 50);
end
$$;
