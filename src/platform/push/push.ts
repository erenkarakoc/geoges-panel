import "server-only";

/**
 * `PushSender` port (PORTS_AND_SERVICES, REQ-TSK-010, D-132): an instant notification on the
 * person's phone through the browser's own push service, no app to install. The private VAPID
 * key stays on the server; the message carries the same words as the panel notification, which
 * are built from a fixed template and never hold sensitive data (REQ-TSK-011).
 */

export type PushTarget = { endpoint: string; p256dh: string; auth: string };

/** What the service worker shows; `url` is a path inside the panel. */
export type PushMessage = { title: string; body?: string | null; url?: string | null };

/** "sent": accepted. "gone": the browser is no longer there, stop using this address. */
export type PushResult = "sent" | "gone" | "failed";

export interface PushSender {
  publicKey(): string;
  send(target: PushTarget, message: PushMessage): Promise<PushResult>;
}

export function readVapidConfig(env: Record<string, string | undefined> = process.env) {
  const publicKey = env.WEB_PUSH_PUBLIC_KEY;
  const privateKey = env.WEB_PUSH_PRIVATE_KEY;
  if (!publicKey || !privateKey) return null;
  return { publicKey, privateKey, subject: env.WEB_PUSH_SUBJECT ?? "mailto:info@geoges.com" };
}

export function createWebPushSender(config: NonNullable<ReturnType<typeof readVapidConfig>>) {
  let configured: Promise<typeof import("web-push")> | null = null;
  const library = () => {
    configured ??= import("web-push").then((module) => {
      const webpush = module.default ?? module;
      webpush.setVapidDetails(config.subject, config.publicKey, config.privateKey);
      return webpush;
    });
    return configured;
  };

  const sender: PushSender = {
    publicKey: () => config.publicKey,
    async send(target, message) {
      const webpush = await library();
      try {
        await webpush.sendNotification(
          { endpoint: target.endpoint, keys: { p256dh: target.p256dh, auth: target.auth } },
          JSON.stringify(message),
          { TTL: 60 * 60 * 12, urgency: "high" },
        );
        return "sent";
      } catch (error) {
        const status = (error as { statusCode?: number }).statusCode;
        // 404/410: the browser dropped the address. 403: our keys no longer match it.
        return status === 404 || status === 410 || status === 403 ? "gone" : "failed";
      }
    },
  };
  return sender;
}

/** A sender that refuses everything, used where no VAPID keys are configured. */
export const noPushSender: PushSender = {
  publicKey: () => "",
  async send() {
    return "failed";
  },
};

let chosen: PushSender | null = null;

/** The sender of this process; phone notifications are simply off without keys. */
export function pushSender(env: Record<string, string | undefined> = process.env): PushSender {
  if (!chosen) {
    const config = readVapidConfig(env);
    chosen = config ? createWebPushSender(config) : noPushSender;
  }
  return chosen;
}

/** The same sender, chosen at the first call (the worker registry is wired at start-up). */
export const processPushSender: PushSender = {
  publicKey: () => pushSender().publicKey(),
  send: (...args) => pushSender().send(...args),
};
