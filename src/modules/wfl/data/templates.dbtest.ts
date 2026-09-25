/**
 * The templates the panel ships, against the real database (TASK-0120, REQ-WFL-027, REQ-WFL-028).
 *
 * Two things are proved here, and the first is the one that matters most: **every template the panel
 * ships is a definition the engine can actually walk.** Each one is parsed with the engine's own
 * schema and then dry-run — the same loop a publish is checked against — so a template that would
 * fail in front of a person fails here instead. What the templates *do* with real records is
 * accepted in the slices that own those records (D-279).
 *
 * The second is the copy rule (D-086): a copy carries the template's definition, a newer template
 * announces itself instead of changing the copy, and "reset to template" writes a new draft rather
 * than publishing over what is live. `npm run test:db`.
 */
import { Kysely, PostgresDialect } from "kysely";
import pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { connectAdmin } from "../../../../scripts/db-admin.mjs";
import { releaseTestPeople } from "../../../../scripts/db-test-people.mjs";
import { dryRun } from "@/modules/wfl/application/engine";
import { parseDefinition } from "@/modules/wfl/domain/definition";
import {
  readCopiesBehindTemplate,
  readFlowForDesigner,
  readTemplates,
  resetToTemplate,
  saveDraft,
  startFromTemplate,
} from "@/modules/wfl/data/flow-store";
import { readDatabaseConfig } from "@/platform/db/database-config";
import type { SystemDb } from "@/platform/jobs/types";

const id = (n: number) => `0192f0c1-0120-7000-8000-${String(n).padStart(12, "0")}`;
const DESIGNER = id(1);
const OUTSIDER = id(2);
const PEOPLE = [DESIGNER, OUTSIDER];
const TEMPLATE = "zz-t0120-template";
const COPY = "zz-t0120-copy";

let admin: pg.Client;
let workerPool: pg.Pool;
let worker: SystemDb;
/** Audit entries cannot be removed by design, so assertions about them are scoped by time. */
let startedAt: Date;

const as = (userId: string) => ({ userId, actingRoleId: null });

const errorOf = (promise: Promise<unknown>) =>
  promise.then(
    () => "no error",
    (e: { hint?: string; code?: string }) => e.hint ?? e.code ?? "no code",
  );

/**
 * The one relation these templates ask for. A role nobody holds yet answers with this test's own
 * person: what is being proved here is that the **definition** walks, not who happens to hold a role
 * in an empty company — a task addressed to an empty role is a staffing question and the engine
 * already says so in its own test.
 */
const relations = {
  resolve: async (_db: SystemDb, code: string, argument: string | null) => {
    if (code !== "role.holder" || !argument) return null;
    const { rows } = await admin.query(
      `select a.user_id from iam.role_assignment a join iam.role r on r.id = a.role_id
        where r.code = $1 order by a.starts_on, a.user_id limit 1`,
      [argument],
    );
    return rows[0]?.user_id ?? DESIGNER;
  },
};

/** A template of the test's own, so the copy rules are proved without touching a shipped one. */
const testTemplate = (title: string) => ({
  trigger: { type: "manual" },
  start: "start_1",
  steps: [
    { id: "start_1", type: "start", title, next: "end_1" },
    { id: "end_1", type: "end" },
  ],
});

async function cleanUp() {
  await admin.query(
    "delete from wfl.flow_version where flow_id in (select id from wfl.flow where key like 'zz-t0120-%')",
  );
  await admin.query("delete from wfl.flow where key like 'zz-t0120-%'");
  await admin.query("delete from wfl.template where key like 'zz-t0120-%'");
  await releaseTestPeople(admin, PEOPLE);
  await admin.query("delete from iam.role_assignment where user_id = any($1::uuid[])", [PEOPLE]);
  await admin.query("delete from iam.user where id = any($1::uuid[])", [PEOPLE]);
}

