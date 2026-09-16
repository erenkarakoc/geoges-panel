import { AuthShell } from "@/modules/iam/ui/auth-shell";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return <AuthShell>{children}</AuthShell>;
}
