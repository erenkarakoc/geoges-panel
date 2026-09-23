-- 0032 — the palette loops only the kinds that hold the words (TASK-0110, D-248).
--
-- Asked without a kind list, the palette read every row of `core.search_row` to learn which
-- kinds exist: 43 ms at 2,000 records and growing with the archive, on every keystroke that
-- reaches the server. A kind that holds none of the words cannot answer anyway, so the list now
-- comes from the postings of the words themselves, through the `(word, record_type)` index.
--
-- One case still needs the whole list: a word nobody has written. That is what the spelling
-- suggestion is for, and it must be able to look in every kind, so a query with an unknown word
-- falls back to the old reading. Panel requests pass their own kinds anyway (`src/records`), so
-- neither reading runs for them.

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
  needle text;
  all_words_known boolean := true;
begin
  select array_agg(w) into words from core.search_words(p_query) w;
  if words is null then
    return jsonb_build_object('hits', hits, 'corrected', null, 'failed_types', failed,
                              'helper_mismatch', false);
  end if;

  if p_types is not null then
    types := p_types;
  else
    -- Only the kinds whose postings hold one of the words, unless a word is unknown: then the
    -- suggestion below has to be free to look everywhere.
    -- `needle`, not `word`: inside the query below plpgsql cannot tell a variable named like the
    -- column from the column itself.
    foreach needle in array words loop
      if not exists (select from core.search_posting p
                      where p.word = needle
                        and p.normalization_version = core.search_normalization_version()) then
        all_words_known := false;
        exit;
      end if;
    end loop;
    if all_words_known then
      select array_agg(distinct p.record_type order by p.record_type) into types
        from core.search_posting p
       where p.word = any (words)
         and p.normalization_version = core.search_normalization_version();
    else
      select array_agg(distinct record_type order by record_type) into types from core.search_row;
    end if;
  end if;

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
