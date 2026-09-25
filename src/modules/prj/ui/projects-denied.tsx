import { LockIcon } from "lucide-react";
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

/** What somebody without the right sees instead of the project list or card (D-221). */
export function ProjectsDenied() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <LockIcon aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>Bu ekranı görme yetkiniz yok</EmptyTitle>
        <EmptyDescription>
          Projeleri, projelerde ya da şantiyelerde görevi olan roller görür.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button render={<Link href="/today" />} variant="outline">
          Bugün’e dön
        </Button>
      </EmptyContent>
    </Empty>
  );
}
