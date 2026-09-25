"use client";

import { ChevronLeftIcon, MoreHorizontalIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Frame, FrameHeader, FramePanel, FrameTitle } from "@/components/ui/frame";
import { Menu, MenuItem, MenuPopup, MenuTrigger } from "@/components/ui/menu";
import { Tabs, TabsList, TabsPanel, TabsTab } from "@/components/ui/tabs";
import type { Project, ProjectContract, StageChange } from "@/modules/prj/data/project-store";
import {
  ProjectForm,
  type ContractFormValue,
  type ProjectFormValue,
} from "@/modules/prj/ui/project-form";
import { ChoiceField, type Choice } from "@/platform/ui/form/choice-field";
import { useActionToast } from "@/platform/ui/feedback/use-action-toast";

/**
 * Proje detayı (SCR-023, TASK-0123 step 1): the card, the three durations side by side, the stage
 * and its history, the project's sites (handed in by the page, which may compose SIT's part), the
 * walls and targets of the revision valid today and the revisions themselves. The technical
 * office and the supply matrix join as their steps land; the
 * contract and progress payment tabs say which slice brings them (D-287).
 */

type Result = { error: string | null; id?: string | null };

export type ProjectCardActions = {
  change: (value: ProjectFormValue) => Promise<Result>;
  changeContract: (value: ContractFormValue) => Promise<Result>;
  moveStage: (stage: string) => Promise<Result>;
};

type CustomValue = {
  definition: {
    code: string;
    label: string;
    type: string;
    options: readonly { value: string; label: string }[] | null;
  };
  value: unknown;
};

const day = new Intl.DateTimeFormat("tr-TR", { dateStyle: "long" });
const moment = new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short" });
const dateText = (value: string | null) =>
  value ? day.format(new Date(`${value}T12:00:00`)) : null;

