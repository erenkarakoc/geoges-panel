/**
 * What a locked account is told (TASK-0112, REQ-IAM-005, D-272).
 *
 * The wording never says whether the address has an account: a locked unknown address and a
 * locked real one read the same, exactly as a wrong password and a wrong e-mail do. It says how
 * long the wait is, because a person who cannot get in deserves to know when to come back, and it
 * rounds up to the minute so the number does not change while the sentence is being read.
 *
 * The remaining time is measured by the database, which owns the lock; this machine's clock never
 * enters it. A minute of drift between the two turned a fifteen-minute lock into "16 dakika" in
 * the browser pass of 2026-09-24.
 */
export function lockedMessage(lock: { remainingMs: number }): string {
  const minutes = Math.max(1, Math.ceil(lock.remainingMs / 60_000));
  return `Çok fazla hatalı deneme yapıldı. Güvenlik için giriş ${minutes} dakika kapalı; süre sonunda tekrar deneyin.`;
}
