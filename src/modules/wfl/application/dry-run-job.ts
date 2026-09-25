import { dryRunVersion, type FlowRuntime } from "@/modules/wfl/application/engine";
import { DRY_RUN_JOB } from "@/modules/wfl/data/flow-store";
import type { JobDefinition } from "@/platform/jobs/types";

/**
 * The designer's dry run, run where the engine lives (REQ-WFL-025, TASK-0119, D-284).
 *
 * The dry run is the engine's own loop with a sink that writes nothing, and the engine runs on the
 * worker's connection — request code never holds one (PORTS_AND_SERVICES section 2). So the screen
 * asks and this runs: within a tick or two the evidence row is written, bound to the definition's
 * content hash, and the designer reads it.
 *
 * No recurrence, and not replayable: a dry run writes its own evidence, which a read-model rebuild
 * must not write again (D-234).
 */
export function flowDryRunJob(relations: FlowRuntime): JobDefinition {
  return {
    type: DRY_RUN_JOB,
    async run(db, job) {
      const versionId = job.payload.versionId;
      if (typeof versionId !== "string") return;
      const context =
        job.payload.context && typeof job.payload.context === "object"
          ? (job.payload.context as Record<string, unknown>)
          : {};
      await dryRunVersion(db, versionId, context, relations);
    },
  };
}
