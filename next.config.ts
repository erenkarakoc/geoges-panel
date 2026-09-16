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
};

export default nextConfig;
