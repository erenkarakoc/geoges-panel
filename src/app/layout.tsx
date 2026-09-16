import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";
import "@/platform/ui/theme/brand.css";
import { ToastProvider } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { brandIconUrls } from "@/platform/ui/brand/brand-logo";
import { ThemeProvider } from "@/platform/ui/theme/theme-provider";

// Owner choice: Geist everywhere (COSS default is Inter). latin-ext is required for Turkish
// characters (ğ, ş, ı, İ). Variable names follow the COSS font contract.
const geist = Geist({ subsets: ["latin", "latin-ext"], variable: "--font-sans" });
const geistHeading = Geist({ subsets: ["latin", "latin-ext"], variable: "--font-heading" });
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
        geist.variable,
        geistHeading.variable,
        geistMono.variable,
      )}
      lang="tr"
      suppressHydrationWarning
    >
      <body className="relative flex min-h-full flex-col font-sans">
        <ThemeProvider>
          {/* Errors, warnings and success messages are reported here, never inside a form (§13). */}
          <ToastProvider>
            <div className="isolate flex min-h-full flex-1 flex-col">{children}</div>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
