#!/usr/bin/env node
/**
 * Gives the runtime role `geoges_app` and the outbox worker role `geoges_worker` their passwords
 * (TASK-0101, ADR-015; TASK-0104, D-259).
 *
 * For each role whose line (`DATABASE_APP_URL`, `DATABASE_WORKER_URL`) is missing from
 * `.env.local`, a random password is generated and the line is appended; existing lines are never
 * touched. The database receives only a SCRAM-SHA-256
 * verifier computed here, so the password itself never travels to the server, never appears in
 * a statement or a log, and is never printed. Run again to re-apply the password from
 * `.env.local`, for example after restoring the database into a new project.
 *
 *   npm run db:app-role
 */
import { createHash, createHmac, pbkdf2Sync, randomBytes } from "node:crypto";
import { appendFileSync, existsSync, readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

import {
  APP_ROLE,
  ENV_PATH,
  connectAdmin,
  parseConnectionString,
  readEnvFile,
  safeError,
} from "./db-admin.mjs";

const ITERATIONS = 4096;

/** PostgreSQL's stored form of a SCRAM-SHA-256 password (RFC 5802/7677). */
export function scramVerifier(password, salt = randomBytes(16)) {
  const salted = pbkdf2Sync(password.normalize("NFKC"), salt, ITERATIONS, 32, "sha256");
  const clientKey = createHmac("sha256", salted).update("Client Key").digest();
  const storedKey = createHash("sha256").update(clientKey).digest();
  const serverKey = createHmac("sha256", salted).update("Server Key").digest();
  const b64 = (b) => b.toString("base64");
  return `SCRAM-SHA-256$${ITERATIONS}:${b64(salt)}$${b64(storedKey)}:${b64(serverKey)}`;
}

/**
 * Connection string for a login role on the admin connection's host. Supabase's pooler names
 * users `<role>.<project ref>`; a direct or self-hosted server uses the bare role name.
 */
export function appUrl(adminUrl, password, role = APP_ROLE, { sessionMode = false } = {}) {
  const admin = parseConnectionString(adminUrl);
  const dot = admin.user.indexOf(".");
  const user = dot < 0 ? role : `${role}${admin.user.slice(dot)}`;
  // Supabase's pooler: 6543 is transaction mode (short request transactions), 5432 on the same
  // host is session mode, meant for long-lived clients such as the outbox worker (D-259).
  const port = sessionMode && String(admin.port) === "6543" ? 5432 : admin.port;
  return `postgresql://${user}:${password}@${admin.host}:${port}/${admin.database}`;
}

/** Login roles the application uses, with the `.env.local` line holding each connection. */
export const LOGIN_ROLES = [
  {
    role: APP_ROLE,
    variable: "DATABASE_APP_URL",
    comment: "Runtime database role (restricted, RLS enforced). Written by npm run db:app-role.",
  },
  {
    role: "geoges_worker",
    variable: "DATABASE_WORKER_URL",
    comment:
      "Outbox worker role (bypasses RLS, cannot delete; D-259). Written by npm run db:app-role.",
    sessionMode: true,
  },
];

async function setPassword(client, env, { role, variable, comment, sessionMode = false }) {
  let url = env[variable];
  if (!url) {
    // base64url: no character needs URL encoding.
    url = appUrl(env.DATABASE_URL, randomBytes(32).toString("base64url"), role, { sessionMode });
    const text = existsSync(ENV_PATH) ? readFileSync(ENV_PATH, "utf8") : "";
    const lead = text.endsWith("\n") || text === "" ? "" : "\n";
    appendFileSync(ENV_PATH, `${lead}# ${comment}\n${variable}=${url}\n`);
    console.log(`${variable} added to .env.local (value not shown)`);
  }
  const { password } = parseConnectionString(url);
  const verifier = scramVerifier(password);
  if (!/^SCRAM-SHA-256\$\d+:[A-Za-z0-9+/=]+\$[A-Za-z0-9+/=]+:[A-Za-z0-9+/=]+$/.test(verifier))
    throw new Error("unexpected verifier format");
  const exists = await client.query("select 1 from pg_roles where rolname = $1", [role]);
  if (!exists.rowCount) throw new Error(`role ${role} does not exist; run npm run db:migrate`);
  await client.query(`alter role ${role} password '${verifier}'`);
  console.log(`password set for ${role}`);
}

async function run() {
  const env = readEnvFile();
  const client = await connectAdmin(env);
  try {
    for (const login of LOGIN_ROLES) await setPassword(client, env, login);
  } finally {
    await client.end();
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  run().catch((error) => {
    console.error(`db:app-role stopped — ${error.code ? safeError(error) : error.message}`);
    process.exitCode = 1;
  });
}
