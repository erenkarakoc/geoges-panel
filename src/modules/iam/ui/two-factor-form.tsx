"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogPopup,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { OTPField, OTPFieldInput, OTPFieldSeparator } from "@/components/ui/otp-field";
import {
  disableTwoFactorAction,
  startTwoFactorEnrollmentAction,
  verifyTwoFactorAction,
} from "@/modules/iam/application/auth-actions";
import {
  initialAuthFormState,
  initialTwoFactorEnrollmentState,
  initialTwoFactorRemovalState,
} from "@/modules/iam/application/auth-form-state";
import { todayRoute } from "@/modules/iam/application/auth-routing";
import { AuthFormHeader } from "@/modules/iam/ui/auth-form-header";
import { useAuthFormImpulse } from "@/modules/iam/ui/use-auth-form-impulse";
import { useActionToast } from "@/platform/ui/feedback/use-action-toast";

const codeLength = 6;

const copy = {
  verify: {
    title: "Kimliğinizi doğrulayın",
    description: "Doğrulama uygulamanızdaki 6 haneli kodu girin.",
  },
  setup: {
    title: "İki adımlı doğrulamayı kurun",
    description: "Hesabınızı doğrulama uygulamasıyla koruyun. Kurulum tek seferliktir.",
  },
  manage: {
    title: "İki adımlı doğrulama açık",
    description: "Girişlerinizde parolanıza ek olarak doğrulama uygulamasındaki kod isteniyor.",
  },
} as const;

/**
 * TOTP screen (D-043). `verify` asks an enrolled user for the current code, `setup` shows the QR
 * code and verifies the first code from it, `manage` lets a fully verified session remove it.
 */
export function TwoFactorForm({ mode }: { mode: keyof typeof copy }) {
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
        description={copy[mode].description}
        eyebrow="İki adımlı doğrulama"
        title={copy[mode].title}
      />

      {mode === "manage" ? <TwoFactorRemoval /> : null}

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

function TwoFactorRemoval() {
  const [state, formAction, pending] = useActionState(
    disableTwoFactorAction,
    initialTwoFactorRemovalState,
  );
  const [confirmRequested, setConfirmRequested] = useState(false);
  // Derived, not synced in an effect: the removal result closes the dialog on its own.
  const open = confirmRequested && !state.removed;

  useActionToast(
    state,
    state.error
      ? { type: "error", title: state.error }
      : state.removed
        ? {
            type: "success",
            title: "İki adımlı doğrulama kapatıldı",
            description: "Hesabınız artık yalnızca parolayla korunuyor.",
          }
        : null,
  );

  return (
    <>
      <div className="mt-8 flex flex-col gap-4 rounded-lg border border-border/70 bg-background/40 p-4">
        <p className="text-sm text-muted-foreground">
          Kaldırırsanız hesabınız yalnızca parolayla korunur. Dilediğiniz zaman yeniden
          kurabilirsiniz.
        </p>
        <AlertDialog onOpenChange={setConfirmRequested} open={open}>
          <AlertDialogTrigger render={<Button className="w-fit" variant="destructive-outline" />}>
            İki adımlı doğrulamayı kaldır
          </AlertDialogTrigger>
          <AlertDialogPopup>
            <AlertDialogHeader>
              <AlertDialogTitle>İki adımlı doğrulama kaldırılsın mı?</AlertDialogTitle>
              <AlertDialogDescription>
                Bu işlem hesabınızın korumasını düşürür. Bundan sonra girişte yalnızca parolanız
                istenir.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogClose render={<Button variant="outline" />}>Vazgeç</AlertDialogClose>
              <Form action={formAction}>
                <Button loading={pending} type="submit" variant="destructive">
                  Kaldır
                </Button>
              </Form>
            </AlertDialogFooter>
          </AlertDialogPopup>
        </AlertDialog>
      </div>

      <Button className="mt-6" render={<Link href={todayRoute} />} variant="ghost">
        Panele dön
      </Button>
    </>
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
          className="size-36 rounded-md bg-(--brand-light) p-2"
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
          {/* The sixth digit submits by itself (owner's request 2026-09-22); the button stays
              for anyone who fills the code by other means. */}
          <OTPField
            autoSubmit
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

        {/* Never disabled by the browser's state: a page whose scripts have not started yet
            would leave a dead button, and the server checks the code anyway. */}
        <Button className="mt-2" loading={pending} size="lg" type="submit">
          Doğrula ve devam et
        </Button>
      </Form>
    </>
  );
}
