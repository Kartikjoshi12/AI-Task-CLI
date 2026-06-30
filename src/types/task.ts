export type TaskStatus = "todo" | "doing" | "done";

export type TaskPriority = "none" | "low" | "medium" | "high" | "urgent";

export interface Task {
  id: string;
  title: string;
  content: string;
  status: TaskStatus;
  workspace: string;
  project: string;
  priority: TaskPriority;
  due: string;
  tags: string;
  assignee: string;
  parent: string;
  dependsOn: string;
  recurring: string;
  createdAt: string;
  updatedAt: string;
  completedAt: string;
}
