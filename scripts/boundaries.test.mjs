/**
 * The ADR-001 boundary rule, exercised through the real eslint.config.mjs (TASK-0099).
 *
 * A clean lint run cannot tell a working rule from a rule that allows everything, so each
 * case lints a probe snippet at a path inside `src/` and asserts the rule's verdict. The
 * probes import real files, so the resolver behaves exactly as it does for product code.
 * Cases mirror SPIKE-17.
 */
import { resolve } from "node:path";

import { ESLint } from "eslint";
import { beforeAll, describe, expect, it } from "vitest";

const ROOT = resolve(import.meta.dirname, "..");
let eslint;

beforeAll(() => {
  eslint = new ESLint({ cwd: ROOT });
});

async function verdict(filePath, code) {
  const [result] = await eslint.lintText(code, { filePath: resolve(ROOT, filePath) });
  const boundary = result.messages.filter((m) => m.ruleId === "boundaries/dependencies");
  const parse = result.messages.filter((m) => m.fatal);
  expect(parse).toEqual([]);
  return boundary.length ? "block" : "allow";
}

// Every business module may use the platform modules; platform modules have no arrows to each
// other in MODULE_MAP yet, so such a dependency needs an arrow in the map first.
const cases = [
  [
    "a business module uses a platform module through index.ts",
    "src/modules/rpt/domain/probe.ts",
    "import { readAuthSession } from '@/modules/iam';\nexport const p = readAuthSession;\n",
    "allow",
  ],
  [
    "a module uses its own internal files",
    "src/modules/iam/domain/probe.ts",
    "import { signInRoute } from '../application/auth-routing';\nexport const p = signInRoute;\n",
    "allow",
  ],
  [
    "a module reaches into another module's internal folder",
    "src/modules/rpt/domain/probe.ts",
    "import { signInRoute } from '@/modules/iam/application/auth-routing';\nexport const p = signInRoute;\n",
    "block",
  ],
  [
    "a module reaches into another module's ui folder",
    "src/modules/rpt/domain/probe.ts",
    "import { siteSections } from '@/modules/sit/ui/site-context';\nexport const p = siteSections;\n",
    "block",
  ],
  [
    "a relative path bypass",
    "src/modules/rpt/domain/probe.ts",
    "import { signInRoute } from '../../iam/application/auth-routing';\nexport const p = signInRoute;\n",
    "block",
  ],
  [
    "a type-only import of internals",
    "src/modules/rpt/domain/probe.ts",
    "import type { AuthSession } from '@/modules/iam/domain/auth-provider';\nexport type P = AuthSession;\n",
    "block",
  ],
  [
    "a dynamic import of internals",
    "src/modules/rpt/domain/probe.ts",
    "export const p = () => import('@/modules/iam/application/auth-routing');\n",
    "block",
  ],
  [
    "a re-export of internals",
    "src/modules/rpt/domain/probe.ts",
    "export * from '@/modules/iam/application/auth-routing';\n",
    "block",
  ],
  [
    "a dependency against the graph (platform module to business module)",
    "src/modules/iam/domain/probe.ts",
    "import { todayWork } from '@/modules/rpt/ui/today-work';\nexport const p = todayWork;\n",
    "block",
  ],
  [
    "a platform module uses another with no arrow in the map, even through index.ts",
    "src/modules/doc/domain/probe.ts",
    "import { listTasks } from '@/modules/tsk';\nexport const p = listTasks;\n",
    "block",
  ],
  [
    "a route renders a module's ui screen",
    "src/app/(app)/probe/page.tsx",
    "import { TaskList } from '@/modules/tsk/ui/task-list';\nexport const p = TaskList;\n",
    "allow",
  ],
  [
    "a route uses a module's public index.ts",
    "src/app/(app)/probe/page.tsx",
    "import { readAuthSession } from '@/modules/iam';\nexport const p = readAuthSession;\n",
    "allow",
  ],
  [
    "a route reaches into a module's application folder",
    "src/app/(app)/probe/page.tsx",
    "import { signInRoute } from '@/modules/iam/application/auth-routing';\nexport const p = signInRoute;\n",
    "block",
  ],
  [
    "a route reaches into a module's infrastructure",
    "src/app/(app)/probe/page.tsx",
    "import { createSupabaseAuthProvider } from '@/modules/iam/infrastructure/supabase/supabase-auth-provider';\nexport const p = createSupabaseAuthProvider;\n",
    "block",
  ],
  [
    "the shared platform layer depends on a module",
    "src/platform/navigation/probe.ts",
    "import { readAuthSession } from '@/modules/iam';\nexport const p = readAuthSession;\n",
    "block",
  ],
];

describe("ADR-001 module boundary rule (generated from MODULE_MAP)", () => {
  it.each(cases)("%s", { timeout: 60_000 }, async (_name, filePath, code, expected) => {
    expect(await verdict(filePath, code)).toBe(expected);
  });
});

// Database access stays in module data layers (TASK-0101): a separate ESLint rule.
async function importVerdict(filePath, code) {
  const [result] = await eslint.lintText(code, { filePath: resolve(ROOT, filePath) });
  expect(result.messages.filter((m) => m.fatal)).toEqual([]);
  return result.messages.some((m) => m.ruleId === "no-restricted-imports") ? "block" : "allow";
}

const dbCases = [
  [
    "a module data layer uses runAsUser",
    "src/modules/sit/data/probe.ts",
    "import { runAsUser } from '@/platform/db';\nimport { sql } from 'kysely';\nexport const p = [runAsUser, sql];\n",
    "allow",
  ],
  [
    "a module data layer opens its own driver connection",
    "src/modules/sit/data/probe.ts",
    "import pg from 'pg';\nexport const p = pg;\n",
    "block",
  ],
  [
    "a route calls the database directly",
    "src/app/(app)/probe/page.tsx",
    "import { runAsUser } from '@/platform/db';\nexport const p = runAsUser;\n",
    "block",
  ],
  [
    "application code builds a query",
    "src/modules/sit/application/probe.ts",
    "import { sql } from 'kysely';\nexport const p = sql;\n",
    "block",
  ],
  [
    "a screen imports the driver",
    "src/modules/sit/ui/probe.tsx",
    "import { Pool } from 'pg';\nexport const p = Pool;\n",
    "block",
  ],
];

describe("database access only from module data layers (TASK-0101)", () => {
  it.each(dbCases)("%s", { timeout: 60_000 }, async (_name, filePath, code, expected) => {
    expect(await importVerdict(filePath, code)).toBe(expected);
  });
});
