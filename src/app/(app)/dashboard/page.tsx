import type { Metadata } from "next";
import { cookies } from "next/headers";

import { TodayOverview } from "@/modules/rpt/ui/today-overview";
import {
  createPreviewRolePolicy,
  PREVIEW_ROLE_COOKIE,
  resolvePreviewRole,
} from "@/platform/access/preview-roles";

export const metadata: Metadata = { title: "Bugün" };

// Entry screen of every role (D-056). The seat comes from the development role switcher
// (D-061); everywhere else it is the owner seat, which sees everything.
const roleSwitchingAllowed = process.env.NODE_ENV === "development";

export default async function TodayPage() {
  const cookieStore = await cookies();
  const role = resolvePreviewRole(
    cookieStore.get(PREVIEW_ROLE_COOKIE)?.value,
    roleSwitchingAllowed,
  );

  return <TodayOverview access={createPreviewRolePolicy(role)} seat={role} />;
}
