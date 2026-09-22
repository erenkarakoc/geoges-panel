import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getTaskWithHistory } from "@/modules/tsk";
import { TaskDetailView } from "@/modules/tsk/ui/task-detail";
import { isModuleEnabled } from "@/platform/features/features";
import { FeatureOff } from "@/platform/ui/feature-off";

export const metadata: Metadata = { title: "Görev" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// A task's own screen (TASK-0108): what, why here, the steps and the history. A task the person
// may not see does not exist for them.
export default async function TaskPage({ params }: PageProps<"/tasks/[taskId]">) {
  if (!isModuleEnabled("TSK")) return <FeatureOff />;

  const { taskId } = await params;
  if (!UUID.test(taskId)) notFound();
  const loaded = await getTaskWithHistory(taskId);
  if (!loaded) notFound();

  return <TaskDetailView history={loaded.history} task={loaded.task} viewerId={loaded.viewerId} />;
}
