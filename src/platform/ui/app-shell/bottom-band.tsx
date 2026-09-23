"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

/**
 * The app card's functional bottom band (TASK-0028, D-228, D-269; `docs/ui-ux/SCREEN_PATTERNS.md`
 * section 4).
 *
 * A screen writes its band where its own state is — the form it belongs to, the selection it
 * counts — and the content is carried into the shell's slot by a portal. A parallel route slot
 * like `@context` could not do this: a band often says something only the screen knows, such as
 * how many rows are selected or which step of a form the person is on.
 *
 * The band lies over the scrolling content and is always visible while it scrolls (the owner's
 * direction, D-228). Its height is measured and given to the card as `--bottom-band-height`, and
 * the scrolling area uses that for both its bottom padding and its scroll padding, so nothing is
 * covered and a focused element never ends up underneath it (`docs/ui-ux/ACCESSIBILITY.md`).
 *
 * The band decides nothing about permissions: a screen renders only the actions its own check
 * allows, and a screen with no action renders no band at all.
 */

type BandActions = {
  register: (node: HTMLElement | null) => void;
  fill: (on: boolean) => void;
};

const ActionsContext = createContext<BandActions | null>(null);
const StateContext = createContext<{ outlet: HTMLElement | null; shown: boolean }>({
  outlet: null,
  shown: false,
});

export function BottomBandProvider({ children }: { children: ReactNode }) {
  const [outlet, setOutlet] = useState<HTMLElement | null>(null);
  // Counted rather than a flag: React mounts an effect twice in development, and a screen may
  // swap one band for another, so "one more, one fewer" survives both without flickering.
  const [bands, setBands] = useState(0);
  const actions = useMemo<BandActions>(
    () => ({
      register: setOutlet,
      fill: (on) => setBands((open) => Math.max(0, open + (on ? 1 : -1))),
    }),
    [],
  );
  const state = useMemo(() => ({ outlet, shown: bands > 0 }), [outlet, bands]);

  return (
    <ActionsContext.Provider value={actions}>
      <StateContext.Provider value={state}>{children}</StateContext.Provider>
    </ActionsContext.Provider>
  );
}

/** True while a screen shows a band; the phone's navigation steps aside for it (D-228). */
export function useBottomBandShown() {
  return useContext(StateContext).shown;
}

/** The shell's slot at the bottom of the app card. Empty, it takes no space and draws nothing. */
export function BottomBandOutlet() {
  const actions = useContext(ActionsContext);
  const shown = useBottomBandShown();
  const [node, setNode] = useState<HTMLElement | null>(null);

  useEffect(() => {
    actions?.register(node);
    return () => actions?.register(null);
  }, [actions, node]);

  useEffect(() => {
    const card = node?.parentElement;
    if (!node || !card) return;
    const write = () =>
      card.style.setProperty("--bottom-band-height", `${Math.round(node.offsetHeight)}px`);
    write();
    // Actions wrap onto a second line on a phone, and a band can be replaced by a taller one.
    const observer = new ResizeObserver(write);
    observer.observe(node);
    return () => {
      observer.disconnect();
      card.style.removeProperty("--bottom-band-height");
    };
  }, [node, shown]);

  return (
    <div
      className={[
        "absolute inset-x-0 bottom-0 z-20 border-t bg-background px-4 py-3 md:px-6",
        // Clear of the home indicator, the same rule the phone's navigation follows.
        "pb-[max(0.75rem,env(safe-area-inset-bottom))] md:pb-3",
        shown ? "" : "hidden",
      ].join(" ")}
      ref={setNode}
    />
  );
}

/**
 * A screen's band. `info` is what the band says on the left — how many rows are selected, how
 * many fields are missing, which step this is — and the children are its actions, which sit on
 * the right with the primary one last (SCREEN_PATTERNS section 4).
 */
export function BottomBand({ children, info }: { children: ReactNode; info?: ReactNode }) {
  const actions = useContext(ActionsContext);
  const { outlet } = useContext(StateContext);
  useEffect(() => {
    actions?.fill(true);
    return () => actions?.fill(false);
  }, [actions]);

  // Outside the shell there is no slot to portal into, and a screen that silently lost its only
  // way to submit would be far worse than actions in the wrong place: they are drawn where they
  // stand. Inside the shell the slot is simply not known during the first render, as with any
  // portal, and the band appears on the next one.
  if (!actions) return <div className="flex flex-wrap items-center gap-2">{children}</div>;
  if (!outlet) return null;
  return createPortal(
    <div className="flex items-center justify-between gap-3">
      {info ? <div className="min-w-0 text-sm text-muted-foreground">{info}</div> : null}
      <div className="ms-auto flex shrink-0 flex-wrap items-center justify-end gap-2">
        {children}
      </div>
    </div>,
    outlet,
  );
}
