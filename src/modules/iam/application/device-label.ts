/**
 * A short, readable name for the device a session was opened on (TASK-0112; `iam.session`).
 *
 * It is for a person reading their own session list, not for detection: a rough family and
 * browser is enough, and anything unrecognised is simply "Bilinmeyen cihaz". The user agent itself
 * is not stored — a long header string tells the reader nothing and carries more than the panel
 * needs.
 */
export function deviceLabel(userAgent: string | null | undefined): string {
  const agent = (userAgent ?? "").toLowerCase();
  if (!agent) return "Bilinmeyen cihaz";

  const device = /iphone/.test(agent)
    ? "iPhone"
    : /ipad/.test(agent)
      ? "iPad"
      : /android/.test(agent)
        ? "Android"
        : /windows/.test(agent)
          ? "Windows"
          : /macintosh|mac os/.test(agent)
            ? "Mac"
            : /linux/.test(agent)
              ? "Linux"
              : null;

  // Order matters: every one of these says "Safari" or "Chrome" about itself somewhere.
  const browser = /edg\//.test(agent)
    ? "Edge"
    : /opr\/|opera/.test(agent)
      ? "Opera"
      : /firefox/.test(agent)
        ? "Firefox"
        : /chrome|crios/.test(agent)
          ? "Chrome"
          : /safari/.test(agent)
            ? "Safari"
            : null;

  if (!device && !browser) return "Bilinmeyen cihaz";
  return [device, browser].filter(Boolean).join(" · ");
}
