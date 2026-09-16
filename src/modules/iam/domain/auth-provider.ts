/**
 * Authentication port (M0 plan §3.2, ADR-002). Screens and server actions only know this
 * interface; Supabase is one adapter behind it. Swapping the provider must not change the UI.
 */

export type AuthAssuranceLevel = "aal1" | "aal2";

export type AuthUser = {
  id: string;
  email: string | null;
};

export type AuthSession = {
  user: AuthUser;
  /** Assurance level the session currently holds. */
  currentLevel: AuthAssuranceLevel;
  /** Highest level this user can reach — `aal2` once a second factor is enrolled. */
  nextLevel: AuthAssuranceLevel;
};

export type TwoFactorEnrollment = {
  factorId: string;
  /** QR code for authenticator apps, as an image URL ready to use as an `img` source. */
  qrCode: string;
  /** Same secret in text form, for manual entry. */
  secret: string;
};

/** Stable, provider-independent reasons an auth call can fail. */
export type AuthFailureCode =
  | "invalid_credentials"
  | "invalid_code"
  | "two_factor_required"
  | "rate_limited"
  | "weak_password"
  | "same_password"
  | "expired_link"
  | "not_authenticated"
  | "unknown";

export type AuthOutcome<TData = undefined> =
  { ok: true; data: TData } | { ok: false; code: AuthFailureCode };

export interface AuthProvider {
  signInWithPassword(input: { email: string; password: string }): Promise<AuthOutcome>;
  signOut(): Promise<void>;
  /** Current session, or `null` when nobody is signed in. */
  getSession(): Promise<AuthSession | null>;
  /** Starts TOTP enrollment and returns the QR code to scan. */
  startTwoFactorEnrollment(): Promise<AuthOutcome<TwoFactorEnrollment>>;
  /** Verifies a TOTP code; on success the session is raised to `aal2`. */
  verifyTwoFactorCode(input: { code: string }): Promise<AuthOutcome>;
  /**
   * Removes the enrolled second factor. Lowers the account's protection, so the session must
   * already be at `aal2` — the provider rejects it otherwise.
   */
  disableTwoFactor(): Promise<AuthOutcome>;
  /** Sends a password reset link to `email`. */
  requestPasswordReset(input: { email: string; redirectTo: string }): Promise<AuthOutcome>;
  updatePassword(input: { password: string }): Promise<AuthOutcome>;
  /** Exchanges a `token_hash` from an email link for a session (PKCE recovery flow). */
  verifyRecoveryToken(input: { tokenHash: string }): Promise<AuthOutcome>;
}
