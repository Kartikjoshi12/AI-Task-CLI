import type { TaskPriority } from "../types/task.js";

export interface ParseResult {
  title: string;
  assignee: string;
  due: string;
  priority: TaskPriority;
  tags: string;
  project: string;
  content: string;
  dependsOn: string;
  recurring: string;
}
