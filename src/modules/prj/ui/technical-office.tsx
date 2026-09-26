"use client";

import { ClipboardListIcon, MoreHorizontalIcon, PlusIcon } from "lucide-react";
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
import {
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/frame";
import { Input } from "@/components/ui/input";
import { Menu, MenuItem, MenuPopup, MenuSeparator, MenuTrigger } from "@/components/ui/menu";
import { Textarea } from "@/components/ui/textarea";
import type { OfficeItem } from "@/modules/prj/data/technical-office-store";
import {
  isOverdue,
  OFFICE_STATUS_LABELS,
  type OfficeStatus,
} from "@/modules/prj/domain/technical-office";
import { ShareBar } from "@/platform/ui/chart/chart";
import { REST, SERIES } from "@/platform/ui/chart/colors";
import { useActionToast } from "@/platform/ui/feedback/use-action-toast";
import { ChoiceField, NONE, type Choice } from "@/platform/ui/form/choice-field";

/**
 * Teknik ofis (SCR-023, TASK-0123 step 4, REQ-PRJ-005): the office's work on the project, each
 * with its kind, the person responsible, a due day and how many times it came back. A late item
 * says so here; the flow "Geciken teknik ofis işi" gives it to somebody as a task.
 */

type Result = { error: string | null };

export type OfficeFormValue = {
  typeItemId: string;
  title: string;
  assigneeUserId: string;
  dueOn: string;
  note: string;
};

export type OfficeActions = {
  add: (value: OfficeFormValue) => Promise<Result>;
  change: (id: string, value: OfficeFormValue) => Promise<Result>;
  move: (id: string, status: OfficeStatus) => Promise<Result>;
  revise: (id: string) => Promise<Result>;
};

const EMPTY: OfficeFormValue = {
  assigneeUserId: "",
  dueOn: "",
  note: "",
  title: "",
  typeItemId: "",
};
const dayText = new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeZone: "UTC" });
const dateOf = (day: string) => dayText.format(new Date(`${day}T00:00:00Z`));

const STATUS_BADGE: Record<OfficeStatus, "outline" | "secondary" | "success"> = {
  cancelled: "secondary",
  delivered: "success",
  in_progress: "outline",
  open: "outline",
};

