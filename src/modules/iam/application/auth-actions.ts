"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import type {
  AuthFormState,
  PasswordResetState,
  SignInState,
  TwoFactorEnrollmentState,
  TwoFactorRemovalState,
  TwoFactorVerifyState,
} from "@/modules/iam/application/auth-form-state";
import { lockedMessage } from "@/modules/iam/application/auth-lock-message";
import { authFailureMessage } from "@/modules/iam/application/auth-messages";
import {
  todayRoute,
  resolvePostSignInRoute,
  signInRoute,
  twoFactorRoute,
  updatePasswordRoute,
} from "@/modules/iam/application/auth-routing";
import {
  firstIssueMessage,
  passwordResetRequestSchema,
  signInSchema,
  twoFactorCodeSchema,
  updatePasswordSchema,
} from "@/modules/iam/application/auth-schemas";
import { createSupabaseSecondFactorAdmin } from "@/modules/iam/infrastructure/supabase/supabase-second-factor-admin";
import {
  hashRecoveryCode,
  looksLikeRecoveryCode,
  newRecoveryCodes,
} from "@/modules/iam/domain/recovery-codes";
import { looksLikeUserId } from "@/modules/iam/domain/user-id";
import {
  issueRecoveryCodes,
  noteSecondFactor,
  revokeSessions,
  spendRecoveryCode,
} from "@/modules/iam/data/account-security-store";
import {
  AccessDeniedError,
  assertCan,
  noteSession,
  signInIdentity,
} from "@/modules/iam/application/access";
import { closePanelSession, openPanelSession } from "@/modules/iam/application/panel-session";
import { loginLock, noteLoginAttempt } from "@/modules/iam/data/account-security-store";
import type { AuthProvider, AuthSession } from "@/modules/iam/domain/auth-provider";
import { createSupabaseAuthProvider } from "@/modules/iam/infrastructure/supabase/supabase-auth-provider";
import { createSupabaseServerClient } from "@/platform/supabase/server-client";

async function authProvider(): Promise<AuthProvider> {
  return createSupabaseAuthProvider(await createSupabaseServerClient());
}

/**
 * A sign-in is complete once no second step is pending: only then is it recorded, and only then
 * does the panel's own session begin (TASK-0112, D-230). Both places that can finish a sign-in —
 * the password step and the second-factor step — come through here.
 */
async function noteCompleteSignIn(session: AuthSession | null): Promise<void> {
  if (session && session.currentLevel === session.nextLevel) {
    await noteSession(session.user.id, "signed_in");
    await openPanelSession(
      { userId: session.user.id, actingRoleId: null },
      session.currentLevel === "aal2",
    );
  }
}

/** Where the try came from, as far as the request knows; both are the lock's evidence. */
async function whereFrom() {
  const header = await headers();
  const forwarded = header.get("x-forwarded-for");
  return {
    ip: forwarded?.split(",")[0]?.trim() ?? header.get("x-real-ip") ?? null,
    userAgent: header.get("user-agent"),
  };
}

export async function signInAction(
  _previous: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const email = String(formData.get("email") ?? "");
  const parsed = signInSchema.safeParse({ email, password: formData.get("password") });

  if (!parsed.success) {
    return { error: firstIssueMessage(parsed.error), email };
  }

  // Asked before the provider is: while an account is locked, the right password is refused too
  // (REQ-IAM-005), and the attempt is still recorded below.
  const standingLock = await loginLock(parsed.data.email);
  if (standingLock) {
    await noteLoginAttempt({ email: parsed.data.email, succeeded: false, ...(await whereFrom()) });
    return { error: lockedMessage(standingLock), email };
  }

  const auth = await authProvider();
  const result = await auth.signInWithPassword(parsed.data);
  const lock = await noteLoginAttempt({
    email: parsed.data.email,
    succeeded: result.ok,
    ...(await whereFrom()),
  });

  if (!result.ok) {
    // This try was the one that crossed the line: say the lock, not "wrong password".
    return { error: lock ? lockedMessage(lock) : authFailureMessage(result.code), email };
  }

  const session = await auth.getSession();
  await noteCompleteSignIn(session);
  redirect(resolvePostSignInRoute(session));
}

export async function signOutAction(): Promise<void> {
  const auth = await authProvider();
  const session = await auth.getSession();
  if (session) {
    await noteSession(session.user.id, "signed_out");
    await closePanelSession({ userId: session.user.id, actingRoleId: null });
  }
  await auth.signOut();

  redirect(signInRoute);
}

export async function disableTwoFactorAction(
  previous: TwoFactorRemovalState,
): Promise<TwoFactorRemovalState> {
  // Already gone; a second submit would only fail on a factor that no longer exists.
  if (previous.removed) {
    return previous;
  }

  const auth = await authProvider();
  const session = await auth.getSession();

  if (!session) {
    return { error: authFailureMessage("not_authenticated"), removed: false };
  }

  // Supabase rejects this below `aal2`; checking here keeps the reason understandable.
  if (session.currentLevel !== "aal2") {
    return { error: authFailureMessage("two_factor_required"), removed: false };
  }

  const result = await auth.disableTwoFactor();

  if (!result.ok) {
    return { error: authFailureMessage(result.code), removed: false };
  }

  return { error: null, removed: true };
}

