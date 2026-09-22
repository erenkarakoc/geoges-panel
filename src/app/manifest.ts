import type { MetadataRoute } from "next";

/**
 * The panel as an installable app (D-252): on an iPhone, instant notifications work only once
 * the panel sits on the Home Screen, and the browser reads this file when adding it. It is a
 * company panel, so it is never indexed and starts on the entry screen.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "GEOGES Panel",
    short_name: "GEOGES",
    description: "GEOGES şirket yönetim paneli",
    lang: "tr",
    dir: "ltr",
    start_url: "/today",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#0b0b0c",
    theme_color: "#0f4c81",
    icons: [
      {
        src: "/assets/brand/icon_primary.svg",
        type: "image/svg+xml",
        sizes: "any",
        purpose: "any",
      },
    ],
  };
}
