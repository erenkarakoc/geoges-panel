"use client";

import { KeyRoundIcon, ShieldAlertIcon, ShieldCheckIcon } from "lucide-react";
import { useState, useTransition } from "react";

import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogPopup,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/frame";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { resetSecondFactorAction } from "@/modules/iam/application/auth-actions";
import type { PersonSecurity } from "@/modules/iam/data/account-security-store";
import { useActionToast } from "@/platform/ui/feedback/use-action-toast";

/**
 * The minimal people screen (D-273, owner 2026-09-24). It exists for one thing the panel could not
 * otherwise do: a user manager resetting a second factor somebody has lost (D-236). Roles,
 * assignments, delegation and visibility are the real screen's job and are deliberately not here;
 * when that screen is designed this one is replaced, not extended.
 *
 * What it shows about access is counted, never revealed: how many recovery codes are left and how
 * many sessions are open, so a manager can see whether somebody has a way back in before taking
 * their factor away.
 */

const lastSeen = new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short" });

export function PeopleSecurityList({ people }: { people: readonly PersonSecurity[] }) {
  return (
    <Frame className="w-full">
      <FrameHeader>
        <FrameTitle>Kullanıcılar</FrameTitle>
        <FrameDescription>
          Hesapların giriş durumu. Roller, yetkiler ve vekâlet bu ekranda değil; kendi ekranları
          yapıldığında buraya gelecek.
        </FrameDescription>
      </FrameHeader>
      <FramePanel>
        {/* Cards until the row actually fits, which is wider here than the usual phone
            breakpoint: the five columns want about 810 px of panel because the cells do not
            wrap, and what a narrower window pushes past the edge is the reset button this
            screen exists for. Measured: the row fits from 1280 px, so below that it is cards
            (SCREEN_PATTERNS section 3 — rows on the desktop, cards on the phone). */}
        <ul className="flex flex-col gap-2 xl:hidden">
          {people.map((person) => (
            <li key={person.id}>
              <PersonCard person={person} />
            </li>
          ))}
        </ul>

        <Table className="hidden xl:table">
          <TableHeader>
            <TableRow>
              <TableHead>Kişi</TableHead>
              <TableHead>İki adımlı doğrulama</TableHead>
              <TableHead>Kurtarma kodu</TableHead>
              <TableHead>Açık oturum</TableHead>
              <TableHead className="text-end">İşlem</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {people.map((person) => (
              <PersonRow key={person.id} person={person} />
            ))}
          </TableBody>
        </Table>
      </FramePanel>
    </Frame>
  );
}

function PersonRow({ person }: { person: PersonSecurity }) {
  return (
    <TableRow>
      <TableCell>
        <PersonName person={person} />
      </TableCell>
      <TableCell>
        <SecondFactorState person={person} />
      </TableCell>
      <TableCell>
        <span className="text-sm">{person.recoveryCodesLeft} adet</span>
      </TableCell>
      <TableCell>
        <div className="flex flex-col text-sm">
          <span>{person.liveSessions}</span>
          {person.lastSeenAt ? (
            <span className="text-xs text-muted-foreground">
              son: {lastSeen.format(person.lastSeenAt)}
            </span>
          ) : null}
        </div>
      </TableCell>
      <TableCell className="text-end">
        <ResetSecondFactorButton person={person} />
      </TableCell>
    </TableRow>
  );
}

function PersonCard({ person }: { person: PersonSecurity }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border p-3">
      <PersonName person={person} />
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
        <SecondFactorState person={person} />
        <span>{person.recoveryCodesLeft} kurtarma kodu</span>
        <span>{person.liveSessions} açık oturum</span>
        {person.lastSeenAt ? <span>son: {lastSeen.format(person.lastSeenAt)}</span> : null}
      </div>
      <ResetSecondFactorButton className="self-start" person={person} />
    </div>
  );
}

function PersonName({ person }: { person: PersonSecurity }) {
  return (
    <div className="flex flex-col">
      <span className="font-medium">{person.displayName}</span>
      <span className="text-xs text-muted-foreground">{person.email ?? "—"}</span>
      {person.active ? null : (
        <Badge className="mt-1 self-start" variant="secondary">
          Pasif
        </Badge>
      )}
    </div>
  );
}

function SecondFactorState({ person }: { person: PersonSecurity }) {
  return person.mustSetUpSecondFactor ? (
    <span className="flex items-center gap-1.5 text-sm max-xl:text-xs">
      <ShieldAlertIcon aria-hidden="true" className="size-4 text-warning" />
      Kurulum bekleniyor
    </span>
  ) : (
    <span className="flex items-center gap-1.5 text-sm text-muted-foreground max-xl:text-xs">
      <ShieldCheckIcon aria-hidden="true" className="size-4" />
      Kurulu
    </span>
  );
}

function ResetSecondFactorButton({
  className,
  person,
}: {
  className?: string;
  person: PersonSecurity;
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [state, setState] = useState<{ error: string | null; done: boolean }>({
    error: null,
    done: false,
  });

  useActionToast(
    state,
    state.error
      ? { type: "error", title: state.error }
      : state.done
        ? { type: "success", title: "İkinci faktör sıfırlandı; kişiden yenisi istenecek." }
        : null,
  );

  const reset = () =>
    start(async () => {
      const answer = await resetSecondFactorAction(person.id);
      setState({ error: answer.error, done: !answer.error });
      if (!answer.error) setOpen(false);
    });

  return (
    <AlertDialog onOpenChange={setOpen} open={open}>
      <Button className={className} onClick={() => setOpen(true)} size="sm" variant="outline">
        <KeyRoundIcon aria-hidden="true" />
        İkinci faktörü sıfırla
      </Button>
      <AlertDialogPopup>
        <AlertDialogHeader>
          <AlertDialogTitle>{person.displayName} için sıfırlansın mı?</AlertDialogTitle>
          <AlertDialogDescription>
            Kayıp cihazdaki kayıt silinir, kişiden yeni bir doğrulama kurması istenir ve açık
            oturumları kapanır. İşlem denetim kaydına yazılır ve sahiplere bildirilir.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogClose render={<Button variant="ghost" />}>Vazgeç</AlertDialogClose>
          <Button loading={pending} onClick={reset} variant="destructive">
            Sıfırla
          </Button>
        </AlertDialogFooter>
      </AlertDialogPopup>
    </AlertDialog>
  );
}
