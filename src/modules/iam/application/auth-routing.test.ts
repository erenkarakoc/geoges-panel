import { describe, expect, it } from "vitest";

import {
  todayRoute,
  resolvePostSignInRoute,
  resolveProtectedPageRedirect,
  resolveSignInPageRedirect,
  signInRoute,
  twoFactorRoute,
} from "@/modules/iam/application/auth-routing";
import type { AuthSession } from "@/modules/iam/domain/auth-provider";

const user = { id: "user-1", email: "eren@example.com" };

const withoutTwoFactor: AuthSession = { user, currentLevel: "aal1", nextLevel: "aal1" };
const twoFactorPending: AuthSession = { user, currentLevel: "aal1", nextLevel: "aal2" };
const twoFactorCleared: AuthSession = { user, currentLevel: "aal2", nextLevel: "aal2" };
/** A panel session that is alive; the recovery-code case carries a date instead of null. */
const alive = { secondFactorAt: null };
const byRecoveryCode = { secondFactorAt: new Date("2026-09-24T10:00:00Z") };

describe("resolvePostSignInRoute", () => {
  it("sends a user without a second factor to the Today screen", () => {
    expect(resolvePostSignInRoute(withoutTwoFactor)).toBe(todayRoute);
  });

  it("stops at the two-factor step while the session is still aal1", () => {
    expect(resolvePostSignInRoute(twoFactorPending)).toBe(twoFactorRoute);
  });

  it("sends a fully verified session to the Today screen", () => {
    expect(resolvePostSignInRoute(twoFactorCleared)).toBe(todayRoute);
  });

  it("falls back to sign-in when there is no session", () => {
    expect(resolvePostSignInRoute(null)).toBe(signInRoute);
  });
});

describe("resolveProtectedPageRedirect", () => {
  it("lets a cleared session stay on the page", () => {
    expect(resolveProtectedPageRedirect(twoFactorCleared, alive)).toBeNull();
    expect(resolveProtectedPageRedirect(withoutTwoFactor, alive)).toBeNull();
  });

  it("blocks a protected page until the second factor is verified", () => {
    expect(resolveProtectedPageRedirect(twoFactorPending, alive)).toBe(twoFactorRoute);
    expect(resolveProtectedPageRedirect(twoFactorPending, null)).toBe(twoFactorRoute);
  });

  it("sends a visitor whose panel session is over back to signing in", () => {
    // The provider's token can still be good for weeks while the panel's own rules have ended
    // the session: three days unused, revoked, or the account disabled (D-230, REQ-IAM-006).
    expect(resolveProtectedPageRedirect(twoFactorCleared, null)).toBe(signInRoute);
    expect(resolveProtectedPageRedirect(withoutTwoFactor, null)).toBe(signInRoute);
  });

  it("sends a signed-out visitor to sign-in", () => {
    expect(resolveProtectedPageRedirect(null, null)).toBe(signInRoute);
  });
});

describe("the second step by recovery code", () => {
  it("lets a session the provider still calls aal1 through, because the panel passed it", () => {
    // Supabase cannot know about the panel's own codes, so the panel's session says it (D-236).
    expect(resolveProtectedPageRedirect(twoFactorPending, byRecoveryCode)).toBeNull();
    expect(resolveSignInPageRedirect(twoFactorPending, byRecoveryCode)).toBe(todayRoute);
  });

  it("still stops a pending step when nothing passed it", () => {
    expect(resolveProtectedPageRedirect(twoFactorPending, alive)).toBe(twoFactorRoute);
  });
});

describe("resolveSignInPageRedirect", () => {
  it("shows the form to a visitor with no session at all", () => {
    expect(resolveSignInPageRedirect(null, null)).toBeNull();
  });

  it("sends someone mid-sign-in on to their second step", () => {
    expect(resolveSignInPageRedirect(twoFactorPending, null)).toBe(twoFactorRoute);
  });

  it("sends a whole session to the panel", () => {
    expect(resolveSignInPageRedirect(twoFactorCleared, alive)).toBe(todayRoute);
  });

  it("shows the form again when the panel session is over, instead of bouncing", () => {
    // The protected page would send them straight back here; signing in is what starts a new one.
    expect(resolveSignInPageRedirect(twoFactorCleared, null)).toBeNull();
  });
});

describe("what the account owes", () => {
  const noAccount = { active: false, secondFactorAsked: false };
  const asksForFactor = { active: true, secondFactorAsked: true };

  it("shows no page to a provider account with no panel account", () => {
    // Disabled, past its leaving date, or never made: the database has refused its data since
    // TASK-0102 and the page follows (REQ-IAM-006, REQ-IAM-007).
    expect(resolveProtectedPageRedirect(twoFactorCleared, alive, noAccount)).toBe(signInRoute);
  });

  it("shows the sign-in form rather than bouncing such a visitor", () => {
    expect(resolveSignInPageRedirect(twoFactorCleared, alive, noAccount)).toBeNull();
  });

  it("sends somebody who owes a second factor to set one up", () => {
    // No factor yet — the provider says aal1 is all this account can reach — and the panel is
    // asking for one, either after a reset or because a role requires it (REQ-IAM-003).
    expect(resolveProtectedPageRedirect(withoutTwoFactor, alive, asksForFactor)).toBe(
      twoFactorRoute,
    );
    expect(resolveSignInPageRedirect(withoutTwoFactor, alive, asksForFactor)).toBe(twoFactorRoute);
  });

  it("stops asking once a factor exists", () => {
    expect(resolveProtectedPageRedirect(twoFactorCleared, alive, asksForFactor)).toBeNull();
  });
});
