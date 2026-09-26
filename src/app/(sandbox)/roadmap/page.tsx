import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import {
  readAccountFacts,
  readAuthSession,
  readPanelSession,
  resolveProtectedPageRedirect,
} from "@/modules/iam";
import { RoadmapPage } from "@/sandbox/roadmap/roadmap-page";

export const metadata: Metadata = { title: "Yol haritası" };

// Development-only sandbox (D-052, D-299): the roadmap for the client; never served in production.
export default async function RoadmapRoute() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const redirectTo = resolveProtectedPageRedirect(
    await readAuthSession(),
    await readPanelSession(),
    await readAccountFacts(),
  );
  if (redirectTo) {
    redirect(redirectTo);
  }

  return <RoadmapPage />;
}
