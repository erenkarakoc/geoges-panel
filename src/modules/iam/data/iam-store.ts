import { sql } from "kysely";

import { runAsUser, type DbIdentity, type DbTransaction } from "@/platform/db";

import type {
  DataClassGrant,
  Grant,
  PermissionSnapshot,
  ScopeItem,
  ScopeType,
} from "@/modules/iam/domain/permissions";

/**
 * IAM's data layer (TASK-0102, PORTS_AND_SERVICES section 2). Every read goes through the
 * database functions of migration 0003, so the server and row level security answer from the
 * same tables; nothing here re-implements the permission rules.
 */

export type { DbIdentity };

export type PanelAccount = {
  id: string;
  email: string;
  displayName: string;
  mustSetup2fa: boolean;
};

type Tx = DbTransaction<unknown>;

const scopeArgs = (item: ScopeItem) =>
  item.type === "company" ? (["company", null] as const) : ([item.type, item.id] as const);

async function readAccount(db: Tx): Promise<PanelAccount | null> {
  const { rows } = await sql<{
    id: string;
    email: string;
    display_name: string;
    must_setup_2fa: boolean;
  }>`select id, email, display_name, must_setup_2fa from iam.my_account()`.execute(db);
  const row = rows[0];
  return row
    ? {
        id: row.id,
        email: row.email,
        displayName: row.display_name,
        mustSetup2fa: row.must_setup_2fa,
      }
    : null;
}

/** The signed-in account when it may use the panel; null when unknown, disabled or departed. */
export function findAccount(identity: DbIdentity) {
  return runAsUser(identity, readAccount);
}

/** Account and permission snapshot in one transaction; null when the account may not sign in. */
export function readAccess(
  identity: DbIdentity,
): Promise<{ account: PanelAccount; snapshot: PermissionSnapshot } | null> {
  return runAsUser(identity, async (db: Tx) => {
    const account = await readAccount(db);
    if (!account) return null;
    const grants = await sql<{
      permission_code: string;
      role_id: string | null;
      scope_type: ScopeType;
      scope_ids: string[];
    }>`select permission_code, role_id, scope_type, scope_ids from iam.my_grants()`.execute(db);
    const classes = await sql<{
      module: string;
      scope_type: ScopeType;
      scope_ids: string[];
      can_see_commercial: boolean;
      can_see_sensitive: boolean;
    }>`select module, scope_type, scope_ids, can_see_commercial, can_see_sensitive
         from iam.my_data_classes()`.execute(db);
    const owner = await sql<{ yes: boolean }>`select iam.is_owner_layer() as yes`.execute(db);
    return {
      account,
      snapshot: {
        userId: account.id,
        isOwnerLayer: owner.rows[0]?.yes === true,
        grants: grants.rows.map((g): Grant => ({
          permission: g.permission_code,
          roleId: g.role_id,
          scopeType: g.scope_type,
          scopeIds: g.scope_ids,
        })),
        dataClasses: classes.rows.map((d): DataClassGrant => ({
          module: d.module,
          scopeType: d.scope_type,
          scopeIds: d.scope_ids,
          commercial: d.can_see_commercial,
          sensitive: d.can_see_sensitive,
        })),
      },
    };
  });
}

/** The role the person chose earlier for this permission, if any (REQ-IAM-013). */
export function readRememberedRole(identity: DbIdentity, permission: string) {
  return runAsUser(identity, async (db: Tx) => {
    const { rows } = await sql<{ role_id: string }>`
      select role_id from iam.user_action_role_choice
       where user_id = ${identity.userId} and permission_code = ${permission}`.execute(db);
    return rows[0]?.role_id ?? null;
  });
}

/** Remembers the person's choice; the policy refuses a role they do not hold today. */
export function rememberRole(identity: DbIdentity, permission: string, roleId: string) {
  return runAsUser(identity, async (db: Tx) => {
    await sql`
      insert into iam.user_action_role_choice (user_id, permission_code, role_id)
      values (${identity.userId}, ${permission}, ${roleId})
      on conflict (user_id, permission_code)
      do update set role_id = excluded.role_id, chosen_at = now()`.execute(db);
  });
}

const ids = (rows: { id: string }[]) => rows.map((r) => r.id).sort();

/** Manager of a person in one place (REQ-IAM-014). */
export function readManagers(identity: DbIdentity, userId: string, item: ScopeItem) {
  const [type, id] = scopeArgs(item);
  return runAsUser(identity, async (db: Tx) =>
    ids(
      (
        await sql<{
          id: string;
        }>`select iam.manager_of(${userId}, ${type}, ${id}::uuid) as id`.execute(db)
      ).rows,
    ),
  );
}

/** Facts the approval fallback needs about one approver (REQ-IAM-020). */
export function readApprovalFacts(identity: DbIdentity, approverId: string, item: ScopeItem) {
  const [type, id] = scopeArgs(item);
  return runAsUser(identity, async (db: Tx) => {
    const active = await sql<{ yes: boolean }>`
      select iam.is_active_user(${approverId}) as yes`.execute(db);
    const delegates = await sql<{ id: string }>`
      select iam.active_delegates(${approverId}, ${type}, ${id}::uuid) as id`.execute(db);
    const managers = await sql<{ id: string }>`
      select iam.manager_of(${approverId}, ${type}, ${id}::uuid) as id`.execute(db);
    return {
      approverActive: active.rows[0]?.yes === true,
      delegateIds: ids(delegates.rows),
      managerIds: ids(managers.rows),
    };
  });
}

/** Writes a sign-in or sign-out event for the transaction's person (REQ-IAM-008). */
export function recordSession(identity: DbIdentity, kind: "signed_in" | "signed_out") {
  return runAsUser(identity, async (db: Tx) => {
    await sql`select iam.note_session(${kind})`.execute(db);
  });
}

/** People the signed-in person may see (own row, or everyone with `iam.module.view`), by name. */
export function readPeople(identity: DbIdentity) {
  return runAsUser(identity, async (db: Tx) => {
    const { rows } = await sql<{ id: string; display_name: string; status: string }>`
      select id, display_name, status from iam.user order by display_name, id`.execute(db);
    return rows.map((r) => ({
      id: r.id,
      displayName: r.display_name,
      active: r.status === "active",
    }));
  });
}

/**
 * The company's roles, for a screen that has to let somebody choose one — the flow designer asking
 * who approves a step (REQ-WFL-026). Any signed-in person may read the list of roles (0003), and
 * what they may *do* with one is asked where it is done.
 */
export function readRoles(identity: DbIdentity) {
  return runAsUser(identity, async (db: Tx) => {
    const { rows } = await sql<{ code: string; name: string; level: number }>`
      select code, name, level from iam.role where is_active
       order by level, name`.execute(db);
    return rows.map((r) => ({ code: r.code, name: r.name, level: Number(r.level) }));
  });
}

/** Everyone in the owner layer; an owner approval is done by any of them (REQ-IAM-025). */
export function readOwnerUsers(identity: DbIdentity) {
  return runAsUser(identity, async (db: Tx) =>
    ids((await sql<{ id: string }>`select iam.owner_users() as id`.execute(db)).rows),
  );
}