export async function requestPasswordResetAction(
  _previous: PasswordResetState,
  formData: FormData,
): Promise<PasswordResetState> {
  const email = String(formData.get("email") ?? "");
  const parsed = passwordResetRequestSchema.safeParse({ email });

  if (!parsed.success) {
    return { error: firstIssueMessage(parsed.error), sentTo: null, email };
  }

  const origin = (await headers()).get("origin") ?? "";
  const auth = await authProvider();
  const result = await auth.requestPasswordReset({
    email: parsed.data.email,
    redirectTo: `${origin}/auth/confirm?next=${updatePasswordRoute}`,
  });

  if (!result.ok) {
    return { error: authFailureMessage(result.code), sentTo: null, email };
  }

  return { error: null, sentTo: parsed.data.email, email };
}

export async function updatePasswordAction(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = updatePasswordSchema.safeParse({
    password: formData.get("password"),
    passwordConfirmation: formData.get("passwordConfirmation"),
  });

  if (!parsed.success) {
    return { error: firstIssueMessage(parsed.error) };
  }

  const auth = await authProvider();
  const result = await auth.updatePassword({ password: parsed.data.password });

  if (!result.ok) {
    return { error: authFailureMessage(result.code) };
  }

  redirect(todayRoute);
}

export async function startTwoFactorEnrollmentAction(
  previous: TwoFactorEnrollmentState,
): Promise<TwoFactorEnrollmentState> {
  // Enrolling twice would leave a stray unverified factor on the account.
  if (previous.enrollment) {
    return previous;
  }

  const auth = await authProvider();
  const result = await auth.startTwoFactorEnrollment();

  if (!result.ok) {
    return { error: authFailureMessage(result.code), enrollment: null };
  }

  return {
    error: null,
    enrollment: { qrCode: result.data.qrCode, secret: result.data.secret },
  };
}

export async function verifyTwoFactorAction(
  _previous: TwoFactorVerifyState,
  formData: FormData,
): Promise<TwoFactorVerifyState> {
  const parsed = twoFactorCodeSchema.safeParse({ code: formData.get("code") });

  if (!parsed.success) {
    return { error: firstIssueMessage(parsed.error), recoveryCodes: null };
  }

  const auth = await authProvider();
  const result = await auth.verifyTwoFactorCode(parsed.data);

  if (!result.ok) {
    return { error: authFailureMessage(result.code), recoveryCodes: null };
  }

  const session = await auth.getSession();
  await noteCompleteSignIn(session);

  // A factor was just set up for the first time: the ten codes are made now, shown once on the
  // screen that follows, and kept only as hashes (D-236). Signing in with a factor that already
  // exists simply goes on to the panel.
  if (formData.get("intent") === "setup" && session) {
    const identity = { userId: session.user.id, actingRoleId: null };
    const codes = newRecoveryCodes();
    await issueRecoveryCodes(identity, session.user.id, codes.map(hashRecoveryCode));
    await noteSecondFactor(identity, session.user.id, true);
    return { error: null, recoveryCodes: codes };
  }
  redirect(todayRoute);
}

/**
 * A manager resets somebody else's second factor (D-236, REQ-IAM-003).
 *
 * The same three things happen as for a recovery code, but to another account: the factor on the
 * device that is gone is removed, the panel asks that person for a new one, and their open sessions
 * end, because a session that passed a factor which no longer exists should not continue. The audit
 * log records who did it and the owner layer is told (0041).
 */
export async function resetSecondFactorAction(userId: string): Promise<{ error: string | null }> {
  try {
    // The id arrives from the browser, so it is checked before it reaches the provider's admin
    // call and the database's cast, the way every other action checks an id it is handed.
    if (!looksLikeUserId(userId)) return { error: "Kişi bulunamadı; sayfayı yenileyip deneyin." };
    await assertCan("iam.module.manage");
    const actor = await signInIdentity();
    if (!actor) return { error: authFailureMessage("not_authenticated") };
    await createSupabaseSecondFactorAdmin().removeFactorsOf(userId);
    await noteSecondFactor(actor.identity, userId, false);
    await revokeSessions(actor.identity, userId, "second_factor_reset");
    return { error: null };
  } catch (error) {
    if (error instanceof AccessDeniedError) return { error: error.message };
    throw error;
  }
}

/**
 * Signing in with a recovery code instead of the app on the lost phone (D-236).
 *
 * The code is spent, the panel's own session records that the second step was passed — the provider
 * cannot know about these codes — and the factor on the lost device is removed, so whoever holds
 * that device cannot sign in with it. The person lands on the setup screen, because they now have
 * no second factor and the panel asks for one again.
 */
export async function useRecoveryCodeAction(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const typed = String(formData.get("code") ?? "");
  if (!looksLikeRecoveryCode(typed)) {
    return { error: "Kurtarma kodu on karakterdir; kâğıttaki kodu olduğu gibi yazın." };
  }

  const auth = await authProvider();
  const session = await auth.getSession();
  if (!session) {
    return { error: authFailureMessage("not_authenticated") };
  }

  const identity = { userId: session.user.id, actingRoleId: null };
  if (!(await spendRecoveryCode(identity, hashRecoveryCode(typed)))) {
    // The same answer for a code that never existed and one already spent: a person who is being
    // guessed at learns nothing from the difference.
    return { error: "Kurtarma kodu geçersiz veya daha önce kullanılmış." };
  }

  await noteSession(session.user.id, "signed_in");
  await openPanelSession(identity, true);
  await createSupabaseSecondFactorAdmin().removeFactorsOf(session.user.id);
  await noteSecondFactor(identity, session.user.id, false);
  redirect(twoFactorRoute);
}
