-- 0030 — the search notices a damaged helper while it answers (TASK-0110, D-247, D-266).
--
-- 0028 derives the whole index from its source text and compares it, which is a full scan: it
-- runs at publication and when an operator asks, so damage can stay quiet until someone asks.
-- This adds a bounded check on the path people actually use. For the records the palette is
-- about to return — at most six per type — it asks whether each one is in the bucket of every
-- word of the query, for its own type, place, data class and the normalizer in force. Each
-- question is one key lookup; there is no scan.
--
-- A record the person sees only because they own it is not judged: the bucket is kept by place
-- and class, they have no broad access to it, so its absence from their view proves nothing.
--
-- The answer never changes: the postings decide, as they always did. The flag is an operational
-- signal that carries no query text, title or id, and the application never shows it to anyone.
--
-- What it cannot see, stated plainly: a bucket that still exists but has lost one id hides that
-- record from the answer, and a row that is not returned cannot be checked. That direction
-- belongs to `core.search_integrity()` and the publication gate. What it does see: a word whose
-- readable bucket is missing entirely — the narrowing is skipped, the postings still answer, and
-- every returned row reports the gap.
--
-- Only this one function changes. `core.search_records` keeps its shape, so no earlier
-- migration's down file and no caller has to be touched.

create or replace function core.search_palette(p_query text, p_types text[] default null)
returns jsonb
language plpgsql stable
set search_path = ''
as $$
declare
  types text[];
  words text[];
  resolved text[] := '{}';
  checked text[];
  access jsonb;
  word text;
  kind text;
  corrected text;
  hits jsonb := '[]'::jsonb;
  part jsonb;
  failed text[] := '{}';
  mismatch boolean := false;
  gap boolean;
begin
  select array_agg(w) into words from core.search_words(p_query) w;
  if words is null then
    return jsonb_build_object('hits', hits, 'corrected', null, 'failed_types', failed,
                              'helper_mismatch', false);
  end if;
  select array_agg(distinct record_type order by record_type) into types from core.search_row
    where p_types is null or record_type = any(p_types);
  if types is null then
    return jsonb_build_object('hits', hits, 'corrected', null, 'failed_types', failed,
                              'helper_mismatch', false);
  end if;
  foreach word in array words loop
    resolved := array_append(resolved, coalesce(core.search_suggest(word, types), word));
  end loop;
  -- The words the search actually matched on, and the access this person reads with: both are
  -- settled once, before the per-type loop, so the check adds no repeated work.
  select coalesce(array_agg(w), '{}') into checked
    from core.search_words(array_to_string(resolved, ' ')) w;
  access := core.search_access_snapshot();
  foreach kind in array types loop
    begin
      select coalesce(jsonb_agg(to_jsonb(r)), '[]'::jsonb),
             coalesce(bool_or(
               core.search_access_allows(access, s.record_schema, s.site_id, s.project_id, null,
                                         s.data_class)
               and (select count(distinct b.word) from core.search_word_bucket b
                     where b.word = any (checked)
                       and b.record_type = s.record_type
                       and b.scope_key = core.search_scope_key(s.site_id, s.project_id)
                       and b.data_class = s.data_class
                       and b.normalization_version = core.search_normalization_version()
                       and b.search_document_ids operator(extensions.@>)
                           array[s.search_document_id])
                   <> pg_catalog.cardinality(checked)), false)
        into part, gap
        from core.search_records(array_to_string(resolved, ' '), array[kind], 6) r
        join core.search_row s on s.record_schema = r.record_schema
         and s.record_table = r.record_table and s.record_id = r.record_id;
      hits := hits || part;
      mismatch := mismatch or gap;
    exception when others then
      failed := array_append(failed, kind);
    end;
  end loop;
  if resolved is distinct from words and jsonb_array_length(hits) > 0 then
    corrected := array_to_string(resolved, ' ');
  end if;
  return jsonb_build_object('hits', hits, 'corrected', corrected, 'failed_types', failed,
                            'helper_mismatch', mismatch);
end
$$;
