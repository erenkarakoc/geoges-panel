"use client";

import type { KeyboardEvent } from "react";

import { useAuthTypingImpulse } from "@/modules/iam/ui/auth-shell";
import {
  bumpParticleTypingImpulse,
  pulseParticleSubmitImpulse,
} from "@/platform/ui/auth/particle-field";

/** Spreads onto an auth `<Form>` so typing and submitting animate the particle figure. */
export function useAuthFormImpulse(): {
  onKeyDown: (event: KeyboardEvent<HTMLFormElement>) => void;
  onSubmit: () => void;
} {
  const impulseRef = useAuthTypingImpulse();

  return {
    onKeyDown: (event) => bumpParticleTypingImpulse(impulseRef, event),
    onSubmit: () => pulseParticleSubmitImpulse(impulseRef),
  };
}
