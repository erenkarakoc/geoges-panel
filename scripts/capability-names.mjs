#!/usr/bin/env node
/**
 * The Turkish name of every capability the requirements define, built or not (owner 2026-09-26).
 *
 * A module's code catalog (`src/modules/<m>/capabilities.ts`) holds only what is built. The flow
 * templates are written for the whole company, so they already name events and fields of modules
 * that come in later slices — `daily_site_log.submitted`, `daily_site_log.expense_total` — and a
 * screen that only knew the built catalogs showed those as codes. The written catalogs at the end of
 * each `docs/requirements/REQ-<M>.md` are the one place every name lives (D-078); this reads them
 * into `src/records/capability-names.json`, which the screens read. The capability contract test
 * fails when the file is behind the requirements.
 *
 *   node scripts/capability-names.mjs      writes the file
 */
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = resolve(import.meta.dirname, "..");
export const CAPABILITY_NAMES_PATH = join(ROOT, "src", "records", "capability-names.json");

const KINDS = [
  ["Olaylar", "event"],
  ["Aksiyonlar", "action"],
  ["Koşul alanları", "condition"],
];

/** Every row of every written catalog: `{ module, kind, code, name }`, sorted by code. */
export function readCapabilityNames(root = ROOT) {
  const dir = join(root, "docs", "requirements");
  const rows = [];
  for (const file of readdirSync(dir).sort()) {
    const match = /^REQ-([A-Z]+)\.md$/.exec(file);
    if (!match) continue;
    const text = readFileSync(join(dir, file), "utf8").replaceAll("\r\n", "\n");
    const start = text.indexOf("## Yetenek kataloğu");
    if (start === -1) continue;
    const section = text.slice(start);
    for (const [heading, kind] of KINDS) {
      const from = section.indexOf(`### ${heading}`);
      if (from === -1) continue;
      const rest = section.slice(from + heading.length + 4);
      const until = rest.indexOf("\n### ");
      for (const line of (until === -1 ? rest : rest.slice(0, until)).split("\n")) {
        if (!line.trimStart().startsWith("| `")) continue;
        const cells = line
          .split("|")
          .slice(1, -1)
          .map((cell) => cell.trim());
        rows.push({
          module: match[1],
          kind,
          code: cells[0].replaceAll("`", "").trim(),
          name: cells[1] ?? "",
        });
      }
    }
  }
  return rows.sort((a, b) => a.code.localeCompare(b.code) || a.kind.localeCompare(b.kind));
}

export function capabilityNamesText(root = ROOT) {
  return `${JSON.stringify(readCapabilityNames(root), null, 2)}\n`;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  writeFileSync(CAPABILITY_NAMES_PATH, capabilityNamesText(), "utf8");
  console.log(`capability names written — ${readCapabilityNames().length} rows`);
}
