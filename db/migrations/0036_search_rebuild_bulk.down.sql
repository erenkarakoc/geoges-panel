-- The publication goes back to the per-record writer. Revert the application code first, or the
-- rebuild will call a function that no longer exists.
drop function core.index_search_row_bulk(text, text, uuid, text, text, text, text, text,
  uuid, uuid, uuid, text, timestamptz, integer);
