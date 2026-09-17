import { describe, expect, it } from "vitest";

import { foldSearchText, matchesSearch } from "@/platform/navigation/search-text";

describe("foldSearchText", () => {
  it("lower-cases the Turkish way and drops Turkish letters", () => {
    expect(foldSearchText("İK")).toBe("ik");
    expect(foldSearchText("Şantiye Kaydı")).toBe("santiye kaydi");
    expect(foldSearchText("Görevler ÇĞÜ")).toBe("gorevler cgu");
  });
});

describe("matchesSearch", () => {
  it("finds labels typed without Turkish characters", () => {
    expect(matchesSearch("Görevler", "gorev")).toBe(true);
    expect(matchesSearch("Satın Alma", "satin")).toBe(true);
    expect(matchesSearch("İK", "ik")).toBe(true);
  });

  it("matches every word in any order", () => {
    expect(matchesSearch("Talepler & Müşteriler", "musteri talep")).toBe(true);
    expect(matchesSearch("Talepler & Müşteriler", "musteri teklif")).toBe(false);
  });

  it("matches everything for an empty query", () => {
    expect(matchesSearch("Stok", "")).toBe(true);
  });
});
