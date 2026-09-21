import "server-only";

import { cache } from "react";

import {
  findAccount,
  readAccess,
  readApprovalFacts,
  readManagers,
  readOwnerUsers,
  readRememberedRole,
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

/** Who the database transaction runs as, from the verified session; null when signed out. */
export const signInIdentity = cache(
  async (): Promise<{ identity: DbIdentity; account: PanelAccount } | null> => {
    const session = await readAuthSession();
    if (!session) return null;
    const identity: DbIdentity = { userId: session.user.id, actingRoleId: null };
    const account = await findAccount(identity);
    return account ? { identity, account } : null;
  },
);

/** This request's permission snapshot; null when the person may not use the panel. */
export const readEffectivePermissions = cache(async (): Promise<PermissionSnapshot | null> => {
  const session = await readAuthSession();
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
