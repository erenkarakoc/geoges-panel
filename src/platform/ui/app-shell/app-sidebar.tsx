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

/** `visibleItemIds` is decided on the server by the access policy. */
export function AppSidebar({ visibleItemIds }: { visibleItemIds: readonly string[] }) {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const groups = pickNavigationItems(navigationRegistry, visibleItemIds);
  // On phones the sidebar is a drawer; close it once the user picks a destination.
  const closeMobileDrawer = () => setOpenMobile(false);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link
          className="flex h-8 items-center gap-2 rounded-lg px-2 font-heading font-semibold text-sidebar-primary group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
          href="/dashboard"
          onClick={closeMobileDrawer}
        >
          <span aria-hidden="true" className="hidden group-data-[collapsible=icon]:inline">
            G
          </span>
          <span className="group-data-[collapsible=icon]:hidden">GEOGES Panel</span>
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
