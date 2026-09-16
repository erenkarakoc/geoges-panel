import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { resolvePostSignInRoute } from "@/modules/iam/application/auth-routing";
import { readAuthSession } from "@/modules/iam/application/auth-session";
import { SignInForm } from "@/modules/iam/ui/sign-in-form";

export const metadata: Metadata = { title: "Giriş" };

export default async function SignInPage() {
  const session = await readAuthSession();

  if (session) {
    redirect(resolvePostSignInRoute(session));
  }

  return <SignInForm />;
}
