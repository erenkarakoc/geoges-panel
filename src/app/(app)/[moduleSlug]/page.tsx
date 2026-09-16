import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  findNavigationItemByHref,
  navigationRegistry,
} from "@/platform/navigation/navigation-registry";
import { ModulePlaceholder } from "@/platform/ui/module-placeholder";

// Placeholder pages for every registered module except those with their own route.
const ownRoutes = new Set(["/dashboard"]);

export const dynamicParams = false;

export function generateStaticParams() {
  return navigationRegistry
    .flatMap((group) => group.items)
    .filter((item) => !ownRoutes.has(item.href))
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

  return <ModulePlaceholder item={item} />;
}
