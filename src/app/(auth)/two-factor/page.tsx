import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { dashboardRoute, signInRoute } from "@/modules/iam/application/auth-routing";
import { readAuthSession } from "@/modules/iam/application/auth-session";
import { TwoFactorForm } from "@/modules/iam/ui/two-factor-form";

export const metadata: Metadata = { title: "İki adımlı doğrulama" };

export default async function TwoFactorPage() {
  const session = await readAuthSession();

  if (!session) {
    redirect(signInRoute);
  }

  if (session.currentLevel === "aal2") {
    redirect(dashboardRoute);
  }

  return <TwoFactorForm mode={session.nextLevel === "aal2" ? "verify" : "setup"} />;
}
