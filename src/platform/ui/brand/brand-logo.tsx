import type { FC, SVGProps } from "react";

import { cn } from "@/lib/utils";

import LogoIcon from "../../../../public/assets/brand/icon_primary.svg?svgr";
import LogoLong from "../../../../public/assets/brand/logo_long_primary.svg?svgr";
import LogoPanel from "../../../../public/assets/brand/logo_panel_primary.svg?svgr";
import LogoStacked from "../../../../public/assets/brand/logo_primary.svg?svgr";

/**
 * GEOGES logos from `public/assets/brand`, rendered inline as SVG. The brand fill is replaced
 * with currentColor at build time, so one file serves both themes via `--brand-logo`
 * (brand.css). Replace the `*_primary.svg` files there to update the logo everywhere.
 */
const logos: Record<"icon" | "stacked" | "long" | "panel", FC<SVGProps<SVGSVGElement>>> = {
  icon: LogoIcon,
  stacked: LogoStacked,
  long: LogoLong,
  panel: LogoPanel,
};

/** Stacked logo as a file URL, for consumers that sample the image instead of rendering it. */
export const brandStackedLogoUrl = "/assets/brand/logo_light.svg";

/**
 * Square app tiles (216×216, rounded plate + glyph). Unlike the logos above these carry two
 * colours of their own, so they must not go through the `currentColor` swap: they are referenced
 * by URL and rendered as images. `primary` is the brand-blue plate, `light` and `dark` match a
 * light or dark surface.
 */
export const brandTileUrls = {
  primary: "/assets/brand/icon_rectangle_primary.svg",
  light: "/assets/brand/icon_rectangle_light.svg",
  dark: "/assets/brand/icon_rectangle_dark.svg",
} as const;

/**
 * Ink of the logo. `theme` follows `--brand-logo` (brand blue on light, light tone on dark);
 * the others are fixed, for placing a logo on a surface whose colour the theme does not control.
 * Never use `brand` on a theme-following surface: a primary logo must not appear in dark mode.
 */
const tones = {
  theme: "text-(--brand-logo)",
  brand: "text-(--brand-blue)",
  light: "text-(--brand-light)",
  dark: "text-(--brand-dark)",
  inherit: "",
} as const;

type BrandLogoProps = {
  variant: keyof typeof logos;
  tone?: keyof typeof tones;
  /** Set the height (e.g. `h-12`); width follows the logo's aspect ratio. */
  className?: string;
};

export function BrandLogo({ variant, tone = "theme", className }: BrandLogoProps) {
  const Logo = logos[variant];

  return (
    <Logo
      aria-label="GEOGES"
      className={cn("w-auto shrink-0", tones[tone], className)}
      role="img"
    />
  );
}

/**
 * Square GEOGES tile. Set the size with `className` (e.g. `size-12`).
 *
 * The tile is an image, so — unlike `BrandLogo` — the page's CSS cannot reach inside it and
 * `text-*` classes have no effect on it. The default `variant="theme"` follows the theme: that
 * swaps the file itself — the brand-blue plate on light surfaces, the light plate on dark ones.
 *
 * Rule (owner, 2026-09-16): a primary logo is never shown in dark mode. Use a fixed variant only
 * on a surface whose colour does not change with the theme.
 */
export function BrandTile({
  variant = "theme",
  className,
}: {
  variant?: keyof typeof brandTileUrls | "theme";
  className?: string;
}) {
  if (variant !== "theme") {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- static SVG tile, nothing to optimize
      <img alt="GEOGES" className={cn("shrink-0", className)} src={brandTileUrls[variant]} />
    );
  }

  // `className` stays on the wrapper so the caller keeps control of size and visibility.
  return (
    <span className={cn("inline-flex shrink-0", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element -- static SVG tile, nothing to optimize */}
      <img alt="GEOGES" className="size-full dark:hidden" src={brandTileUrls.primary} />
      {/* eslint-disable-next-line @next/next/no-img-element -- static SVG tile, nothing to optimize */}
      <img
        alt=""
        aria-hidden="true"
        className="hidden size-full dark:block"
        src={brandTileUrls.light}
      />
    </span>
  );
}
