/**
 * IAM's public surface (MODULE_BOUNDARIES section 2, TASK-0099). Code outside the module imports
 * only from here, apart from the `ui/` screens that routes render; the ESLint boundary rule
 * enforces it. Server-only: the session helpers use the server Supabase client.
 */
export {
  dashboardRoute,
  resolvePostSignInRoute,
  resolveProtectedPageRedirect,
  signInRoute,
} from "./application/auth-routing";
export { readAuthSession, verifyRecoveryToken } from "./application/auth-session";
export type { AuthSession } from "./domain/auth-provider";
