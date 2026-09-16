"use client";

import { FlaskConicalIcon } from "lucide-react";
import { useEffect, useState } from "react";

import {
  Command,
  CommandDialog,
  CommandDialogPopup,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Toggle } from "@/components/ui/toggle";
import {
  railGroups,
  rolePersonas,
  type RoleId,
} from "@/sandbox/navigation/navigation-prototype-data";
import { PrototypeRail } from "@/sandbox/navigation/prototype-rail";
import {
  ApprovalQueueScreen,
  ModuleScreen,
  SiteScreen,
  TasksScreen,
  TodayScreen,
} from "@/sandbox/navigation/prototype-screens";
import { PrototypeToolbar } from "@/sandbox/navigation/prototype-toolbar";
import type { PrototypeView } from "@/sandbox/navigation/prototype-view";

/**
 * Navigation prototype (CHG-004, TASK-0031): icon rail with a work layer on top (D-054),
 * three-zone toolbar with a conditional context row (D-055) and "Bugün" per role (D-056).
 *
 * Development-only sandbox (D-052): no product code, no real data, production returns 404.
 * The role switcher exists only here, so the same skeleton can be judged from four seats.
 */
export function NavigationPrototypePage() {
  const [roleId, setRoleId] = useState<RoleId>("coordinator");
  const [view, setView] = useState<PrototypeView>({ kind: "today" });
  const [paletteOpen, setPaletteOpen] = useState(false);

  const persona = rolePersonas.find((item) => item.id === roleId) ?? rolePersonas[0];

  const paletteLabels = [
    "Bugün",
    ...(persona.approvalCount > 0 ? ["Onaylar"] : []),
    ...(persona.taskCount > 0 ? ["Görevler"] : []),
    ...railGroups
      .flatMap((group) => group.modules)
      .filter(
        (module) =>
          persona.visibleModuleIds.includes(module.id) &&
          // "Onay" and "Görevler" are already in the work layer above.
          module.id !== "approvals" &&
          module.id !== "tasks",
      )
      .map((module) => module.label),
  ];

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setPaletteOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const selectFromPalette = (value: string | null) => {
    // Base UI's Autocomplete reports the input value on every keystroke, so a typed fragment
    // must not navigate; only a value that names an entry counts as a choice. The comparison
    // ignores case because the input keeps what the user typed ("stok" for "Stok").
    const label = value
      ? paletteLabels.find(
          (entry) => entry.toLocaleLowerCase("tr-TR") === value.trim().toLocaleLowerCase("tr-TR"),
        )
      : undefined;
    if (!label) {
      return;
    }
    setPaletteOpen(false);
    if (label === "Bugün") {
      setView({ kind: "today" });
    } else if (label === "Onaylar") {
      setView({ kind: "approvals" });
    } else if (label === "Görevler") {
      setView({ kind: "tasks" });
    } else if (label === "Şantiyeler" || label === "Şantiye Kaydı") {
      setView({ kind: "site" });
    } else {
      setView({ kind: "module", groupId: "", label });
    }
  };

  return (
    <div className="flex h-svh flex-col overflow-hidden bg-sidebar">
      <div className="flex shrink-0 flex-wrap items-center gap-2 px-4 py-2 text-xs text-muted-foreground">
        <FlaskConicalIcon aria-hidden="true" className="size-3.5" />
        <span>Gezinme prototipi — geliştirme ortamı, örnek veri (TASK-0031)</span>
        <div className="ms-auto flex flex-wrap items-center gap-1">
          <span className="me-1">Rolü değiştir:</span>
          {rolePersonas.map((item) => (
            <Toggle
              key={item.id}
              onPressedChange={() => {
                setRoleId(item.id);
                setView({ kind: "today" });
              }}
              pressed={item.id === roleId}
              size="sm"
            >
              {item.label}
            </Toggle>
          ))}
        </div>
      </div>

      <p className="shrink-0 px-4 pb-2 text-xs text-muted-foreground">{persona.dayLine}</p>

      <div className="mx-4 mb-4 flex min-h-0 flex-1 overflow-hidden rounded-xl border bg-background shadow-sm">
        <PrototypeRail onNavigate={setView} persona={persona} view={view} />
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Keyed by role: the toolbar holds the chosen context and tab in local state, and a
              new role means a new context, so it starts fresh instead of keeping the old one. */}
          <PrototypeToolbar
            key={persona.id}
            onCommandPalette={() => setPaletteOpen(true)}
            persona={persona}
            view={view}
          />
          <ScrollArea className="min-h-0 flex-1">
            <div className="p-4 md:p-6">
              {view.kind === "today" ? <TodayScreen persona={persona} /> : null}
              {view.kind === "approvals" ? <ApprovalQueueScreen persona={persona} /> : null}
              {view.kind === "tasks" ? <TasksScreen persona={persona} /> : null}
              {view.kind === "site" ? <SiteScreen persona={persona} /> : null}
              {view.kind === "module" ? <ModuleScreen label={view.label} /> : null}
            </div>
          </ScrollArea>
        </div>
      </div>

      <CommandDialog onOpenChange={setPaletteOpen} open={paletteOpen}>
        <CommandDialogPopup>
          <Command items={paletteLabels} onValueChange={selectFromPalette}>
            <CommandInput placeholder="Ara, git, yap…" />
            <CommandList>
              {(label: string) => (
                <CommandItem key={label} value={label}>
                  {label}
                </CommandItem>
              )}
            </CommandList>
            <CommandEmpty>Sonuç yok.</CommandEmpty>
          </Command>
        </CommandDialogPopup>
      </CommandDialog>
    </div>
  );
}
