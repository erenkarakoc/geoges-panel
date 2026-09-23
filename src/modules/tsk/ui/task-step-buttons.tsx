"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Form } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { taskStepAction } from "@/modules/tsk/application/task-actions";
import { initialTaskFormState } from "@/modules/tsk/application/task-form-state";
import { BottomBand } from "@/platform/ui/app-shell/bottom-band";
import { useActionToast } from "@/platform/ui/feedback/use-action-toast";

export type TaskSteps = {
  complete: boolean;
  approve: boolean;
  reopen: "reopen" | "send_back" | null;
};

/** The steps the viewer may take on a task (REQ-TSK-004); the database checks each again. */
export function TaskStepButtons({ taskId, steps }: { taskId: string; steps: TaskSteps }) {
  const [state, formAction, pending] = useActionState(taskStepAction, initialTaskFormState);
  useActionToast(
    state,
    state.error
      ? { type: "error", title: state.error }
      : state.done
        ? { type: "success", title: state.done }
        : null,
  );

  if (!steps.complete && !steps.approve && !steps.reopen) return null;

  // The buttons leave the page for the band, and reach their form through `form=` — a button
  // may submit a form it does not sit inside. The reason stays here, with the record it is
  // about: a band carries actions, not fields (D-228).
  const formId = `task-steps-${taskId}`;

  return (
    <Form action={formAction} className="flex flex-col gap-4" id={formId}>
      <input name="taskId" type="hidden" value={taskId} />
      {steps.reopen ? (
        <Field>
          <FieldLabel htmlFor="reason">
            {steps.reopen === "send_back" ? "Geri gönderme gerekçesi" : "Yeniden açma gerekçesi"}
          </FieldLabel>
          <Textarea id="reason" maxLength={1000} name="reason" rows={2} />
        </Field>
      ) : null}
      <BottomBand>
        {steps.reopen ? (
          <Button
            form={formId}
            loading={pending}
            name="step"
            type="submit"
            value="reopen"
            variant="outline"
          >
            {steps.reopen === "send_back" ? "Geri gönder" : "Yeniden aç"}
          </Button>
        ) : null}
        {steps.complete ? (
          <Button form={formId} loading={pending} name="step" type="submit" value="complete">
            Tamamladım
          </Button>
        ) : null}
        {steps.approve ? (
          <Button form={formId} loading={pending} name="step" type="submit" value="approve">
            Onayla ve kapat
          </Button>
        ) : null}
      </BottomBand>
    </Form>
  );
}
