import type { ReactNode } from "react";

/** Eyebrow + heading + description block that opens every auth screen. */
export function AuthFormHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: ReactNode;
}) {
  return (
    <>
      <p className="font-mono text-[11px] tracking-[0.3em] text-muted-foreground uppercase">
        {eyebrow}
      </p>
      <h1 className="mt-2 font-heading text-3xl leading-tight">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </>
  );
}
