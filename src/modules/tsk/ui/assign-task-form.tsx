"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Combobox,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxPopup,
} from "@/components/ui/combobox";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Form } from "@/components/ui/form";
import {
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/frame";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { assignTaskAction } from "@/modules/tsk/application/task-actions";
import { initialTaskFormState } from "@/modules/tsk/application/task-form-state";
import { PRIORITY_LABELS, TASK_PRIORITIES } from "@/modules/tsk/domain/tasks";
import { useActionToast } from "@/platform/ui/feedback/use-action-toast";

type Person = { id: string; displayName: string };

const priorities = TASK_PRIORITIES.map((value) => ({ value, label: PRIORITY_LABELS[value] }));

/**
 * SCR-014 Görev ver (REQ-TSK-001, REQ-TSK-003, REQ-TSK-004). The picker lists only the people in
 * the giver's scope (SCREEN_STATES: "kapsam dışı kişi seçilemez"); the database checks it again.
 */
export function AssignTaskForm({ people, selfId }: { people: readonly Person[]; selfId: string }) {
  const [state, formAction, pending] = useActionState(assignTaskAction, initialTaskFormState);
  useActionToast(state, state.error ? { type: "error", title: state.error } : null);

  const items = people.map((p) => ({
    value: p.id,
    label: p.id === selfId ? `${p.displayName} (ben)` : p.displayName,
  }));

  return (
    <Frame className="w-full max-w-2xl">
      <FrameHeader>
        <FrameTitle>Görev ver</FrameTitle>
        <FrameDescription>
          Kapsamınızdaki herkese ve kendinize görev verebilirsiniz. Sorumluya bildirim gider.
        </FrameDescription>
      </FrameHeader>
      <FramePanel>
        <Form action={formAction} className="flex flex-col gap-5">
          <Field>
            <FieldLabel htmlFor="title">Başlık</FieldLabel>
            <Input id="title" maxLength={200} name="title" required type="text" />
          </Field>

          <Field>
            <FieldLabel>Sorumlu</FieldLabel>
            <Combobox
              itemToStringLabel={(item: (typeof items)[number]) => item.label}
              itemToStringValue={(item: (typeof items)[number]) => item.value}
              items={items}
              name="assigneeId"
              required
            >
              <ComboboxInput placeholder="Kişi arayın" />
              <ComboboxPopup>
                <ComboboxEmpty>Kapsamınızda bu adla kimse yok.</ComboboxEmpty>
                <ComboboxList>
                  {(item: (typeof items)[number]) => (
                    <ComboboxItem key={item.value} value={item}>
                      {item.label}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxPopup>
            </Combobox>
          </Field>

          <Field>
            <FieldLabel htmlFor="description">Açıklama</FieldLabel>
            <Textarea id="description" maxLength={4000} name="description" rows={4} />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field>
              <FieldLabel>Öncelik</FieldLabel>
              <Select defaultValue="normal" items={priorities} name="priority">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectPopup>
                  {priorities.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectPopup>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="dueOn">Son tarih</FieldLabel>
              <Input id="dueOn" name="dueOn" type="date" />
            </Field>
          </div>

          <Field>
            <Label>
              <Checkbox name="needsApproval" />
              Onayım gereksin
            </Label>
            <FieldDescription>
              İşaretlerseniz sorumlu &quot;tamamladım&quot; dediğinde görev siz onaylayana kadar
              açık kalır. İşaretlemezseniz görev kapanır ve size bildirim gelir.
            </FieldDescription>
          </Field>

          <Button className="self-start" loading={pending} type="submit">
            Görevi ver
          </Button>
        </Form>
      </FramePanel>
    </Frame>
  );
}
