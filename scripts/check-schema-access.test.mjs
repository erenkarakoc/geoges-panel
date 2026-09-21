import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { findMisplacedSql, findSchemaViolations } from "./check-schema-access.mjs";

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

describe("raw SQL stays in the data layer (TASK-0101)", () => {
  it("finds a SQL statement in a route or a module's application folder", () => {
    const found = findMisplacedSql(
      project({
        "src/app/(app)/x/page.tsx": "export const q = `select id from sit.site where id = $1`;\n",
        "src/modules/sit/application/a.ts": "export const q = 'update sit.site set name = $1';\n",
        "src/modules/sit/data/ok.ts": "export const q = 'select * from sit.site';\n",
        "src/platform/db/ok.ts": "export const q = 'select set_config($1, $2, true) from x.y';\n",
      }),
    );
    expect(found.map((f) => f.file).sort()).toEqual([
      "src/app/(app)/x/page.tsx",
      "src/modules/sit/application/a.ts",
    ]);
  });

  it("does not mistake ordinary Turkish or English text for SQL", () => {
    expect(
      findMisplacedSql(
        project({
          "src/modules/sit/ui/t.tsx":
            "export const a = 'Listeden bir şantiye seçin';\nexport const b = 'Select a site from the list';\nexport const c = 'update available';\n",
        }),
      ),
    ).toEqual([]);
  });

  it("finds nothing in the real repository", () => {
    expect(findMisplacedSql()).toEqual([]);
  });
});
