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
import type { DraftStep } from "@/modules/wfl/domain/edit";
import { stepLabel, stepTypeLabel, type DrawableStep } from "@/modules/wfl/domain/graph";

/**
 * A step's own questions (SCR-196, REQ-WFL-026, TASK-0119).
 *
 * The panel asks; the definition is what it writes. Every choice a step offers comes from the
 * capability catalog or from the flow's own steps — never from a list written here — because what
 * a flow can do is what the modules declared and nothing else (REQ-WFL-003, D-280). A question it
 * cannot answer from a list is a plain field with the schema's own rule under it.
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
  /** The other flows, for a step that hands work to one of them. */
  flows: readonly { key: string; name: string }[];
};

/** Base UI wants a string; "nothing" has to be a value of its own. */
const NONE = "__none__";

type OwnerRule = {
  type: "user" | "role" | "relation" | "permission";
  userId?: string;
  role?: string;
  relation?: string;
  permission?: string;
};

const OWNER_KINDS = [
  { value: "role", label: "Rol" },
  { value: "user", label: "Kişi" },
  { value: "relation", label: "İlişki" },
  { value: "permission", label: "Yetki" },
];

/** Who a step waits on (D-097): a role, a person, a relation a module answers, or a permission. */
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

  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Select
          items={OWNER_KINDS}
          onValueChange={(value) => onChange({ type: value as OwnerRule["type"] })}
          value={kind}
        >
          <SelectTrigger className="sm:w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectPopup>
            {OWNER_KINDS.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectPopup>
        </Select>

        {kind === "role" ? (
          <Select
            onValueChange={(value) => onChange({ type: "role", role: String(value) })}
            value={owner?.role ?? ""}
          >
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Rol seçin" />
            </SelectTrigger>
            <SelectPopup>
              {vocabulary.roles.map((role) => (
                <SelectItem key={role.code} value={role.code}>
                  {role.name}
                </SelectItem>
              ))}
            </SelectPopup>
          </Select>
        ) : null}

        {kind === "user" ? (
          <Select
            onValueChange={(value) => onChange({ type: "user", userId: String(value) })}
            value={owner?.userId ?? ""}
          >
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Kişi seçin" />
            </SelectTrigger>
            <SelectPopup>
              {vocabulary.people.map((person) => (
                <SelectItem key={person.id} value={person.id}>
                  {person.name}
                </SelectItem>
              ))}
            </SelectPopup>
          </Select>
        ) : null}

        {kind === "relation" ? (
          <Select
            onValueChange={(value) => onChange({ type: "relation", relation: String(value) })}
            value={owner?.relation ?? ""}
          >
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="İlişki seçin" />
            </SelectTrigger>
            <SelectPopup>
              {vocabulary.relations.map((relation) => (
                <SelectItem key={relation.code} value={relation.code}>
                  {relation.name}
                </SelectItem>
              ))}
            </SelectPopup>
          </Select>
        ) : null}

        {kind === "permission" ? (
          <Input
            className="flex-1"
            defaultValue={owner?.permission ?? ""}
            onBlur={(event) =>
              onChange({ type: "permission", permission: event.currentTarget.value })
            }
            placeholder="iam.module.manage"
          />
        ) : null}
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
  exclude,
  onChange,
}: {
  label: string;
  description?: string;
  value: string | null | undefined;
  steps: readonly DrawableStep[];
  exclude?: string;
  onChange: (to: string | null) => void;
}) {
  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <Select
        onValueChange={(picked) => onChange(picked === NONE ? null : String(picked))}
        value={value ?? NONE}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectPopup>
          <SelectItem value={NONE}>Akış burada biter</SelectItem>
          {steps
            .filter((step) => step.id !== exclude)
            .map((step) => (
              <SelectItem key={step.id} value={step.id}>
                {stepLabel(step)} · {step.id}
              </SelectItem>
            ))}
        </SelectPopup>
      </Select>
      {description ? <FieldDescription>{description}</FieldDescription> : null}
    </Field>
  );
}

