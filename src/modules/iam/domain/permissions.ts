/**
 * Effective permission (PERMISSIONS.md section 2, TASK-0102, D-256).
 *
 * The database computes the snapshot (`iam.my_grants()`, `iam.my_data_classes()`); these pure
 * functions answer questions about it on the server, so the same tables decide what the server
 * allows and what row level security lets through. Nothing here reads a request or a clock.
 */

export type ScopeType = "company" | "site" | "project";

/** One place a question is asked about: the whole company, one site or one project. */
export type ScopeItem = { type: "company" } | { type: "site" | "project"; id: string };

export const COMPANY: ScopeItem = { type: "company" };

/** One permission the user holds, with the role and scope it comes from. */
export type Grant = {
  permission: string;
  /** Null when the permission comes from a personal exception, not a role. */
  roleId: string | null;
  scopeType: ScopeType;
  scopeIds: readonly string[];
};

/** Commercial / sensitive visibility of one module (`*` = every module) in one scope. */
export type DataClassGrant = {
  module: string;
  scopeType: ScopeType;
  scopeIds: readonly string[];
  commercial: boolean;
  sensitive: boolean;
};

export type PermissionSnapshot = {
  userId: string;
  isOwnerLayer: boolean;
  grants: readonly Grant[];
  dataClasses: readonly DataClassGrant[];
};

/** Data classes that are filtered out of queries (REQ-IAM-011); general and internal are not. */
export type DataClass = "general" | "internal" | "commercial" | "sensitive";

export function covers(scopeType: ScopeType, scopeIds: readonly string[], item: ScopeItem) {
  return scopeType === "company" || (item.type === scopeType && scopeIds.includes(item.id));
}

/**
 * Whether the user may use a permission. With a scope item: in that place. Without one: anywhere
 * at all, which is the question navigation asks ("show the menu item?").
 */
export function can(snapshot: PermissionSnapshot, permission: string, item?: ScopeItem) {
  return snapshot.grants.some(
    (g) => g.permission === permission && (!item || covers(g.scopeType, g.scopeIds, item)),
  );
}

/**
 * Whether the user sees a data class of a module. Without a scope item only a company-wide right
 * counts, so a list spanning several sites never shows a column that one of them may not show.
 */
export function canSee(
  snapshot: PermissionSnapshot,
  module: string,
  dataClass: DataClass,
  item: ScopeItem = COMPANY,
) {
  if (dataClass === "general" || dataClass === "internal") return true;
  return snapshot.dataClasses.some(
    (d) =>
      (d.module === module || d.module === "*") &&
      (dataClass === "commercial" ? d.commercial : d.sensitive) &&
      covers(d.scopeType, d.scopeIds, item),
  );
}

/**
 * The columns a query may select (REQ-IAM-011): a column the user may not see is left out of the
 * query itself, never blanked or masked afterwards.
 */
export function visibleColumns<C extends string>(
  snapshot: PermissionSnapshot,
  module: string,
  columns: Readonly<Record<C, DataClass>>,
  item?: ScopeItem,
): C[] {
  return (Object.keys(columns) as C[]).filter((c) => canSee(snapshot, module, columns[c], item));
}

/** Site or project ids where the user holds a permission; `"company"` when it is company-wide. */
export function scopeOf(
  snapshot: PermissionSnapshot,
  permission: string,
  type: "site" | "project",
): "company" | string[] {
  const grants = snapshot.grants.filter((g) => g.permission === permission);
  if (grants.some((g) => g.scopeType === "company")) return "company";
  return [...new Set(grants.filter((g) => g.scopeType === type).flatMap((g) => g.scopeIds))];
}

/**
 * Which role an action is recorded under (REQ-IAM-013):
 * - `role`: exactly one role allows it, or the remembered choice is still one of them;
 * - `choose`: several roles allow it and the person has not chosen yet (asked once);
 * - `exception`: only a personal exception allows it; no role is recorded;
 * - `denied`: nothing allows it.
 */
export type ActingRole =
  | { kind: "role"; roleId: string }
  | { kind: "choose"; roleIds: string[] }
  | { kind: "exception" }
  | { kind: "denied" };

export function resolveActingRole(
  snapshot: PermissionSnapshot,
  permission: string,
  item: ScopeItem,
  remembered: string | null = null,
): ActingRole {
  const allowing = snapshot.grants.filter(
    (g) => g.permission === permission && covers(g.scopeType, g.scopeIds, item),
  );
  const roleIds = [...new Set(allowing.flatMap((g) => (g.roleId ? [g.roleId] : [])))].sort();
  if (roleIds.length === 1) return { kind: "role", roleId: roleIds[0] };
  if (roleIds.length > 1) {
    return remembered && roleIds.includes(remembered)
      ? { kind: "role", roleId: remembered }
      : { kind: "choose", roleIds };
  }
  return allowing.length ? { kind: "exception" } : { kind: "denied" };
}

/**
 * Who an approval step falls to (PERMISSIONS section 4, REQ-IAM-020, REQ-IAM-026): the approver's
 * active delegate, else the approver, else — once the waiting time has passed, or when nobody is
 * left — the manager (REQ-IAM-014). The preparer is never among them when the step excludes them.
 * The workflow engine only asks this question; the facts come from IAM (D-097).
 */
export type ApprovalFacts = {
  approverId: string;
  approverActive: boolean;
  delegateIds: readonly string[];
  managerIds: readonly string[];
  waitExpired: boolean;
  preparerId?: string | null;
};

export type ApprovalOwners = {
  userIds: string[];
  via: "delegate" | "approver" | "manager" | "nobody";
};

export function approvalOwners(facts: ApprovalFacts): ApprovalOwners {
  const allowed = (ids: readonly string[]) =>
    [...new Set(ids)].filter((id) => id !== facts.preparerId).sort();
  if (!facts.waitExpired) {
    const delegates = allowed(facts.delegateIds);
    if (delegates.length) return { userIds: delegates, via: "delegate" };
    const approver = facts.approverActive ? allowed([facts.approverId]) : [];
    if (approver.length) return { userIds: approver, via: "approver" };
  }
  const managers = allowed(facts.managerIds);
  return managers.length ? { userIds: managers, via: "manager" } : { userIds: [], via: "nobody" };
}

/**
 * Turkish messages for the IAM rules the database enforces (migration 0003). The guards raise
 * with these hints, so the admin screen and the flow designer show the same sentence.
 */
export const IAM_RULE_MESSAGES: Readonly<Record<string, string>> = {
  "iam.flow_design_needs_full_visibility":
    "Akış tasarlama yetkisi yalnız tam görünürlüklü bir role verilebilir.",
  "iam.owner_layer_unrestricted": "Sahip katmanının yetkisi ve görünürlüğü daraltılamaz.",
  "iam.full_visibility_company_scope":
    "Tam görünürlüklü bir rol yalnız tüm şirket kapsamıyla verilir.",
  "iam.assignment_overlap": "Bu kişi bu rolü bu kapsamda aynı tarihlerde zaten taşıyor.",
  "iam.delegation_not_held":
    "Vekâlet yalnız, veren kişinin bütün kapsamda ve bütün süre boyunca taşıdığı bir rol için verilir.",
  "iam.role_hierarchy_cycle": "Bu üst rol seçimi rol hiyerarşisinde döngü oluşturur.",
};

/** The message of a database rule violation, or null when the error is not an IAM rule. */
export function iamRuleMessage(error: unknown): string | null {
  const hint = (error as { hint?: unknown } | null)?.hint;
  return typeof hint === "string" ? (IAM_RULE_MESSAGES[hint] ?? null) : null;
}
