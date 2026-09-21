import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { readAuthSession, resolvePostSignInRoute } from "@/modules/iam";
import { SignInForm } from "@/modules/iam/ui/sign-in-form";

export const metadata: Metadata = { title: "Giriş" };

export default async function SignInPage() {
  const session = await readAuthSession();

  if (session) {
    redirect(resolvePostSignInRoute(session));
  }

  return <SignInForm />;
}
