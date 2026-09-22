import type { Metadata } from "next";

import { TaskList } from "@/modules/tsk/ui/task-list";
import { isModuleEnabled } from "@/platform/features/features";
import { FeatureOff } from "@/platform/ui/feature-off";

export const metadata: Metadata = { title: "Görevler" };

// "Görevlerim" (§25.4). Empty until the task engine exists; sample tasks removed (D-106).
export default function TasksPage() {
  if (!isModuleEnabled("TSK")) return <FeatureOff />;

  return <TaskList />;
}
