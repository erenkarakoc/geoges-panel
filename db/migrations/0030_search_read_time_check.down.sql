-- Back to the answer without its operational flag. No row, bucket or vocabulary entry is
-- touched, and `core.search_records` was never changed by this migration.

create or replace function core.search_palette(p_query text, p_types text[] default null)
returns jsonb
language plpgsql stable
set search_path = ''
as $$
declare
  types text[];
  words text[];
  resolved text[] := '{}';
  word text;
  kind text;
  corrected text;
  hits jsonb := '[]'::jsonb;
  part jsonb;
  failed text[] := '{}';
begin
  select array_agg(w) into words from core.search_words(p_query) w;
  if words is null then
    return jsonb_build_object('hits', hits, 'corrected', null, 'failed_types', failed);
  end if;
  select array_agg(distinct record_type order by record_type) into types from core.search_row
    where p_types is null or record_type = any(p_types);
  if types is null then
    return jsonb_build_object('hits', hits, 'corrected', null, 'failed_types', failed);
  end if;
  foreach word in array words loop
    resolved := array_append(resolved, coalesce(core.search_suggest(word, types), word));
  end loop;
  foreach kind in array types loop
    begin
      select coalesce(jsonb_agg(to_jsonb(r)), '[]'::jsonb) into part
        from core.search_records(array_to_string(resolved, ' '), array[kind], 6) r;
      hits := hits || part;
    exception when others then
      failed := array_append(failed, kind);
    end;
  end loop;
  if resolved is distinct from words and jsonb_array_length(hits) > 0 then
    corrected := array_to_string(resolved, ' ');
  end if;
  return jsonb_build_object('hits', hits, 'corrected', corrected, 'failed_types', failed);
end
$$;
