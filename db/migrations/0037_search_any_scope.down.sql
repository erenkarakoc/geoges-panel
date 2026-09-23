-- Back to judging a record by its first place only, and to the read-time check asking with
-- both places. No data changes.

CREATE OR REPLACE FUNCTION core.search_access_allows(p_access jsonb, p_module text, p_site uuid, p_project uuid, p_owner uuid, p_class text)
 RETURNS boolean
 LANGUAGE sql
 IMMUTABLE PARALLEL SAFE
 SET search_path TO ''
AS $function$
  with place as (
    select case when p_site is not null then 'site'
                when p_project is not null then 'project' else 'company' end as kind,
           coalesce(p_site, p_project) as id
  )
  select exists (
    select from jsonb_to_recordset(p_access -> 'grants')
      as g(permission_code text, scope_type text, scope_ids uuid[]), place p
    where (g.permission_code = p_module || '.module.view'
      or (g.permission_code = p_module || '.module.own'
        and p_owner = (p_access ->> 'user_id')::uuid))
      and iam.covers(g.scope_type, g.scope_ids, p.kind, p.id))
    and (p_class in ('general', 'internal') or exists (
      select from jsonb_to_recordset(p_access -> 'classes')
        as d(module text, scope_type text, scope_ids uuid[],
             can_see_commercial boolean, can_see_sensitive boolean), place p
      where d.module in (p_module, '*')
        and case p_class when 'commercial' then d.can_see_commercial
                         when 'sensitive' then d.can_see_sensitive else false end
        and iam.covers(d.scope_type, d.scope_ids, p.kind, p.id)))
$function$
;

CREATE OR REPLACE FUNCTION core.search_palette(p_query text, p_types text[] DEFAULT NULL::text[])
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO ''
AS $function$
declare
  types text[];
  words text[];
  resolved text[];
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

  -- Refuse before answering, not inside the block that turns a failure into "this kind could
  -- not be read": while a visible row or posting is still on another normalizer, the search says
  -- so and answers nothing (0027). Until 0035 this came for free from the spelling suggestion;
  -- a query whose words are all known no longer asks it, so it is asked here.
  perform core.assert_search_normalization(p_types);

  foreach needle in array words loop
    if not exists (select from core.search_posting p
                    where p.word = needle
                      and p.normalization_version = core.search_normalization_version()) then
      all_words_known := false;
      exit;
    end if;
  end loop;

  if all_words_known then
    -- Nothing to correct and nothing to ask: the kinds are whatever the answer holds, and
    -- `types` may stay null, which is how the reader below means "every kind at once".
    resolved := words;
    types := p_types;
  else
    -- A word nobody has written: the suggestion has to be free to look everywhere, so the kind
    -- list is read in full (0032), and every word is then resolved through it.
    types := coalesce(p_types,
      (select array_agg(distinct record_type order by record_type) from core.search_row));
    if types is null then
      return jsonb_build_object('hits', hits, 'corrected', null, 'failed_types', failed,
                                'helper_mismatch', false);
    end if;
    resolved := '{}';
    foreach word in array words loop
      resolved := array_append(resolved, coalesce(core.search_suggest(word, types), word));
    end loop;
  end if;

  -- The words the search matches on, and the access this person reads with: settled once, so
  -- the read-time check of 0030 adds no repeated work.
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
    if types is null then
      select array_agg(distinct record_type order by record_type) into types from core.search_row;
    end if;
    foreach kind in array coalesce(types, '{}') loop
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
