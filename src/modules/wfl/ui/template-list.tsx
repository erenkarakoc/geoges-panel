"use client";

import { ArchiveRestoreIcon, CopyPlusIcon, LayersIcon, Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogPopup,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { useActionToast } from "@/platform/ui/feedback/use-action-toast";

/**
 * The templates the panel ships (SCR-195 "Şablonlar", REQ-WFL-027, REQ-WFL-028, TASK-0120).
 *
 * A template is never used directly: "Kopyasını kullan" makes a flow of your own from it, and from
 * then on the two are separate — a template that is updated later announces itself on the copy
 * rather than changing it (D-086).
 *
 * A template the company does not want is removed from the list for good: a panel update does not
 * bring it back, the flows copied from it stay as they are, and it can be restored from the removed
 * templates at the bottom of the page (D-293).
 */

export type TemplateCard = {
  key: string;
  name: string;
  summary: string | null;
  version: number;
  /** How many steps it has, so the card says how big it is without drawing it. */
  steps: number;
};

export function TemplateList({
  templates,
  removed = [],
  use,
  remove,
}: {
  templates: readonly TemplateCard[];
  /** Templates the company took off the list (D-293), offered back here. */
  removed?: readonly TemplateCard[];
  use: (templateKey: string) => Promise<{ error: string | null; key: string | null }>;
  remove: (input: { key: string; removed: boolean }) => Promise<{ error: string | null }>;
}) {
  const router = useRouter();
  const [result, setResult] = useState<{ error: string | null } | null>(null);
  const [pending, start] = useTransition();
  const [removing, setRemoving] = useState<TemplateCard | null>(null);

  const setRemoved = (key: string, gone: boolean) => {
    start(async () => {
      const said = await remove({ key, removed: gone });
      setResult(said);
      if (!said.error) {
        setRemoving(null);
        router.refresh();
      }
    });
  };

  useActionToast(result ?? {}, result?.error ? { type: "error", title: result.error } : null);

  const copy = (templateKey: string) => {
    start(async () => {
      const said = await use(templateKey);
      setResult(said);
      if (said.key) router.push(`/admin/workflows/${said.key}`);
    });
  };

  const removedList = removed.length ? (
    <section aria-labelledby="removed-templates" className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold" id="removed-templates">
        Kaldırılan şablonlar
      </h2>
      <p className="text-sm text-muted-foreground">
        Listeden kaldırdığınız şablonlar. Panel güncellendiğinde geri gelmezler; isterseniz buradan
        geri getirebilirsiniz.
      </p>
      <ul className="flex flex-col divide-y rounded-lg border">
        {removed.map((template) => (
          <li className="flex flex-wrap items-center justify-between gap-2 p-3" key={template.key}>
            <span className="text-sm font-medium">{template.name}</span>
            <Button
              disabled={pending}
              onClick={() => setRemoved(template.key, false)}
              size="sm"
              variant="outline"
            >
              <ArchiveRestoreIcon aria-hidden="true" />
              Geri getir
            </Button>
          </li>
        ))}
      </ul>
    </section>
  ) : null;

  if (templates.length === 0) {
    return (
      <div className="flex flex-1 flex-col gap-6">
        <Empty className="flex-1">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <LayersIcon aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle aria-level={2} role="heading">
              Şablon yok
            </EmptyTitle>
            <EmptyDescription>
              Şirketin varsayılan akışları buraya gelir; her biri kopyalanarak kullanılır.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
        {removedList}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {templates.map((template) => (
          <li className="flex" key={template.key}>
            <Card className="flex flex-1 flex-col">
              <CardHeader>
                <CardTitle>{template.name}</CardTitle>
                <span className="text-xs text-muted-foreground">
                  {template.steps} adım · {template.version}. sürüm
                </span>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col justify-between gap-3">
                <p className="text-sm text-muted-foreground">{template.summary}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <Button disabled={pending} onClick={() => copy(template.key)} variant="outline">
                    <CopyPlusIcon />
                    Kopyasını kullan
                  </Button>
                  <Button disabled={pending} onClick={() => setRemoving(template)} variant="ghost">
                    <Trash2Icon aria-hidden="true" />
                    Kaldır
                  </Button>
                </div>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
      {removedList}

      <AlertDialog
        onOpenChange={(open) => (open ? null : setRemoving(null))}
        open={removing !== null}
      >
        <AlertDialogPopup>
          <AlertDialogHeader>
            <AlertDialogTitle>“{removing?.name}” şablonu kaldırılsın mı?</AlertDialogTitle>
            <AlertDialogDescription>
              Şablon listeden kalkar ve panel güncellendiğinde geri gelmez. Bu şablondan daha önce
              kopyalanmış akışlar olduğu gibi kalır. Kaldırılan şablonlar bölümünden geri
              getirilebilir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogClose render={<Button variant="ghost" />}>Vazgeç</AlertDialogClose>
            <Button
              loading={pending}
              onClick={() => (removing ? setRemoved(removing.key, true) : null)}
              variant="destructive"
            >
              Kaldır
            </Button>
          </AlertDialogFooter>
        </AlertDialogPopup>
      </AlertDialog>
    </div>
  );
}
