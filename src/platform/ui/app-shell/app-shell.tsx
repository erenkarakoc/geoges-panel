import type { CSSProperties, ReactNode } from "react";

import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import type { AccessPolicy } from "@/platform/access/access-policy";
import {
  getVisibleNavigation,
  navigationRegistry,
} from "@/platform/navigation/navigation-registry";
import { AppSidebar } from "@/platform/ui/app-shell/app-sidebar";
import { BrandFooter } from "@/platform/ui/brand/brand-footer";
import { ThemeToggle } from "@/platform/ui/theme/theme-toggle";

/*
 * Layout gap: space around the sidebar and the app card on desktop (owner request).
 * Deviation from COSS inset defaults (0.5rem) — see docs/ui-ux/DESIGN_SYSTEM_RULES.md §4.1.
 * Change the values here to resize every outer margin at once.
 */
const layoutGapClassName =
  "[--layout-gap:0.5rem] md:[--layout-gap:1.5rem] xl:[--layout-gap:2.5rem]";

// COSS sets --sidebar-width to 16rem including its 0.5rem padding on each side.
// Keep the same usable menu width (15rem) and add the layout gap on both sides.
const sidebarWidthStyle = {
  "--sidebar-width": "calc(15rem + 2 * var(--layout-gap))",
} as CSSProperties;

const appCardClassName = [
  "md:border",
  "md:peer-data-[variant=inset]:m-(--layout-gap) md:peer-data-[variant=inset]:ms-0",
  // Collapsed: COSS reserves icon width + 1rem, the sidebar now takes icon width + 2 × gap + 2px.
  "md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ms-[calc(2*var(--layout-gap)-1rem+2px)]",
].join(" ");

type AppShellProps = {
  access: AccessPolicy;
  /** Right side of the top bar (user menu, notifications, role switcher — §40.3). */
  headerActions?: ReactNode;
  children: ReactNode;
};

export function AppShell({ access, headerActions, children }: AppShellProps) {
  const visibleItemIds = getVisibleNavigation(navigationRegistry, access).flatMap((group) =>
    group.items.map((item) => item.id),
  );

  return (
    <SidebarProvider className={layoutGapClassName} style={sidebarWidthStyle}>
      <AppSidebar visibleItemIds={visibleItemIds} />
      {/* Inset variant: on desktop the app sits in a bordered, rounded card. */}
      <SidebarInset className={appCardClassName}>
        <header className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur md:rounded-t-xl">
          <SidebarTrigger aria-label="Menüyü aç veya kapat" className="-ms-1" />
          <div className="ms-auto flex items-center gap-1">
            <ThemeToggle />
            {headerActions}
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">{children}</div>
        <BrandFooter className="border-t" />
      </SidebarInset>
    </SidebarProvider>
  );
}
