"use client";

import { MapPinnedIcon, MoreHorizontalIcon, PlusIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

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
import { WORK_MODEL_LABELS, WORK_MODELS, type WorkModel } from "@/modules/sit/domain/site";
import { ChoiceField, NONE, type Choice } from "@/platform/ui/form/choice-field";
import { useActionToast } from "@/platform/ui/feedback/use-action-toast";
import { ProvinceField } from "@/platform/ui/form/province-field";

/**
 * A project's sites, on the project card (TASK-0123 step 1, REQ-PRJ-001, D-138). A site is opened
 * inside its project and never moves; a wrongly opened one turns passive (D-292 rule 3).
 */

type Result = { error: string | null; id?: string | null };

type SiteRow = {
  id: string;
  code: string | null;
  name: string;
  workModel: WorkModel;
  subcontractorPartyId: string | null;
  coordinatorUserId: string | null;
  entryOwnerUserId: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  status: "active" | "passive";
};

export type SiteFormValue = {
  name: string;
  code: string;
  workModel: WorkModel;
  subcontractorPartyId: string;
  coordinatorUserId: string;
  entryOwnerUserId: string;
  city: string;
  latitude: string;
  longitude: string;
};

const EMPTY_SITE: SiteFormValue = {
  city: "",
  code: "",
  coordinatorUserId: "",
  entryOwnerUserId: "",
  latitude: "",
  longitude: "",
  name: "",
  subcontractorPartyId: "",
  workModel: "in_house",
};

export type ProjectSitesActions = {
  open: (value: SiteFormValue) => Promise<Result>;
  change: (siteId: string, value: SiteFormValue) => Promise<Result>;
  setStatus: (siteId: string, status: "active" | "passive") => Promise<Result>;
};

export function ProjectSites({
  sites,
  canManage,
  subcontractors,
  people,
  actions,
}: {
  sites: readonly SiteRow[];
  canManage: boolean;
  subcontractors: readonly Choice[];
  people: readonly Choice[];
  actions: ProjectSitesActions;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<SiteFormValue>(EMPTY_SITE);
  const [result, setResult] = useState<Result | null>(null);
  const [pending, start] = useTransition();

  useActionToast(result ?? {}, result?.error ? { type: "error", title: result.error } : null);

  const person = new Map(people.map((one) => [one.value, one.label]));
  const set = (patch: Partial<SiteFormValue>) => setForm({ ...form, ...patch });

  const run = (work: () => Promise<Result>, done: () => void) =>
    start(async () => {
      const said = await work();
      setResult(said);
      if (!said.error) {
        done();
        router.refresh();
      }
    });

  const edit = (site: SiteRow | null) => {
    setEditing(site?.id ?? null);
    setForm(
      site
        ? {
            city: site.city ?? "",
            code: site.code ?? "",
            coordinatorUserId: site.coordinatorUserId ?? "",
            entryOwnerUserId: site.entryOwnerUserId ?? "",
            latitude: site.latitude === null ? "" : String(site.latitude),
            longitude: site.longitude === null ? "" : String(site.longitude),
            name: site.name,
            subcontractorPartyId: site.subcontractorPartyId ?? "",
            workModel: site.workModel,
          }
        : EMPTY_SITE,
    );
    setOpen(true);
  };

  const addButton = canManage ? (
    <Button className="max-md:h-11" onClick={() => edit(null)} size="sm">
      <PlusIcon aria-hidden="true" />
      Şantiye aç
    </Button>
  ) : null;

  return (
    <>
      {sites.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <MapPinnedIcon aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle aria-level={2} role="heading">
              Bu projede şantiye yok
            </EmptyTitle>
            <EmptyDescription>
              Günlük kayıt bir şantiyeye yazılır; aynı sahada iki ayrı sözleşme varsa iki şantiye
              açılır.
            </EmptyDescription>
          </EmptyHeader>
          {addButton ? <EmptyContent>{addButton}</EmptyContent> : null}
        </Empty>
      ) : (
        <Frame>
          <FrameHeader className="flex-row items-center justify-between gap-3">
            <FrameTitle>Şantiyeler</FrameTitle>
            {addButton}
          </FrameHeader>
          <FramePanel>
            <ul className="divide-y">
              {sites.map((site) => (
                <li className="flex items-start gap-3 py-3" key={site.id}>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <Link className="font-medium hover:underline" href={`/sites/${site.id}`}>
                      {site.name}
                    </Link>
                    <span className="text-xs text-muted-foreground">
                      {[
                        WORK_MODEL_LABELS[site.workModel],
                        site.coordinatorUserId
                          ? `Koordinatör: ${person.get(site.coordinatorUserId) ?? "—"}`
                          : null,
                        site.entryOwnerUserId
                          ? `Saha mühendisi: ${person.get(site.entryOwnerUserId) ?? "—"}`
                          : null,
                        site.city,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                    {site.status === "passive" ? (
                      <Badge className="self-start" variant="secondary">
                        Pasif
                      </Badge>
                    ) : null}
                  </div>
                  {canManage ? (
                    <Menu>
                      <MenuTrigger
                        render={
                          <Button aria-label="Şantiye işlemleri" size="icon-sm" variant="ghost" />
                        }
                      >
                        <MoreHorizontalIcon aria-hidden="true" />
                      </MenuTrigger>
                      <MenuPopup align="end">
                        <MenuItem onClick={() => edit(site)}>Düzenle</MenuItem>
                        <MenuItem
                          onClick={() =>
                            run(
                              () =>
                                actions.setStatus(
                                  site.id,
                                  site.status === "active" ? "passive" : "active",
                                ),
                              () => undefined,
                            )
                          }
                        >
                          {site.status === "active" ? "Pasifleştir" : "Yeniden kullanıma al"}
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

      <Dialog onOpenChange={setOpen} open={open}>
        <DialogPopup className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Şantiyeyi düzenle" : "Şantiye aç"}</DialogTitle>
            <DialogDescription>
              Şantiye bu projeye bağlıdır ve başka projeye taşınamaz.
            </DialogDescription>
          </DialogHeader>
          <DialogPanel className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="site-name">Şantiye adı</FieldLabel>
              <Input
                id="site-name"
                onChange={(event) => set({ name: event.currentTarget.value })}
                placeholder="Kavaklı A Blok"
                value={form.name}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="site-code">Kod (isteğe bağlı)</FieldLabel>
              <Input
                id="site-code"
                onChange={(event) => set({ code: event.currentTarget.value })}
                value={form.code}
              />
            </Field>
            <ChoiceField
              items={WORK_MODELS.map((model) => ({
                label: WORK_MODEL_LABELS[model],
                value: model,
              }))}
              label="İş modeli"
              onChange={(picked) => set({ workModel: picked as WorkModel })}
              value={form.workModel}
            />
            {form.workModel === "subcontracted" ? (
              <ChoiceField
                description="Taşeron rolü olan firmalar."
                items={subcontractors}
                label="Taşeron firma"
                onChange={(picked) => set({ subcontractorPartyId: picked })}
                placeholder="Firma seçin"
                value={form.subcontractorPartyId}
              />
            ) : (
              <div className="max-sm:hidden" />
            )}
            <ChoiceField
              items={[{ label: "Seçilmedi", value: NONE }, ...people]}
              label="Sorumlu koordinatör"
              onChange={(picked) => set({ coordinatorUserId: picked })}
              value={form.coordinatorUserId}
            />
            <ChoiceField
              description="Günlük kaydı gönderen kişi."
              items={[{ label: "Seçilmedi", value: NONE }, ...people]}
              label="Saha mühendisi"
              onChange={(picked) => set({ entryOwnerUserId: picked })}
              value={form.entryOwnerUserId}
            />
            <ProvinceField id="site-city" onChange={(city) => set({ city })} value={form.city} />
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="site-latitude">Enlem</FieldLabel>
                <Input
                  id="site-latitude"
                  inputMode="decimal"
                  onChange={(event) => set({ latitude: event.currentTarget.value })}
                  placeholder="41,38"
                  value={form.latitude}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="site-longitude">Boylam</FieldLabel>
                <Input
                  id="site-longitude"
                  inputMode="decimal"
                  onChange={(event) => set({ longitude: event.currentTarget.value })}
                  placeholder="33,78"
                  value={form.longitude}
                />
              </Field>
            </div>
            <p className="text-xs text-muted-foreground sm:col-span-2">
              Konum, günlük kayıttaki hava bilgisi için kullanılır; yoksa hava elle girilir.
            </p>
          </DialogPanel>
          <DialogFooter>
            <DialogClose render={<Button variant="ghost" />}>Vazgeç</DialogClose>
            <Button
              disabled={!form.name.trim()}
              loading={pending}
              onClick={() =>
                run(
                  () => (editing ? actions.change(editing, form) : actions.open(form)),
                  () => setOpen(false),
                )
              }
            >
              Kaydet
            </Button>
          </DialogFooter>
        </DialogPopup>
      </Dialog>
    </>
  );
}
