/**
 * Flow definitions against the real database (TASK-0117, migration 0045, REQ-WFL-023…025).
 *
 * What is proved here is the part SPIKE-04 measured before the product had it: a definition that
 * has been published cannot change, and a publish without a dry run of exactly this definition is
 * refused. Both are the database's rules, so the test asks the database, not a service.
 *
 * Two people: one who may design flows and one who may not. Test rows are removed afterwards;
 * audit entries cannot be removed by design, so assertions are scoped by time. `npm run test:db`.
 */
import pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { connectAdmin } from "../../../../scripts/db-admin.mjs";
import { releaseTestPeople } from "../../../../scripts/db-test-people.mjs";
import {
  disableFlow,
  publishVersion,
  readLastDryRun,
  readPublished,
  readPublishSummary,
  readVersions,
  recordDryRun,
  requestDryRun,
  saveDraft,
} from "@/modules/wfl/data/flow-store";

const id = (n: number) => `0192f0c1-0117-7000-8000-${String(n).padStart(12, "0")}`;
const DESIGNER = id(1);
const OUTSIDER = id(2);
const PEOPLE = [DESIGNER, OUTSIDER];
const ROLES = ["T0117_OUTSIDER"];
const KEY = "zz-t0117-approval";
/** The designer's own flow, so asking for dry runs does not disturb the publish rules above. */
const DESIGNER_KEY = "zz-t0119-designer";
const KEYS = [KEY, DESIGNER_KEY];

let admin: pg.Client;
const as = (userId: string) => ({ userId, actingRoleId: null });

const errorOf = (promise: Promise<unknown>) =>
  promise.then(
    () => "no error",
    (e: { hint?: string; code?: string }) => e.hint ?? e.code ?? "no code",
  );

const definition = (title: string) => ({
  key: KEY,
  trigger: { type: "event", event: "zz.record.submitted" },
  steps: [{ id: "s1", type: "approval", title, owner: { type: "role", role: "SAH" } }],
});

async function cleanUp() {
  // Publishing a flow writes what the engine listens to (migration 0047); the test takes its own
  // subscriptions back, so a development database does not keep hearing test events.
  await admin.query("delete from core.event_subscription where event_code like 'zz.%'");
  // What the designer asked the worker to dry run, before the versions it names are gone.
  await admin.query(
    `delete from core.scheduled_job
      where job_type = 'wfl.dry_run'
        and payload->>'versionId' in (
          select v.id::text from wfl.flow_version v
            join wfl.flow f on f.id = v.flow_id where f.key = any($1))`,
    [KEYS],
  );
  await admin.query(
    `delete from wfl.dry_run where flow_version_id in (
       select v.id from wfl.flow_version v join wfl.flow f on f.id = v.flow_id
        where f.key = any($1))`,
    [KEYS],
  );
  await admin.query(
    "delete from wfl.flow_version where flow_id in (select id from wfl.flow where key = any($1))",
    [KEYS],
  );
  await admin.query("delete from wfl.flow where key = any($1)", [KEYS]);
  await releaseTestPeople(admin, PEOPLE);
  await admin.query("delete from iam.role_assignment where user_id = any($1::uuid[])", [PEOPLE]);
  await admin.query("delete from iam.user where id = any($1::uuid[])", [PEOPLE]);
  await admin.query("delete from iam.role where code = any($1)", [ROLES]);
}

let startedAt: Date;
let draftId: string;

beforeAll(async () => {
  admin = await connectAdmin();
  await cleanUp();
  startedAt = (await admin.query("select clock_timestamp() as t")).rows[0].t;

  await admin.query(`insert into iam.role (code, name, level) values
    ('T0117_OUTSIDER', 'Deneme akış dışı', 10)`);
  await admin.query(
    `insert into iam.user (id, email, display_name, auth_provider_id)
     select u.id, 't0117-' || u.n || '@example.test', 'Deneme akış ' || u.n, u.id
       from unnest($1::uuid[]) with ordinality as u(id, n)`,
    [PEOPLE],
  );
  const { rows: roles } = await admin.query(
    "select code, id from iam.role where code in ($1, $2)",
    ["SAH", "T0117_OUTSIDER"],
  );
  const roleId = Object.fromEntries(roles.map((r: { code: string; id: string }) => [r.code, r.id]));
  const assign = (user: string, code: string) =>
    admin.query(
      `insert into iam.role_assignment (user_id, role_id, scope_type, scope_ids, starts_on)
       values ($1, $2, 'company', '{}', iam.today() - 1)`,
      [user, roleId[code]],
    );
  // The owner layer is the seeded role that carries wfl.workflow.design (D-083).
  await assign(DESIGNER, "SAH");
  await assign(OUTSIDER, "T0117_OUTSIDER");
});

