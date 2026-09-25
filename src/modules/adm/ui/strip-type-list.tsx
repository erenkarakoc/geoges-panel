"use client";

import { MoreHorizontalIcon, PlusIcon, RulerIcon } from "lucide-react";
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
import type { StripType } from "@/modules/adm/data/production-store";
import { useActionToast } from "@/platform/ui/feedback/use-action-toast";

/**
 * Steel strip types (SCR-190, REQ-ADM-003, TASK-0121).
 *
 * A type's code and section never change once it exists; its name and the lengths it comes in do.
 * Installation offers only these lengths (REQ-ADM-003), which is why they live here and not on the
 * daily log.
 */

type Result = { error: string | null };

export type StripTypeActions = {
  add: (input: {
    code: string;
    name: string;
    widthMm: string;
    thicknessMm: string;
    holeCount: string;
    lengths: string;
  }) => Promise<Result>;
  change: (
    id: string,
    change: { name?: string; lengths?: string; status?: "active" | "passive" },
  ) => Promise<Result>;
};

const number = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 3 });

const EMPTY_FORM = {
  code: "",
  holeCount: "0",
  lengths: "",
  name: "",
  thicknessMm: "",
  widthMm: "",
};

export function StripTypeList({
  strips,
  canManage,
  actions,
}: {
  strips: readonly StripType[];
  canManage: boolean;
  actions: StripTypeActions;
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<StripType | null>(null);
  const [edit, setEdit] = useState({ lengths: "", name: "" });
  const [form, setForm] = useState(EMPTY_FORM);
  const [result, setResult] = useState<Result | null>(null);
  const [pending, start] = useTransition();

  useActionToast(result ?? {}, result?.error ? { type: "error", title: result.error } : null);

  const run = (work: () => Promise<Result>, done: () => void) =>
    start(async () => {
      const said = await work();
      setResult(said);
      if (!said.error) {
        done();
        router.refresh();
      }
    });

  const openEdit = (strip: StripType) => {
    setEditing(strip);
    setEdit({
      lengths: strip.standardLengthsM.map((length) => number.format(length)).join("; "),
      name: strip.name,
    });
  };

  const addButton = canManage ? (
    <Button onClick={() => setAdding(true)}>
      <PlusIcon aria-hidden="true" />
      Şerit tipi ekle
    </Button>
  ) : null;

  const menu = (strip: StripType) =>
    canManage ? (
      <Menu>
        <MenuTrigger
          render={<Button aria-label="Tanım işlemleri" size="icon-sm" variant="ghost" />}
        >
          <MoreHorizontalIcon aria-hidden="true" />
        </MenuTrigger>
        <MenuPopup align="end">
          <MenuItem onClick={() => openEdit(strip)}>Adını ve boylarını değiştir</MenuItem>
          <MenuItem
            onClick={() =>
              run(
                () =>
                  actions.change(strip.id, {
                    status: strip.status === "active" ? "passive" : "active",
                  }),
                () => undefined,
              )
            }
          >
            {strip.status === "active" ? "Pasifleştir" : "Etkinleştir"}
          </MenuItem>
        </MenuPopup>
      </Menu>
    ) : null;

  return (
    <>
      {strips.length === 0 ? (
        <Empty className="flex-1">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <RulerIcon aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle aria-level={2} role="heading">
              Bu listede kalem yok
            </EmptyTitle>
            <EmptyDescription>
              Şerit montajında yalnız burada tanımlı tipler ve boylar seçilebilir.
            </EmptyDescription>
          </EmptyHeader>
          {addButton ? <EmptyContent>{addButton}</EmptyContent> : null}
        </Empty>
      ) : (
        <Frame className="w-full">
          <FrameHeader className="flex-row items-start justify-between gap-3">
            <div className="flex min-w-0 flex-col">
              <FrameTitle>Çelik şerit tipleri</FrameTitle>
              <FrameDescription>
                Kesit eklendikten sonra değişmez; standart boylar sonradan da eklenebilir.
              </FrameDescription>
            </div>
            {addButton}
          </FrameHeader>
          <FramePanel>
            <ul className="flex flex-col gap-2 lg:hidden">
              {strips.map((strip) => (
                <li className="flex items-start gap-3 rounded-lg border p-3" key={strip.id}>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="font-medium">
                      {strip.code} · {strip.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {number.format(strip.widthMm)} × {number.format(strip.thicknessMm)} mm ·{" "}
                      {strip.holeCount} delik · boylar:{" "}
                      {strip.standardLengthsM.length
                        ? strip.standardLengthsM.map((l) => `${number.format(l)} m`).join(", ")
                        : "tanımsız"}
                    </span>
                    <State status={strip.status} />
                  </div>
                  {menu(strip)}
                </li>
              ))}
            </ul>

            <Table className="hidden lg:table">
              <TableHeader>
                <TableRow>
                  <TableHead>Kod</TableHead>
                  <TableHead>Ad</TableHead>
                  <TableHead>Kesit</TableHead>
                  <TableHead>Delik</TableHead>
                  <TableHead>Standart boylar</TableHead>
                  <TableHead>Durum</TableHead>
                  {canManage ? <TableHead className="w-12" /> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {strips.map((strip) => (
                  <TableRow key={strip.id}>
                    <TableCell className="font-medium">{strip.code}</TableCell>
                    <TableCell>{strip.name}</TableCell>
                    <TableCell className="tabular-nums">
                      {number.format(strip.widthMm)} × {number.format(strip.thicknessMm)} mm
                    </TableCell>
                    <TableCell className="tabular-nums">{strip.holeCount}</TableCell>
                    <TableCell>
                      {strip.standardLengthsM.length
                        ? strip.standardLengthsM.map((l) => `${number.format(l)} m`).join(", ")
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <State status={strip.status} />
                    </TableCell>
                    {canManage ? <TableCell>{menu(strip)}</TableCell> : null}
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
            <DialogTitle>Şerit tipi ekle</DialogTitle>
            <DialogDescription>
              Kod ve kesit eklendikten sonra değişmez; farklı kesit yeni bir tiptir.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 px-4 pb-2 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="strip-code">Kod</FieldLabel>
              <Input
                id="strip-code"
                onChange={(event) => setForm({ ...form, code: event.currentTarget.value })}
                placeholder="40x4"
                value={form.code}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="strip-name">Ad</FieldLabel>
              <Input
                id="strip-name"
                onChange={(event) => setForm({ ...form, name: event.currentTarget.value })}
                placeholder="40×4 galvaniz şerit"
                value={form.name}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="strip-width">Genişlik (mm)</FieldLabel>
              <Input
                id="strip-width"
                inputMode="decimal"
                onChange={(event) => setForm({ ...form, widthMm: event.currentTarget.value })}
                value={form.widthMm}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="strip-thickness">Kalınlık (mm)</FieldLabel>
              <Input
                id="strip-thickness"
                inputMode="decimal"
                onChange={(event) => setForm({ ...form, thicknessMm: event.currentTarget.value })}
                value={form.thicknessMm}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="strip-holes">Delik sayısı</FieldLabel>
              <Input
                id="strip-holes"
                inputMode="numeric"
                onChange={(event) => setForm({ ...form, holeCount: event.currentTarget.value })}
                value={form.holeCount}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="strip-lengths">Standart boylar (metre)</FieldLabel>
              <Input
                id="strip-lengths"
                onChange={(event) => setForm({ ...form, lengths: event.currentTarget.value })}
                placeholder="3; 6; 12"
                value={form.lengths}
              />
              <FieldDescription>Boyları noktalı virgülle ayırın.</FieldDescription>
            </Field>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="ghost" />}>Vazgeç</DialogClose>
            <Button
              loading={pending}
              onClick={() =>
                run(
                  () => actions.add(form),
                  () => {
                    setAdding(false);
                    setForm(EMPTY_FORM);
                  },
                )
              }
            >
              Ekle
            </Button>
          </DialogFooter>
        </DialogPopup>
      </Dialog>

      <Dialog
        onOpenChange={(open) => (open ? undefined : setEditing(null))}
        open={Boolean(editing)}
      >
        <DialogPopup>
          <DialogHeader>
            <DialogTitle>Adını ve boylarını değiştir</DialogTitle>
            <DialogDescription>
              {editing ? `${editing.code} kodlu tipin kesiti aynı kalır.` : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 px-4 pb-2">
            <Field>
              <FieldLabel htmlFor="strip-edit-name">Ad</FieldLabel>
              <Input
                id="strip-edit-name"
                onChange={(event) => setEdit({ ...edit, name: event.currentTarget.value })}
                value={edit.name}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="strip-edit-lengths">Standart boylar (metre)</FieldLabel>
              <Input
                id="strip-edit-lengths"
                onChange={(event) => setEdit({ ...edit, lengths: event.currentTarget.value })}
                value={edit.lengths}
              />
              <FieldDescription>Boyları noktalı virgülle ayırın.</FieldDescription>
            </Field>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="ghost" />}>Vazgeç</DialogClose>
            <Button
              loading={pending}
              onClick={() =>
                editing
                  ? run(
                      () => actions.change(editing.id, { lengths: edit.lengths, name: edit.name }),
                      () => setEditing(null),
                    )
                  : undefined
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

function State({ status }: { status: "active" | "passive" }) {
  return status === "active" ? (
    <Badge variant="success">Kullanımda</Badge>
  ) : (
    <Badge variant="secondary">Pasif</Badge>
  );
}
