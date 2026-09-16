"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { OTPField, OTPFieldInput, OTPFieldSeparator } from "@/components/ui/otp-field";
import {
  startTwoFactorEnrollmentAction,
  verifyTwoFactorAction,
} from "@/modules/iam/application/auth-actions";
import {
  initialAuthFormState,
  initialTwoFactorEnrollmentState,
} from "@/modules/iam/application/auth-form-state";
import { AuthFormHeader } from "@/modules/iam/ui/auth-form-header";
import { useAuthFormImpulse } from "@/modules/iam/ui/use-auth-form-impulse";
import { useActionToast } from "@/platform/ui/feedback/use-action-toast";

const codeLength = 6;

/**
 * TOTP step (D-043). `verify` asks an enrolled user for the current code; `setup` first shows the
 * QR code for an authenticator app and then verifies the first code from it.
 */
export function TwoFactorForm({ mode }: { mode: "verify" | "setup" }) {
  const [enrollState, enrollAction, enrolling] = useActionState(
    startTwoFactorEnrollmentAction,
    initialTwoFactorEnrollmentState,
  );

  const enrollment = enrollState.enrollment;
  const showCodeEntry = mode === "verify" || enrollment !== null;

  useActionToast(
    enrollState,
    enrollState.error ? { type: "error", title: enrollState.error } : null,
  );

  return (
    <div className="w-full max-w-lg">
      <AuthFormHeader
        description={
          mode === "verify"
            ? "Doğrulama uygulamanızdaki 6 haneli kodu girin."
            : "Hesabınızı doğrulama uygulamasıyla koruyun. Kurulum tek seferliktir."
        }
        eyebrow="İki adımlı doğrulama"
        title={mode === "verify" ? "Kimliğinizi doğrulayın" : "İki adımlı doğrulamayı kurun"}
      />

      {mode === "setup" && !enrollment ? (
        <Form action={enrollAction} className="mt-8">
          <Button loading={enrolling} size="lg" type="submit">
            Kurulumu başlat
          </Button>
        </Form>
      ) : null}

      {enrollment ? (
        <EnrollmentInstructions secret={enrollment.secret} qrCode={enrollment.qrCode} />
      ) : null}

      {showCodeEntry ? <CodeEntryForm /> : null}
    </div>
  );
}

function EnrollmentInstructions({ qrCode, secret }: { qrCode: string; secret: string }) {
  return (
    <div className="mt-8 flex flex-col gap-4 rounded-lg border border-border/70 bg-background/40 p-4">
      <p className="text-sm text-muted-foreground">
        Google Authenticator, Microsoft Authenticator veya benzeri bir uygulamada karekodu okutun.
      </p>
      <div className="flex items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element -- inline data URL from Supabase, nothing to optimize */}
        <img
          alt="İki adımlı doğrulama karekodu"
          className="size-36 rounded-md bg-white p-2"
          src={qrCode}
        />
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">
            Karekodu okutamıyorsanız bu anahtarı elle girin:
          </p>
          <p className="mt-1 font-mono text-sm break-all">{secret}</p>
        </div>
      </div>
    </div>
  );
}

function CodeEntryForm() {
  const [state, formAction, pending] = useActionState(verifyTwoFactorAction, initialAuthFormState);
  const [code, setCode] = useState("");
  const impulse = useAuthFormImpulse();

  useActionToast(state, state.error ? { type: "error", title: state.error } : null);

  return (
    <>
      <Form action={formAction} className="mt-8 flex flex-col gap-4" {...impulse}>
        <div className="flex flex-col gap-2">
          <Label htmlFor="two-factor-code">Doğrulama kodu</Label>
          <OTPField
            id="two-factor-code"
            length={codeLength}
            name="code"
            onValueChange={setCode}
            value={code}
          >
            <OTPFieldInput aria-label="1. hane" />
            <OTPFieldInput aria-label="2. hane" />
            <OTPFieldInput aria-label="3. hane" />
            <OTPFieldSeparator />
            <OTPFieldInput aria-label="4. hane" />
            <OTPFieldInput aria-label="5. hane" />
            <OTPFieldInput aria-label="6. hane" />
          </OTPField>
        </div>

        <Button
          className="mt-2"
          disabled={code.length < codeLength}
          loading={pending}
          size="lg"
          type="submit"
        >
          Doğrula ve devam et
        </Button>
      </Form>
    </>
  );
}
