"use client";

import { ArrowDownIcon, ArrowUpIcon, CornerDownLeftIcon, SearchIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Fragment, useEffect, useState, useSyncExternalStore } from "react";

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
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import type { NavigationGroup, NavigationItem } from "@/platform/navigation/navigation-registry";
import { matchesSearch } from "@/platform/navigation/search-text";

type PaletteItem = { value: string; label: string; href: string };
type PaletteGroup = { value: string; items: PaletteItem[] };

const toPaletteItem = ({ id, label, href }: NavigationItem): PaletteItem => ({
  value: id,
  label,
  href,
});

// Apple keyboards say ⌘, everything else Ctrl. Read on the client only; the server renders Ctrl.
const subscribeToNothing = () => () => {};
const isApplePlatform = () => /Mac|iPhone|iPad/.test(navigator.userAgent);

/**
 * Site-wide palette (D-044, D-055 middle zone, TASK-0029). Built exactly like COSS UI's own
 * Command example (D-060b): input on top, grouped results in a panel, key hints in the footer.
 * It lists only what the current seat may open: the work layer first, then the module groups.
 */
export function CommandPalette({
  workItems,
  groups,
}: {
  workItems: readonly NavigationItem[];
  groups: readonly NavigationGroup[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const modifierLabel = useSyncExternalStore(
    subscribeToNothing,
    () => (isApplePlatform() ? "⌘" : "Ctrl"),
    () => "Ctrl",
  );

  const groupedItems: PaletteGroup[] = [
    ...(workItems.length > 0 ? [{ value: "İşler", items: workItems.map(toPaletteItem) }] : []),
    ...groups.map((group) => ({ value: group.label, items: group.items.map(toPaletteItem) })),
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
    setOpen(false);
    router.push(item.href);
  }

  return (
    <CommandDialog onOpenChange={setOpen} open={open}>
      {/* Wide in the middle of the header, and the same box on a phone (owner 2026-09-23): same
          height as on desktop, only the keyboard shortcut steps aside since a phone has no
          Ctrl+K. The tap target still reaches 44 px through COSS's coarse-pointer overlay. */}
      <CommandDialogTrigger
        render={
          <Button
            className="w-full max-w-md min-w-0 justify-start text-muted-foreground"
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
      <CommandDialogPopup>
        {/* COSS's example leaves filtering to Base UI; ours also ignores Turkish letters. */}
        <Command
          filter={(item, query) => matchesSearch((item as PaletteItem).label, query)}
          items={groupedItems}
        >
          <CommandInput placeholder="Sayfa veya modül arayın…" />
          <CommandPanel>
            <CommandEmpty>Sonuç bulunamadı.</CommandEmpty>
            <CommandList>
              {(group: PaletteGroup) => (
                <Fragment key={group.value}>
                  <CommandGroup items={group.items}>
                    <CommandGroupLabel>{group.value}</CommandGroupLabel>
                    <CommandCollection>
                      {(item: PaletteItem) => (
                        <CommandItem
                          key={item.value}
                          onClick={() => handleItemClick(item)}
                          value={item.value}
                        >
                          <span className="flex-1">{item.label}</span>
                        </CommandItem>
                      )}
                    </CommandCollection>
                  </CommandGroup>
                  <CommandSeparator />
                </Fragment>
              )}
            </CommandList>
          </CommandPanel>
          {/* Keyboard hints belong to a keyboard: a phone never sees them (owner 2026-09-23). */}
          <CommandFooter className="hidden md:flex">
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
