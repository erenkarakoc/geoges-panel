import type { Metadata } from "next";

import { RoleOnboarding } from "@/modules/iam/ui/role-onboarding";

export const metadata: Metadata = { title: "Yeni rolünüz" };

export default function OnboardingPage() {
  return <RoleOnboarding />;
}