beforeAll(async () => {
  admin = await connectAdmin();
  workerPool = new pg.Pool(readDatabaseConfig(process.env, undefined, "DATABASE_WORKER_URL"));
  worker = new Kysely({ dialect: new PostgresDialect({ pool: workerPool }) });
  await cleanUp();
  startedAt = (await admin.query("select clock_timestamp() as t")).rows[0].t;

  await admin.query(
    `insert into iam.user (id, email, display_name, auth_provider_id)
     select u.id, 't0120-' || u.n || '@example.test', 'Deneme şablon ' || u.n, u.id
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
  await worker?.destroy();
  if (admin) {
    await cleanUp();
    await admin.end();
  }
});

/**
 * Templates that cannot finish a dry run yet, and the words that say why. Each one waits on a
 * capability a module will declare in its own slice (D-279); the list is here so that "it does not
 * run yet" stays a written fact with a reason rather than a test nobody wrote.
 */
const AWAITING_A_MODULE: Record<string, string> = {
  // Every one of these asks a module for a list of records — "this project's authority approvals",
  // "the sites that are active today" — and no module publishes a list yet (REQ-WFL-009).
  "authority-approvals": "listesi bu panelde tanımlı değil",
  "cash-shortfall": "listesi bu panelde tanımlı değil",
  "daily-log-opening": "listesi bu panelde tanımlı değil",
  "decision-reminder": "listesi bu panelde tanımlı değil",
  "monthly-progress-claim": "listesi bu panelde tanımlı değil",
  "personnel-exit": "listesi bu panelde tanımlı değil",
};

describe("the templates the panel ships", () => {
  it("ships the default processes REQ-WFL-028 lists", async () => {
    const keys = (await readTemplates(as(DESIGNER))).map((one) => one.key);
    for (const expected of [
      "daily-site-log-approval",
      "external-party-approval",
      "material-issue-request",
      "payment-approval",
      "personnel-exit",
      "progress-claim-to-invoice",
      "purchase-request-approval",
      "quote-approval",
      "revision-request-approval",
      "stock-count-approval",
    ]) {
      expect(keys).toContain(expected);
    }
  });

  it("ships a link for every one of the eight end-to-end processes (REQ-WFL-011, D-104)", async () => {
    const keys = (await readTemplates(as(DESIGNER))).map((one) => one.key);
    // One template per chain link of `docs/workflows/END_TO_END_FLOWS.md`. A process is a chain of
    // short flows, so what is checked here is that every link ships — not that one long flow does.
    for (const [process, links] of Object.entries({
      "1 yeni işten tahsilata": [
        "lead-intake",
        "quote-approval",
        "project-kickoff",
        "authority-approvals",
        "monthly-progress-claim",
        "progress-claim-to-invoice",
        "overdue-collection",
        "cost-feedback",
      ],
      "2 siparişten sahada kullanıma": [
        "critical-stock-request",
        "purchase-request-approval",
        "weighbridge-difference",
        "material-issue-request",
      ],
      "3 günlük saha üretimi": ["daily-log-opening", "daily-site-log-approval", "missed-daily-log"],
      "4 personel çıkışı": ["personnel-exit"],
      "5 işveren gecikmesi": ["repeated-client-wait", "client-obligation-delay"],
      "6 toplantı kararı": ["decision-reminder", "overdue-decision"],
      "7 sertifika ve İSG": ["expiring-document", "ohs-incident"],
      "8 nakit sıkışması": ["cash-shortfall"],
    })) {
      for (const link of links) {
        expect(keys, `${process}: ${link}`).toContain(link);
      }
    }
  });

  it("is a definition the engine's own schema accepts, every one of them", async () => {
    const templates = await readTemplates(as(DESIGNER));
    expect(templates.length).toBeGreaterThan(0);
    // The engine's own schema, not a second opinion: a template it refuses is a template that would
    // fail in front of a person.
    for (const template of templates) {
      expect(() => parseDefinition(template.definition), template.key).not.toThrow();
    }
  });

  it("walks from end to end, except where it waits for a module that is not here yet", async () => {
    const templates = await readTemplates(as(DESIGNER));

    for (const template of templates) {
      const definition = parseDefinition(template.definition);
      const report = await dryRun(worker, definition, { record: { amount: 1 } }, relations);

      if (AWAITING_A_MODULE[template.key]) {
        // Honest rather than green: this template needs an ability no module has declared yet, and
        // the dry run says exactly which one. It ships now and is accepted in the slice that owns
        // those records (D-279).
        expect({ key: template.key, passed: report.passed }).toEqual({
          key: template.key,
          passed: false,
        });
        expect(report.failure).toContain(AWAITING_A_MODULE[template.key]);
        continue;
      }

      expect({ key: template.key, passed: report.passed, failure: report.failure }).toEqual({
        key: template.key,
        passed: true,
        failure: undefined,
      });
    }
  });

  it("says nothing at all to somebody who may not design flows", async () => {
    expect(await readTemplates(as(OUTSIDER))).toEqual([]);
  });
});

describe("a copy of a template", () => {
  it("carries the template's definition and remembers where it came from", async () => {
    await admin.query(
      `insert into wfl.template (key, name, summary, version, definition)
       values ($1, 'Deneme şablonu', 'Testin kendi şablonu', 1, $2::jsonb)`,
      [TEMPLATE, JSON.stringify(testTemplate("Şablonun ilk hâli"))],
    );

    await startFromTemplate(as(DESIGNER), {
      templateKey: TEMPLATE,
      flowKey: COPY,
      flowName: "Deneme kopyası",
    });

    const copy = await readFlowForDesigner(as(DESIGNER), COPY);
    expect((copy?.definition as { steps: { title?: string }[] }).steps[0].title).toBe(
      "Şablonun ilk hâli",
    );
    const { rows } = await admin.query(
      "select source_template_key, source_template_version from wfl.flow where key = $1",
      [COPY],
    );
    expect(rows[0]).toEqual({ source_template_key: TEMPLATE, source_template_version: 1 });
  });

  it("is not changed when the template moves on, but says that it is behind", async () => {
    await admin.query(
      "update wfl.template set version = 2, definition = $2::jsonb where key = $1",
      [TEMPLATE, JSON.stringify(testTemplate("Şablonun yeni hâli"))],
    );

    const copy = await readFlowForDesigner(as(DESIGNER), COPY);
    // The copy is exactly what it was: a template update never reaches into one (D-086).
    expect((copy?.definition as { steps: { title?: string }[] }).steps[0].title).toBe(
      "Şablonun ilk hâli",
    );

    const behind = await readCopiesBehindTemplate(as(DESIGNER));
    const said = behind.find((one) => one.flowKey === COPY);
    expect(said).toMatchObject({ copyVersion: 1, templateKey: TEMPLATE, templateVersion: 2 });
  });

  it("announces the template's new version once, so the copies' owners can be told", async () => {
    const { rows } = await admin.query(
      `select payload from core.outbox
        where event_code = 'workflow.template_updated' and payload->>'template' = $1
          and occurred_at >= $2`,
      [TEMPLATE, startedAt],
    );
    // One announcement for one version bump: the news happens once and is told once.
    expect(rows).toHaveLength(1);
    expect(rows[0].payload.version).toBe(2);

    // A change that is not a new version is nobody's news.
    await admin.query("update wfl.template set summary = 'Aynı sürüm, yeni cümle' where key = $1", [
      TEMPLATE,
    ]);
    const after = await admin.query(
      `select count(*)::int as n from core.outbox
        where event_code = 'workflow.template_updated' and payload->>'template' = $1
          and occurred_at >= $2`,
      [TEMPLATE, startedAt],
    );
    expect(after.rows[0].n).toBe(1);
  });

  it("goes back to the template as a new draft, not over what is live", async () => {
    const versionId = await resetToTemplate(as(DESIGNER), COPY);
    expect(versionId).toBeTruthy();

    const copy = await readFlowForDesigner(as(DESIGNER), COPY);
    expect((copy?.definition as { steps: { title?: string }[] }).steps[0].title).toBe(
      "Şablonun yeni hâli",
    );
    // Still a draft: publishing needs a dry run of exactly this definition, reset or not.
    expect(copy?.status).toBe("draft");
    // And it is no longer behind its template.
    const behind = await readCopiesBehindTemplate(as(DESIGNER));
    expect(behind.some((one) => one.flowKey === COPY)).toBe(false);
  });

  it("writes the reset to the audit log, because somebody will ask who did it", async () => {
    const { rows } = await admin.query(
      `select payload from aud.audit_log
        where event_type = 'workflow.template_reset' and payload->>'flow' = $1
          and occurred_at >= $2`,
      [COPY, startedAt],
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].payload.template).toBe(TEMPLATE);
  });

  it("refuses a reset for a flow that is nobody's copy, and a copy for somebody without the right", async () => {
    await saveDraft(as(DESIGNER), {
      key: "zz-t0120-own",
      name: "Kendi akışı",
      definition: testTemplate("Şablonsuz"),
    });
    expect(await errorOf(resetToTemplate(as(DESIGNER), "zz-t0120-own"))).toBe(
      "wfl.no_template_source",
    );
    expect(
      await errorOf(
        startFromTemplate(as(OUTSIDER), {
          templateKey: TEMPLATE,
          flowKey: "zz-t0120-theirs",
          flowName: "Olmaz",
        }),
      ),
    ).toBe("wfl.design_permission");
  });
});
