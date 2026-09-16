import { cookies } from "next/headers";
import type { CSSProperties, ReactNode } from "react";

import { ScrollArea } from "@/components/ui/scroll-area";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { type AccessPolicy, filterByPermission } from "@/platform/access/access-policy";
import {
  getVisibleNavigation,
  navigationRegistry,
  workNavigation,
} from "@/platform/navigation/navigation-registry";
import {
  parseOpenGroups,
  SIDEBAR_GROUPS_COOKIE,
} from "@/platform/navigation/sidebar-group-preference";
import { AppSidebar } from "@/platform/ui/app-shell/app-sidebar";
import { ThemeToggle } from "@/platform/ui/theme/theme-toggle";

/*
 * Layout gap: outer space around the sidebar and the app card on desktop (owner request).
 * The space between sidebar and card stays the COSS default (0.5rem).
 * Deviations from COSS defaults — see docs/ui-ux/DESIGN_SYSTEM_RULES.md §4.1.
 * Change the values here to resize every outer margin at once.
 */
// Fixed viewport height: the page itself never scrolls, the app card scrolls inside.
// From `2xl` the whole shell becomes a centred 16:9 frame, matching the auth screens.
// `--frame-inset` is the distance from the frame to the viewport edge; `--layout-gap` (below)
// is the gutter inside it. Both live here so every outer spacing is changed in one place.
const outerClassName = [
  "[--frame-inset:1.5rem] h-svh overflow-hidden",
  "2xl:flex 2xl:h-auto 2xl:min-h-svh 2xl:items-center 2xl:justify-center 2xl:overflow-visible",
  "2xl:p-(--frame-inset)",
].join(" ");

const frameClassName = [
  "[--layout-gap:0.5rem] md:[--layout-gap:1.5rem] xl:[--layout-gap:2.5rem]",
  "relative mx-auto h-full w-full",
  "2xl:aspect-[16/9] 2xl:h-auto 2xl:min-h-0 2xl:w-[min(94vw,calc(92svh*16/9))] 2xl:max-w-none",
  "2xl:overflow-hidden 2xl:rounded-2xl 2xl:border 2xl:border-border/70 2xl:shadow-[0_25px_80px_-24px_rgb(0_0_0/0.5)]",
].join(" ");

// COSS sets --sidebar-width to 16rem including 0.5rem padding on each side. Keep the usable
// menu width (15rem): outer padding is the layout gap, the inner (card) side keeps 0.5rem.
const sidebarWidthStyle = {
  "--sidebar-width": "calc(15rem + var(--layout-gap) + 0.5rem)",
} as CSSProperties;

const appCardClassName = [
  "min-h-0 overflow-hidden md:border",
  "md:peer-data-[variant=inset]:m-(--layout-gap) md:peer-data-[variant=inset]:ms-0",
  // Collapsed: COSS reserves icon + 1rem and offsets the card by 0.5rem; the sidebar now takes
  // icon + layout gap + 0.5rem + 2px. Offsetting by the layout gap keeps the COSS default
  // sidebar-to-card distance (14px).
  "md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ms-(--layout-gap)",
].join(" ");

type AppShellProps = {
  access: AccessPolicy;
  /** Right side of the top bar (user menu, notifications, role switcher — §40.3). */
  headerActions?: ReactNode;
  children: ReactNode;
};

export async function AppShell({ access, headerActions, children }: AppShellProps) {
  const visibleItemIds = getVisibleNavigation(navigationRegistry, access).flatMap((group) =>
    group.items.map((item) => item.id),
  );
  const visibleWorkIds = filterByPermission(workNavigation, access).map((item) => item.id);

  // The rail starts collapsed (D-054) unless the user opened it before; COSS keeps that choice
  // in `sidebar_state`. Open module groups are remembered separately, so the server can render
  // them already open instead of flashing closed.
  const cookieStore = await cookies();
  const sidebarOpen = cookieStore.get("sidebar_state")?.value === "true";
  const openGroupIds = parseOpenGroups(cookieStore.get(SIDEBAR_GROUPS_COOKIE)?.value);

  return (
    <div className={outerClassName}>
      <SidebarProvider
        className={frameClassName}
        defaultOpen={sidebarOpen}
        style={sidebarWidthStyle}
      >
        <AppSidebar
          defaultOpenGroupIds={openGroupIds}
          visibleItemIds={visibleItemIds}
          visibleWorkIds={visibleWorkIds}
        />
        {/* Inset variant: on desktop the app sits in a bordered, rounded card of fixed height. */}
        <SidebarInset className={appCardClassName}>
          <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
            <SidebarTrigger aria-label="Menüyü aç veya kapat" className="-ms-1" />
            <div className="ms-auto flex items-center gap-1">
              <ThemeToggle />
              {headerActions}
            </div>
          </header>
          {/* Page-specific functional footer is planned for Phase 02 (TASK-0028). */}
          <ScrollArea className="min-h-0 flex-1">
            <div className="flex flex-col gap-6 p-4 md:p-6">{children}</div>
          </ScrollArea>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
