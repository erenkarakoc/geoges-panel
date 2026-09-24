import {
  escalateWaitingApproval,
  type FlowRuntime,
  type OwnerRule,
} from "@/modules/wfl/application/engine";
import { ESCALATE_JOB } from "@/modules/wfl/data/instance-store";
import type { JobDefinition } from "@/platform/jobs/types";

/**
 * An approval's patience running out (TASK-0117, REQ-WFL-005, REQ-IAM-020).
 *
 * Scheduled when the approval is opened and looked at when its time comes. Nothing happens if it
 * was answered in the meantime: a decision beats a clock. Not replayable — moving an approval
 * tells somebody new that it is theirs (D-234).
 */
export function flowEscalationJob(relations: FlowRuntime): JobDefinition {
  return {
    type: ESCALATE_JOB,
    async run(db, job) {
      const approvalId = job.payload.approvalId;
      const to = job.payload.to as OwnerRule | undefined;
      if (typeof approvalId !== "string" || !to) return;
      await escalateWaitingApproval(db, approvalId, to, relations);
    },
  };
}
