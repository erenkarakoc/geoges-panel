"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { navigationRegistry, pickNavigationItems } from "@/platform/navigation/navigation-registry";
import { SidebarDragRail } from "@/platform/ui/app-shell/sidebar-drag-rail";
import { BrandLogo, BrandTile } from "@/platform/ui/brand/brand-logo";

/** `visibleItemIds` is decided on the server by the access policy. */
export function AppSidebar({ visibleItemIds }: { visibleItemIds: readonly string[] }) {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const groups = pickNavigationItems(navigationRegistry, visibleItemIds);
  // On phones the sidebar is a drawer; close it once the user picks a destination.
  const closeMobileDrawer = () => setOpenMobile(false);

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
        <nav aria-label="Modüller">
          {groups.map((group) => (
            <SidebarGroup key={group.id}>
              {/*
               * Collapsed, COSS hides the label with `-mt-8 opacity-0`: invisible but still in
               * the layout, sitting exactly on the group's first menu item and swallowing its
               * clicks. Ignoring the pointer there gives the item back.
               */}
              <SidebarGroupLabel className="group-data-[collapsible=icon]:pointer-events-none">
                {group.label}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton
                          isActive={isActive}
                          onClick={closeMobileDrawer}
                          render={
                            <Link aria-current={isActive ? "page" : undefined} href={item.href} />
                          }
                          tooltip={item.label}
                        >
                          <item.icon aria-hidden="true" />
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </nav>
      </SidebarContent>
      <SidebarDragRail />
    </Sidebar>
  );
}
