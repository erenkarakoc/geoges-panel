-- 0031 — a spelling suggestion is only looked for when the word is missing (TASK-0110, D-248).
--
-- Measured at 2,000 records: one palette request took 686 ms on the server, and 385 ms of that
-- was `core.search_suggest` — for a word the index already holds. It compares trigrams against
-- `core.search_posting`, which carries no trigram index (the vocabulary's index cannot be used
-- here: `core.search_word` is closed to the application role, so a suggestion would leak words
-- from places the person may not see). The comparison therefore reads every posting the person
-- may read, and grows with the archive.
--
-- A word the person can already find needs no correction, so the function now asks that first,
-- through the `(word, record_type)` index, and stops. The slow comparison stays for the case it
-- was written for — a misspelling — where it is the only way to answer and runs once.

create or replace function core.search_suggest(p_word text, p_types text[] default null)
returns text
language plpgsql stable
set search_path = ''
as $$
declare
  folded text;
  result text;
begin
  perform core.assert_search_normalization(p_types);
  folded := core.fold_tr(p_word);
  -- Row level security still decides: a word that exists only in records this person may not
  -- read is not "found" here, and the comparison below runs as before.
  perform 1
     from core.search_posting p
    where p.word = folded
      and (p_types is null or p.record_type = any (p_types))
      and p.normalization_version = core.search_normalization_version()
    limit 1;
  if found then
    return folded;
  end if;

  select p.word into result
    from core.search_posting p
   where (p_types is null or p.record_type = any (p_types))
     and p.normalization_version = core.search_normalization_version()
     and p.word operator(extensions.%) folded
   group by p.word
   order by extensions.similarity(p.word, folded) desc, count(*) desc
   limit 1;
  return result;
end
$$;
