"use client";

import { ListIcon, MoreHorizontalIcon, PlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Badge } from "@/components/ui/badge";
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
import { Menu, MenuItem, MenuPopup, MenuTrigger } from "@/components/ui/menu";
import { useActionToast } from "@/platform/ui/feedback/use-action-toast";

/**
 * One shared list (SCR-190, REQ-ADM-001, REQ-ADM-006, TASK-0121): units, work items, consumables,
 * expense categories, no-work reasons.
 *
 * Before a new name is added the list shows what already looks like it — "Nakliye" and "Nakliye
 * masrafı" are the same thing typed twice, and a report split between them is a wrong report. A
 * used item is never deleted; it turns passive, so history still names it.
 */

type Result = { error: string | null };
type Item = { id: string; code: string | null; name: string; status: "active" | "passive" };

export type CatalogActions = {
  similar: (name: string) => Promise<{ name: string }[]>;
  add: (name: string) => Promise<Result>;
  setStatus: (itemId: string, status: "active" | "passive") => Promise<Result>;
};

export function CatalogItemList({
  title,
  description,
  items,
  canAdd,
  canManage,
  actions,
}: {
  title: string;
  description: string | null;
  items: readonly Item[];
  /** Whether the person may add to this list — managers always, others where the list allows it. */
  canAdd: boolean;
  canManage: boolean;
  actions: CatalogActions;
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [lookalikes, setLookalikes] = useState<{ name: string }[] | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [pending, start] = useTransition();

  useActionToast(result ?? {}, result?.error ? { type: "error", title: result.error } : null);

  const close = () => {
    setAdding(false);
    setName("");
    setLookalikes(null);
  };

  /** First look for lookalikes; only add when there are none, or when the person says it is new. */
  const submit = () =>
    start(async () => {
      if (lookalikes === null) {
        const found = await actions.similar(name);
        if (found.length > 0) {
          setLookalikes(found);
          return;
        }
      }
      const said = await actions.add(name);
      setResult(said);
      if (!said.error) {
        close();
        router.refresh();
      }
    });

  const toggle = (item: Item) =>
    start(async () => {
      const said = await actions.setStatus(
        item.id,
        item.status === "active" ? "passive" : "active",
      );
      setResult(said);
      if (!said.error) router.refresh();
    });

  const addButton = canAdd ? (
    <Button onClick={() => setAdding(true)}>
      <PlusIcon aria-hidden="true" />
      Kalem ekle
    </Button>
  ) : null;

  return (
    <>
      {items.length === 0 ? (
        <Empty className="flex-1">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ListIcon aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle aria-level={2} role="heading">
              Bu listede kalem yok
            </EmptyTitle>
            {description ? <EmptyDescription>{description}</EmptyDescription> : null}
          </EmptyHeader>
          {addButton ? <EmptyContent>{addButton}</EmptyContent> : null}
        </Empty>
      ) : (
        <Frame className="w-full">
          <FrameHeader className="flex-row items-start justify-between gap-3">
            <div className="flex min-w-0 flex-col">
              <FrameTitle>{title}</FrameTitle>
              {description ? <FrameDescription>{description}</FrameDescription> : null}
            </div>
            {addButton}
          </FrameHeader>
          <FramePanel>
            <ul className="divide-y">
              {items.map((item) => (
                <li className="flex min-h-12 items-center gap-3 py-2" key={item.id}>
                  <span className="min-w-0 flex-1 truncate">{item.name}</span>
                  {item.status === "passive" ? <Badge variant="secondary">Pasif</Badge> : null}
                  {canManage ? (
                    <Menu>
                      <MenuTrigger
                        render={
                          <Button aria-label="Kalem işlemleri" size="icon-sm" variant="ghost" />
                        }
                      >
                        <MoreHorizontalIcon aria-hidden="true" />
                      </MenuTrigger>
                      <MenuPopup align="end">
                        <MenuItem onClick={() => toggle(item)}>
                          {item.status === "active" ? "Pasifleştir" : "Etkinleştir"}
                        </MenuItem>
                      </MenuPopup>
                    </Menu>
                  ) : null}
                </li>
              ))}
            </ul>
          </FramePanel>
        </Frame>
      )}

      <Dialog onOpenChange={(open) => (open ? setAdding(true) : close())} open={adding}>
        <DialogPopup>
          <DialogHeader>
            <DialogTitle>Kalem ekle</DialogTitle>
            <DialogDescription>
              Eklemeden önce listede benzer bir kalem olup olmadığına bakılır.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 px-4 pb-2">
            <Field>
              <FieldLabel htmlFor="catalog-name">Ad</FieldLabel>
              <Input
                id="catalog-name"
                onChange={(event) => {
                  setName(event.currentTarget.value);
                  setLookalikes(null);
                }}
                value={name}
              />
            </Field>
            {lookalikes?.length ? (
              <div className="flex flex-col gap-1 rounded-md border border-warning/40 bg-warning/8 p-3 text-sm">
                <span>Listede buna benzeyen kalemler var:</span>
                <ul className="list-inside list-disc">
                  {lookalikes.map((one) => (
                    <li key={one.name}>{one.name}</li>
                  ))}
                </ul>
                <FieldDescription>
                  Aynı şeyse varolanı kullanın; gerçekten yeniyse yine de ekleyebilirsiniz.
                </FieldDescription>
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="ghost" />}>Vazgeç</DialogClose>
            <Button disabled={!name.trim()} loading={pending} onClick={submit}>
              {lookalikes?.length ? "Yine de ekle" : "Ekle"}
            </Button>
          </DialogFooter>
        </DialogPopup>
      </Dialog>
    </>
  );
}
