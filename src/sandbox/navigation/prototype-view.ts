/** Which screen the navigation prototype is showing (TASK-0031). */
export type PrototypeView =
  | { kind: "today" }
  | { kind: "approvals" }
  | { kind: "tasks" }
  | { kind: "site" }
  | { kind: "module"; groupId: string; label: string };
