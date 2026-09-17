import type { Metadata } from "next";

import { TaskList } from "@/modules/tsk/ui/task-list";

export const metadata: Metadata = { title: "Görevler" };

// "Görevlerim" (§25.4); sample tasks until the task engine is built (D-070).
export default function TasksPage() {
  return <TaskList />;
}
