import { previewAccessPolicy } from "@/platform/access/access-policy";
import { AppShell } from "@/platform/ui/app-shell/app-shell";

// M0: preview access policy; replaced by the IAM policy with real sessions (TASK-0025).
export default function AppLayout({ children }: LayoutProps<"/">) {
  return <AppShell access={previewAccessPolicy}>{children}</AppShell>;
}
