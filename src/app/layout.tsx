import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";

import "./globals.css";
import "@/platform/ui/theme/brand.css";
import { cn } from "@/lib/utils";
import { brandIconUrls } from "@/platform/ui/brand/brand-logo";
import { ThemeProvider } from "@/platform/ui/theme/theme-provider";

// latin-ext is required for Turkish characters (ğ, ş, ı, İ).
const inter = Inter({ subsets: ["latin", "latin-ext"], variable: "--font-sans" });
const interHeading = Inter({ subsets: ["latin", "latin-ext"], variable: "--font-heading" });
const geistMono = Geist_Mono({ subsets: ["latin", "latin-ext"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: {
    default: "GEOGES Panel",
    template: "%s · GEOGES Panel",
  },
  description: "GEOGES şirket yönetim paneli",
  robots: { index: false, follow: false },
  // Brand icon from public/assets/brand; light variant for dark browser themes.
  icons: {
    icon: [
      { url: brandIconUrls.primary, type: "image/svg+xml" },
      { url: brandIconUrls.light, type: "image/svg+xml", media: "(prefers-color-scheme: dark)" },
    ],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      className={cn(
        "h-full antialiased",
        inter.variable,
        interHeading.variable,
        geistMono.variable,
      )}
      lang="tr"
      suppressHydrationWarning
    >
      <body className="relative flex min-h-full flex-col font-sans">
        <ThemeProvider>
          <div className="isolate flex min-h-full flex-1 flex-col">{children}</div>
        </ThemeProvider>
      </body>
    </html>
  );
}
