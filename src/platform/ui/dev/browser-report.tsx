"use client";

import { useEffect } from "react";

/**
 * Development-only helper (TASK-0108 follow-up): a phone on the local network has no console we
 * can open, so the page tells the dev server that it started, and sends any error it hits. It is
 * rendered only when `NODE_ENV` is not production and disappears from a production build.
 */
export function BrowserReport() {
  useEffect(() => {
    const send = (kind: string, message: string) =>
      void fetch("/api/dev-log", {
        method: "POST",
        headers: { "content-type": "application/json" },
        keepalive: true,
        body: JSON.stringify({
          kind,
          message,
          url: window.location.pathname,
          userAgent: navigator.userAgent,
        }),
      }).catch(() => {});

    send("çalıştı", "sayfanın betikleri çalışıyor");
    const onError = (event: ErrorEvent) =>
      send("hata", `${event.message} @ ${event.filename}:${event.lineno}`);
    const onRejection = (event: PromiseRejectionEvent) =>
      send("söz reddi", String((event.reason as Error)?.stack ?? event.reason));
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
