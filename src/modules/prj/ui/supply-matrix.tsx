"use client";

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
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import {
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/frame";
import { Input } from "@/components/ui/input";
import type { SupplyRow } from "@/modules/prj/data/technical-office-store";
import {
  RESPONSIBILITIES,
  RESPONSIBILITY_LABELS,
  type Responsibility,
} from "@/modules/prj/domain/technical-office";
import { ShareBar } from "@/platform/ui/chart/chart";
import { REST, SERIES } from "@/platform/ui/chart/colors";
import { useActionToast } from "@/platform/ui/feedback/use-action-toast";
import { ChoiceField } from "@/platform/ui/form/choice-field";

/**
 * Tedarik matrisi (SCR-023, TASK-0123 step 4, REQ-PRJ-004): who provides each item — the client,
 * GEOGES, or the client deducting it from GEOGES's claim. A change is a new row from its own day;
 * what was valid before stays in the item's history, so a past period's cost is never rewritten.
 */

type Result = { error: string | null };

export type SupplyFormValue = {
  itemId: string;
  responsibility: string;
  validFrom: string;
  note: string;
};

const dayText = new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeZone: "UTC" });
const dateOf = (day: string) => dayText.format(new Date(`${day}T00:00:00Z`));

const COLOR: Record<Responsibility, string> = {
  client: SERIES[0],
  client_deducts: SERIES[1],
  geoges: SERIES[2],
};

export function SupplyMatrix({
  rows,
  items,
  canManage,
  today,
  add,
}: {
  rows: readonly SupplyRow[];
  items: readonly { id: string; name: string; status: string }[];
  canManage: boolean;
  today: string;
  add: (value: SupplyFormValue) => Promise<Result>;
}) {
  const router = useRouter();
  const [form, setForm] = useState<SupplyFormValue | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [pending, start] = useTransition();

  useActionToast(result ?? {}, result?.error ? { type: "error", title: result.error } : null);

  // Every active item, and any passive one the project already has rows for.
  const shown = items.filter(
    (item) => item.status === "active" || rows.some((row) => row.itemId === item.id),
  );
  const rowsOf = (itemId: string) => rows.filter((row) => row.itemId === itemId);
  const current = (itemId: string) => rowsOf(itemId).find((row) => row.validFrom <= today) ?? null;
  const upcoming = (itemId: string) =>
    rowsOf(itemId)
      .filter((row) => row.validFrom > today)
      .sort((a, b) => a.validFrom.localeCompare(b.validFrom));

  const count = (answer: Responsibility | null) =>
    shown.filter((item) => (current(item.id)?.responsibility ?? null) === answer).length;

  const save = () =>
    start(async () => {
      if (!form) return;
      const said = await add(form);
      setResult(said);
      if (!said.error) {
        setForm(null);
        router.refresh();
      }
    });

  const change = (itemId: string) =>
    setForm({
      itemId,
      note: "",
      responsibility: current(itemId)?.responsibility ?? "",
      validFrom: today,
    });

  const firstRow = form ? rowsOf(form.itemId).length === 0 : false;
  const itemName = form ? (items.find((item) => item.id === form.itemId)?.name ?? "") : "";

  return (
    <>
      <Frame>
        <FrameHeader>
          <FrameTitle>Tedarik matrisi</FrameTitle>
          <FrameDescription>
            Her kalemi kimin karşıladığı. Değişiklik yeni bir tarihten geçerli olur; önceki dönemin
            maliyeti değişmez.
          </FrameDescription>
        </FrameHeader>
        <FramePanel>
          <ShareBar
            label="Kalemler, bugün kimin karşıladığına göre"
            parts={[
              ...RESPONSIBILITIES.map((answer) => ({
                color: COLOR[answer],
                key: answer,
                label: RESPONSIBILITY_LABELS[answer],
                value: count(answer),
              })),
              { color: REST, key: "none", label: "Belirlenmedi", value: count(null) },
            ]}
            unit="kalem"
          />
        </FramePanel>
        <FramePanel>
          <ul className="divide-y">
            {shown.map((item) => {
              const now = current(item.id);
              const next = upcoming(item.id);
              const past = rowsOf(item.id).filter((row) => row !== now && !next.includes(row));
              return (
                <li className="flex items-start gap-3 py-3" key={item.id}>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="text-sm font-medium">{item.name}</span>
                    {now ? (
                      <span className="text-sm">
                        {RESPONSIBILITY_LABELS[now.responsibility]}
                        <span className="text-xs text-muted-foreground">
                          {" "}
                          · {dateOf(now.validFrom)} tarihinden beri
                        </span>
                      </span>
                    ) : (
                      <Badge className="self-start" variant="outline">
                        Belirlenmedi
                      </Badge>
                    )}
                    {next.map((row) => (
                      <span className="text-xs text-muted-foreground" key={row.id}>
                        {dateOf(row.validFrom)} tarihinden itibaren:{" "}
                        {RESPONSIBILITY_LABELS[row.responsibility]}
                      </span>
                    ))}
                    {past.length > 0 ? (
                      <span className="text-xs text-muted-foreground">
                        Önce:{" "}
                        {past
                          .map(
                            (row) =>
                              `${RESPONSIBILITY_LABELS[row.responsibility]} (${dateOf(row.validFrom)})`,
                          )
                          .join(" · ")}
                      </span>
                    ) : null}
                  </div>
                  {canManage ? (
                    <Button
                      className="max-md:h-11"
                      onClick={() => change(item.id)}
                      size="sm"
                      variant="outline"
                    >
                      {now || next.length ? "Değiştir" : "Belirle"}
                    </Button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </FramePanel>
      </Frame>

      <Dialog onOpenChange={(open) => (open ? undefined : setForm(null))} open={Boolean(form)}>
        <DialogPopup>
          <DialogHeader>
            <DialogTitle>{itemName}</DialogTitle>
            <DialogDescription>
              {firstRow
                ? "İlk kayıt; proje daha önce başladıysa geçmiş bir tarihten başlatılabilir."
                : "Değişiklik bugünden ya da ileri bir tarihten geçerli olur."}
            </DialogDescription>
          </DialogHeader>
          {form ? (
            <DialogPanel className="flex flex-col gap-4">
              <ChoiceField
                items={RESPONSIBILITIES.map((answer) => ({
                  label: RESPONSIBILITY_LABELS[answer],
                  value: answer,
                }))}
                label="Kim karşılıyor?"
                onChange={(picked) => setForm({ ...form, responsibility: picked })}
                placeholder="Seçin"
                value={form.responsibility}
              />
              <Field>
                <FieldLabel htmlFor="supply-from">Geçerlilik tarihi</FieldLabel>
                <Input
                  id="supply-from"
                  min={firstRow ? undefined : today}
                  onChange={(event) => setForm({ ...form, validFrom: event.currentTarget.value })}
                  type="date"
                  value={form.validFrom}
                />
                <FieldDescription>
                  Bu tarihten sonraki maliyet hesabı yeni seçimi kullanır.
                </FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="supply-note">Not</FieldLabel>
                <Input
                  id="supply-note"
                  onChange={(event) => setForm({ ...form, note: event.currentTarget.value })}
                  value={form.note}
                />
              </Field>
            </DialogPanel>
          ) : null}
          <DialogFooter>
            <DialogClose render={<Button variant="ghost" />}>Vazgeç</DialogClose>
            <Button loading={pending} onClick={save}>
              Kaydet
            </Button>
          </DialogFooter>
        </DialogPopup>
      </Dialog>
    </>
  );
}
