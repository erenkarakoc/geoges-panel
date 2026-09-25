/**
 * The firm card against the real database (TASK-0122, migration 0062, REQ-CRM-004, REQ-PUR-001).
 *
 * What is proved here is what keeps one card per firm and who may touch it: the tax number is
 * unique, a name is compared on its distinctive words rather than the "İnşaat Sanayi Ticaret"
 * every firm has, a firm met again in another role gains the role instead of a second card, and
 * only the modules that register firms may write them. Test firms carry tax numbers starting
 * 99912 and are removed afterwards with their history and events. `npm run test:db`.
 */
import type pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { connectAdmin } from "../../../../scripts/db-admin.mjs";
import { releaseTestPeople } from "../../../../scripts/db-test-people.mjs";
import { kyselyOn, type PooledClient } from "@/platform/db/run-as-user";

import {
  addPartyRole,
  insertContact,
  insertParty,
  projectPartyForSearch,
  readContacts,
  readParty,
  readSimilarParties,
  setPartyCustomFields,
  updateParty,
} from "./party-store";

const id = (n: number) => `0192f0c1-0122-7100-8000-${String(n).padStart(12, "0")}`;
const MANAGER = id(1);
const BUYER = id(2);
const FOREMAN = id(3);
const PEOPLE = [MANAGER, BUYER, FOREMAN];
const TAX = (n: number) => `99912${String(n).padStart(5, "0")}`;

let admin: pg.Client;

const as = (userId: string) => ({ userId, actingRoleId: null });

const errorOf = (promise: Promise<unknown>) =>
  promise.then(
    () => "no error",
    (e: { hint?: string; code?: string }) => e.hint ?? e.code ?? "no code",
  );

const firm = (n: number, name: string, roles: string[] = ["client"]) => ({
  name,
  roles: roles as ("client" | "supplier" | "customer" | "subcontractor" | "lessor")[],
  taxNo: TAX(n),
});