export function ProjectCard({
  project,
  contract,
  stages,
  stageChoices,
  clientName,
  coordinatorName,
  peopleNames,
  customFields,
  canManage,
  canSeeContract,
  clients,
  people,
  sites,
  targets,
  revisions,
  actions,
}: {
  project: Project;
  contract: ProjectContract | null;
  stages: readonly StageChange[];
  stageChoices: readonly { code: string; name: string }[];
  clientName: string | null;
  coordinatorName: string | null;
  peopleNames: Readonly<Record<string, string>>;
  customFields: readonly CustomValue[];
  canManage: boolean;
  canSeeContract: boolean;
  clients: readonly Choice[];
  people: readonly Choice[];
  /** The Şantiyeler tab's content, composed by the page from SIT. */
  sites: ReactNode;
  /** Duvarlar ve hedefler: what the revision valid today says (step 2). */
  targets: ReactNode;
  /** Revizyonlar: the project's revisions (step 2). */
  revisions: ReactNode;
  actions: ProjectCardActions;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [movingStage, setMovingStage] = useState(false);
  const [stage, setStage] = useState(project.stage);
  const [form, setForm] = useState<ProjectFormValue>(() => toForm(project));
  const [money, setMoney] = useState<ContractFormValue>(() => toContract(contract));
  const [result, setResult] = useState<Result | null>(null);
  const [pending, start] = useTransition();

  useActionToast(result ?? {}, result?.error ? { type: "error", title: result.error } : null);

  const stageName = new Map(stageChoices.map((one) => [one.code, one.name]));
  const named = (code: string | null) => (code ? (stageName.get(code) ?? code) : null);

  const run = (work: () => Promise<Result>, done: () => void) =>
    start(async () => {
      const said = await work();
      setResult(said);
      if (!said.error) {
        done();
        router.refresh();
      }
    });

  const save = () =>
    start(async () => {
      const said = await actions.change(form);
      if (!said.error && canSeeContract) {
        const savedMoney = await actions.changeContract(money);
        setResult(savedMoney);
        if (savedMoney.error) return;
      } else {
        setResult(said);
        if (said.error) return;
      }
      setEditing(false);
      router.refresh();
    });

  return (
    <div className="flex flex-col gap-4">
      <Button className="self-start" render={<Link href="/projects" />} size="sm" variant="ghost">
        <ChevronLeftIcon aria-hidden="true" />
        Projeler
      </Button>

      <header className="flex items-start gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <span className="text-sm text-muted-foreground">{project.code}</span>
          <h1 className="text-xl font-semibold">{project.name}</h1>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{named(project.stage)}</Badge>
            {clientName ? <Badge variant="secondary">{clientName}</Badge> : null}
          </div>
        </div>
        {canManage ? (
          <Menu>
            <MenuTrigger
              render={
                <Button
                  aria-label="Proje işlemleri"
                  className="max-md:size-11"
                  size="icon"
                  variant="outline"
                />
              }
            >
              <MoreHorizontalIcon aria-hidden="true" />
            </MenuTrigger>
            <MenuPopup align="end">
              <MenuItem
                onClick={() => {
                  setForm(toForm(project));
                  setMoney(toContract(contract));
                  setEditing(true);
                }}
              >
                Kartı düzenle
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setStage(project.stage);
                  setMovingStage(true);
                }}
              >
                Aşamayı değiştir
              </MenuItem>
            </MenuPopup>
          </Menu>
        ) : null}
      </header>

      <Tabs defaultValue="details">
        <div className="[scrollbar-width:none] overflow-x-auto overflow-y-hidden [&::-webkit-scrollbar]:hidden">
          {/* 44 px tabs on a phone and a pinned vertical axis, as on the firm card (row 17a, 15c). */}
          <TabsList className="max-md:[&>button]:h-11" variant="underline">
            <TabsTab value="details">Bilgiler</TabsTab>
            <TabsTab value="sites">Şantiyeler</TabsTab>
            <TabsTab value="targets">Duvarlar ve hedefler</TabsTab>
            <TabsTab value="revisions">Revizyonlar</TabsTab>
            <TabsTab value="stages">Aşama geçmişi</TabsTab>
            <TabsTab value="contract">Sözleşme ve hakediş</TabsTab>
          </TabsList>
        </div>

        <TabsPanel className="flex flex-col gap-4 pt-4" value="details">
          <Frame>
            <FrameHeader>
              <FrameTitle>Süreler</FrameTitle>
            </FrameHeader>
            <FramePanel>
              <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-3">
                <Fact label="Sözleşmedeki bitiş">{dateText(project.contractEndOn)}</Fact>
                <Fact label="Teorik bitiş">{dateText(project.theoreticalEndOn)}</Fact>
                <Fact label="Yönetim hedef bitişi">{dateText(project.managementTargetEndOn)}</Fact>
              </dl>
            </FramePanel>
          </Frame>
          <Frame>
            <FramePanel>
              <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                <Fact label="İşveren">{clientName}</Fact>
                <Fact label="Kurum / idare">{project.authority}</Fact>
                <Fact label="İl">{project.city}</Fact>
                <Fact label="Lokasyon">{project.location}</Fact>
                <Fact label="Sorumlu koordinatör">{coordinatorName}</Fact>
                <Fact label="Sözleşme numarası">{project.contractNo}</Fact>
                <Fact label="Sözleşme tarihi">{dateText(project.contractSignedOn)}</Fact>
                <Fact label="Sözleşme başlangıcı">{dateText(project.contractStartOn)}</Fact>
                {canSeeContract ? (
                  <Fact label="Sözleşme bedeli">
                    {contract?.contractValue != null
                      ? new Intl.NumberFormat("tr-TR", {
                          currency: contract.currency,
                          style: "currency",
                        }).format(contract.contractValue)
                      : null}
                  </Fact>
                ) : null}
                {customFields.map(({ definition, value }) => (
                  <Fact key={definition.code} label={definition.label}>
                    {customText(definition, value)}
                  </Fact>
                ))}
              </dl>
            </FramePanel>
          </Frame>
        </TabsPanel>

        <TabsPanel className="pt-4" value="sites">
          {sites}
        </TabsPanel>

        <TabsPanel className="pt-4" value="targets">
          {targets}
        </TabsPanel>

        <TabsPanel className="pt-4" value="revisions">
          {revisions}
        </TabsPanel>

        <TabsPanel className="pt-4" value="stages">
          <Frame>
            <FramePanel>
              <ol className="flex flex-col gap-3">
                {stages.map((change, index) => (
                  <li className="flex flex-col gap-0.5" key={`${change.toStage}-${index}`}>
                    <span className="font-medium">{named(change.toStage)}</span>
                    <span className="text-xs text-muted-foreground">
                      {moment.format(change.changedAt)}
                      {change.changedByUserId
                        ? ` · ${peopleNames[change.changedByUserId] ?? "—"}`
                        : " · akış"}
                    </span>
                  </li>
                ))}
              </ol>
            </FramePanel>
          </Frame>
        </TabsPanel>

        <TabsPanel className="pt-4" value="contract">
          <Empty>
            <EmptyHeader>
              <EmptyTitle aria-level={2} role="heading">
                Henüz yok
              </EmptyTitle>
              <EmptyDescription>
                Sözleşme şartları ve yükümlülükleri, hakediş durumu ve tutarları burada görünecek.
              </EmptyDescription>
              <Badge className="mt-2" variant="outline">
                Hakediş Finans dilimiyle (Faz 11), yükümlülükler Uyum dilimiyle (Faz 14) gelir.
              </Badge>
            </EmptyHeader>
          </Empty>
        </TabsPanel>
      </Tabs>

      <Dialog onOpenChange={setEditing} open={editing}>
        <DialogPopup className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Kartı düzenle</DialogTitle>
            <DialogDescription>Eski bilgiler projenin geçmişinde kalır.</DialogDescription>
          </DialogHeader>
          <DialogPanel>
            <ProjectForm
              clients={clients}
              contract={canSeeContract ? money : undefined}
              idPrefix="project-edit"
              onChange={setForm}
              onContractChange={setMoney}
              people={people}
              value={form}
            />
          </DialogPanel>
          <DialogFooter>
            <DialogClose render={<Button variant="ghost" />}>Vazgeç</DialogClose>
            <Button
              disabled={!form.code.trim() || !form.name.trim()}
              loading={pending}
              onClick={save}
            >
              Kaydet
            </Button>
          </DialogFooter>
        </DialogPopup>
      </Dialog>

      <Dialog onOpenChange={setMovingStage} open={movingStage}>
        <DialogPopup>
          <DialogHeader>
            <DialogTitle>Aşamayı değiştir</DialogTitle>
            <DialogDescription>
              Geçiş tarih ve kişiyle aşama geçmişine yazılır; bağlı akışlar bu geçişle başlar.
            </DialogDescription>
          </DialogHeader>
          <DialogPanel>
            <ChoiceField
              items={stageChoices.map((one) => ({ label: one.name, value: one.code }))}
              label="Yeni aşama"
              onChange={setStage}
              value={stage}
            />
          </DialogPanel>
          <DialogFooter>
            <DialogClose render={<Button variant="ghost" />}>Vazgeç</DialogClose>
            <Button
              disabled={stage === project.stage}
              loading={pending}
              onClick={() =>
                run(
                  () => actions.moveStage(stage),
                  () => setMovingStage(false),
                )
              }
            >
              Kaydet
            </Button>
          </DialogFooter>
        </DialogPopup>
      </Dialog>
    </div>
  );
}

