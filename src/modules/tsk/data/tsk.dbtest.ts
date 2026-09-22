/**
 * Tasks and notifications against the real database (TASK-0108 step 1, REQ-TSK-001…011, D-130,
 * D-131, D-263).
 *
 * Five test people in two sites and one company-wide role are written over the admin connection
 * and removed afterwards, together with their tasks, notifications, history and events. The
 * system-task functions are called on the worker's connection, as the worker will call them.
 * `npm run test:db`.
 */
import pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { connectAdmin } from "../../../../scripts/db-admin.mjs";
import { readDatabaseConfig } from "@/platform/db/database-config";
import { kyselyOn } from "@/platform/db/run-as-user";
import type { DeliveredEvent } from "@/platform/jobs/types";

import {
  approveTask,
  completeTask,
  countUnread,
  insertManualTask,
  markNotificationsRead,
  readAssignablePeople,
  readNotifications,
  readTask,
  readTaskHistory,
  readTasks,
  reopenTask,
} from "./tsk-store";
import { liveSignals } from "./tsk-jobs";

const id = (n: number) => `0192f0c1-0108-7000-8000-${String(n).padStart(12, "0")}`;
const GIVER_A = id(1);
const PEER_A = id(2);
const OTHER_B = id(3);
const COMPANY = id(4);
const DELEGATE = id(5);
const PEOPLE = [GIVER_A, PEER_A, OTHER_B, COMPANY, DELEGATE];
const SITE_A = id(101);
const SITE_B = id(102);
const ROLES = ["T0108_SITE", "T0108_CO"];
const PROBLEM = "t0108:test-problem";

let admin: pg.Client;
let workerPool: pg.Pool;
const role: Record<string, string> = {};

const as = (userId: string) => ({ userId, actingRoleId: null });

const refusal = (promise: Promise<unknown>) =>
  promise.then(
    () => "no error",
    (e: { hint?: string; code?: string }) => e.hint ?? e.code ?? "no code",
  );

async function worker<T>(work: (client: pg.PoolClient) => Promise<T>): Promise<T> {
  const client = await workerPool.connect();
  try {
    return await work(client);
  } finally {
    client.release();
  }
}

async function cleanUp() {
  const { rows: tasks } = await admin.query(
    `select id from tsk.task where assignee_user_id = any($1) or given_by_user_id = any($1)
        or problem_key like 't0108:%'`,
    [PEOPLE],
  );
  const taskIds = tasks.map((r) => r.id as string);
  await admin.query("delete from tsk.notification where user_id = any($1)", [PEOPLE]);
  await admin.query(
    `delete from core.outbox_delivery where outbox_id in
       (select id from core.outbox where event_code like 'notification.%'
           and payload ->> 'user_id' = any($1::text[]))`,
    [PEOPLE],
  );
  await admin.query(
    `delete from core.outbox where event_code like 'notification.%'
        and payload ->> 'user_id' = any($1::text[])`,
    [PEOPLE],
  );
  if (taskIds.length) {
    await admin.query("select aud.purge_record_history_for_reset('tsk.task', $1::uuid[])", [
      taskIds,
    ]);
    await admin.query("begin");
    await admin.query("select set_config('aud.reset_purge', 'on', true)");
    await admin.query("delete from tsk.escalation where task_id = any($1::uuid[])", [taskIds]);
    await admin.query("delete from tsk.notification where task_id = any($1::uuid[])", [taskIds]);
    await admin.query("delete from tsk.task where id = any($1::uuid[])", [taskIds]);
    await admin.query("commit");
    await admin.query(
      `delete from core.outbox_delivery where outbox_id in
         (select id from core.outbox where record_schema = 'tsk' and record_id = any($1::uuid[]))`,
      [taskIds],
    );
    await admin.query(
      "delete from core.outbox where record_schema = 'tsk' and record_id = any($1::uuid[])",
      [taskIds],
    );
  }
  const { rows } = await admin.query(
    `select 'iam.role_assignment' as t, id from iam.role_assignment where user_id = any($1)
     union all select 'iam.user', id from iam.user where id = any($1)
     union all select 'iam.role', id from iam.role where code = any($2)`,
    [PEOPLE, ROLES],
  );
  for (const table of new Set(rows.map((r) => r.t as string))) {
    await admin.query("select aud.purge_record_history_for_reset($1, $2::uuid[])", [
      table,
      rows.filter((r) => r.t === table).map((r) => r.id),
    ]);
  }
  await admin.query("delete from iam.role_assignment where user_id = any($1)", [PEOPLE]);
  await admin.query("delete from iam.user where id = any($1)", [PEOPLE]);
  await admin.query("delete from iam.role where code = any($1)", [ROLES]);
}

