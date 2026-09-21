import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import type { NavigationItem } from "@/platform/navigation/navigation-registry";

/** Placeholder for modules that are designed and built in later phases. */
export function ModulePlaceholder({ item }: { item: NavigationItem }) {
  return (
    <Empty className="flex-1">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <item.icon aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle aria-level={1} role="heading">
          {item.label}
        </EmptyTitle>
        <EmptyDescription>{item.description}</EmptyDescription>
        <Badge className="mt-4" variant="outline">
          Henüz geliştirilmedi
        </Badge>
      </EmptyHeader>
      <EmptyContent>
        <Button render={<Link href="/today" />} variant="outline">
          <ArrowLeftIcon aria-hidden="true" />
          Cockpit&apos;e dön
        </Button>
      </EmptyContent>
    </Empty>
  );
}
