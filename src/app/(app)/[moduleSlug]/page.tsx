import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  allNavigationItems,
  findNavigationItemByHref,
  navigationRegistry,
} from "@/platform/navigation/navigation-registry";
import { isModuleEnabled } from "@/platform/features/features";
import { FeatureOff } from "@/platform/ui/feature-off";
import { ModulePlaceholder } from "@/platform/ui/module-placeholder";

// Placeholder pages for every registered module except those with their own route.
const ownRoutes = new Set([
  "/today",
  "/sites",
  "/approvals",
  "/tasks",
  "/audit-log",
  "/users-roles",
  "/leads-clients",
  "/projects",
]);

/** A screen of its own, either by name or because its address is not a single segment. */
const hasOwnRoute = (href: string) => ownRoutes.has(href) || href.lastIndexOf("/") > 0;

export const dynamicParams = false;

export function generateStaticParams() {
  return allNavigationItems()
    .filter((item) => !hasOwnRoute(item.href))
    .map((item) => ({ moduleSlug: item.href.slice(1) }));
}

export async function generateMetadata({ params }: PageProps<"/[moduleSlug]">): Promise<Metadata> {
  const { moduleSlug } = await params;
  const item = findNavigationItemByHref(navigationRegistry, `/${moduleSlug}`);
  return { title: item?.label };
}

export default async function ModulePage({ params }: PageProps<"/[moduleSlug]">) {
  const { moduleSlug } = await params;
  const item = findNavigationItemByHref(navigationRegistry, `/${moduleSlug}`);

  if (!item) {
    notFound();
  }

  if (!isModuleEnabled(item.moduleCode)) {
    return <FeatureOff />;
  }

  return <ModulePlaceholder item={item} />;
}