beforeAll(async () => {
  admin = await connectAdmin();
  workerPool = new pg.Pool(readDatabaseConfig(process.env, undefined, "DATABASE_WORKER_URL"));
  await cleanUp();
  await admin.query(`
    insert into iam.role (code, name, level) values
      ('T0108_SITE', 'Deneme şantiye', 10), ('T0108_CO', 'Deneme şirket', 20);`);
  const { rows } = await admin.query("select code, id from iam.role where code = any($1)", [ROLES]);
  for (const r of rows) role[r.code] = r.id;
  await admin.query(
    `insert into iam.user (id, email, display_name, auth_provider_id)
     select u.id, 't0108-' || u.n || '@example.test', 'Deneme görev ' || u.n, u.id
       from unnest($1::uuid[]) with ordinality as u(id, n)`,
    [PEOPLE],
  );
  const assign = (user: string, code: string, scope: "site" | "company", ids: string[]) =>
    admin.query(
      `insert into iam.role_assignment (user_id, role_id, scope_type, scope_ids, starts_on)
       values ($1, $2, $3, $4, iam.today() - 1)`,
      [user, role[code], scope, ids],
    );
  await assign(GIVER_A, "T0108_SITE", "site", [SITE_A]);
  await assign(PEER_A, "T0108_SITE", "site", [SITE_A]);
  await assign(OTHER_B, "T0108_SITE", "site", [SITE_B]);
  await assign(COMPANY, "T0108_CO", "company", []);
  await assign(DELEGATE, "T0108_SITE", "site", [SITE_B]);
  // DELEGATE stands in for PEER_A this week (REQ-IAM-018).
  await admin.query(
    `insert into iam.role_assignment (user_id, role_id, scope_type, scope_ids, starts_on, ends_on,
                                      is_delegation, delegated_by_user_id, reason)
     values ($1, $2, 'site', $3, iam.today() - 1, iam.today() + 6, true, $4, 'İzin')`,
    [DELEGATE, role.T0108_SITE, [SITE_A], PEER_A],
  );
});

afterAll(async () => {
  await workerPool?.end();
  if (admin) {
    await cleanUp();
    await admin.end();
  }
});

const give = (giver: string, assignee: string, needsApproval = false, title = "Kalıp sökümü") =>
  insertManualTask(as(giver), {
    title,
    description: null,
    assigneeId: assignee,
    priority: "normal",
    dueAt: null,
    needsApproval,
  });

