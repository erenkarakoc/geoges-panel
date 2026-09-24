import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/platform/ui/theme/theme-toggle";

/**
 * Split auth layout (devl.dev pattern, DESIGN_SYSTEM_RULES §3): decorative panel on the left,
 * one form column on the right. From `2xl` the pair sits in a centred 16:9 card.
 */
export function AuthSplitLayout({
  decoration,
  children,
  className,
}: {
  decoration: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative h-svh overflow-hidden bg-background text-foreground",
        "2xl:flex 2xl:h-auto 2xl:min-h-svh 2xl:items-center 2xl:justify-center 2xl:overflow-visible 2xl:p-6",
        className,
      )}
    >
      <div className="absolute top-6 right-6 z-30">
        <ThemeToggle />
      </div>
      <div
        className={cn(
          "relative mx-auto flex h-full w-full max-w-[1600px]",
          "2xl:aspect-[16/9] 2xl:h-auto 2xl:min-h-0 2xl:w-[min(94vw,calc(92svh*16/9))] 2xl:max-w-none",
          "2xl:overflow-hidden 2xl:rounded-2xl 2xl:border 2xl:border-border/70 2xl:bg-background/95 2xl:shadow-[0_25px_80px_-24px_rgb(0_0_0/0.5)]",
        )}
      >
        <div className="relative hidden flex-1 overflow-hidden border-r border-border/60 lg:block">
          {decoration}
        </div>
        {/*
         * The column scrolls; the wrapper inside it centres. A centring flex container that
         * scrolls by itself pushes the top of tall content out of its own scroll range — the
         * ten recovery codes hit exactly that and slid under the logo (owner, 2026-09-24).
         * `min-h-full` keeps short screens centred and lets tall ones grow instead of overflow.
         * The padding is symmetric on purpose: centred content does not move because of it, and
         * tall content gets the same air above its heading as below — below `lg` enough to clear
         * the logo in the corner (owner: the heading had too little room above it).
         */}
        <div className="relative w-full overflow-y-auto lg:w-[560px] xl:w-[620px]">
          <div className="flex min-h-full flex-col items-center justify-center px-6 py-24 lg:px-14 lg:py-16">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
