import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The panel is an internal company system and must never be indexed (ADR-012).
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
  turbopack: {
    rules: {
      // `import Logo from "./logo.svg?svgr"` renders the SVG inline as a React component.
      // The brand blue fill becomes currentColor so the logo follows the theme.
      "*": {
        condition: {
          all: [{ not: "foreign" }, { path: "*.svg" }, { query: /[?&]svgr(?=&|$)/ }],
        },
        loaders: [
          {
            loader: "@svgr/webpack",
            options: {
              dimensions: false,
              replaceAttrValues: { "#0F4C81": "currentColor", "#0f4c81": "currentColor" },
            },
          },
        ],
        as: "*.js",
      },
    },
  },
};

export default nextConfig;
