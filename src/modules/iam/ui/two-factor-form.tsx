"use client";

import { KeyRoundIcon } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OTPField, OTPFieldInput, OTPFieldSeparator } from "@/components/ui/otp-field";
import {
  disableTwoFactorAction,
  startTwoFactorEnrollmentAction,
  useRecoveryCodeAction,
  verifyTwoFactorAction,
} from "@/modules/iam/application/auth-actions";
import {
  initialAuthFormState,
  initialTwoFactorEnrollmentState,
  initialTwoFactorRemovalState,
  initialTwoFactorVerifyState,
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

      {showCodeEntry ? <CodeEntryForm intent={mode === "verify" ? "verify" : "setup"} /> : null}

      {/* The way in when the phone with the app is gone (D-236). Only on the sign-in step: a
          person who is already past it has nothing to recover. */}
      {mode === "verify" ? <RecoveryCodeForm /> : null}
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

function CodeEntryForm({ intent }: { intent: "setup" | "verify" }) {
  const [state, formAction, pending] = useActionState(
    verifyTwoFactorAction,
    initialTwoFactorVerifyState,
  );
  const [code, setCode] = useState("");
  const impulse = useAuthFormImpulse();

  useActionToast(state, state.error ? { type: "error", title: state.error } : null);

  // A first enrolment answers with the ten codes. They are shown here and nowhere else, ever
  // again (D-236), so the screen stops being a form and becomes the list.
  if (state.recoveryCodes) {
    return <RecoveryCodeList codes={state.recoveryCodes} />;
  }

  return (
    <>
      <Form action={formAction} className="mt-8 flex flex-col gap-4" {...impulse}>
        <input name="intent" type="hidden" value={intent} />
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

/**
 * The ten codes, shown once (D-236). Each one works a single time, and they are the only way in if
 * the phone with the authenticator is lost — which is why the screen says plainly that it will not
 * come back.
 */
function RecoveryCodeList({ codes }: { codes: readonly string[] }) {
  return (
    <div className="mt-8 flex flex-col gap-4">
      <Alert variant="warning">
        <KeyRoundIcon aria-hidden="true" />
        <AlertTitle>Kurtarma kodlarınızı şimdi kaydedin</AlertTitle>
        <AlertDescription>
          Bu kodlar bir daha gösterilmez. Telefonunuzu kaybederseniz panele yalnız bunlarla
          girebilirsiniz; her kod bir kez çalışır. Yazdırın ya da parola yöneticinize kaydedin.
        </AlertDescription>
      </Alert>
      <ul className="grid grid-cols-2 gap-2 rounded-lg border p-4 font-mono text-sm">
        {codes.map((code) => (
          <li key={code}>{code}</li>
        ))}
      </ul>
      <Button render={<Link href={todayRoute} />} size="lg">
        Kodları kaydettim, panele geç
      </Button>
    </div>
  );
}

/** Signing in with one of those codes instead of the app (D-236). */
function RecoveryCodeForm() {
  const [state, formAction, pending] = useActionState(useRecoveryCodeAction, initialAuthFormState);
  const [open, setOpen] = useState(false);

  useActionToast(state, state.error ? { type: "error", title: state.error } : null);

  if (!open) {
    return (
      <Button className="mt-6" onClick={() => setOpen(true)} size="sm" variant="ghost">
        Telefonuma erişemiyorum, kurtarma kodu kullanacağım
      </Button>
    );
  }

  return (
    <Form action={formAction} className="mt-6 flex flex-col gap-3 border-t pt-6">
      <Label htmlFor="recovery-code">Kurtarma kodu</Label>
      <Input
        autoCapitalize="characters"
        autoComplete="one-time-code"
        className="font-mono"
        id="recovery-code"
        name="code"
        placeholder="A7K2M-P9XQ4"
        spellCheck={false}
      />
      <p className="text-xs text-muted-foreground">
        Her kod bir kez çalışır. Kod ile girdikten sonra iki adımlı doğrulamayı yeniden kurmanız
        istenir; kayıp telefondaki kayıt silinir.
      </p>
      <Button loading={pending} type="submit" variant="outline">
        Kurtarma koduyla gir
      </Button>
    </Form>
  );
}
