import { resumeFromWait, type FlowRuntime } from "@/modules/wfl/application/engine";
import { WAKE_JOB } from "@/modules/wfl/data/instance-store";
import type { JobDefinition } from "@/platform/jobs/types";

/**
 * The engine's wake-ups (TASK-0117, REQ-WFL-005).
 *
 * A wait step leaves a row in the scheduler rather than a timer in memory, so a flow waiting eight
 * hours survives a restart, a deploy and a crash. This is what the worker runs when that row comes
 * due: it picks the flow up from the step it was sleeping in.
 *
 * No recurrence — the job is scheduled for a moment, not repeated — and not replayable: waking a
 * flow opens tasks and notifications further down the path (D-234).
 */
export function flowWakeJob(relations: FlowRuntime): JobDefinition {
  return {
    type: WAKE_JOB,
    async run(db, job) {
      const stepRunId = job.payload.stepRunId;
      if (typeof stepRunId !== "string") return;
      await resumeFromWait(db, stepRunId, relations);
    },
  };
}
