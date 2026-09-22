import "server-only";

import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

/**
 * `MailSender` port (PORTS_AND_SERVICES, REQ-TSK-013): e-mail is used for the daily digest only
 * (D-132). The provider is not chosen yet (OQ-015), so the panel writes each message as a file
 * instead of sending it; the file adapter is what runs until a provider exists. A message holds
 * the same words as the panel, which never carry sensitive data (REQ-TSK-011).
 */

export type MailMessage = {
  to: string;
  subject: string;
  text: string;
};

export interface MailSender {
  /** The name shown in records and logs, e.g. "dosya" or "smtp". */
  readonly kind: string;
  send(message: MailMessage): Promise<boolean>;
}

/** RFC 5322 message with UTF-8 body, so the file opens in any mail program. */
export function mailFile(message: MailMessage, at: Date): string {
  const encoded = Buffer.from(message.subject, "utf8").toString("base64");
  return [
    `Date: ${at.toUTCString()}`,
    `To: ${message.to}`,
    "From: GEOGES Panel <panel@geoges.local>",
    `Subject: =?UTF-8?B?${encoded}?=`,
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="utf-8"',
    "Content-Transfer-Encoding: 8bit",
    "",
    message.text,
    "",
  ].join("\r\n");
}

/**
 * Writes messages into a folder (`.mail` by default, outside the repository's files). Used until
 * the provider is chosen; the owner can open the files to see exactly what would be sent.
 */
export function createFileMailSender(folder = resolve(process.cwd(), ".mail")): MailSender {
  return {
    kind: "dosya",
    async send(message) {
      mkdirSync(folder, { recursive: true });
      const at = new Date();
      const name = `${at.toISOString().replace(/[:.]/g, "-")}-${message.to.replace(/[^\w.@-]/g, "_")}.eml`;
      writeFileSync(join(folder, name), mailFile(message, at), "utf8");
      return true;
    },
  };
}

let chosen: MailSender | null = null;

/** The sender of this process; a real provider replaces the file adapter once OQ-015 is answered. */
export function mailSender(): MailSender {
  chosen ??= createFileMailSender();
  return chosen;
}

/** The same sender, chosen at the first call (the worker registry is wired at start-up). */
export const processMailSender: MailSender = {
  get kind() {
    return mailSender().kind;
  },
  send: (message) => mailSender().send(message),
};
