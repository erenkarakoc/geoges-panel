import type { Metadata } from "next";

import { ResetPasswordForm } from "@/modules/iam/ui/reset-password-form";

export const metadata: Metadata = { title: "Parola sıfırlama" };

export default async function ResetPasswordPage({ searchParams }: PageProps<"/reset-password">) {
  // `/auth/confirm` sends the visitor back here when the e-mail link is no longer valid.
  const { expired } = await searchParams;

  return <ResetPasswordForm linkExpired={expired === "1"} />;
}
