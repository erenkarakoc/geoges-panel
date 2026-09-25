import { ChevronRightIcon } from "lucide-react";
import Link from "next/link";

import {
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/frame";

/**
 * SCR-190's own second-level list (SPECIAL_SCREENS): the kinds of definitions, each opening its
 * list. The production definitions come first because every daily log is built from them.
 */

export type DefinitionLink = { href: string; title: string; note: string };

export function DefinitionGroups({
  groups,
}: {
  groups: readonly { title: string; description: string; links: readonly DefinitionLink[] }[];
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {groups.map((group) => (
        <Frame className="w-full" key={group.title}>
          <FrameHeader>
            <FrameTitle>{group.title}</FrameTitle>
            <FrameDescription>{group.description}</FrameDescription>
          </FrameHeader>
          <FramePanel className="p-0">
            <ul className="divide-y">
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link
                    className="flex min-h-14 items-center gap-3 px-5 py-3 transition-colors hover:bg-accent/50"
                    href={link.href}
                  >
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="text-sm font-medium">{link.title}</span>
                      <span className="text-xs text-muted-foreground">{link.note}</span>
                    </span>
                    <ChevronRightIcon
                      aria-hidden="true"
                      className="size-4 shrink-0 text-muted-foreground"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </FramePanel>
        </Frame>
      ))}
    </div>
  );
}
