-- 0036 — a rebuild writes the rows, then builds the helpers once (TASK-0110, D-247, D-266).
--
-- Measured: a rebuild of 20,000 records from their source did not finish in ten minutes, while
-- the same 20,000 records index in seconds when they arrive one at a time. The reason is that
-- the publication used the ordinary per-record writer for all of them, and that writer keeps the
-- helpers up to date for every record: it appends the record's id to the bucket of each of its
-- words and recounts the vocabulary entries it touched. A bucket that already holds three
-- thousand ids is rewritten whole for every id added to it, so the cost of filling an empty
-- index one record at a time grows with the square of its size.
--
-- None of that work survives: the publication ends by rebuilding every bucket from the postings
-- and recounting the whole vocabulary, because a damaged helper is not repaired by per-row
-- upserts. So the rebuild now writes the row and its postings and nothing else, and the helpers
-- are built once at the end, as they already were.
--
-- Only the rebuild uses this. A record that arrives on its own still goes through
-- `core.index_search_row`, which keeps the helpers in step within the same transaction — that
-- is what makes a search answer from an index that is never a moment behind its records.

create function core.index_search_row_bulk(p_schema text, p_table text, p_record_id uuid,
  p_record_type text, p_title text, p_secondary text, p_search_text text, p_link_path text,
  p_site_id uuid default null, p_project_id uuid default null, p_owner_user_id uuid default null,
  p_data_class text default 'internal', p_source_event_at timestamptz default null,
  p_projection_version integer default 1)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  row_id uuid;
  version integer := core.search_normalization_version();
begin
  insert into core.search_row (record_schema, record_table, record_id, record_type, title,
                               secondary, search_text, link_path, site_id, project_id,
                               record_owner_user_id, data_class, projection_version,
                               source_event_at, normalization_version)
  values (p_schema, p_table, p_record_id, p_record_type, p_title, p_secondary,
          core.fold_tr(coalesce(p_search_text, '')), p_link_path, p_site_id, p_project_id,
          p_owner_user_id, coalesce(p_data_class, 'internal'), coalesce(p_projection_version, 1),
          p_source_event_at, version)
  on conflict (record_schema, record_table, record_id) do update
     set record_type = excluded.record_type, title = excluded.title,
         secondary = excluded.secondary, search_text = excluded.search_text,
         link_path = excluded.link_path, site_id = excluded.site_id,
         project_id = excluded.project_id,
         record_owner_user_id = excluded.record_owner_user_id,
         data_class = excluded.data_class, projection_version = excluded.projection_version,
         normalization_version = excluded.normalization_version,
         source_event_at = excluded.source_event_at, updated_at = pg_catalog.now()
  returning id into row_id;

  delete from core.search_posting where search_row_id = row_id;
  insert into core.search_posting (search_row_id, word, record_type, site_id, project_id,
    record_owner_user_id, data_class, normalization_version, projection_version)
  select row_id, w, p_record_type, p_site_id, p_project_id, p_owner_user_id,
    coalesce(p_data_class, 'internal'), version, coalesce(p_projection_version, 1)
    from core.search_words(p_search_text) w;
  return row_id;
end
$$;
comment on function core.index_search_row_bulk(text, text, uuid, text, text, text, text, text,
  uuid, uuid, uuid, text, timestamptz, integer) is
  'Publication only: writes the row and its postings, leaving the buckets and the vocabulary to '
  'the rebuild that follows. Never call it for a single record — its helpers would be stale.';
revoke all on function core.index_search_row_bulk(text, text, uuid, text, text, text, text, text,
  uuid, uuid, uuid, text, timestamptz, integer) from public;
grant execute on function core.index_search_row_bulk(text, text, uuid, text, text, text, text,
  text, uuid, uuid, uuid, text, timestamptz, integer) to geoges_worker;
