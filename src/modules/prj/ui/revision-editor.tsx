"use client";

import { ChevronLeftIcon, MoreHorizontalIcon, PlusIcon, SendIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Field, FieldLabel } from "@/components/ui/field";
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
import type {
  DiffLine,
  Revision,
  RevisionWall,
  TargetKind,
  WallTarget,
} from "@/modules/prj/data/revision-store";
import { REVISION_STATUS_LABELS, TARGET_KIND_LABELS } from "@/modules/prj/domain/revision";
import { targetAmount, targetSubject, type TargetNames } from "@/modules/prj/ui/target-text";
import { ChoiceField, type Choice } from "@/platform/ui/form/choice-field";
import { useActionToast } from "@/platform/ui/feedback/use-action-toast";
import { BarList } from "@/platform/ui/chart/chart";

/**
 * Proje revizyonu ve duvar hedefleri (SCR-024, TASK-0123 step 2, REQ-PRJ-006…009).
 *
 * A draft is the only thing that changes: walls, their size and their targets. Sending it hands
 * it to the approval flow; an approved revision is read here, never edited (D-136). What the
 * revision changes against the one it was based on is shown side by side (REQ-PRJ-009).
 */

type Result = { error: string | null; id?: string | null };

type WallForm = { code: string; name: string; siteId: string; lengthM: string; heightM: string };
type TargetForm = {
  kind: TargetKind;
  typeId: string;
  stripLengthM: string;
  amount: string;
};

export type RevisionEditorActions = {
  addWall: (value: WallForm) => Promise<Result>;
  changeWall: (wallId: string, value: WallForm) => Promise<Result>;
  removeWall: (wallId: string) => Promise<Result>;
  setTarget: (value: Record<string, unknown>) => Promise<Result>;
  removeTarget: (targetId: string) => Promise<Result>;
  submit: () => Promise<Result>;
  recall: () => Promise<Result>;
};

const EMPTY_WALL: WallForm = { code: "", heightM: "", lengthM: "", name: "", siteId: "" };
const EMPTY_TARGET: TargetForm = { amount: "", kind: "panel", stripLengthM: "", typeId: "" };
const number = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 3 });
const day = new Intl.DateTimeFormat("tr-TR", { dateStyle: "long" });

