/**
 * Replays one migration in a test and leaves the database at head again (TASK-0110, 2026-09-23).
 *
 * Several suites prove that a migration can be rolled back and applied again without changing
 * what is indexed. Applying an old file in a database that already holds newer ones puts back the
 * *old* definition of everything that file creates: 0029 re-created `core.search_suggest` and
 * 0030 `core.search_palette`, so a suite silently undid 0031-0033. The database looked fine; only
 * the behaviour had moved back in time, and the next measurement read the old, slow functions.
 *
 * After the replay this puts the newer definitions back: it reads which functions the replayed
 * file creates and applies every later migration that creates one of them again. Those files are
 * written with `create or replace`, so applying one twice changes nothing.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

const MIGRATIONS = resolve(import.meta.dirname, "..", "db", "migrations");
const NAME = /^(\d{4})_[a-z0-9_]+\.sql$/;
const CREATES = /create\s+(?:or\s+replace\s+)?function\s+([a-z_]+\.[a-z_0-9]+)\s*\(/gi;

/** The functions a migration file creates, fully qualified and lower case. */
export function functionsOf(text) {
  return new Set([...text.matchAll(CREATES)].map((match) => match[1].toLowerCase()));
}

/** Later migration files, in order. */
function laterFiles(number, dir = MIGRATIONS) {
  return readdirSync(dir)
    .filter((name) => NAME.test(name) && Number(NAME.exec(name)[1]) > Number(number))
    .sort();
}

/**
 * The `create function` statements of a file, by function name. A whole later migration cannot
 * simply be run again — it may add a column or insert a register row — so only these are taken.
 * Every function in this repository is written as `... as $$ ... $$;`.
 */
export function functionStatements(text) {
  const statements = new Map();
  const start = /create\s+(?:or\s+replace\s+)?function\s+([a-z_]+\.[a-z_0-9]+)\s*\(/gi;
  let match;
  while ((match = start.exec(text)) !== null) {
    const end = text.indexOf("$$;", match.index);
    if (end === -1) continue;
    const statement = text.slice(match.index, end + 3);
    // `create function` would fail the second time; the replay only ever replaces.
    statements.set(
      match[1].toLowerCase(),
      statement.replace(/^create\s+function/i, "create or replace function"),
    );
  }
  return statements;
}

/**
 * Runs `<name>`'s down file, then `work()`, then its up file, then the definitions later
 * migrations gave to the same functions.
 *
 * @param {{ query: (sql: string) => Promise<unknown> }} admin admin connection
 * @param {string} name the file name without `.sql`, e.g. `0029_search_helper_versions`
 * @param {() => Promise<void>} [work] what to check while the migration is rolled back
 */
export async function replayMigration(admin, name, work) {
  const number = NAME.exec(`${name}.sql`)?.[1];
  if (!number) throw new Error(`${name}: expected a migration file name`);
  const text = (suffix) => readFileSync(join(MIGRATIONS, `${name}${suffix}.sql`), "utf8");
  const mine = functionsOf(text(""));

  await admin.query(text(".down"));
  try {
    if (work) await work();
  } finally {
    await admin.query(text(""));
    await restoreNewer(admin, number, mine);
  }
}

/** Puts back what later migrations made of these functions, in migration order. */
export async function restoreNewer(admin, number, functions) {
  for (const later of laterFiles(number)) {
    const statements = functionStatements(readFileSync(join(MIGRATIONS, later), "utf8"));
    for (const [name, statement] of statements) {
      if (functions.has(name)) await admin.query(statement);
    }
  }
}
