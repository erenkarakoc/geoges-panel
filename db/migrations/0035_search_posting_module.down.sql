-- Back to the module read from the row, the kind list asked before the answer, and no rule
-- written down about a record type's first part. No data changes.

CREATE OR REPLACE FUNCTION core.search_palette(p_query text, p_types text[] DEFAULT NULL::text[])
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
    -- suggestion below has to be free to look everywhere (0032).
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
  -- settled once, so the read-time check adds no repeated work.
  select coalesce(array_agg(w), '{}') into checked
    from core.search_words(array_to_string(resolved, ' ')) w;
  access := core.search_access_snapshot();

  begin
    select coalesce(jsonb_agg(jsonb_build_object(
             'record_schema', x.record_schema, 'record_table', x.record_table,
             'record_id', x.record_id, 'record_type', x.record_type, 'title', x.title,
             'secondary', x.secondary, 'link_path', x.link_path, 'rank', x.rank)
             order by x.record_type, x.rank desc), '[]'::jsonb),
           coalesce(bool_or(
             core.search_access_allows(access, pg_catalog.split_part(x.record_type, '.', 1),
                                       x.site_id, x.project_id, null, x.data_class)
             and (select count(distinct b.word) from core.search_word_bucket b
                   where b.word = any (checked)
                     and b.record_type = x.record_type
                     and b.scope_key = core.search_scope_key(x.site_id, x.project_id)
                     and b.data_class = x.data_class
                     and b.normalization_version = core.search_normalization_version()
                     and b.search_document_ids operator(extensions.@>)
                         array[x.search_document_id])
                 <> pg_catalog.cardinality(checked)), false)
      into hits, mismatch
      from core.search_palette_rows(array_to_string(resolved, ' '), types, 6) x;
  exception when others then
    -- One kind's read failed. Ask kind by kind, so the others still answer and the screen can
    -- say which one did not (REQ-NFR-012's "Tümünü gör" list stays honest).
    hits := '[]'::jsonb;
    mismatch := false;
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
  end;

  if resolved is distinct from words and jsonb_array_length(hits) > 0 then
    corrected := array_to_string(resolved, ' ');
  end if;
  return jsonb_build_object('hits', hits, 'corrected', corrected, 'failed_types', failed,
                            'helper_mismatch', mismatch);
end
$function$
;

alter policy search_posting_read on core.search_posting using (
  core.search_access_allows((select core.search_access_snapshot()),
    (select r.record_schema from core.search_row r where r.id = search_row_id),
    site_id, project_id, record_owner_user_id, data_class));
alter table core.search_row drop constraint ck_search_row__record_type_module;
