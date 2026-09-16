import type { AuthSession } from "@/modules/iam/domain/auth-provider";

export const signInRoute = "/sign-in";
export const twoFactorRoute = "/two-factor";
export const updatePasswordRoute = "/update-password";
export const dashboardRoute = "/dashboard";

/** The user has a second factor but the session has not cleared it yet. */
export function requiresTwoFactorStep(session: AuthSession): boolean {
  return session.nextLevel === "aal2" && session.currentLevel !== "aal2";
}

/** Where a user lands right after a successful password sign-in. */
export function resolvePostSignInRoute(session: AuthSession | null): string {
  if (!session) {
    return signInRoute;
  }

  return requiresTwoFactorStep(session) ? twoFactorRoute : dashboardRoute;
}

/** Route a protected page must send the visitor to, or `null` when they may stay. */
export function resolveProtectedPageRedirect(session: AuthSession | null): string | null {
  if (!session) {
    return signInRoute;
  }

  return requiresTwoFactorStep(session) ? twoFactorRoute : null;
}