export function TechnicalOffice({
  items,
  types,
  people,
  peopleNames,
  canManage,
  me,
  today,
  actions,
}: {
  items: readonly OfficeItem[];
  types: readonly { id: string; name: string; status: string }[];
  people: readonly Choice[];
  peopleNames: Readonly<Record<string, string>>;
  canManage: boolean;
  me: string;
  today: string;
  actions: OfficeActions;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<OfficeFormValue>(EMPTY);
  const [result, setResult] = useState<Result | null>(null);
  const [pending, start] = useTransition();

  useActionToast(result ?? {}, result?.error ? { type: "error", title: result.error } : null);

  const typeName = new Map(types.map((type) => [type.id, type.name]));
  const set = (patch: Partial<OfficeFormValue>) => setForm({ ...form, ...patch });

  const run = (work: () => Promise<Result>, done?: () => void) =>
    start(async () => {
      const said = await work();
      setResult(said);
      if (!said.error) {
        done?.();
        router.refresh();
      }
    });

  const edit = (item: OfficeItem | null) => {
    setEditing(item?.id ?? null);
    setForm(
      item
        ? {
            assigneeUserId: item.assigneeUserId ?? "",
            dueOn: item.dueOn ?? "",
            note: item.note ?? "",
            title: item.title,
            typeItemId: item.typeItemId,
          }
        : EMPTY,
    );
    setOpen(true);
  };

  const addButton = canManage ? (
    <Button className="max-md:h-11" onClick={() => edit(null)} size="sm">
      <PlusIcon aria-hidden="true" />
      İş ekle
    </Button>
  ) : null;

  const live = items.filter((item) => item.status !== "cancelled");
  const late = live.filter((item) => isOverdue(item, today)).length;
  const parts = [
    {
      color: SERIES[0],
      key: "delivered",
      label: "Teslim edildi",
      value: live.filter((i) => i.status === "delivered").length,
    },
    {
      color: `color-mix(in srgb, ${SERIES[0]} 45%, transparent)`,
      key: "in_progress",
      label: "Devam ediyor",
      value: live.filter((i) => i.status === "in_progress" && !isOverdue(i, today)).length,
    },
    {
      color: REST,
      key: "open",
      label: "Açık",
      value: live.filter((i) => i.status === "open" && !isOverdue(i, today)).length,
    },
    { color: "var(--destructive)", key: "late", label: "Gecikti", value: late },
  ];

  return (
    <>
      {items.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ClipboardListIcon aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle aria-level={2} role="heading">
              Teknik ofis işi yok
            </EmptyTitle>
            <EmptyDescription>
              Proje çizimi, statik hesap, metraj, kurum onayı gibi işler teslim tarihleriyle burada
              izlenir; geciken iş sorumlusuna görev olarak düşer.
            </EmptyDescription>
          </EmptyHeader>
          {addButton ? <EmptyContent>{addButton}</EmptyContent> : null}
        </Empty>
      ) : (
        <Frame>
          <FrameHeader className="flex-row items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <FrameTitle>Teknik ofis işleri</FrameTitle>
              <FrameDescription>
                Teslim tarihi geçen iş sorumlusuna görev olarak düşer (akış: “Geciken teknik ofis
                işi”).
              </FrameDescription>
            </div>
            {addButton}
          </FrameHeader>
          {live.length > 0 ? (
            <FramePanel>
              <ShareBar label="Teknik ofis işlerinin durumu" parts={parts} unit="iş" />
            </FramePanel>
          ) : null}
          <FramePanel>
            <ul className="divide-y">
              {items.map((item) => {
                const lateNow = isOverdue(item, today);
                const mine = item.assigneeUserId === me;
                const movable = canManage || mine;
                return (
                  <li className="flex items-start gap-3 py-3" key={item.id}>
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="text-sm font-medium">{item.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {[
                          typeName.get(item.typeItemId) ?? "Tanımsız tür",
                          item.assigneeUserId
                            ? (peopleNames[item.assigneeUserId] ?? "Bilinmeyen kişi")
                            : "Sorumlu yok",
                          item.dueOn ? `Teslim: ${dateOf(item.dueOn)}` : "Teslim tarihi yok",
                          item.deliveredOn ? `Teslim edildi: ${dateOf(item.deliveredOn)}` : null,
                          item.revisionCount > 0 ? `${item.revisionCount} revizyon` : null,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {lateNow ? <Badge variant="error">Gecikti</Badge> : null}
                        <Badge variant={STATUS_BADGE[item.status]}>
                          {OFFICE_STATUS_LABELS[item.status]}
                        </Badge>
                      </div>
                    </div>
                    {movable ? (
                      <Menu>
                        <MenuTrigger
                          render={
                            <Button
                              aria-label={`${item.title} işlemleri`}
                              className="max-md:size-11"
                              size="icon-sm"
                              variant="ghost"
                            />
                          }
                        >
                          <MoreHorizontalIcon aria-hidden="true" />
                        </MenuTrigger>
                        <MenuPopup align="end">
                          {canManage ? (
                            <MenuItem onClick={() => edit(item)}>Düzenle</MenuItem>
                          ) : null}
                          {(["in_progress", "delivered", "open"] as const)
                            .filter((status) => status !== item.status)
                            .map((status) => (
                              <MenuItem
                                key={status}
                                onClick={() => run(() => actions.move(item.id, status))}
                              >
                                {OFFICE_STATUS_LABELS[status]} olarak işaretle
                              </MenuItem>
                            ))}
                          {canManage && item.status !== "cancelled" ? (
                            <>
                              <MenuSeparator />
                              <MenuItem onClick={() => run(() => actions.revise(item.id))}>
                                Revizyon geldi
                              </MenuItem>
                              <MenuItem
                                onClick={() => run(() => actions.move(item.id, "cancelled"))}
                              >
                                İptal et
                              </MenuItem>
                            </>
                          ) : null}
                        </MenuPopup>
                      </Menu>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </FramePanel>
        </Frame>
      )}

      <Dialog onOpenChange={setOpen} open={open}>
        <DialogPopup>
          <DialogHeader>
            <DialogTitle>{editing ? "İşi düzenle" : "Teknik ofis işi ekle"}</DialogTitle>
            <DialogDescription>
              Teslim tarihi geçerse iş sorumlusuna görev olarak düşer.
            </DialogDescription>
          </DialogHeader>
          <DialogPanel className="grid gap-4 sm:grid-cols-2">
            <ChoiceField
              items={types
                .filter((type) => type.status === "active" || type.id === form.typeItemId)
                .map((type) => ({ label: type.name, value: type.id }))}
              label="Türü"
              onChange={(picked) => set({ typeItemId: picked })}
              placeholder="Seçin"
              value={form.typeItemId}
            />
            <Field>
              <FieldLabel htmlFor="office-title">İşin adı</FieldLabel>
              <Input
                id="office-title"
                onChange={(event) => set({ title: event.currentTarget.value })}
                placeholder="Uygulama projesi çizimi"
                value={form.title}
              />
            </Field>
            <ChoiceField
              items={[{ label: "Seçilmedi", value: NONE }, ...people]}
              label="Sorumlu"
              onChange={(picked) => set({ assigneeUserId: picked })}
              value={form.assigneeUserId}
            />
            <Field>
              <FieldLabel htmlFor="office-due">Teslim tarihi</FieldLabel>
              <Input
                id="office-due"
                onChange={(event) => set({ dueOn: event.currentTarget.value })}
                type="date"
                value={form.dueOn}
              />
            </Field>
            <Field className="sm:col-span-2">
              <FieldLabel htmlFor="office-note">Not</FieldLabel>
              <Textarea
                id="office-note"
                onChange={(event) => set({ note: event.currentTarget.value })}
                value={form.note}
              />
            </Field>
          </DialogPanel>
          <DialogFooter>
            <DialogClose render={<Button variant="ghost" />}>Vazgeç</DialogClose>
            <Button
              loading={pending}
              onClick={() =>
                run(
                  () => (editing ? actions.change(editing, form) : actions.add(form)),
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
