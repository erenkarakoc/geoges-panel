import type { MetadataRoute } from "next";

// Internal company system: disallow all crawling (ADR-012).
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow: "/",
    },
  };
}