const CONDITION_OPS = [
  { value: "=", label: "eşittir" },
  { value: "!=", label: "eşit değildir" },
  { value: ">", label: "büyüktür" },
  { value: ">=", label: "büyük veya eşittir" },
  { value: "<", label: "küçüktür" },
  { value: "<=", label: "küçük veya eşittir" },
  { value: "in", label: "listede" },
  { value: "exists", label: "var" },
];

const COUNT_OF = [
  { value: "flow_runs", label: "bu akışın çalışma sayısı" },
  { value: "returned_approvals", label: "düzeltmeye dönen onay sayısı" },
];

/** What a condition reads: a field of the record, or how often something happened (REQ-WFL-008). */
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
      <Field>
        <FieldLabel>Neye bakılsın?</FieldLabel>
        <Select
          onValueChange={(value) =>
            onChange({
              test:
                value === "history"
                  ? { countOf: "flow_runs", withinDays: 30, op: ">", value: 1 }
                  : { field: vocabulary.fields[0]?.code ?? "", op: "=", value: "" },
            })
          }
          value={looksBack ? "history" : "field"}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectPopup>
            <SelectItem value="field">Kaydın bir alanına</SelectItem>
            <SelectItem value="history">Geçmişte kaç kez olduğuna</SelectItem>
          </SelectPopup>
        </Select>
      </Field>

      {looksBack ? (
        <>
          <Field>
            <FieldLabel>Ne sayılsın?</FieldLabel>
            <Select
              onValueChange={(value) => onChange({ test: { ...test, countOf: value } })}
              value={String(test.countOf ?? "flow_runs")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectPopup>
                {COUNT_OF.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectPopup>
            </Select>
          </Field>
          <Field>
            <FieldLabel htmlFor={`days-${step.id}`}>Kaç günlük geçmişe bakılsın?</FieldLabel>
            <Input
              defaultValue={String(test.withinDays ?? 30)}
              id={`days-${step.id}`}
              inputMode="numeric"
              onBlur={(event) =>
                onChange({ test: { ...test, withinDays: Number(event.currentTarget.value) } })
              }
            />
            <FieldDescription>1 ile 365 gün arası.</FieldDescription>
          </Field>
        </>
      ) : (
        <Field>
          <FieldLabel>Hangi alan?</FieldLabel>
          <Select
            onValueChange={(value) => onChange({ test: { ...test, field: value } })}
            value={String(test.field ?? "")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Alan seçin" />
            </SelectTrigger>
            <SelectPopup>
              {vocabulary.fields.map((field) => (
                <SelectItem key={field.code} value={field.code}>
                  {field.name} · {field.code}
                </SelectItem>
              ))}
            </SelectPopup>
          </Select>
          <FieldDescription>
            Bu liste modüllerin bildirdiği alanlardır; başka bir alan bir akışa açık değildir.
          </FieldDescription>
        </Field>
      )}

      <Field>
        <FieldLabel>Karşılaştırma</FieldLabel>
        <Select
          onValueChange={(value) => onChange({ test: { ...test, op: value } })}
          value={String(test.op ?? "=")}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectPopup>
            {(looksBack ? CONDITION_OPS.slice(0, 6) : CONDITION_OPS).map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectPopup>
        </Select>
      </Field>

      {test.op === "exists" ? null : (
        <Field>
          <FieldLabel htmlFor={`value-${step.id}`}>Hangi değerle?</FieldLabel>
          <Input
            defaultValue={test.value === undefined || test.value === null ? "" : String(test.value)}
            id={`value-${step.id}`}
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

const PRIORITIES = [
  { value: "low", label: "Düşük" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "Yüksek" },
  { value: "critical", label: "Kritik" },
];

export function StepQuestions({
  step,
  steps,
  problems,
  vocabulary,
  onChange,
  onRemove,
}: {
  step: DraftStep;
  steps: readonly DrawableStep[];
  problems: readonly string[];
  vocabulary: DesignerVocabulary;
  onChange: (change: Record<string, unknown>) => void;
  onRemove: () => void;
}) {
  const owner = step.owner as OwnerRule | undefined;
  const outcomes = (step.outcomes ?? {}) as Record<string, string | null | undefined>;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-semibold">{stepLabel(step)}</h3>
        <span className="text-xs text-muted-foreground">
          {stepTypeLabel(step.type)} · {step.id}
        </span>
      </div>

      {problems.length ? (
        <ul className="flex flex-col gap-1 rounded-md border border-warning/40 bg-warning/8 p-2 text-xs">
          {problems.map((problem) => (
            <li key={problem}>{problem}</li>
          ))}
        </ul>
      ) : null}

      <Field>
        <FieldLabel htmlFor={`title-${step.id}`}>Adımın adı</FieldLabel>
        <Input
          defaultValue={step.title ?? ""}
          id={`title-${step.id}`}
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
          <StepPicker
            exclude={step.id}
            label="Koşul sağlanırsa"
            onChange={(to) => onChange({ whenTrue: to })}
            steps={steps}
            value={step.whenTrue}
          />
          <StepPicker
            exclude={step.id}
            label="Sağlanmazsa"
            onChange={(to) => onChange({ whenFalse: to })}
            steps={steps}
            value={step.whenFalse}
          />
        </>
      ) : null}

      {step.type === "approval" || step.type === "task" || step.type === "notify" ? (
        <OwnerQuestion
          description="Rol seçilirse o rolü taşıyan kişiye düşer; ilişki, cevabı bilen modülden sorulur."
          label={step.type === "notify" ? "Kime bildirilsin?" : "Kime düşsün?"}
          onChange={(next) => onChange({ owner: next })}
          owner={owner}
          vocabulary={vocabulary}
        />
      ) : null}

      {step.type === "escalate" ? (
        <OwnerQuestion
          description="Bu adım bekletmez: haber verir ve akış devam eder."
          label="Kime yükseltilsin?"
          onChange={(next) => onChange({ to: next })}
          owner={step.to as OwnerRule | undefined}
          vocabulary={vocabulary}
        />
      ) : null}

      {step.type === "approval" ? (
        <>
          <StepPicker
            exclude={step.id}
            label="Onaylanırsa"
            onChange={(to) => onChange({ outcomes: { ...outcomes, approve: to } })}
            steps={steps}
            value={outcomes.approve}
          />
          <StepPicker
            exclude={step.id}
            label="Reddedilirse"
            onChange={(to) => onChange({ outcomes: { ...outcomes, reject: to } })}
            steps={steps}
            value={outcomes.reject}
          />
          <StepPicker
            description="Düzeltmeye geri gönderme, akışın başına ya da herhangi bir adıma dönebilir (REQ-WFL-014)."
            exclude={step.id}
            label="Düzeltmeye dönerse"
            onChange={(to) => onChange({ outcomes: { ...outcomes, return: to } })}
            steps={steps}
            value={outcomes.return}
          />
        </>
      ) : null}

      {step.type === "task" ? (
        <Field>
          <FieldLabel>Öncelik</FieldLabel>
          <Select
            onValueChange={(value) => onChange({ priority: value })}
            value={String(step.priority ?? "normal")}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectPopup>
              {PRIORITIES.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectPopup>
          </Select>
        </Field>
      ) : null}

      {step.type === "wait" ? (
        <Field>
          <FieldLabel htmlFor={`after-${step.id}`}>Ne kadar beklesin?</FieldLabel>
          <Input
            defaultValue={String(step.after ?? "")}
            id={`after-${step.id}`}
            onBlur={(event) => onChange({ after: event.currentTarget.value })}
            placeholder="PT8H"
          />
          <FieldDescription>PT30M, PT8H ya da P2D biçiminde yazılır.</FieldDescription>
        </Field>
      ) : null}

      {step.type === "notify" || step.type === "escalate" ? (
        <Field>
          <FieldLabel htmlFor={`subject-${step.id}`}>Ne desin?</FieldLabel>
          <Input
            defaultValue={String(step.subject ?? "")}
            id={`subject-${step.id}`}
            onBlur={(event) => onChange({ subject: event.currentTarget.value })}
          />
        </Field>
      ) : null}

      {step.type === "lock" ? (
        <>
          <Field>
            <FieldLabel htmlFor={`reason-${step.id}`}>Neden kilitli?</FieldLabel>
            <Input
              defaultValue={String(step.reason ?? "")}
              id={`reason-${step.id}`}
              onBlur={(event) => onChange({ reason: event.currentTarget.value })}
            />
            <FieldDescription>Engellenen kişiye bu cümle gösterilir.</FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor={`transition-${step.id}`}>Hangi geçiş kapansın?</FieldLabel>
            <Input
              defaultValue={String(step.transition ?? "*")}
              id={`transition-${step.id}`}
              onBlur={(event) => onChange({ transition: event.currentTarget.value })}
            />
            <FieldDescription>
              `*` yazılırsa kayıt hiç hareket edemez; tek bir geçişin adı yazılırsa yalnız o
              kapanır.
            </FieldDescription>
          </Field>
        </>
      ) : null}

      {step.type === "subflow" ? (
        <Field>
          <FieldLabel>Hangi akış çalışsın?</FieldLabel>
          <Select
            onValueChange={(value) => onChange({ flow: value })}
            value={String(step.flow ?? "")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Akış seçin" />
            </SelectTrigger>
            <SelectPopup>
              {vocabulary.flows.map((flow) => (
                <SelectItem key={flow.key} value={flow.key}>
                  {flow.name}
                </SelectItem>
              ))}
            </SelectPopup>
          </Select>
          <FieldDescription>
            Seçilen akış çocuk olarak çalışır ve bu adım onu bekler; yayımlanmamış bir akış
            çalışmayı durdurur.
          </FieldDescription>
        </Field>
      ) : null}

      {step.type === "record" ? (
        <>
          <Field>
            <FieldLabel>Ne yapılsın?</FieldLabel>
            <Select
              onValueChange={(value) => onChange({ action: value })}
              value={String(step.action ?? "create")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectPopup>
                <SelectItem value="create">Taslak kayıt oluştur</SelectItem>
                <SelectItem value="set_status">Kaydın durumunu değiştir</SelectItem>
              </SelectPopup>
            </Select>
          </Field>
          {step.action === "set_status" ? (
            <Field>
              <FieldLabel htmlFor={`status-${step.id}`}>Hangi duruma?</FieldLabel>
              <Input
                defaultValue={String(step.status ?? "")}
                id={`status-${step.id}`}
                onBlur={(event) => onChange({ status: event.currentTarget.value })}
              />
              <FieldDescription>
                Bir akış kaydı kesinleşmiş bir duruma taşıyamaz; modül kendi diliyle reddeder.
              </FieldDescription>
            </Field>
          ) : (
            <Field>
              <FieldLabel htmlFor={`recordType-${step.id}`}>Hangi kayıt türü?</FieldLabel>
              <Input
                defaultValue={String(step.recordType ?? "")}
                id={`recordType-${step.id}`}
                onBlur={(event) => onChange({ recordType: event.currentTarget.value })}
                placeholder="doc.document"
              />
              <FieldDescription>modul.kayit biçiminde yazılır.</FieldDescription>
            </Field>
          )}
        </>
      ) : null}

      {step.type === "for_each" ? (
        <>
          <Field>
            <FieldLabel htmlFor={`list-${step.id}`}>Hangi liste için?</FieldLabel>
            <Input
              defaultValue={String(step.list ?? "")}
              id={`list-${step.id}`}
              onBlur={(event) => onChange({ list: event.currentTarget.value })}
              placeholder="tsk.open_tasks"
            />
            <FieldDescription>
              Listeyi kaydın sahibi olan modül verir; modul.liste biçiminde yazılır.
            </FieldDescription>
          </Field>
          <StepPicker
            description="Listedeki her öğe için bu adımdan başlayan dal çalışır."
            exclude={step.id}
            label="Her öğe için hangi adım?"
            onChange={(to) => onChange({ body: to })}
            steps={steps}
            value={step.body}
          />
          <Field>
            <FieldLabel htmlFor={`limit-${step.id}`}>En çok kaç öğe?</FieldLabel>
            <Input
              defaultValue={String(step.limit ?? 20)}
              id={`limit-${step.id}`}
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
        <ParallelQuestion onChange={onChange} step={step} steps={steps} />
      ) : null}

      {/* Where the step carries on. A condition, an approval and a for-each say this in their own
          words above, so they are not asked twice. */}
      {["condition", "approval", "end"].includes(String(step.type)) ? null : (
        <StepPicker
          exclude={step.id}
          label={step.type === "parallel" ? "Dallar bitince" : "Sonra hangi adım?"}
          onChange={(to) => onChange({ next: to })}
          steps={steps}
          value={step.next}
        />
      )}

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

/** The branches of a parallel step; each one is a run of its own (REQ-WFL-006). */
function ParallelQuestion({
  step,
  steps,
  onChange,
}: {
  step: DraftStep;
  steps: readonly DrawableStep[];
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
        En az iki dal gerekir; her dal kendi kaydı, kendi beklemesi ve kendi adım sınırıyla çalışır.
      </FieldDescription>
    </div>
  );
}

/** What starts the flow (REQ-WFL-007): an event, the clock, a threshold, or a person. */
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

      <Field>
        <FieldLabel>Ne olunca başlasın?</FieldLabel>
        <Select
          onValueChange={(value) =>
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
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectPopup>
            <SelectItem value="event">Bir şey olduğunda</SelectItem>
            <SelectItem value="clock">Saatle</SelectItem>
            <SelectItem value="threshold">Bir değer eşiği aştığında</SelectItem>
            <SelectItem value="manual">Elle başlatıldığında</SelectItem>
          </SelectPopup>
        </Select>
      </Field>

      {kind === "event" || kind === "threshold" ? (
        <Field>
          <FieldLabel>Hangi olay?</FieldLabel>
          <Select
            onValueChange={(value) => onChange({ ...trigger, type: kind, event: value })}
            value={String(trigger?.event ?? "")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Olay seçin" />
            </SelectTrigger>
            <SelectPopup>
              {vocabulary.events.map((event) => (
                <SelectItem key={event.code} value={event.code}>
                  {event.name} · {event.code}
                </SelectItem>
              ))}
            </SelectPopup>
          </Select>
          <FieldDescription>
            Bu liste modüllerin yayımladığı olaylardır; başkası bir akışı başlatamaz.
          </FieldDescription>
        </Field>
      ) : null}

      {kind === "threshold" ? (
        <>
          <Field>
            <FieldLabel>Hangi alan eşiği aşsın?</FieldLabel>
            <Select
              onValueChange={(value) =>
                onChange({ ...trigger, type: "threshold", test: { ...test, field: value } })
              }
              value={String(test.field ?? "")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Alan seçin" />
              </SelectTrigger>
              <SelectPopup>
                {vocabulary.fields.map((field) => (
                  <SelectItem key={field.code} value={field.code}>
                    {field.name} · {field.code}
                  </SelectItem>
                ))}
              </SelectPopup>
            </Select>
            <FieldDescription>
              Eşik, olayın taşıdığı değere bakar; arkada duran ayrı bir sorgu yoktur.
            </FieldDescription>
          </Field>
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
        <Field>
          <FieldLabel htmlFor="daily-at">Her gün saat kaçta?</FieldLabel>
          <Input
            defaultValue={String(trigger?.dailyAt ?? "09:00")}
            id="daily-at"
            onBlur={(event) =>
              onChange({
                type: "clock",
                dailyAt: event.currentTarget.value,
                everyMinutes: undefined,
              })
            }
            placeholder="09:00"
          />
          <FieldDescription>SS:DD biçiminde yazılır.</FieldDescription>
        </Field>
      ) : null}
    </div>
  );
}
