"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { signInAction } from "@/modules/iam/application/auth-actions";
import { initialSignInState } from "@/modules/iam/application/auth-form-state";
import { AuthFormHeader } from "@/modules/iam/ui/auth-form-header";
import { useAuthFormImpulse } from "@/modules/iam/ui/use-auth-form-impulse";
import { useActionToast } from "@/platform/ui/feedback/use-action-toast";

export function SignInForm() {
  const [state, formAction, pending] = useActionState(signInAction, initialSignInState);
  const impulse = useAuthFormImpulse();

  useActionToast(state, state.error ? { type: "error", title: state.error } : null);

  return (
    <div className="w-full max-w-lg">
      <AuthFormHeader
        description="E-posta adresinizi ve parolanızı girin."
        eyebrow="Hoş geldiniz"
        title="Giriş yapın"
      />

      <Form action={formAction} className="mt-8 flex flex-col gap-4" {...impulse}>
        <Field>
          <FieldLabel htmlFor="email">E-posta</FieldLabel>
          <Input
            autoComplete="email"
            defaultValue={state.email}
            id="email"
            key={state.email}
            name="email"
            placeholder="eposta@geoges.com"
            required
            type="email"
          />
        </Field>

        <Field>
          <div className="flex w-full items-center justify-between gap-2">
            <FieldLabel htmlFor="password">Parola</FieldLabel>
            <Link
              className="text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
              href="/reset-password"
            >
              Parolamı unuttum
            </Link>
          </div>
          <Input
            autoComplete="current-password"
            id="password"
            name="password"
            required
            type="password"
          />
        </Field>

        <Button className="mt-2" loading={pending} size="lg" type="submit">
          Giriş yap
        </Button>
      </Form>
    </div>
  );
}
