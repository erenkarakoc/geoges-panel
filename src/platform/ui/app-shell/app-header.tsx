"use client";

import { BellIcon, ChevronDownIcon, PlusIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Menu,
  MenuGroup,
  MenuGroupLabel,
  MenuPopup,
  MenuRadioGroup,
  MenuRadioItem,
  MenuTrigger,
} from "@/components/ui/menu";
import { Popover, PopoverPopup, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { toastManager } from "@/components/ui/toast";
import {
  findNavigationGroupOfItem,
  navigationRegistry,
  pickNavigationItems,
  workNavigation,
} from "@/platform/navigation/navigation-registry";
import { rememberSiteScope } from "@/platform/navigation/site-scope-preference";
import { CommandPalette } from "@/platform/ui/app-shell/command-palette";
import { sampleNotifications } from "@/platform/ui/app-shell/sample-notifications";

/** What the header needs to know about the current seat; plain values from the server. */
export type HeaderSeat = {
  primaryAction: string;
  sites: readonly string[];
  notificationCount: number;
};

/**
 * Three-zone header (D-055, TASK-0033), one rule on every page:
 * left = where you are (page name, path, site when the page works inside one),
 * middle = where you go (site-wide search), right = what you do (primary action, notifications,
 * then theme and account passed in as `actions`). Height stays the existing 56px.
 */
export function AppHeader({
  visibleItemIds,
  visibleWorkIds,
  seat,
  initialSite,
  actions,
}: {
  visibleItemIds: readonly string[];
  visibleWorkIds: readonly string[];
  seat: HeaderSeat;
  initialSite: string;
  actions?: ReactNode;
}) {
  const pathname = usePathname();
  const groups = pickNavigationItems(navigationRegistry, visibleItemIds);
  const workItems = workNavigation.filter((item) => visibleWorkIds.includes(item.id));

  // A page belongs to the menu entry whose address it starts with, so detail pages added later
  // ("/purchasing/124") keep their module's name, path and action.
  const current = [...workItems, ...groups.flatMap((group) => group.items)].find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );
  const currentGroup = current ? findNavigationGroupOfItem(groups, current.id) : undefined;
  const primaryAction = current?.primaryAction ?? seat.primaryAction;

  // The chosen site lives here, not in the selector: the header survives page changes while the
  // selector comes and goes with the page. After a role switch an unknown site falls back.
  const [chosenSite, setChosenSite] = useState(initialSite);
  const site = seat.sites.includes(chosenSite) ? chosenSite : (seat.sites[0] ?? "");

  return (
    // Wide screens: a three-column grid keeps the search exactly in the middle. Narrower, the
    // search gives way first, so the page name and the actions stay readable.
    <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4 xl:grid xl:grid-cols-[minmax(0,1fr)_minmax(0,26rem)_minmax(0,1fr)]">
      {/* Left — where you are */}
      <div className="flex min-w-0 items-center gap-2">
        <SidebarTrigger aria-label="Menüyü aç veya kapat" className="-ms-1" />
        {current ? (
          <div className="flex min-w-0 items-baseline gap-2">
            {/* The name never gives way; the path shortens first. */}
            <h1 className="shrink-0 text-sm font-semibold">{current.label}</h1>
            {currentGroup ? (
              <nav
                aria-label="Konum"
                title={`${currentGroup.label} › ${current.label}`}
                className="hidden min-w-0 truncate text-xs text-muted-foreground lg:block"
              >
                {currentGroup.label}
                <span aria-hidden="true"> › </span>
                <Link className="transition-colors hover:text-foreground" href={current.href}>
                  {current.label}
                </Link>
              </nav>
            ) : null}
          </div>
        ) : null}
        {current?.scope === "site" ? (
          <SiteScopeSelector
            onSiteChange={(value) => {
              setChosenSite(value);
              rememberSiteScope(value);
            }}
            site={site}
            sites={seat.sites}
          />
        ) : null}
      </div>

      {/* Middle — where you go */}
      <div className="flex min-w-0 flex-1 justify-center sm:max-w-md">
        <CommandPalette groups={groups} workItems={workItems} />
      </div>

      {/* Right — what you do */}
      <div className="flex shrink-0 items-center justify-end gap-1">
        <Button
          aria-label={primaryAction}
          className="me-1"
          onClick={() =>
            toastManager.add({
              type: "info",
              title: "Bu işlem henüz hazır değil",
              description: `"${primaryAction}" ilgili modül geliştirildiğinde çalışacak.`,
            })
          }
          type="button"
        >
          <PlusIcon aria-hidden="true" />
          <span className="hidden md:inline">{primaryAction}</span>
        </Button>
        <NotificationsButton count={seat.notificationCount} />
        {actions}
      </div>
    </header>
  );
}

/** Site selector (D-062): a seat with one site sees its name, not a menu. */
function SiteScopeSelector({
  sites,
  site,
  onSiteChange,
}: {
  sites: readonly string[];
  site: string;
  onSiteChange: (site: string) => void;
}) {
  if (sites.length < 2) {
    return <span className="hidden shrink-0 text-sm text-muted-foreground sm:inline">{site}</span>;
  }

  return (
    <Menu>
      <MenuTrigger
        render={<Button className="hidden shrink-0 sm:inline-flex" size="sm" variant="outline" />}
      >
        {site}
        <ChevronDownIcon aria-hidden="true" />
      </MenuTrigger>
      <MenuPopup align="start">
        <MenuGroup>
          <MenuGroupLabel>Şantiye · örnek veri</MenuGroupLabel>
          <MenuRadioGroup onValueChange={(value: string) => onSiteChange(value)} value={site}>
            {sites.map((option) => (
              <MenuRadioItem key={option} value={option}>
                {option}
              </MenuRadioItem>
            ))}
          </MenuRadioGroup>
        </MenuGroup>
      </MenuPopup>
    </Menu>
  );
}

/** Bell with sample notifications (D-063), marked as sample data in the list. */
function NotificationsButton({ count }: { count: number }) {
  const notifications = sampleNotifications.slice(0, count);

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            aria-label={`Bildirimler (${count} · örnek veri)`}
            className="relative"
            size="icon"
            variant="ghost"
          />
        }
      >
        <BellIcon aria-hidden="true" />
        {count > 0 ? (
          <Badge
            className="pointer-events-none absolute -end-0.5 -top-0.5"
            size="sm"
            variant="destructive"
          >
            {count}
          </Badge>
        ) : null}
      </PopoverTrigger>
      <PopoverPopup align="end" className="w-80">
        <div className="flex items-center justify-between gap-2">
          <PopoverTitle className="text-base">Bildirimler</PopoverTitle>
          <Badge variant="outline">Örnek veri</Badge>
        </div>
        {notifications.length > 0 ? (
          <ul className="mt-3 flex flex-col gap-3">
            {notifications.map((notification) => (
              <li className="flex flex-col gap-0.5" key={notification.id}>
                <span className="text-sm font-medium">{notification.title}</span>
                <span className="text-xs text-muted-foreground">{notification.note}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">Bildirim yok.</p>
        )}
      </PopoverPopup>
    </Popover>
  );
}
