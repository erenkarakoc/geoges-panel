/**
 * Technical office items and the supply matrix against the real database (TASK-0123 step 4,
 * migration 0071, REQ-PRJ-004, REQ-PRJ-005, D-298).
 *
 * What is proved here: the delivery day is the database's; a late item is announced once per due
 * day and again for a new one; the flow's relation finds the item's responsible person and the
 * authority-approval list holds only open items of that kind; the person responsible may move
 * their own item and a stranger may not add one; a matrix row is never changed, a change is never
 * dated into the past, and the matrix of a day is read from the rows valid then.
 * Test data carries the ZZT-0123T prefix and is removed afterwards. `npm run test:db`.
 */
import type pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { connectAdmin } from "../../../../scripts/db-admin.mjs";
import { releaseTestPeople } from "../../../../scripts/db-test-people.mjs";
import { kyselyOn, type PooledClient } from "@/platform/db/run-as-user";

import {
  countOfficeRevision,
  insertOfficeItem,
  insertSupplyRow,
  readAuthorityApprovalsAsSystem,
  readOfficeAssigneeAsSystem,
  readLateOfficeItems,
  readOfficeItems,
  setOfficeItemStatus,
} from "./technical-office-store";

const id = (n: number) => `0192f0c1-0123-7500-8000-${String(n).padStart(12, "0")}`;
const OFFICE = id(1);
const ENGINEER = id(2);
const STRANGER = id(3);
const PEOPLE = [OFFICE, ENGINEER, STRANGER];
const PREFIX = "ZZT-0123T-";

let admin: pg.Client;
let project: string;
let drawing: string;
let authority: string;
let concrete: string;

const as = (userId: string) => ({ userId, actingRoleId: null });
const db = () => kyselyOn(admin as unknown as PooledClient);
const one = async (query: string, values: unknown[] = []) =>
  (await admin.query(query, values)).rows[0];
const errorOf = (promise: Promise<unknown>) =>
  promise.then(
    () => "no error",
    (e: { hint?: string; code?: string }) => e.hint ?? e.code ?? "no code",
  );
const day = async (offset: number) =>
  (await one("select (iam.today() + $1::int)::text as d", [offset])).d as string;
const announcements = async (itemId: string) =>
  Number(
    (
      await one(
        `select count(*) as n from core.outbox
          where event_code = 'technical_office_item.overdue' and record_id = $1`,
        [itemId],
      )
    ).n,
  );

async function cleanUp() {
  const { rows } = await admin.query("select id from prj.project where code like $1", [
    `${PREFIX}%`,
  ]);
  const projects = rows.map((row: { id: string }) => row.id);
  if (projects.length) {
    const items = (
      await admin.query("select id from prj.technical_office_item where project_id = any($1)", [
        projects,
      ])
    ).rows.map((row: { id: string }) => row.id);
    const records = [...projects, ...items];
    await admin.query(
      `delete from core.outbox_delivery where outbox_id in
         (select id from core.outbox where record_id = any($1::uuid[]))`,
      [records],
    );
    await admin.query("delete from core.outbox where record_id = any($1::uuid[])", [records]);
    await admin.query("alter table prj.supply_responsibility disable trigger append_only_guard");
    try {
      await admin.query("delete from prj.supply_responsibility where project_id = any($1)", [
        projects,
      ]);
    } finally {
      await admin.query("alter table prj.supply_responsibility enable trigger append_only_guard");
    }
    await admin.query(
      "select aud.purge_record_history_for_reset('prj.technical_office_item', $1::uuid[])",
      [items],
    );
    await admin.query("delete from prj.technical_office_item where id = any($1::uuid[])", [items]);
    await admin.query("alter table prj.project_stage_change disable trigger append_only_guard");
    try {
      await admin.query("delete from prj.project_stage_change where project_id = any($1)", [
        projects,
      ]);
    } finally {
      await admin.query("alter table prj.project_stage_change enable trigger append_only_guard");
    }
    await admin.query(
      `delete from core.search_posting where search_row_id in
         (select id from core.search_row where record_id = any($1::uuid[]))`,
      [projects],
    );
    await admin.query("delete from core.search_row where record_id = any($1::uuid[])", [projects]);
    await admin.query("select aud.purge_record_history_for_reset('prj.project', $1::uuid[])", [
      projects,
    ]);
    await admin.query("delete from prj.project where id = any($1::uuid[])", [projects]);
  }
  await admin.query("delete from iam.role_assignment where user_id = any($1::uuid[])", [PEOPLE]);
  await releaseTestPeople(admin, PEOPLE);
  await admin.query("delete from iam.user where id = any($1::uuid[])", [PEOPLE]);
}

beforeAll(async () => {
  admin = await connectAdmin();
  await cleanUp();
  await admin.query(
    `insert into iam.user (id, email, display_name, auth_provider_id)
     values ($1, 't0123t-1@example.test', 'Deneme teknik ofis', $1),
            ($2, 't0123t-2@example.test', 'Deneme mühendis', $2),
            ($3, 't0123t-3@example.test', 'Deneme yabancı', $3)`,
    PEOPLE,
  );
  await admin.query(
    `insert into iam.role_assignment (user_id, role_id, scope_type, scope_ids, starts_on)
     select $1, r.id, 'company', '{}', iam.today() - 1 from iam.role r where r.code = 'TO'`,
    [OFFICE],
  );
  project = (
    await one(
      "insert into prj.project (code, name) values ($1, 'Deneme teknik ofis') returning id",
      [`${PREFIX}A`],
    )
  ).id;
  const code = async (catalog: string, item: string) =>
    (
      await one(
        `select i.id from adm.catalog_item i join adm.catalog c on c.id = i.catalog_id
          where c.key = $1 and i.code = $2`,
        [catalog, item],
      )
    ).id as string;
  drawing = await code("technical_office_type", "drawing");
  authority = await code("technical_office_type", "authority_approval");
  concrete = await code("supply_item", "concrete");
});

