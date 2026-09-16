// SVG files imported with the `?svgr` query are React components (see next.config.ts).
declare module "*.svg?svgr" {
  import type { FC, SVGProps } from "react";

  const SvgComponent: FC<SVGProps<SVGSVGElement>>;
  export default SvgComponent;
}
