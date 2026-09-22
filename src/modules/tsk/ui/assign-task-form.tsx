"use client";

import { useRouter } from "next/navigation";
import { useActionState, useState } from "react";

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
  Drawer,
  DrawerClose,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerPanel,
  DrawerPopup,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Form } from "@/components/ui/form";
import {
  Frame,
  FrameDescription,
  FrameFooter,
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
import { useMediaQuery } from "@/hooks/use-media-query";
import { assignTaskAction } from "@/modules/tsk/application/task-actions";
import { initialTaskFormState } from "@/modules/tsk/application/task-form-state";
import { PRIORITY_LABELS, TASK_PRIORITIES } from "@/modules/tsk/domain/tasks";
import { useActionToast } from "@/platform/ui/feedback/use-action-toast";

type Person = { id: string; displayName: string };
type Props = { people: readonly Person[]; selfId: string };

const TITLE = "Görev ver";
const DESCRIPTION =
  "Kapsamınızdaki herkese ve kendinize görev verebilirsiniz. Sorumluya bildirim gider.";

const priorities = TASK_PRIORITIES.map((value) => ({ value, label: PRIORITY_LABELS[value] }));

/**
 * The fields of SCR-014 (REQ-TSK-001, REQ-TSK-003, REQ-TSK-004). The picker lists only the
 * people in the giver's scope (SCREEN_STATES: "kapsam dışı kişi seçilemez"); the database checks
 * it again.
 */
function AssignTaskFields({ people, selfId }: Props) {
  const items = people.map((p) => ({
    value: p.id,
    label: p.id === selfId ? `${p.displayName} (ben)` : p.displayName,
  }));
  type Item = (typeof items)[number];

  return (
    <>
      <Field>
        <FieldLabel htmlFor="title">Başlık</FieldLabel>
        <Input id="title" maxLength={200} name="title" required type="text" />
      </Field>

      <Field>
        <FieldLabel>Sorumlu</FieldLabel>
        <Combobox
          itemToStringLabel={(item: Item) => item.label}
          itemToStringValue={(item: Item) => item.value}
          items={items}
          name="assigneeId"
          required
        >
          <ComboboxInput placeholder="Kişi arayın" />
          <ComboboxPopup>
            <ComboboxEmpty>Kapsamınızda bu adla kimse yok.</ComboboxEmpty>
            <ComboboxList>
              {(item: Item) => (
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
        <Textarea id="description" maxLength={4000} name="description" rows={3} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
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
          İşaretlerseniz sorumlu &quot;tamamladım&quot; dediğinde görev siz onaylayana kadar açık
          kalır. İşaretlemezseniz görev kapanır ve size bildirim gelir.
        </FieldDescription>
      </Field>
    </>
  );
}

/** SCR-014 as a full page, for an address opened directly; opens the new task when done. */
export function AssignTaskPage(props: Props) {
  const [state, formAction, pending] = useActionState(assignTaskAction, initialTaskFormState);
  useActionToast(state, state.error ? { type: "error", title: state.error } : null);

  return (
    <Frame className="w-full max-w-2xl">
      <FrameHeader>
        <FrameTitle>{TITLE}</FrameTitle>
        <FrameDescription>{DESCRIPTION}</FrameDescription>
      </FrameHeader>
      <Form action={formAction} className="contents">
        <FramePanel className="flex flex-col gap-4">
          <AssignTaskFields {...props} />
        </FramePanel>
        <FrameFooter>
          <Button loading={pending} type="submit">
            Görevi ver
          </Button>
        </FrameFooter>
      </Form>
    </Frame>
  );
}

/**
 * SCR-014 over the current page (D-062 primary action): a Dialog on desktop, a Drawer on a phone
 * (DESIGN_SYSTEM_RULES section 2, COSS `p-drawer-12`). Closing goes back, so the address and the
 * browser's back button agree with what is on screen.
 */
export function AssignTaskOverlay(props: Props) {
  const router = useRouter();
  const isMobile = useMediaQuery("max-md");
  const [open, setOpen] = useState(true);
  const [state, formAction, pending] = useActionState(assignTaskAction, initialTaskFormState);

  useActionToast(
    state,
    state.error
      ? { type: "error", title: state.error }
      : state.done
        ? { type: "success", title: state.done }
        : null,
  );

  // A given task closes the overlay; so does the person.
  const isOpen = open && !state.taskId;
  const onOpenChange = (next: boolean) => setOpen(next);
  // Once the closing animation ends, leave the intercepted address.
  const onOpenChangeComplete = (isOpen: boolean) => {
    if (isOpen) return;
    router.back();
    if (state.taskId) router.refresh();
  };

  const fields = (
    <>
      <input name="stay" type="hidden" value="1" />
      <AssignTaskFields {...props} />
    </>
  );
  const submit = (
    <Button loading={pending} type="submit">
      Görevi ver
    </Button>
  );

  if (isMobile) {
    return (
      <Drawer onOpenChange={onOpenChange} onOpenChangeComplete={onOpenChangeComplete} open={isOpen}>
        <DrawerPopup showBar>
          <DrawerHeader>
            <DrawerTitle>{TITLE}</DrawerTitle>
            <DrawerDescription>{DESCRIPTION}</DrawerDescription>
          </DrawerHeader>
          <Form action={formAction} className="contents">
            <DrawerPanel className="grid gap-4">{fields}</DrawerPanel>
            <DrawerFooter>
              <DrawerClose render={<Button variant="ghost" />}>Vazgeç</DrawerClose>
              {submit}
            </DrawerFooter>
          </Form>
        </DrawerPopup>
      </Drawer>
    );
  }

  return (
    <Dialog onOpenChange={onOpenChange} onOpenChangeComplete={onOpenChangeComplete} open={isOpen}>
      <DialogPopup className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{TITLE}</DialogTitle>
          <DialogDescription>{DESCRIPTION}</DialogDescription>
        </DialogHeader>
        <Form action={formAction} className="contents">
          <DialogPanel className="grid gap-4">{fields}</DialogPanel>
          <DialogFooter>
            <DialogClose render={<Button variant="ghost" />}>Vazgeç</DialogClose>
            {submit}
          </DialogFooter>
        </Form>
      </DialogPopup>
    </Dialog>
  );
}
