/**
 * Form state shared by the auth server actions and the `useActionState` hooks in the forms.
 * Kept out of `auth-actions.ts` because a `"use server"` module may only export async functions.
 */

export type AuthFormState = { error: string | null };
/** Keeps the typed e-mail so a failed sign-in does not empty the form. */
export type SignInState = { error: string | null; email: string };
export type PasswordResetState = { error: string | null; sentTo: string | null; email: string };
export type TwoFactorEnrollmentState = {
  error: string | null;
  enrollment: { qrCode: string; secret: string } | null;
};

/**
 * Verifying a code. A first enrolment answers with the ten recovery codes, which are shown once and
 * never again (D-236); signing in with a code that is already set up simply goes on to the panel.
 */
export type TwoFactorVerifyState = { error: string | null; recoveryCodes: string[] | null };

/** Removing the second factor reports success too, so the screen can switch to the setup view. */
export type TwoFactorRemovalState = { error: string | null; removed: boolean };

export const initialAuthFormState: AuthFormState = { error: null };
export const initialTwoFactorRemovalState: TwoFactorRemovalState = { error: null, removed: false };
export const initialSignInState: SignInState = { error: null, email: "" };
export const initialTwoFactorVerifyState: TwoFactorVerifyState = {
  error: null,
  recoveryCodes: null,
};
export const initialPasswordResetState: PasswordResetState = {
  error: null,
  sentTo: null,
  email: "",
};
export const initialTwoFactorEnrollmentState: TwoFactorEnrollmentState = {
  error: null,
  enrollment: null,
};
