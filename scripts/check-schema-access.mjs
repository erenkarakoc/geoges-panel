#!/usr/bin/env node
/**
 * Table ownership check (MODULE_BOUNDARIES section 1 rule 1, TASK-0099, SPIKE-17).
 *
 * Each module owns the database schema named after it (`sit.`, `fin.`, `inv.` …, see the
 * schema documents). No other module may read or write that schema directly; it uses the
 * owner's public queries or events. This scans the string and template literals of every file
 * under src/modules and reports SQL that names another module's schema, or the platform `core`
 * schema. Only SQL-looking strings are scanned, so file names such as "rapor-doc.pdf" are not
 * mistaken for the `doc.` schema. Comments are never scanned.
 *
 * It sees literal strings only: table names assembled at runtime escape it, so Phase 07 also
 * gives each module's data layer a database role limited to its own schema.
 *
 * A second check keeps raw SQL in the data layer (PORTS_AND_SERVICES section 2, TASK-0101):
 * a string that reads as a whole SQL statement may appear only under `src/modules/<code>/data/`
 * and `src/platform/db/`. Which files may import `pg` and `kysely` is an ESLint rule.
 *
 *   node scripts/check-schema-access.mjs      exits 1 on a violation
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";

import { parse } from "@typescript-eslint/parser";

import { MODULE_MAP_PATH, parseModuleMap } from "./module-graph.mjs";

const ROOT = resolve(import.meta.dirname, "..");
const SQL_HINT = /\b(select|insert\s+into|update|delete\s+from|from|join|into|references)\b/i;

export function schemaNames() {
  const codes = [...parseModuleMap(readFileSync(MODULE_MAP_PATH, "utf8")).modules.keys()].map((c) =>
    c.toLowerCase(),
  );
  return [...codes, "core"];
}

function literals(source, filePath) {
  // JSX only for .tsx files: in .ts files `<T>(x) => …` is a type parameter, not markup.
  const ast = parse(source, {
    ecmaVersion: "latest",
    sourceType: "module",
    jsx: filePath.endsWith(".tsx"),
  });
  const out = [];
  const visit = (node) => {
    if (!node || typeof node.type !== "string") return;
    if (node.type === "Literal" && typeof node.value === "string") out.push(node.value);
    if (node.type === "TemplateElement") out.push(node.value.cooked ?? node.value.raw);
    for (const key of Object.keys(node)) {
      if (key === "parent") continue;
      const value = node[key];
      if (Array.isArray(value)) value.forEach(visit);
      else if (value && typeof value === "object") visit(value);
    }
  };
  visit(ast);
  return out;
}

/** Violations under `<root>/src/modules`: SQL naming a schema other than the file's own module. */
export function findSchemaViolations(root = ROOT, schemas = schemaNames()) {
  const pattern = new RegExp(`\\b(${schemas.join("|")})\\.([a-z_][a-z0-9_]*)\\b`, "g");
  const base = join(root, "src", "modules");
  const violations = [];
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) walk(path);
      else if (/\.(ts|tsx)$/.test(name) && !/\.(test|dbtest)\.tsx?$/.test(name)) scan(path);
    }
  };
  const scan = (file) => {
    const owner = relative(base, file).split(sep)[0];
    for (const text of literals(readFileSync(file, "utf8"), file)) {
      if (!SQL_HINT.test(text)) continue;
      for (const m of text.matchAll(pattern)) {
        if (m[1] !== owner)
          violations.push({
            file: relative(root, file).split(sep).join("/"),
            owner,
            schema: m[1],
            table: m[2],
          });
      }
    }
  };
  walk(base);
  return violations;
}

// Every product table lives in a module schema, so a real statement names `schema.table`; that
// keeps sentences such as "Select a site from the list" out.
const TABLE = String.raw`"?[a-z_]\w*"?\."?[a-z_]\w*`;
const SQL_STATEMENT = new RegExp(
  String.raw`^\s*(select\s[\s\S]*?\sfrom\s+${TABLE}|insert\s+into\s+${TABLE}|update\s+${TABLE}\s+set\s|delete\s+from\s+${TABLE}|with\s+\w+\s+as\s*\(|(create|alter|drop)\s+(table|schema|policy|function|role|index)\s)`,
  "i",
);
const SQL_HOMES = [/^src\/modules\/[^/]+\/data\//, /^src\/platform\/db\//];

/** Files outside the data layer holding a string that reads as a whole SQL statement. */
export function findMisplacedSql(root = ROOT) {
  const found = [];
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) walk(path);
      else if (/\.(ts|tsx)$/.test(name) && !/\.(test|dbtest)\.tsx?$/.test(name)) scan(path);
    }
  };
  const scan = (file) => {
    const rel = relative(root, file).split(sep).join("/");
    if (SQL_HOMES.some((home) => home.test(rel))) return;
    const statement = literals(readFileSync(file, "utf8"), file).find((t) => SQL_STATEMENT.test(t));
    if (statement) found.push({ file: rel, statement: statement.trim().slice(0, 60) });
  };
  walk(join(root, "src"));
  return found;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const misplaced = findMisplacedSql();
  for (const m of misplaced) {
    console.error(
      `${m.file}\n  raw SQL outside the data layer: "${m.statement}"\n  fix: move it to src/modules/<code>/data/ (PORTS_AND_SERVICES section 2)`,
    );
  }
  const violations = findSchemaViolations();
  for (const v of violations) {
    console.error(
      `${v.file}\n  module ${v.owner} reads or writes ${v.schema}.${v.table}, which belongs to ${v.schema}\n  fix: use the owner's public query or event (MODULE_BOUNDARIES section 3)`,
    );
  }
  console.log(
    violations.length
      ? `schema access: ${violations.length} violation(s)`
      : "schema access OK — no module touches another module's schema",
  );
  console.log(
    misplaced.length
      ? `sql location: ${misplaced.length} violation(s)`
      : "sql location OK — raw SQL only in data layers",
  );
  process.exitCode = violations.length || misplaced.length ? 1 : 0;
}
