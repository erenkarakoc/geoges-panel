import { describe, expect, it } from "vitest";

import {
  COMPANY,
  approvalOwners,
  can,
  canSee,
  iamRuleMessage,
  resolveActingRole,
  scopeOf,
  visibleColumns,
  type Grant,
  type PermissionSnapshot,
} from "./permissions";

const KAVAKLI = "0192f0c1-0000-7000-8000-0000000000a1";
const ILGAZ = "0192f0c1-0000-7000-8000-0000000000a2";
const SM = "role-sm";
const KO = "role-ko";

const grant = (permission: string, roleId: string | null, sites?: string[]): Grant =>
  sites
    ? { permission, roleId, scopeType: "site", scopeIds: sites }
    : { permission, roleId, scopeType: "company", scopeIds: [] };

const snapshot = (over: Partial<PermissionSnapshot> = {}): PermissionSnapshot => ({
  userId: "user",
  isOwnerLayer: false,
  grants: [],
  dataClasses: [],
  ...over,
});

describe("can (PERMISSIONS section 2)", () => {
  const s = snapshot({ grants: [grant("sit.module.view", SM, [KAVAKLI])] });

  it("limits a scoped permission to its sites (REQ-IAM-012)", () => {
    expect(can(s, "sit.module.view", { type: "site", id: KAVAKLI })).toBe(true);
    expect(can(s, "sit.module.view", { type: "site", id: ILGAZ })).toBe(false);
    expect(can(s, "sit.module.view", COMPANY)).toBe(false);
  });

  it("answers 'anywhere at all' without a scope item, as navigation asks", () => {
    expect(can(s, "sit.module.view")).toBe(true);
    expect(can(s, "fin.module.view")).toBe(false);
  });

  it("unites the permissions of several roles (REQ-IAM-013)", () => {
    const both = snapshot({
      grants: [grant("sit.module.view", SM, [KAVAKLI]), grant("sit.module.view", KO, [ILGAZ])],
    });
    expect(can(both, "sit.module.view", { type: "site", id: ILGAZ })).toBe(true);
    expect(scopeOf(both, "sit.module.view", "site")).toEqual([KAVAKLI, ILGAZ]);
  });

  it("reports a company-wide scope as such", () => {
    const s2 = snapshot({
      grants: [grant("sit.module.view", KO), grant("sit.module.view", SM, [KAVAKLI])],
    });
    expect(scopeOf(s2, "sit.module.view", "site")).toBe("company");
  });
});

describe("data classes (REQ-IAM-011)", () => {
  const s = snapshot({
    dataClasses: [
      { module: "fin", scopeType: "site", scopeIds: [KAVAKLI], commercial: true, sensitive: false },
      { module: "hr", scopeType: "company", scopeIds: [], commercial: false, sensitive: true },
    ],
  });
  const columns = { amount: "commercial", note: "general", iban: "sensitive" } as const;

  it("opens a class module by module and scope by scope", () => {
    expect(canSee(s, "fin", "commercial", { type: "site", id: KAVAKLI })).toBe(true);
    expect(canSee(s, "fin", "commercial", { type: "site", id: ILGAZ })).toBe(false);
    expect(canSee(s, "prj", "commercial", { type: "site", id: KAVAKLI })).toBe(false);
    expect(canSee(s, "hr", "sensitive")).toBe(true);
    expect(canSee(s, "fin", "sensitive", { type: "site", id: KAVAKLI })).toBe(false);
  });

  it("drops a column from a list spanning scopes unless the right is company-wide", () => {
    expect(visibleColumns(s, "fin", columns)).toEqual(["note"]);
    expect(visibleColumns(s, "fin", columns, { type: "site", id: KAVAKLI })).toEqual([
      "amount",
      "note",
    ]);
  });

  it("shows every class of every module to full visibility", () => {
    const full = snapshot({
      dataClasses: [
        { module: "*", scopeType: "company", scopeIds: [], commercial: true, sensitive: true },
      ],
    });
    expect(visibleColumns(full, "fin", columns)).toEqual(["amount", "note", "iban"]);
  });
});

describe("acting role (REQ-IAM-013)", () => {
  const here = { type: "site", id: KAVAKLI } as const;

  it("never asks a person with one allowing role", () => {
    const s = snapshot({ grants: [grant("sit.module.manage", SM, [KAVAKLI])] });
    expect(resolveActingRole(s, "sit.module.manage", here)).toEqual({ kind: "role", roleId: SM });
  });

  it("asks once when two roles allow the action, then uses the remembered choice", () => {
    const s = snapshot({
      grants: [grant("sit.module.manage", SM, [KAVAKLI]), grant("sit.module.manage", KO)],
    });
    expect(resolveActingRole(s, "sit.module.manage", here)).toEqual({
      kind: "choose",
      roleIds: [KO, SM].sort(),
    });
    expect(resolveActingRole(s, "sit.module.manage", here, KO)).toEqual({
      kind: "role",
      roleId: KO,
    });
  });

  it("asks again when the remembered role no longer allows it", () => {
    const s = snapshot({
      grants: [grant("sit.module.manage", SM, [KAVAKLI]), grant("sit.module.manage", KO)],
    });
    expect(resolveActingRole(s, "sit.module.manage", here, "role-gone").kind).toBe("choose");
  });

  it("only counts roles that cover the place", () => {
    const s = snapshot({
      grants: [grant("sit.module.manage", SM, [KAVAKLI]), grant("sit.module.manage", KO, [ILGAZ])],
    });
    expect(resolveActingRole(s, "sit.module.manage", here)).toEqual({ kind: "role", roleId: SM });
  });

  it("records no role for a personal exception, and denies what nothing allows", () => {
    const s = snapshot({ grants: [grant("fin.module.view", null)] });
    expect(resolveActingRole(s, "fin.module.view", here)).toEqual({ kind: "exception" });
    expect(resolveActingRole(s, "fin.module.manage", here)).toEqual({ kind: "denied" });
  });
});

describe("approval owner (REQ-IAM-020, REQ-IAM-026)", () => {
  const base = {
    approverId: "approver",
    approverActive: true,
    delegateIds: [] as string[],
    managerIds: ["manager"],
    waitExpired: false,
  };

  it("goes to the active delegate first", () => {
    expect(approvalOwners({ ...base, delegateIds: ["delegate"] })).toEqual({
      userIds: ["delegate"],
      via: "delegate",
    });
  });

  it("stays with the approver when nobody stands in", () => {
    expect(approvalOwners(base)).toEqual({ userIds: ["approver"], via: "approver" });
  });

  it("goes one role up once the waiting time has passed", () => {
    expect(approvalOwners({ ...base, delegateIds: ["delegate"], waitExpired: true })).toEqual({
      userIds: ["manager"],
      via: "manager",
    });
  });

  it("goes one role up when the approver can no longer sign in", () => {
    expect(approvalOwners({ ...base, approverActive: false }).via).toBe("manager");
  });

  it("never gives the preparer their own approval", () => {
    expect(approvalOwners({ ...base, preparerId: "approver" })).toEqual({
      userIds: ["manager"],
      via: "manager",
    });
    expect(
      approvalOwners({
        ...base,
        preparerId: "manager",
        approverActive: false,
        managerIds: ["manager"],
      }),
    ).toEqual({ userIds: [], via: "nobody" });
  });
});

describe("rule messages", () => {
  it("turns a database guard hint into the Turkish sentence", () => {
    expect(iamRuleMessage({ hint: "iam.flow_design_needs_full_visibility" })).toMatch(
      /tam görünürlüklü/,
    );
    expect(iamRuleMessage(new Error("other"))).toBeNull();
  });
});
