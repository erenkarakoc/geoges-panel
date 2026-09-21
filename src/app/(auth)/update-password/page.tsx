import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { readAuthSession, signInRoute } from "@/modules/iam";
import { UpdatePasswordForm } from "@/modules/iam/ui/update-password-form";

export const metadata: Metadata = { title: "Yeni parola" };

export default async function UpdatePasswordPage() {
  // Reachable only with the short-lived session created by the e-mail link (`/auth/confirm`).
  if (!(await readAuthSession())) {
    redirect(signInRoute);
  }

  return <UpdatePasswordForm />;
}