describe("who may be given a task (D-130, REQ-TSK-003)", () => {
  it("lists people in the giver's scope, themselves and company-wide people only", async () => {
    const people = (await readAssignablePeople(as(GIVER_A))).map((p) => p.id);
    expect(people).toEqual(expect.arrayContaining([GIVER_A, PEER_A, COMPANY, DELEGATE]));
    expect(people).not.toContain(OTHER_B);
    const everyone = (await readAssignablePeople(as(COMPANY))).map((p) => p.id);
    expect(everyone).toEqual(expect.arrayContaining(PEOPLE));
  });

  it("refuses a person outside the scope in the database", async () => {
    expect(await refusal(give(GIVER_A, OTHER_B))).toBe("tsk.outside_scope");
    expect(await refusal(give(OTHER_B, PEER_A))).toBe("tsk.outside_scope");
    expect(typeof (await give(GIVER_A, COMPANY, false, "Yukarıya iş"))).toBe("string");
    expect(typeof (await give(GIVER_A, GIVER_A, false, "Kendime not"))).toBe("string");
  });

  it("refuses a task without a source (REQ-TSK-001)", async () => {
    expect(
      await refusal(
        admin.query(
          `insert into tsk.task (title, assignee_user_id, source_type) values ('x', $1, 'manual')`,
          [PEER_A],
        ),
      ),
    ).toBe("23514");
    expect(
      await refusal(
        admin.query(
          `insert into tsk.task (title, assignee_user_id, source_type, source_event_code)
           values ('x', $1, 'system', 'job.dead_lettered')`,
          [PEER_A],
        ),
      ),
    ).toBe("23514");
  });
});

describe("closing a task (D-131, REQ-TSK-004)", () => {
  it("without approval: the assignee closes, the giver is told and may reopen", async () => {
    const taskId = await give(GIVER_A, PEER_A);
    const unreadBefore = await countUnread(as(PEER_A));
    expect(unreadBefore).toBeGreaterThan(0);
    expect((await readNotifications(as(PEER_A)))[0]).toMatchObject({
      type: "task.assigned",
      subject: "Kalıp sökümü",
      linkPath: `/tasks/${taskId}`,
    });

    expect(await refusal(completeTask(as(GIVER_A), taskId))).toBe("tsk.not_assignee");
    expect(await completeTask(as(PEER_A), taskId)).toBe("closed");
    expect((await readTask(as(GIVER_A), taskId))?.status).toBe("closed");
    expect((await readNotifications(as(GIVER_A))).map((n) => n.type)).toContain("task.completed");

    expect(await refusal(reopenTask(as(PEER_A), taskId, null))).toBe("tsk.not_giver");
    await reopenTask(as(GIVER_A), taskId, "Kalıp eksik sökülmüş");
    const reopened = await readTask(as(PEER_A), taskId);
    expect(reopened).toMatchObject({ status: "open", reopenedCount: 1, closedAt: null });

    const history = await readTaskHistory(as(PEER_A), taskId);
    const statusChanges = history
      .filter((h) => h.field === "status")
      .map((h) => [h.newValue, h.changedByName, h.reason]);
    expect(statusChanges).toEqual([
      ["closed", "Deneme görev 2", null],
      ["open", "Deneme görev 1", "Kalıp eksik sökülmüş"],
    ]);
    expect(history[0].operation).toBe("insert");
  });

  it("with approval: stays open until the giver approves", async () => {
    const taskId = await give(GIVER_A, PEER_A, true, "Demir kontrolü");
    expect(await completeTask(as(PEER_A), taskId)).toBe("reported_done");
    const waiting = await readTask(as(PEER_A), taskId);
    expect(waiting?.status).toBe("reported_done");
    expect(waiting?.closedAt).toBeNull();
    expect((await readNotifications(as(GIVER_A))).map((n) => n.type)).toContain(
      "task.done_reported",
    );

    expect(await refusal(approveTask(as(PEER_A), taskId))).toBe("tsk.not_giver");
    await approveTask(as(GIVER_A), taskId);
    expect((await readTask(as(PEER_A), taskId))?.closingKind).toBe("approved");
    expect(await refusal(approveTask(as(GIVER_A), taskId))).toBe("tsk.not_reported");
  });
});

