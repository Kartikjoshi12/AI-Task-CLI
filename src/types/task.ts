export type TaskStatus = "todo" | "doing" | "done";

export interface Task {
  id: string;
  description: string;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
  tags: string;
  content: string;
}
