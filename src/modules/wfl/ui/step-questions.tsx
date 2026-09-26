"use client";

import { Trash2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { unknownChoiceName, type ChoiceKind } from "@/modules/wfl/domain/choice-name";
import { durationToParts, partsToDuration, type DurationUnit } from "@/modules/wfl/domain/duration";
import type { DraftStep } from "@/modules/wfl/domain/edit";
import { stepTypeLabel, type DrawableStep } from "@/modules/wfl/domain/graph";

/**
 * A step's own questions (SCR-196, TASK-0119).
 *
 * The panel asks; the definition is what it writes. Every choice a step offers comes from the
 * capability catalog or from the flow's own steps — never from a list written here — because what a
 * flow can do is what the modules declared and nothing else.
 *
 * Nothing on this panel is written in the code's own language: a step is called by its name and
 * never by its id, a choice shows the name the catalog gave it and never its code, and a requirement
 * number belongs in the records rather than on somebody's screen.
 */

/** What the modules and the panel offer this designer to choose from. */
export type DesignerVocabulary = {
  /** Events a flow may start on, from every module's catalog. */
  events: readonly { code: string; name: string }[];
  /** Fields a condition may read, from every module's catalog. */
  fields: readonly { code: string; name: string }[];
  /** Owner relations — "the site's coordinator" — answered by the module that knows. */
  relations: readonly { code: string; name: string }[];
  roles: readonly { code: string; name: string }[];
  people: readonly { id: string; name: string }[];
  /** The permissions the panel knows, with their own names. */
  permissions: readonly { code: string; name: string }[];
  /** The other flows, for a step that hands work to one of them. */
  flows: readonly { key: string; name: string }[];
  /**
   * Every capability name the requirements define, built or not — what a stored choice of a module
   * that is not built yet is called, so its code never reaches the screen.
   */
  written: Readonly<Record<string, string>>;
  /** The record the flow is about (its trigger event's record), for a condition's `record.…`. */
  recordEntity?: string;
  /** The codes of the events and fields that are built, whose names need no "not built yet". */
  built?: ReadonlySet<string>;
  /**
   * The states a flow may move a record to, by the record its trigger event is about
   * (`project` → the project stages), answered by the module that owns the record.
   */
  statuses: Readonly<Record<string, readonly { code: string; name: string }[]>>;
};

/** Base UI wants a string; "nothing" has to be a value of its own. */
const NONE = "__none__";

type Item = { value: string; label: string };

/**
 * One choice. The items are handed to the select itself as well as drawn inside it, because that is
 * what lets the closed control show the chosen thing's **name**; without them it falls back to the
 * stored value, which is how a code ends up on a screen.
 */
function Choice({
  label,
  description,
  items,
  value,
  placeholder,
  onChange,
  className,
  unknownName = "Tanımsız seçim",
}: {
  label?: string;
  description?: string;
  items: readonly Item[];
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  className?: string;
  /** What a stored value that is not among the items is called; its code is never shown. */
  unknownName?: string;
}) {
  const shown =
    !value || items.some((item) => item.value === value)
      ? items
      : [...items, { value, label: unknownName }];
  const select = (
    <Select items={shown} onValueChange={(picked) => onChange(String(picked))} value={value}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectPopup>
        {shown.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectPopup>
    </Select>
  );

  if (!label) return select;

  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      {select}
      {description ? <FieldDescription>{description}</FieldDescription> : null}
    </Field>
  );
}

type OwnerRule = {
  type: "user" | "role" | "relation" | "permission";
  userId?: string;
  role?: string;
  relation?: string;
  permission?: string;
};

/** `*` closes every move of the record; a module's own moves join this list as it declares them. */
const LOCK_TRANSITIONS: Item[] = [{ value: "*", label: "Kayıttaki bütün işlemler" }];

const OWNER_KINDS: Item[] = [
  { value: "role", label: "Rol" },
  { value: "user", label: "Kişi" },
  { value: "relation", label: "Kayıtla ilişki" },
  { value: "permission", label: "Yetki" },
];

/** Who a step waits on: a role, a person, a relation a module answers, or a permission. */
function OwnerQuestion({
  label,
  description,
  owner,
  vocabulary,
  onChange,
}: {
  label: string;
  description?: string;
  owner: OwnerRule | undefined;
  vocabulary: DesignerVocabulary;
  onChange: (owner: OwnerRule) => void;
}) {
  const kind = owner?.type ?? "role";

  const choices: Record<
    OwnerRule["type"],
    { items: Item[]; value: string; placeholder: string; kind: ChoiceKind }
  > = {
    permission: {
      items: vocabulary.permissions.map((one) => ({ value: one.code, label: one.name })),
      placeholder: "Yetki seçin",
      value: owner?.permission ?? "",
      kind: "permission",
    },
    relation: {
      items: vocabulary.relations.map((one) => ({ value: one.code, label: one.name })),
      placeholder: "İlişki seçin",
      value: owner?.relation ?? "",
      kind: "relation",
    },
    role: {
      items: vocabulary.roles.map((one) => ({ value: one.code, label: one.name })),
      placeholder: "Rol seçin",
      value: owner?.role ?? "",
      kind: "role",
    },
    user: {
      items: vocabulary.people.map((one) => ({ value: one.id, label: one.name })),
      placeholder: "Kişi seçin",
      value: owner?.userId ?? "",
      kind: "person",
    },
  };

  const write = (value: string) => {
    if (kind === "user") onChange({ type: "user", userId: value });
    else if (kind === "role") onChange({ type: "role", role: value });
    else if (kind === "relation") onChange({ type: "relation", relation: value });
    else onChange({ type: "permission", permission: value });
  };

  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Choice
          className="sm:w-36"
          items={OWNER_KINDS}
          onChange={(value) => onChange({ type: value as OwnerRule["type"] })}
          value={kind}
        />
        <Choice
          className="flex-1"
          items={choices[kind].items}
          onChange={write}
          placeholder={choices[kind].placeholder}
          unknownName={unknownChoiceName(choices[kind].value, choices[kind].kind, vocabulary)}
          value={choices[kind].value}
        />
      </div>
      {description ? <FieldDescription>{description}</FieldDescription> : null}
    </Field>
  );
}

