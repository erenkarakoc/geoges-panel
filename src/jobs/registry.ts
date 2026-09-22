import { iamJobs } from "@/modules/iam";
import type { JobRegistry } from "@/platform/jobs/types";

/**
 * Every module's event subscribers, scheduled jobs and read models, in one place (TASK-0104,
 * D-259). The worker lives in `platform`, which may not import modules; this composition root
 * may, through each module's `index.ts` only.
 */
export const jobRegistry: JobRegistry = {
  subscribers: [],
  jobs: [...iamJobs],
  readModels: [],
};
