"use client";

import { Building2Icon, PlusIcon, SearchIcon } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/frame";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { PartyRow } from "@/modules/crm/data/party-store";
import { PARTY_ROLES, ROLE_LABELS, roleWords, type PartyRole } from "@/modules/crm/domain/party";
import { EMPTY_PARTY, PartyForm, type PartyFormValue } from "@/modules/crm/ui/party-form";
import { useActionToast } from "@/platform/ui/feedback/use-action-toast";

/**
 * The firm list (TASK-0122, REQ-CRM-004). One card per firm: before a new card is saved the list
 * shows the firms whose name looks like it, and a tax number already on a card leads to that card
 * rather than to a second one.
 */

type Similar = { id: string; name: string; roles: PartyRole[]; city: string | null };
type Result = { error: string | null; id?: string | null; existingId?: string | null };

export type PartyListActions = {
  similar: (name: string) => Promise<Similar[]>;
  register: (value: PartyFormValue) => Promise<Result>;
};

const EVERY = "__every__";

export function PartyList({
  parties,
  words,
  role,
  canRegister,
  actions,
}: {
  parties: readonly PartyRow[];
  /** What the list is narrowed by, as it came in the address. */
  words: string;
  role: PartyRole | null;
  canRegister: boolean;
  actions: PartyListActions;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<PartyFormValue>(EMPTY_PARTY);
  const [lookalikes, setLookalikes] = useState<Similar[] | null>(null);
  const [existingId, setExistingId] = useState<string | null>(null);
  const [typed, setTyped] = useState(words);
  const [result, setResult] = useState<Result | null>(null);
  const [pending, start] = useTransition();

  useActionToast(result ?? {}, result?.error ? { type: "error", title: result.error } : null);

  const narrow = (next: { words?: string; role?: string | null }) => {
    const query = new URLSearchParams();
    const w = next.words ?? typed;
    const r = next.role === undefined ? role : next.role;
    if (w.trim()) query.set("q", w.trim());
    if (r) query.set("role", r);
    router.push(query.size ? `${pathname}?${query}` : pathname);
  };

  const close = () => {
    setAdding(false);
    setForm(EMPTY_PARTY);
    setLookalikes(null);
    setExistingId(null);
  };

  const change = (value: PartyFormValue) => {
    if (value.name !== form.name) setLookalikes(null);
    if (value.taxNo !== form.taxNo) setExistingId(null);
    setForm(value);
  };

  /** Lookalikes first; a new card only when there are none, or when the person says it is new. */
  const submit = () =>
    start(async () => {
      if (lookalikes === null) {
        const found = await actions.similar(form.name);
        if (found.length > 0) {
          setLookalikes(found);
          return;
        }
      }
      const said = await actions.register(form);
      setResult(said);
      setExistingId(said.existingId ?? null);
      if (!said.error && said.id) {
        close();
        router.push(`/leads-clients/parties/${said.id}`);
      }
    });

  const roleChoices = [
    { label: "Bütün roller", value: EVERY },
    ...PARTY_ROLES.map((one) => ({ label: ROLE_LABELS[one], value: one })),
  ];

  const addButton = canRegister ? (
    <Button onClick={() => setAdding(true)}>
      <PlusIcon aria-hidden="true" />
      Firma ekle
    </Button>
  ) : null;

  const narrowed = Boolean(words || role);

  return (
    <>
      <Frame className="w-full">
        <FrameHeader className="flex-row items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col">
            <FrameTitle>Firmalar</FrameTitle>
            <FrameDescription>
              Her firmanın tek kartı vardır; işveren, tedarikçi, taşeron ya da kiralayan olması
              kartındaki rollerdir.
            </FrameDescription>
          </div>
          {addButton}
        </FrameHeader>
        <FramePanel className="flex flex-col gap-4">
          <form
            className="flex flex-col gap-2 sm:flex-row"
            onSubmit={(event) => {
              event.preventDefault();
              narrow({ words: typed });
            }}
            role="search"
          >
            <InputGroup className="sm:flex-1">
              <InputGroupInput
                aria-label="Firma ara"
                onChange={(event) => setTyped(event.currentTarget.value)}
                placeholder="Unvan, vergi numarası ya da il"
                type="search"
                value={typed}
              />
              <InputGroupAddon>
                <SearchIcon aria-hidden="true" />
              </InputGroupAddon>
            </InputGroup>
            <Select
              items={roleChoices}
              onValueChange={(picked) => narrow({ role: picked === EVERY ? null : String(picked) })}
              value={role ?? EVERY}
            >
              <SelectTrigger aria-label="Role göre süz" className="sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectPopup>
                {roleChoices.map((choice) => (
                  <SelectItem key={choice.value} value={choice.value}>
                    {choice.label}
                  </SelectItem>
                ))}
              </SelectPopup>
            </Select>
          </form>

          {parties.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Building2Icon aria-hidden="true" />
                </EmptyMedia>
                <EmptyTitle aria-level={2} role="heading">
                  {narrowed ? "Bu aramaya uyan firma yok" : "Henüz firma yok"}
                </EmptyTitle>
                <EmptyDescription>
                  {narrowed
                    ? "Aramayı değiştirin ya da süzgeci kaldırın."
                    : "İşverenler, tedarikçiler, taşeronlar ve kiraladığımız firmalar burada tek listede durur."}
                </EmptyDescription>
              </EmptyHeader>
              {!narrowed && addButton ? <EmptyContent>{addButton}</EmptyContent> : null}
            </Empty>
          ) : (
            <>
              <ul className="flex flex-col gap-2 lg:hidden">
                {parties.map((party) => (
                  <li key={party.id}>
                    <Link
                      className="flex flex-col gap-1 rounded-lg border p-3 hover:bg-accent/50"
                      href={`/leads-clients/parties/${party.id}`}
                    >
                      <span className="font-medium">{party.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {[roleWords(party.roles), party.city].filter(Boolean).join(" · ")}
                      </span>
                      {party.status === "passive" ? (
                        <Badge className="self-start" variant="secondary">
                          Pasif
                        </Badge>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>

              <Table className="hidden lg:table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Unvan</TableHead>
                    <TableHead>Roller</TableHead>
                    <TableHead>Vergi numarası</TableHead>
                    <TableHead>İl</TableHead>
                    <TableHead>Durum</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parties.map((party) => (
                    <TableRow key={party.id}>
                      <TableCell className="font-medium">
                        <Link
                          className="hover:underline"
                          href={`/leads-clients/parties/${party.id}`}
                        >
                          {party.name}
                        </Link>
                      </TableCell>
                      <TableCell>{roleWords(party.roles)}</TableCell>
                      <TableCell className="tabular-nums">{party.taxNo ?? "—"}</TableCell>
                      <TableCell>{party.city ?? "—"}</TableCell>
                      <TableCell>
                        {party.status === "active" ? (
                          <Badge variant="success">Kullanımda</Badge>
                        ) : (
                          <Badge variant="secondary">Pasif</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
        </FramePanel>
      </Frame>

      <Dialog onOpenChange={(open) => (open ? setAdding(true) : close())} open={adding}>
        <DialogPopup className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Firma ekle</DialogTitle>
            <DialogDescription>
              Kaydetmeden önce benzer adlı firmalar gösterilir; aynı firmaysa yeni kart yerine onun
              kartına rol eklenir.
            </DialogDescription>
          </DialogHeader>
          {/* The warnings stand above the form, next to the name they are about. */}
          <DialogPanel className="flex flex-col gap-4">
            {lookalikes?.length ? (
              <Alert variant="warning">
                <AlertTitle>Listede buna benzeyen firmalar var</AlertTitle>
                <AlertDescription>
                  <ul className="flex flex-col gap-1">
                    {lookalikes.map((one) => (
                      <li key={one.id}>
                        <Link
                          className="underline"
                          href={`/leads-clients/parties/${one.id}`}
                          onClick={close}
                        >
                          {one.name}
                        </Link>
                        <span className="text-muted-foreground">
                          {" "}
                          · {[roleWords(one.roles), one.city].filter(Boolean).join(" · ")}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <span>
                    Aynı firmaysa kartını açıp rol ekleyin; gerçekten başka bir firmaysa yine de
                    kaydedebilirsiniz.
                  </span>
                </AlertDescription>
              </Alert>
            ) : null}
            {existingId ? (
              <Button
                className="self-start"
                onClick={close}
                render={<Link href={`/leads-clients/parties/${existingId}`} />}
                variant="outline"
              >
                Kayıtlı firmanın kartını aç
              </Button>
            ) : null}
            <PartyForm idPrefix="party-new" onChange={change} value={form} />
          </DialogPanel>
          <DialogFooter>
            <DialogClose render={<Button variant="ghost" />}>Vazgeç</DialogClose>
            <Button
              disabled={!form.name.trim() || form.roles.length === 0}
              loading={pending}
              onClick={submit}
            >
              {lookalikes?.length ? "Yine de kaydet" : "Kaydet"}
            </Button>
          </DialogFooter>
        </DialogPopup>
      </Dialog>
    </>
  );
}
