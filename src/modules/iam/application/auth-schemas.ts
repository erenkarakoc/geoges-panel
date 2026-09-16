import { z } from "zod";

/**
 * Shared client/server validation for the auth forms. Messages are Turkish (ADR-011).
 * The minimum password length is provisional (OQ-026); Supabase enforces its own policy too.
 */
export const minimumPasswordLength = 8;

const email = z.email({ message: "Geçerli bir e-posta adresi girin." });

export const signInSchema = z.object({
  email,
  password: z.string().min(1, { message: "Parolanızı girin." }),
});

export const passwordResetRequestSchema = z.object({ email });

export const updatePasswordSchema = z
  .object({
    password: z.string().min(minimumPasswordLength, {
      message: `Parola en az ${minimumPasswordLength} karakter olmalı.`,
    }),
    passwordConfirmation: z.string(),
  })
  .refine((value) => value.password === value.passwordConfirmation, {
    path: ["passwordConfirmation"],
    message: "Parolalar aynı değil.",
  });

export const twoFactorCodeSchema = z.object({
  code: z.string().regex(/^\d{6}$/, { message: "Doğrulama kodu 6 rakamdan oluşur." }),
});

/** First validation message of a failed parse, ready to show above the form. */
export function firstIssueMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Girilen bilgiler geçersiz.";
}
