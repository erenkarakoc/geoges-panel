"use client";

import { PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toastManager } from "@/components/ui/toast";

/**
 * The one action a screen repeats (D-062): the page's own if it declares one, otherwise the
 * seat's. It lives in the header on desktop and in the middle of the bottom bar on a phone
 * (D-069), so both call the same component and there is one implementation of the behaviour.
 *
 * Until the modules have forms, pressing it says so rather than doing nothing.
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
