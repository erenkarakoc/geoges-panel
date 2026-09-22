import { admJobs } from "@/modules/adm";
import { docJobs } from "@/modules/doc";
import { iamJobs } from "@/modules/iam";
import type { JobRegistry } from "@/platform/jobs/types";
import { processStorage } from "@/platform/storage";
import { createTesseractReader } from "@/platform/text-recognition/text-reader";

const doc = docJobs(processStorage, createTesseractReader());

/**
 * Every module's event subscribers, scheduled jobs and read models, in one place (TASK-0104,
 * D-259). The worker lives in `platform`, which may not import modules; this composition root
 * may, through each module's `index.ts` only.
 */
export const jobRegistry: JobRegistry = {
  subscribers: [...doc.subscribers],
  jobs: [...iamJobs, ...admJobs, ...doc.jobs],
  readModels: [],
};