/** Where a path goes: another step of this flow, or nowhere, which ends the flow there. */
function StepPicker({
  label,
  description,
  value,
  steps,
  names,
  exclude,
  onChange,
}: {
  label: string;
  description?: string;
  value: string | null | undefined;
  steps: readonly DrawableStep[];
  names: ReadonlyMap<string, string>;
  exclude?: string;
  onChange: (to: string | null) => void;
}) {
  const items: Item[] = [
    { value: NONE, label: "Akış burada biter" },
    ...steps
      .filter((step) => step.id !== exclude)
      .map((step) => ({ value: step.id, label: names.get(step.id) ?? "Adım" })),
  ];

  return (
    <Choice
      description={description}
      items={items}
      label={label}
      onChange={(picked) => onChange(picked === NONE ? null : picked)}
      value={value ?? NONE}
    />
  );
}

const CONDITION_OPS: Item[] = [
  { value: "=", label: "eşittir" },
  { value: "!=", label: "eşit değildir" },
  { value: ">", label: "büyüktür" },
  { value: ">=", label: "büyük veya eşittir" },
  { value: "<", label: "küçüktür" },
  { value: "<=", label: "küçük veya eşittir" },
  { value: "in", label: "listede var" },
  { value: "exists", label: "doldurulmuş" },
];

const COUNT_OF: Item[] = [
  { value: "flow_runs", label: "bu akışın çalışma sayısı" },
  { value: "returned_approvals", label: "düzeltmeye dönen onay sayısı" },
];

const LOOK_AT: Item[] = [
  { value: "field", label: "Kaydın bir alanına" },
  { value: "history", label: "Geçmişte kaç kez olduğuna" },
];