describe("who sees a task (D-263)", () => {
  it("assignee, giver and the assignee's delegate; nobody else", async () => {
    const taskId = await give(GIVER_A, PEER_A, false, "Görünürlük");
    expect(await readTask(as(PEER_A), taskId)).not.toBeNull();
    expect(await readTask(as(GIVER_A), taskId)).not.toBeNull();
    expect(await readTask(as(DELEGATE), taskId)).not.toBeNull();
    expect(await readTask(as(OTHER_B), taskId)).toBeNull();
    expect(await readTask(as(COMPANY), taskId)).toBeNull();
    expect(await readTaskHistory(as(OTHER_B), taskId)).toEqual([]);
    expect(await refusal(completeTask(as(OTHER_B), taskId))).toBe("tsk.not_found");

    const mine = (await readTasks(as(DELEGATE), "mine", false)).map((t) => t.id);
    expect(mine).toContain(taskId);
    const given = (await readTasks(as(GIVER_A), "given", false)).map((t) => t.id);
    expect(given).toContain(taskId);
    expect((await readTasks(as(PEER_A), "given", false)).map((t) => t.id)).not.toContain(taskId);

    // The delegate acts for the assignee.
    expect(await completeTask(as(DELEGATE), taskId)).toBe("closed");
  });

  it("publishes task.created for each task", async () => {
    const taskId = await give(GIVER_A, PEER_A, false, "Olay");
    const { rows } = await admin.query(
      "select event_code, payload from core.outbox where record_schema = 'tsk' and record_id = $1",
      [taskId],
    );
    expect(rows.map((r) => r.event_code)).toEqual(["task.created"]);
    expect(rows[0].payload).toMatchObject({ assignee_user_id: PEER_A, source_type: "manual" });
  });
});

describe("notifications (REQ-TSK-009, REQ-TSK-011)", () => {
  it("are seen by their recipient only, and the counter counts unread ones", async () => {
    await give(GIVER_A, PEER_A, false, "Sayaç");
    const peer = await readNotifications(as(PEER_A));
    expect(peer.length).toBeGreaterThan(0);
    const { rows } = await admin.query("select user_id from tsk.notification where id = $1", [
      peer[0].id,
    ]);
    expect(rows[0].user_id).toBe(PEER_A);
    const otherIds = (await readNotifications(as(OTHER_B))).map((n) => n.id);
    expect(otherIds).not.toContain(peer[0].id);
    // Marking someone else's notification read changes nothing.
    expect(await markNotificationsRead(as(OTHER_B), [peer[0].id])).toBe(0);

    const before = await countUnread(as(PEER_A));
    expect(await markNotificationsRead(as(PEER_A), [peer[0].id])).toBe(1);
    expect(await countUnread(as(PEER_A))).toBe(before - 1);
    await markNotificationsRead(as(PEER_A), null);
    expect(await countUnread(as(PEER_A))).toBe(0);
  });

  it("are not sent twice for the same source, person and type in a short time", async () => {
    const [first, second] = await worker(async (c) => {
      const send = () =>
        c.query(
          `select tsk.notify($1, 'approval.requested', 'Satın alma talebi', '/approvals',
                             't0108:approval:1') as id`,
          [PEER_A],
        );
      return [(await send()).rows[0].id, (await send()).rows[0].id];
    });
    expect(first).not.toBeNull();
    expect(second).toBeNull();
    const { rows } = await admin.query("select channels from tsk.notification where id = $1", [
      first,
    ]);
    expect(rows[0].channels).toEqual(["panel", "push"]);
  });

  it("cannot be written by the runtime role directly", async () => {
    const { rows } = await admin.query(
      `select has_table_privilege('geoges_app', 'tsk.notification', 'insert') as ins,
              has_table_privilege('geoges_app', 'tsk.task', 'update') as upd,
              has_function_privilege('geoges_app',
                'tsk.notify(uuid, text, text, text, text, uuid, text, text, uuid, boolean)',
                'execute') as notify`,
    );
    expect(rows[0]).toEqual({ ins: false, upd: false, notify: false });
  });
});

