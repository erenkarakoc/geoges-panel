"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toastManager } from "@/components/ui/toast";
import { requestPasswordResetAction } from "@/modules/iam/application/auth-actions";
import { initialPasswordResetState } from "@/modules/iam/application/auth-form-state";
import { AuthFormHeader } from "@/modules/iam/ui/auth-form-header";
import { useAuthFormImpulse } from "@/modules/iam/ui/use-auth-form-impulse";
import { useActionToast } from "@/platform/ui/feedback/use-action-toast";

export function ResetPasswordForm({ linkExpired = false }: { linkExpired?: boolean }) {
  const [state, formAction, pending] = useActionState(
    requestPasswordResetAction,
    initialPasswordResetState,
  );
  const impulse = useAuthFormImpulse();

  useActionToast(
    state,
    state.error
      ? { type: "error", title: state.error }
      : state.sentTo
        ? {
            type: "success",
            title: "Bağlantı gönderildi",
            description: `${state.sentTo} adresine parola belirleme bağlantısı gönderildi. Gelen kutunuzu kontrol edin.`,
          }
        : null,
  );

  // The visitor arrives here from `/auth/confirm` when the e-mail link is no longer valid.
  useEffect(() => {
    if (linkExpired) {
      toastManager.add({
        type: "error",
        title: "Bağlantının süresi dolmuş",
        description: "Yeni bir parola sıfırlama bağlantısı isteyin.",
      });
    }
  }, [linkExpired]);

  return (
    <div className="w-full max-w-lg">
      <AuthFormHeader
        description="Hesabınızın e-posta adresini girin, parola belirleme bağlantısını gönderelim."
        eyebrow="Parola sıfırlama"
        title="Parolanızı mı unuttunuz?"
      />

      <Form action={formAction} className="mt-8 flex flex-col gap-4" {...impulse}>
        <Field>
          <FieldLabel htmlFor="email">E-posta</FieldLabel>
          <Input
            autoComplete="email"
            defaultValue={state.sentTo ?? undefined}
            id="email"
            name="email"
            placeholder="eposta@geoges.com"
            required
            type="email"
          />
        </Field>

        <Button className="mt-2" loading={pending} size="lg" type="submit">
          Sıfırlama bağlantısı gönder
        </Button>
      </Form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link
          className="underline-offset-4 transition-colors hover:text-foreground hover:underline"
          href="/sign-in"
        >
          Giriş ekranına dön
        </Link>
      </p>
    </div>
  );
}
