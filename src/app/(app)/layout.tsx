import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  readAccountFacts,
  readAuthSession,
  readPanelSession,
  resolveProtectedPageRedirect,
} from "@/modules/iam";
import { UserMenu } from "@/modules/iam/ui/user-menu";
import { NotificationBell } from "@/modules/tsk/ui/notification-bell";
import { PushToggle } from "@/modules/tsk/ui/push-toggle";
import {
  createPreviewRolePolicy,
  PREVIEW_ROLE_COOKIE,
  previewRoles,
  resolvePreviewRole,
} from "@/platform/access/preview-roles";
import { AppShell } from "@/platform/ui/app-shell/app-shell";

// Pre-IAM: a sample seat decides what the shell shows. Only development may switch seats (D-061);
// every other environment renders the owner seat, which sees everything. Real roles and
// permissions come from IAM (Phase 04).
const roleSwitchingAllowed = process.env.NODE_ENV === "development";

export default async function AppLayout({ children, context, modal }: LayoutProps<"/">) {
  const session = await readAuthSession();
  // The panel's own session decides how long somebody stays, not the provider's token (D-230).
  const redirectTo = resolveProtectedPageRedirect(
    session,
    await readPanelSession(),
    await readAccountFacts(),
  );

  if (redirectTo || !session) {
    redirect(redirectTo ?? "/sign-in");
  }

  const cookieStore = await cookies();
  const role = resolvePreviewRole(
    cookieStore.get(PREVIEW_ROLE_COOKIE)?.value,
    roleSwitchingAllowed,
  );

  return (
    <AppShell
      access={createPreviewRolePolicy(role)}
      contextBar={context}
      notifications={<NotificationBell />}
      headerActions={
        <UserMenu
          deviceSwitch={<PushToggle />}
          email={session.user.email}
          roleSwitcher={
            roleSwitchingAllowed
              ? {
                  currentRoleId: role.id,
                  roles: previewRoles.map(({ id, label }) => ({ id, label })),
                }
              : undefined
          }
        />
      }
      seat={{
        userId: session.user.id,
        primaryAction: role.primaryAction,
        sites: role.sites,
      }}
    >
      {children}
      {modal}
    </AppShell>
  );
}
