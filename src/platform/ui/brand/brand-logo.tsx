import { cn } from "@/lib/utils";

/**
 * GEOGES brand marks. The app itself shows only the square tile (D-071): the wordmark logos were
 * taken out of the product on 2026-09-17, and the only place a full logo still appears is the
 * particle figure on the authentication screens, which samples the file below.
 */

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
 * Square GEOGES tile. Set the size with `className` (e.g. `size-12`).
 *
 * The tile is an image, so the page's CSS cannot reach inside it and
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
