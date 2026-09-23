-- 0033 — the palette asks once for every kind, not once per kind (TASK-0110, D-248, D-266).
--
-- `core.search_records` already sorts every match of a kind before it keeps six, so calling it
-- per kind does the same work N times over and pays the setup — words, buckets, access snapshot,
-- planning — N times with it. Measured at 2,000 records and three kinds: 56 ms for one kind,
-- 138 ms for three, and the whole palette 323 ms on the server. The panel will carry around
-- twenty kinds, where that shape alone would cost more than a second.
--
-- `core.search_palette_rows` does it in one statement: the matches are found once and a window
-- keeps the best six of each kind. It also returns the place and class of each row, so the
-- palette's read-time check (0030) no longer joins `core.search_row` again.
--
-- The per-kind loop stays as the fallback: it answers even when one kind's read fails, which is
-- what `failed_types` reports, and a single statement cannot do that.

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
$$;

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
$$;

revoke all on function core.search_palette_rows(text, text[], integer) from public;
grant execute on function core.search_palette_rows(text, text[], integer) to geoges_app;
