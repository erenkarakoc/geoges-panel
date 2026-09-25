"use client";

import {
  ArrowDownIcon,
  ArrowUpIcon,
  CornerDownLeftIcon,
  SearchIcon,
  FileTextIcon,
  XIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Fragment, useEffect, useState, useSyncExternalStore, type CSSProperties } from "react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandCollection,
  CommandDialog,
  CommandDialogPopup,
  CommandDialogTrigger,
  CommandEmpty,
  CommandFooter,
  CommandGroup,
  CommandGroupLabel,
  CommandInput,
  CommandItem,
  CommandList,
  CommandPanel,
  CommandSeparator,
} from "@/components/ui/command";
import { Skeleton } from "@/components/ui/skeleton";
import { useRecordSearch } from "./use-record-search";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import type { NavigationGroup, NavigationItem } from "@/platform/navigation/navigation-registry";
import { matchesSearch } from "@/platform/navigation/search-text";
import { isPanelPath } from "@/platform/search/search";

type PaletteItem = {
  value: string;
  label: string;
  href: string;
  secondary?: string | null;
  remote?: boolean;
};
type PaletteGroup = { value: string; id?: string; items: PaletteItem[] };

const toPaletteItem = ({ id, label, href }: NavigationItem): PaletteItem => ({
  value: id,
  label,
  href,
});

// Apple keyboards say ⌘, everything else Ctrl. Read on the client only; the server renders Ctrl.
const subscribeToNothing = () => () => {};
const isApplePlatform = () => /Mac|iPhone|iPad/.test(navigator.userAgent);
const subscribeViewport = (changed: () => void) => {
  window.visualViewport?.addEventListener("resize", changed);
  window.addEventListener("resize", changed);
  return () => {
    window.visualViewport?.removeEventListener("resize", changed);
    window.removeEventListener("resize", changed);
  };
};

/**
 * Site-wide palette (D-044, D-055 middle zone, TASK-0029). Built exactly like COSS UI's own
 * Command example (D-060b): input on top, grouped results in a panel, key hints in the footer.
 * It lists only what the current seat may open: the work layer first, then the module groups.
 */
