"use client";

import { ChevronRightIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Collapsible, CollapsiblePanel, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Menu,
  MenuGroup,
  MenuGroupLabel,
  MenuLinkItem,
  MenuPopup,
  MenuTrigger,
} from "@/components/ui/menu";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  navigationRegistry,
  pickNavigationItems,
  sampleWorkCounts,
  workNavigation,
} from "@/platform/navigation/navigation-registry";
import { rememberOpenGroups } from "@/platform/navigation/sidebar-group-preference";
import { SidebarDragRail } from "@/platform/ui/app-shell/sidebar-drag-rail";
import { BrandLogo, BrandTile } from "@/platform/ui/brand/brand-logo";

/**
 * Menu labels never wrap: while the rail animates its width, a long title would break onto a
 * second line for those 200ms and the whole menu would jump. They are clipped instead, and they
 * leave the way the long logo does — sliding a little to the left, blurring and fading — so the
 * whole menu closes as one movement rather than in two different ways (owner 2026-09-17).
 * The blur is written as a plain `filter`, because a `blur-0` inside the variant does not clear
 * a `blur-*` utility set on the element itself.
 */
const labelClassName = [
  "truncate [filter:none] transition-[opacity,translate,filter] duration-200 ease-out",
  "group-data-[collapsible=icon]:-translate-x-2 group-data-[collapsible=icon]:opacity-0",
  "group-data-[collapsible=icon]:[filter:blur(2px)] motion-reduce:transition-none",
].join(" ");

/**
 * Two-region rail (D-054): the work layer on top, the module groups below a separator.
 *
 * Collapsed — the default — the rail shows one icon per group and its modules open in a flyout,
 * so no module list ever occupies a column. Expanded, a group unfolds in place; several groups
 * may stay open at once and the choice is remembered (owner decision 2026-09-16).
 *
 * `visibleItemIds` and `visibleWorkIds` are decided on the server by the access policy.
 */
