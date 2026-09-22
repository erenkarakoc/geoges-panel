import { ArrowLeftIcon, ConstructionIcon } from "lucide-react";
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
 * A module switched off in this environment (CONFIGURATION section 5): not "no permission", but
 * "not open yet".
 */
export function FeatureOff() {
  return (
    <Empty className="flex-1">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <ConstructionIcon aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle aria-level={1} role="heading">
          Bu bölüm henüz açık değil
        </EmptyTitle>
        <EmptyDescription>Bu bölüm bu ortamda henüz kullanıma açılmadı.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button render={<Link href="/today" />} variant="outline">
          <ArrowLeftIcon aria-hidden="true" />
          Bugün&apos;e dön
        </Button>
      </EmptyContent>
    </Empty>
  );
}