export function CommandPalette({
  workItems,
  groups,
  userId,
}: {
  workItems: readonly NavigationItem[];
  groups: readonly NavigationGroup[];
  userId: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const records = useRecordSearch(query, open, userId);
  const viewportHeight = useSyncExternalStore(
    subscribeViewport,
    () => window.visualViewport?.height ?? window.innerHeight,
    () => 0,
  );
  const modifierLabel = useSyncExternalStore(
    subscribeToNothing,
    () => (isApplePlatform() ? "⌘" : "Ctrl"),
    () => "Ctrl",
  );

  const groupedItems: PaletteGroup[] = [
    ...(workItems.some((item) => item.href === "/tasks")
      ? [
          {
            value: "İşlemler",
            items: [{ value: "action:assign-task", label: "Görev ver", href: "/tasks/new" }],
          },
        ]
      : []),
    ...(workItems.length > 0 ? [{ value: "İşler", items: workItems.map(toPaletteItem) }] : []),
    ...groups.map((group) => ({ value: group.label, items: group.items.map(toPaletteItem) })),
    ...records.groups.map((group) => ({
      value: group.label,
      id: `records:${group.type}`,
      items: [
        ...group.hits.map((hit) => ({
          value: `${hit.recordSchema}.${hit.recordTable}.${hit.recordId}`,
          label: hit.title,
          href: hit.linkPath,
          secondary: hit.secondary,
          remote: true,
        })),
        ...(group.hasMore && group.listHref
          ? [
              {
                value: `all:${group.type}`,
                label: "Tümünü gör",
                href: group.listHref,
                remote: true,
              },
            ]
          : []),
      ],
    })),
    ...(query.trim() && groups.some((group) => group.items.some((item) => item.id === "archive"))
      ? [
          {
            value: "Arşiv",
            items: [
              {
                value: "archive:content",
                label: `Arşivde içerikte ara: ${query}`,
                href: `/archive?q=${encodeURIComponent(query)}`,
                remote: true,
              },
            ],
          },
        ]
      : []),
  ];

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((current) => !current);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  function handleItemClick(item: PaletteItem) {
    if (!isPanelPath(item.href)) return;
    setOpen(false);
    router.push(item.href);
  }

  return (
    <CommandDialog onOpenChange={setOpen} open={open}>
      {/* Wide in the middle of the header, and the same box on a phone (owner 2026-09-23); only
          the keyboard shortcut steps aside since a phone has no Ctrl+K. On a phone the box is
          44 px tall like the buttons beside it (owner 2026-09-25, DESIGN_SYSTEM_RULES §4.1 row
          17a); desktop keeps COSS's size. */}
      <CommandDialogTrigger
        render={
          <Button
            className="w-full max-w-md min-w-0 justify-start text-muted-foreground max-md:h-11"
            variant="outline"
          />
        }
      >
        <SearchIcon aria-hidden="true" />
        {/* Truncates instead of spilling out of a narrow header. */}
        <span className="min-w-0 truncate">Ara veya git…</span>
        <KbdGroup className="ms-auto hidden md:flex">
          <Kbd>{modifierLabel}</Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>
      </CommandDialogTrigger>
      <CommandDialogPopup
        aria-label="Site içi arama"
        style={
          {
            "--search-viewport-height": viewportHeight ? `${viewportHeight}px` : "100dvh",
          } as CSSProperties
        }
        className="max-md:fixed max-md:inset-0 max-md:h-(--search-viewport-height) max-md:max-h-none max-md:max-w-none max-md:translate-y-0 max-md:rounded-none max-md:pt-[env(safe-area-inset-top)] max-md:pb-[env(safe-area-inset-bottom)]"
      >
        {/* COSS's example leaves filtering to Base UI; ours also ignores Turkish letters. */}
        <Command
          value={query}
          onValueChange={setQuery}
          filter={(item, query) =>
            Boolean((item as PaletteItem).remote) ||
            matchesSearch((item as PaletteItem).label, query)
          }
          items={groupedItems}
        >
          <div className="flex shrink-0 items-center [&>div]:min-w-0 [&>div]:flex-1">
            <CommandInput
              maxLength={200}
              aria-label="Sayfa veya kayıt ara"
              placeholder="Sayfa veya kayıt arayın…"
            />
            <Button
              className="me-2 md:hidden"
              size="icon"
              variant="ghost"
              aria-label="Aramayı kapat"
              onClick={() => setOpen(false)}
            >
              <XIcon />
            </Button>
          </div>
          <CommandPanel className="flex min-h-0 flex-col max-md:flex-1 [&>div:has(>[data-slot=scroll-area-viewport])]:min-h-0 [&>div:has(>[data-slot=scroll-area-viewport])]:flex-1">
            {(records.status === "ready" || records.status === "idle") &&
              !records.failedGroups.length && <CommandEmpty>Sonuç bulunamadı.</CommandEmpty>}
            {records.status === "loading" && (
              <div className="space-y-2 p-4" role="status" aria-label="Kayıtlar aranıyor">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-56" />
              </div>
            )}
            {records.status === "offline" && (
              <p className="px-4 py-2 text-sm text-muted-foreground" role="status">
                Bağlantı yok. Ekranlarda arama yapabilirsiniz.
              </p>
            )}
            {records.status === "error" && (
              <Button variant="ghost" onClick={records.retry}>
                Kayıt aramasını tekrar dene
              </Button>
            )}
            {records.failedGroups.map((group) => (
              <div key={group.type} className="px-4 py-2 text-sm" role="status">
                {group.label}: Bu grup yüklenemedi.{" "}
                <Button size="sm" variant="ghost" onClick={records.retry}>
                  Tekrar dene
                </Button>
              </div>
            ))}
            {records.corrected && (
              <p className="px-4 py-2 text-sm text-muted-foreground">Aranan: {records.corrected}</p>
            )}
            <CommandList>
              {(group: PaletteGroup) => (
                <Fragment key={group.id ?? group.value}>
                  <CommandGroup items={group.items}>
                    <CommandGroupLabel>{group.value}</CommandGroupLabel>
                    <CommandCollection>
                      {(item: PaletteItem) => (
                        <CommandItem
                          className="gap-2"
                          key={item.value}
                          onClick={() => handleItemClick(item)}
                          value={item.value}
                        >
                          {item.remote && <FileTextIcon aria-hidden="true" />}
                          <span className="min-w-0 flex-1">
                            <span className="block truncate">{item.label}</span>
                            {item.secondary && (
                              <span className="block truncate text-xs text-muted-foreground">
                                {item.secondary}
                              </span>
                            )}
                          </span>
                        </CommandItem>
                      )}
                    </CommandCollection>
                  </CommandGroup>
                  <CommandSeparator />
                </Fragment>
              )}
            </CommandList>
          </CommandPanel>
          {/* COSS's own footer, on every screen (owner 2026-09-23): only the header's trigger
              drops its shortcut on a phone. */}
          <CommandFooter className="shrink-0">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <KbdGroup>
                  <Kbd>
                    <ArrowUpIcon />
                  </Kbd>
                  <Kbd>
                    <ArrowDownIcon />
                  </Kbd>
                </KbdGroup>
                <span>Gezin</span>
              </div>
              <div className="flex items-center gap-2">
                <Kbd>
                  <CornerDownLeftIcon />
                </Kbd>
                <span>Aç</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Kbd>Esc</Kbd>
              <span>Kapat</span>
            </div>
          </CommandFooter>
        </Command>
      </CommandDialogPopup>
    </CommandDialog>
  );
}
