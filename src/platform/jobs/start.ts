import { createWorkerPool } from "@/platform/db/worker-pool";

import type { JobRegistry } from "./types";
import { createWorker } from "./worker";

const TICK_MS = 2_000;

const globalForJobs = globalThis as unknown as { geogesJobWorker?: { stop(): void } };

/**
 * Starts the worker loop inside the server process (D-259), once per process: development
 * reloads reuse the running loop. `JOBS_WORKER=off` keeps it off; without DATABASE_WORKER_URL it
 * says so and stays off instead of failing the server.
 */
export function startJobWorker(registry: JobRegistry): void {
  if (globalForJobs.geogesJobWorker) return;
  if (process.env.JOBS_WORKER === "off") return;
  if (!process.env.DATABASE_WORKER_URL) {
    console.warn("[jobs] DATABASE_WORKER_URL is missing; the worker is off (npm run db:app-role).");
    return;
  }
  const worker = createWorker({
    pool: createWorkerPool(),
    registry,
    log: (message) => console.warn(`[jobs] ${message}`),
  });
  let stopped = false;
  const timer = setInterval(() => {
    if (stopped) return;
    worker.tick().catch((error: unknown) => {
      console.error(`[jobs] tick failed: ${error instanceof Error ? error.message : error}`);
    });
  }, TICK_MS);
  timer.unref?.();
  globalForJobs.geogesJobWorker = {
    stop() {
      stopped = true;
      clearInterval(timer);
    },
  };
}
