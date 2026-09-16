"use client";

import { SunMoonIcon } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
  Menu,
  MenuGroup,
  MenuGroupLabel,
  MenuPopup,
  MenuRadioGroup,
  MenuRadioItem,
  MenuTrigger,
} from "@/components/ui/menu";

const themeOptions = [
  { value: "light", label: "Açık" },
  { value: "dark", label: "Koyu" },
  { value: "system", label: "Sistem" },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Menu>
      <MenuTrigger render={<Button aria-label="Görünümü değiştir" size="icon" variant="ghost" />}>
        <SunMoonIcon aria-hidden="true" />
      </MenuTrigger>
      <MenuPopup align="end">
        <MenuGroup>
          <MenuGroupLabel>Görünüm</MenuGroupLabel>
          <MenuRadioGroup onValueChange={(value) => setTheme(String(value))} value={theme}>
            {themeOptions.map((option) => (
              <MenuRadioItem key={option.value} value={option.value}>
                {option.label}
              </MenuRadioItem>
            ))}
          </MenuRadioGroup>
        </MenuGroup>
      </MenuPopup>
    </Menu>
  );
}
