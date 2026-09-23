-- TASK-0110: evaluate IAM grants once per statement instead of once per search row.
-- The snapshot is generated inside each policy, never accepted from a client setting.
create function core.search_access_snapshot() returns jsonb
language sql stable set search_path = '' as $$
  select jsonb_build_object(
    'user_id', core.current_user_id(),
    'grants', (select coalesce(jsonb_agg(to_jsonb(g)), '[]'::jsonb) from iam.my_grants() g),
    'classes', (select coalesce(jsonb_agg(to_jsonb(d)), '[]'::jsonb) from iam.my_data_classes() d))
$$;

-- Pure comparison of the current IAM output against a record. This helper grants no access
-- on its own; RLS always supplies a snapshot made with the current transaction identity.
create function core.search_access_allows(p_access jsonb, p_module text, p_site uuid,
  p_project uuid, p_owner uuid, p_class text) returns boolean
language sql immutable parallel safe set search_path = '' as $$
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
$$;

revoke all on function core.search_access_snapshot(),
  core.search_access_allows(jsonb, text, uuid, uuid, uuid, text) from public;
grant execute on function core.search_access_snapshot(),
  core.search_access_allows(jsonb, text, uuid, uuid, uuid, text) to geoges_app, geoges_worker;

alter policy search_row_read on core.search_row using (
  core.search_access_allows((select core.search_access_snapshot()), record_schema,
    site_id, project_id, record_owner_user_id, data_class));
alter policy search_posting_read on core.search_posting using (
  core.search_access_allows((select core.search_access_snapshot()),
    (select r.record_schema from core.search_row r where r.id = search_row_id),
    site_id, project_id, record_owner_user_id, data_class));
alter policy search_word_bucket_read on core.search_word_bucket using (
  core.search_access_allows((select core.search_access_snapshot()), split_part(record_type, '.', 1),
    case when scope_key like 'site:%' then substring(scope_key from 6)::uuid end,
    case when scope_key like 'project:%' then substring(scope_key from 9)::uuid end,
    null, data_class));

create or replace function core.search_records(p_query text, p_types text[] default null,
                                    p_limit integer default 20)
returns table (record_schema text, record_table text, record_id uuid, record_type text,
               title text, secondary text, link_path text, rank real)
language sql stable
set search_path = ''
as $$
  with words as (select w from core.search_words(p_query) as w),
  asked as (select count(*)::int as n from words),
  -- The records that hold every word, from the buckets this person may read. A word with no
  -- bucket they may read leaves the narrowing out entirely, and the postings below still
  -- decide, so a missing bucket can never hide a record.
  seen_words as (
    select b.word, pg_catalog.unnest(b.search_document_ids) as doc
      from core.search_word_bucket b join words on words.w = b.word
     where p_types is null or b.record_type = any (p_types)
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
    join words on words.w = p.word
   where (p_types is null or r.record_type = any (p_types))
     and ((select n from covered) < (select n from asked)
          or not core.search_access_allows((select core.search_access_snapshot()), r.record_schema, r.site_id, r.project_id, null, r.data_class)
          or r.search_document_id in (select doc from candidates))
   group by r.id
  having count(*) = (select n from asked) and (select n from asked) > 0
   order by rank desc, r.updated_at desc
   limit least(coalesce(p_limit, 20), 50)
$$;
