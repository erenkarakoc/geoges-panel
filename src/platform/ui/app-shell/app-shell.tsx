import type { ReactNode } from "react";

import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import type { AccessPolicy } from "@/platform/access/access-policy";
import {
  getVisibleNavigation,
  navigationRegistry,
} from "@/platform/navigation/navigation-registry";
import { AppSidebar } from "@/platform/ui/app-shell/app-sidebar";
import { BrandFooter } from "@/platform/ui/brand/brand-footer";
import { ThemeToggle } from "@/platform/ui/theme/theme-toggle";

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
    <SidebarProvider>
      <AppSidebar visibleItemIds={visibleItemIds} />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur">
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
