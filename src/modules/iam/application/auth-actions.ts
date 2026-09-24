"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import type {
  AuthFormState,
  PasswordResetState,
  SignInState,
  TwoFactorEnrollmentState,
  TwoFactorRemovalState,
} from "@/modules/iam/application/auth-form-state";
import { lockedMessage } from "@/modules/iam/application/auth-lock-message";
import { authFailureMessage } from "@/modules/iam/application/auth-messages";
import {
  todayRoute,
  resolvePostSignInRoute,
  signInRoute,
  updatePasswordRoute,
} from "@/modules/iam/application/auth-routing";
import {
  firstIssueMessage,
  passwordResetRequestSchema,
  signInSchema,
  twoFactorCodeSchema,
  updatePasswordSchema,
} from "@/modules/iam/application/auth-schemas";
import { noteSession } from "@/modules/iam/application/access";
import { loginLock, noteLoginAttempt } from "@/modules/iam/data/account-security-store";
import type { AuthProvider, AuthSession } from "@/modules/iam/domain/auth-provider";
import { createSupabaseAuthProvider } from "@/modules/iam/infrastructure/supabase/supabase-auth-provider";
import { createSupabaseServerClient } from "@/platform/supabase/server-client";

async function authProvider(): Promise<AuthProvider> {
  return createSupabaseAuthProvider(await createSupabaseServerClient());
}

/** A sign-in is complete once no second step is pending; only then is it recorded. */
async function noteCompleteSignIn(session: AuthSession | null): Promise<void> {
  if (session && session.currentLevel === session.nextLevel) {
    await noteSession(session.user.id, "signed_in");
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
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = twoFactorCodeSchema.safeParse({ code: formData.get("code") });

  if (!parsed.success) {
    return { error: firstIssueMessage(parsed.error) };
  }

  const auth = await authProvider();
  const result = await auth.verifyTwoFactorCode(parsed.data);

  if (!result.ok) {
    return { error: authFailureMessage(result.code) };
  }

  await noteCompleteSignIn(await auth.getSession());
  redirect(todayRoute);
}
