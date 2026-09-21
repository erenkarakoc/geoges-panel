// Loads `.env.local` into process.env for `npm run test:db`; values are never printed.
import { readEnvFile } from "../db-admin.mjs";

for (const [key, value] of Object.entries(readEnvFile())) process.env[key] ??= value;
