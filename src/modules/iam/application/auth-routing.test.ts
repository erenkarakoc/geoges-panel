import { describe, expect, it } from "vitest";

import {
  todayRoute,
  resolvePostSignInRoute,
  resolveProtectedPageRedirect,
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
    expect(resolveProtectedPageRedirect(twoFactorCleared)).toBeNull();
    expect(resolveProtectedPageRedirect(withoutTwoFactor)).toBeNull();
  });

  it("blocks a protected page until the second factor is verified", () => {
    expect(resolveProtectedPageRedirect(twoFactorPending)).toBe(twoFactorRoute);
  });

  it("sends a signed-out visitor to sign-in", () => {
    expect(resolveProtectedPageRedirect(null)).toBe(signInRoute);
  });
});