/** What a condition reads: a field of the record, or how often something happened. */
function ConditionQuestion({
  step,
  vocabulary,
  onChange,
}: {
  step: DraftStep;
  vocabulary: DesignerVocabulary;
  onChange: (change: Record<string, unknown>) => void;
}) {
  const test = (step.test ?? {}) as Record<string, unknown>;
  const looksBack = typeof test.countOf === "string";

  return (
    <div className="flex flex-col gap-4">
      <Choice
        items={LOOK_AT}
        label="Neye bakılsın?"
        onChange={(value) =>
          onChange({
            test:
              value === "history"
                ? { countOf: "flow_runs", withinDays: 30, op: ">", value: 1 }
                : { field: vocabulary.fields[0]?.code ?? "", op: "=", value: "" },
          })
        }
        value={looksBack ? "history" : "field"}
      />

      {looksBack ? (
        <>
          <Choice
            items={COUNT_OF}
            label="Ne sayılsın?"
            onChange={(value) => onChange({ test: { ...test, countOf: value } })}
            value={String(test.countOf ?? "flow_runs")}
          />
          <Field>
            <FieldLabel htmlFor="condition-days">Kaç günlük geçmişe bakılsın?</FieldLabel>
            <Input
              defaultValue={String(test.withinDays ?? 30)}
              id="condition-days"
              inputMode="numeric"
              onBlur={(event) =>
                onChange({ test: { ...test, withinDays: Number(event.currentTarget.value) } })
              }
            />
            <FieldDescription>En az 1, en çok 365 gün.</FieldDescription>
          </Field>
        </>
      ) : (
        <Choice
          description="Bu liste, modüllerin akışa açtığı alanlardır; başka bir alan bir akışa görünmez."
          items={vocabulary.fields.map((field) => ({ value: field.code, label: field.name }))}
          label="Hangi bilgiye?"
          onChange={(value) => onChange({ test: { ...test, field: value } })}
          placeholder="Bilgi seçin"
          unknownName={unknownChoiceName(String(test.field ?? ""), "field", vocabulary)}
          value={String(test.field ?? "")}
        />
      )}

      <Choice
        items={looksBack ? CONDITION_OPS.slice(0, 6) : CONDITION_OPS}
        label="Nasıl karşılaştırılsın?"
        onChange={(value) => onChange({ test: { ...test, op: value } })}
        value={String(test.op ?? "=")}
      />

      {test.op === "exists" ? null : (
        <Field>
          <FieldLabel htmlFor="condition-value">Hangi değerle?</FieldLabel>
          <Input
            defaultValue={test.value === undefined || test.value === null ? "" : String(test.value)}
            id="condition-value"
            onBlur={(event) => {
              const raw = event.currentTarget.value;
              const number = Number(raw);
              onChange({
                test: {
                  ...test,
                  value: looksBack || (raw !== "" && !Number.isNaN(number)) ? number : raw,
                },
              });
            }}
          />
        </Field>
      )}
    </div>
  );
}

const DURATION_UNITS: Item[] = [
  { value: "minute", label: "dakika" },
  { value: "hour", label: "saat" },
  { value: "day", label: "gün" },
];

/** How long a step waits, asked as a number and a unit rather than as a stored duration. */
function DurationQuestion({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description?: string;
  value: string | null | undefined;
  onChange: (duration: string) => void;
}) {
  const parts = durationToParts(value);

  return (
    <Field>
      <FieldLabel htmlFor="step-duration">{label}</FieldLabel>
      <div className="flex gap-2">
        <Input
          className="flex-1"
          defaultValue={String(parts.amount)}
          id="step-duration"
          inputMode="numeric"
          key={value ?? "empty"}
          onBlur={(event) =>
            onChange(
              partsToDuration({ amount: Number(event.currentTarget.value), unit: parts.unit }),
            )
          }
        />
        <Choice
          className="w-28"
          items={DURATION_UNITS}
          onChange={(unit) =>
            onChange(partsToDuration({ amount: parts.amount, unit: unit as DurationUnit }))
          }
          value={parts.unit}
        />
      </div>
      {description ? <FieldDescription>{description}</FieldDescription> : null}
    </Field>
  );
}

const PRIORITIES: Item[] = [
  { value: "low", label: "Düşük" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "Yüksek" },
  { value: "critical", label: "Kritik" },
];

const RECORD_ACTIONS: Item[] = [
  { value: "create", label: "Taslak kayıt oluştur" },
  { value: "set_status", label: "Kaydın durumunu değiştir" },
];

