"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { updatePasswordAction } from "@/modules/iam/application/auth-actions";
import { initialAuthFormState } from "@/modules/iam/application/auth-form-state";
import { minimumPasswordLength } from "@/modules/iam/application/auth-schemas";
import { AuthFormHeader } from "@/modules/iam/ui/auth-form-header";
import { useAuthFormImpulse } from "@/modules/iam/ui/use-auth-form-impulse";
import { useActionToast } from "@/platform/ui/feedback/use-action-toast";

export function UpdatePasswordForm() {
  const [state, formAction, pending] = useActionState(updatePasswordAction, initialAuthFormState);
  const impulse = useAuthFormImpulse();

  useActionToast(state, state.error ? { type: "error", title: state.error } : null);

  return (
    <div className="w-full max-w-lg">
      <AuthFormHeader
        description="Bundan sonra bu parolayla giriş yapacaksınız."
        eyebrow="Yeni parola"
        title="Yeni parolanızı belirleyin"
      />

      <Form action={formAction} className="mt-8 flex flex-col gap-4" {...impulse}>
        <Field>
          <FieldLabel htmlFor="password">Yeni parola</FieldLabel>
          <Input
            autoComplete="new-password"
            id="password"
            minLength={minimumPasswordLength}
            name="password"
            required
            type="password"
          />
          <FieldDescription>En az {minimumPasswordLength} karakter.</FieldDescription>
        </Field>

        <Field>
          <FieldLabel htmlFor="passwordConfirmation">Yeni parola (tekrar)</FieldLabel>
          <Input
            autoComplete="new-password"
            id="passwordConfirmation"
            name="passwordConfirmation"
            required
            type="password"
          />
        </Field>

        <Button className="mt-2" loading={pending} size="lg" type="submit">
          Parolayı kaydet
        </Button>
      </Form>
    </div>
  );
}
