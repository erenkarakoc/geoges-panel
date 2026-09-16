import { cn } from "@/lib/utils";
import { BrandLogo } from "@/platform/ui/brand/brand-logo";

export function BrandFooter({ className }: { className?: string }) {
  return (
    <footer
      className={cn(
        "flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-xs text-muted-foreground md:px-6",
        className,
      )}
    >
      <BrandLogo className="h-8" variant="stacked" />
      <p>© {new Date().getFullYear()} GEOGES A.Ş.</p>
    </footer>
  );
}