describe("system tasks (REQ-TSK-005)", () => {
  const open = (c: pg.PoolClient) =>
    c.query(
      `select tsk.open_problem_task($1, 'job.dead_lettered', 'Başarısız iş var', $2,
                                    'critical') as id`,
      [PROBLEM, COMPANY],
    );

  it("opens one task per open problem and closes it when the cause goes away", async () => {
    const first = await worker(async (c) => (await open(c)).rows[0].id as string);
    const again = await worker(async (c) => (await open(c)).rows[0].id as string);
    expect(again).toBe(first);
    const { rows: count } = await admin.query(
      "select count(*)::int as n from tsk.task where problem_key = $1 and status <> 'closed'",
      [PROBLEM],
    );
    expect(count[0].n).toBe(1);
    const critical = (await readNotifications(as(COMPANY))).find((n) => n.type === "task.assigned");
    expect(critical?.isCritical).toBe(true);

    expect(
      await worker(
        async (c) => (await c.query("select tsk.resolve_problem($1) as ok", [PROBLEM])).rows[0].ok,
      ),
    ).toBe(true);
    const closed = await readTask(as(COMPANY), first);
    expect(closed).toMatchObject({ status: "closed", closingKind: "resolved" });
    const history = await readTaskHistory(as(COMPANY), first);
    expect(history.find((h) => h.field === "status")?.reason).toBe("sebebi çözüldü");

    const next = await worker(async (c) => (await open(c)).rows[0].id as string);
    expect(next).not.toBe(first);
    await worker((c) => c.query("select tsk.resolve_problem($1)", [PROBLEM]));
  });

  it("a task is never deleted", async () => {
    const taskId = await give(GIVER_A, PEER_A, false, "Silinmez");
    expect(await refusal(admin.query("delete from tsk.task where id = $1", [taskId]))).toBe(
      "tsk.no_delete",
    );
  });
});

describe("live signals (ADR-018, D-240)", () => {
  const eventsOf = async (codes: string[], since: Date) =>
    (
      await admin.query(
        `select event_code as code, record_id, payload from core.outbox
          where event_code = any($1) and occurred_at >= $2 order by id`,
        [codes, since],
      )
    ).rows as { code: string; record_id: string | null; payload: Record<string, unknown> }[];

  // PEER_A's delegate (set up above) is concerned by PEER_A's tasks too.
  it("tell each person concerned that notifications or tasks changed, and nothing more", async () => {
    const since = (await admin.query("select clock_timestamp() as t")).rows[0].t;
    const taskId = await give(GIVER_A, PEER_A, false, "Canlı sinyal");
    await markNotificationsRead(as(PEER_A), null);

    const created = await eventsOf(["notification.created", "notification.read"], since);
    expect(created.map((e) => e.code)).toEqual(["notification.created", "notification.read"]);
    // The event carries the recipient, never the words of the notification.
    expect(Object.keys(created[0].payload).sort()).toEqual([
      "is_critical",
      "notification_id",
      "user_id",
    ]);

    const sent: string[] = [];
    const subscriber = liveSignals((userId, type) => sent.push(`${userId}:${type}`));
    const events = [
      ...created,
      ...(await eventsOf(["task.created"], since)).filter((e) => e.record_id === taskId),
    ];
    await worker(async (client) => {
      for (const e of events) {
        await subscriber.handle(
          kyselyOn(client),
          {
            code: e.code,
            payload: e.payload,
            record: e.record_id ? { schema: "tsk", table: "task", id: e.record_id } : null,
          } as unknown as DeliveredEvent,
          { readModelVersion: async () => 1 },
        );
      }
    });
    expect(sent.slice(0, 2)).toEqual([`${PEER_A}:notifications`, `${PEER_A}:notifications`]);
    expect(new Set(sent.slice(2))).toEqual(
      new Set([`${PEER_A}:tasks`, `${GIVER_A}:tasks`, `${DELEGATE}:tasks`]),
    );
  });
});
