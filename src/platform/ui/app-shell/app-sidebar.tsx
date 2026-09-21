"use client";

import { ChevronRightIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

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
  workCounts,
  workNavigation,
} from "@/platform/navigation/navigation-registry";
import { rememberOpenGroups } from "@/platform/navigation/sidebar-group-preference";
import { SidebarDragRail } from "@/platform/ui/app-shell/sidebar-drag-rail";
import { BrandTile } from "@/platform/ui/brand/brand-logo";

/**
 * Menu labels never wrap: while the rail animates its width, a long title would break onto a
 * second line for those 200ms and the whole menu would jump. They are clipped instead, and they
 * leave the way the long logo does — sliding a little to the left, blurring and fading — so the
 * whole menu closes as one movement rather than in two different ways (owner 2026-09-17).
 * The blur is written as a plain `filter`, because a `blur-0` inside the variant does not clear
 * a `blur-*` utility set on the element itself.
 */
const labelMotionClassName = [
  "[filter:none] transition-[opacity,translate,filter] duration-200 ease-out",
  "group-data-[collapsible=icon]:-translate-x-2 group-data-[collapsible=icon]:opacity-0",
  "group-data-[collapsible=icon]:[filter:blur(2px)] motion-reduce:transition-none",
].join(" ");

/** Single-line labels are clipped as well; the wordmark in the head has two lines of its own. */
const labelClassName = `truncate ${labelMotionClassName}`;

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
  // Which group's flyout is open in the rail; only one at a time, like a menu.
  const [flyoutGroupId, setFlyoutGroupId] = useState<string | null>(null);
  const groups = pickNavigationItems(navigationRegistry, visibleItemIds);
  const workItems = workNavigation.filter((item) => visibleWorkIds.includes(item.id));
  // On phones the sidebar is a drawer; close it once the user picks a destination.
  const closeMobileDrawer = () => setOpenMobile(false);
  // The drawer is always full width, so only the desktop rail can be in its icon state.
  const isRail = state === "collapsed" && !isMobile;

  // At phone widths COSS opens its own sheet on Ctrl/Cmd+B. Phones navigate with the bottom bar
  // and the "Modüller" drawer (D-069), and that sheet's title is fixed in English inside the COSS
  // file, so the shortcut is stopped here before COSS's window listener sees it.
  // Deviation from COSS defaults — see docs/ui-ux/DESIGN_SYSTEM_RULES.md §4.1 row 19d (TASK-0054).
  useEffect(() => {
    if (!isMobile) {
      return;
    }
    const stopSheetShortcut = (event: KeyboardEvent) => {
      if (event.key === "b" && (event.metaKey || event.ctrlKey)) {
        event.stopPropagation();
      }
    };
    window.addEventListener("keydown", stopSheetShortcut, { capture: true });
    return () => window.removeEventListener("keydown", stopSheetShortcut, { capture: true });
  }, [isMobile]);

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
         * animates. The mark holds still as well: the tile keeps the same inset in both states —
         * centring it in the icon rail made it slide sideways as the menu closed — and it sits on
         * the same centre line as the icons below it. Only the name moves, and it moves the way
         * the menu labels do (D-071).
         */}
        <Link
          aria-label="GEOGES Panel ana sayfa"
          className="flex h-14 items-center gap-2 rounded-lg ps-1 pe-2"
          href="/today"
          onClick={closeMobileDrawer}
        >
          <BrandTile className="size-10" variant="theme" />
          {/* The link already carries the accessible name, so the wordmark is decoration. */}
          <span
            aria-hidden="true"
            className={`flex min-w-0 flex-col leading-tight ${labelMotionClassName}`}
          >
            <span className="text-sm font-semibold tracking-wide text-[#efefef]">GEOGES</span>
            <span className="text-[0.6875rem] tracking-[0.2em]">PANEL</span>
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
                  const count = workCounts[item.id];
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
                  return (
                    /*
                     * One row in both states. It used to be two — a collapsible row when the menu
                     * was open and a flyout trigger when it was a rail — and swapping components
                     * replaced the DOM, so the group titles could not animate like the rest.
                     * Now the row stays put and only its behaviour changes: it folds the group
                     * open when there is room for the list, and opens the flyout when there is not.
                     */
                    <Collapsible
                      key={group.id}
                      onOpenChange={(open) => {
                        if (!isRail) {
                          toggleGroup(group.id, open);
                        }
                      }}
                      open={!isRail && openGroupIds.includes(group.id)}
                      render={<SidebarMenuItem />}
                    >
                      <Menu
                        onOpenChange={(open) => setFlyoutGroupId(open && isRail ? group.id : null)}
                        open={isRail && flyoutGroupId === group.id}
                      >
                        <MenuTrigger
                          render={
                            <CollapsibleTrigger
                              render={
                                <SidebarMenuButton
                                  isActive={hasActiveItem}
                                  tooltip={group.label}
                                  type="button"
                                />
                              }
                            />
                          }
                        >
                          <group.icon aria-hidden="true" />
                          <span className={labelClassName}>{group.label}</span>
                          <ChevronRightIcon
                            aria-hidden="true"
                            // The trigger itself carries `data-panel-open` while the group is open.
                            className={`ms-auto transition-transform in-data-[panel-open]:rotate-90 ${labelClassName}`}
                          />
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