afterAll(async () => {
  if (admin) {
    await cleanUp();
    await admin.end();
  }
});

describe("technical office items (REQ-PRJ-005)", () => {
  let item: string;

  it("keeps the delivery day itself, and counts revisions", async () => {
    item = (await insertOfficeItem(as(OFFICE), project, {
      assigneeUserId: ENGINEER,
      dueOn: await day(-2),
      title: "Uygulama projesi çizimi",
      typeItemId: drawing,
    })) as string;
    expect(await setOfficeItemStatus(as(OFFICE), item, "delivered")).toBe(true);
    let found = (await readOfficeItems(as(OFFICE), project)).find((one) => one.id === item);
    expect(found?.deliveredOn).toBe(await day(0));
    // It came back: one more revision, and it is work again.
    expect(await countOfficeRevision(as(OFFICE), item)).toBe(true);
    found = (await readOfficeItems(as(OFFICE), project)).find((one) => one.id === item);
    expect(found).toMatchObject({ deliveredOn: null, revisionCount: 1, status: "in_progress" });
  });

  it("is announced once when late, and again for a new due day", async () => {
    await admin.query("select prj.announce_overdue_technical_items()");
    await admin.query("select prj.announce_overdue_technical_items()");
    expect(await announcements(item)).toBe(1);
    await admin.query(
      "update prj.technical_office_item set due_on = iam.today() - 1 where id = $1",
      [item],
    );
    await admin.query("select prj.announce_overdue_technical_items()");
    expect(await announcements(item)).toBe(2);
    const payload = (
      await one(`select payload from core.outbox where record_id = $1 order by id desc limit 1`, [
        item,
      ])
    ).payload;
    expect(payload).toMatchObject({ assignee_user_id: ENGINEER, project_id: project });
  });

  it("gives the flow the item's responsible person and the open authority approvals", async () => {
    expect(await readOfficeAssigneeAsSystem(db(), item)).toBe(ENGINEER);
    const open = (await insertOfficeItem(as(OFFICE), project, {
      title: "Karayolları onayı",
      typeItemId: authority,
    })) as string;
    const done = (await insertOfficeItem(as(OFFICE), project, {
      title: "Belediye onayı",
      typeItemId: authority,
    })) as string;
    await setOfficeItemStatus(as(OFFICE), done, "delivered");
    const list = await readAuthorityApprovalsAsSystem(db(), project);
    expect(list.map((entry) => entry.id)).toEqual([open]);
    expect(list[0].label).toBe("Karayolları onayı");
  });

  it("lets the responsible person move their own item, and a stranger add nothing", async () => {
    expect(await setOfficeItemStatus(as(ENGINEER), item, "delivered")).toBe(true);
    expect(
      await errorOf(
        insertOfficeItem(as(STRANGER), project, { title: "Yetkisiz iş", typeItemId: drawing }),
      ),
    ).toBe("42501");
  });
});

describe('late items on "Bugün" (REQ-PRJ-005)', () => {
  it("shows every late item to the office, the person their own, and a stranger nothing", async () => {
    const late = (await insertOfficeItem(as(OFFICE), project, {
      assigneeUserId: ENGINEER,
      dueOn: await day(-3),
      title: "Geciken metraj",
      typeItemId: drawing,
    })) as string;
    await insertOfficeItem(as(OFFICE), project, {
      dueOn: await day(-1),
      title: "Sorumlusuz geciken iş",
      typeItemId: drawing,
    });
    const today = await day(0);
    const office = await readLateOfficeItems(as(OFFICE), today);
    const mine = office.items.filter((item) => item.projectId === project);
    expect(mine.map((item) => item.title)).toEqual(["Geciken metraj", "Sorumlusuz geciken iş"]);
    const engineer = await readLateOfficeItems(as(ENGINEER), today);
    expect(engineer.items.map((item) => item.id)).toEqual([late]);
    expect((await readLateOfficeItems(as(STRANGER), today)).total).toBe(0);
  });
});

describe("the supply matrix (REQ-PRJ-004)", () => {
  it("is dated, never changed, and never rewrites a past period", async () => {
    // The first row of an item may start in the past: the project began before the panel.
    const first = (await insertSupplyRow(as(OFFICE), project, {
      itemId: concrete,
      responsibility: "client",
      validFrom: await day(-30),
    })) as string;
    expect(
      await errorOf(
        insertSupplyRow(as(OFFICE), project, {
          itemId: concrete,
          responsibility: "geoges",
          validFrom: await day(-5),
        }),
      ),
    ).toBe("prj.supply_backdated");
    await insertSupplyRow(as(OFFICE), project, {
      itemId: concrete,
      responsibility: "client_deducts",
      validFrom: await day(0),
    });
    expect(
      await errorOf(
        admin.query(
          "update prj.supply_responsibility set responsibility = 'geoges' where id = $1",
          [first],
        ),
      ),
    ).not.toBe("no error");

    const on = async (offset: number) =>
      (
        await one(
          "select responsibility from prj.supply_matrix_on($1, $2::date) where item_id = $3",
          [project, await day(offset), concrete],
        )
      )?.responsibility;
    expect(await on(-10)).toBe("client");
    expect(await on(0)).toBe("client_deducts");
    expect(await on(-31)).toBeUndefined();
  });
});
