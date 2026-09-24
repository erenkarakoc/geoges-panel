import type { Metadata } from "next";
import { redirect } from "next/navigation";

import {
  readAccountFacts,
  readAuthSession,
  readPanelSession,
  resolveSignInPageRedirect,
} from "@/modules/iam";
import { SignInForm } from "@/modules/iam/ui/sign-in-form";

export const metadata: Metadata = { title: "Giriş" };

export default async function SignInPage() {
  const session = await readAuthSession();
  // Someone whose panel session is over sees the form again: the protected page would send them
  // straight back here, and signing in is what starts a new session (TASK-0112). The two reads are
  // independent, so they go together rather than one after the other.
  const [panelSession, account] = await Promise.all([readPanelSession(), readAccountFacts()]);
  const redirectTo = resolveSignInPageRedirect(session, panelSession, account);

  if (redirectTo) {
    redirect(redirectTo);
  }

  return <SignInForm />;
}
