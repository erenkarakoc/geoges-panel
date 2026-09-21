import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { findSchemaViolations } from "./check-schema-access.mjs";

const SCHEMAS = ["sit", "fin", "doc", "core"];
let root;

function project(files) {
  root = mkdtempSync(join(tmpdir(), "schema-access-"));
  for (const [path, content] of Object.entries(files)) {
    const full = join(root, path);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, content);
  }
  return root;
}

afterEach(() => {
  if (root) rmSync(root, { recursive: true, force: true });
  root = undefined;
});

describe("table ownership check (TASK-0099)", () => {
  it("finds a module reading another module's schema, template strings included", () => {
    const found = findSchemaViolations(
      project({
        "src/modules/fin/data/progress.ts":
          "export const q = `select qty from sit.daily_site_log where site_id = $1`;\n",
      }),
      SCHEMAS,
    );
    expect(found).toEqual([
      {
        file: "src/modules/fin/data/progress.ts",
        owner: "fin",
        schema: "sit",
        table: "daily_site_log",
      },
    ]);
  });

  it("allows a module its own schema", () => {
    expect(
      findSchemaViolations(
        project({
          "src/modules/sit/data/q.ts": "export const q = 'select * from sit.daily_site_log';\n",
        }),
        SCHEMAS,
      ),
    ).toEqual([]);
  });

  it("forbids the platform core schema to modules", () => {
    const found = findSchemaViolations(
      project({
        "src/modules/sit/data/q.ts":
          "export const q = 'insert into core.outbox (event_code) values ($1)';\n",
      }),
      SCHEMAS,
    );
    expect(found.map((v) => v.schema)).toEqual(["core"]);
  });

  it("ignores comments and strings that are not SQL, such as file names", () => {
    const found = findSchemaViolations(
      project({
        "src/modules/fin/ui/x.ts":
          "// select * from sit.daily_site_log\nexport const f = 'rapor-doc.pdf';\nexport const t = 'Bu metin sit.daily_site_log adını anar';\n",
      }),
      SCHEMAS,
    );
    expect(found).toEqual([]);
  });

  it("finds nothing in the real repository", () => {
    expect(findSchemaViolations()).toEqual([]);
  });
});
