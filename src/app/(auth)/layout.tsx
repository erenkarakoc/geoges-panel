import { BrandFooter } from "@/platform/ui/brand/brand-footer";
import { BrandLogo } from "@/platform/ui/brand/brand-logo";
import { ThemeToggle } from "@/platform/ui/theme/theme-toggle";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-svh flex-1 flex-col bg-sidebar">
      <header className="flex h-16 items-center justify-between px-4 md:px-6">
        <BrandLogo className="h-8" variant="long" />
        <ThemeToggle />
      </header>
      <main className="flex flex-1 items-center justify-center px-4 pb-10">{children}</main>
      <BrandFooter />
    </div>
  );
}
