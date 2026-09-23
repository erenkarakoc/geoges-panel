-- Reverses 0031: search_suggest as 0029 left it, comparing trigrams for every word.
create or replace function core.search_suggest(p_word text, p_types text[] DEFAULT NULL::text[])
 RETURNS text
 LANGUAGE plpgsql
 STABLE
 SET search_path TO ''
AS $function$
declare result text;
begin
  perform core.assert_search_normalization(p_types);
  select p.word into result
    from core.search_posting p
   where (p_types is null or p.record_type = any (p_types))
     and p.normalization_version = core.search_normalization_version()
     and p.word operator(extensions.%) core.fold_tr(p_word)
   group by p.word
   order by extensions.similarity(p.word, core.fold_tr(p_word)) desc, count(*) desc
   limit 1;
  return result;
end
$function$
;
