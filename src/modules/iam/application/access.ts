import "server-only";

import { cache } from "react";

import {
  findAccount,
  readAccess,
  readApprovalFacts,
  readManagers,
  readOwnerUsers,
  readPeople,
  readPermissions,
  readRememberedRole,
  readRoles,
  recordSession,
  rememberRole,
  type DbIdentity,
  type PanelAccount,
} from "@/modules/iam/data/iam-store";
import {
  approvalOwners,
  can,
  resolveActingRole,
  type ActingRole,
  type ApprovalOwners,
  type PermissionSnapshot,
  type ScopeItem,
} from "@/modules/iam/domain/permissions";

import { requiresTwoFactorStep } from "./auth-routing";
import {
  readPeopleSecurity,
  secondFactorRequired,
} from "@/modules/iam/data/account-security-store";
import { readPanelSession } from "./panel-session";
import { readAuthSession } from "./auth-session";

/**
 * The permission service (PERMISSIONS section 3, TASK-0102). Every server command and query asks
 * here before it runs; the answer comes from the same tables row level security reads.
 *
 * The snapshot is read once per request and dies with it, so a new assignment, an ended one or a
 * disabled account takes effect on the very next request (REQ-IAM-006, D-256).
 */

export class AccessDeniedError extends Error {
  constructor(readonly permission: string) {
    super(`Bu işlem için yetkiniz yok (${permission}).`);
    this.name = "AccessDeniedError";
  }
}

/**
 * The verified session that may use the panel: signed in, past the second factor when there is
 * one, and holding a panel session that is still alive (TASK-0112, D-230). Pages are also guarded
 * by their layout; server actions and route handlers have no layout, so this is the check they
 * rely on — and it is where the panel's own session rules reach them.
 *
 * The row must belong to the same person as the token. A cookie from another account is no more
 * use than no cookie at all.
 */
async function panelSession() {
  const session = await readAuthSession();
  if (!session) return null;
  const panel = await readPanelSession();
  if (!panel || panel.userId !== session.user.id) return null;
  // The provider cannot know about the panel's own recovery codes, so a session it still calls
  // aal1 may have passed the second step here (D-236). This is the only widening of the gate.
  if (requiresTwoFactorStep(session) && !panel.secondFactorAt) return null;
  return session;
}

/** Who the database transaction runs as, from the verified session; null when signed out. */
export const signInIdentity = cache(
  async (): Promise<{ identity: DbIdentity; account: PanelAccount } | null> => {
    const session = await panelSession();
    if (!session) return null;
    const identity: DbIdentity = { userId: session.user.id, actingRoleId: null };
    const account = await findAccount(identity);
    return account ? { identity, account } : null;
  },
);

/**
 * What the pages need to know about the account behind the provider's session (TASK-0112): whether
 * an active panel account exists at all, and whether the panel is waiting for a second factor —
 * after a reset, or because a role is on the administrator's list (REQ-IAM-003).
 *
 * Asked with the provider's session alone, not through `panelSession`: somebody standing at the
 * second-factor step has no panel session yet and still needs an honest answer here.
 */
export const readAccountFacts = cache(
  async (): Promise<{ active: boolean; secondFactorAsked: boolean }> => {
    const session = await readAuthSession();
    if (!session) return { active: false, secondFactorAsked: false };
    const identity: DbIdentity = { userId: session.user.id, actingRoleId: null };
    const account = await findAccount(identity);
    if (!account) return { active: false, secondFactorAsked: false };
    return {
      active: true,
      secondFactorAsked: account.mustSetup2fa || (await secondFactorRequired(identity)),
    };
  },
);

/** This request's permission snapshot; null when the person may not use the panel. */
export const readEffectivePermissions = cache(async (): Promise<PermissionSnapshot | null> => {
  const session = await panelSession();
  if (!session) return null;
  const access = await readAccess({ userId: session.user.id, actingRoleId: null });
  return access?.snapshot ?? null;
});

