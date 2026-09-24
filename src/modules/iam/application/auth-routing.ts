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
 * What the panel's own session says about this visitor, or `null` when there is none
 * (TASK-0112, D-230, D-236). `secondFactorAt` is set when the second step was passed with a
 * recovery code: the provider cannot know about the panel's codes, so this is the panel's own
 * record of it and the one place the gate widens.
 */
export type PanelSessionFacts = { secondFactorAt: Date | null } | null;

/** Whether the second step is behind this visitor, by either route. */
function secondFactorDone(session: AuthSession, panel: PanelSessionFacts): boolean {
  return !requiresTwoFactorStep(session) || panel?.secondFactorAt != null;
}

/**
 * Route a protected page must send the visitor to, or `null` when they may stay.
 *
 * The panel's own session decides how long somebody stays (D-230): the provider's token may be
 * good for thirty days while the panel's rules have already ended the session — three days without
 * use, a revoked session, a disabled account. Without one the visitor signs in again, which is
 * what starts a new one.
 */
export function resolveProtectedPageRedirect(
  session: AuthSession | null,
  panel: PanelSessionFacts,
): string | null {
  if (!session) {
    return signInRoute;
  }
  if (!secondFactorDone(session, panel)) {
    return twoFactorRoute;
  }

  return panel ? null : signInRoute;
}

/**
 * Where a visitor of the sign-in page belongs, or `null` when they may see the form. Someone in
 * the middle of signing in goes on to their second step; someone whose panel session is over sees
 * the form again, which is the only way to start a new one — bouncing them to the panel would
 * bounce them straight back.
 */
export function resolveSignInPageRedirect(
  session: AuthSession | null,
  panel: PanelSessionFacts,
): string | null {
  if (!session) {
    return null;
  }
  if (!secondFactorDone(session, panel)) {
    return twoFactorRoute;
  }

  return panel ? todayRoute : null;
}