export function AppSidebar({
  visibleItemIds,
  visibleWorkIds,
  defaultOpenGroupIds,
}: {
  visibleItemIds: readonly string[];
  visibleWorkIds: readonly string[];
  defaultOpenGroupIds: readonly string[];
}) {
  const pathname = usePathname();
  const { setOpenMobile, state, isMobile } = useSidebar();
  const [openGroupIds, setOpenGroupIds] = useState<readonly string[]>(defaultOpenGroupIds);
  const groups = pickNavigationItems(navigationRegistry, visibleItemIds);
  const workItems = workNavigation.filter((item) => visibleWorkIds.includes(item.id));
  // On phones the sidebar is a drawer; close it once the user picks a destination.
  const closeMobileDrawer = () => setOpenMobile(false);
  // The drawer is always full width, so only the desktop rail can be in its icon state.
  const isRail = state === "collapsed" && !isMobile;

  const toggleGroup = (groupId: string, open: boolean) => {
    const next = open ? [...openGroupIds, groupId] : openGroupIds.filter((id) => id !== groupId);
    setOpenGroupIds(next);
    rememberOpenGroups(next);
  };

  return (
    <Sidebar
      className={[
        // The gap on the outside matches the one between the menu and the card — 1rem on both
        // sides (owner 2026-09-17). Only the vertical space is the layout gap,
        // so the menu still starts level with the card's top edge. The widths come from the two
        // COSS variables, widened in `app-shell.tsx` by exactly this gutter.
        "md:px-4 md:py-(--layout-gap)",
        // COSS pins the sidebar to the viewport (`fixed h-svh`). From `2xl` the shell is a
        // centred 16:9 frame, so the sidebar has to stay inside that frame instead.
        "2xl:absolute 2xl:h-full",
      ].join(" ")}
      collapsible="icon"
      variant="inset"
    >
      {/*
       * No padding of its own: COSS pads the header by 8px, which pushed the logo below the top
       * of the app card. Without it the head is the same 56px band as the card's header, so the
       * logo sits on the same line as the page name and the search (owner request 2026-09-17).
       * The horizontal inset comes from the link below, as it did before.
       */}
      <SidebarHeader className="p-0 pb-3">
        {/*
         * The head keeps its height in both states, so nothing below it moves while the sidebar
         * animates. Swapping the two logos with `hidden` made the whole menu jump.
         */}
        <Link
          aria-label="GEOGES Panel ana sayfa"
          className="relative flex h-10 items-center rounded-lg px-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
          href="/dashboard"
          onClick={closeMobileDrawer}
        >
          {/*
           * The two marks trade places instead of fading on the spot: the long logo leaves to
           * the left, blurring as it goes, while the square one arrives from the right. Both
           * ride the rail's own 200ms, and neither moves the layout — the square one is an
           * overlay, so the head keeps its height either way (owner 2026-09-17).
           */}
          <BrandLogo
            className="h-12 [filter:none] transition-[opacity,translate,filter] duration-150 ease-out group-data-[collapsible=icon]:-translate-x-3 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:[filter:blur(1px)] motion-reduce:transition-none"
            variant="long"
          />
          <span
            aria-hidden="true"
            // The box is the mark's own size and is pinned to the start, so it holds still while
            // the head narrows. Centring it in the head made it ride the head's width as the
            // rail closed, drifting left on top of our animation.
            className="pointer-events-none absolute start-1 top-1/2 size-10 -translate-y-1/2"
          >
            <BrandTile
              className="size-10 translate-x-4 opacity-0 [filter:blur(1px)] transition-[opacity,translate,filter] duration-300 ease-out group-data-[collapsible=icon]:translate-x-0 group-data-[collapsible=icon]:opacity-100 group-data-[collapsible=icon]:[filter:none] motion-reduce:transition-none"
              variant="theme"
            />
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <nav aria-label="Ana gezinme">
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {workItems.map((item) => {
                  const isActive = pathname === item.href;
                  const count = sampleWorkCounts[item.id];
                  return (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        isActive={isActive}
                        onClick={closeMobileDrawer}
                        render={
                          <Link aria-current={isActive ? "page" : undefined} href={item.href} />
                        }
                        tooltip={count ? `${item.label} (${count} · örnek veri)` : item.label}
                      >
                        <item.icon aria-hidden="true" />
                        <span className={labelClassName}>{item.label}</span>
                      </SidebarMenuButton>
                      {count ? (
                        <>
                          <SidebarMenuBadge title="Örnek veri">{count}</SidebarMenuBadge>
                          {/*
                           * COSS hides the badge in the icon state, where there is no room for a
                           * number. A dot keeps the "something is waiting" signal; the count
                           * itself stays in the tooltip and in the expanded rail.
                           */}
                          <span
                            aria-hidden="true"
                            className="pointer-events-none absolute top-1.5 right-1.5 hidden size-1.5 rounded-full bg-sidebar-primary group-data-[collapsible=icon]:block"
                          />
                        </>
                      ) : null}
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/*
           * COSS's separator carries its own horizontal margins, which push it past the menu
           * and give the sidebar a horizontal scrollbar. Padding on a wrapper does the same job
           * without adding width.
           */}
          <div className="px-2">
            <SidebarSeparator className="mx-0 w-full" />
          </div>

          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {groups.map((group) => {
                  const hasActiveItem = group.items.some((item) => pathname === item.href);

                  if (isRail) {
                    return (
                      <SidebarMenuItem key={group.id}>
                        <Menu>
                          <MenuTrigger
                            render={
                              <SidebarMenuButton
                                isActive={hasActiveItem}
                                tooltip={group.label}
                                type="button"
                              />
                            }
                          >
                            <group.icon aria-hidden="true" />
                            <span className={labelClassName}>{group.label}</span>
                          </MenuTrigger>
                          <MenuPopup align="start" side="right">
                            <MenuGroup>
                              <MenuGroupLabel>{group.label}</MenuGroupLabel>
                              {group.items.map((item) => (
                                <MenuLinkItem key={item.id} render={<Link href={item.href} />}>
                                  <item.icon aria-hidden="true" />
                                  {item.label}
                                </MenuLinkItem>
                              ))}
                            </MenuGroup>
                          </MenuPopup>
                        </Menu>
                      </SidebarMenuItem>
                    );
                  }

                  return (
                    <Collapsible
                      key={group.id}
                      onOpenChange={(open) => toggleGroup(group.id, open)}
                      open={openGroupIds.includes(group.id)}
                      render={<SidebarMenuItem />}
                    >
                      <CollapsibleTrigger
                        render={
                          <SidebarMenuButton isActive={hasActiveItem} type="button">
                            <group.icon aria-hidden="true" />
                            <span className={labelClassName}>{group.label}</span>
                            <ChevronRightIcon
                              aria-hidden="true"
                              // The trigger itself carries `data-panel-open` while the group is open.
                              className="ms-auto transition-transform in-data-[panel-open]:rotate-90"
                            />
                          </SidebarMenuButton>
                        }
                      />
                      <CollapsiblePanel>
                        <SidebarMenuSub>
                          {group.items.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                              <SidebarMenuSubItem key={item.id}>
                                <SidebarMenuSubButton
                                  isActive={isActive}
                                  onClick={closeMobileDrawer}
                                  render={
                                    <Link
                                      aria-current={isActive ? "page" : undefined}
                                      href={item.href}
                                    />
                                  }
                                >
                                  <item.icon aria-hidden="true" />
                                  <span className={labelClassName}>{item.label}</span>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            );
                          })}
                        </SidebarMenuSub>
                      </CollapsiblePanel>
                    </Collapsible>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </nav>
      </SidebarContent>
      <SidebarDragRail />
    </Sidebar>
  );
}
