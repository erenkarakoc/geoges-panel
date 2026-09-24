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
    expect(resolveProtectedPageRedirect(twoFactorCleared, true)).toBeNull();
    expect(resolveProtectedPageRedirect(withoutTwoFactor, true)).toBeNull();
  });

  it("blocks a protected page until the second factor is verified", () => {
    expect(resolveProtectedPageRedirect(twoFactorPending, true)).toBe(twoFactorRoute);
    expect(resolveProtectedPageRedirect(twoFactorPending, false)).toBe(twoFactorRoute);
  });

  it("sends a visitor whose panel session is over back to signing in", () => {
    // The provider's token can still be good for weeks while the panel's own rules have ended
    // the session: three days unused, revoked, or the account disabled (D-230, REQ-IAM-006).
    expect(resolveProtectedPageRedirect(twoFactorCleared, false)).toBe(signInRoute);
    expect(resolveProtectedPageRedirect(withoutTwoFactor, false)).toBe(signInRoute);
  });

  it("sends a signed-out visitor to sign-in", () => {
    expect(resolveProtectedPageRedirect(null, false)).toBe(signInRoute);
  });
});

describe("resolveSignInPageRedirect", () => {
  it("shows the form to a visitor with no session at all", () => {
    expect(resolveSignInPageRedirect(null, false)).toBeNull();
  });

  it("sends someone mid-sign-in on to their second step", () => {
    expect(resolveSignInPageRedirect(twoFactorPending, false)).toBe(twoFactorRoute);
  });

  it("sends a whole session to the panel", () => {
    expect(resolveSignInPageRedirect(twoFactorCleared, true)).toBe(todayRoute);
  });

  it("shows the form again when the panel session is over, instead of bouncing", () => {
    // The protected page would send them straight back here; signing in is what starts a new one.
    expect(resolveSignInPageRedirect(twoFactorCleared, false)).toBeNull();
  });
});
