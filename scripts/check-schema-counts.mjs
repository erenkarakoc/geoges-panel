/** Compare documented table definitions with the current coverage inventory. */
export function checkSchemaCounts(documents, coverage) {
  const tables = new Map();
  const actual = new Map();
  const errors = [];
  for (const [file, content] of documents) {
    for (const match of content.matchAll(/^\| `([a-z]+)\.([a-z_]+)` \|/gm)) {
      const table = `${match[1]}.${match[2]}`;
      if (tables.has(table)) {
        errors.push(`Duplicate table definition: ${table} (${file})`);
        continue;
      }
      tables.set(table, file);
      actual.set(match[1], (actual.get(match[1]) ?? 0) + 1);
    }
  }
  const declared = new Map();
  for (const match of coverage.matchAll(/^\| `([a-z]+)` \| (\d+) \|/gm)) {
    if (declared.has(match[1])) {
      errors.push(`Duplicate coverage schema: ${match[1]}`);
    }
    declared.set(match[1], Number(match[2]));
  }
  for (const schema of new Set([...actual.keys(), ...declared.keys()])) {
    if (actual.get(schema) !== declared.get(schema)) {
      errors.push(
        `Schema ${schema}: definitions=${actual.get(schema) ?? "missing"}, coverage=${declared.get(schema) ?? "missing"}`,
      );
    }
  }
  const totals = [...coverage.matchAll(/^\| \*\*Toplam\*\* \| \*\*(\d+)\*\* \|/gm)];
  if (totals.length !== 1 || Number(totals[0][1]) !== tables.size) {
    errors.push(`Coverage total must equal ${tables.size} defined tables`);
  }
  return errors;
}
