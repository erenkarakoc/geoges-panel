import { runClockTriggers, type FlowRuntime } from "@/modules/wfl/application/engine";
import type { JobDefinition } from "@/platform/jobs/types";

/**
 * The engine's clock round (TASK-0117, REQ-WFL-007).
 *
 * Every five minutes it asks which published flows the clock drives and starts the ones whose
 * moment has come. Five minutes is the resolution, which is why a flow may not ask for a shorter
 * period than that: a trigger the round cannot see is a trigger that does not happen.
 *
 * A round that runs twice — a retry, a second worker, a restart — starts nothing twice, because
 * every clock-driven run carries the slot it belongs to and a slot has one run.
 */
export function flowClockJob(relations: FlowRuntime): JobDefinition {
  return {
    type: "wfl.clock",
    recurrence: { everyMinutes: 5 },
    async run(db, job) {
      await runClockTriggers(db, job.runAt, relations);
    },
  };
}
