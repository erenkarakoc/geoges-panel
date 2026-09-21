import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { readAuthSession, signInRoute } from "@/modules/iam";
import { TwoFactorForm } from "@/modules/iam/ui/two-factor-form";

export const metadata: Metadata = { title: "İki adımlı doğrulama" };

export default async function TwoFactorPage() {
  const session = await readAuthSession();

  if (!session) {
    redirect(signInRoute);
  }

  // A cleared session lands on the management view; sign-in sends the user straight to the
  // Today screen afterwards, so this is only reached by opening the page deliberately.
  const mode =
    session.currentLevel === "aal2" ? "manage" : session.nextLevel === "aal2" ? "verify" : "setup";

  return <TwoFactorForm mode={mode} />;
}
