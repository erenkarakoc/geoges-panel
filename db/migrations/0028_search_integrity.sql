-- TASK-0110: compare every derived helper with the indexed text, never another helper.
-- Operational full scan only. Do not expose global counts on the user's search path.
create function core.search_integrity()
returns table (search_rows bigint, row_mismatches bigint, posting_mismatches bigint,
               bucket_mismatches bigint, vocabulary_mismatches bigint)
language sql stable security invoker
set search_path = '' set row_security = off
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
           data_class, pg_catalog.array_agg(search_document_id order by search_document_id) as ids
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
revoke all on function core.search_integrity() from public, geoges_app;
grant execute on function core.search_integrity() to geoges_worker;

