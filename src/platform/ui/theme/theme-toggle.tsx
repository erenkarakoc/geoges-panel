"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { MenuItem } from "@/components/ui/menu";

/**
 * Switches straight between light and dark on click (owner request 2026-09-16).
 * The icons are swapped with the `dark:` variant rather than from state, so the button renders
 * the same on the server and the client.
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Button
      aria-label="Açık ve koyu görünüm arasında geçiş yap"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="size-11 md:size-9"
      size="icon"
      type="button"
      variant="ghost"
    >
      <SunIcon aria-hidden="true" className="hidden dark:block" />
      <MoonIcon aria-hidden="true" className="dark:hidden" />
    </Button>
  );
}

/**
 * The same switch as a line in the account menu, which is where the panel keeps it (owner
 * 2026-09-24, D-275); the standalone button above stays for the sign-in screens, which have no
 * account menu. The menu is left open, so the person sees the change they just asked for.
 *
 * Which way round it reads is decided by CSS, not by state, for the reason the button gives: the
 * server does not know this browser's theme, and rendering a label from `resolvedTheme` would
 * differ between the server's HTML and the first client render.
 */
export function ThemeMenuItem() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <MenuItem
      closeOnClick={false}
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <SunIcon aria-hidden="true" className="hidden dark:block" />
      <MoonIcon aria-hidden="true" className="dark:hidden" />
      <span className="hidden dark:inline">Açık görünüme geç</span>
      <span className="dark:hidden">Koyu görünüme geç</span>
    </MenuItem>
  );
}
