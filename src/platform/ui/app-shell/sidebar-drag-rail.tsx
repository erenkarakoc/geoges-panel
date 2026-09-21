"use client";

import { type PointerEvent, useRef } from "react";

import { SidebarRail, useSidebar } from "@/components/ui/sidebar";

/** Horizontal drag distance (px) that collapses or expands the sidebar. */
const DRAG_THRESHOLD = 32;

/**
 * COSS SidebarRail toggles the sidebar on click only. Owner request (2026-09-16): dragging the
 * rail left collapses and dragging right expands; a plain click still toggles.
 * Deviation from COSS defaults — see docs/ui-ux/DESIGN_SYSTEM_RULES.md §4.1.
 */
export function SidebarDragRail() {
  const { open, setOpen, toggleSidebar } = useSidebar();
  const dragStartX = useRef<number | null>(null);
  const didDrag = useRef(false);

  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    dragStartX.current = event.clientX;
    didDrag.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    if (dragStartX.current === null) {
      return;
    }
    const distance = event.clientX - dragStartX.current;
    if (open && distance <= -DRAG_THRESHOLD) {
      setOpen(false);
      didDrag.current = true;
      dragStartX.current = event.clientX;
    } else if (!open && distance >= DRAG_THRESHOLD) {
      setOpen(true);
      didDrag.current = true;
      dragStartX.current = event.clientX;
    } else if (Math.abs(distance) > 4) {
      didDrag.current = true;
    }
  };

  const handlePointerEnd = (event: PointerEvent<HTMLButtonElement>) => {
    dragStartX.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <SidebarRail
      // COSS names the rail "Toggle Sidebar"; its props come last, so the Turkish name wins
      // without touching the COSS file (ADR-011, TASK-0054). Same wording as the header button.
      aria-label="Menüyü aç veya kapat"
      className="touch-none"
      title="Menüyü aç veya kapat"
      onClick={() => {
        // A drag ends with a click event; only a real click toggles.
        if (!didDrag.current) {
          toggleSidebar();
        }
        didDrag.current = false;
      }}
      onPointerCancel={handlePointerEnd}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
    />
  );
}
