import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { resolveProtectedPageRedirect } from "@/modules/iam/application/auth-routing";
import { readAuthSession } from "@/modules/iam/application/auth-session";
import { NavigationPrototypePage } from "@/sandbox/navigation/navigation-prototype-page";

export const metadata: Metadata = { title: "Gezinme prototipi" };

// Development-only sandbox (D-052, CHG-004): never served in production.
export default async function NavigationPrototypeRoute() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const redirectTo = resolveProtectedPageRedirect(await readAuthSession());
  if (redirectTo) {
    redirect(redirectTo);
  }

  return <NavigationPrototypePage />;
}
