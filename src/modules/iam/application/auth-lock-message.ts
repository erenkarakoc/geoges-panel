/**
 * What a locked account is told (TASK-0112, REQ-IAM-005, D-272).
 *
 * The wording never says whether the address has an account: a locked unknown address and a
 * locked real one read the same, exactly as a wrong password and a wrong e-mail do. It says how
 * long the wait is, because a person who cannot get in deserves to know when to come back, and it
 * rounds up to the minute so the number does not change while the sentence is being read.
 */
export function lockedMessage(until: Date, now: Date = new Date()): string {
  const minutes = Math.max(1, Math.ceil((until.getTime() - now.getTime()) / 60_000));
  return `Çok fazla hatalı deneme yapıldı. Güvenlik için giriş ${minutes} dakika kapalı; süre sonunda tekrar deneyin.`;
}