afterAll(async () => {
  if (admin) {
    await cleanUp();
    await admin.end();
  }
});

describe("a flow definition and its versions", () => {
  it("writes a draft and keeps writing the same one until it is published", async () => {
    draftId = await saveDraft(as(DESIGNER), {
      key: KEY,
      name: "Deneme onay akışı",
      definition: definition("Koordinatör onayı"),
    });
    const again = await saveDraft(as(DESIGNER), {
      key: KEY,
      name: "Deneme onay akışı",
      definition: definition("Koordinatör onayı (düzeltildi)"),
    });
    expect(again).toBe(draftId);
    const versions = await readVersions(as(DESIGNER), KEY);
    expect(versions).toHaveLength(1);
    expect(versions[0].version).toBe(1);
    expect(versions[0].status).toBe("draft");
  });

  it("refuses to publish a definition that has not been dry run", async () => {
    expect(await errorOf(publishVersion(as(DESIGNER), draftId))).toBe("wfl.dry_run_required");
  });

  it("refuses a dry run that is no longer about this definition", async () => {
    await recordDryRun(as(DESIGNER), { versionId: draftId, passed: true, summary: { steps: 1 } });
    // The definition changes after the evidence was written, so the evidence is about something
    // else now; the hash is what says so (SPIKE-04).
    await saveDraft(as(DESIGNER), {
      key: KEY,
      name: "Deneme onay akışı",
      definition: definition("Yönetici onayı"),
    });
    expect(await errorOf(publishVersion(as(DESIGNER), draftId))).toBe("wfl.dry_run_required");
  });

  it("publishes once the dry run is about the definition being published", async () => {
    await recordDryRun(as(DESIGNER), { versionId: draftId, passed: true, summary: { steps: 1 } });
    expect(await publishVersion(as(DESIGNER), draftId)).toBe(true);

    const live = await readPublished(as(DESIGNER), KEY);
    expect(live?.id).toBe(draftId);
    expect(live?.version).toBe(1);
  });

  it("writes the publish to the audit log and announces it to the outbox (D-081)", async () => {
    const { rows: audit } = await admin.query(
      `select payload from aud.audit_log
        where event_type = 'workflow.published' and target_id = $1 and occurred_at >= $2`,
      [draftId, startedAt],
    );
    expect(audit).toHaveLength(1);
    expect(audit[0].payload.key).toBe(KEY);

    const { rows: outbox } = await admin.query(
      "select event_code from core.outbox where record_id = $1 and occurred_at >= $2",
      [draftId, startedAt],
    );
    expect(outbox.map((r: { event_code: string }) => r.event_code)).toContain("workflow.published");
  });

  it("will not let a published definition be changed, by anyone", async () => {
    // Not through the application, which has no privilege to write these tables at all, and not
    // through the administrative connection either: the table itself refuses it.
    expect(
      await errorOf(
        admin.query("update wfl.flow_version set definition = '{}'::jsonb where id = $1", [
          draftId,
        ]),
      ),
    ).toBe("wfl.version_immutable");
    expect(
      await errorOf(
        admin.query("update wfl.flow_version set content_hash = 'x' where id = $1", [draftId]),
      ),
    ).toBe("wfl.version_immutable");
  });

  it("will not let the evidence be rewritten either", async () => {
    expect(
      await errorOf(admin.query("update wfl.dry_run set passed = false where content_hash <> ''")),
    ).toBe("wfl.dry_run_append_only");
  });

  it("starts a new version after a publish and supersedes the old one when that is published", async () => {
    const second = await saveDraft(as(DESIGNER), {
      key: KEY,
      name: "Deneme onay akışı",
      definition: definition("İki adımlı onay"),
    });
    expect(second).not.toBe(draftId);

    await recordDryRun(as(DESIGNER), { versionId: second, passed: true, summary: {} });
    expect(await publishVersion(as(DESIGNER), second)).toBe(true);

    const versions = await readVersions(as(DESIGNER), KEY);
    expect(versions.map((v) => [v.version, v.status])).toEqual([
      [2, "published"],
      [1, "superseded"],
    ]);
    // One published version at a time is a unique index, not a convention.
    expect(versions.filter((v) => v.status === "published")).toHaveLength(1);
  });

  it("stops offering a disabled flow, without touching what it already published", async () => {
    const { rows } = await admin.query("select id from wfl.flow where key = $1", [KEY]);
    expect(await disableFlow(as(DESIGNER), rows[0].id, "deneme")).toBe(true);
    expect(await readPublished(as(DESIGNER), KEY)).toBeNull();
    expect(await readVersions(as(DESIGNER), KEY)).toHaveLength(2);
  });
});

