import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { readAuthSession, readPanelSession, resolveProtectedPageRedirect } from "@/modules/iam";
import { PresentationPage } from "@/sandbox/presentation/presentation-page";

export const metadata: Metadata = { title: "Yapı sunumu" };

// Development-only sandbox (D-052): never served in production.
export default async function PresentationRoute() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const redirectTo = resolveProtectedPageRedirect(
    await readAuthSession(),
    await readPanelSession(),
  );
  if (redirectTo) {
    redirect(redirectTo);
  }

  return <PresentationPage />;
}
