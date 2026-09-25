import type { Metadata } from "next";

import { openProjectAction } from "@/app/(app)/projects/actions";
import { partyChoices, partyNames } from "@/modules/crm";
import { listPeople } from "@/modules/iam";
import {
  listProjects,
  mayEnterContractValue,
  mayOpenNewProject,
  mayOpenProjects,
  projectStages,
} from "@/modules/prj";
import { ProjectsDenied } from "@/modules/prj/ui/projects-denied";
import { ProjectList } from "@/modules/prj/ui/project-list";
import { isModuleEnabled } from "@/platform/features/features";
import { FeatureOff } from "@/platform/ui/feature-off";

export const metadata: Metadata = { title: "Projeler" };

const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

/** SCR-022 — projects (TASK-0123 step 1); the search's "Tümünü gör" lands here too. */
export default async function ProjectsPage({ searchParams }: PageProps<"/projects">) {
  if (!isModuleEnabled("PRJ")) return <FeatureOff />;
  if (!(await mayOpenProjects())) return <ProjectsDenied />;

  const words = one((await searchParams).q)?.trim() ?? "";
  const [projects, canOpen, canSeeContract, stages] = await Promise.all([
    listProjects({ words }),
    mayOpenNewProject(),
    mayEnterContractValue(),
    projectStages(),
  ]);
  const clientIds = [
    ...new Set(projects.flatMap((p) => (p.clientPartyId ? [p.clientPartyId] : []))),
  ];
  const [clientNames, clients, people] = await Promise.all([
    partyNames(clientIds),
    canOpen ? partyChoices("client") : Promise.resolve([]),
    canOpen ? listPeople() : Promise.resolve([]),
  ]);
  const stageName = new Map(stages.map((stage) => [stage.code, stage.name]));

  return (
    <ProjectList
      canOpen={canOpen}
      canSeeContract={canSeeContract}
      clients={clients.map((c) => ({ label: c.name, value: c.id }))}
      key={words}
      open={openProjectAction}
      people={people.filter((p) => p.active).map((p) => ({ label: p.displayName, value: p.id }))}
      projects={projects.map((p) => ({
        city: p.city,
        clientName: p.clientPartyId ? (clientNames.get(p.clientPartyId) ?? null) : null,
        code: p.code,
        id: p.id,
        name: p.name,
        stageName: stageName.get(p.stage) ?? p.stage,
      }))}
      words={words}
    />
  );
}