export function StepQuestions({
  step,
  steps,
  names,
  problems,
  vocabulary,
  onChange,
  onRemove,
}: {
  step: DraftStep;
  steps: readonly DrawableStep[];
  /** What each step is called on this screen; ids never reach it. */
  names: ReadonlyMap<string, string>;
  problems: readonly string[];
  vocabulary: DesignerVocabulary;
  onChange: (change: Record<string, unknown>) => void;
  onRemove: () => void;
}) {
  const owner = step.owner as OwnerRule | undefined;
  const outcomes = (step.outcomes ?? {}) as Record<string, string | null | undefined>;
  // The states of the record the flow is about; none when its module is not built yet.
  const statusItems = (vocabulary.statuses[vocabulary.recordEntity ?? ""] ?? []).map((one) => ({
    value: one.code,
    label: one.name,
  }));
  const picker = (props: Omit<Parameters<typeof StepPicker>[0], "steps" | "names" | "exclude">) => (
    <StepPicker {...props} exclude={step.id} names={names} steps={steps} />
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-semibold">{names.get(step.id) ?? stepTypeLabel(step.type)}</h3>
        <span className="text-xs text-muted-foreground">{stepTypeLabel(step.type)} adımı</span>
      </div>

      {problems.length ? (
        <ul className="flex flex-col gap-1 rounded-md border border-warning/40 bg-warning/8 p-2 text-xs">
          {problems.map((problem) => (
            <li key={problem}>{problem}</li>
          ))}
        </ul>
      ) : null}

      <Field>
        <FieldLabel htmlFor="step-title">Adımın adı</FieldLabel>
        <Input
          defaultValue={step.title ?? ""}
          id="step-title"
          onBlur={(event) => onChange({ title: event.currentTarget.value || undefined })}
          placeholder="Ekranda ne yazsın?"
        />
        <FieldDescription>
          Bu ad görevde, bildirimde ve çalışma günlüğünde görünür.
        </FieldDescription>
      </Field>

      {step.type === "condition" ? (
        <>
          <ConditionQuestion onChange={onChange} step={step} vocabulary={vocabulary} />
          {picker({
            label: "Koşul sağlanırsa",
            onChange: (to) => onChange({ whenTrue: to }),
            value: step.whenTrue,
          })}
          {picker({
            label: "Sağlanmazsa",
            onChange: (to) => onChange({ whenFalse: to }),
            value: step.whenFalse,
          })}
        </>
      ) : null}

      {step.type === "approval" || step.type === "task" || step.type === "notify" ? (
        <OwnerQuestion
          description="Rol seçilirse o rolü taşıyan kişiye düşer; kayıtla ilişki, cevabı bilen modülden sorulur."
          label={step.type === "notify" ? "Kime bildirilsin?" : "Kime düşsün?"}
          onChange={(next) => onChange({ owner: next })}
          owner={owner}
          vocabulary={vocabulary}
        />
      ) : null}

      {step.type === "escalate" ? (
        <OwnerQuestion
          description="Bu adım bekletmez: haber verir ve akış devam eder."
          label="Kime haber verilsin?"
          onChange={(next) => onChange({ to: next })}
          owner={step.to as OwnerRule | undefined}
          vocabulary={vocabulary}
        />
      ) : null}

      {step.type === "approval" ? (
        <>
          {picker({
            label: "Onaylanırsa",
            onChange: (to) => onChange({ outcomes: { ...outcomes, approve: to } }),
            value: outcomes.approve,
          })}
          {picker({
            label: "Reddedilirse",
            onChange: (to) => onChange({ outcomes: { ...outcomes, reject: to } }),
            value: outcomes.reject,
          })}
          {picker({
            description:
              "Düzeltmeye geri gönderme, akışın başına ya da herhangi bir adıma dönebilir.",
            label: "Düzeltmeye dönerse",
            onChange: (to) => onChange({ outcomes: { ...outcomes, return: to } }),
            value: outcomes.return,
          })}
        </>
      ) : null}

      {step.type === "task" ? (
        <Choice
          items={PRIORITIES}
          label="Öncelik"
          onChange={(value) => onChange({ priority: value })}
          value={String(step.priority ?? "normal")}
        />
      ) : null}

      {step.type === "wait" ? (
        <DurationQuestion
          description="Bu süre dolduğunda akış kendiliğinden devam eder."
          label="Ne kadar beklesin?"
          onChange={(after) => onChange({ after })}
          value={typeof step.after === "string" ? step.after : null}
        />
      ) : null}

      {step.type === "notify" || step.type === "escalate" ? (
        <Field>
          <FieldLabel htmlFor="step-subject">Ne desin?</FieldLabel>
          <Input
            defaultValue={String(step.subject ?? "")}
            id="step-subject"
            onBlur={(event) => onChange({ subject: event.currentTarget.value })}
            placeholder="Şantiye çıkışı onayınızı bekliyor"
          />
        </Field>
      ) : null}

      {step.type === "lock" ? (
        <>
          <Field>
            <FieldLabel htmlFor="step-reason">Neden kilitli?</FieldLabel>
            <Input
              defaultValue={String(step.reason ?? "")}
              id="step-reason"
              onBlur={(event) => onChange({ reason: event.currentTarget.value })}
              placeholder="Zimmet kapanmadan çıkış tamamlanamaz"
            />
            <FieldDescription>Engellenen kişiye bu cümle gösterilir.</FieldDescription>
          </Field>
          <Choice
            description="Bütün işlemler kapanırsa kayıt hiç hareket edemez. Tek bir işlemi kapatmak için işlemlerini, kaydın sahibi olan modül verir."
            items={LOCK_TRANSITIONS}
            label="Hangi işlem kapansın?"
            onChange={(value) => onChange({ transition: value })}
            unknownName={unknownChoiceName(
              String(step.transition ?? "*"),
              "transition",
              vocabulary,
            )}
            value={String(step.transition ?? "*")}
          />
        </>
      ) : null}

      {step.type === "subflow" ? (
        <Choice
          description="Seçilen akış bu adımın altında çalışır ve adım onun bitmesini bekler; yayımlanmamış bir akış çalışmayı durdurur."
          items={vocabulary.flows.map((flow) => ({ value: flow.key, label: flow.name }))}
          label="Hangi akış çalışsın?"
          onChange={(value) => onChange({ flow: value })}
          placeholder="Akış seçin"
          unknownName={unknownChoiceName(String(step.flow ?? ""), "flow", vocabulary)}
          value={String(step.flow ?? "")}
        />
      ) : null}

      {step.type === "record" ? (
        <>
          <Choice
            items={RECORD_ACTIONS}
            label="Ne yapılsın?"
            onChange={(value) => onChange({ action: value })}
            value={String(step.action ?? "create")}
          />
          {step.action === "set_status" ? (
            <Choice
              description="Durumları, kaydın sahibi olan modül verir. Bir akış kaydı kesinleşmiş bir duruma taşıyamaz; ilgili modül bunu kendi diliyle reddeder."
              items={statusItems}
              label="Hangi duruma taşınsın?"
              onChange={(value) => onChange({ status: value })}
              placeholder={statusItems.length ? "Durum seçin" : "Kaydın modülü henüz kurulmadı"}
              unknownName={unknownChoiceName(String(step.status ?? ""), "status", {
                ...vocabulary,
                statesOffered: statusItems.length > 0,
              })}
              value={String(step.status ?? "")}
            />
          ) : (
            <Choice
              description="Akış yalnız taslak kayıt açar. Kayıt türlerini, onları sunan modüller verir."
              items={[]}
              label="Hangi kayıt oluşturulsun?"
              onChange={(value) => onChange({ recordType: value })}
              placeholder="Taslak açmayı sunan bir modül henüz yok"
              unknownName={unknownChoiceName(
                String(step.recordType ?? ""),
                "recordType",
                vocabulary,
              )}
              value={String(step.recordType ?? "")}
            />
          )}
        </>
      ) : null}

      {step.type === "for_each" ? (
        <>
          <Choice
            description="Listeyi, kaydın sahibi olan modül verir; modüller listelerini açtıkça burada seçilir."
            items={[]}
            label="Hangi liste için çalışsın?"
            onChange={(value) => onChange({ list: value })}
            placeholder="Liste sunan bir modül henüz yok"
            unknownName={unknownChoiceName(String(step.list ?? ""), "list", vocabulary)}
            value={String(step.list ?? "")}
          />
          {picker({
            description: "Listedeki her öğe için bu adımdan başlayan bir dal çalışır.",
            label: "Her öğe için hangi adım?",
            onChange: (to) => onChange({ body: to }),
            value: step.body,
          })}
          <Field>
            <FieldLabel htmlFor="step-limit">En çok kaç öğe?</FieldLabel>
            <Input
              defaultValue={String(step.limit ?? 20)}
              id="step-limit"
              inputMode="numeric"
              onBlur={(event) => onChange({ limit: Number(event.currentTarget.value) })}
            />
            <FieldDescription>
              Daha uzun bir liste akışı durdurur; işin yarısını sessizce yapmaktan iyidir.
            </FieldDescription>
          </Field>
        </>
      ) : null}

      {step.type === "parallel" ? (
        <ParallelQuestion names={names} onChange={onChange} step={step} steps={steps} />
      ) : null}

      {/* Where the step carries on. A condition, an approval and a for-each say this in their own
          words above, so they are not asked twice. */}
      {["condition", "approval", "end"].includes(String(step.type))
        ? null
        : picker({
            label: step.type === "parallel" ? "Dallar bitince" : "Sonra hangi adım?",
            onChange: (to) => onChange({ next: to }),
            value: step.next,
          })}

      {step.type === "start" ? null : (
        <Button
          className="self-start"
          onClick={onRemove}
          type="button"
          variant="destructive-outline"
        >
          <Trash2Icon />
          Adımı kaldır
        </Button>
      )}
    </div>
  );
}

