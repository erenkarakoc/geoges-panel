import type { AuthSession } from "@/modules/iam/domain/auth-provider";

export const signInRoute = "/sign-in";
export const twoFactorRoute = "/two-factor";
export const updatePasswordRoute = "/update-password";
export const onboardingRoute = "/onboarding";
export const todayRoute = "/today";

/** The user has a second factor but the session has not cleared it yet. */
export function requiresTwoFactorStep(session: AuthSession): boolean {
  return session.nextLevel === "aal2" && session.currentLevel !== "aal2";
}

/** Where a user lands right after a successful password sign-in. */
export function resolvePostSignInRoute(session: AuthSession | null): string {
  if (!session) {
    return signInRoute;
  }

  return requiresTwoFactorStep(session) ? twoFactorRoute : todayRoute;
}

/**
 * Route a protected page must send the visitor to, or `null` when they may stay.
 *
 * `panelSession` is whether the panel's own session is still alive (TASK-0112, D-230): the
 * provider's token may be good for thirty days while the panel's rules have already ended the
 * session — three days without use, a revoked session, a disabled account. Without one the visitor
 * signs in again, which is what starts a new one.
 */
export function resolveProtectedPageRedirect(
  session: AuthSession | null,
  panelSession: boolean,
): string | null {
  if (!session) {
    return signInRoute;
  }
  if (requiresTwoFactorStep(session)) {
    return twoFactorRoute;
  }

  return panelSession ? null : signInRoute;
}

/**
 * Where a visitor of the sign-in page belongs, or `null` when they may see the form. Someone in
 * the middle of signing in goes on to their second step; someone whose panel session is over sees
 * the form again, which is the only way to start a new one — bouncing them to the panel would
 * bounce them straight back.
 */
export function resolveSignInPageRedirect(
  session: AuthSession | null,
  panelSession: boolean,
): string | null {
  if (!session) {
    return null;
  }
  if (requiresTwoFactorStep(session)) {
    return twoFactorRoute;
  }

  return panelSession ? todayRoute : null;
}
