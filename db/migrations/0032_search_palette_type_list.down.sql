-- Reverses 0032: the palette reads every row of core.search_row to learn the kinds again.
create or replace function core.search_palette(p_query text, p_types text[] DEFAULT NULL::text[])
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO ''
AS $function$
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
$function$
;
