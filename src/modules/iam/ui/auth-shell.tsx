"use client";

import { createContext, type ReactNode, type RefObject, useContext, useRef } from "react";

import { AuthSplitLayout } from "@/platform/ui/auth/auth-split-layout";
import { ParticleField } from "@/platform/ui/auth/particle-field";
import { BrandLogo, brandStackedLogoUrl } from "@/platform/ui/brand/brand-logo";

const TypingImpulseContext = createContext<RefObject<number> | null>(null);

/** Energy the auth forms feed into the particle figure while the visitor types. */
export function useAuthTypingImpulse(): RefObject<number> {
  const impulseRef = useContext(TypingImpulseContext);

  if (!impulseRef) {
    throw new Error("useAuthTypingImpulse must be used inside <AuthShell>");
  }

  return impulseRef;
}

/** Chrome shared by every auth screen; the form column is the page's own content. */
export function AuthShell({ children }: { children: ReactNode }) {
  const typingImpulseRef = useRef(0);

  return (
    <TypingImpulseContext.Provider value={typingImpulseRef}>
      <AuthSplitLayout
        decoration={
          <>
            <ParticleField src={brandStackedLogoUrl} typingImpulseRef={typingImpulseRef} />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(900px 600px at 50% 50%, transparent 45%, color-mix(in srgb, var(--background) 88%, transparent) 92%)",
              }}
            />
            <div className="pointer-events-none absolute inset-0 flex max-w-md flex-col justify-between p-12">
              <BrandLogo className="h-12 w-fit" variant="long" />
              <p className="mt-6 font-heading text-xl leading-snug md:text-2xl">
                Kurum içi iş, süreç ve organizasyon paneli.
              </p>
            </div>
          </>
        }
      >
        <div className="absolute top-6 left-6 lg:hidden">
          <BrandLogo className="h-7" variant="long" />
        </div>
        {children}
      </AuthSplitLayout>
    </TypingImpulseContext.Provider>
  );
}
