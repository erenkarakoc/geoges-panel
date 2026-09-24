import { LockIcon } from "lucide-react";
import type { Metadata } from "next";
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
import { AccessDeniedError, listPeopleSecurity, todayRoute } from "@/modules/iam";
import { PeopleSecurityList } from "@/modules/iam/ui/people-security-list";
import { isModuleEnabled } from "@/platform/features/features";
import { FeatureOff } from "@/platform/ui/feature-off";

export const metadata: Metadata = { title: "Kullanıcılar & Roller" };

/**
 * The minimal people screen (D-273). SCR-190's real design — roles, assignments, delegation,
 * visibility — is Phase 09's; this exists so a lost second factor can be reset by a manager
 * (D-236, TASK-0112) instead of by nobody.
 */
/** The people, or `null` when the person may not manage users. */
async function load() {
  try {
    return await listPeopleSecurity();
  } catch (error) {
    if (error instanceof AccessDeniedError) return null;
    throw error;
  }
}

export default async function UsersRolesPage() {
  if (!isModuleEnabled("IAM")) return <FeatureOff />;

  const people = await load();
  if (people) return <PeopleSecurityList people={people} />;

  // SCREEN_STATES: a screen reached by address without permission (D-221).
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <LockIcon />
        </EmptyMedia>
        <EmptyTitle>Bu ekranı görme yetkiniz yok</EmptyTitle>
        <EmptyDescription>
          Kullanıcıları yalnız kullanıcı yönetimi yetkisi olanlar görür.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button render={<Link href={todayRoute} />} variant="outline">
          Bugün&apos;e dön
        </Button>
      </EmptyContent>
    </Empty>
  );
}
