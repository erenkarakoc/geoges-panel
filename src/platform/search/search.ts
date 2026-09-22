/**
 * Search rules that need no database (TASK-0110, ADR-017, D-247, D-266): how a query becomes
 * words, what a projection of a record looks like, and how results are grouped for the palette.
 * The same folding runs here and in the database, so "sogut" finds "Söğüt" either way.
 */

/** Groups the palette shows, in the order SEARCH.md gives them. */
export const RESULT_GROUPS = [
  { type: "project", label: "Projeler ve şantiyeler" },
  { type: "site", label: "Projeler ve şantiyeler" },
  { type: "company", label: "Firmalar" },
  { type: "person", label: "Kişiler" },
  { type: "record", label: "İş kayıtları" },
  { type: "item", label: "Stok ve varlık" },
  { type: "document", label: "Belgeler" },
] as const;

export type ResultGroup = (typeof RESULT_GROUPS)[number]["type"];

/** Results per group in the palette (D-227); the rest wait behind "Tümünü gör". */
export const GROUP_LIMIT = 5;

/** Turkish folding, the same rule as `core.fold_tr` in the database. */
export function foldTr(text: string): string {
  return text
    .replace(/I/g, "ı")
    .replace(/İ/g, "i")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/[çğıöşü]/g, (letter) => "cgiosu"["çğıöşü".indexOf(letter)]);
}

/**
 * The words of a query: folded, split on anything that is not a letter or a digit, short noise
 * dropped. Every one of them has to match the same record (D-247).
 */
export function queryWords(query: string): string[] {
  return [
    ...new Set(
      foldTr(query)
        .split(/[^a-z0-9]+/)
        .filter((word) => word.length >= 2),
    ),
  ];
}

/** A query with nothing to search for: the palette then shows screens and actions only. */
export function isSearchable(query: string): boolean {
  return queryWords(query).length > 0;
}

/** One record as search knows it; the module that owns the record builds this. */
export type SearchProjection = {
  /** `<module>.<table>` of the record. */
  recordType: string;
  title: string;
  secondary?: string | null;
  /** Everything worth searching for, from fields the reader may see (never commercial ones). */
  text: string;
  /** Where the result opens. */
  linkPath: string;
  siteId?: string | null;
  projectId?: string | null;
  ownerUserId?: string | null;
  dataClass?: "general" | "internal" | "commercial" | "sensitive";
};

/** Reads a record as the system and says how it should look in search, or null when it is gone. */
export type SearchProjector = (db: unknown, recordId: string) => Promise<SearchProjection | null>;

/** Projections by `<schema>.<table>`, registered by the module that owns the record. */
export type SearchProjectors = Readonly<Record<string, SearchProjector>>;

export type SearchHit = {
  recordSchema: string;
  recordTable: string;
  recordId: string;
  recordType: string;
  title: string;
  secondary: string | null;
  linkPath: string;
  rank: number;
};

export type SearchResultGroup = {
  type: string;
  label: string;
  hits: SearchHit[];
  /** More than the palette shows; "Tümünü gör" opens the list screen with the same words. */
  hasMore: boolean;
};

const GROUP_LABELS = new Map(RESULT_GROUPS.map((group) => [group.type as string, group.label]));

/**
 * Hits as the palette shows them: grouped by kind, each group in rank order and cut at five,
 * groups in the order of `RESULT_GROUPS` and anything unknown after them.
 */
export function groupHits(hits: readonly SearchHit[], limit = GROUP_LIMIT): SearchResultGroup[] {
  const byKind = new Map<string, SearchHit[]>();
  for (const hit of hits) {
    const kind = hit.recordType.split(".").at(-1) ?? hit.recordType;
    byKind.set(kind, [...(byKind.get(kind) ?? []), hit]);
  }
  const order = [...GROUP_LABELS.keys()];
  return [...byKind.entries()]
    .sort(([a], [b]) => {
      const ai = order.indexOf(a);
      const bi = order.indexOf(b);
      return (
        (ai < 0 ? order.length : ai) - (bi < 0 ? order.length : bi) || a.localeCompare(b, "tr")
      );
    })
    .map(([kind, group]) => ({
      type: kind,
      label: GROUP_LABELS.get(kind) ?? "Diğer kayıtlar",
      hits: group.slice(0, limit),
      hasMore: group.length > limit,
    }));
}
