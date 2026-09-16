"use client";

import { CompassIcon, LogOutIcon, ShieldCheckIcon, UserIcon } from "lucide-react";
import Link from "next/link";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  Menu,
  MenuGroup,
  MenuGroupLabel,
  MenuItem,
  MenuLinkItem,
  MenuPopup,
  MenuSeparator,
  MenuTrigger,
} from "@/components/ui/menu";
import { signOutAction } from "@/modules/iam/application/auth-actions";
import { onboardingRoute, twoFactorRoute } from "@/modules/iam/application/auth-routing";

/** Top-bar account menu (§40.3). Roles and profile land here once IAM is designed. */
export function UserMenu({ email }: { email: string | null }) {
  const [signingOut, startSignOut] = useTransition();

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
