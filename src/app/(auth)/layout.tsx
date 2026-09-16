import { ThemeToggle } from "@/platform/ui/theme/theme-toggle";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-svh flex-1 flex-col bg-sidebar">
      <header className="flex h-14 items-center justify-between px-4 md:px-6">
        <span className="font-heading font-semibold text-primary">GEOGES Panel</span>
        <ThemeToggle />
      </header>
      <main className="flex flex-1 items-center justify-center px-4 pb-10">{children}</main>
    </div>
  );
}
