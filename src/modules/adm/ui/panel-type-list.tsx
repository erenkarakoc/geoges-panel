"use client";

import { MoreHorizontalIcon, PlusIcon, RulerIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  Autocomplete,
  AutocompleteEmpty,
  AutocompleteInput,
  AutocompleteItem,
  AutocompleteList,
  AutocompletePopup,
} from "@/components/ui/autocomplete";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
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
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import {
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/frame";
import { Input } from "@/components/ui/input";
import { Menu, MenuItem, MenuPopup, MenuTrigger } from "@/components/ui/menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { PanelType } from "@/modules/adm/data/production-store";
import { decimal, panelArea } from "@/modules/adm/domain/production";
import { useActionToast } from "@/platform/ui/feedback/use-action-toast";

/**
 * Panel types (SCR-190, REQ-ADM-002, TASK-0121).
 *
 * The area is shown, never asked: it is the width times the height, and the database computes it.
 * A type's code and size are fixed once it exists — a different size is a new type — so the only
 * things a row offers to change are its name and whether it is still in use.
 */

type Result = { error: string | null };

export type PanelTypeActions = {
  add: (input: {
    code: string;
    name: string;
    widthM: string;
    heightM: string;
    series: string;
    step: string;
  }) => Promise<Result>;
  change: (id: string, change: { name?: string; status?: "active" | "passive" }) => Promise<Result>;
};

const number = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 4 });

