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
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { navigationRegistry, pickNavigationItems } from "@/platform/navigation/navigation-registry";
import { BrandLogo } from "@/platform/ui/brand/brand-logo";

/** `visibleItemIds` is decided on the server by the access policy. */
export function AppSidebar({ visibleItemIds }: { visibleItemIds: readonly string[] }) {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const groups = pickNavigationItems(navigationRegistry, visibleItemIds);
  // On phones the sidebar is a drawer; close it once the user picks a destination.
  const closeMobileDrawer = () => setOpenMobile(false);

  return (
    <Sidebar
      className="md:p-(--layout-gap) md:group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+2*var(--layout-gap)+2px)]"
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
          <BrandLogo className="hidden h-6 group-data-[collapsible=icon]:block" variant="icon" />
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <nav aria-label="Modüller">
          {groups.map((group) => (
            <SidebarGroup key={group.id}>
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
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
      <SidebarRail />
    </Sidebar>
  );
}
