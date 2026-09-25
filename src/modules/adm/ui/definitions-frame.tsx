import { ChevronLeftIcon, LockIcon } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

/**
 * The pieces every page of SCR-190 shares (TASK-0121): the way back to the list of definitions,
 * and the screen somebody without the right sees (SCREEN_STATES, D-221).
 */

export function BackToDefinitions() {
  return (
    <Button
      className="self-start"
      render={<Link href="/admin/master-data" />}
      size="sm"
      variant="ghost"
    >
      <ChevronLeftIcon aria-hidden="true" />
      Tanımlar
    </Button>
  );
}

export function DefinitionsDenied({ backTo }: { backTo: string }) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <LockIcon />
        </EmptyMedia>
        <EmptyTitle>Bu ekranı görme yetkiniz yok</EmptyTitle>
        <EmptyDescription>Tanımları yalnız tanımlar yetkisi olan roller görür.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button render={<Link href={backTo} />} variant="outline">
          Bugün&apos;e dön
        </Button>
      </EmptyContent>
    </Empty>
  );
}
