import type { Metadata } from "next";

import { canSeeAllTasks, listTasks, type TaskView } from "@/modules/tsk";
import { TaskList } from "@/modules/tsk/ui/task-list";
import { isModuleEnabled } from "@/platform/features/features";
import { FeatureOff } from "@/platform/ui/feature-off";

export const metadata: Metadata = { title: "Görevler" };

function viewOf(value: string | string[] | undefined, canSeeAll: boolean): TaskView {
  if (value === "given") return "given";
  if (value === "all" && canSeeAll) return "all";
  return "mine";
}

// SCR-013 Görevler (TASK-0108). Read on every request: tasks change while the person looks.
export default async function TasksPage({ searchParams }: PageProps<"/tasks">) {
  if (!isModuleEnabled("TSK")) return <FeatureOff />;

  const params = await searchParams;
  const canSeeAll = await canSeeAllTasks();
  const view = viewOf(params.gorunum, canSeeAll);
  const showClosed = params.kapananlar === "1";
  const tasks = await listTasks(view, showClosed);

  return <TaskList canSeeAll={canSeeAll} showClosed={showClosed} tasks={tasks} view={view} />;
}
