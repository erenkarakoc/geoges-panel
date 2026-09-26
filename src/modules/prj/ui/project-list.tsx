"use client";

import { FolderKanbanIcon, PlusIcon, SearchIcon } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";

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
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/frame";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  EMPTY_CONTRACT,
  EMPTY_PROJECT,
  ProjectForm,
  type ContractFormValue,
  type ProjectFormValue,
} from "@/modules/prj/ui/project-form";
import type { Choice } from "@/platform/ui/form/choice-field";
import { DoneMeter } from "@/platform/ui/chart/chart";
import { useActionToast } from "@/platform/ui/feedback/use-action-toast";

/**
 * Projeler (SCR-022, TASK-0123 step 1): the projects the person may see, each with its client and
 * stage. A new project is opened with a company-wide right; its sites are opened from its card.
 */

type Row = {
  id: string;
  code: string;
  name: string;
  clientName: string | null;
  city: string | null;
  stageName: string;
  wallsTotal?: number;
  wallsCompleted?: number;
};

type Result = { error: string | null; id?: string | null };

export function ProjectList({
  projects,
  words,
  canOpen,
  canSeeContract,
  clients,
  people,
  open,
}: {
  projects: readonly Row[];
  words: string;
  canOpen: boolean;
  /** Whether the new-project form may ask the contract value (company-wide commercial right). */
  canSeeContract: boolean;
  clients: readonly Choice[];
  people: readonly Choice[];
  open: (project: ProjectFormValue, contract: ContractFormValue | null) => Promise<Result>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [typed, setTyped] = useState(words);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<ProjectFormValue>(EMPTY_PROJECT);
  const [contract, setContract] = useState<ContractFormValue>(EMPTY_CONTRACT);
  const [result, setResult] = useState<Result | null>(null);
  const [pending, start] = useTransition();

  useActionToast(result ?? {}, result?.error ? { type: "error", title: result.error } : null);

  const submit = () =>
    start(async () => {
      const said = await open(form, canSeeContract ? contract : null);
      setResult(said);
      if (!said.error && said.id) {
        setAdding(false);
        router.push(`/projects/${said.id}`);
      }
    });

  const addButton = canOpen ? (
    <Button className="max-md:h-11" onClick={() => setAdding(true)}>
      <PlusIcon aria-hidden="true" />
      Proje aç
    </Button>
  ) : null;

  return (
    <>
      <Frame className="w-full">
        <FrameHeader className="flex-row items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col">
            <FrameTitle>Projeler</FrameTitle>
            <FrameDescription>
              Her proje bir sözleşmedir; şantiyeleri, duvarları ve hedefleri kartındadır.
            </FrameDescription>
          </div>
          {addButton}
        </FrameHeader>
        <FramePanel className="flex flex-col gap-4">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const query = typed.trim();
              router.push(query ? `${pathname}?q=${encodeURIComponent(query)}` : pathname);
            }}
            role="search"
          >
            <InputGroup>
              <InputGroupInput
                aria-label="Proje ara"
                onChange={(event) => setTyped(event.currentTarget.value)}
                placeholder="Kod, ad, il ya da kurum"
                type="search"
                value={typed}
              />
              <InputGroupAddon>
                <SearchIcon aria-hidden="true" />
              </InputGroupAddon>
            </InputGroup>
          </form>

          {projects.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <FolderKanbanIcon aria-hidden="true" />
                </EmptyMedia>
                <EmptyTitle aria-level={2} role="heading">
                  {words ? "Bu aramaya uyan proje yok" : "Görebileceğiniz proje yok"}
                </EmptyTitle>
                <EmptyDescription>
                  {words
                    ? "Aramayı değiştirin."
                    : "Size atanan projeler ve şantiyelerinizin projeleri burada görünür."}
                </EmptyDescription>
              </EmptyHeader>
              {!words && addButton ? <EmptyContent>{addButton}</EmptyContent> : null}
            </Empty>
          ) : (
            <>
              <ul className="flex flex-col gap-2 lg:hidden">
                {projects.map((project) => (
                  <li key={project.id}>
                    <Link
                      className="flex flex-col gap-1 rounded-lg border p-3 hover:bg-accent/50"
                      href={`/projects/${project.id}`}
                    >
                      <span className="font-medium">
                        {project.code} · {project.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {[project.clientName, project.city].filter(Boolean).join(" · ")}
                      </span>
                      <Badge className="self-start" variant="outline">
                        {project.stageName}
                      </Badge>
                      {project.wallsTotal ? (
                        <DoneMeter
                          className="mt-1"
                          done={project.wallsCompleted ?? 0}
                          label="Tamamlanan duvar"
                          total={project.wallsTotal}
                          unit="duvar"
                        />
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
              <Table className="hidden lg:table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Kod</TableHead>
                    <TableHead>Proje</TableHead>
                    <TableHead>İşveren</TableHead>
                    <TableHead>İl</TableHead>
                    <TableHead>Aşama ve duvarlar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell className="font-medium">{project.code}</TableCell>
                      <TableCell>
                        <Link className="hover:underline" href={`/projects/${project.id}`}>
                          {project.name}
                        </Link>
                      </TableCell>
                      <TableCell>{project.clientName ?? "—"}</TableCell>
                      <TableCell>{project.city ?? "—"}</TableCell>
                      <TableCell>
                        <div className="flex flex-col items-start gap-1.5">
                          <Badge variant="outline">{project.stageName}</Badge>
                          {project.wallsTotal ? (
                            <DoneMeter
                              done={project.wallsCompleted ?? 0}
                              label="Tamamlanan duvar"
                              total={project.wallsTotal}
                              unit="duvar"
                            />
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
        </FramePanel>
      </Frame>

      <Dialog onOpenChange={setAdding} open={adding}>
        <DialogPopup className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Proje aç</DialogTitle>
            <DialogDescription>
              Proje sözleşme aşamasında açılır; şantiyeleri ve duvarları kartından eklenir.
            </DialogDescription>
          </DialogHeader>
          <DialogPanel>
            <ProjectForm
              clients={clients}
              contract={canSeeContract ? contract : undefined}
              idPrefix="project-new"
              onChange={setForm}
              onContractChange={setContract}
              people={people}
              value={form}
            />
          </DialogPanel>
          <DialogFooter>
            <DialogClose render={<Button variant="ghost" />}>Vazgeç</DialogClose>
            <Button
              disabled={!form.code.trim() || !form.name.trim()}
              loading={pending}
              onClick={submit}
            >
              Aç
            </Button>
          </DialogFooter>
        </DialogPopup>
      </Dialog>
    </>
  );
}
