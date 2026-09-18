"use client";

import { LayoutGridIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerHeader,
  DrawerPopup,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  navigationRegistry,
  pickNavigationItems,
  workCounts,
  workNavigation,
} from "@/platform/navigation/navigation-registry";
import { matchesSearch } from "@/platform/navigation/search-text";
import { PrimaryActionButton } from "@/platform/ui/app-shell/primary-action";

/**
 * Phone navigation (D-069, §40.2). The rail becomes a bottom bar: the work layer, the seat's
 * primary action in the middle where the thumb reaches, and the modules behind a full-height
 * drawer with a search box. The sidebar drawer and the header's menu button are gone on this
 * width, so there is one way to navigate, not two.
 */
export function MobileBottomBar({
  visibleItemIds,
  visibleWorkIds,
  primaryAction,
}: {
  visibleItemIds: readonly string[];
  visibleWorkIds: readonly string[];
  primaryAction: string;
}) {
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const groups = pickNavigationItems(navigationRegistry, visibleItemIds);
  const workItems = workNavigation.filter((item) => visibleWorkIds.includes(item.id));

  const matchingGroups = groups
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) => !query || matchesSearch(`${item.label} ${group.label}`, query),
      ),
    }))
    .filter((group) => group.items.length > 0);

  const closeDrawer = () => {
    setOpen(false);
    setQuery("");
  };

  // The action belongs in the middle, so the work entries are split around it: the modules
  // entry always closes the right-hand side.
  const leftItems = workItems.slice(0, Math.ceil(workItems.length / 2));
  const rightItems = workItems.slice(leftItems.length);

  const renderItem = (item: (typeof workItems)[number]) => {
    const isActive = pathname === item.href;
    const count = workCounts[item.id];
    return (
      <Link
        aria-current={isActive ? "page" : undefined}
        className={`relative flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-1 text-xs transition-colors ${
          isActive ? "text-foreground" : "text-muted-foreground"
        }`}
        href={item.href}
        key={item.id}
      >
        <item.icon aria-hidden="true" className="size-5" />
        <span className="truncate">{item.label}</span>
        {count ? (
          <Badge
            aria-hidden="true"
            className="pointer-events-none absolute end-1/4 top-0"
            size="sm"
            variant="destructive"
          >
            {count}
          </Badge>
        ) : null}
      </Link>
    );
  };

  return (
    <nav
      aria-label="Telefon gezinmesi"
      // Sits under the scrolling content, so nothing is ever covered. The safe-area inset keeps
      // it clear of the home indicator on phones that have one.
      className="flex shrink-0 items-center justify-around gap-1 border-t bg-background px-2 pt-1 pb-[max(0.25rem,env(safe-area-inset-bottom))] md:hidden"
    >
      {leftItems.map(renderItem)}

      {/*
       * The action sits in the middle, the easiest place to reach with a thumb. The plus alone
       * carries it on a phone (owner 2026-09-17); the label stays as the accessible name.
       */}
      <PrimaryActionButton
        className="mx-2 size-11 shrink-0 rounded-full"
        label={primaryAction}
        labelClassName="hidden"
        size="icon-lg"
      />

      {rightItems.map(renderItem)}

      <Drawer onOpenChange={setOpen} open={open}>
        <DrawerTrigger
          render={
            <button
              className="flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-1 text-xs text-muted-foreground"
              type="button"
            />
          }
        >
          <LayoutGridIcon aria-hidden="true" className="size-5" />
          <span>Modüller</span>
        </DrawerTrigger>
        <DrawerPopup className="h-[85svh]">
          <DrawerHeader>
            <DrawerTitle>Modüller</DrawerTitle>
            <Input
              aria-label="Modül ara"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Modül ara…"
              value={query}
            />
          </DrawerHeader>
          <ScrollArea className="min-h-0 flex-1">
            <div className="flex flex-col gap-5 px-4 pb-6">
              {matchingGroups.map((group) => (
                <section aria-label={group.label} key={group.id}>
                  <h2 className="mb-2 text-xs text-muted-foreground">{group.label}</h2>
                  <ul className="grid grid-cols-3 gap-2">
                    {group.items.map((item) => (
                      <li key={item.id}>
                        <Link
                          className="flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-lg border p-2 text-center text-xs transition-colors hover:bg-accent/50"
                          href={item.href}
                          onClick={closeDrawer}
                        >
                          <item.icon aria-hidden="true" className="size-5" />
                          <span className="line-clamp-2">{item.label}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
              {matchingGroups.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Aramanıza uyan modül yok.
                </p>
              ) : null}
            </div>
          </ScrollArea>
          <div className="border-t px-4 py-3">
            <Button className="w-full" onClick={closeDrawer} variant="outline">
              Kapat
            </Button>
          </div>
        </DrawerPopup>
      </Drawer>
    </nav>
  );
}
