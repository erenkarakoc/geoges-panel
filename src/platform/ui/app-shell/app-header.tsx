"use client";

import { ChevronDownIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useState } from "react";

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
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  findNavigationGroupOfItem,
  navigationRegistry,
  pickNavigationItems,
  workNavigation,
} from "@/platform/navigation/navigation-registry";
import { rememberSiteScope } from "@/platform/navigation/site-scope-preference";
import { CommandPalette } from "@/platform/ui/app-shell/command-palette";
import { PrimaryActionButton } from "@/platform/ui/app-shell/primary-action";

/** What the header needs to know about the current seat; plain values from the server. */
export type HeaderSeat = {
  primaryAction: string;
  sites: readonly string[];
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
  notifications,
  actions,
}: {
  visibleItemIds: readonly string[];
  visibleWorkIds: readonly string[];
  seat: HeaderSeat;
  initialSite: string;
  /** The bell, rendered by TSK (SCR-015); platform code does not know notifications. */
  notifications?: ReactNode;
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
        {/* Phones navigate from the bottom bar (D-069), so the menu button is desktop-only. */}
        <SidebarTrigger aria-label="Menüyü aç veya kapat" className="-ms-1 hidden md:inline-flex" />
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
        {/* On a phone this button lives in the middle of the bottom bar instead (D-069). */}
        <PrimaryActionButton
          className="me-1 hidden md:inline-flex"
          label={primaryAction}
          labelClassName="hidden md:inline"
        />
        {notifications}
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
