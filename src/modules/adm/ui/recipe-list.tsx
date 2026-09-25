"use client";

import { FlaskConicalIcon, PlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

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
import type { RecipeLine } from "@/modules/adm/data/production-store";
import {
  OUTPUT_KINDS,
  OUTPUT_LABELS,
  UNIT_LABELS,
  UNITS_FOR,
  type OutputKind,
  type PerUnit,
} from "@/modules/adm/domain/production";
import { useActionToast } from "@/platform/ui/feedback/use-action-toast";

/**
 * Consumption recipes (SCR-190, REQ-ADM-004, TASK-0121).
 *
 * A recipe line is never edited: a change is a new line from a date, so a past day keeps the
 * suggestion it was given (REQ-ADM-007). The list is therefore the recipe's own history, newest
 * first, and the only thing it offers is a new line.
 */

type Result = { error: string | null };
type Choice = { value: string; label: string };

export type RecipeActions = {
  add: (input: {
    outputKind: OutputKind;
    typeId: string;
    perUnit: PerUnit;
    materialItemId: string;
    qtyPerUnit: string;
    validFrom: string;
    reason: string;
  }) => Promise<Result>;
};

const EVERY = "__every__";
const day = new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium" });
const amount = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 4 });

export function RecipeList({
  lines,
  typeNames,
  panelTypes,
  stripTypes,
  materials,
  canManage,
  actions,
  today,
}: {
  lines: readonly RecipeLine[];
  /** Every type's name, passive ones included, so an old line still says what it was for. */
  typeNames: readonly Choice[];
  /** The types a new line may be for: only those in use. */
  panelTypes: readonly Choice[];
  stripTypes: readonly Choice[];
  materials: readonly Choice[];
  canManage: boolean;
  actions: RecipeActions;
  /** Today in Istanbul, the default validity date. */
  today: string;
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [pending, start] = useTransition();
  const [form, setForm] = useState({
    materialItemId: "",
    outputKind: "casting" as OutputKind,
    perUnit: "piece" as PerUnit,
    qtyPerUnit: "",
    reason: "",
    typeId: EVERY,
    validFrom: today,
  });

  useActionToast(result ?? {}, result?.error ? { type: "error", title: result.error } : null);

  const typeName = useMemo(() => {
    const names = new Map<string, string>();
    for (const one of typeNames) names.set(one.value, one.label);
    return names;
  }, [typeNames]);

  const kinds: Choice[] = OUTPUT_KINDS.map((kind) => ({ value: kind, label: OUTPUT_LABELS[kind] }));
  const types: Choice[] = [
    { value: EVERY, label: "Her tip" },
    ...(form.outputKind === "strip_installation" ? stripTypes : panelTypes),
  ];
  const units: Choice[] = UNITS_FOR[form.outputKind].map((unit) => ({
    value: unit,
    label: UNIT_LABELS[unit],
  }));

  const submit = () =>
    start(async () => {
      const said = await actions.add(form);
      setResult(said);
      if (!said.error) {
        setAdding(false);
        setForm({ ...form, qtyPerUnit: "", reason: "" });
        router.refresh();
      }
    });

  const addButton = canManage ? (
    <Button onClick={() => setAdding(true)}>
      <PlusIcon aria-hidden="true" />
      Reçete satırı ekle
    </Button>
  ) : null;

  const describe = (line: RecipeLine) => {
    const type = line.panelTypeId ?? line.stripTypeId;
    return type ? (typeName.get(type) ?? "Tanımsız tip") : "Her tip";
  };

  return (
    <>
      {lines.length === 0 ? (
        <Empty className="flex-1">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FlaskConicalIcon aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle aria-level={2} role="heading">
              Bu listede kalem yok
            </EmptyTitle>
            <EmptyDescription>
              Günlük kayıttaki sarf önerisi reçetelerden hesaplanır; reçete yoksa öneri de gelmez.
            </EmptyDescription>
          </EmptyHeader>
          {addButton ? <EmptyContent>{addButton}</EmptyContent> : null}
        </Empty>
      ) : (
        <Frame className="w-full">
          <FrameHeader className="flex-row items-start justify-between gap-3">
            <div className="flex min-w-0 flex-col">
              <FrameTitle>Sarf reçeteleri</FrameTitle>
              <FrameDescription>
                Satırlar değiştirilmez; değişiklik yeni bir tarihten geçerli yeni satırdır, böylece
                geçmiş günlerin önerisi değişmez.
              </FrameDescription>
            </div>
            {addButton}
          </FrameHeader>
          <FramePanel>
            <ul className="flex flex-col gap-2 lg:hidden">
              {lines.map((line) => (
                <li className="flex flex-col gap-1 rounded-lg border p-3" key={line.id}>
                  <span className="font-medium">
                    {OUTPUT_LABELS[line.outputKind]} · {describe(line)}
                  </span>
                  <span className="text-sm">
                    {line.materialName}: {amount.format(line.qtyPerUnit)}{" "}
                    {UNIT_LABELS[line.perUnit]}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {day.format(new Date(`${line.validFrom}T12:00:00`))} tarihinden · {line.reason}
                  </span>
                </li>
              ))}
            </ul>

            <Table className="hidden lg:table">
              <TableHeader>
                <TableRow>
                  <TableHead>Üretim</TableHead>
                  <TableHead>Tip</TableHead>
                  <TableHead>Malzeme</TableHead>
                  <TableHead>Miktar</TableHead>
                  <TableHead>Geçerli</TableHead>
                  <TableHead>Neden</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.map((line) => (
                  <TableRow key={line.id}>
                    <TableCell>{OUTPUT_LABELS[line.outputKind]}</TableCell>
                    <TableCell>{describe(line)}</TableCell>
                    <TableCell>{line.materialName}</TableCell>
                    <TableCell className="tabular-nums">
                      {amount.format(line.qtyPerUnit)} {UNIT_LABELS[line.perUnit]}
                    </TableCell>
                    <TableCell>{day.format(new Date(`${line.validFrom}T12:00:00`))}</TableCell>
                    <TableCell className="text-muted-foreground">{line.reason}</TableCell>
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
            <DialogTitle>Reçete satırı ekle</DialogTitle>
            <DialogDescription>
              Bir birim üretim için bir sarf malzemeden ne kadar kullanıldığı. Kullanımdan kalkan
              malzeme için miktara sıfır yazılır.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 px-4 pb-2 sm:grid-cols-2">
            <Choose
              items={kinds}
              label="Üretim"
              onChange={(value) => {
                const kind = value as OutputKind;
                setForm({ ...form, outputKind: kind, perUnit: UNITS_FOR[kind][0], typeId: EVERY });
              }}
              value={form.outputKind}
            />
            <Choose
              items={types}
              label="Tip"
              onChange={(value) => setForm({ ...form, typeId: value })}
              value={form.typeId}
            />
            <Choose
              items={materials}
              label="Sarf malzeme"
              onChange={(value) => setForm({ ...form, materialItemId: value })}
              placeholder="Malzeme seçin"
              value={form.materialItemId}
            />
            <Choose
              items={units}
              label="Neye göre"
              onChange={(value) => setForm({ ...form, perUnit: value as PerUnit })}
              value={form.perUnit}
            />
            <Field>
              <FieldLabel htmlFor="recipe-qty">Miktar</FieldLabel>
              <Input
                id="recipe-qty"
                inputMode="decimal"
                onChange={(event) => setForm({ ...form, qtyPerUnit: event.currentTarget.value })}
                placeholder="4"
                value={form.qtyPerUnit}
              />
              <FieldDescription>Malzemenin kendi birimiyle.</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="recipe-from">Geçerlilik tarihi</FieldLabel>
              <Input
                id="recipe-from"
                onChange={(event) => setForm({ ...form, validFrom: event.currentTarget.value })}
                type="date"
                value={form.validFrom}
              />
              <FieldDescription>
                Geçmiş bir tarih seçilirse yalnız henüz onaylanmamış günlere uygulanır.
              </FieldDescription>
            </Field>
            <Field className="sm:col-span-2">
              <FieldLabel htmlFor="recipe-reason">Neden</FieldLabel>
              <Input
                id="recipe-reason"
                onChange={(event) => setForm({ ...form, reason: event.currentTarget.value })}
                placeholder="Yeni kalıp sistemine geçildi"
                value={form.reason}
              />
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
    </>
  );
}

/** A labelled select whose closed state shows the chosen name, never the stored value. */
function Choose({
  label,
  items,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  items: readonly Choice[];
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <Select items={items} onValueChange={(picked) => onChange(String(picked))} value={value}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectPopup>
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectPopup>
      </Select>
    </Field>
  );
}