function toForm(project: Project): ProjectFormValue {
  return {
    authority: project.authority ?? "",
    city: project.city ?? "",
    clientPartyId: project.clientPartyId ?? "",
    code: project.code,
    contractEndOn: project.contractEndOn ?? "",
    contractNo: project.contractNo ?? "",
    contractSignedOn: project.contractSignedOn ?? "",
    contractStartOn: project.contractStartOn ?? "",
    coordinatorUserId: project.coordinatorUserId ?? "",
    location: project.location ?? "",
    managementTargetEndOn: project.managementTargetEndOn ?? "",
    name: project.name,
    theoreticalEndOn: project.theoreticalEndOn ?? "",
  };
}

function toContract(contract: ProjectContract | null): ContractFormValue {
  return {
    contractValue:
      contract?.contractValue != null
        ? new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 2 }).format(
            contract.contractValue,
          )
        : "",
    currency: contract?.currency ?? "TRY",
  };
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 break-words">{children || "—"}</dd>
    </div>
  );
}

function customText(definition: CustomValue["definition"], value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (definition.type === "boolean") return value ? "Evet" : "Hayır";
  if (definition.type === "select")
    return definition.options?.find((option) => option.value === value)?.label ?? String(value);
  if (definition.type === "date" && typeof value === "string") return dateText(value);
  if (definition.type === "number" && typeof value === "number")
    return new Intl.NumberFormat("tr-TR").format(value);
  return String(value);
}
