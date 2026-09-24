import { createHash, randomInt } from "node:crypto";

/**
 * Two-factor recovery codes (TASK-0112, D-236, REQ-IAM-003).
 *
 * Ten codes are made when the second factor is set up, shown once, and kept only as hashes. A
 * code is read off a screen and typed by hand later, often from a piece of paper, so the alphabet
 * leaves out the characters people confuse: no O or 0, no I, l or 1. Ten characters of the
 * remaining thirty-two carry about fifty bits, which is why a plain SHA-256 is enough here and a
 * password hash would be the wrong tool: there is nothing to guess and nothing to slow down, and
 * the comparison happens on the hash in the database.
 *
 * Typing is forgiving — case, spaces and dashes are ignored — because the person entering one has
 * already lost their phone and does not need a second puzzle.
 */

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const LENGTH = 10;
export const RECOVERY_CODE_COUNT = 10;

/** One code, shown as two groups of five: `A7K2M-P9XQ4`. */
function newCode(): string {
  let code = "";
  for (let n = 0; n < LENGTH; n += 1) code += ALPHABET[randomInt(ALPHABET.length)];
  return `${code.slice(0, 5)}-${code.slice(5)}`;
}

/** Ten codes to show the person once, never stored as they are. */
export function newRecoveryCodes(): string[] {
  const codes = new Set<string>();
  while (codes.size < RECOVERY_CODE_COUNT) codes.add(newCode());
  return [...codes];
}

/** What a typed code is compared by: sixty-four hex characters, as `iam.recovery_code` requires. */
export function hashRecoveryCode(code: string): string {
  const cleaned = code.toUpperCase().replaceAll(/[^A-Z0-9]/g, "");
  return createHash("sha256").update(cleaned).digest("hex");
}

/** Whether a typed code could be one at all; nothing is looked up for something this wrong. */
export function looksLikeRecoveryCode(code: string): boolean {
  return code.toUpperCase().replaceAll(/[^A-Z0-9]/g, "").length === LENGTH;
}
