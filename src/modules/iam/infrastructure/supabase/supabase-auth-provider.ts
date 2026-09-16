import type { AuthError, SupabaseClient } from "@supabase/supabase-js";

import type {
  AuthFailureCode,
  AuthOutcome,
  AuthProvider,
  AuthSession,
  TwoFactorEnrollment,
} from "@/modules/iam/domain/auth-provider";

const ok = <TData>(data: TData): AuthOutcome<TData> => ({ ok: true, data });
const fail = (code: AuthFailureCode): AuthOutcome<never> => ({ ok: false, code });

/** Supabase error codes mapped onto the provider-independent failure codes of the port. */
const failureCodes: Record<string, AuthFailureCode> = {
  invalid_credentials: "invalid_credentials",
  email_not_confirmed: "invalid_credentials",
  user_not_found: "invalid_credentials",
  mfa_verification_failed: "invalid_code",
  mfa_challenge_expired: "invalid_code",
  insufficient_aal: "two_factor_required",
  over_request_rate_limit: "rate_limited",
  over_email_send_rate_limit: "rate_limited",
  weak_password: "weak_password",
  same_password: "same_password",
  otp_expired: "expired_link",
  flow_state_expired: "expired_link",
  session_not_found: "not_authenticated",
  session_expired: "not_authenticated",
};

function toFailure(error: AuthError): AuthOutcome<never> {
  return fail((error.code && failureCodes[error.code]) ?? "unknown");
}

/**
 * The typings describe `totp.qr_code` as a bare SVG to be prefixed with `data:image/svg+xml`,
 * but the running API already returns a complete data URL. Accept both, so neither shape
 * reaches the screens as a broken image.
 */
function toImageUrl(qrCode: string): string {
  return qrCode.startsWith("data:")
    ? qrCode
    : `data:image/svg+xml;charset=utf-8,${encodeURIComponent(qrCode)}`;
}

export function createSupabaseAuthProvider(client: SupabaseClient): AuthProvider {
  /** Verified TOTP factor if there is one, otherwise a pending enrollment. */
  const findTotpFactorId = async (): Promise<string | null> => {
    const { data, error } = await client.auth.mfa.listFactors();

    if (error || !data) {
      return null;
    }

    const verified = data.totp.at(0);

    return (verified ?? data.all.findLast((factor) => factor.factor_type === "totp"))?.id ?? null;
  };

  return {
    async signInWithPassword({ email, password }) {
      const { error } = await client.auth.signInWithPassword({ email, password });

      return error ? toFailure(error) : ok(undefined);
    },

    async signOut() {
      await client.auth.signOut();
    },

    /**
     * Both levels come from sources the Auth server vouches for: `getClaims` verifies the token
     * signature, `listFactors` asks the server. `getAuthenticatorAssuranceLevel()` is avoided on
     * purpose — it reads the user object out of the cookie, which Supabase itself warns must not
     * drive access decisions (M0 plan §6).
     */
    async getSession(): Promise<AuthSession | null> {
      const { data, error } = await client.auth.getClaims();

      if (error || !data?.claims) {
        return null;
      }

      const { claims } = data;
      const user = { id: claims.sub, email: claims.email ?? null };

      // An `aal2` session has already cleared its second factor; the factor list adds nothing.
      if (claims.aal === "aal2") {
        return { user, currentLevel: "aal2", nextLevel: "aal2" };
      }

      const { data: factors } = await client.auth.mfa.listFactors();

      return {
        user,
        currentLevel: "aal1",
        nextLevel: factors && factors.totp.length > 0 ? "aal2" : "aal1",
      };
    },

    async startTwoFactorEnrollment(): Promise<AuthOutcome<TwoFactorEnrollment>> {
      const { data, error } = await client.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: `GEOGES ${new Date().toISOString()}`,
      });

      if (error) {
        return toFailure(error);
      }

      return ok({
        factorId: data.id,
        qrCode: toImageUrl(data.totp.qr_code),
        secret: data.totp.secret,
      });
    },

    async verifyTwoFactorCode({ code }) {
      const factorId = await findTotpFactorId();

      if (!factorId) {
        return fail("not_authenticated");
      }

      const { error } = await client.auth.mfa.challengeAndVerify({ factorId, code });

      return error ? toFailure(error) : ok(undefined);
    },

    async requestPasswordReset({ email, redirectTo }) {
      const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo });

      return error ? toFailure(error) : ok(undefined);
    },

    async updatePassword({ password }) {
      const { error } = await client.auth.updateUser({ password });

      return error ? toFailure(error) : ok(undefined);
    },

    async verifyRecoveryToken({ tokenHash }) {
      const { error } = await client.auth.verifyOtp({ type: "recovery", token_hash: tokenHash });

      return error ? toFailure(error) : ok(undefined);
    },
  };
}
