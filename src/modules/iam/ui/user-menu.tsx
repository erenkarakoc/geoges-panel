"use client";

import {
  CompassIcon,
  LogOutIcon,
  NetworkIcon,
  ShieldCheckIcon,
  UserIcon,
  UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition, type ReactNode } from "react";

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
import {
  onboardingRoute,
  todayRoute,
  twoFactorRoute,
} from "@/modules/iam/application/auth-routing";
import { type PreviewRoleId, rememberPreviewRole } from "@/platform/access/preview-roles";
import { ThemeMenuItem } from "@/platform/ui/theme/theme-toggle";

type RoleSwitcher = {
  currentRoleId: PreviewRoleId;
  roles: readonly { id: PreviewRoleId; label: string }[];
};

/**
 * Top-bar account menu (§40.3). Roles and profile land here once IAM is designed.
 * `roleSwitcher` is passed only in development (D-061): it views the shell from a sample seat.
 *
 * `deviceSwitch` is whatever this device can be told to do — today the phone-notification switch,
 * which belongs to TSK. It arrives as a node from the layout rather than as an import, because
 * TSK already reads IAM and the reverse arrow would be a cycle (MODULE_MAP). The light/dark switch
 * sits beside it: the owner had it taken out of the header on 2026-09-24 (D-275), and it belongs in
 * the same group because both are settings of this browser rather than of the account.
 */
export function UserMenu({
  email,
  roleSwitcher,
  deviceSwitch,
}: {
  email: string | null;
  roleSwitcher?: RoleSwitcher;
  deviceSwitch?: ReactNode;
}) {
  const router = useRouter();
  const [signingOut, startSignOut] = useTransition();

  const switchRole = (roleId: PreviewRoleId) => {
    rememberPreviewRole(roleId);
    // Every seat starts on "Bugün" (D-056); the refresh re-renders the shell for the new seat.
    router.push(todayRoute);
    router.refresh();
  };

  return (
    <Menu>
      <MenuTrigger
        render={
          <Button
            aria-label="Hesap menüsü"
            className="size-11 md:size-9"
            size="icon"
            variant="ghost"
          />
        }
      >
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
            <MenuLinkItem render={<Link href="/presentation" />}>
              <NetworkIcon aria-hidden="true" />
              Yapı sunumu
            </MenuLinkItem>
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
        <MenuGroup>
          <MenuGroupLabel>Bu cihaz</MenuGroupLabel>
          <ThemeMenuItem />
          {/* The push switch is not a menu item: it carries its own state and must not close the
              menu when it is pressed. The menu is simply where it lives now (owner 2026-09-24). */}
          {deviceSwitch ? <div className="px-2 py-1.5">{deviceSwitch}</div> : null}
        </MenuGroup>
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
