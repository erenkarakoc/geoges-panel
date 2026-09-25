"use client";

import { CopyPlusIcon, LayersIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

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
  use,
}: {
  templates: readonly TemplateCard[];
  use: (templateKey: string) => Promise<{ error: string | null; key: string | null }>;
}) {
  const router = useRouter();
  const [result, setResult] = useState<{ error: string | null; key: string | null } | null>(null);
  const [pending, start] = useTransition();

  useActionToast(result ?? {}, result?.error ? { type: "error", title: result.error } : null);

  const copy = (templateKey: string) => {
    start(async () => {
      const said = await use(templateKey);
      setResult(said);
      if (said.key) router.push(`/admin/workflows/${said.key}`);
    });
  };

  if (templates.length === 0) {
    return (
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
    );
  }

  return (
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
              <Button
                className="self-start"
                disabled={pending}
                onClick={() => copy(template.key)}
                variant="outline"
              >
                <CopyPlusIcon />
                Kopyasını kullan
              </Button>
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}
