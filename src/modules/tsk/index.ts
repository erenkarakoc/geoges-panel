/**
 * TSK's public surface (MODULE_BOUNDARIES section 2, TASK-0108). Code outside the module imports
 * only from here, apart from the `ui/` screens that routes render. Server-only.
 */
export {
  approveTaskDone,
  assignablePeople,
  assignTask,
  canSeeAllTasks,
  getTask,
  getTaskWithHistory,
  listTasks,
  markTaskDone,
  reopen,
  TaskError,
} from "./application/tasks";
export type { TaskDetail, TaskHistoryEntry, TaskView } from "./data/tsk-store";
export {
  assignTaskSchema,
  notificationText,
  PRIORITY_LABELS,
  STATUS_LABELS,
  TASK_PRIORITIES,
  taskGroup,
  type NotificationType,
  type TaskGroup,
  type TaskPriority,
  type TaskStatus,
  type TaskSummary,
} from "./domain/tasks";
