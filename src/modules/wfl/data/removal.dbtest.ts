/**
 * Removing a flow or a template, against the real database (owner 2026-09-26, D-293, migration
 * 0067).
 *
 * The owner's rule: a flow that never ran is deleted; a flow that ran is closed and archived,
 * because its runs, approvals and tasks are records; a template leaves the list for good — a seed
 * does not bring it back — and can be restored. Each is written to the audit log. `npm run test:db`.
 */
import pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { connectAdmin } from "../../../../scripts/db-admin.mjs";
import { releaseTestPeople } from "../../../../scripts/db-test-people.mjs";
import {
  readFlowForDesigner,
  readFlows,
  readTemplates,
  removeFlow,
  reopenFlow,
  restoreFlow,
  saveDraft,
  setTemplateRemoved,
  startFromTemplate,
} from "@/modules/wfl/data/flow-store";

const id = (n: number) => `0192f0c1-0293-7000-8000-${String(n).padStart(12, "0")}`;
const DESIGNER = id(1);
const OUTSIDER = id(2);
const PEOPLE = [DESIGNER, OUTSIDER];

let admin: pg.Client;
/** Audit entries cannot be removed by design, so assertions about them are scoped by time. */
let startedAt: Date;

const as = (userId: string) => ({ userId, actingRoleId: null });

const errorOf = (promise: Promise<unknown>) =>
  promise.then(
    () => "no error",
    (e: { hint?: string; code?: string }) => e.hint ?? e.code ?? "no code",
  );

const definition = (title: string, extra: object[] = []) => ({
  trigger: { type: "manual" },
  start: "start_1",
  steps: [
    { id: "start_1", type: "start", title, next: "end_1" },
    ...extra,
    { id: "end_1", type: "end" },
  ],
});

async function flowId(key: string): Promise<string | null> {
  const { rows } = await admin.query("select id from wfl.flow where key = $1", [key]);
  return rows[0]?.id ?? null;
}

async function audited(event: string): Promise<number> {
  const { rows } = await admin.query(
    "select count(*)::int as n from aud.audit_log where event_type = $1 and occurred_at >= $2",
    [event, startedAt],
  );
  return rows[0].n;
}

async function cleanUp() {
  await admin.query(
    "delete from wfl.instance where flow_id in (select id from wfl.flow where key like 'zz-t0293-%')",
  );
  await admin.query("delete from wfl.flow where key like 'zz-t0293-%'");
  await admin.query("delete from wfl.template where key like 'zz-t0293-%'");
  await releaseTestPeople(admin, PEOPLE);
  await admin.query("delete from iam.role_assignment where user_id = any($1::uuid[])", [PEOPLE]);
  await admin.query("delete from iam.user where id = any($1::uuid[])", [PEOPLE]);
}

beforeAll(async () => {
  admin = await connectAdmin();
  await cleanUp();
  startedAt = (await admin.query("select clock_timestamp() as t")).rows[0].t;
  await admin.query(
    `insert into iam.user (id, email, display_name, auth_provider_id)
     select u.id, 't0293-' || u.n || '@example.test', 'Deneme silme ' || u.n, u.id
       from unnest($1::uuid[]) with ordinality as u(id, n)`,
    [PEOPLE],
  );
  const { rows } = await admin.query("select id from iam.role where code = 'SAH'");
  await admin.query(
    `insert into iam.role_assignment (user_id, role_id, scope_type, scope_ids, starts_on)
     values ($1, $2, 'company', '{}', iam.today() - 1)`,
    [DESIGNER, rows[0].id],
  );
});

afterAll(async () => {
  if (admin) {
    await cleanUp();
    await admin.end();
  }
});