async function cleanUp() {
  const { rows } = await admin.query("select id from crm.party where tax_no like '99912%'");
  const parties = rows.map((row: { id: string }) => row.id);
  if (parties.length) {
    const { rows: people } = await admin.query(
      "select id from crm.party_contact where party_id = any($1::uuid[])",
      [parties],
    );
    const contacts = people.map((row: { id: string }) => row.id);
    await admin.query(
      `delete from core.outbox_delivery where outbox_id in
         (select id from core.outbox where record_schema = 'crm' and record_id = any($1::uuid[]))`,
      [parties],
    );
    await admin.query(
      "delete from core.outbox where record_schema = 'crm' and record_id = any($1::uuid[])",
      [parties],
    );
    await admin.query(
      `delete from core.search_posting where search_row_id in
         (select id from core.search_row where record_schema = 'crm' and record_id = any($1::uuid[]))`,
      [parties],
    );
    await admin.query(
      "delete from core.search_row where record_schema = 'crm' and record_id = any($1::uuid[])",
      [parties],
    );
    if (contacts.length) {
      await admin.query(
        "select aud.purge_record_history_for_reset('crm.party_contact', $1::uuid[])",
        [contacts],
      );
      await admin.query("delete from crm.party_contact where id = any($1::uuid[])", [contacts]);
    }
    await admin.query("select aud.purge_record_history_for_reset('crm.party', $1::uuid[])", [
      parties,
    ]);
    await admin.query("delete from crm.party where id = any($1::uuid[])", [parties]);
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
     select u.id, 't0122p-' || u.n || '@example.test', 'Deneme firma ' || u.n, u.id
       from unnest($1::uuid[]) with ordinality as u(id, n)`,
    [PEOPLE],
  );
  // The owner, purchasing (registers suppliers) and a foreman (reads names, nothing more).
  for (const [person, role] of [
    [MANAGER, "SAH"],
    [BUYER, "SAL"],
    [FOREMAN, "FO"],
  ]) {
    await admin.query(
      `insert into iam.role_assignment (user_id, role_id, scope_type, scope_ids, starts_on)
       select $1, r.id, 'company', '{}', iam.today() - 1 from iam.role r where r.code = $2`,
      [person, role],
    );
  }
});

afterAll(async () => {
  if (admin) {
    await cleanUp();
    await admin.end();
  }
});

describe("one card per firm (REQ-CRM-004, CRM-K1)", () => {
  let first: string;

  it("registers a firm with its roles in their fixed order", async () => {
    first = await insertParty(as(MANAGER), {
      ...firm(1, "Qadirkent İnşaat Sanayi ve Ticaret Ltd. Şti.", ["client"]),
      city: "Ankara",
    });
    const found = await readParty(as(MANAGER), first);
    expect(found?.roles).toEqual(["client"]);
    expect(found?.city).toBe("Ankara");
  });

  it("refuses a second card with the same tax number", async () => {
    expect(await errorOf(insertParty(as(MANAGER), firm(1, "Başka Ad A.Ş.")))).toBe("23505");
  });

  it("gives the firm met again its new role instead of a second card (REQ-PUR-001)", async () => {
    expect(await addPartyRole(as(BUYER), first, "supplier")).toBe(true);
    expect(await addPartyRole(as(BUYER), first, "supplier")).toBe(true);
    expect((await readParty(as(MANAGER), first))?.roles).toEqual(["client", "supplier"]);
  });

  it("refuses a firm without a role", async () => {
    expect(
      await errorOf(
        admin.query("insert into crm.party (name, roles, tax_no) values ('Rolsüz', '{}', $1)", [
          TAX(9),
        ]),
      ),
    ).toBe("23514");
  });

  it("finds a firm by its distinctive words, even misspelt", async () => {
    const names = async (asked: string) =>
      (await readSimilarParties(as(MANAGER), asked)).map((row) => row.id);
    expect(await names("Qadirkent Yapı A.Ş.")).toContain(first);
    expect(await names("Qadrkent")).toContain(first);
    expect(await names("qadirkent")).toContain(first);
  });

  it("does not call two firms alike because both are 'İnşaat Sanayi Ticaret Ltd. Şti.'", async () => {
    const names = async (asked: string) =>
      (await readSimilarParties(as(MANAGER), asked)).map((row) => row.id);
    expect(await names("Deneme İnşaat Sanayi ve Ticaret Ltd. Şti.")).not.toContain(first);
    expect(await readSimilarParties(as(MANAGER), "İnşaat Sanayi ve Ticaret Ltd. Şti.")).toEqual([]);
  });

  it("leaves the card itself out when it is the one being edited", async () => {
    const found = await readSimilarParties(as(MANAGER), "Qadirkent", first);
    expect(found.map((row) => row.id)).not.toContain(first);
  });
});

describe("who may do what", () => {
  let party: string;

  it("lets purchasing register a supplier", async () => {
    party = await insertParty(as(BUYER), firm(2, "Wolmarsk Galvaniz", ["supplier"]));
    expect(party).toBeTruthy();
  });

  it("lets a foreman read a firm's name but not register one or see its people", async () => {
    await insertContact(as(BUYER), party, { name: "Deneme Kişi", phone: "0312 000 00 00" });
    expect((await readParty(as(FOREMAN), party))?.name).toBe("Wolmarsk Galvaniz");
    expect(await readContacts(as(FOREMAN), party)).toEqual([]);
    expect((await readContacts(as(BUYER), party)).map((c) => c.name)).toEqual(["Deneme Kişi"]);
    expect(await errorOf(insertParty(as(FOREMAN), firm(3, "Yetkisiz Firma")))).toBe("42501");
  });

  it("checks custom values against their definitions", async () => {
    expect(await errorOf(setPartyCustomFields(as(MANAGER), party, { yok_boyle_alan: 1 }))).toBe(
      "adm.custom_field_invalid",
    );
  });
});

describe("events and search (TASK-0110)", () => {
  let party: string;

  const events = async () =>
    (
      await admin.query(
        "select event_code from core.outbox where record_schema = 'crm' and record_id = $1 order by id",
        [party],
      )
    ).rows.map((row: { event_code: string }) => row.event_code);

  it("publishes a created event, and a changed one only when something changed", async () => {
    party = await insertParty(as(MANAGER), firm(4, "Ertuvalı Vinç Kiralama", ["lessor"]));
    const input = { ...firm(4, "Ertuvalı Vinç Kiralama", ["lessor"]), city: "İzmir" };
    await updateParty(as(MANAGER), party, input);
    await updateParty(as(MANAGER), party, input);
    expect(await events()).toEqual(["party.created", "party.changed"]);
  });

  it("looks in search like a firm: its name, roles and city, opening its card", async () => {
    const projection = await projectPartyForSearch(
      kyselyOn(admin as unknown as PooledClient),
      party,
    );
    expect(projection).toMatchObject({
      dataClass: "internal",
      linkPath: `/leads-clients/parties/${party}`,
      recordType: "crm.party",
      secondary: "Kiralayan · İzmir",
      title: "Ertuvalı Vinç Kiralama",
    });
    expect(projection?.text).toContain(TAX(4));
  });
});
