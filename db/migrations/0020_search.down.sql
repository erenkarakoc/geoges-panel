-- Reverses 0020_search.sql: the search row, its helpers and their functions.
-- Reverse this migration's role grants too, so a full rollback can drop the runtime roles.
-- Provider extensions themselves remain installed.
revoke usage on schema extensions from geoges_app, geoges_worker;
drop policy search_word_none on core.search_word;
drop policy search_posting_read on core.search_posting;
drop policy search_row_read on core.search_row;

drop function core.search_suggest(text, text[]);
drop function core.search_records(text, text[], integer);
drop function core.remove_search_row(text, text, uuid);
drop function core.index_search_row(text, text, uuid, text, text, text, text, text, uuid, uuid,
                                    uuid, text, timestamptz, integer);
drop function core.can_see_record(text, uuid, uuid, uuid, text);
drop function core.search_words(text);

drop table core.search_posting;
drop table core.search_word;
drop table core.search_row;
delete from core.table_layer where schema_name = 'core'
  and table_name in ('search_row', 'search_posting', 'search_word');
