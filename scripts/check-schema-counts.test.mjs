import { describe, expect, it } from "vitest";
import { checkSchemaCounts } from "./check-schema-counts.mjs";

const documents = new Map([
  ["SCHEMA-A.md", "| `core.search_row` | description |\n| `core.search_word` | description |"],
  ["SCHEMA-B.md", "| `iam.user` | description |"],
]);
const coverage = "| `core` | 2 | search |\n| `iam` | 1 | identity |\n| **Toplam** | **3** |";

describe("schema coverage inventory", () => {
  it("accepts matching definitions and counts", () => {
    expect(checkSchemaCounts(documents, coverage)).toEqual([]);
  });
  it("rejects a stale total even when per-schema counts match", () => {
    expect(checkSchemaCounts(documents, coverage.replace("**3**", "**2**"))).toContain(
      "Coverage total must equal 3 defined tables",
    );
  });
  it("rejects a moved table hidden by an unchanged total", () => {
    expect(
      checkSchemaCounts(
        documents,
        coverage.replace("| 2 |", "| 1 |").replace("| `iam` | 1 |", "| `iam` | 2 |"),
      ),
    ).toHaveLength(2);
  });
  it("rejects missing and phantom schemas", () => {
    expect(checkSchemaCounts(documents, coverage.replace("`iam`", "`doc`"))).toHaveLength(2);
  });
  it("rejects duplicate table definitions", () => {
    const duplicate = new Map(documents);
    duplicate.set("SCHEMA-C.md", "| `iam.user` | duplicate |");
    expect(checkSchemaCounts(duplicate, coverage)[0]).toContain("Duplicate table definition");
  });
  it("rejects duplicate or absent coverage rows and totals", () => {
    expect(checkSchemaCounts(documents, coverage + "\n| `core` | 2 | copy |")[0]).toContain(
      "Duplicate coverage schema",
    );
    expect(checkSchemaCounts(documents, coverage + "\n| **Toplam** | **3** |")[0]).toContain(
      "Coverage total",
    );
    expect(checkSchemaCounts(documents, coverage.split("\n").slice(0, 2).join("\n"))[0]).toContain(
      "Coverage total",
    );
  });
});
