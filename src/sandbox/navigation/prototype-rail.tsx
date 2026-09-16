"use client";

import { CalendarCheckIcon, ClipboardCheckIcon, ListChecksIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Menu,
  MenuGroup,
  MenuGroupLabel,
  MenuItem,
  MenuPopup,
  MenuTrigger,
} from "@/components/ui/menu";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipPopup, TooltipTrigger } from "@/components/ui/tooltip";
import {
  moduleIcons,
  railGroups,
  type RolePersona,
} from "@/sandbox/navigation/navigation-prototype-data";
import type { PrototypeView } from "@/sandbox/navigation/prototype-view";

/**
 * Two-region icon rail (D-054): the work layer on top, the module groups below a separator.
 * A group icon opens its modules as a flyout, so the module list never occupies a column.
 */
export function PrototypeRail({
  persona,
  view,
  onNavigate,
}: {
  persona: RolePersona;
  view: PrototypeView;
  onNavigate: (view: PrototypeView) => void;
}) {
  const workItems = [
    {
      id: "today" as const,
      label: "Bugün",
      icon: CalendarCheckIcon,
      count: 0,
      visible: true,
    },
    {
      id: "approvals" as const,
      label: "Onaylar",
      icon: ClipboardCheckIcon,
      count: persona.approvalCount,
      visible: persona.approvalCount > 0,
    },
    {
      id: "tasks" as const,
      label: "Görevler",
      icon: ListChecksIcon,
      count: persona.taskCount,
      visible: persona.taskCount > 0,
    },
  ];

  const groups = railGroups
    .filter((group) => persona.visibleGroupIds.includes(group.id))
    .map((group) => ({
      ...group,
      modules: group.modules.filter((module) => persona.visibleModuleIds.includes(module.id)),
    }))
    .filter((group) => group.modules.length > 0);

  return (
    <nav
      aria-label="Ana gezinme"
      className="flex w-14 shrink-0 flex-col items-center gap-1 border-e bg-sidebar py-3"
    >
      <div className="mb-2 flex size-8 items-center justify-center rounded-md bg-primary text-[0.6rem] font-medium text-primary-foreground">
        GP
      </div>

      {workItems
        .filter((item) => item.visible)
        .map((item) => (
          <Tooltip key={item.id}>
            <TooltipTrigger
              render={
                <Button
                  aria-current={view.kind === item.id ? "page" : undefined}
                  aria-label={item.count > 0 ? `${item.label} (${item.count})` : item.label}
                  className="relative"
                  onClick={() => onNavigate({ kind: item.id })}
                  size="icon"
                  variant={view.kind === item.id ? "default" : "ghost"}
                />
              }
            >
              <item.icon aria-hidden="true" />
              {item.count > 0 ? (
                <Badge
                  className="pointer-events-none absolute -end-1 -top-1"
                  size="sm"
                  variant="destructive"
                >
                  {item.count}
                </Badge>
              ) : null}
            </TooltipTrigger>
            <TooltipPopup side="right">{item.label}</TooltipPopup>
          </Tooltip>
        ))}

      <Separator className="my-2 w-6" />

      {groups.map((group) => (
        <Menu key={group.id}>
          <MenuTrigger
            render={
              <Button
                aria-label={group.label}
                size="icon"
                variant={
                  view.kind === "module" && view.groupId === group.id ? "secondary" : "ghost"
                }
              />
            }
          >
            <group.icon aria-hidden="true" />
          </MenuTrigger>
          <MenuPopup align="start" side="right">
            <MenuGroup>
              <MenuGroupLabel>{group.label}</MenuGroupLabel>
              {group.modules.map((module) => {
                const ModuleIcon = moduleIcons[module.id];
                return (
                  <MenuItem
                    key={module.id}
                    onClick={() =>
                      onNavigate(
                        module.id === "sites" || module.id === "daily-site-logs"
                          ? { kind: "site" }
                          : { kind: "module", groupId: group.id, label: module.label },
                      )
                    }
                  >
                    {ModuleIcon ? <ModuleIcon aria-hidden="true" /> : null}
                    {module.label}
                  </MenuItem>
                );
              })}
            </MenuGroup>
          </MenuPopup>
        </Menu>
      ))}

      <div className="mt-auto flex size-8 items-center justify-center rounded-full bg-muted text-[0.65rem] font-medium text-muted-foreground">
        {persona.label.slice(0, 2).toLocaleUpperCase("tr-TR")}
      </div>
    </nav>
  );
}
