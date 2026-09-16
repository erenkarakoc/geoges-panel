import { redirect } from "next/navigation";

import { resolveProtectedPageRedirect } from "@/modules/iam/application/auth-routing";
import { readAuthSession } from "@/modules/iam/application/auth-session";
import { UserMenu } from "@/modules/iam/ui/user-menu";
import { previewAccessPolicy } from "@/platform/access/access-policy";
import { AppShell } from "@/platform/ui/app-shell/app-shell";

// M0: preview access policy; real roles and permissions come from IAM (Phase 04).
export default async function AppLayout({ children }: LayoutProps<"/">) {
  const session = await readAuthSession();
  const redirectTo = resolveProtectedPageRedirect(session);

  if (redirectTo || !session) {
    redirect(redirectTo ?? "/sign-in");
  }

  return (
    <AppShell access={previewAccessPolicy} headerActions={<UserMenu email={session.user.email} />}>
      {children}
    </AppShell>
  );
}