/** The branches of a parallel step; each one runs on its own. */
function ParallelQuestion({
  step,
  steps,
  names,
  onChange,
}: {
  step: DraftStep;
  steps: readonly DrawableStep[];
  names: ReadonlyMap<string, string>;
  onChange: (change: Record<string, unknown>) => void;
}) {
  const paths = (step.paths ?? []).filter((path): path is string => Boolean(path));

  return (
    <div className="flex flex-col gap-3">
      {paths.map((path, index) => (
        <StepPicker
          exclude={step.id}
          key={`${path}-${index}`}
          label={`${index + 1}. dal`}
          names={names}
          onChange={(to) => {
            const next = [...paths];
            if (to === null) next.splice(index, 1);
            else next[index] = to;
            onChange({ paths: next });
          }}
          steps={steps}
          value={path}
        />
      ))}
      <Button
        className="self-start"
        disabled={paths.length >= 10}
        onClick={() => {
          const free = steps.find((one) => one.id !== step.id && !paths.includes(one.id));
          if (free) onChange({ paths: [...paths, free.id] });
        }}
        size="sm"
        type="button"
        variant="outline"
      >
        Dal ekle
      </Button>
      <FieldDescription>
        En az iki dal gerekir; her dal kendi başına çalışır ve hepsi bitince akış devam eder.
      </FieldDescription>
    </div>
  );
}

