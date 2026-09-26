import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  changeContractAction,
  changeProjectAction,
  changeSiteAction,
  markWallAction,
  moveStageAction,
  openRevisionAction,
  openSiteAction,
  setSiteStatusAction,
} from "@/app/(app)/projects/[id]/actions";
import { partyChoices, partyNames } from "@/modules/crm";
import { listPeople } from "@/modules/iam";
import {
  currentTargets,
  mayEditRevisions,
  mayMarkWalls,
  mayOpenProjects,
  projectCard,
  projectRevisions,
  TARGET_END_BASES,
  TARGET_END_BASIS_LABELS,
  targetChoices,
} from "@/modules/prj";
import { ProjectCard } from "@/modules/prj/ui/project-card";
import { ProjectTargets } from "@/modules/prj/ui/project-targets";
import { ProjectsDenied } from "@/modules/prj/ui/projects-denied";
import { RevisionList } from "@/modules/prj/ui/revision-list";
import { listSites } from "@/modules/sit";
import { ProjectSites } from "@/modules/sit/ui/project-sites";
import { isModuleEnabled } from "@/platform/features/features";
import { FeatureOff } from "@/platform/ui/feature-off";

export const metadata: Metadata = { title: "Proje detayı" };

const endDay = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "long",
  timeZone: "UTC",
  year: "numeric",
});

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * SCR-023 — the project card (TASK-0123 steps 1–2). PRJ may not read SIT (MODULE_MAP: SIT →
 * PRJ), so the page composes the card with its sites and hands the walls their site names.
 */
export default async function ProjectPage({ params }: PageProps<"/projects/[id]">) {
  if (!isModuleEnabled("PRJ")) return <FeatureOff />;
  if (!(await mayOpenProjects())) return <ProjectsDenied />;

  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const card = await projectCard(id);
  if (!card) notFound();

  const managesAnything = card.canManage || card.canManageSites;
  const [
    sites,
    people,
    clients,
    subcontractors,
    current,
    revisions,
    targetTypes,
    canEdit,
    canMark,
  ] = await Promise.all([
    listSites({ projectId: id }),
    listPeople(),
    card.canManage ? partyChoices("client") : Promise.resolve([]),
    card.canManageSites ? partyChoices("subcontractor") : Promise.resolve([]),
    currentTargets(id),
    projectRevisions(id),
    targetChoices(id),
    mayEditRevisions(id),
    mayMarkWalls(id),
  ]);
  const siteNames = Object.fromEntries(sites.map((one) => [one.id, one.name]));
  const clientName = card.project.clientPartyId
    ? ((await partyNames([card.project.clientPartyId])).get(card.project.clientPartyId) ?? null)
    : null;
  const peopleNames = Object.fromEntries(people.map((p) => [p.id, p.displayName]));
  const endOf = {
    contract: card.project.contractEndOn,
    management: card.project.managementTargetEndOn,
    theoretical: card.project.theoreticalEndOn,
  };
  const endChoices = TARGET_END_BASES.map((basis) => ({
    label: `${TARGET_END_BASIS_LABELS[basis]} (${endOf[basis] ? endDay.format(new Date(`${endOf[basis]}T00:00:00Z`)) : "girilmemiş"})`,
    value: basis,
  }));
  const choices = managesAnything
    ? people.filter((p) => p.active).map((p) => ({ label: p.displayName, value: p.id }))
    : [];

  return (
    <ProjectCard
      actions={{
        change: changeProjectAction.bind(null, id),
        changeContract: changeContractAction.bind(null, id),
        moveStage: moveStageAction.bind(null, id),
      }}
      canManage={card.canManage}
      canSeeContract={card.canSeeContract}
      clientName={clientName}
      clients={clients.map((c) => ({ label: c.name, value: c.id }))}
      contract={card.contract}
      coordinatorName={
        card.project.coordinatorUserId
          ? (peopleNames[card.project.coordinatorUserId] ?? null)
          : null
      }
      customFields={card.customFields}
      key={card.project.updatedAt.toISOString()}
      people={choices}
      peopleNames={peopleNames}
      project={card.project}
      stageChoices={card.stageChoices}
      stages={card.stages}
      revisions={
        <RevisionList
          canEdit={canEdit}
          open={openRevisionAction.bind(null, id)}
          projectId={id}
          revisions={revisions}
        />
      }
      targets={
        <ProjectTargets
          canMark={canMark}
          current={current}
          markWall={markWallAction.bind(null, id)}
          names={targetTypes.names}
          siteNames={siteNames}
        />
      }
      sites={
        <ProjectSites
          actions={{
            change: changeSiteAction.bind(null, id),
            open: openSiteAction.bind(null, id),
            setStatus: setSiteStatusAction.bind(null, id),
          }}
          canManage={card.canManageSites}
          endChoices={endChoices}
          people={choices}
          sites={sites}
          subcontractors={subcontractors.map((s) => ({ label: s.name, value: s.id }))}
        />
      }
    />
  );
}
