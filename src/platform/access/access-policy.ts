/**
 * Answers whether the current user may use a permission-guarded feature.
 *
 * Navigation, dashboard widgets and pages depend only on this interface.
 * The real implementation (dynamic roles, delegation, acting role) is provided by
 * the IAM module once roles are designed (Phase 01/03/04); UI code does not change.
 */
export type AccessPolicy = {
  can: (permission: string) => boolean;
};

/**
 * Milestone M0 preview policy: every signed-in user sees every placeholder module.
 * Must be replaced by the IAM policy before any real data is shown (CHG-002).
 */
export const previewAccessPolicy: AccessPolicy = {
  can: () => true,
};

export type PermissionGuarded = {
  /** Permission required to see the item. Items without one are always visible. */
  requiredPermission?: string;
};

export function filterByPermission<T extends PermissionGuarded>(
  items: readonly T[],
  access: AccessPolicy,
): T[] {
  return items.filter((item) => !item.requiredPermission || access.can(item.requiredPermission));
}
