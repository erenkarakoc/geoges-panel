import Link from "next/link";

import { Button } from "@/components/ui/button";

/**
 * Tabs of one screen that are separate addresses (SCR-012 and SCR-192, D-223): they look like
 * tabs but each is its own page, so the browser's back button and a shared link both work. The
 * touch target keeps the phone minimum (DESIGN_SYSTEM_RULES).
 */
export type ScreenTab = { href: string; label: string };

export function ScreenTabs({
  label,
  tabs,
  current,
}: {
  /** What the group of tabs is for, read out by a screen reader. */
  label: string;
  tabs: readonly ScreenTab[];
  current: string;
}) {
  return (
    <nav aria-label={label} className="flex flex-wrap items-center gap-2">
      {tabs.map((tab) => (
        <Button
          aria-current={tab.href === current ? "page" : undefined}
          className="h-11 md:h-8"
          key={tab.href}
          render={<Link href={tab.href} />}
          size="sm"
          variant={tab.href === current ? "secondary" : "ghost"}
        >
          {tab.label}
        </Button>
      ))}
    </nav>
  );
}

/** The two tabs of the approval screen (SPECIAL_SCREENS SCR-012). */
export const APPROVAL_TABS: readonly ScreenTab[] = [
  { href: "/approvals", label: "Bekleyenler" },
  { href: "/approvals/revision-requests", label: "Revizyon talepleri" },
];

/** The tabs of the flows screen (SCR-195); each is its own address, like the approval screen's. */
export const WORKFLOW_TABS: readonly ScreenTab[] = [
  { href: "/admin/workflows", label: "Akışlar" },
  { href: "/admin/workflows/templates", label: "Şablonlar" },
  { href: "/admin/workflows/new", label: "Yeni akışlar" },
  { href: "/admin/workflows/runs", label: "Çalışma günlüğü" },
];
