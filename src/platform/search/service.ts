import "server-only";

import { searchPalette, readRecentSearchRecords } from "@/platform/db/search-store";
import {
  groupHits,
  isSearchable,
  isPanelPath,
  searchListHref,
  type SearchResultGroup,
  type SearchTypeDefinition,
} from "@/platform/search/search";

export type DbIdentity = Parameters<typeof searchPalette>[0];
export type SearchAnswer = {
  groups: SearchResultGroup[];
  corrected: string | null;
  failedGroups: { type: string; label: string }[];
};

/** One bounded query per visible kind, so a popular kind cannot consume the others' five slots. */
export async function searchFor(
  identity: DbIdentity,
  query: string,
  definitions?: readonly SearchTypeDefinition[],
): Promise<SearchAnswer> {
  if (!isSearchable(query) || definitions?.length === 0)
    return { groups: [], corrected: null, failedGroups: [] };
  const result = await searchPalette(
    identity,
    query,
    definitions?.map((entry) => entry.type),
  );
  const types = definitions?.map((entry) => entry.type) ?? [
    ...new Set(result.hits.map((hit) => hit.recordType)),
  ];
  const groups: SearchResultGroup[] = [];
  for (const type of types) {
    const definition = definitions?.find((entry) => entry.type === type);
    const group = groupHits(result.hits.filter((hit) => hit.recordType === type))[0];
    if (!group) continue;
    groups.push({
      ...group,
      type,
      label: definition?.label ?? group.label,
      ...(definition ? { listHref: searchListHref(definition, query) } : {}),
    });
  }
  return {
    groups,
    corrected: result.corrected,
    failedGroups: result.failedTypes.map((type) => ({
      type,
      label: definitions?.find((entry) => entry.type === type)?.label ?? "Kayıtlar",
    })),
  };
}
export async function recentSearchFor(
  identity: DbIdentity,
  paths: readonly string[],
  definitions: readonly SearchTypeDefinition[],
): Promise<SearchAnswer> {
  const safePaths = [...new Set(paths.filter(isPanelPath))].slice(0, 5);
  const hits =
    safePaths.length && definitions.length
      ? await readRecentSearchRecords(
          identity,
          safePaths,
          definitions.map((entry) => entry.type),
        )
      : [];
  return {
    groups: hits.length ? [{ type: "recent", label: "Son açılanlar", hits, hasMore: false }] : [],
    corrected: null,
    failedGroups: [],
  };
}
