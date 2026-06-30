export type TaskStatus = "todo" | "doing" | "done";

export interface Task {
  id: string;
  description: string;
  status: TaskStatus;
}
