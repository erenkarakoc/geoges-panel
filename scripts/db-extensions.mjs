/** Infrastructure prerequisites shared by hosted Supabase and an empty PostgreSQL server. */
export async function ensureSearchExtensions(client) {
  const required = ["pg_trgm", "intarray", "btree_gist"];
  const { rows } = await client.query(
    `select e.extname, n.nspname from pg_extension e
       join pg_namespace n on n.oid = e.extnamespace where e.extname = any($1::text[])`,
    [required],
  );
  const misplaced = rows.find((row) => row.nspname !== "extensions");
  if (misplaced) {
    throw new Error(
      `${misplaced.extname} must be installed in extensions; review its dependencies before moving it`,
    );
  }
  if (rows.length === required.length) return;
  await client.query("create schema if not exists extensions");
  // These are fixed identifiers, never caller-supplied SQL. Do not move existing extensions.
  for (const name of required) {
    if (!rows.some((row) => row.extname === name)) {
      await client.query(`create extension if not exists ${name} with schema extensions`);
    }
  }
}
