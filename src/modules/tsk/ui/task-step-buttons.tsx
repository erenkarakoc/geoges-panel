"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Form } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { taskStepAction } from "@/modules/tsk/application/task-actions";
import { initialTaskFormState } from "@/modules/tsk/application/task-form-state";
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

  return (
    <Form action={formAction} className="flex flex-col gap-4">
      <input name="taskId" type="hidden" value={taskId} />
      {steps.reopen ? (
        <Field>
          <FieldLabel htmlFor="reason">
            {steps.reopen === "send_back" ? "Geri gönderme gerekçesi" : "Yeniden açma gerekçesi"}
          </FieldLabel>
          <Textarea id="reason" maxLength={1000} name="reason" rows={2} />
        </Field>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {steps.complete ? (
          <Button loading={pending} name="step" type="submit" value="complete">
            Tamamladım
          </Button>
        ) : null}
        {steps.approve ? (
          <Button loading={pending} name="step" type="submit" value="approve">
            Onayla ve kapat
          </Button>
        ) : null}
        {steps.reopen ? (
          <Button loading={pending} name="step" type="submit" value="reopen" variant="outline">
            {steps.reopen === "send_back" ? "Geri gönder" : "Yeniden aç"}
          </Button>
        ) : null}
      </div>
    </Form>
  );
}