describe("removing a flow", () => {
  it("deletes a flow that never ran, with its versions, and writes that it did", async () => {
    await saveDraft(as(DESIGNER), {
      key: "zz-t0293-trial",
      name: "Deneme akışı",
      definition: definition("Başla"),
    });
    const flow = await readFlowForDesigner(as(DESIGNER), "zz-t0293-trial");
    expect(flow?.hasRun).toBe(false);

    expect(await removeFlow(as(DESIGNER), flow!.flowId, "Deneme için açılmıştı")).toBe("deleted");
    expect(await flowId("zz-t0293-trial")).toBeNull();
    const { rows } = await admin.query(
      "select count(*)::int as n from wfl.flow_version where flow_id = $1",
      [flow!.flowId],
    );
    expect(rows[0].n).toBe(0);
    expect(await audited("workflow.deleted")).toBe(1);
  });

  it("archives a flow that ran instead: closed, off the list, its run kept", async () => {
    const versionId = await saveDraft(as(DESIGNER), {
      key: "zz-t0293-ran",
      name: "Çalışmış akış",
      definition: definition("Başla"),
    });
    const id = (await flowId("zz-t0293-ran"))!;
    await admin.query(
      `insert into wfl.instance (flow_version_id, flow_id, flow_key, version, trigger_kind)
       values ($1, $2, 'zz-t0293-ran', 1, 'manual')`,
      [versionId, id],
    );

    expect(await removeFlow(as(DESIGNER), id, "Artık kullanılmıyor")).toBe("archived");
    const listed = (await readFlows(as(DESIGNER))).find((one) => one.key === "zz-t0293-ran");
    expect(listed?.archivedAt).not.toBeNull();
    expect(listed?.disabledAt).not.toBeNull();
    const { rows } = await admin.query(
      "select count(*)::int as n from wfl.instance where flow_id = $1",
      [id],
    );
    expect(rows[0].n).toBe(1);
    expect(await audited("workflow.archived")).toBe(1);
    // Removing it again finds nothing to remove: it is already archived.
    expect(await removeFlow(as(DESIGNER), id, "İkinci kez")).toBeNull();
  });

  it("brings an archived flow back closed, and reopens a closed one", async () => {
    const id = (await flowId("zz-t0293-ran"))!;
    expect(await reopenFlow(as(DESIGNER), id)).toBe(false); // archived flows are restored first
    expect(await restoreFlow(as(DESIGNER), id)).toBe(true);
    let flow = await readFlowForDesigner(as(DESIGNER), "zz-t0293-ran");
    expect(flow).toMatchObject({ archived: false, closed: true });
    expect(await reopenFlow(as(DESIGNER), id)).toBe(true);
    flow = await readFlowForDesigner(as(DESIGNER), "zz-t0293-ran");
    expect(flow).toMatchObject({ archived: false, closed: false });
    expect(await audited("workflow.restored")).toBe(1);
    expect(await audited("workflow.reopened")).toBe(1);
  });

  it("refuses to remove a flow another flow hands work to", async () => {
    await saveDraft(as(DESIGNER), {
      key: "zz-t0293-child",
      name: "Alt akış",
      definition: definition("Başla"),
    });
    await saveDraft(as(DESIGNER), {
      key: "zz-t0293-parent",
      name: "Ana akış",
      definition: {
        ...definition("Başla"),
        steps: [
          { id: "start_1", type: "start", title: "Başla", next: "sub_1" },
          { id: "sub_1", type: "subflow", title: "Alt iş", flow: "zz-t0293-child", next: "end_1" },
          { id: "end_1", type: "end" },
        ],
      },
    });
    const child = (await flowId("zz-t0293-child"))!;
    expect(await errorOf(removeFlow(as(DESIGNER), child, "Gerek kalmadı"))).toBe("wfl.flow_in_use");
    expect(await flowId("zz-t0293-child")).not.toBeNull();
  });

  it("asks for a reason and for the design permission", async () => {
    const child = (await flowId("zz-t0293-child"))!;
    expect(await errorOf(removeFlow(as(DESIGNER), child, " "))).toBe("wfl.reason");
    expect(await errorOf(removeFlow(as(OUTSIDER), child, "Gerek kalmadı"))).toBe(
      "wfl.design_permission",
    );
  });
});

describe("removing a template", () => {
  const TEMPLATE = "zz-t0293-template";

  beforeAll(async () => {
    await admin.query(
      `insert into wfl.template (key, name, summary, version, definition)
       values ($1, 'Deneme şablonu', 'Silme denemesi', 1, $2)`,
      [TEMPLATE, JSON.stringify(definition("Başla"))],
    );
    await startFromTemplate(as(DESIGNER), {
      templateKey: TEMPLATE,
      flowKey: "zz-t0293-copy",
      flowName: "Şablondan kopya",
    });
  });

  it("takes it off the list, keeps it out after a seed, and leaves its copies alone", async () => {
    expect(await setTemplateRemoved(as(DESIGNER), TEMPLATE, true)).toBe(true);
    expect((await readTemplates(as(DESIGNER))).map((one) => one.key)).not.toContain(TEMPLATE);
    expect((await readTemplates(as(DESIGNER), true)).map((one) => one.key)).toContain(TEMPLATE);

    // What a seed carrying a newer version does (db/seeds/0008): the definition moves on, the
    // company's removal stays.
    await admin.query(
      `insert into wfl.template (key, name, summary, version, definition)
       values ($1, 'Deneme şablonu', 'Yeni sürüm', 2, $2)
       on conflict (key) do update
         set version = excluded.version, definition = excluded.definition, updated_at = now()
         where wfl.template.version < excluded.version`,
      [TEMPLATE, JSON.stringify(definition("Başla, yeni"))],
    );
    expect((await readTemplates(as(DESIGNER))).map((one) => one.key)).not.toContain(TEMPLATE);

    expect(await flowId("zz-t0293-copy")).not.toBeNull();
    expect(
      await errorOf(
        startFromTemplate(as(DESIGNER), {
          templateKey: TEMPLATE,
          flowKey: "zz-t0293-copy-two",
          flowName: "İkinci kopya",
        }),
      ),
    ).toBe("wfl.no_template");
    expect(await audited("workflow.template_removed")).toBe(1);
  });

  it("brings it back from the removed templates", async () => {
    expect(await setTemplateRemoved(as(DESIGNER), TEMPLATE, false)).toBe(true);
    expect((await readTemplates(as(DESIGNER))).map((one) => one.key)).toContain(TEMPLATE);
    expect(await setTemplateRemoved(as(DESIGNER), TEMPLATE, false)).toBe(false);
    expect(await audited("workflow.template_restored")).toBe(1);
    expect(await errorOf(setTemplateRemoved(as(OUTSIDER), TEMPLATE, true))).toBe(
      "wfl.design_permission",
    );
  });
});
