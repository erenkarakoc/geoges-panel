"use client";

import { PlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

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
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useActionToast } from "@/platform/ui/feedback/use-action-toast";

/**
 * "Yeni akış" (SCR-195, TASK-0119).
 *
 * One question — what is this process called — because everything else is what the designer is for.
 * The new flow begins as a start and an end, so the designer opens on a whole definition instead of
 * on a list of complaints.
 */
export function NewFlowButton({
  create,
  variant = "default",
}: {
  create: (name: string) => Promise<{ error: string | null; key: string | null }>;
  variant?: "default" | "outline";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [result, setResult] = useState<{ error: string | null; key: string | null } | null>(null);
  const [pending, start] = useTransition();

  useActionToast(result ?? {}, result?.error ? { type: "error", title: result.error } : null);

  const submit = () => {
    start(async () => {
      const answer = await create(name);
      setResult(answer);
      if (answer.key) {
        setOpen(false);
        setName("");
        router.push(`/admin/workflows/${answer.key}`);
      }
    });
  };

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <Button onClick={() => setOpen(true)} variant={variant}>
        <PlusIcon aria-hidden="true" />
        Yeni akış
      </Button>
      <DialogPopup>
        <DialogHeader>
          <DialogTitle>Yeni akış</DialogTitle>
          <DialogDescription>
            Akış bir start ve bir bitiş adımıyla açılır; aralarını tasarımcıda kurarsınız.
          </DialogDescription>
        </DialogHeader>
        <div className="px-4 pb-2">
          <Field>
            <FieldLabel htmlFor="flow-name">Akışın adı</FieldLabel>
            <Input
              autoFocus
              id="flow-name"
              onChange={(event) => setName(event.currentTarget.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") submit();
              }}
              placeholder="Şantiye çıkış işlemi"
              value={name}
            />
            <FieldDescription>Bu ad listede, görevlerde ve bildirimlerde görünür.</FieldDescription>
          </Field>
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="ghost" />}>Vazgeç</DialogClose>
          <Button disabled={name.trim().length < 3} loading={pending} onClick={submit}>
            Oluştur
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
