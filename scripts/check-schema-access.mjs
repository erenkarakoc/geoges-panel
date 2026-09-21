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
      else if (/\.(ts|tsx)$/.test(name) && !/\.test\.tsx?$/.test(name)) scan(path);
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

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
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
  process.exitCode = violations.length ? 1 : 0;
}
