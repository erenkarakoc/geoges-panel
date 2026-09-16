"use client";

import {
  BellIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MoonIcon,
  PlusIcon,
  SearchIcon,
  SunIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { Menu, MenuItem, MenuPopup, MenuTrigger } from "@/components/ui/menu";
import {
  type RolePersona,
  siteContextTabs,
  siteDates,
} from "@/sandbox/navigation/navigation-prototype-data";
import type { PrototypeView } from "@/sandbox/navigation/prototype-view";

/**
 * Three-zone toolbar (D-055): left = where you are, middle = where you go, right = what you do.
 * The second row is rendered only while an object is open, so other screens keep today's layout.
 */
export function PrototypeToolbar({
  persona,
  view,
  onCommandPalette,
}: {
  persona: RolePersona;
  view: PrototypeView;
  onCommandPalette: () => void;
}) {
  const { resolvedTheme, setTheme } = useTheme();
  const [context, setContext] = useState(persona.contextLabel);
  const [activeTab, setActiveTab] = useState<string>(siteContextTabs[0]);
  const [activeDate, setActiveDate] = useState<string>(siteDates[siteDates.length - 2]);

  const showContextRow = view.kind === "site";

  return (
    <header className="shrink-0 border-b bg-background">
      <div className="flex h-14 items-center gap-2 px-3">
        {/* Left — where you are */}
        {persona.contextOptions.length > 1 ? (
          <Menu>
            <MenuTrigger render={<Button size="sm" variant="outline" />}>
              {context}
              <ChevronDownIcon aria-hidden="true" />
            </MenuTrigger>
            <MenuPopup align="start">
              {persona.contextOptions.map((option) => (
                <MenuItem key={option} onClick={() => setContext(option)}>
                  {option}
                </MenuItem>
              ))}
            </MenuPopup>
          </Menu>
        ) : (
          <span className="px-2 text-sm font-medium">{persona.contextLabel}</span>
        )}

        {/* Middle — where you go */}
        <Button
          className="mx-2 hidden max-w-md flex-1 justify-start text-muted-foreground sm:flex"
          onClick={onCommandPalette}
          variant="outline"
        >
          <SearchIcon aria-hidden="true" />
          Ara, git, yap…
          <Kbd className="ms-auto">⌘K</Kbd>
        </Button>
        <Button
          aria-label="Ara"
          className="sm:hidden"
          onClick={onCommandPalette}
          size="icon"
          variant="ghost"
        >
          <SearchIcon aria-hidden="true" />
        </Button>

        {/* Right — what you do */}
        <div className="ms-auto flex items-center gap-1">
          <Button size="sm">
            <PlusIcon aria-hidden="true" />
            {persona.primaryAction}
          </Button>
          <Button aria-label="Bildirimler" className="relative" size="icon" variant="ghost">
            <BellIcon aria-hidden="true" />
            {persona.notificationCount > 0 ? (
              <Badge
                className="pointer-events-none absolute -end-0.5 -top-0.5"
                size="sm"
                variant="destructive"
              >
                {persona.notificationCount}
              </Badge>
            ) : null}
          </Button>
          <Button
            aria-label="Açık ve koyu görünüm arasında geçiş yap"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            size="icon"
            variant="ghost"
          >
            <SunIcon aria-hidden="true" className="hidden dark:block" />
            <MoonIcon aria-hidden="true" className="dark:hidden" />
          </Button>
        </div>
      </div>

      {showContextRow ? (
        <div className="flex h-10 items-center gap-1 border-t px-3">
          <nav aria-label="Şantiye bölümleri" className="flex items-center gap-1 overflow-x-auto">
            {siteContextTabs.map((tab) => (
              <Button
                aria-current={activeTab === tab ? "page" : undefined}
                className={activeTab === tab ? "text-foreground" : "text-muted-foreground"}
                key={tab}
                onClick={() => setActiveTab(tab)}
                size="xs"
                variant={activeTab === tab ? "secondary" : "ghost"}
              >
                {tab}
              </Button>
            ))}
          </nav>
          <div className="ms-auto flex items-center gap-1">
            <Button aria-label="Önceki gün" size="icon-xs" variant="ghost">
              <ChevronLeftIcon aria-hidden="true" />
            </Button>
            {siteDates.map((date) => (
              <Button
                key={date}
                onClick={() => setActiveDate(date)}
                size="xs"
                variant={activeDate === date ? "secondary" : "ghost"}
              >
                {date}
              </Button>
            ))}
            <Button aria-label="Sonraki gün" size="icon-xs" variant="ghost">
              <ChevronRightIcon aria-hidden="true" />
            </Button>
          </div>
        </div>
      ) : null}
    </header>
  );
}