export function RevisionEditor({
  projectId,
  projectName,
  revision,
  walls,
  targets,
  diff,
  names,
  sites,
  choices,
  canEdit,
  actions,
}: {
  projectId: string;
  projectName: string;
  revision: Revision;
  walls: readonly RevisionWall[];
  targets: readonly WallTarget[];
  diff: readonly DiffLine[];
  names: TargetNames;
  sites: readonly Choice[];
  choices: {
    panels: readonly { id: string; name: string }[];
    strips: readonly { id: string; name: string; lengths: readonly number[] }[];
    workItems: readonly { id: string; name: string }[];
  };
  canEdit: boolean;
  actions: RevisionEditorActions;
}) {
  const router = useRouter();
  const [wallDialog, setWallDialog] = useState<{ wallId: string | null } | null>(null);
  const [wall, setWall] = useState<WallForm>(EMPTY_WALL);
  const [targetFor, setTargetFor] = useState<string | null>(null);
  const [target, setTarget] = useState<TargetForm>(EMPTY_TARGET);
  const [result, setResult] = useState<Result | null>(null);
  const [pending, start] = useTransition();
  useActionToast(result ?? {}, result?.error ? { type: "error", title: result.error } : null);

  const draft = revision.status === "draft";
  const editable = canEdit && draft;
  const wallName = new Map(walls.map((one) => [one.wallId, `${one.code} · ${one.name}`]));
  const siteName = new Map(sites.map((one) => [one.value, one.label]));

  const run = (work: () => Promise<Result>, done: () => void = () => undefined) =>
    start(async () => {
      const said = await work();
      setResult(said);
      if (!said.error) {
        done();
        router.refresh();
      }
    });

  const openWall = (one: RevisionWall | null) => {
    setWall(
      one
        ? {
            code: one.code,
            heightM: one.heightM === null ? "" : number.format(one.heightM),
            lengthM: one.lengthM === null ? "" : number.format(one.lengthM),
            name: one.name,
            siteId: one.siteId,
          }
        : { ...EMPTY_WALL, siteId: sites.length === 1 ? sites[0].value : "" },
    );
    setWallDialog({ wallId: one?.wallId ?? null });
  };

  const typeItems: Choice[] =
    target.kind === "panel"
      ? choices.panels.map((one) => ({ label: one.name, value: one.id }))
      : target.kind === "strip"
        ? choices.strips.map((one) => ({ label: one.name, value: one.id }))
        : choices.workItems.map((one) => ({ label: one.name, value: one.id }));
  const lengths = choices.strips.find((one) => one.id === target.typeId)?.lengths ?? [];

  const saveTarget = () => {
    if (!targetFor) return;
    const common = { kind: target.kind, wallId: targetFor };
    const value =
      target.kind === "panel"
        ? { ...common, panelTypeId: target.typeId, qty: target.amount }
        : target.kind === "strip"
          ? {
              ...common,
              lengthM: target.amount,
              stripLengthM: target.stripLengthM,
              stripTypeId: target.typeId,
            }
          : { ...common, qty: target.amount, workItemId: target.typeId };
    run(
      () => actions.setTarget(value),
      () => setTargetFor(null),
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <Button
        className="self-start"
        render={<Link href={`/projects/${projectId}`} />}
        size="sm"
        variant="ghost"
      >
        <ChevronLeftIcon aria-hidden="true" />
        {projectName}
      </Button>

      <header className="flex flex-wrap items-start gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h1 className="flex items-center gap-2 text-xl font-semibold">
            Rev.{revision.revisionNo}
            <Badge variant={revision.status === "approved" ? "success" : "outline"}>
              {REVISION_STATUS_LABELS[revision.status]}
            </Badge>
          </h1>
          <p className="text-sm text-muted-foreground">
            {revision.reason}
            {revision.validFrom
              ? ` · ${day.format(new Date(`${revision.validFrom}T12:00:00`))} tarihinden geçerli`
              : ""}
          </p>
        </div>
        {editable ? (
          <div className="flex flex-wrap gap-2">
            <Button className="max-md:h-11" onClick={() => openWall(null)} variant="outline">
              <PlusIcon aria-hidden="true" />
              Duvar ekle
            </Button>
            <Button
              className="max-md:h-11"
              disabled={walls.length === 0}
              loading={pending}
              onClick={() => run(actions.submit)}
            >
              <SendIcon aria-hidden="true" />
              Onaya gönder
            </Button>
          </div>
        ) : null}
        {canEdit && revision.status === "submitted" ? (
          <Button
            className="max-md:h-11"
            loading={pending}
            onClick={() => run(actions.recall)}
            variant="outline"
          >
            Geri çek
          </Button>
        ) : null}
      </header>

      {revision.status === "submitted" ? (
        <Alert variant="info">
          <AlertTitle>Onayda</AlertTitle>
          <AlertDescription>
            Revizyon onay akışında; karar Onay Merkezi’nde verilir. Onaylanırsa o günden geçerli
            olur.
          </AlertDescription>
        </Alert>
      ) : null}
      {draft && revision.returnedNote ? (
        <Alert variant="warning">
          <AlertTitle>Düzeltmeye döndü</AlertTitle>
          <AlertDescription>{revision.returnedNote}</AlertDescription>
        </Alert>
      ) : null}

      {walls.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle aria-level={2} role="heading">
              Bu revizyonda duvar yok
            </EmptyTitle>
            <EmptyDescription>
              Her duvar projenin bir şantiyesine bağlanır; hedefleri duvar bazında girilir, proje
              hedefi duvarların toplamıdır.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        walls.map((one) => {
          const lines = targets.filter((line) => line.wallId === one.wallId);
          return (
            <Frame key={one.wallId}>
              <FrameHeader className="flex-row items-start justify-between gap-3">
                <div className="flex min-w-0 flex-col gap-1">
                  <FrameTitle>
                    {one.code} · {one.name}
                  </FrameTitle>
                  <FrameDescription>
                    {[
                      siteName.get(one.siteId),
                      one.lengthM ? `${number.format(one.lengthM)} m uzunluk` : null,
                      one.heightM ? `${number.format(one.heightM)} m yükseklik` : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </FrameDescription>
                </div>
                {editable ? (
                  <div className="flex shrink-0 gap-1">
                    <Button
                      className="max-md:h-11"
                      onClick={() => {
                        setTarget(EMPTY_TARGET);
                        setTargetFor(one.wallId);
                      }}
                      size="sm"
                      variant="outline"
                    >
                      <PlusIcon aria-hidden="true" />
                      Hedef
                    </Button>
                    <Menu>
                      <MenuTrigger
                        render={
                          <Button
                            aria-label="Duvar işlemleri"
                            className="max-md:size-11"
                            size="icon-sm"
                            variant="ghost"
                          />
                        }
                      >
                        <MoreHorizontalIcon aria-hidden="true" />
                      </MenuTrigger>
                      <MenuPopup align="end">
                        <MenuItem onClick={() => openWall(one)}>Düzenle</MenuItem>
                        <MenuItem onClick={() => run(() => actions.removeWall(one.wallId))}>
                          Bu revizyondan çıkar
                        </MenuItem>
                      </MenuPopup>
                    </Menu>
                  </div>
                ) : null}
              </FrameHeader>
              <FramePanel>
                {lines.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Bu duvarın hedefi yok.</p>
                ) : (
                  <ul className="divide-y">
                    {lines.map((line) => (
                      <li className="flex items-center gap-3 py-2 text-sm" key={line.id}>
                        <span className="min-w-0 flex-1">{targetSubject(line, names)}</span>
                        <span className="shrink-0 tabular-nums">
                          {targetAmount(
                            line,
                            line.kind === "strip" ? line.lengthM : line.qty,
                            names,
                          )}
                        </span>
                        {editable ? (
                          <Button
                            aria-label="Hedef satırını sil"
                            className="max-md:size-11"
                            onClick={() => run(() => actions.removeTarget(line.id))}
                            size="icon-sm"
                            variant="ghost"
                          >
                            <Trash2Icon aria-hidden="true" />
                          </Button>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
              </FramePanel>
            </Frame>
          );
        })
      )}

      <Frame>
        <FrameHeader>
          <FrameTitle>
            {revision.basedOnRevisionId
              ? "Önceki revizyona göre farklar"
              : "Bu revizyonun hedefleri"}
          </FrameTitle>
          <FrameDescription>
            Panel tipi ve duvar bazında, önceki ve yeni hedef yan yana.
          </FrameDescription>
        </FrameHeader>
        <FramePanel>
          {diff.length === 0 ? (
            <p className="text-sm text-muted-foreground">Fark yok.</p>
          ) : (
            <>
              {diff.some((line) => line.kind === "panel") ? (
                <BarList
                  className="mb-4"
                  label="Panel hedefi farkı, duvar ve tipe göre (adet)"
                  rows={diff
                    .filter((line) => line.kind === "panel")
                    .map((line, index) => ({
                      key: String(index),
                      label: `${wallName.get(line.wallId) ?? "Çıkarılan duvar"} · ${targetSubject(line, names)}`,
                      valueText: revision.basedOnRevisionId
                        ? [
                            targetAmount(line, line.before, names),
                            targetAmount(line, line.after, names),
                          ]
                        : [targetAmount(line, line.after, names)],
                      values: revision.basedOnRevisionId ? [line.before, line.after] : [line.after],
                    }))}
                  series={revision.basedOnRevisionId ? ["Önceki", "Yeni"] : undefined}
                />
              ) : null}
              <ul className="flex flex-col gap-2 lg:hidden">
                {diff.map((line, index) => (
                  <li className="flex flex-col gap-0.5 rounded-lg border p-3 text-sm" key={index}>
                    <span className="font-medium">
                      {wallName.get(line.wallId) ?? "Çıkarılan duvar"}
                    </span>
                    <span>{targetSubject(line, names)}</span>
                    <span className="text-muted-foreground">
                      {targetAmount(line, line.before, names)} →{" "}
                      {targetAmount(line, line.after, names)}
                    </span>
                  </li>
                ))}
              </ul>
              <Table className="hidden lg:table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Duvar</TableHead>
                    <TableHead>Kalem</TableHead>
                    <TableHead>Önceki</TableHead>
                    <TableHead>Yeni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {diff.map((line, index) => (
                    <TableRow key={index}>
                      <TableCell>{wallName.get(line.wallId) ?? "Çıkarılan duvar"}</TableCell>
                      <TableCell>{targetSubject(line, names)}</TableCell>
                      <TableCell className="tabular-nums">
                        {targetAmount(line, line.before, names)}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {targetAmount(line, line.after, names)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
        </FramePanel>
      </Frame>

      <Dialog
        onOpenChange={(open) => (open ? undefined : setWallDialog(null))}
        open={Boolean(wallDialog)}
      >
        <DialogPopup>
          <DialogHeader>
            <DialogTitle>{wallDialog?.wallId ? "Duvarı düzenle" : "Duvar ekle"}</DialogTitle>
            <DialogDescription>
              Duvar projenin bir şantiyesine bağlanır. Ölçüler bu revizyona aittir.
            </DialogDescription>
          </DialogHeader>
          <DialogPanel className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="wall-code">Kod</FieldLabel>
              <Input
                disabled={Boolean(wallDialog?.wallId)}
                id="wall-code"
                onChange={(event) => setWall({ ...wall, code: event.currentTarget.value })}
                placeholder="D1"
                value={wall.code}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="wall-name">Ad</FieldLabel>
              <Input
                id="wall-name"
                onChange={(event) => setWall({ ...wall, name: event.currentTarget.value })}
                placeholder="Kötekli Duvar 1 Sağ"
                value={wall.name}
              />
            </Field>
            <ChoiceField
              className="sm:col-span-2"
              items={sites}
              label="Şantiye"
              onChange={(picked) => setWall({ ...wall, siteId: picked })}
              placeholder="Şantiye seçin"
              value={wall.siteId}
            />
            <Field>
              <FieldLabel htmlFor="wall-length">Uzunluk (m)</FieldLabel>
              <Input
                id="wall-length"
                inputMode="decimal"
                onChange={(event) => setWall({ ...wall, lengthM: event.currentTarget.value })}
                value={wall.lengthM}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="wall-height">Yükseklik (m)</FieldLabel>
              <Input
                id="wall-height"
                inputMode="decimal"
                onChange={(event) => setWall({ ...wall, heightM: event.currentTarget.value })}
                value={wall.heightM}
              />
            </Field>
          </DialogPanel>
          <DialogFooter>
            <DialogClose render={<Button variant="ghost" />}>Vazgeç</DialogClose>
            <Button
              disabled={!wall.code.trim() || !wall.name.trim() || !wall.siteId}
              loading={pending}
              onClick={() =>
                run(
                  () =>
                    wallDialog?.wallId
                      ? actions.changeWall(wallDialog.wallId, wall)
                      : actions.addWall(wall),
                  () => setWallDialog(null),
                )
              }
            >
              Kaydet
            </Button>
          </DialogFooter>
        </DialogPopup>
      </Dialog>

      <Dialog
        onOpenChange={(open) => (open ? undefined : setTargetFor(null))}
        open={Boolean(targetFor)}
      >
        <DialogPopup>
          <DialogHeader>
            <DialogTitle>Hedef ekle</DialogTitle>
            <DialogDescription>
              {targetFor ? wallName.get(targetFor) : ""}. Aynı satır yeniden girilirse miktarı
              değişir.
            </DialogDescription>
          </DialogHeader>
          <DialogPanel className="grid gap-4 sm:grid-cols-2">
            <ChoiceField
              items={(Object.keys(TARGET_KIND_LABELS) as TargetKind[]).map((kind) => ({
                label: TARGET_KIND_LABELS[kind],
                value: kind,
              }))}
              label="Hedef türü"
              onChange={(picked) => setTarget({ ...EMPTY_TARGET, kind: picked as TargetKind })}
              value={target.kind}
            />
            <ChoiceField
              items={typeItems}
              label={target.kind === "work_item" ? "İş kalemi" : "Tip"}
              onChange={(picked) => setTarget({ ...target, stripLengthM: "", typeId: picked })}
              placeholder="Seçin"
              value={target.typeId}
            />
            {target.kind === "strip" ? (
              <ChoiceField
                description={lengths.length ? undefined : "Bu tipin standart boyu tanımlı değil."}
                items={lengths.map((length) => ({
                  label: `${number.format(length)} m`,
                  value: String(length),
                }))}
                label="Boy"
                onChange={(picked) => setTarget({ ...target, stripLengthM: picked })}
                placeholder="Boy seçin"
                value={target.stripLengthM}
              />
            ) : null}
            <Field>
              <FieldLabel htmlFor="target-amount">
                {target.kind === "panel"
                  ? "Adet"
                  : target.kind === "strip"
                    ? "Metraj (m)"
                    : "Miktar"}
              </FieldLabel>
              <Input
                id="target-amount"
                inputMode="decimal"
                onChange={(event) => setTarget({ ...target, amount: event.currentTarget.value })}
                value={target.amount}
              />
            </Field>
          </DialogPanel>
          <DialogFooter>
            <DialogClose render={<Button variant="ghost" />}>Vazgeç</DialogClose>
            <Button
              disabled={!target.typeId || !target.amount.trim()}
              loading={pending}
              onClick={saveTarget}
            >
              Kaydet
            </Button>
          </DialogFooter>
        </DialogPopup>
      </Dialog>
    </div>
  );
}
