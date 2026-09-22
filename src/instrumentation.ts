/**
 * Runs once when a Next.js server starts (TASK-0104, D-259): starts the outbox worker in the
 * Node.js runtime. Not during the production build, not on the edge runtime.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  const [{ startJobWorker }, { jobRegistry }] = await Promise.all([
    import("@/platform/jobs/start"),
    import("@/jobs/registry"),
  ]);
  startJobWorker(jobRegistry);
}
