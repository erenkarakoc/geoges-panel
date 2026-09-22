import { createTcmbProvider } from "@/platform/exchange-rates/exchange-rates";
import type { JobDefinition } from "@/platform/jobs/types";

import { exchangeRateJob } from "./calendar-and-rates";

/** ADM's scheduled work, collected by src/jobs/registry.ts: the daily CBRT fetch (TASK-0106). */
export const admJobs: readonly JobDefinition[] = [exchangeRateJob(createTcmbProvider())];
