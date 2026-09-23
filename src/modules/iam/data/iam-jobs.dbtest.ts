/**
 * IAM's scheduled work against the real database (TASK-0104, REQ-IAM-007, REQ-IAM-008, D-259).
 * The jobs run as the worker role, as the worker runs them; test people are removed afterwards
 * (their audit rows stay, by design). `npm run test:db`.
 */
import pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { connectAdmin } from "../../../../scripts/db-admin.mjs";
import { releaseTestPeople } from "../../../../scripts/db-test-people.mjs";
import { readDatabaseConfig } from "@/platform/db/database-config";
import { kyselyOn } from "@/platform/db/run-as-user";

import { iamJobs } from "./iam-jobs";

const LEAVER = "0192f0c1-0104-7000-8000-000000000002";
const DELEGATOR = "0192f0c1-0104-7000-8000-000000000003";
const DELEGATE = "0192f0c1-0104-7000-8000-000000000004";

let admin: pg.Client;
let workerPool: pg.Pool;

async function cleanUp() {
  await releaseTestPeople(admin, [LEAVER, DELEGATOR, DELEGATE]);
  for (const q of [
    "delete from core.outbox_delivery where outbox_id in (select id from core.outbox where record_schema = 'iam' and (payload ->> 'user_id' = any($1) or record_id = any($1::uuid[])))",
    "delete from core.outbox where record_schema = 'iam' and (payload ->> 'user_id' = any($1) or record_id = any($1::uuid[]))",
    "delete from iam.role_assignment where user_id = any($1::uuid[])",
    "delete from iam.user where id = any($1::uuid[])",
  ])
    await admin.query(q, [[LEAVER, DELEGATOR, DELEGATE]]);
}

beforeAll(async () => {
  admin = await connectAdmin();
  workerPool = new pg.Pool(readDatabaseConfig(process.env, undefined, "DATABASE_WORKER_URL"));
  await cleanUp();
});

afterAll(async () => {
  await workerPool?.end();
  if (admin) {
    await cleanUp();
    await admin.end();
  }
});

describe("IAM scheduled work (REQ-IAM-007, REQ-IAM-008)", () => {
  const job = (type: string) => iamJobs.find((j) => j.type === type)!;
  const runJob = async (type: string) => {
    const client = await workerPool.connect();
    try {
      await client.query("begin");
      await job(type).run(kyselyOn(client), { runAt: new Date(), payload: {} });
      await client.query("commit");
    } finally {
      client.release();
    }
  };

  it("disables an account on its leaving date and publishes user.deactivated", async () => {
    await admin.query(
      `insert into iam.user (id, email, display_name, auth_provider_id, left_on)
       values ($1, 't0104-leaver@example.test', 'Deneme ayrılan', $1, iam.today())`,
      [LEAVER],
    );
    await runJob("iam.deactivate-departed");
    const { rows } = await admin.query("select status from iam.user where id = $1", [LEAVER]);
    expect(rows[0].status).toBe("disabled");
    const events = await admin.query("select event_code from core.outbox where record_id = $1", [
      LEAVER,
    ]);
    expect(events.rows.map((r) => r.event_code)).toContain("user.deactivated");
  });

  it("publishes an ended delegation once, and writes it to the audit log", async () => {
    await admin.query(
      `insert into iam.user (id, email, display_name, auth_provider_id)
       values ($1, 't0104-delegator@example.test', 'Deneme veren', $1),
              ($2, 't0104-delegate@example.test', 'Deneme vekil', $2)`,
      [DELEGATOR, DELEGATE],
    );
    const role = (await admin.query("select id from iam.role where code = 'SM'")).rows[0].id;
    await admin.query(
      `insert into iam.role_assignment (user_id, role_id, scope_type, starts_on)
       values ($1, $2, 'company', iam.today() - 30)`,
      [DELEGATOR, role],
    );
    const { rows } = await admin.query(
      `insert into iam.role_assignment (user_id, role_id, scope_type, starts_on, ends_on,
                                        is_delegation, delegated_by_user_id)
       values ($1, $2, 'company', iam.today() - 5, iam.today() - 1, true, $3) returning id`,
      [DELEGATE, role, DELEGATOR],
    );
    await runJob("iam.publish-ended-assignments");
    await runJob("iam.publish-ended-assignments");
    const events = await admin.query(
      "select event_code from core.outbox where record_id = $1 order by id",
      [rows[0].id],
    );
    expect(events.rows.map((r) => r.event_code)).toEqual([
      "role_delegation.started",
      "role_delegation.ended",
    ]);
    const audit = await admin.query(
      "select count(*)::int as n from aud.audit_log where event_type = 'role_delegation.ended' and target_id = $1",
      [rows[0].id],
    );
    expect(audit.rows[0].n).toBe(1);
  });
});
