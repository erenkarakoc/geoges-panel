import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { readAuthSession, readPanelSession, resolveProtectedPageRedirect } from "@/modules/iam";
import { RoleOnboarding } from "@/modules/iam/ui/role-onboarding";

export const metadata: Metadata = { title: "Yeni rolünüz" };

export default async function OnboardingPage() {
  // Role guidance is shown to a signed-in user, so it is gated like the app pages.
  const redirectTo = resolveProtectedPageRedirect(
    await readAuthSession(),
    (await readPanelSession()) !== null,
  );

  if (redirectTo) {
    redirect(redirectTo);
  }

  return <RoleOnboarding />;
}
