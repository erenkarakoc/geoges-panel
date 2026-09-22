import { sql } from "kysely";

import type { JobDefinition } from "@/platform/jobs/types";

/**
 * IAM's scheduled work (TASK-0104). Both run on the worker's connection with system authority;
 * the database functions hold the rules (migration 0006) and are safe to run again.
 */
export const iamJobs: readonly JobDefinition[] = [
  {
    // REQ-IAM-007: an account whose leaving date has come loses access without anyone acting.
    type: "iam.deactivate-departed",
    recurrence: { dailyAt: "00:05" },
    async run(db) {
      await sql`select iam.deactivate_departed()`.execute(db);
    },
  },
  {
    // REQ-IAM-008 and the IAM catalog: ended assignments and delegations become events.
    type: "iam.publish-ended-assignments",
    recurrence: { dailyAt: "00:10" },
    async run(db) {
      await sql`select iam.publish_ended_assignments()`.execute(db);
    },
  },
];
