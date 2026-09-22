import "server-only";

import { searchRecords, suggestWord } from "@/platform/db/search-store";
import {
  groupHits,
  isSearchable,
  queryWords,
  type SearchResultGroup,
} from "@/platform/search/search";

/**
 * The search a screen asks for (TASK-0110, REQ-NFR-012, D-266). Everything is read as the
 * person, so a record they may not see is in no result and in no count. When their own words
 * find nothing, the nearest words their own records use are tried once, and the answer says
 * which words were used instead. The query is never written to a log.
 */

export type DbIdentity = Parameters<typeof searchRecords>[0];

export type SearchAnswer = {
  groups: SearchResultGroup[];
  /** The words actually searched for, when they are not the ones that were typed. */
  corrected: string | null;
};

/** How many hits are fetched before grouping; each group then shows its best five. */
const FETCH_LIMIT = 50;

export async function searchFor(identity: DbIdentity, query: string): Promise<SearchAnswer> {
  if (!isSearchable(query)) return { groups: [], corrected: null };

  const hits = await searchRecords(identity, query, { limit: FETCH_LIMIT });
  if (hits.length > 0) return { groups: groupHits(hits), corrected: null };

  const words = queryWords(query);
  const nearest = await Promise.all(words.map((word) => suggestWord(identity, word)));
  const corrected = words.map((word, n) => nearest[n] ?? word);
  if (corrected.join(" ") === words.join(" ")) return { groups: [], corrected: null };

  const second = await searchRecords(identity, corrected.join(" "), { limit: FETCH_LIMIT });
  return {
    groups: groupHits(second),
    corrected: second.length > 0 ? corrected.join(" ") : null,
  };
}