describe("somebody who may not design flows", () => {
  it("sees no definition at all", async () => {
    expect(await readVersions(as(OUTSIDER), KEY)).toEqual([]);
    expect(await readPublished(as(OUTSIDER), KEY)).toBeNull();
  });

  it("cannot write one", async () => {
    expect(
      await errorOf(
        saveDraft(as(OUTSIDER), { key: "zz-t0117-theirs", name: "Olmaz", definition: {} }),
      ),
    ).toBe("wfl.design_permission");
  });

  it("cannot publish one", async () => {
    expect(await errorOf(publishVersion(as(OUTSIDER), draftId))).toBe("wfl.design_permission");
  });
});

/**
 * What the designer does with the engine's evidence (TASK-0119, D-284). The dry run itself runs on
 * the worker, so what is proved here is the asking and the reading: one question per definition, an
 * answer that says whether it is still about this definition, and nothing at all for somebody who
 * may not design flows.
 */
describe("the designer asking for a dry run", () => {
  let versionId: string;

  const theirs = (title: string) => ({
    key: DESIGNER_KEY,
    trigger: { type: "manual" },
    start: "s1",
    steps: [{ id: "s1", type: "approval", title, owner: { type: "role", role: "SAH" } }],
  });

  it("asks the worker once for the same definition, and again for a changed one", async () => {
    versionId = await saveDraft(as(DESIGNER), {
      key: DESIGNER_KEY,
      name: "Tasarımcı deneme akışı",
      definition: theirs("İlk hâli"),
    });

    const first = await requestDryRun(as(DESIGNER), versionId);
    expect(first?.asked).toBe(true);
    // The same definition is the same question; the key is the version and its content hash.
    expect((await requestDryRun(as(DESIGNER), versionId))?.asked).toBe(false);

    const { rows } = await admin.query(
      `select payload from core.scheduled_job
        where job_type = 'wfl.dry_run' and payload->>'versionId' = $1`,
      [versionId],
    );
    expect(rows).toHaveLength(1);

    await saveDraft(as(DESIGNER), {
      key: DESIGNER_KEY,
      name: "Tasarımcı deneme akışı",
      definition: theirs("Değişmiş hâli"),
    });
    const afterChange = await requestDryRun(as(DESIGNER), versionId);
    expect(afterChange?.asked).toBe(true);
    expect(afterChange?.hash).not.toBe(first?.hash);
  });

  it("reads the last answer and says whether it is still about this definition", async () => {
    await recordDryRun(as(DESIGNER), {
      versionId,
      passed: true,
      summary: { ends: "done", steps: [{ stepId: "s1", type: "approval", outcome: "waiting" }] },
    });
    const fresh = await readLastDryRun(as(DESIGNER), versionId);
    expect(fresh?.passed).toBe(true);
    expect(fresh?.current).toBe(true);

    await saveDraft(as(DESIGNER), {
      key: DESIGNER_KEY,
      name: "Tasarımcı deneme akışı",
      definition: theirs("Bir daha değişti"),
    });
    const stale = await readLastDryRun(as(DESIGNER), versionId);
    expect(stale?.current).toBe(false);
  });

  it("summarises what a publish would mean", async () => {
    const summary = await readPublishSummary(as(DESIGNER), versionId);
    expect(summary?.version).toBe(1);
    // Nothing is live yet, so nothing carries on with an older version.
    expect(summary?.liveVersion).toBeNull();
    expect(summary?.runningOnLive).toBe(0);
  });

  it("answers nothing to somebody who may not design flows", async () => {
    expect(await requestDryRun(as(OUTSIDER), versionId)).toBeNull();
    expect(await readLastDryRun(as(OUTSIDER), versionId)).toBeNull();
    expect(await readPublishSummary(as(OUTSIDER), versionId)).toBeNull();
  });
});
