import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Text recognition and PDF reading load native code, WebAssembly and model files at run time
  // from node_modules; bundling them would break those paths (TASK-0107).
  serverExternalPackages: [
    "tesseract.js",
    "pdfjs-dist",
    "@napi-rs/canvas",
    "@tesseract.js-data/tur",
    "@tesseract.js-data/eng",
  ],
  // The entry screen is "Bugün" (Today Screen) in the glossary; its old address keeps working (TASK-0043).
  async redirects() {
    return [{ source: "/dashboard", destination: "/today", permanent: true }];
  },
  // Development only: the panel is tried from a phone on the office network, so the dev server
  // must accept its own local address as an origin. Without this Next answers 403 to every
  // request that carries an `Origin` header (the hot-reload channel and server actions), and the
  // screen behaves as if it had no scripts. Private ranges only; production is unaffected.
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "172.16.*.*", "172.17.*.*"],
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
