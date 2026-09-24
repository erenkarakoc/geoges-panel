"use client";

import { SmartphoneIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

/**
 * Switching phone notifications on for this browser (REQ-TSK-010, D-132). The panel asks for
 * permission only when the person presses the button, and says plainly what happens when they
 * refuse: everything still arrives in the panel (SCREEN_STATES SCR-015). On an iPhone the
 * browser can only do this once the panel has been added to the Home Screen (D-252).
 *
 * **Nothing renders this today.** It sat at the bottom of the notification panel and the owner
 * had it taken out on 2026-09-24: too loud, and it crowded the notifications above it. Phone
 * notifications therefore cannot be switched on anywhere at the moment, so TASK-0108's real-phone
 * push acceptance waits for this to be given a quieter home — an account or settings screen, which
 * does not exist yet. The switch itself is unchanged and works; only its place is missing.
 */

type State =
  | { kind: "loading" }
  | { kind: "unsupported" }
  | { kind: "ios-home-screen" }
  | { kind: "off"; publicKey: string }
  | { kind: "on"; endpoint: string }
  | { kind: "denied" };

const API = "/api/push";

function keyBytes(base64: string): ArrayBuffer {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4))
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const binary = atob(padded);
  const bytes = new ArrayBuffer(binary.length);
  const view = new Uint8Array(bytes);
  for (let i = 0; i < binary.length; i += 1) view[i] = binary.charCodeAt(i);
  return bytes;
}

const isApple = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  (navigator.maxTouchPoints > 1 && /macintosh/i.test(navigator.userAgent));

const onHomeScreen = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  (navigator as { standalone?: boolean }).standalone === true;

/** What this browser can do and where it stands; nothing here changes anything. */
async function readState(): Promise<State> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return isApple() && !onHomeScreen() ? { kind: "ios-home-screen" } : { kind: "unsupported" };
  }
  const registration = await navigator.serviceWorker.register("/sw.js");
  const existing = await registration.pushManager.getSubscription();
  const answer = await fetch(
    existing ? `${API}?endpoint=${encodeURIComponent(existing.endpoint)}` : API,
    { cache: "no-store" },
  );
  const { publicKey, enabled } = (await answer.json()) as {
    publicKey: string | null;
    enabled: boolean;
  };
  if (!publicKey) return { kind: "unsupported" };
  if (existing && enabled) return { kind: "on", endpoint: existing.endpoint };
  return Notification.permission === "denied" ? { kind: "denied" } : { kind: "off", publicKey };
}

export function PushToggle() {
  const [state, setState] = useState<State>({ kind: "loading" });
  const [busy, setBusy] = useState(false);

  const read = useCallback(async () => {
    const answer = await readState();
    setState(answer);
  }, []);

  useEffect(() => {
    let alive = true;
    const apply = (answer: State) => {
      if (alive) setState(answer);
    };
    readState().then(apply, () => apply({ kind: "unsupported" }));
    return () => {
      alive = false;
    };
  }, []);

  async function switchOn(publicKey: string) {
    setBusy(true);
    try {
      if ((await Notification.requestPermission()) !== "granted") {
        setState({ kind: "denied" });
        return;
      }
      const registration = await navigator.serviceWorker.ready;
      const subscription =
        (await registration.pushManager.getSubscription()) ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: keyBytes(publicKey),
        }));
      await fetch(API, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(subscription.toJSON()),
      });
      setState({ kind: "on", endpoint: subscription.endpoint });
    } finally {
      setBusy(false);
    }
  }

  async function switchOff(endpoint: string) {
    setBusy(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      await subscription?.unsubscribe();
      await fetch(API, {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ endpoint }),
      });
      await read();
    } finally {
      setBusy(false);
    }
  }

  if (state.kind === "loading" || state.kind === "unsupported") return null;

  const note = (text: string) => (
    <p className="flex items-start gap-2 border-t pt-2 text-xs text-muted-foreground">
      <SmartphoneIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      {text}
    </p>
  );

  if (state.kind === "ios-home-screen") {
    return note(
      "iPhone'da telefon bildirimi için paneli Safari'nin paylaş menüsünden \"Ana Ekrana Ekle\" ile ekleyin. Bildirimler her durumda panelde görünür.",
    );
  }
  if (state.kind === "denied") {
    return note(
      "Telefon bildirimine izin verilmemiş; bildirimler panelde eksiksiz durur. İzni tarayıcı ayarlarından açabilirsiniz.",
    );
  }

  return (
    <div className="flex items-center justify-between gap-2 border-t pt-2">
      <span className="flex items-center gap-2 text-xs text-muted-foreground">
        <SmartphoneIcon aria-hidden="true" className="size-4 shrink-0" />
        {state.kind === "on" ? "Bu cihaza bildirim gönderiliyor." : "Telefona anında bildirim."}
      </span>
      <Button
        disabled={busy}
        onClick={() =>
          void (state.kind === "on" ? switchOff(state.endpoint) : switchOn(state.publicKey))
        }
        size="sm"
        variant={state.kind === "on" ? "ghost" : "outline"}
      >
        {busy ? <Spinner aria-label="Bekleyin" /> : null}
        {state.kind === "on" ? "Kapat" : "Aç"}
      </Button>
    </div>
  );
}
