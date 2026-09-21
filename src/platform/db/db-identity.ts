/**
 * Who a database transaction runs as (ADR-015). Both values end up in transaction-local
 * settings that every row level security policy reads through `core.current_user_id()` and
 * `core.current_role_id()`. Building one from the verified server session is IAM's job
 * (TASK-0102); this layer only refuses anything that is not a well-formed id.
 */
export interface DbIdentity {
  userId: string;
  /** Acting role (PERMISSIONS.md); null until the user has picked one. */
  actingRoleId: string | null;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function assertDbIdentity(identity: DbIdentity): DbIdentity {
  if (!UUID.test(identity.userId)) throw new Error("DbIdentity.userId is not a UUID.");
  if (identity.actingRoleId !== null && !UUID.test(identity.actingRoleId)) {
    throw new Error("DbIdentity.actingRoleId is not a UUID.");
  }
  return identity;
}
