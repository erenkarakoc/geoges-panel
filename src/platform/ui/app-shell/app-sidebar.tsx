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
        "md:p-(--layout-gap) md:pe-2",
        "md:group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+var(--layout-gap)+0.5rem+2px)]",
        // COSS pins the sidebar to the viewport (`fixed h-svh`). From `2xl` the shell is a
        // centred 16:9 frame, so the sidebar has to stay inside that frame instead.
        "2xl:absolute 2xl:h-full",
      ].join(" ")}
      collapsible="icon"
      variant="inset"
    >
      <SidebarHeader>
        <Link
          aria-label="GEOGES Panel ana sayfa"
          className="flex h-14 items-center rounded-lg px-2 group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
          href="/dashboard"
          onClick={closeMobileDrawer}
        >
          <BrandLogo className="h-12 group-data-[collapsible=icon]:hidden" variant="long" />
          <BrandTile
            className="hidden size-8 group-data-[collapsible=icon]:block"
            variant="theme"
          />
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
                        <span>{item.label}</span>
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

          <SidebarSeparator />

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
                            <span>{group.label}</span>
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
                            <span>{group.label}</span>
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
                                  <span>{item.label}</span>
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
