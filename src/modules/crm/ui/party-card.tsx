"use client";

import { ChevronLeftIcon, MoreHorizontalIcon, PlusIcon, UsersIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";

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
import { Field, FieldLabel } from "@/components/ui/field";
import { Frame, FrameHeader, FramePanel, FrameTitle } from "@/components/ui/frame";
import { Input } from "@/components/ui/input";
import { Menu, MenuItem, MenuPopup, MenuTrigger } from "@/components/ui/menu";
import { Tabs, TabsList, TabsPanel, TabsTab } from "@/components/ui/tabs";
import type { Party, PartyContact } from "@/modules/crm/data/party-store";
import { ROLE_LABELS, type PartyStatus } from "@/modules/crm/domain/party";
import { PartyForm, type PartyFormValue } from "@/modules/crm/ui/party-form";
import { useActionToast } from "@/platform/ui/feedback/use-action-toast";

/**
 * The firm card (SCR-083, TASK-0122). What the card is today: the firm, its roles and its people.
 * What it grows into — leads and conversations, the client scorecard, the current account — comes
 * with the slices that record them, and each of those tabs says when rather than sitting empty
 * (D-287).
 */

type Result = { error: string | null; id?: string | null; existingId?: string | null };

type ContactForm = { name: string; title: string; phone: string; email: string };
const EMPTY_CONTACT: ContactForm = { email: "", name: "", phone: "", title: "" };

export type PartyCardActions = {
  change: (value: PartyFormValue) => Promise<Result>;
  setStatus: (status: PartyStatus) => Promise<Result>;
  addContact: (value: ContactForm) => Promise<Result>;
  changeContact: (contactId: string, value: ContactForm) => Promise<Result>;
  setContactStatus: (contactId: string, status: PartyStatus) => Promise<Result>;
};

type CustomValue = {
  definition: {
    code: string;
    label: string;
    type: string;
    options: readonly { value: string; label: string }[] | null;
  };
  value: unknown;
};

const day = new Intl.DateTimeFormat("tr-TR", { dateStyle: "long" });

export function PartyCard({
  party,
  contacts,
  customFields,
  canRegister,
  actions,
}: {
  party: Party;
  contacts: readonly PartyContact[];
  customFields: readonly CustomValue[];
  canRegister: boolean;
  actions: PartyCardActions;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<PartyFormValue>(() => toForm(party));
  const [existingId, setExistingId] = useState<string | null>(null);
  const [contactOpen, setContactOpen] = useState(false);
  const [contactId, setContactId] = useState<string | null>(null);
  const [contact, setContact] = useState<ContactForm>(EMPTY_CONTACT);
  const [result, setResult] = useState<Result | null>(null);
  const [pending, start] = useTransition();

  useActionToast(result ?? {}, result?.error ? { type: "error", title: result.error } : null);

  const run = (work: () => Promise<Result>, done: () => void) =>
    start(async () => {
      const said = await work();
      setResult(said);
      setExistingId(said.existingId ?? null);
      if (!said.error) {
        done();
        router.refresh();
      }
    });

  const openContact = (one: PartyContact | null) => {
    setContactId(one?.id ?? null);
    setContact(
      one
        ? { email: one.email ?? "", name: one.name, phone: one.phone ?? "", title: one.title ?? "" }
        : EMPTY_CONTACT,
    );
    setContactOpen(true);
  };

  return (
    <div className="flex flex-col gap-4">
      <Button
        className="self-start"
        render={<Link href="/leads-clients/parties" />}
        size="sm"
        variant="ghost"
      >
        <ChevronLeftIcon aria-hidden="true" />
        Firmalar
      </Button>

      <header className="flex items-start gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <h1 className="text-xl font-semibold">{party.name}</h1>
          <div className="flex flex-wrap gap-2">
            {party.roles.map((role) => (
              <Badge key={role} variant="outline">
                {ROLE_LABELS[role]}
              </Badge>
            ))}
            {party.status === "passive" ? <Badge variant="secondary">Pasif</Badge> : null}
          </div>
        </div>
        {canRegister ? (
          <Menu>
            <MenuTrigger
              render={<Button aria-label="Firma işlemleri" size="icon" variant="outline" />}
            >
              <MoreHorizontalIcon aria-hidden="true" />
            </MenuTrigger>
            <MenuPopup align="end">
              <MenuItem
                onClick={() => {
                  setForm(toForm(party));
                  setExistingId(null);
                  setEditing(true);
                }}
              >
                Kartı düzenle
              </MenuItem>
              <MenuItem
                onClick={() =>
                  run(
                    () => actions.setStatus(party.status === "active" ? "passive" : "active"),
                    () => undefined,
                  )
                }
              >
                {party.status === "active" ? "Pasifleştir" : "Yeniden kullanıma al"}
              </MenuItem>
            </MenuPopup>
          </Menu>
        ) : null}
      </header>

      <Tabs defaultValue="details">
        <div className="[scrollbar-width:none] overflow-x-auto overflow-y-hidden [&::-webkit-scrollbar]:hidden">
          {/* 44 px on a phone, the thumb target the bottom bar and header use (DESIGN_SYSTEM_RULES
              §4.1 row 17a); the strip scrolls sideways there and the half-shown last tab says so.
              A sideways scroll turns the vertical axis into `auto` too, and the underline sits a
              pixel below the list, so the vertical axis is pinned and the scrollbar hidden — the
              context bar's fix (context-bar.tsx). */}
          <TabsList className="max-md:[&>button]:h-11" variant="underline">
            <TabsTab value="details">Bilgiler</TabsTab>
            <TabsTab value="people">Kişiler ({contacts.length})</TabsTab>
            <TabsTab value="leads">Talepler ve görüşmeler</TabsTab>
            <TabsTab value="scorecard">İşveren karnesi</TabsTab>
            <TabsTab value="account">Cari hesap</TabsTab>
          </TabsList>
        </div>

        <TabsPanel className="pt-4" value="details">
          <Frame>
            <FramePanel>
              <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                <Fact label="Vergi numarası">{party.taxNo}</Fact>
                <Fact label="Vergi dairesi">{party.taxOffice}</Fact>
                <Fact label="İl">{party.city}</Fact>
                <Fact label="Telefon">
                  {party.phone ? <a href={`tel:${party.phone}`}>{party.phone}</a> : null}
                </Fact>
                <Fact label="E-posta">
                  {party.email ? <a href={`mailto:${party.email}`}>{party.email}</a> : null}
                </Fact>
                <Fact label="Kayıt tarihi">{day.format(party.createdAt)}</Fact>
                <Fact className="sm:col-span-2" label="Adres">
                  {party.address}
                </Fact>
                <Fact className="sm:col-span-2" label="Not">
                  {party.note}
                </Fact>
                {customFields.map(({ definition, value }) => (
                  <Fact key={definition.code} label={definition.label}>
                    {customText(definition, value)}
                  </Fact>
                ))}
              </dl>
            </FramePanel>
          </Frame>
        </TabsPanel>

        <TabsPanel className="pt-4" value="people">
          {contacts.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <UsersIcon aria-hidden="true" />
                </EmptyMedia>
                <EmptyTitle aria-level={2} role="heading">
                  Kayıtlı kişi yok
                </EmptyTitle>
                <EmptyDescription>
                  Firmada kiminle görüşüldüğü burada durur: ad, görev, telefon, e-posta.
                </EmptyDescription>
              </EmptyHeader>
              {canRegister ? (
                <EmptyContent>
                  <Button onClick={() => openContact(null)}>
                    <PlusIcon aria-hidden="true" />
                    Kişi ekle
                  </Button>
                </EmptyContent>
              ) : null}
            </Empty>
          ) : (
            <Frame>
              <FrameHeader className="flex-row items-center justify-between gap-3">
                <FrameTitle>Kişiler</FrameTitle>
                {canRegister ? (
                  <Button onClick={() => openContact(null)} size="sm">
                    <PlusIcon aria-hidden="true" />
                    Kişi ekle
                  </Button>
                ) : null}
              </FrameHeader>
              <FramePanel>
                <ul className="divide-y">
                  {contacts.map((one) => (
                    <li className="flex items-start gap-3 py-3" key={one.id}>
                      <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <span className="font-medium">
                          {one.name}
                          {one.title ? (
                            <span className="font-normal text-muted-foreground">
                              {" "}
                              · {one.title}
                            </span>
                          ) : null}
                        </span>
                        <span className="flex flex-wrap gap-x-4 text-sm">
                          {one.phone ? <a href={`tel:${one.phone}`}>{one.phone}</a> : null}
                          {one.email ? <a href={`mailto:${one.email}`}>{one.email}</a> : null}
                        </span>
                        {one.status === "passive" ? (
                          <Badge className="self-start" variant="secondary">
                            Firmadan ayrıldı
                          </Badge>
                        ) : null}
                      </div>
                      {canRegister ? (
                        <Menu>
                          <MenuTrigger
                            render={
                              <Button aria-label="Kişi işlemleri" size="icon-sm" variant="ghost" />
                            }
                          >
                            <MoreHorizontalIcon aria-hidden="true" />
                          </MenuTrigger>
                          <MenuPopup align="end">
                            <MenuItem onClick={() => openContact(one)}>Düzenle</MenuItem>
                            <MenuItem
                              onClick={() =>
                                run(
                                  () =>
                                    actions.setContactStatus(
                                      one.id,
                                      one.status === "active" ? "passive" : "active",
                                    ),
                                  () => undefined,
                                )
                              }
                            >
                              {one.status === "active" ? "Firmadan ayrıldı" : "Hâlâ firmada"}
                            </MenuItem>
                          </MenuPopup>
                        </Menu>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </FramePanel>
            </Frame>
          )}
        </TabsPanel>

        <TabsPanel className="pt-4" value="leads">
          <Later
            text="Bu firmadan gelen talepler ve firmayla yapılan görüşmeler tek zaman çizelgesinde burada görünecek."
            when="Talepler ve teklifler dilimiyle (Faz 13) gelir."
          />
        </TabsPanel>
        <TabsPanel className="pt-4" value="scorecard">
          <Later
            text="İşverenin geçmiş işleri, teklifleri, ödeme hızı ve gecikmeleri kayıtlardan kendiliğinden hesaplanıp burada görünecek."
            when="Talepler ve teklifler dilimiyle (Faz 13) gelir."
          />
        </TabsPanel>
        <TabsPanel className="pt-4" value="account">
          <Later
            text="Firmanın tek cari hesabı — alacak ve borç birbirinden düşülmüş net bakiye — burada görünecek."
            when="Finans dilimiyle (Faz 11) gelir."
          />
        </TabsPanel>
      </Tabs>

      <Dialog onOpenChange={setEditing} open={editing}>
        <DialogPopup className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Kartı düzenle</DialogTitle>
            <DialogDescription>Eski bilgiler kartın geçmişinde kalır.</DialogDescription>
          </DialogHeader>
          <DialogPanel className="flex flex-col gap-4">
            {existingId ? (
              <Button
                className="self-start"
                onClick={() => setEditing(false)}
                render={<Link href={`/leads-clients/parties/${existingId}`} />}
                variant="outline"
              >
                Bu numaranın kayıtlı olduğu kartı aç
              </Button>
            ) : null}
            <PartyForm idPrefix="party-edit" onChange={setForm} value={form} />
          </DialogPanel>
          <DialogFooter>
            <DialogClose render={<Button variant="ghost" />}>Vazgeç</DialogClose>
            <Button
              disabled={!form.name.trim() || form.roles.length === 0}
              loading={pending}
              onClick={() =>
                run(
                  () => actions.change(form),
                  () => setEditing(false),
                )
              }
            >
              Kaydet
            </Button>
          </DialogFooter>
        </DialogPopup>
      </Dialog>

      <Dialog onOpenChange={setContactOpen} open={contactOpen}>
        <DialogPopup>
          <DialogHeader>
            <DialogTitle>{contactId ? "Kişiyi düzenle" : "Kişi ekle"}</DialogTitle>
            <DialogDescription>Yalnız iş iletişim bilgisi yazılır.</DialogDescription>
          </DialogHeader>
          <DialogPanel className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="contact-name">Ad soyad</FieldLabel>
              <Input
                id="contact-name"
                onChange={(event) => setContact({ ...contact, name: event.currentTarget.value })}
                value={contact.name}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="contact-title">Görevi</FieldLabel>
              <Input
                id="contact-title"
                onChange={(event) => setContact({ ...contact, title: event.currentTarget.value })}
                placeholder="Şantiye şefi"
                value={contact.title}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="contact-phone">Telefon</FieldLabel>
              <Input
                id="contact-phone"
                inputMode="tel"
                onChange={(event) => setContact({ ...contact, phone: event.currentTarget.value })}
                type="tel"
                value={contact.phone}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="contact-email">E-posta</FieldLabel>
              <Input
                id="contact-email"
                inputMode="email"
                onChange={(event) => setContact({ ...contact, email: event.currentTarget.value })}
                type="email"
                value={contact.email}
              />
            </Field>
          </DialogPanel>
          <DialogFooter>
            <DialogClose render={<Button variant="ghost" />}>Vazgeç</DialogClose>
            <Button
              disabled={!contact.name.trim()}
              loading={pending}
              onClick={() =>
                run(
                  () =>
                    contactId
                      ? actions.changeContact(contactId, contact)
                      : actions.addContact(contact),
                  () => setContactOpen(false),
                )
              }
            >
              Kaydet
            </Button>
          </DialogFooter>
        </DialogPopup>
      </Dialog>
    </div>
  );
}

function toForm(party: Party): PartyFormValue {
  return {
    address: party.address ?? "",
    city: party.city ?? "",
    email: party.email ?? "",
    name: party.name,
    note: party.note ?? "",
    phone: party.phone ?? "",
    roles: [...party.roles],
    taxNo: party.taxNo ?? "",
    taxOffice: party.taxOffice ?? "",
  };
}

function Fact({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 break-words whitespace-pre-line">{children || "—"}</dd>
    </div>
  );
}

function customText(definition: CustomValue["definition"], value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (definition.type === "boolean") return value ? "Evet" : "Hayır";
  if (definition.type === "select")
    return definition.options?.find((option) => option.value === value)?.label ?? String(value);
  if (definition.type === "date" && typeof value === "string")
    return day.format(new Date(`${value}T12:00:00`));
  if (definition.type === "number" && typeof value === "number")
    return new Intl.NumberFormat("tr-TR").format(value);
  return String(value);
}

/** A tab whose process belongs to a later slice: what it will hold, and when. */
function Later({ text, when }: { text: string; when: string }) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyTitle aria-level={2} role="heading">
          Henüz yok
        </EmptyTitle>
        <EmptyDescription>{text}</EmptyDescription>
        <Badge className="mt-2" variant="outline">
          {when}
        </Badge>
      </EmptyHeader>
    </Empty>
  );
}
