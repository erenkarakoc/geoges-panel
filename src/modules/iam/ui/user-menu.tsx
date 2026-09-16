"use client";

import {
  CompassIcon,
  LayoutPanelLeftIcon,
  LogOutIcon,
  NetworkIcon,
  ShieldCheckIcon,
  UserIcon,
  UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  Menu,
  MenuGroup,
  MenuGroupLabel,
  MenuItem,
  MenuLinkItem,
  MenuPopup,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuSub,
  MenuSubPopup,
  MenuSubTrigger,
  MenuTrigger,
} from "@/components/ui/menu";
import { signOutAction } from "@/modules/iam/application/auth-actions";
import { onboardingRoute, twoFactorRoute } from "@/modules/iam/application/auth-routing";
import { type PreviewRoleId, rememberPreviewRole } from "@/platform/access/preview-roles";

type RoleSwitcher = {
  currentRoleId: PreviewRoleId;
  roles: readonly { id: PreviewRoleId; label: string }[];
};

/**
 * Top-bar account menu (§40.3). Roles and profile land here once IAM is designed.
 * `roleSwitcher` is passed only in development (D-061): it views the shell from a sample seat.
 */
export function UserMenu({
  email,
  roleSwitcher,
}: {
  email: string | null;
  roleSwitcher?: RoleSwitcher;
}) {
  const router = useRouter();
  const [signingOut, startSignOut] = useTransition();

  const switchRole = (roleId: PreviewRoleId) => {
    rememberPreviewRole(roleId);
    // Every seat starts on "Bugün" (D-056); the refresh re-renders the shell for the new seat.
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <Menu>
      <MenuTrigger render={<Button aria-label="Hesap menüsü" size="icon" variant="ghost" />}>
        <UserIcon aria-hidden="true" />
      </MenuTrigger>
      <MenuPopup align="end">
        <MenuGroup>
          <MenuGroupLabel>{email ?? "Hesabım"}</MenuGroupLabel>
          <MenuLinkItem render={<Link href={twoFactorRoute} />}>
            <ShieldCheckIcon aria-hidden="true" />
            İki adımlı doğrulama
          </MenuLinkItem>
          <MenuLinkItem render={<Link href={onboardingRoute} />}>
            <CompassIcon aria-hidden="true" />
            Rol tanıtımı
          </MenuLinkItem>
          {/* Development-only structure presentation (D-052); hidden in production builds. */}
          {process.env.NODE_ENV === "development" ? (
            <>
              <MenuLinkItem render={<Link href="/presentation" />}>
                <NetworkIcon aria-hidden="true" />
                Yapı sunumu
              </MenuLinkItem>
              <MenuLinkItem render={<Link href="/navigation" />}>
                <LayoutPanelLeftIcon aria-hidden="true" />
                Gezinme prototipi
              </MenuLinkItem>
            </>
          ) : null}
        </MenuGroup>
        {roleSwitcher ? (
          <>
            <MenuSeparator />
            <MenuSub>
              <MenuSubTrigger>
                <UsersIcon aria-hidden="true" />
                Rol olarak görüntüle
              </MenuSubTrigger>
              <MenuSubPopup>
                <MenuGroup>
                  <MenuGroupLabel>Geliştirme · örnek roller</MenuGroupLabel>
                  <MenuRadioGroup
                    onValueChange={(value: PreviewRoleId) => switchRole(value)}
                    value={roleSwitcher.currentRoleId}
                  >
                    {roleSwitcher.roles.map((role) => (
                      <MenuRadioItem key={role.id} value={role.id}>
                        {role.label}
                      </MenuRadioItem>
                    ))}
                  </MenuRadioGroup>
                </MenuGroup>
              </MenuSubPopup>
            </MenuSub>
          </>
        ) : null}
        <MenuSeparator />
        <MenuItem
          closeOnClick={false}
          disabled={signingOut}
          onClick={() => startSignOut(signOutAction)}
        >
          <LogOutIcon aria-hidden="true" />
          Çıkış yap
        </MenuItem>
      </MenuPopup>
    </Menu>
  );
}
