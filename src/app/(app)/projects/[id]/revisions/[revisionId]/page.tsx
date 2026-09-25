import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  addWallAction,
  changeWallAction,
  recallRevisionAction,
  removeTargetAction,
  removeWallAction,
  setTargetAction,
  submitRevisionAction,
} from "@/app/(app)/projects/[id]/revisions/[revisionId]/actions";
import {
  mayEditRevisions,
  mayOpenProjects,
  projectCard,
  revisionView,
  targetChoices,
} from "@/modules/prj";
import { ProjectsDenied } from "@/modules/prj/ui/projects-denied";
import { RevisionEditor } from "@/modules/prj/ui/revision-editor";
import { listSites } from "@/modules/sit";
import { isModuleEnabled } from "@/platform/features/features";
import { FeatureOff } from "@/platform/ui/feature-off";

export const metadata: Metadata = { title: "Proje revizyonu" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** SCR-024 — a project revision with its walls and targets (TASK-0123 step 2, REQ-PRJ-006…009). */
export default async function RevisionPage({
  params,
}: PageProps<"/projects/[id]/revisions/[revisionId]">) {
  if (!isModuleEnabled("PRJ")) return <FeatureOff />;
  if (!(await mayOpenProjects())) return <ProjectsDenied />;

  const { id, revisionId } = await params;
  if (!UUID.test(id) || !UUID.test(revisionId)) notFound();
  const [card, view] = await Promise.all([projectCard(id), revisionView(revisionId)]);
  if (!card || !view || view.revision.projectId !== id) notFound();

  const [sites, choices, canEdit] = await Promise.all([
    listSites({ projectId: id }),
    targetChoices(id),
    mayEditRevisions(id),
  ]);

  return (
    <RevisionEditor
      actions={{
        addWall: addWallAction.bind(null, id, revisionId),
        changeWall: changeWallAction.bind(null, id, revisionId),
        recall: recallRevisionAction.bind(null, id, revisionId),
        removeTarget: removeTargetAction.bind(null, id, revisionId),
        removeWall: removeWallAction.bind(null, id, revisionId),
        setTarget: setTargetAction.bind(null, id, revisionId),
        submit: submitRevisionAction.bind(null, id, revisionId),
      }}
      canEdit={canEdit}
      choices={choices}
      diff={view.diff}
      key={`${view.revision.status}-${view.targets.length}-${view.walls.length}`}
      names={choices.names}
      projectId={id}
      projectName={card.project.name}
      revision={view.revision}
      sites={sites
        .filter((one) => one.status === "active")
        .map((one) => ({ label: one.name, value: one.id }))}
      targets={view.targets}
      walls={view.walls}
    />
  );
}
