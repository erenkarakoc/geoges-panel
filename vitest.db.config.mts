import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Tests against the real database (TASK-0101): `npm run test:db`. They need `.env.local`, so
// they run on the developer machine only; CI has no database secrets. Kept separate from
// vitest.config.mts so the unit run (and CI) never picks up `*.dbtest.ts`.
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "server-only": fileURLToPath(new URL("./scripts/stubs/empty.mjs", import.meta.url)),
    },
  },
  test: {
    include: ["src/**/*.dbtest.ts", "scripts/**/*.dbtest.mjs"],
    environment: "node",
    setupFiles: ["./scripts/stubs/load-env-local.mjs"],
    testTimeout: 60_000,
    hookTimeout: 60_000,
    fileParallelism: false,
  },
});
