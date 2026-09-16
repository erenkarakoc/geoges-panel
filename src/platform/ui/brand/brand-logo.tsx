import Image from "next/image";

import { cn } from "@/lib/utils";

/**
 * GEOGES brand assets in `public/assets/brand`. `primary` (brand blue) is shown in light mode,
 * `light` (#EFEFEF) in dark mode. Replace files there to update the logo everywhere.
 */
const brandAssets = {
  icon: { name: "icon", width: 137, height: 135 },
  stacked: { name: "logo", width: 415, height: 290 },
  long: { name: "logo_long", width: 826, height: 290 },
} as const;

export const brandIconUrls = {
  primary: "/assets/brand/icon_primary.svg",
  light: "/assets/brand/icon_light.svg",
} as const;

type BrandLogoProps = {
  variant: keyof typeof brandAssets;
  /** Set the height (e.g. `h-8`); width follows the logo's aspect ratio. */
  className?: string;
};

export function BrandLogo({ variant, className }: BrandLogoProps) {
  const asset = brandAssets[variant];
  const imageProps = { width: asset.width, height: asset.height, className: "h-full w-auto" };

  return (
    <span className={cn("inline-flex shrink-0", className)}>
      <Image
        {...imageProps}
        alt="GEOGES"
        className={cn(imageProps.className, "dark:hidden")}
        src={`/assets/brand/${asset.name}_primary.svg`}
      />
      <Image
        {...imageProps}
        alt=""
        aria-hidden="true"
        className={cn(imageProps.className, "hidden dark:block")}
        src={`/assets/brand/${asset.name}_light.svg`}
      />
    </span>
  );
}
