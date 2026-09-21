/**
 * IAM's public surface (MODULE_BOUNDARIES section 2, TASK-0099). Code outside the module imports
 * only from here, apart from the `ui/` screens that routes render; the ESLint boundary rule
 * enforces it. Server-only: the session helpers use the server Supabase client.
 */
export {
  todayRoute,
  resolvePostSignInRoute,
  resolveProtectedPageRedirect,
  signInRoute,
} from "./application/auth-routing";
export { readAuthSession, verifyRecoveryToken } from "./application/auth-session";
export type { AuthSession } from "./domain/auth-provider";

// Permission service (TASK-0102, PERMISSIONS.md). Module data layers write their RLS policies with
// the `iam.*` database functions; server code asks these.
export {
  AccessDeniedError,
  actingIdentity,
  approvalOwner,
  assertCan,
  chooseActingRole,
  listPeople,
  managerOf,
  noteSession,
  readEffectivePermissions,
  signInIdentity,
} from "./application/access";
export {
  COMPANY,
  can,
  canSee,
  iamRuleMessage,
  scopeOf,
  visibleColumns,
  type ActingRole,
  type DataClass,
  type PermissionSnapshot,
  type ScopeItem,
} from "./domain/permissions";
