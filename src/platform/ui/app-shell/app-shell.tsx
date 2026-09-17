import { cookies } from "next/headers";
import type { CSSProperties, ReactNode } from "react";

import { ScrollArea } from "@/components/ui/scroll-area";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { type AccessPolicy, filterByPermission } from "@/platform/access/access-policy";
import {
  getVisibleNavigation,
  navigationRegistry,
  workNavigation,
} from "@/platform/navigation/navigation-registry";
import {
  resolveOpenGroups,
  SIDEBAR_GROUPS_COOKIE,
} from "@/platform/navigation/sidebar-group-preference";
import { resolveSiteScope, SITE_SCOPE_COOKIE } from "@/platform/navigation/site-scope-preference";
import { AppHeader, type HeaderSeat } from "@/platform/ui/app-shell/app-header";
import { AppSidebar } from "@/platform/ui/app-shell/app-sidebar";
import { MobileBottomBar } from "@/platform/ui/app-shell/mobile-bottom-bar";
import { ThemeToggle } from "@/platform/ui/theme/theme-toggle";

/*
 * Layout gap: outer space above, below and to the right of the app card on desktop (owner
 * request). Left of the menu and between menu and card the COSS default 0.5rem is used, so the
 * menu sits in an even gutter (owner 2026-09-17).
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

/*
 * The menu sits in an even 1rem gutter (owner 2026-09-17), so both COSS width variables grow by
 * that gutter: the usable menu stays 15rem and the icon column 3rem, and COSS's own formulas —
 * reserved space, container, collapsed width — keep working untouched.
 */
const sidebarWidthStyle = {
  "--sidebar-width": "17rem",
  "--sidebar-width-icon": "4rem",
} as CSSProperties;

const appCardClassName = [
  "min-h-0 overflow-hidden md:border",
  // The rail animates its width over 200ms; without the same transition here the card jumped
  // to its new margin at once while the menu was still sliding.
  "transition-[margin] duration-200 ease-linear",
  "md:peer-data-[variant=inset]:m-(--layout-gap) md:peer-data-[variant=inset]:ms-0",
  // Collapsed, COSS pushes the card 0.5rem further right and the menu-to-card gap grew to
  // 14px. The rail is 2px wider than the space it reserves, so 2px here makes the gap the
  // same 8px as on the menu's other side.
  "md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ms-0.5",
].join(" ");

type AppShellProps = {
  access: AccessPolicy;
  /** The current seat's header data: primary action fallback, sites, notification count. */
  seat: HeaderSeat;
  /**
   * Second header row, filled by the `@context` slot only while an object is open (D-055).
   * Everywhere else the slot renders nothing and the layout is unchanged.
   */
  contextBar?: ReactNode;
  /** Right end of the top bar (account menu with the role switcher — §40.3). */
  headerActions?: ReactNode;
  children: ReactNode;
};

export async function AppShell({
  access,
  seat,
  contextBar,
  headerActions,
  children,
}: AppShellProps) {
  const visibleGroups = getVisibleNavigation(navigationRegistry, access);
  const visibleItemIds = visibleGroups.flatMap((group) => group.items.map((item) => item.id));
  const visibleWorkIds = filterByPermission(workNavigation, access).map((item) => item.id);

  // The rail starts collapsed (D-054) unless the user opened it before; COSS keeps that choice
  // in `sidebar_state`. Open module groups are remembered separately, so the server can render
  // them already open instead of flashing closed.
  const cookieStore = await cookies();
  const sidebarOpen = cookieStore.get("sidebar_state")?.value === "true";
  const openGroupIds = resolveOpenGroups(
    cookieStore.get(SIDEBAR_GROUPS_COOKIE)?.value,
    visibleGroups[0]?.id,
  );
  const initialSite = resolveSiteScope(cookieStore.get(SITE_SCOPE_COOKIE)?.value, seat.sites);

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
          <AppHeader
            actions={
              <>
                <ThemeToggle />
                {headerActions}
              </>
            }
            initialSite={initialSite}
            seat={seat}
            visibleItemIds={visibleItemIds}
            visibleWorkIds={visibleWorkIds}
          />
          {contextBar}
          {/* Page-specific functional footer is planned for Phase 02 (TASK-0028). */}
          <ScrollArea className="min-h-0 flex-1">
            <div className="flex flex-col gap-6 p-4 md:p-6">{children}</div>
          </ScrollArea>
          {/* Phones navigate from here; on desktop the rail does the same job (D-069). */}
          <MobileBottomBar
            primaryAction={seat.primaryAction}
            visibleItemIds={visibleItemIds}
            visibleWorkIds={visibleWorkIds}
          />
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