const CLOCK_KINDS: Item[] = [
  { value: "daily", label: "Her gün" },
  { value: "monthly", label: "Her ayın belirli bir günü" },
];

const TRIGGER_KINDS: Item[] = [
  { value: "event", label: "Bir şey olduğunda" },
  { value: "clock", label: "Saatle" },
  { value: "threshold", label: "Bir değer eşiği aştığında" },
  { value: "manual", label: "Elle başlatıldığında" },
];

/** What starts the flow: an event, the clock, a threshold, or a person. */
export function TriggerQuestions({
  trigger,
  vocabulary,
  onChange,
}: {
  trigger: Record<string, unknown> | undefined;
  vocabulary: DesignerVocabulary;
  onChange: (trigger: Record<string, unknown>) => void;
}) {
  const kind = String(trigger?.type ?? "manual");
  const test = (trigger?.test ?? {}) as Record<string, unknown>;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-semibold">Akışın kendisi</h3>
        <span className="text-xs text-muted-foreground">
          Bir adıma tıklayınca o adımın soruları burada açılır.
        </span>
      </div>

      <Choice
        items={TRIGGER_KINDS}
        label="Ne olunca başlasın?"
        onChange={(value) =>
          onChange(
            value === "clock"
              ? { type: "clock", dailyAt: "09:00" }
              : value === "manual"
                ? { type: "manual" }
                : {
                    type: value,
                    event: vocabulary.events[0]?.code ?? "",
                    ...(value === "threshold" ? { test: { field: "", op: ">", value: 0 } } : {}),
                  },
          )
        }
        value={kind}
      />

      {kind === "event" || kind === "threshold" ? (
        <Choice
          description="Bu liste, modüllerin akışlara açtığı olaylardır; başka bir şey bir akışı başlatamaz."
          items={vocabulary.events.map((event) => ({ value: event.code, label: event.name }))}
          label="Hangi olay?"
          onChange={(value) => onChange({ ...trigger, type: kind, event: value })}
          placeholder="Olay seçin"
          unknownName={unknownChoiceName(String(trigger?.event ?? ""), "event", vocabulary)}
          value={String(trigger?.event ?? "")}
        />
      ) : null}

      {kind === "threshold" ? (
        <>
          <Choice
            description="Eşik, olayın taşıdığı değere bakar; arkada duran ayrı bir sorgu yoktur."
            items={vocabulary.fields.map((field) => ({ value: field.code, label: field.name }))}
            label="Hangi bilgi eşiği aşsın?"
            onChange={(value) =>
              onChange({ ...trigger, type: "threshold", test: { ...test, field: value } })
            }
            placeholder="Bilgi seçin"
            unknownName={unknownChoiceName(String(test.field ?? ""), "field", vocabulary)}
            value={String(test.field ?? "")}
          />
          <Field>
            <FieldLabel htmlFor="threshold-value">Hangi değeri aşınca?</FieldLabel>
            <Input
              defaultValue={String(test.value ?? "")}
              id="threshold-value"
              inputMode="numeric"
              onBlur={(event) =>
                onChange({
                  ...trigger,
                  type: "threshold",
                  test: { ...test, op: test.op ?? ">", value: Number(event.currentTarget.value) },
                })
              }
            />
          </Field>
        </>
      ) : null}

      {kind === "clock" ? (
        <>
          <Choice
            items={CLOCK_KINDS}
            label="Ne sıklıkla?"
            onChange={(value) =>
              onChange({
                type: "clock",
                dailyAt: String(trigger?.dailyAt ?? "09:00"),
                everyMinutes: undefined,
                monthlyOn: value === "monthly" ? Number(trigger?.monthlyOn ?? 25) : undefined,
              })
            }
            value={trigger?.monthlyOn ? "monthly" : "daily"}
          />
          {trigger?.monthlyOn ? (
            <Field>
              <FieldLabel htmlFor="monthly-on">Ayın kaçında?</FieldLabel>
              <Input
                defaultValue={String(trigger.monthlyOn)}
                id="monthly-on"
                inputMode="numeric"
                onBlur={(event) =>
                  onChange({
                    ...trigger,
                    type: "clock",
                    monthlyOn: Number(event.currentTarget.value),
                  })
                }
              />
              <FieldDescription>
                1 ile 28 arası; 28 sınırı, kısa şubatta ayın atlanmaması için.
              </FieldDescription>
            </Field>
          ) : null}
          <Field>
            <FieldLabel htmlFor="daily-at">Saat kaçta?</FieldLabel>
            <Input
              defaultValue={String(trigger?.dailyAt ?? "09:00")}
              id="daily-at"
              onBlur={(event) =>
                onChange({
                  ...trigger,
                  type: "clock",
                  dailyAt: event.currentTarget.value,
                  everyMinutes: undefined,
                })
              }
              placeholder="09:00"
            />
            <FieldDescription>Saat ve dakika olarak yazılır, örneğin 07:30.</FieldDescription>
          </Field>
        </>
      ) : null}
    </div>
  );
}
