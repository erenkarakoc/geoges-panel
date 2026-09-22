import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import type { PoolConfig } from "pg";

/** Pinned provider root certificate (D-254); replaced through DATABASE_CA_CERT_PATH on self-host. */
export const DEFAULT_CA_CERT_PATH = "db/certs/supabase-root-2021-ca.crt";

type DatabaseEnv = Record<string, string | undefined>;

/**
 * Runtime connection settings (TASK-0101, ADR-015). The application connects only as the
 * restricted role in `DATABASE_APP_URL`; it never reads the admin connection. The server
 * certificate is always verified against the pinned root certificate: a missing certificate is
 * an error, never a reason to connect unverified.
 */
export function readDatabaseConfig(
  env: DatabaseEnv = process.env,
  readCa: (path: string) => string = (path) => readFileSync(resolve(path), "utf8"),
  variable: "DATABASE_APP_URL" | "DATABASE_WORKER_URL" = "DATABASE_APP_URL",
): PoolConfig {
  const raw = env[variable];
  if (!raw) {
    throw new Error(
      variable === "DATABASE_APP_URL"
        ? "DATABASE_APP_URL is missing. Run `npm run db:app-role` to create the runtime role password."
        : `${variable} is missing. Run \`npm run db:app-role\` to create the role password.`,
    );
  }
  const url = new URL(raw);
  if (!/^postgres(ql)?:$/.test(url.protocol)) {
    throw new Error(`${variable} must be a postgresql:// connection string.`);
  }
  if (url.username.startsWith("postgres")) {
    throw new Error(
      variable === "DATABASE_APP_URL"
        ? "DATABASE_APP_URL must use the restricted runtime role, not the admin user."
        : `${variable} must use its own role, not the admin user.`,
    );
  }

  let ca: string;
  const caPath = env.DATABASE_CA_CERT_PATH || DEFAULT_CA_CERT_PATH;
  try {
    ca = readCa(caPath);
  } catch {
    throw new Error(`Database root certificate not found at ${caPath}.`);
  }

  return {
    host: url.hostname,
    port: Number(url.port || 5432),
    database: decodeURIComponent(url.pathname.slice(1)) || "postgres",
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    ssl: { ca, rejectUnauthorized: true, servername: url.hostname },
    max: 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  };
}
