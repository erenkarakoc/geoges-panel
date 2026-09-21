import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { compareRows, rowText, validateExport } from "./config-transfer.mjs";
import { confirmed } from "./db-admin.mjs";
import { dependencyOrder, layerProblems, readSqlFolder } from "./db-layers.mjs";
import { RESET_LAYERS } from "./db-reset.mjs";

const state = (layers, references = [], withoutKey = []) => ({
  tables: Object.keys(layers),
  registered: new Map(Object.entries(layers)),
  references,
  primaryKeys: new Set(Object.keys(layers).filter((t) => !withoutKey.includes(t))),
});

describe("table layer rules (TASK-0076)", () => {
  it("accepts registered tables with references in allowed directions", () => {
    const s = state({ "adm.catalog": "seed", "wfl.flow": "config", "sit.site": "business" }, [
      { from: "wfl.flow", to: "adm.catalog" },
      { from: "sit.site", to: "wfl.flow" },
      { from: "sit.site", to: "adm.catalog" },
    ]);
    expect(layerProblems(s)).toEqual([]);
  });

  it("reports an unregistered table", () => {
    const s = state({ "sit.site": "business" });
    s.tables.push("sit.daily_log");
    expect(layerProblems(s)).toEqual([
      "sit.daily_log has no layer; register it in core.table_layer",
    ]);
  });

  it("reports a registered table that no longer exists", () => {
    const s = state({ "sit.site": "business" });
    s.registered.set("sit.gone", "business");
    expect(layerProblems(s)).toEqual(["sit.gone is registered but does not exist"]);
  });

  it.each([
    ["config", "business"],
    ["seed", "config"],
    ["seed", "business"],
    ["system", "config"],
  ])("forbids %s data pointing at %s data", (a, b) => {
    const s = state({ "x.a": a, "x.b": b }, [{ from: "x.a", to: "x.b" }]);
    expect(layerProblems(s)).toEqual([`x.a (${a}) must not reference x.b (${b})`]);
  });

  it("requires a primary key on configuration and factory tables", () => {
    const s = state({ "wfl.flow": "config", "sit.log": "business" }, [], ["wfl.flow", "sit.log"]);
    expect(layerProblems(s)).toEqual(["wfl.flow is config data and needs a primary key"]);
  });
});

describe("dependency order (TASK-0076)", () => {
  it("puts referenced tables first and ignores self-references", () => {
    const order = dependencyOrder(
      ["wfl.step", "wfl.flow", "adm.catalog"],
      [
        { from: "wfl.step", to: "wfl.flow" },
        { from: "wfl.flow", to: "adm.catalog" },
        { from: "wfl.step", to: "wfl.step" },
        { from: "wfl.flow", to: "iam.role" },
      ],
    );
    expect(order).toEqual(["adm.catalog", "wfl.flow", "wfl.step"]);
  });

  it("refuses a cycle", () => {
    expect(() =>
      dependencyOrder(
        ["a.x", "a.y"],
        [
          { from: "a.x", to: "a.y" },
          { from: "a.y", to: "a.x" },
        ],
      ),
    ).toThrow(/cycle/);
  });
});

describe("configuration import comparison (TASK-0076)", () => {
  const key = ["id"];

  it("adds missing rows, skips identical ones and reports differing ones", () => {
    const result = compareRows(
      [
        { id: 1, name: "a" },
        { id: 2, name: "b" },
        { id: 3, name: "c" },
      ],
      [
        { name: "a", id: 1 },
        { id: 2, name: "B" },
      ],
      key,
    );
    expect(result).toEqual({ add: [{ id: 3, name: "c" }], conflicts: ["[2]"], same: 1 });
  });

  it("compares only the columns the file carries", () => {
    expect(compareRows([{ id: 1, name: "a" }], [{ id: 1, name: "a", extra: 5 }], key).same).toBe(1);
  });

  it("does not depend on key order", () => {
    expect(rowText({ a: 1, b: 2 })).toBe(rowText({ b: 2, a: 1 }));
  });

  it("rejects files that are not configuration exports", () => {
    expect(() => validateExport({ format: "other" })).toThrow(/dışa aktarımı değil/);
    expect(() => validateExport({ format: "geoges-config", version: 9 })).toThrow(/sürümü 9/);
    expect(() => validateExport({ format: "geoges-config", version: 1, tables: {} })).toThrow(
      /göç sürümü/,
    );
  });
});

describe("reset commands (TASK-0076)", () => {
  it("empty business data only, or configuration and factory data too", () => {
    expect(RESET_LAYERS.data).toEqual(["business"]);
    expect([...RESET_LAYERS.config].sort()).toEqual(["business", "config", "seed"]);
    expect(Object.values(RESET_LAYERS).flat()).not.toContain("system");
  });

  it("take confirmation from the flag, and say no without a keyboard", async () => {
    const noKeyboard = { isTTY: false };
    expect(await confirmed("SIFIRLA", ["--onay=SIFIRLA"], noKeyboard)).toBe(true);
    expect(await confirmed("SIFIRLA", ["--onay=evet"], noKeyboard)).toBe(false);
    expect(await confirmed("SIFIRLA", [], noKeyboard)).toBe(false);
  });
});

describe("seed and sample folders (TASK-0076)", () => {
  let dir;
  afterEach(() => dir && rmSync(dir, { recursive: true, force: true }));

  it("reads numbered SQL files in order and ignores everything else", () => {
    dir = mkdtempSync(join(tmpdir(), "seeds-"));
    for (const name of ["0002_b.sql", "0001_a.sql", ".gitkeep", "notes.md"])
      writeFileSync(join(dir, name), name);
    expect(readSqlFolder(dir).map((f) => f.name)).toEqual(["0001_a.sql", "0002_b.sql"]);
    expect(readSqlFolder(join(dir, "missing"))).toEqual([]);
  });
});
