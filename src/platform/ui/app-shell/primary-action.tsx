"use client";

import { PlusIcon } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { toastManager } from "@/components/ui/toast";

/** Actions whose form exists, by label. */
const ACTION_ROUTES: Readonly<Record<string, string>> = {
  "Görev ver": "/tasks/new", // SCR-014 (TASK-0108)
};

/**
 * The one action a screen repeats (D-062): the page's own if it declares one, otherwise the
 * seat's. It lives in the header on desktop and in the middle of the bottom bar on a phone
 * (D-069), so both call the same component and there is one implementation of the behaviour.
 *
 * An action whose form exists opens it; until the others have forms, pressing them says so
 * rather than doing nothing.
 */
export function PrimaryActionButton({
  label,
  className,
  labelClassName,
  size,
}: {
  label: string;
  className?: string;
  /** Lets the header hide the text on narrow screens while the bottom bar always shows it. */
  labelClassName?: string;
  size?: "sm" | "default" | "lg" | "icon" | "icon-sm" | "icon-lg";
}) {
  const route = ACTION_ROUTES[label];
  if (route) {
    return (
      <Button aria-label={label} className={className} render={<Link href={route} />} size={size}>
        <PlusIcon aria-hidden="true" />
        <span className={labelClassName}>{label}</span>
      </Button>
    );
  }
  return (
    <Button
      aria-label={label}
      className={className}
      onClick={() =>
        toastManager.add({
          type: "info",
          title: "Bu işlem henüz hazır değil",
          description: `"${label}" ilgili modül geliştirildiğinde çalışacak.`,
        })
      }
      size={size}
      type="button"
    >
      <PlusIcon aria-hidden="true" />
      <span className={labelClassName}>{label}</span>
    </Button>
  );
}
