import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { moduleCapabilities } from "@/records/capabilities";
import { capabilityCodes, type ModuleCapabilities } from "@/platform/capabilities/catalog";
import {
  dataClassOf,
  declarationAgainstRecord,
  eventsAgainstReality,
  snapshotAgainstNow,
  type PublishedCapability,
  type WrittenCatalog,
} from "@/platform/capabilities/contract";

/**
 * The contract test CI.md has promised since Phase 05 (TASK-0118, REQ-WFL-004, D-280).
 *
 * The catalogs are imported rather than read as text: a declaration carries the function that runs
 * it, so "declared but not implemented" is a compile error and never reaches here. What is left is
 * what a compiler cannot see — the record, the database and the repository's own memory.
 */

const root = process.cwd();
// The composition root's own list, which is what the engine will read (ADR-001: platform may not
// import a module, so the catalogs are joined here and the contract is checked here too).
const catalogs: readonly ModuleCapabilities[] = moduleCapabilities;

/** Reads a module's written catalog out of its requirements file. */
function writtenCatalog(module: string): WrittenCatalog {
  const text = readFileSync(path.join(root, "docs", "requirements", `REQ-${module}.md`), "utf8");
  const start = text.indexOf("## Yetenek kataloğu");
  const section = start === -1 ? "" : text.slice(start);
  const rowsOf = (heading: string) => {
    const from = section.indexOf(`### ${heading}`);
    if (from === -1) return [];
    const rest = section.slice(from + heading.length);
    const until = rest.indexOf("\n### ");
    return (until === -1 ? rest : rest.slice(0, until))
      .split("\n")
      .filter((line) => line.trimStart().startsWith("| `"))
      .map((line) => {
        const cells = line
          .split("|")
          .slice(1, -1)
          .map((c) => c.trim());
        return {
          code: cells[0].replaceAll("`", "").trim(),
          name: cells[1] ?? "",
          dataClass: dataClassOf(cells.at(-1) ?? ""),
        };
      });
  };
  return {
    module,
    events: rowsOf("Olaylar"),
    actions: rowsOf("Aksiyonlar"),
    conditions: rowsOf("Koşul alanları"),
  };
}

/** Every event code the code really publishes, from the migrations that publish them. */
function publishedEvents(): string[] {
  const dir = path.join(root, "db", "migrations");
  const codes = new Set<string>();
  for (const file of readdirSync(dir)) {
    if (!file.endsWith(".sql") || file.endsWith(".down.sql")) continue;
    const text = readFileSync(path.join(dir, file), "utf8");
    for (const match of text.matchAll(/publish_event\(\s*'([a-z_]+\.[a-z_]+)'/g)) {
      codes.add(match[1]);
    }
  }
  return [...codes].sort();
}

const snapshotPath = path.join(root, "src", "records", "published-capabilities.json");

function nowPublished(): PublishedCapability[] {
  return catalogs
    .flatMap((catalog) =>
      capabilityCodes(catalog).map((c) => ({
        module: catalog.module,
        kind: c.kind,
        code: c.code,
      })),
    )
    .sort((a, b) => a.code.localeCompare(b.code) || a.kind.localeCompare(b.kind));
}

describe("capability names for the screens", () => {
  it("follow the requirements' written catalogs", async () => {
    const { capabilityNamesText, CAPABILITY_NAMES_PATH } =
      await import("../../scripts/capability-names.mjs");
    const onDisk = readFileSync(CAPABILITY_NAMES_PATH, "utf8").replaceAll("\r\n", "\n");
    // Behind the requirements: run `node scripts/capability-names.mjs` and commit the file.
    expect(onDisk).toBe(capabilityNamesText());
  });
});

describe("capability contract (REQ-WFL-004)", () => {
  it("declares something to check", () => {
    expect(catalogs.flatMap((c) => capabilityCodes(c)).length).toBeGreaterThan(20);
  });

  it("matches each module's own written catalog", () => {
    const problems = catalogs.flatMap((catalog) =>
      declarationAgainstRecord(catalog, writtenCatalog(catalog.module)),
    );
    expect(problems).toEqual([]);
  });

  it("declares every event the code publishes, and publishes every event it declares", () => {
    expect(eventsAgainstReality(catalogs, publishedEvents())).toEqual([]);
  });

  it("never loses a capability that was published before", () => {
    const now = nowPublished();
    if (!existsSync(snapshotPath)) {
      writeFileSync(snapshotPath, `${JSON.stringify(now, null, 2)}\n`, "utf8");
    }
    const snapshot = JSON.parse(readFileSync(snapshotPath, "utf8")) as PublishedCapability[];
    expect(snapshotAgainstNow(snapshot, now)).toEqual([]);
  });

  it("remembers everything it has now, so the snapshot is never behind the code", () => {
    const snapshot = JSON.parse(readFileSync(snapshotPath, "utf8")) as PublishedCapability[];
    const missing = nowPublished().filter(
      (c) => !snapshot.some((s) => s.code === c.code && s.kind === c.kind),
    );
    expect(missing.map((c) => `${c.kind} ${c.code}`)).toEqual([]);
  });
});

/**
 * The checks above pass. These are the same rules against declarations that break them on
 * purpose, so a green run means the rules can still fail.
 */
describe("the contract's rules can fail", () => {
  const written: WrittenCatalog = {
    module: "TSK",
    events: [{ code: "task.created", name: "Görev oluştu", dataClass: "internal" }],
    actions: [],
    conditions: [],
  };
  const catalog = (events: ModuleCapabilities["events"]): ModuleCapabilities => ({
    module: "TSK",
    events,
    actions: [],
    conditions: [],
    relations: [],
  });
  const event = {
    code: "task.created",
    name: "Görev oluştu",
    when: "…",
    carries: [],
    dataClass: "internal" as const,
  };

  it("catches a capability the record has never heard of", () => {
    const problems = declarationAgainstRecord(
      catalog([{ ...event, code: "task.invented" }]),
      written,
    );
    expect(problems).toEqual([
      'TSK: event "task.invented" is declared in code and not in the module\'s written catalog',
    ]);
  });

  it("catches a name and a data class that drifted from the record", () => {
    const problems = declarationAgainstRecord(
      catalog([{ ...event, name: "Başka bir ad", dataClass: "commercial" }]),
      written,
    );
    expect(problems).toHaveLength(2);
    expect(problems[0]).toContain("is named");
    expect(problems[1]).toContain("commercial in code and internal in the record");
  });

  it("catches an event nobody publishes and one nobody declares", () => {
    expect(eventsAgainstReality([catalog([event])], ["task.somebody_elses"])).toEqual([
      'TSK: event "task.created" is declared but never published',
      'event "task.somebody_elses" is published but no module declares it',
    ]);
  });

  it("lets a deprecated event stop being published", () => {
    expect(eventsAgainstReality([catalog([{ ...event, status: "deprecated" }])], [])).toEqual([]);
  });

  it("catches a published capability that disappeared or changed kind", () => {
    const was: PublishedCapability[] = [
      { module: "TSK", kind: "event", code: "task.created" },
      { module: "TSK", kind: "action", code: "task.open" },
    ];
    expect(snapshotAgainstNow(was, [{ module: "TSK", kind: "event", code: "task.open" }])).toEqual([
      'TSK: "task.created" was published and is gone; mark it deprecated instead (REQ-WFL-004)',
      'TSK: "task.open" was published as a action and is now a event',
    ]);
  });
});
