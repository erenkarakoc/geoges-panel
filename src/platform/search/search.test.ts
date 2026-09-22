import { describe, expect, it } from "vitest";

import { foldTr, groupHits, isSearchable, queryWords, type SearchHit } from "./search";

const hit = (recordType: string, title: string, rank = 1): SearchHit => ({
  recordSchema: recordType.split(".")[0],
  recordTable: recordType.split(".")[1],
  recordId: crypto.randomUUID(),
  recordType,
  title,
  secondary: null,
  linkPath: "/today",
  rank,
});

describe("a query becomes words (ADR-017, D-247)", () => {
  it("folds Turkish letters the same way the database does", () => {
    expect(foldTr("Söğüt İnşaat ÇAĞLAYAN")).toBe("sogut insaat caglayan");
    expect(queryWords("Söğüt  şantiye")).toEqual(["sogut", "santiye"]);
  });

  it("drops noise, keeps numbers and never repeats a word", () => {
    expect(queryWords("A-101 / a101 a101")).toEqual(["a", "101", "a101"].slice(1));
    expect(queryWords("  ")).toEqual([]);
    expect(isSearchable("x")).toBe(false);
    expect(isSearchable("İRS-2026")).toBe(true);
  });
});

describe("what the palette shows (D-227)", () => {
  it("groups by kind in the given order, five each, and says when there are more", () => {
    const hits = [
      hit("doc.document", "Hakediş Ekim.pdf"),
      hit("crm.company", "Söğüt İnşaat"),
      ...Array.from({ length: 6 }, (_, n) => hit("sit.site", `Şantiye ${n}`, 6 - n)),
    ];
    const groups = groupHits(hits);
    expect(groups.map((group) => group.type)).toEqual(["site", "company", "document"]);
    expect(groups[0]).toMatchObject({ label: "Projeler ve şantiyeler", hasMore: true });
    expect(groups[0].hits).toHaveLength(5);
    expect(groups[1]).toMatchObject({ label: "Firmalar", hasMore: false });
    expect(groups[2].label).toBe("Belgeler");
  });

  it("puts a kind nobody named after the known ones", () => {
    const groups = groupHits([hit("zzz.thing", "Deneme"), hit("sit.site", "Şantiye")]);
    expect(groups.map((group) => group.label)).toEqual([
      "Projeler ve şantiyeler",
      "Diğer kayıtlar",
    ]);
  });
});