/** Throws `AccessDeniedError` unless the user holds the permission (in that place, if given). */
export async function assertCan(permission: string, item?: ScopeItem): Promise<PermissionSnapshot> {
  const snapshot = await readEffectivePermissions();
  if (!snapshot || !can(snapshot, permission, item)) throw new AccessDeniedError(permission);
  return snapshot;
}

/**
 * The identity a write runs under: the user plus the role it is recorded in (REQ-IAM-013).
 * `choose` is returned to the screen, which asks once and calls `chooseActingRole`.
 */
export async function actingIdentity(
  permission: string,
  item: ScopeItem,
): Promise<{ identity: DbIdentity; acting: ActingRole }> {
  const snapshot = await assertCan(permission, item);
  const base: DbIdentity = { userId: snapshot.userId, actingRoleId: null };
  const remembered = await readRememberedRole(base, permission);
  const acting = resolveActingRole(snapshot, permission, item, remembered);
  if (acting.kind === "denied") throw new AccessDeniedError(permission);
  return {
    identity: { ...base, actingRoleId: acting.kind === "role" ? acting.roleId : null },
    acting,
  };
}

/** Records the role chosen for a permission; refused unless one of the allowing roles. */
export async function chooseActingRole(permission: string, item: ScopeItem, roleId: string) {
  const snapshot = await assertCan(permission, item);
  const acting = resolveActingRole(snapshot, permission, item);
  const allowed = acting.kind === "choose" ? acting.roleIds : [];
  if (!allowed.includes(roleId)) throw new AccessDeniedError(permission);
  await rememberRole({ userId: snapshot.userId, actingRoleId: null }, permission, roleId);
}

async function currentIdentity(): Promise<DbIdentity> {
  const signedIn = await signInIdentity();
  if (!signedIn) throw new AccessDeniedError("iam.session");
  return signedIn.identity;
}

/** People for pickers and filters, as far as the signed-in person may see them. */
export async function listPeople() {
  return readPeople(await currentIdentity());
}

/** The company's roles, for a screen that lets somebody choose one (REQ-WFL-026). */
export async function listRoles() {
  return readRoles(await currentIdentity());
}

/** The permissions the panel knows, with their own names, for a screen that offers a choice. */
export async function listPermissions() {
  return readPermissions(await currentIdentity());
}

/**
 * Records a sign-in or sign-out in the audit log (REQ-IAM-008). `userId` comes from a session the
 * Auth server has just verified; a person without a panel account leaves no event.
 */
export async function noteSession(userId: string, kind: "signed_in" | "signed_out") {
  const identity: DbIdentity = { userId, actingRoleId: null };
  if (await findAccount(identity)) await recordSession(identity, kind);
}

/**
 * The people a user manager may act on, with the state of their access (D-273). The permission is
 * asked here so the screen can say "you may not see this"; the database asks it again and answers
 * nothing without it.
 */
export async function listPeopleSecurity() {
  await assertCan("iam.module.manage");
  return readPeopleSecurity(await currentIdentity());
}

/** A person's manager in one place: manual manager first, then the role hierarchy. */
export async function managerOf(userId: string, item: ScopeItem): Promise<string[]> {
  return readManagers(await currentIdentity(), userId, item);
}

/**
 * Who an approval step falls to (REQ-IAM-020, REQ-IAM-025, REQ-IAM-026). `"owner"` means an
 * owner approval: every owner sees it, any one of them completes it.
 */
export async function approvalOwner(step: {
  approver: string | "owner";
  item: ScopeItem;
  waitExpired: boolean;
  preparerId?: string | null;
}): Promise<ApprovalOwners> {
  const identity = await currentIdentity();
  if (step.approver === "owner") {
    const owners = (await readOwnerUsers(identity)).filter((id) => id !== step.preparerId);
    return { userIds: owners, via: owners.length ? "approver" : "nobody" };
  }
  const facts = await readApprovalFacts(identity, step.approver, step.item);
  return approvalOwners({
    approverId: step.approver,
    waitExpired: step.waitExpired,
    preparerId: step.preparerId,
    ...facts,
  });
}
