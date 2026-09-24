/**
 * IAM's public surface (MODULE_BOUNDARIES section 2, TASK-0099). Code outside the module imports
 * only from here, apart from the `ui/` screens that routes render; the ESLint boundary rule
 * enforces it. Server-only: the session helpers use the server Supabase client.
 */
export {
  todayRoute,
  resolvePostSignInRoute,
  resolveProtectedPageRedirect,
  resolveSignInPageRedirect,
  signInRoute,
} from "./application/auth-routing";
export { readAuthSession, verifyRecoveryToken } from "./application/auth-session";
// The panel's own session (TASK-0112, D-230): pages ask whether one is still alive, the routing
// rules above decide what that means.
export { readPanelSession } from "./application/panel-session";
export type { AuthSession } from "./domain/auth-provider";

// Permission service (TASK-0102, PERMISSIONS.md). Module data layers write their RLS policies with
// the `iam.*` database functions; server code asks these.
export {
  AccessDeniedError,
  listPeopleSecurity,
  readAccountFacts,
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

// Scheduled work, collected by src/jobs/registry.ts (TASK-0104).
export { iamJobs } from "./data/iam-jobs";

// The module's capability catalog, read by the flow engine (TASK-0118).
export { iamCapabilities } from "@/modules/iam/capabilities";
