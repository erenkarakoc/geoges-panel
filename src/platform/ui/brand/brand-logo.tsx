import type { FC, SVGProps } from "react";

import { cn } from "@/lib/utils";

import LogoIcon from "../../../../public/assets/brand/icon_primary.svg?svgr";
import LogoLong from "../../../../public/assets/brand/logo_long_primary.svg?svgr";
import LogoStacked from "../../../../public/assets/brand/logo_primary.svg?svgr";

/**
 * GEOGES logos from `public/assets/brand`, rendered inline as SVG. The brand fill is replaced
 * with currentColor at build time, so one file serves both themes via `--brand-logo`
 * (brand.css). Replace the `*_primary.svg` files there to update the logo everywhere.
 */
const logos: Record<"icon" | "stacked" | "long", FC<SVGProps<SVGSVGElement>>> = {
  icon: LogoIcon,
  stacked: LogoStacked,
  long: LogoLong,
};

export const brandIconUrls = {
  primary: "/assets/brand/icon_primary.svg",
  light: "/assets/brand/icon_light.svg",
} as const;

type BrandLogoProps = {
  variant: keyof typeof logos;
  /** Set the height (e.g. `h-12`); width follows the logo's aspect ratio. */
  className?: string;
};

export function BrandLogo({ variant, className }: BrandLogoProps) {
  const Logo = logos[variant];

  return (
    <Logo
      aria-label="GEOGES"
      className={cn("w-auto shrink-0 text-(--brand-logo)", className)}
      role="img"
    />
  );
}
