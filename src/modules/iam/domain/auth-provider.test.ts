import { describe, expect, it } from "vitest";

import type { AuthProvider, AuthSession } from "@/modules/iam/domain/auth-provider";
import { resolvePostSignInRoute } from "@/modules/iam/application/auth-routing";

/**
 * Contract every adapter must satisfy (M0 plan §9). The in-memory fake stands in for Supabase so
 * the rules can be asserted without a network: a second factor always gates the `aal2` step.
 */
function createFakeAuthProvider(options: { password: string; totpCode?: string }): AuthProvider {
  let session: AuthSession | null = null;

  return {
    async signInWithPassword({ email, password }) {
      if (password !== options.password) {
        return { ok: false, code: "invalid_credentials" };
      }

      session = {
        user: { id: "user-1", email },
        currentLevel: "aal1",
        nextLevel: options.totpCode ? "aal2" : "aal1",
      };

      return { ok: true, data: undefined };
    },
    async signOut() {
      session = null;
    },
    async getSession() {
      return session;
    },
    async startTwoFactorEnrollment() {
      return { ok: true, data: { factorId: "factor-1", qrCode: "<svg />", secret: "SECRET" } };
    },
    async verifyTwoFactorCode({ code }) {
      if (!session || code !== options.totpCode) {
        return { ok: false, code: "invalid_code" };
      }

      session = { ...session, currentLevel: "aal2" };

      return { ok: true, data: undefined };
    },
    async requestPasswordReset() {
      return { ok: true, data: undefined };
    },
    async updatePassword() {
      return { ok: true, data: undefined };
    },
    async verifyRecoveryToken() {
      return { ok: true, data: undefined };
    },
  };
}

describe("AuthProvider contract", () => {
  it("refuses a wrong password and leaves no session behind", async () => {
    const auth = createFakeAuthProvider({ password: "dogruparola" });

    const result = await auth.signInWithPassword({ email: "a@b.com", password: "yanlis" });

    expect(result).toEqual({ ok: false, code: "invalid_credentials" });
    expect(await auth.getSession()).toBeNull();
  });

  it("signs in without a second factor and goes straight to the dashboard", async () => {
    const auth = createFakeAuthProvider({ password: "dogruparola" });

    await auth.signInWithPassword({ email: "a@b.com", password: "dogruparola" });

    expect(resolvePostSignInRoute(await auth.getSession())).toBe("/dashboard");
  });

  it("keeps a two-factor account at aal1 until the right code is entered", async () => {
    const auth = createFakeAuthProvider({ password: "dogruparola", totpCode: "123456" });

    await auth.signInWithPassword({ email: "a@b.com", password: "dogruparola" });

    expect(resolvePostSignInRoute(await auth.getSession())).toBe("/two-factor");
    expect(await auth.verifyTwoFactorCode({ code: "000000" })).toEqual({
      ok: false,
      code: "invalid_code",
    });

    await auth.verifyTwoFactorCode({ code: "123456" });

    expect((await auth.getSession())?.currentLevel).toBe("aal2");
    expect(resolvePostSignInRoute(await auth.getSession())).toBe("/dashboard");
  });

  it("drops the session on sign-out", async () => {
    const auth = createFakeAuthProvider({ password: "dogruparola" });

    await auth.signInWithPassword({ email: "a@b.com", password: "dogruparola" });
    await auth.signOut();

    expect(await auth.getSession()).toBeNull();
  });
});