export function PanelTypeList({
  panels,
  canManage,
  actions,
}: {
  panels: readonly PanelType[];
  canManage: boolean;
  actions: PanelTypeActions;
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [renaming, setRenaming] = useState<PanelType | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [pending, start] = useTransition();
  const [form, setForm] = useState({
    code: "",
    heightM: "",
    name: "",
    series: "",
    step: "",
    widthM: "",
  });
  const [newName, setNewName] = useState("");
  // Series already in use, offered so one series is not typed three ways.
  const seriesNames = [
    ...new Set(panels.map((panel) => panel.series).filter((series): series is string => !!series)),
  ].sort((a, b) => a.localeCompare(b, "tr"));

  useActionToast(result ?? {}, result?.error ? { type: "error", title: result.error } : null);

  const width = decimal(form.widthM);
  const height = decimal(form.heightM);
  const area = width > 0 && height > 0 ? number.format(panelArea(width, height)) : null;

  const submit = () =>
    start(async () => {
      const said = await actions.add(form);
      setResult(said);
      if (!said.error) {
        setAdding(false);
        setForm({ code: "", heightM: "", name: "", series: "", step: "", widthM: "" });
        router.refresh();
      }
    });

  const change = (id: string, patch: { name?: string; status?: "active" | "passive" }) =>
    start(async () => {
      const said = await actions.change(id, patch);
      setResult(said);
      if (!said.error) {
        setRenaming(null);
        router.refresh();
      }
    });

  const addButton = canManage ? (
    <Button onClick={() => setAdding(true)}>
      <PlusIcon aria-hidden="true" />
      Panel tipi ekle
    </Button>
  ) : null;

  return (
    <>
      {panels.length === 0 ? (
        <Empty className="flex-1">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <RulerIcon aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle aria-level={2} role="heading">
              Bu listede kalem yok
            </EmptyTitle>
            <EmptyDescription>
              Döküm ve montaj satırları panel tiplerinden kurulur; ilk tipi ekleyerek başlayın.
            </EmptyDescription>
          </EmptyHeader>
          {addButton ? <EmptyContent>{addButton}</EmptyContent> : null}
        </Empty>
      ) : (
        <Frame className="w-full">
          <FrameHeader className="flex-row items-start justify-between gap-3">
            <div className="flex min-w-0 flex-col">
              <FrameTitle>Panel tipleri</FrameTitle>
              <FrameDescription>
                m² en ve boydan hesaplanır. Kullanılan bir tipin ölçüsü değişmez; farklı ölçü yeni
                bir tiptir.
              </FrameDescription>
            </div>
            {addButton}
          </FrameHeader>
          <FramePanel>
            <ul className="flex flex-col gap-2 lg:hidden">
              {panels.map((panel) => (
                <li className="flex items-start gap-3 rounded-lg border p-3" key={panel.id}>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="font-medium">
                      {panel.code} · {panel.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {number.format(panel.widthM)} × {number.format(panel.heightM)} m ·{" "}
                      {number.format(panel.areaM2)} m²
                      {panel.series ? ` · ${panel.series} ${panel.step}. kademe` : ""}
                    </span>
                    <State status={panel.status} />
                  </div>
                  {canManage ? (
                    <RowMenu
                      onRename={() => {
                        setRenaming(panel);
                        setNewName(panel.name);
                      }}
                      onToggle={() =>
                        change(panel.id, {
                          status: panel.status === "active" ? "passive" : "active",
                        })
                      }
                      status={panel.status}
                    />
                  ) : null}
                </li>
              ))}
            </ul>

            <Table className="hidden lg:table">
              <TableHeader>
                <TableRow>
                  <TableHead>Kod</TableHead>
                  <TableHead>Ad</TableHead>
                  <TableHead>En × boy</TableHead>
                  <TableHead>m²</TableHead>
                  <TableHead>Seri</TableHead>
                  <TableHead>Durum</TableHead>
                  {canManage ? <TableHead className="w-12" /> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {panels.map((panel) => (
                  <TableRow key={panel.id}>
                    <TableCell className="font-medium">{panel.code}</TableCell>
                    <TableCell>{panel.name}</TableCell>
                    <TableCell className="tabular-nums">
                      {number.format(panel.widthM)} × {number.format(panel.heightM)} m
                    </TableCell>
                    <TableCell className="tabular-nums">{number.format(panel.areaM2)}</TableCell>
                    <TableCell>
                      {panel.series ? `${panel.series} · ${panel.step}. kademe` : "—"}
                    </TableCell>
                    <TableCell>
                      <State status={panel.status} />
                    </TableCell>
                    {canManage ? (
                      <TableCell>
                        <RowMenu
                          onRename={() => {
                            setRenaming(panel);
                            setNewName(panel.name);
                          }}
                          onToggle={() =>
                            change(panel.id, {
                              status: panel.status === "active" ? "passive" : "active",
                            })
                          }
                          status={panel.status}
                        />
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </FramePanel>
        </Frame>
      )}

      <Dialog onOpenChange={setAdding} open={adding}>
        <DialogPopup>
          <DialogHeader>
            <DialogTitle>Panel tipi ekle</DialogTitle>
            <DialogDescription>
              Kod ve ölçü eklendikten sonra değişmez; adını sonra da değiştirebilirsiniz.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 px-4 pb-2 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="panel-code">Kod</FieldLabel>
              <Input
                id="panel-code"
                onChange={(event) => setForm({ ...form, code: event.currentTarget.value })}
                placeholder="P-150"
                value={form.code}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="panel-name">Ad</FieldLabel>
              <Input
                id="panel-name"
                onChange={(event) => setForm({ ...form, name: event.currentTarget.value })}
                placeholder="150'lik panel"
                value={form.name}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="panel-width">En (metre)</FieldLabel>
              <Input
                id="panel-width"
                inputMode="decimal"
                onChange={(event) => setForm({ ...form, widthM: event.currentTarget.value })}
                placeholder="1,50"
                value={form.widthM}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="panel-height">Boy (metre)</FieldLabel>
              <Input
                id="panel-height"
                inputMode="decimal"
                onChange={(event) => setForm({ ...form, heightM: event.currentTarget.value })}
                placeholder="1,50"
                value={form.heightM}
              />
              <FieldDescription>
                {area ? `Bir panel ${area} m² olur.` : "m² en ve boydan hesaplanır."}
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="panel-series">Seri (isteğe bağlı)</FieldLabel>
              <Autocomplete
                items={seriesNames}
                onValueChange={(series: string) => setForm({ ...form, series })}
                value={form.series}
              >
                <AutocompleteInput id="panel-series" placeholder="Standart" />
                {seriesNames.length > 0 ? (
                  <AutocompletePopup>
                    <AutocompleteEmpty>Yeni seri olarak eklenir.</AutocompleteEmpty>
                    <AutocompleteList>
                      {(item: string) => (
                        <AutocompleteItem key={item} value={item}>
                          {item}
                        </AutocompleteItem>
                      )}
                    </AutocompleteList>
                  </AutocompletePopup>
                ) : null}
              </Autocomplete>
              <FieldDescription>
                Var olan bir seriyi seçin; yeni bir seri adı da yazılabilir.
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="panel-step">Kademe</FieldLabel>
              <Input
                id="panel-step"
                inputMode="numeric"
                onChange={(event) => setForm({ ...form, step: event.currentTarget.value })}
                placeholder="3"
                value={form.step}
              />
              <FieldDescription>
                Fazla dökümde aynı serinin bir alt ve bir üst kademesi önerilir.
              </FieldDescription>
            </Field>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="ghost" />}>Vazgeç</DialogClose>
            <Button loading={pending} onClick={submit}>
              Ekle
            </Button>
          </DialogFooter>
        </DialogPopup>
      </Dialog>

      <Dialog
        onOpenChange={(open) => (open ? undefined : setRenaming(null))}
        open={Boolean(renaming)}
      >
        <DialogPopup>
          <DialogHeader>
            <DialogTitle>Adını değiştir</DialogTitle>
            <DialogDescription>
              {renaming ? `${renaming.code} kodlu tipin kodu ve ölçüsü aynı kalır.` : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="px-4 pb-2">
            <Field>
              <FieldLabel htmlFor="panel-rename">Ad</FieldLabel>
              <Input
                id="panel-rename"
                onChange={(event) => setNewName(event.currentTarget.value)}
                value={newName}
              />
            </Field>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="ghost" />}>Vazgeç</DialogClose>
            <Button
              disabled={!newName.trim()}
              loading={pending}
              onClick={() => (renaming ? change(renaming.id, { name: newName.trim() }) : undefined)}
            >
              Kaydet
            </Button>
          </DialogFooter>
        </DialogPopup>
      </Dialog>
    </>
  );
}

function State({ status }: { status: "active" | "passive" }) {
  return status === "active" ? (
    <Badge variant="success">Kullanımda</Badge>
  ) : (
    <Badge variant="secondary">Pasif</Badge>
  );
}

function RowMenu({
  status,
  onRename,
  onToggle,
}: {
  status: "active" | "passive";
  onRename: () => void;
  onToggle: () => void;
}) {
  return (
    <Menu>
      <MenuTrigger render={<Button aria-label="Tanım işlemleri" size="icon-sm" variant="ghost" />}>
        <MoreHorizontalIcon aria-hidden="true" />
      </MenuTrigger>
      <MenuPopup align="end">
        <MenuItem onClick={onRename}>Adını değiştir</MenuItem>
        <MenuItem onClick={onToggle}>
          {status === "active" ? "Pasifleştir" : "Etkinleştir"}
        </MenuItem>
      </MenuPopup>
    </Menu>
  );
}
