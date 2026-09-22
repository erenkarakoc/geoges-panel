"use client";

import { ShareIcon, SmartphoneIcon, SquarePlusIcon } from "lucide-react";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog";
import type { AppState } from "@/modules/tsk/data/tsk-install-store";
import { homeScreenAsk, type HomeScreenPlatform } from "@/modules/tsk/domain/tasks";

/**
 * Asking for the panel on the Home Screen (TASK-0113, D-264, D-252).
 *
 * The panel is opened many times a day and its notifications only reach a phone from the Home
 * Screen, so it asks for that: once in a window at the first sign-in, and afterwards in a strip
 * on "Bugün" that stays until it is done. The strip cannot be dismissed, because a dismissed
 * notice is never seen again, but it is small and blocks nothing.
 *
 * Android and desktop Chrome hand the page their own install offer, which one press turns into
 * the system's install window. An iPhone gives no such offer — Apple allows no way to add a page
 * to the Home Screen from the page itself — so there the window shows the two steps instead.
 */

const API = "/api/app-install";

/** The browser's install offer; the page keeps it until the person presses the button. */
type InstallOffer = Event & {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type Platform = HomeScreenPlatform;

function platformOf(): Platform {
  const agent = navigator.userAgent;
  if (/iphone|ipad|ipod/i.test(agent)) return "ios";
  if (navigator.maxTouchPoints > 1 && /macintosh/i.test(agent)) return "ios";
  if (/android/i.test(agent)) return "android";
  return "other";
}

const onHomeScreenNow = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  (navigator as { standalone?: boolean }).standalone === true;

function note(body: { introShown?: boolean; onHomeScreen?: boolean; platform?: Platform }) {
  void fetch(API, {
    method: "POST",
    headers: { "content-type": "application/json" },
    keepalive: true,
    body: JSON.stringify(body),
  }).catch(() => {});
}

/** Never subscribes: what kind of phone this is does not change while the panel is open. */
const fixed = () => () => {};

export function InstallPrompt({ state }: { state: AppState }) {
  // Read from the browser rather than set in an effect, so the server renders nothing and the
  // first client render already knows where it stands.
  const platform = useSyncExternalStore<Platform | null>(fixed, platformOf, () => null);
  const standalone = useSyncExternalStore(fixed, onHomeScreenNow, () => true);

  const [offer, setOffer] = useState<InstallOffer | null>(null);
  const [installed, setInstalled] = useState(false);
  const [dialogClosed, setDialogClosed] = useState(false);
  const [dialogAsked, setDialogAsked] = useState(false);

  useEffect(() => {
    const here = platformOf();
    // A computer's own window, and an embedded browser, also answer "standalone"; only a phone's
    // Home Screen counts, or the strip would disappear for a phone that still has nothing.
    const onPhoneHomeScreen = here !== "other" && onHomeScreenNow();
    if (onPhoneHomeScreen) {
      note({ onHomeScreen: true, platform: here });
      return;
    }
    if (!state.introShown) note({ introShown: true, platform: here });
    const keepOffer = (event: Event) => {
      event.preventDefault();
      setOffer(event as InstallOffer);
    };
    const done = () => {
      setInstalled(true);
      if (here !== "other") note({ onHomeScreen: true, platform: here });
    };
    window.addEventListener("beforeinstallprompt", keepOffer);
    window.addEventListener("appinstalled", done);
    return () => {
      window.removeEventListener("beforeinstallprompt", keepOffer);
      window.removeEventListener("appinstalled", done);
    };
  }, [state.introShown]);

  const install = useCallback(async () => {
    if (!offer) return;
    await offer.prompt();
    const { outcome } = await offer.userChoice;
    setOffer(null);
    if (outcome === "accepted") {
      setInstalled(true);
      const here = platformOf();
      if (here !== "other") note({ onHomeScreen: true, platform: here });
    }
    setDialogClosed(true);
    setDialogAsked(false);
  }, [offer]);

  if (platform === null) return null;
  const ask = homeScreenAsk({
    ...state,
    standaloneNow: standalone || installed,
    platform,
  });
  const dialogOpen = dialogAsked || (ask.dialog && !dialogClosed);
  if (!ask.strip && !dialogOpen) return null;

  const oneTap = offer !== null;

  const why = state.pushEnabled
    ? "Panel telefonunuzun ana ekranından tek dokunuşla açılır."
    : "Şu an telefonunuza bildirim gitmiyor: size verilen görevden, onay talebinden ve kritik uyarıdan anında haberiniz olmaz.";

  const steps =
    platform === "ios" ? (
      <ol className="flex flex-col gap-3 text-sm">
        <li className="flex items-start gap-3">
          <ShareIcon aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-info" />
          <span>
            Safari&apos;nin alt çubuğundaki <strong>Paylaş</strong> simgesine dokunun (yukarı ok).
          </span>
        </li>
        <li className="flex items-start gap-3">
          <SquarePlusIcon aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-info" />
          <span>
            Listeyi kaydırıp <strong>Ana Ekrana Ekle</strong> seçin, sonra <strong>Ekle</strong>.
          </span>
        </li>
      </ol>
    ) : (
      <p className="text-sm">
        {oneTap
          ? "Aşağıdaki düğmeye basın; telefonunuz eklemeyi onaylamanızı isteyecek."
          : "Tarayıcının sağ üstündeki menüden “Uygulamayı yükle” ya da “Ana ekrana ekle” seçeneğine dokunun."}
      </p>
    );

  return (
    <>
      {ask.strip ? (
        <Alert className="md:hidden" variant="info">
          <SmartphoneIcon aria-hidden="true" />
          <AlertTitle>Paneli ana ekranınıza ekleyin</AlertTitle>
          <AlertDescription>
            İki adım, on saniye.{" "}
            {state.pushEnabled ? "" : "Bildirimler ancak böyle telefonunuza düşer."}
          </AlertDescription>
          <AlertAction>
            <Button onClick={() => (oneTap ? void install() : setDialogAsked(true))} size="sm">
              {oneTap ? "Ekle" : "Nasıl?"}
            </Button>
          </AlertAction>
        </Alert>
      ) : null}

      <Dialog
        onOpenChange={(next) => {
          setDialogAsked(next);
          if (!next) setDialogClosed(true);
        }}
        open={dialogOpen}
      >
        <DialogPopup className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Paneli ana ekranınıza ekleyin</DialogTitle>
            <DialogDescription>{why}</DialogDescription>
          </DialogHeader>
          <DialogPanel className="flex flex-col gap-4">
            {platform === "other" && !oneTap ? (
              <p className="text-sm">
                Bu ekranı telefonunuzun tarayıcısında açın ve paneli ana ekrana ekleyin; bildirimler
                telefonunuza böyle düşer. Bilgisayarda ise bildirimler panelde görünmeye devam eder.
              </p>
            ) : (
              steps
            )}
          </DialogPanel>
          <DialogFooter>
            <DialogClose render={<Button variant="ghost" />}>Şimdi değil</DialogClose>
            {oneTap ? <Button onClick={() => void install()}>Ana ekrana ekle</Button> : null}
          </DialogFooter>
        </DialogPopup>
      </Dialog>
    </>
  );
}
